import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { defects } from "./defects";
import { analyticsResults } from "./analytics-results";
import { moduleRiskScores } from "./module-risk-scores";
import { aiDocuments } from "./ai-documents";
import { aiQueries } from "./ai-queries";
import { reports } from "./reports";

export const datasets = pgTable("datasets", {
  datasetId: serial("dataset_id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.userId, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  uploadType: varchar("upload_type", { length: 50 }).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const datasetsRelations = relations(datasets, ({ one, many }) => ({
  user: one(users, {
    fields: [datasets.userId],
    references: [users.userId],
  }),
  defects: many(defects),
  analyticsResults: many(analyticsResults),
  moduleRiskScores: many(moduleRiskScores),
  aiDocuments: many(aiDocuments),
  aiQueries: many(aiQueries),
  reports: many(reports),
}));
