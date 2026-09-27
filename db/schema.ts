import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameNorm: text("name_norm").notNull(),
  tokenHash: text("token_hash").notNull(),
  statsResetAt: text("stats_reset_at"),
  termsAcceptedAt: text("terms_accepted_at"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("idx_profiles_name_norm").on(table.nameNorm),
  uniqueIndex("idx_profiles_token_hash").on(table.tokenHash),
]);

export const matches = sqliteTable("matches", {
  id: text("id").primaryKey(),
  player1Id: text("player1_id").notNull().references(() => profiles.id),
  player2Id: text("player2_id").notNull().references(() => profiles.id),
  difficulty: text("difficulty").notNull(),
  status: text("status").notNull(),
  phase: text("phase").notNull(),
  turnPlayerId: text("turn_player_id").references(() => profiles.id),
  questionIndex: integer("question_index").notNull().default(0),
  questionsJson: text("questions_json").notNull(),
  player1AnswersJson: text("player1_answers_json").notNull().default("[]"),
  player2AnswersJson: text("player2_answers_json").notNull().default("[]"),
  player1EraseUsed: integer("player1_erase_used").notNull().default(0),
  player2EraseUsed: integer("player2_erase_used").notNull().default(0),
  player1Score: integer("player1_score").notNull().default(0),
  player2Score: integer("player2_score").notNull().default(0),
  winnerId: text("winner_id").references(() => profiles.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("idx_matches_player1").on(table.player1Id, table.status),
  index("idx_matches_player2").on(table.player2Id, table.status),
  index("idx_matches_turn").on(table.turnPlayerId, table.status),
]);

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("idx_push_endpoint").on(table.endpoint),
  index("idx_push_profile").on(table.profileId),
]);

export const profileBlocks = sqliteTable("profile_blocks", {
  id: text("id").primaryKey(),
  blockerId: text("blocker_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  blockedId: text("blocked_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("idx_profile_blocks_pair").on(table.blockerId, table.blockedId),
  index("idx_profile_blocks_blocked").on(table.blockedId),
]);

export const profileReports = sqliteTable("profile_reports", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  reportedId: text("reported_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  matchId: text("match_id").references(() => matches.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("idx_profile_reports_reported").on(table.reportedId, table.createdAt),
  index("idx_profile_reports_reporter").on(table.reporterId, table.createdAt),
]);

export const apiRateLimits = sqliteTable("api_rate_limits", {
  bucketKey: text("bucket_key").primaryKey(),
  windowStart: integer("window_start").notNull(),
  requestCount: integer("request_count").notNull().default(1),
  expiresAt: integer("expires_at").notNull(),
}, (table) => [
  index("idx_api_rate_limits_expires_at").on(table.expiresAt),
]);
