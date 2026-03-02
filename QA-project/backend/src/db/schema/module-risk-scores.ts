import {
  pgTable,
  serial,
  integer,
  varchar,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { datasets } from "./datasets";

export const moduleRiskScores = pgTable("module_risk_scores", {
  riskId: serial("risk_id").primaryKey(),
  datasetId: integer("dataset_id")
    .notNull()
    .references(() => datasets.datasetId, { onDelete: "cascade" }),
  moduleName: varchar("module_name", { length: 255 }).notNull(),
  bugCount: integer("bug_count").default(0),
  reopenRate: real("reopen_rate"),
  riskScore: real("risk_score"),
  computedAt: timestamp("computed_at").defaultNow().notNull(),
});

export const moduleRiskScoresRelations = relations(moduleRiskScores, ({ one }) => ({
  dataset: one(datasets, {
    fields: [moduleRiskScores.datasetId],
    references: [datasets.datasetId],
  }),
}));
