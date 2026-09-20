import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameNorm: text("name_norm").notNull(),
  tokenHash: text("token_hash").notNull(),
  statsResetAt: text("stats_reset_at"),
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
