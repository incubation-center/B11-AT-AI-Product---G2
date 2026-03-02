import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { datasets } from "./datasets";
import { defectLifecycle } from "./defect-lifecycle";

export const defects = pgTable("defects", {
  defectId: serial("defect_id").primaryKey(),
  datasetId: integer("dataset_id")
    .notNull()
    .references(() => datasets.datasetId, { onDelete: "cascade" }),
  bugId: varchar("bug_id", { length: 100 }),
  title: varchar("title", { length: 500 }).notNull(),
  module: varchar("module", { length: 255 }),
  severity: varchar("severity", { length: 50 }),
  priority: varchar("priority", { length: 50 }),
  environment: varchar("environment", { length: 100 }),
  status: varchar("status", { length: 50 }),
  createdDate: timestamp("created_date"),
  resolvedDate: timestamp("resolved_date"),
  closedDate: timestamp("closed_date"),
});

export const defectsRelations = relations(defects, ({ one, many }) => ({
  dataset: one(datasets, {
    fields: [defects.datasetId],
    references: [datasets.datasetId],
  }),
  lifecycle: many(defectLifecycle),
}));
