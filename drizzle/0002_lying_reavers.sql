CREATE TABLE `profile_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`blocker_id` text NOT NULL,
	`blocked_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`blocker_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`blocked_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profile_blocks_pair` ON `profile_blocks` (`blocker_id`,`blocked_id`);--> statement-breakpoint
CREATE INDEX `idx_profile_blocks_blocked` ON `profile_blocks` (`blocked_id`);--> statement-breakpoint
CREATE TABLE `profile_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`reported_id` text NOT NULL,
	`match_id` text,
	`reason` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`reporter_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reported_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_profile_reports_reported` ON `profile_reports` (`reported_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_profile_reports_reporter` ON `profile_reports` (`reporter_id`,`created_at`);