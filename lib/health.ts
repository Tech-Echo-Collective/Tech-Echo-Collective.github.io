import { CANONICAL_FOUNDER_GITHUB_USER_ID } from './identity';

export const REQUIRED_MEMBER_NUMBER_TRIGGERS = [
  'members_member_number_immutable',
  'member_allocations_never_deleted',
  'members_never_deleted',
  'member_allocation_assignment_immutable',
  'members_github_identity_immutable',
  'members_reserved_identity_matches',
] as const;

export const REQUIRED_HEALTH_SCHEMA_OBJECTS = [
  ...REQUIRED_MEMBER_NUMBER_TRIGGERS,
  'pending_registrations',
  'idx_pending_registrations_expires_at',
] as const;

const triggerSqlRequirements: Record<
  (typeof REQUIRED_MEMBER_NUMBER_TRIGGERS)[number],
  string[]
> = {
  members_member_number_immutable: [
    'before update of member_number on members',
    "raise(abort, 'member_number is immutable')",
  ],
  member_allocations_never_deleted: [
    'before delete on member_number_allocations',
    "raise(abort, 'member numbers are never reused')",
  ],
  members_never_deleted: [
    'before delete on members',
    "raise(abort, 'members are retained to preserve member numbers')",
  ],
  member_allocation_assignment_immutable: [
    'before update of member_id on member_number_allocations',
    "raise(abort, 'member number assignment is immutable')",
  ],
  members_github_identity_immutable: [
    'before update of github_user_id on members',
    "raise(abort, 'github identity is immutable')",
  ],
  members_reserved_identity_matches: [
    'before insert on members',
    'reserved_github_user_id <> new.github_user_id',
    "raise(abort, 'reserved github identity does not match')",
  ],
};

export interface FounderHealthRow {
  reserved_github_user_id: string | null;
  member_id: string | null;
  github_user_id: string | null;
}

export interface SchemaHealthRow {
  name: string;
  type: string;
  sql: string | null;
}

function normalizedSql(sql: string | null): string {
  return (sql || '')
    .toLowerCase()
    .replaceAll('"', '')
    .replaceAll('`', '')
    .replaceAll('[', '')
    .replaceAll(']', '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function founderInvariantIsHealthy(
  row: FounderHealthRow | null,
  schemaRows: Iterable<SchemaHealthRow>,
  configuredGithubUserId: string,
): boolean {
  if (
    configuredGithubUserId !== CANONICAL_FOUNDER_GITHUB_USER_ID ||
    !row ||
    !row.member_id ||
    row.reserved_github_user_id !== CANONICAL_FOUNDER_GITHUB_USER_ID ||
    row.github_user_id !== CANONICAL_FOUNDER_GITHUB_USER_ID
  ) {
    return false;
  }
  const objects = new Map([...schemaRows].map((schemaRow) => [schemaRow.name, schemaRow]));
  if (objects.get('pending_registrations')?.type !== 'table') return false;
  const expiryIndex = objects.get('idx_pending_registrations_expires_at');
  if (
    expiryIndex?.type !== 'index' ||
    !/on pending_registrations\s*\(\s*expires_at\s*\)/.test(normalizedSql(expiryIndex.sql))
  ) {
    return false;
  }
  return REQUIRED_MEMBER_NUMBER_TRIGGERS.every((name) => {
    const trigger = objects.get(name);
    const sql = normalizedSql(trigger?.sql || null);
    return (
      trigger?.type === 'trigger' &&
      triggerSqlRequirements[name].every((fragment) => sql.includes(fragment))
    );
  });
}
