import {
  mysqlTable,
  serial,
  varchar,
  text,
  timestamp,
  int,
  json,
  bigint,
  index,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "analyst", "viewer"]).notNull().default("viewer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const analyticsEvents = mysqlTable("analytics_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 100 }),
  source: varchar("source", { length: 100 }).notNull(),
  metadata: json("metadata"),
  processed: int("processed").notNull().default(0),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("event_type_idx").on(table.eventType),
  index("session_id_idx").on(table.sessionId),
  index("created_at_idx").on(table.createdAt),
  index("processed_idx").on(table.processed),
]);

export const analyticsSummaries = mysqlTable("analytics_summaries", {
  id: serial("id").primaryKey(),
  summaryType: varchar("summary_type", { length: 50 }).notNull(),
  summaryKey: varchar("summary_key", { length: 100 }).notNull(),
  summaryValue: bigint("summary_value", { mode: "number" }).notNull().default(0),
  summaryData: json("summary_data"),
  dateBucket: varchar("date_bucket", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  index("summary_type_key_idx").on(table.summaryType, table.summaryKey),
  index("date_bucket_idx").on(table.dateBucket),
]);

export const eventProcessingQueue = mysqlTable("event_processing_queue", {
  id: serial("id").primaryKey(),
  eventId: varchar("event_id", { length: 36 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).notNull().default("pending"),
  retryCount: int("retry_count").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});
