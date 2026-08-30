CREATE TABLE `github_credentials` (
	`member_id` text PRIMARY KEY NOT NULL,
	`access_token_encrypted` text NOT NULL,
	`refresh_token_encrypted` text,
	`token_type` text DEFAULT 'bearer' NOT NULL,
	`expires_at` text,
	`refresh_token_expires_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `member_number_allocations` (
	`member_number` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` text,
	`reserved_github_user_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_member_allocations_member_id` ON `member_number_allocations` (`member_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_member_allocations_reserved_github_id` ON `member_number_allocations` (`reserved_github_user_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`member_number` integer NOT NULL,
	`github_user_id` text NOT NULL,
	`github_node_id` text NOT NULL,
	`github_username` text NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL CHECK (`role` IN ('founder','admin','moderator','member')),
	`preferred_locale` text DEFAULT 'en' NOT NULL CHECK (`preferred_locale` IN ('en','zh','fr','es')),
	`joined_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`onboarded_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`member_number`) REFERENCES `member_number_allocations`(`member_number`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_member_number_unique` ON `members` (`member_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_github_user_id_unique` ON `members` (`github_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_github_node_id_unique` ON `members` (`github_node_id`);--> statement-breakpoint
CREATE TABLE `oauth_states` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`verifier_encrypted` text NOT NULL,
	`intent` text NOT NULL CHECK (`intent` IN ('signin','join')),
	`locale` text NOT NULL CHECK (`locale` IN ('en','zh','fr','es')),
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_oauth_states_expires_at` ON `oauth_states` (`expires_at`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`bucket_key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`reset_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rate_limits_reset_at` ON `rate_limits` (`reset_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_member_id` ON `sessions` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);--> statement-breakpoint
INSERT OR IGNORE INTO `member_number_allocations`
  (`member_number`, `reserved_github_user_id`) VALUES (1, '267296498');--> statement-breakpoint
CREATE TRIGGER `members_member_number_immutable`
BEFORE UPDATE OF `member_number` ON `members`
WHEN OLD.`member_number` <> NEW.`member_number`
BEGIN
  SELECT RAISE(ABORT, 'member_number is immutable');
END;--> statement-breakpoint
CREATE TRIGGER `member_allocations_never_deleted`
BEFORE DELETE ON `member_number_allocations`
BEGIN
  SELECT RAISE(ABORT, 'member numbers are never reused');
END;--> statement-breakpoint
CREATE TRIGGER `members_never_deleted`
BEFORE DELETE ON `members`
BEGIN
  SELECT RAISE(ABORT, 'members are retained to preserve member numbers');
END;--> statement-breakpoint
CREATE TRIGGER `member_allocation_assignment_immutable`
BEFORE UPDATE OF `member_id` ON `member_number_allocations`
WHEN OLD.`member_id` IS NOT NULL AND OLD.`member_id` IS NOT NEW.`member_id`
BEGIN
  SELECT RAISE(ABORT, 'member number assignment is immutable');
END;
