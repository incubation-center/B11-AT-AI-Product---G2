import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { datasets } from "./datasets";

export const aiQueries = pgTable("ai_queries", {
  queryId: serial("query_id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  datasetId: integer("dataset_id")
    .notNull()
    .references(() => datasets.datasetId, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer"),
  sourceReference: varchar("source_reference", { length: 1000 }),
  askedAt: timestamp("asked_at").defaultNow().notNull(),
});

export const aiQueriesRelations = relations(aiQueries, ({ one }) => ({
  user: one(users, {
    fields: [aiQueries.userId],
    references: [users.userId],
  }),
  dataset: one(datasets, {
    fields: [aiQueries.datasetId],
    references: [datasets.datasetId],
  }),
}));
