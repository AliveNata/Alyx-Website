import 'dotenv/config'
import { pool } from '../src/db.js'
import { retrieveChunks } from '../src/retrieve.js'

// RAG measurement helper (P2-3 decision B + Opsi-4 measure-first). NOT part of
// the request path and NOT run in prod by the app. It embeds batches of
// questions, runs the same top-K search /api/chat uses, and reports per query:
// the best similarity, the top-1 section, the full top-K section spread, and
// whether top-1 is the personal_info/about blurb (the known dominance smell).
// Per category it prints min/avg/max best_sim and how often about dominates.
//
// Read it to decide three things from real data, not guesses:
//   1. RAG_MIN_SIM (not-sure boundary): the gap between on-topic and off-topic.
//   2. The head vs tail boundary: do HEAD questions retrieve well, or is the
//      curated canned answer better for them?
//   3. Whether personal_info/about over-dominates top-1 and needs excluding.
//
// Usage (needs DATABASE_URL set and portfolio_chunks populated via `npm run
// reindex`, pointed at the dev DB or the VPS DB in DATABASE_URL):
//   cd server && node scripts/rag-eval.js
// The first query loads the embedding model (~seconds, ~412MB RSS); the rest
// run fast. Edit the arrays below as the portfolio grows.

// HEAD = broad/topic questions the client canned answers already cover well.
const HEAD_EN = [
  'What are Alief skills?',
  'What projects has Alief worked on?',
  'Tell me about Alief experience',
  'What is Alief tech stack?',
  'What does Alief do?',
]
const HEAD_ID = [
  'Apa saja skill Alief?',
  'Proyek apa saja yang pernah dikerjakan Alief?',
  'Ceritakan pengalaman kerja Alief',
  'Apa tech stack Alief?',
  'Alief kerjanya apa?',
]

// TAIL = specific/long-tail questions where retrieval should beat a canned dump.
const TAIL_EN = [
  'Did Alief use Redis caching or cost optimization in the clinic project?',
  'What did Alief do at Fabelio specifically?',
  'Has Alief worked with Kafka or real-time streaming?',
  'Which project used data quality tests and partitioning?',
  'What certifications does Alief have?',
  'Does Alief know Airflow and dbt?',
]
const TAIL_ID = [
  'Apakah Alief pakai Redis caching atau optimasi biaya di proyek klinik?',
  'Apa yang Alief kerjakan di Fabelio secara spesifik?',
  'Apakah Alief pernah pakai Kafka atau streaming real-time?',
  'Proyek mana yang pakai data quality test dan partisi?',
  'Sertifikasi apa yang dimiliki Alief?',
  'Apakah Alief paham Airflow dan dbt?',
]

// OFF = out of scope; the not-sure boundary must sit above these.
const OFF_EN = [
  'What is Alief favorite color?',
  'How do I bake sourdough bread?',
  'What is the capital of France?',
]
const OFF_ID = [
  'Apa warna favorit Alief?',
  'Bagaimana cara membuat roti sourdough?',
  'Apa ibu kota Prancis?',
]

const TOP_K = Number.parseInt(process.env.RAG_TOP_K, 10) || 5

const sectionOf = (c) => (c.anchor || c.source_id || '?').replace(/^#/, '')
const isAbout = (c) => c.source_table === 'personal_info' || sectionOf(c) === 'about'

async function run(label, queries) {
  console.log(`\n=== ${label} ===`)
  const sims = []
  let aboutTop1 = 0
  for (const q of queries) {
    const chunks = await retrieveChunks(q, TOP_K)
    const best = chunks[0] || null
    const bestSim = best ? 1 - Number(best.distance) : 0
    sims.push(bestSim)
    if (best && isAbout(best)) aboutTop1 += 1
    // compact top-K spread: section:sim, nearest first
    const spread = chunks
      .map((c) => `${sectionOf(c)}:${(1 - Number(c.distance)).toFixed(3)}`)
      .join('  ')
    const flag = best && isAbout(best) ? ' [about-top1]' : ''
    console.log(`${bestSim.toFixed(4)}  ${q}${flag}`)
    console.log(`          topK: ${spread}`)
  }
  const min = Math.min(...sims)
  const max = Math.max(...sims)
  const avg = sims.reduce((a, b) => a + b, 0) / sims.length
  console.log(
    `  -- ${label}: best_sim min ${min.toFixed(4)} / avg ${avg.toFixed(4)} / max ${max.toFixed(4)} | about-top1 ${aboutTop1}/${queries.length}`,
  )
  return { label, min, max, avg, aboutTop1, n: queries.length }
}

try {
  const { rows } = await pool.query('SELECT count(*)::int AS n FROM portfolio_chunks')
  console.log(`portfolio_chunks rows: ${rows[0].n} | TOP_K=${TOP_K}`)
  if (rows[0].n === 0) {
    console.error('portfolio_chunks is empty. Run `npm run reindex` first.')
    process.exit(1)
  }
  const stats = []
  stats.push(await run('HEAD-EN', HEAD_EN))
  stats.push(await run('HEAD-ID', HEAD_ID))
  stats.push(await run('TAIL-EN', TAIL_EN))
  stats.push(await run('TAIL-ID', TAIL_ID))
  stats.push(await run('OFF-EN', OFF_EN))
  stats.push(await run('OFF-ID', OFF_ID))

  console.log('\n================ SUMMARY ================')
  console.log('category   min     avg     max     about-top1')
  for (const s of stats) {
    console.log(
      `${s.label.padEnd(10)} ${s.min.toFixed(3)}   ${s.avg.toFixed(3)}   ${s.max.toFixed(3)}   ${s.aboutTop1}/${s.n}`,
    )
  }
  const onMin = Math.min(
    ...stats.filter((s) => s.label.startsWith('HEAD') || s.label.startsWith('TAIL')).map((s) => s.min),
  )
  const offMax = Math.max(...stats.filter((s) => s.label.startsWith('OFF')).map((s) => s.max))
  console.log('\nNot-sure boundary: on-topic (HEAD+TAIL) min = ' + onMin.toFixed(4))
  console.log('                   off-topic (OFF) max     = ' + offMax.toFixed(4))
  console.log(
    '  -> pick RAG_MIN_SIM between them' +
      (onMin > offMax ? ` (clean gap ${(onMin - offMax).toFixed(4)})` : ' (NO clean gap - clusters overlap)'),
  )
  const aboutAll = stats
    .filter((s) => s.label.startsWith('HEAD') || s.label.startsWith('TAIL'))
    .reduce((a, s) => a + s.aboutTop1, 0)
  const nAll = stats
    .filter((s) => s.label.startsWith('HEAD') || s.label.startsWith('TAIL'))
    .reduce((a, s) => a + s.n, 0)
  console.log(`\nabout-dominance on on-topic: ${aboutAll}/${nAll} queries have about as top-1`)
  console.log('  -> if high, exclude personal_info/about from candidates unless the query is about bio.')
} catch (err) {
  console.error('rag-eval failed:', err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
