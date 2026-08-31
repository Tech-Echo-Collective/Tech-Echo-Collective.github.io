CREATE TABLE `oauth_return_targets` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`return_path` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_oauth_return_targets_expires_at` ON `oauth_return_targets` (`expires_at`);--> statement-breakpoint
CREATE TABLE `session_contexts` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`audience` text NOT NULL CHECK (`audience` IN ('account','forum')),
	`family_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`token_hash`) REFERENCES `sessions`(`token_hash`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_session_contexts_family` ON `session_contexts` (`family_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_session_contexts_family_audience` ON `session_contexts` (`family_id`,`audience`);--> statement-breakpoint
DELETE FROM `sessions`
WHERE `token_hash` NOT IN (SELECT `token_hash` FROM `session_contexts`);--> statement-breakpoint
CREATE TABLE `sso_handoffs` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`family_id` text NOT NULL,
	`source_session_hash` text NOT NULL,
	`target_audience` text NOT NULL CHECK (`target_audience` = 'forum'),
	`return_path` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_session_hash`) REFERENCES `sessions`(`token_hash`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sso_handoffs_expires_at` ON `sso_handoffs` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_sso_handoffs_family` ON `sso_handoffs` (`family_id`);
