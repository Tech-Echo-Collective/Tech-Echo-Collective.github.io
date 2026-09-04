import { getD1 } from '@/db';
import { getFounderGithubUserId } from '@/lib/config';
import { fromBase64Url, sha256, toBase64Url } from '@/lib/crypto';

export const BACKUP_FORMAT = 'tech-echo-durable-identity-snapshot';
export const BACKUP_FORMAT_VERSION = 1;
export const BACKUP_SCHEMA_VERSION = '0003_mushy_mantis';
export const BACKUP_MAX_ROWS_PER_TABLE = 10_000;
export const BACKUP_MAX_BYTES = 20 * 1024 * 1024;

type NullableText = string | null;

export interface MemberNumberAllocationBackupRow {
  member_number: number;
  member_id: NullableText;
  reserved_github_user_id: NullableText;
  created_at: string;
}

export interface MemberBackupRow {
  id: string;
  member_number: number;
  github_user_id: string;
  github_node_id: string;
  github_username: string;
  display_name: string;
  avatar_url: string;
  role: 'founder' | 'admin' | 'moderator' | 'member';
  preferred_locale: 'en' | 'zh' | 'fr' | 'es';
  joined_at: string;
  onboarded_at: NullableText;
  updated_at: string;
}

export interface GithubCredentialBackupRow {
  member_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: NullableText;
  token_type: string;
  expires_at: NullableText;
  refresh_token_expires_at: NullableText;
  updated_at: string;
}

export interface DurableBackupTables {
  member_number_allocations: MemberNumberAllocationBackupRow[];
  members: MemberBackupRow[];
  github_credentials: GithubCredentialBackupRow[];
}

export interface DurableBackupCounts {
  member_number_allocations: number;
  members: number;
  github_credentials: number;
}

export interface DurableIdentityBackup {
  format: typeof BACKUP_FORMAT;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  schemaVersion: typeof BACKUP_SCHEMA_VERSION;
  exportedAt: string;
  memberNumberHighWater: number;
  counts: DurableBackupCounts;
  dataSha256: string;
  tables: DurableBackupTables;
}

class BackupValidationError extends Error {}

function isEncryptedSecret(value: string): boolean {
  const [version, ivValue, ciphertextValue, extra] = value.split('.');
  if (
    version !== 'v1' ||
    !ivValue ||
    !ciphertextValue ||
    extra !== undefined ||
    !/^[A-Za-z0-9_-]+$/.test(ivValue) ||
    !/^[A-Za-z0-9_-]+$/.test(ciphertextValue)
  ) {
    return false;
  }
  try {
    const iv = fromBase64Url(ivValue);
    const ciphertext = fromBase64Url(ciphertextValue);
    return (
      iv.byteLength === 12 &&
      ciphertext.byteLength >= 17 &&
      toBase64Url(iv) === ivValue &&
      toBase64Url(ciphertext) === ciphertextValue
    );
  } catch {
    return false;
  }
}

function requireText(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !value || value.includes('\0')) {
    throw new BackupValidationError(`${label} is invalid.`);
  }
}

function requireNullableText(value: unknown, label: string): asserts value is NullableText {
  if (value !== null) requireText(value, label);
}

function requirePositiveInteger(value: unknown, label: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new BackupValidationError(`${label} is invalid.`);
  }
}

function requireUnique<T extends string | number>(values: T[], label: string) {
  if (new Set(values).size !== values.length) {
    throw new BackupValidationError(`${label} contains duplicates.`);
  }
}

export function validateDurableBackupData(
  tables: DurableBackupTables,
  memberNumberHighWater: number,
  founderGithubUserId = getFounderGithubUserId(),
): DurableBackupCounts {
  const {
    member_number_allocations: allocations,
    members,
    github_credentials: credentials,
  } = tables;
  for (const [name, rows] of Object.entries(tables)) {
    if (!Array.isArray(rows) || rows.length > BACKUP_MAX_ROWS_PER_TABLE) {
      throw new BackupValidationError(`${name} exceeds the backup row limit.`);
    }
  }

  for (const allocation of allocations) {
    requirePositiveInteger(allocation.member_number, 'Member Number');
    requireNullableText(allocation.member_id, 'Allocation member ID');
    requireNullableText(allocation.reserved_github_user_id, 'Reserved GitHub ID');
    if (
      allocation.reserved_github_user_id !== null &&
      !/^\d+$/.test(allocation.reserved_github_user_id)
    ) {
      throw new BackupValidationError('Reserved GitHub ID is invalid.');
    }
    requireText(allocation.created_at, 'Allocation timestamp');
  }
  requireUnique(
    allocations.map((allocation) => allocation.member_number),
    'Member Number ledger',
  );
  requireUnique(
    allocations
      .map((allocation) => allocation.member_id)
      .filter((value): value is string => value !== null),
    'Allocation member IDs',
  );
  requireUnique(
    allocations
      .map((allocation) => allocation.reserved_github_user_id)
      .filter((value): value is string => value !== null),
    'Reserved GitHub IDs',
  );

  const allowedRoles = new Set(['founder', 'admin', 'moderator', 'member']);
  const allowedLocales = new Set(['en', 'zh', 'fr', 'es']);
  for (const member of members) {
    requireText(member.id, 'Member ID');
    requirePositiveInteger(member.member_number, 'Member Number');
    requireText(member.github_user_id, 'GitHub user ID');
    if (!/^\d+$/.test(member.github_user_id)) {
      throw new BackupValidationError('GitHub user ID is invalid.');
    }
    requireText(member.github_node_id, 'GitHub node ID');
    requireText(member.github_username, 'GitHub username');
    requireText(member.display_name, 'Display name');
    requireText(member.avatar_url, 'Avatar URL');
    if (!allowedRoles.has(member.role)) {
      throw new BackupValidationError('Member role is invalid.');
    }
    if (!allowedLocales.has(member.preferred_locale)) {
      throw new BackupValidationError('Member locale is invalid.');
    }
    requireText(member.joined_at, 'Join timestamp');
    requireNullableText(member.onboarded_at, 'Onboarding timestamp');
    requireText(member.updated_at, 'Member update timestamp');
  }
  requireUnique(
    members.map((member) => member.id),
    'Member IDs',
  );
  requireUnique(
    members.map((member) => member.member_number),
    'Member Numbers',
  );
  requireUnique(
    members.map((member) => member.github_user_id),
    'GitHub user IDs',
  );
  requireUnique(
    members.map((member) => member.github_node_id),
    'GitHub node IDs',
  );

  const allocationByNumber = new Map(
    allocations.map((allocation) => [allocation.member_number, allocation]),
  );
  const memberById = new Map(members.map((member) => [member.id, member]));
  for (const member of members) {
    const allocation = allocationByNumber.get(member.member_number);
    if (!allocation || allocation.member_id !== member.id) {
      throw new BackupValidationError('Member Number allocation links are inconsistent.');
    }
  }
  for (const allocation of allocations) {
    if (!allocation.member_id) continue;
    const member = memberById.get(allocation.member_id);
    if (!member || member.member_number !== allocation.member_number) {
      throw new BackupValidationError('Member Number allocation links are inconsistent.');
    }
    if (
      allocation.member_number !== 1 &&
      allocation.reserved_github_user_id !== null &&
      allocation.reserved_github_user_id !== member.github_user_id
    ) {
      throw new BackupValidationError(
        'Reserved GitHub allocation binding is inconsistent.',
      );
    }
  }

  const founderAllocation = allocationByNumber.get(1);
  const founder = founderAllocation?.member_id
    ? memberById.get(founderAllocation.member_id)
    : undefined;
  if (
    founderAllocation?.reserved_github_user_id !== founderGithubUserId ||
    founder?.github_user_id !== founderGithubUserId ||
    founder.role !== 'founder' ||
    !founder.onboarded_at
  ) {
    throw new BackupValidationError('Founder Member #001 binding is invalid.');
  }

  for (const credential of credentials) {
    requireText(credential.member_id, 'Credential member ID');
    requireText(credential.access_token_encrypted, 'Encrypted access token');
    if (!isEncryptedSecret(credential.access_token_encrypted)) {
      throw new BackupValidationError('Encrypted access token format is invalid.');
    }
    requireNullableText(credential.refresh_token_encrypted, 'Encrypted refresh token');
    if (
      credential.refresh_token_encrypted !== null &&
      !isEncryptedSecret(credential.refresh_token_encrypted)
    ) {
      throw new BackupValidationError('Encrypted refresh token format is invalid.');
    }
    requireText(credential.token_type, 'Credential token type');
    requireNullableText(credential.expires_at, 'Credential expiry');
    requireNullableText(credential.refresh_token_expires_at, 'Refresh token expiry');
    requireText(credential.updated_at, 'Credential update timestamp');
    if (!memberById.has(credential.member_id)) {
      throw new BackupValidationError('Credential references an unknown member.');
    }
  }
  requireUnique(
    credentials.map((credential) => credential.member_id),
    'Credential member IDs',
  );

  requirePositiveInteger(memberNumberHighWater, 'Member Number high-water mark');
  const maximumMemberNumber = allocations.reduce(
    (maximum, allocation) => Math.max(maximum, allocation.member_number),
    0,
  );
  if (memberNumberHighWater < maximumMemberNumber) {
    throw new BackupValidationError('Member Number high-water mark is behind the ledger.');
  }

  return {
    member_number_allocations: allocations.length,
    members: members.length,
    github_credentials: credentials.length,
  };
}

function resultRows<T>(result: D1Result<unknown>): T[] {
  if (!result.success || !Array.isArray(result.results)) {
    throw new Error('D1 backup query failed.');
  }
  return result.results as T[];
}

export async function createDurableIdentityBackup(
  exportedAt = new Date(),
): Promise<DurableIdentityBackup> {
  const d1 = getD1();
  const rowLimit = BACKUP_MAX_ROWS_PER_TABLE + 1;
  const results = await d1.batch([
    d1.prepare(
      `SELECT member_number, member_id, reserved_github_user_id, created_at
       FROM member_number_allocations ORDER BY member_number LIMIT ${rowLimit}`,
    ),
    d1.prepare(
      `SELECT id, member_number, github_user_id, github_node_id, github_username,
              display_name, avatar_url, role, preferred_locale, joined_at,
              onboarded_at, updated_at
       FROM members ORDER BY member_number LIMIT ${rowLimit}`,
    ),
    d1.prepare(
      `SELECT member_id, access_token_encrypted, refresh_token_encrypted, token_type,
              expires_at, refresh_token_expires_at, updated_at
       FROM github_credentials ORDER BY member_id LIMIT ${rowLimit}`,
    ),
    d1.prepare(
      `SELECT seq FROM sqlite_sequence
       WHERE name = 'member_number_allocations' LIMIT 1`,
    ),
  ]);

  const tables: DurableBackupTables = {
    member_number_allocations: resultRows<MemberNumberAllocationBackupRow>(results[0]),
    members: resultRows<MemberBackupRow>(results[1]),
    github_credentials: resultRows<GithubCredentialBackupRow>(results[2]),
  };
  const sequenceRows = resultRows<{ seq: number }>(results[3]);
  const memberNumberHighWater = sequenceRows[0]?.seq;
  const counts = validateDurableBackupData(tables, memberNumberHighWater);

  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    memberNumberHighWater,
    counts,
    dataSha256: await sha256(JSON.stringify({ memberNumberHighWater, tables })),
    tables,
  };
}
