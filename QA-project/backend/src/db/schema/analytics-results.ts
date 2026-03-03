import {
  pgTable,
  serial,
  integer,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { datasets } from "./datasets";

export const analyticsResults = pgTable("analytics_results", {
  resultId: serial("result_id").primaryKey(),
  datasetId: integer("dataset_id")
    .notNull()
    .references(() => datasets.datasetId, { onDelete: "cascade" }),
  reopenRate: real("reopen_rate"),
  avgResolutionTime: real("avg_resolution_time"),
  defectLeakageRate: real("defect_leakage_rate"),
  computedAt: timestamp("computed_at").defaultNow().notNull(),
});

export const analyticsResultsRelations = relations(analyticsResults, ({ one }) => ({
  dataset: one(datasets, {
    fields: [analyticsResults.datasetId],
    references: [datasets.datasetId],
  }),
}));
