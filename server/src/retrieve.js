import { query } from './db.js'
import { embed } from './embed.js'

// Vector retrieval for portfolio-mode chat (P2-3). Embeds the user's question
// and returns the K nearest portfolio_chunks by cosine distance. The corpus is
// dozens of rows, so this is an exact scan (ORDER BY embedding <=> q); an ANN
// index would only add error at this size (see schema.sql).

// Default K when the caller does not pass one (chat.js resolves RAG_TOP_K).
export const DEFAULT_TOP_K = 5

// personal_info/about is a broad bio blurb that out-ranks the specific chunk
// for almost any query (rag-eval 24-Okt: 20/22 on-topic had about as top-1) and
// it inflates off-topic scores, so it both buries real citations and breaks the
// not-sure boundary. Bio questions are handled by the client's canned "about"
// answer, so RAG never needs this chunk; exclude it from the candidate set.
const EXCLUDED_SOURCE_TABLES = ['personal_info']

// Returns [{ source_table, source_id, anchor, content, distance }], nearest
// first. `distance` is pgvector cosine distance in [0, 2]; the caller derives
// similarity as 1 - distance. The embedding is bound as a parameter and cast
// ::vector in SQL (never string-concatenated into the query), so untrusted
// query text can never break out of the vector literal.
export async function retrieveChunks(queryText, topK = DEFAULT_TOP_K) {
  const vector = await embed(queryText, 'query')
  const literal = `[${vector.join(',')}]`
  const { rows } = await query(
    `SELECT source_table, source_id, anchor, content, (embedding <=> $1::vector) AS distance
       FROM portfolio_chunks
      WHERE source_table <> ALL($3::text[])
      ORDER BY embedding <=> $1::vector
      LIMIT $2`,
    [literal, topK, EXCLUDED_SOURCE_TABLES],
  )
  return rows
}
