import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { defects } from "./defects";

export const defectLifecycle = pgTable("defect_lifecycle", {
  lifecycleId: serial("lifecycle_id").primaryKey(),
  defectId: integer("defect_id")
    .notNull()
    .references(() => defects.defectId, { onDelete: "cascade" }),
  fromStatus: varchar("from_status", { length: 50 }),
  toStatus: varchar("to_status", { length: 50 }),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  reopenCount: integer("reopen_count").default(0),
  resolutionDays: integer("resolution_days"),
});

export const defectLifecycleRelations = relations(defectLifecycle, ({ one }) => ({
  defect: one(defects, {
    fields: [defectLifecycle.defectId],
    references: [defects.defectId],
  }),
}));
