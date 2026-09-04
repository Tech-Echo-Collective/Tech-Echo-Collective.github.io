import { createHash } from 'node:crypto';

export const BACKUP_FORMAT = 'tech-echo-durable-identity-snapshot';
export const BACKUP_FORMAT_VERSION = 1;
export const BACKUP_SCHEMA_VERSION = '0003_mushy_mantis';
export const BACKUP_MAX_ROWS_PER_TABLE = 10_000;
export const BACKUP_MAX_BYTES = 20 * 1024 * 1024;
export const CANONICAL_FOUNDER_GITHUB_USER_ID = '267296498';

const topLevelKeys = [
  'counts',
  'dataSha256',
  'exportedAt',
  'format',
  'formatVersion',
  'memberNumberHighWater',
  'schemaVersion',
  'tables',
];
const tableKeys = ['github_credentials', 'member_number_allocations', 'members'];
const countKeys = tableKeys;
const allocationKeys = [
  'created_at',
  'member_id',
  'member_number',
  'reserved_github_user_id',
];
const memberKeys = [
  'avatar_url',
  'display_name',
  'github_node_id',
  'github_user_id',
  'github_username',
  'id',
  'joined_at',
  'member_number',
  'onboarded_at',
  'preferred_locale',
  'role',
  'updated_at',
];
const credentialKeys = [
  'access_token_encrypted',
  'expires_at',
  'member_id',
  'refresh_token_encrypted',
  'refresh_token_expires_at',
  'token_type',
  'updated_at',
];

export class BackupFormatError extends Error {}

function fail(message) {
  throw new BackupFormatError(message);
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value, expected, label) {
  if (!isObject(value)) fail(`${label} is invalid.`);
  const actual = Object.keys(value).toSorted();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    fail(`${label} fields are invalid.`);
  }
}

function text(value, label) {
  if (typeof value !== 'string' || !value || value.includes('\0')) {
    fail(`${label} is invalid.`);
  }
}

function nullableText(value, label) {
  if (value !== null) text(value, label);
}

function positiveInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 1) fail(`${label} is invalid.`);
}

function unique(values, label) {
  if (new Set(values).size !== values.length) fail(`${label} contains duplicates.`);
}

function isEncryptedSecret(value) {
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
  const iv = Buffer.from(ivValue, 'base64url');
  const ciphertext = Buffer.from(ciphertextValue, 'base64url');
  return (
    iv.byteLength === 12 &&
    ciphertext.byteLength >= 17 &&
    iv.toString('base64url') === ivValue &&
    ciphertext.toString('base64url') === ciphertextValue
  );
}

function validateTables(tables, highWater) {
  exactKeys(tables, tableKeys, 'Backup tables');
  const allocations = tables.member_number_allocations;
  const members = tables.members;
  const credentials = tables.github_credentials;

  for (const [name, rows] of Object.entries(tables)) {
    if (!Array.isArray(rows) || rows.length > BACKUP_MAX_ROWS_PER_TABLE) {
      fail(`${name} exceeds the backup row limit.`);
    }
  }

  for (const allocation of allocations) {
    exactKeys(allocation, allocationKeys, 'Allocation row');
    positiveInteger(allocation.member_number, 'Member Number');
    nullableText(allocation.member_id, 'Allocation member ID');
    nullableText(allocation.reserved_github_user_id, 'Reserved GitHub ID');
    if (
      allocation.reserved_github_user_id !== null &&
      !/^\d+$/.test(allocation.reserved_github_user_id)
    ) {
      fail('Reserved GitHub ID is invalid.');
    }
    text(allocation.created_at, 'Allocation timestamp');
  }
  unique(
    allocations.map((allocation) => allocation.member_number),
    'Member Number ledger',
  );
  unique(
    allocations.map((allocation) => allocation.member_id).filter((value) => value !== null),
    'Allocation member IDs',
  );
  unique(
    allocations
      .map((allocation) => allocation.reserved_github_user_id)
      .filter((value) => value !== null),
    'Reserved GitHub IDs',
  );

  const roles = new Set(['founder', 'admin', 'moderator', 'member']);
  const locales = new Set(['en', 'zh', 'fr', 'es']);
  for (const member of members) {
    exactKeys(member, memberKeys, 'Member row');
    text(member.id, 'Member ID');
    positiveInteger(member.member_number, 'Member Number');
    text(member.github_user_id, 'GitHub user ID');
    if (!/^\d+$/.test(member.github_user_id)) fail('GitHub user ID is invalid.');
    text(member.github_node_id, 'GitHub node ID');
    text(member.github_username, 'GitHub username');
    text(member.display_name, 'Display name');
    text(member.avatar_url, 'Avatar URL');
    if (!roles.has(member.role)) fail('Member role is invalid.');
    if (!locales.has(member.preferred_locale)) fail('Member locale is invalid.');
    text(member.joined_at, 'Join timestamp');
    nullableText(member.onboarded_at, 'Onboarding timestamp');
    text(member.updated_at, 'Member update timestamp');
  }
  unique(
    members.map((member) => member.id),
    'Member IDs',
  );
  unique(
    members.map((member) => member.member_number),
    'Member Numbers',
  );
  unique(
    members.map((member) => member.github_user_id),
    'GitHub user IDs',
  );
  unique(
    members.map((member) => member.github_node_id),
    'GitHub node IDs',
  );

  const allocationByNumber = new Map(
    allocations.map((allocation) => [allocation.member_number, allocation]),
  );
  const memberById = new Map(members.map((member) => [member.id, member]));
  for (const member of members) {
    if (allocationByNumber.get(member.member_number)?.member_id !== member.id) {
      fail('Member Number allocation links are inconsistent.');
    }
  }
  for (const allocation of allocations) {
    if (!allocation.member_id) continue;
    const member = memberById.get(allocation.member_id);
    if (!member || member.member_number !== allocation.member_number) {
      fail('Member Number allocation links are inconsistent.');
    }
    if (
      allocation.member_number !== 1 &&
      allocation.reserved_github_user_id !== null &&
      allocation.reserved_github_user_id !== member.github_user_id
    ) {
      fail('Reserved GitHub allocation binding is inconsistent.');
    }
  }

  const founderAllocation = allocationByNumber.get(1);
  const founder = founderAllocation?.member_id
    ? memberById.get(founderAllocation.member_id)
    : undefined;
  if (
    founderAllocation?.reserved_github_user_id !== CANONICAL_FOUNDER_GITHUB_USER_ID ||
    founder?.github_user_id !== CANONICAL_FOUNDER_GITHUB_USER_ID ||
    founder.role !== 'founder' ||
    !founder.onboarded_at
  ) {
    fail('Founder Member #001 binding is invalid.');
  }

  for (const credential of credentials) {
    exactKeys(credential, credentialKeys, 'Credential row');
    text(credential.member_id, 'Credential member ID');
    text(credential.access_token_encrypted, 'Encrypted access token');
    if (!isEncryptedSecret(credential.access_token_encrypted)) {
      fail('Encrypted access token format is invalid.');
    }
    nullableText(credential.refresh_token_encrypted, 'Encrypted refresh token');
    if (
      credential.refresh_token_encrypted !== null &&
      !isEncryptedSecret(credential.refresh_token_encrypted)
    ) {
      fail('Encrypted refresh token format is invalid.');
    }
    text(credential.token_type, 'Credential token type');
    nullableText(credential.expires_at, 'Credential expiry');
    nullableText(credential.refresh_token_expires_at, 'Refresh token expiry');
    text(credential.updated_at, 'Credential update timestamp');
    if (!memberById.has(credential.member_id)) {
      fail('Credential references an unknown member.');
    }
  }
  unique(
    credentials.map((credential) => credential.member_id),
    'Credential member IDs',
  );

  positiveInteger(highWater, 'Member Number high-water mark');
  const maximum = allocations.reduce(
    (current, allocation) => Math.max(current, allocation.member_number),
    0,
  );
  if (highWater < maximum) fail('Member Number high-water mark is behind the ledger.');

  return {
    member_number_allocations: allocations.length,
    members: members.length,
    github_credentials: credentials.length,
  };
}

export function parseAndVerifyBackupJson(source, options = {}) {
  if (Buffer.byteLength(source, 'utf8') > BACKUP_MAX_BYTES) {
    fail('Backup exceeds the maximum size.');
  }
  let backup;
  try {
    backup = JSON.parse(source);
  } catch {
    fail('Backup is not valid JSON.');
  }
  exactKeys(backup, topLevelKeys, 'Backup');
  if (backup.format !== BACKUP_FORMAT || backup.formatVersion !== BACKUP_FORMAT_VERSION) {
    fail('Backup format is unsupported.');
  }
  if (backup.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    fail('Backup schema version is unsupported.');
  }
  text(backup.exportedAt, 'Backup timestamp');
  const exportedAt = Date.parse(backup.exportedAt);
  if (
    !Number.isFinite(exportedAt) ||
    new Date(exportedAt).toISOString() !== backup.exportedAt
  ) {
    fail('Backup timestamp is invalid.');
  }
  if (options.maxAgeSeconds !== undefined) {
    positiveInteger(options.maxAgeSeconds, 'Maximum backup age');
    const age = Date.now() - exportedAt;
    if (age < -5 * 60 * 1000 || age > options.maxAgeSeconds * 1000) {
      fail('Backup timestamp is outside the accepted window.');
    }
  }

  const expectedCounts = validateTables(backup.tables, backup.memberNumberHighWater);
  exactKeys(backup.counts, countKeys, 'Backup counts');
  for (const key of countKeys) {
    if (backup.counts[key] !== expectedCounts[key]) fail('Backup counts do not match.');
  }
  if (
    typeof backup.dataSha256 !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(backup.dataSha256)
  ) {
    fail('Backup checksum is invalid.');
  }
  const checksum = createHash('sha256')
    .update(
      JSON.stringify({
        memberNumberHighWater: backup.memberNumberHighWater,
        tables: backup.tables,
      }),
    )
    .digest('base64url');
  if (checksum !== backup.dataSha256) fail('Backup checksum does not match.');
  return backup;
}

export function summaryForBackup(backup) {
  return {
    members: backup.counts.members,
    allocations: backup.counts.member_number_allocations,
    credentials: backup.counts.github_credentials,
  };
}
