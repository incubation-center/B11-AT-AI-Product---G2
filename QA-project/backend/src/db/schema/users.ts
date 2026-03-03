import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { datasets } from "./datasets";
import { aiQueries } from "./ai-queries";
import { reports } from "./reports";
import { logs } from "./logs";

export const users = pgTable("users", {
  userId: serial("user_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  datasets: many(datasets),
  aiQueries: many(aiQueries),
  reports: many(reports),
  logs: many(logs),
}));
