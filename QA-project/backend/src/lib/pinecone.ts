import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

dotenv.config();

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Use the index name you created in Pinecone dashboard
// e.g. "qa-ai-documents" with dimension matching your embedding model
const INDEX_NAME = "qa-ai-documents";

export const pineconeIndex = pinecone.index(INDEX_NAME);

// ─── Helper: upsert chunks into Pinecone ────────────────────────────
export async function upsertChunks(
  vectors: {
    id: string; // e.g. `doc_${docId}`
    values: number[]; // embedding vector
    metadata: {
      dataset_id: number;
      chunk_text: string;
      chunk_index: number;
      doc_id: number;
    };
  }[]
) {
  await pineconeIndex.upsert(vectors);
}

// ─── Helper: query similar chunks ───────────────────────────────────
export async function querySimilarChunks(
  embedding: number[],
  datasetId: number,
  topK = 5
) {
  const results = await pineconeIndex.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: { dataset_id: { $eq: datasetId } },
  });

  return results.matches ?? [];
}

// ─── Helper: delete all vectors for a dataset ───────────────────────
export async function deleteDatasetVectors(datasetId: number) {
  await pineconeIndex.deleteMany({
    filter: { dataset_id: { $eq: datasetId } },
  });
}

export { pinecone };
