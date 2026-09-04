CREATE TABLE `pending_registrations` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`github_user_id` text NOT NULL,
	`payload_encrypted` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pending_registrations_github_user_id_unique` ON `pending_registrations` (`github_user_id`);--> statement-breakpoint
CREATE INDEX `idx_pending_registrations_expires_at` ON `pending_registrations` (`expires_at`);--> statement-breakpoint
CREATE TRIGGER `members_github_identity_immutable`
BEFORE UPDATE OF `github_user_id` ON `members`
WHEN OLD.`github_user_id` <> NEW.`github_user_id`
BEGIN
  SELECT RAISE(ABORT, 'github identity is immutable');
END;--> statement-breakpoint
CREATE TRIGGER `members_reserved_identity_matches`
BEFORE INSERT ON `members`
WHEN EXISTS (
  SELECT 1 FROM `member_number_allocations` a
  WHERE a.`member_number` = NEW.`member_number`
    AND a.`reserved_github_user_id` IS NOT NULL
    AND a.`reserved_github_user_id` <> NEW.`github_user_id`
)
BEGIN
  SELECT RAISE(ABORT, 'reserved github identity does not match');
END;
