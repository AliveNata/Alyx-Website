import { pipeline } from '@huggingface/transformers'

// multilingual-e5-small, q8 weights. A portfolio query can arrive in id/ja/zh
// while the content is English-ish, so the embedder has to be multilingual.
// Resident cost measured on the VPS re-spike: ~412 MB RSS once the pipeline is
// loaded, which the box tolerates (~5.5 GB free after). The load is lazy so the
// API still boots fast; only the first embed call pays the one-time load.
const MODEL = 'Xenova/multilingual-e5-small'
const DIM = 384

// e5 was trained with asymmetric prefixes: search queries and stored passages
// get different tags, and skipping them measurably hurts retrieval quality.
const PREFIX = { query: 'query: ', passage: 'passage: ' }

// Cache the load promise, not the resolved pipeline, so concurrent first calls
// share one download/init instead of racing to load the model twice.
let pipelinePromise = null

function getExtractor() {
  if (!pipelinePromise) {
    pipelinePromise = pipeline('feature-extraction', MODEL, { dtype: 'q8' })
  }
  return pipelinePromise
}

// Embed one string. `kind` picks the e5 prefix: 'query' for a user's question,
// 'passage' for a stored portfolio record. Returns a length-384 number[].
export async function embed(text, kind) {
  const prefix = PREFIX[kind]
  if (!prefix) throw new Error(`embed: kind must be 'query' or 'passage', got ${kind}`)

  const extractor = await getExtractor()
  const output = await extractor(prefix + String(text), { pooling: 'mean', normalize: true })
  const vector = Array.from(output.data)
  if (vector.length !== DIM) {
    throw new Error(`embed: expected ${DIM} dims, got ${vector.length}`)
  }
  return vector
}

export { DIM as EMBED_DIM }
