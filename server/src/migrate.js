import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8')

const run = async () => {
  await pool.query(sql)
  console.log('Migration complete - tables ready.')
  await pool.end()
}

run().catch((e) => { console.error('Migration failed:', e.message); process.exit(1) })
