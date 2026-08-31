CREATE TABLE `github_contributor_cache` (
	`repository_key` text PRIMARY KEY NOT NULL,
	`payload_json` text NOT NULL,
	`fetched_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`next_retry_at` text
);
