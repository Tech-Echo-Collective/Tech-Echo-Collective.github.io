import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const memberNumberAllocations = sqliteTable(
  'member_number_allocations',
  {
    memberNumber: integer('member_number').primaryKey({ autoIncrement: true }),
    memberId: text('member_id'),
    reservedGithubUserId: text('reserved_github_user_id'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex('idx_member_allocations_member_id').on(table.memberId),
    uniqueIndex('idx_member_allocations_reserved_github_id').on(table.reservedGithubUserId),
  ],
);

export const members = sqliteTable('members', {
  id: text('id').primaryKey(),
  memberNumber: integer('member_number')
    .notNull()
    .unique()
    .references(() => memberNumberAllocations.memberNumber, { onDelete: 'restrict' }),
  githubUserId: text('github_user_id').notNull().unique(),
  githubNodeId: text('github_node_id').notNull().unique(),
  githubUsername: text('github_username').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  role: text('role', { enum: ['founder', 'admin', 'moderator', 'member'] })
    .notNull()
    .default('member'),
  preferredLocale: text('preferred_locale', { enum: ['en', 'zh', 'fr', 'es'] })
    .notNull()
    .default('en'),
  joinedAt: text('joined_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  onboardedAt: text('onboarded_at'),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const githubCredentials = sqliteTable('github_credentials', {
  memberId: text('member_id')
    .primaryKey()
    .references(() => members.id, { onDelete: 'cascade' }),
  accessTokenEncrypted: text('access_token_encrypted').notNull(),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  tokenType: text('token_type').notNull().default('bearer'),
  expiresAt: text('expires_at'),
  refreshTokenExpiresAt: text('refresh_token_expires_at'),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_sessions_member_id').on(table.memberId),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ],
);

export const sessionContexts = sqliteTable(
  'session_contexts',
  {
    tokenHash: text('token_hash')
      .primaryKey()
      .references(() => sessions.tokenHash, { onDelete: 'cascade' }),
    audience: text('audience', { enum: ['account', 'forum'] }).notNull(),
    familyId: text('family_id').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_session_contexts_family').on(table.familyId),
    uniqueIndex('idx_session_contexts_family_audience').on(table.familyId, table.audience),
  ],
);

export const ssoHandoffs = sqliteTable(
  'sso_handoffs',
  {
    tokenHash: text('token_hash').primaryKey(),
    memberId: text('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    familyId: text('family_id').notNull(),
    sourceSessionHash: text('source_session_hash')
      .notNull()
      .references(() => sessions.tokenHash, { onDelete: 'cascade' }),
    targetAudience: text('target_audience', { enum: ['forum'] }).notNull(),
    returnPath: text('return_path').notNull(),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_sso_handoffs_expires_at').on(table.expiresAt),
    uniqueIndex('idx_sso_handoffs_family').on(table.familyId),
  ],
);

export const oauthStates = sqliteTable(
  'oauth_states',
  {
    stateHash: text('state_hash').primaryKey(),
    verifierEncrypted: text('verifier_encrypted').notNull(),
    intent: text('intent', { enum: ['signin', 'join'] }).notNull(),
    locale: text('locale', { enum: ['en', 'zh', 'fr', 'es'] }).notNull(),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('idx_oauth_states_expires_at').on(table.expiresAt)],
);

export const oauthReturnTargets = sqliteTable(
  'oauth_return_targets',
  {
    stateHash: text('state_hash').primaryKey(),
    returnPath: text('return_path').notNull(),
    expiresAt: text('expires_at').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('idx_oauth_return_targets_expires_at').on(table.expiresAt)],
);

export const rateLimits = sqliteTable(
  'rate_limits',
  {
    bucketKey: text('bucket_key').primaryKey(),
    count: integer('count').notNull(),
    resetAt: integer('reset_at').notNull(),
  },
  (table) => [index('idx_rate_limits_reset_at').on(table.resetAt)],
);

export const githubContributorCache = sqliteTable('github_contributor_cache', {
  repositoryKey: text('repository_key').primaryKey(),
  payloadJson: text('payload_json').notNull(),
  fetchedAt: text('fetched_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  nextRetryAt: text('next_retry_at'),
});
