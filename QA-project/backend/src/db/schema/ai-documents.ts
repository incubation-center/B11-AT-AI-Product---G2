import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { datasets } from "./datasets";

// Lightweight reference table in Supabase.
// Actual embedding vectors are stored in Pinecone.
// `pineconeVectorId` links this row to the Pinecone record.
export const aiDocuments = pgTable("ai_documents", {
  docId: serial("doc_id").primaryKey(),
  datasetId: integer("dataset_id")
    .notNull()
    .references(() => datasets.datasetId, { onDelete: "cascade" }),
  chunkText: text("chunk_text").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  pineconeVectorId: varchar("pinecone_vector_id", { length: 255 }),
});

export const aiDocumentsRelations = relations(aiDocuments, ({ one }) => ({
  dataset: one(datasets, {
    fields: [aiDocuments.datasetId],
    references: [datasets.datasetId],
  }),
}));
