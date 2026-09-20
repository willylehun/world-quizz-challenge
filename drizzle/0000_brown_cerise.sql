CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`player1_id` text NOT NULL,
	`player2_id` text NOT NULL,
	`difficulty` text NOT NULL,
	`status` text NOT NULL,
	`phase` text NOT NULL,
	`turn_player_id` text,
	`question_index` integer DEFAULT 0 NOT NULL,
	`questions_json` text NOT NULL,
	`player1_answers_json` text DEFAULT '[]' NOT NULL,
	`player2_answers_json` text DEFAULT '[]' NOT NULL,
	`player1_erase_used` integer DEFAULT 0 NOT NULL,
	`player2_erase_used` integer DEFAULT 0 NOT NULL,
	`player1_score` integer DEFAULT 0 NOT NULL,
	`player2_score` integer DEFAULT 0 NOT NULL,
	`winner_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`player1_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player2_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`turn_player_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winner_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_matches_player1` ON `matches` (`player1_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_matches_player2` ON `matches` (`player2_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_matches_turn` ON `matches` (`turn_player_id`,`status`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_norm` text NOT NULL,
	`token_hash` text NOT NULL,
	`stats_reset_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_name_norm` ON `profiles` (`name_norm`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_profiles_token_hash` ON `profiles` (`token_hash`);--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_push_endpoint` ON `push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `idx_push_profile` ON `push_subscriptions` (`profile_id`);