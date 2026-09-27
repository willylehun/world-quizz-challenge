CREATE TABLE `profile_friends` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`friend_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`friend_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profile_friends_pair` ON `profile_friends` (`owner_id`,`friend_id`);--> statement-breakpoint
CREATE INDEX `idx_profile_friends_friend` ON `profile_friends` (`friend_id`);--> statement-breakpoint
CREATE TABLE `random_match_queue` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`difficulty` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_random_match_queue_difficulty_created` ON `random_match_queue` (`difficulty`,`created_at`);