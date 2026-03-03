import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const logs = pgTable("logs", {
  logId: serial("log_id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  action: varchar("action", { length: 500 }).notNull(),
  loggedAt: timestamp("logged_at").defaultNow().notNull(),
});

export const logsRelations = relations(logs, ({ one }) => ({
  user: one(users, {
    fields: [logs.userId],
    references: [users.userId],
  }),
}));
