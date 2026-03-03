import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { datasets } from "./datasets";

export const reports = pgTable("reports", {
  reportId: serial("report_id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  datasetId: integer("dataset_id")
    .notNull()
    .references(() => datasets.datasetId, { onDelete: "cascade" }),
  reportType: varchar("report_type", { length: 100 }).notNull(),
  filePath: varchar("file_path", { length: 500 }),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.userId],
  }),
  dataset: one(datasets, {
    fields: [reports.datasetId],
    references: [datasets.datasetId],
  }),
}));
