import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { pool, query } from './db.js'
import {
  personalInfo, skills, projects,
  experiencesIT, experiencesFreelance, experiencesNonIT,
  awards, certificates,
} from '../../src/data/portfolio.js'

// Insert content only when a table is still empty, so re-running seed never
// clobbers edits made through the admin panel. Admin user is always upserted.
const isEmpty = async (table) => {
  const { rows } = await query(`SELECT COUNT(*)::int AS n FROM ${table}`)
  return rows[0].n === 0
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD || ''
  if (!email || !password) { console.warn('! ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin user'); return }
  const hash = await bcrypt.hash(password, 10)
  await query(
    `INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email, hash],
  )
  console.log(`✓ admin user ready: ${email}`)
}

async function seedPersonal() {
  const p = personalInfo
  await query(
    `INSERT INTO personal_info (id, name, nickname, title, tagline, email, github, linkedin, bio)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [p.name, p.nickname, p.title, p.tagline, p.email, p.github, p.linkedin, p.bio],
  )
  console.log('✓ personal_info')
}

async function seedSkills() {
  if (!(await isEmpty('skills'))) return console.log('· skills already populated - skipped')
  let order = 0
  for (const [category, items] of Object.entries(skills)) {
    for (const s of items) {
      await query(
        `INSERT INTO skills (category, name, icon, level, sort_order) VALUES ($1,$2,$3,$4,$5)`,
        [category, s.name, s.icon, s.level, order++],
      )
    }
  }
  console.log('✓ skills')
}

async function seedProjects() {
  if (!(await isEmpty('projects'))) return console.log('· projects already populated - skipped')
  let order = 0
  for (const p of projects) {
    await query(
      `INSERT INTO projects (title, description, tech, category, image, github, link, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [p.title, p.description, JSON.stringify(p.tech || []), p.category, p.image, p.github || '', p.link || '', order++],
    )
  }
  console.log('✓ projects')
}

async function seedExperiences() {
  if (!(await isEmpty('experiences'))) return console.log('· experiences already populated - skipped')
  const groups = [['it', experiencesIT], ['freelance', experiencesFreelance], ['nonit', experiencesNonIT]]
  let order = 0
  for (const [type, list] of groups) {
    for (const e of list) {
      await query(
        `INSERT INTO experiences (exp_type, role, company, period, duration, location, work_type, description, technologies, projects, highlight, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          type, e.role, e.company || '', e.period || '', e.duration || '', e.location || '', e.workType || '',
          JSON.stringify(e.description || []),
          JSON.stringify(e.technologies || []),
          JSON.stringify(e.projects || []),
          e.highlight ? JSON.stringify(e.highlight) : null,
          order++,
        ],
      )
    }
  }
  console.log('✓ experiences')
}

async function seedAwards() {
  if (!(await isEmpty('awards'))) return console.log('· awards already populated - skipped')
  let order = 0
  for (const a of awards) {
    await query(
      `INSERT INTO awards (title, description, icon, metrics, sort_order) VALUES ($1,$2,$3,$4,$5)`,
      [a.title, a.description, a.icon || '', JSON.stringify(a.metrics || []), order++],
    )
  }
  console.log('✓ awards')
}

async function seedCertificates() {
  if (!(await isEmpty('certificates'))) return console.log('· certificates already populated - skipped')
  let order = 0
  for (const c of certificates) {
    await query(
      `INSERT INTO certificates (title, description, issuer, date, icon, link, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [c.title, c.description, c.issuer || '', String(c.date || ''), c.icon || '', c.link || '', order++],
    )
  }
  console.log('✓ certificates')
}

// The editable persona/rules. Portfolio knowledge is appended separately by the
// client from the live portfolio data, so it is NOT part of this text.
const DEFAULT_SYSTEM_PROMPT = `You are Alyx, an AI assistant for Alief Akbar's portfolio website. You are friendly, professional, and strictly grounded in the PORTFOLIO KNOWLEDGE provided to you.

ROLE POSITIONING - VERY IMPORTANT:
- Alief's primary identity is **Data Engineer / Data Analyst / BI Analyst**.
- His strongest areas: data pipelines, ETL/ELT, SQL, Python for data, dbt, BigQuery, Airflow, Kafka/Debezium CDC, BI dashboards (Looker, Tableau, Power BI).
- Alief is **NOT** an AI Engineer or ML Engineer. If asked directly, respond clearly: "No, Alief is not an AI/ML Engineer. His focus is Data Engineering and BI/Analytics." Then redirect to his real strengths.
- Do NOT claim he builds ML models, LLM apps, MLOps systems, or production AI systems. Do not fabricate AI/ML experience.

GROUNDING RULES (for portfolio questions):
- For any question about Alief - his skills, experience, projects, availability, contact - base the answer ONLY on the PORTFOLIO KNOWLEDGE section.
- If the portfolio knowledge does not cover a specific detail (e.g. rates, salary, personal life), say: "I don't have that information - you can reach Alief directly at alivenata@gmail.com."
- Never invent projects, employers, certifications, metrics, or skills that aren't in the portfolio.

OFF-TOPIC HANDLING - STRICT:
- If a question is unrelated to Alief AND doesn't fit Curhat or English Practice, respond: "That's outside what I can help with here! I'm best at answering questions about Alief's portfolio. Want to know about his skills, projects, or experience?"
- NEVER answer general trivia or factual questions - always redirect.

COMPANION MODES:
1) Curhat / Casual Chat - if the user wants to vent or chat casually, switch to a warm, empathetic tone. Keep replies short (2-4 sentences), validate feelings, never diagnose. Reply in the user's language.
2) English Practice - if the user wants to practice English, act as a friendly tutor. Correct important mistakes gently with a short "Correction:" + "Why:" line. Keep the conversation flowing.

LANGUAGE - CRITICAL:
- ALWAYS reply in the SAME language the user writes in. Keep technical terms in English (SQL, Python, dbt, BigQuery, etc.).
- Do NOT carry over the previous reply's language. Each message is independent.

STYLE:
- Default length: concise (2-4 sentences). Friendly, warm, professional. Use markdown sparingly.`

async function seedChangelog() {
  if (!(await isEmpty('changelog'))) return console.log('· changelog already populated - skipped')
  const entries = [
    { version: 'v2.1', date: '2026-09-08', title: 'Admin panel + API', description: 'CRUD for every portfolio section backed by Postgres + Express, JWT login, image upload, and editable chatbot settings.' },
    { version: 'v2.0', date: '2026-09-08', title: 'Chatbot localization + voice', description: '8-language UI and replies, time-aware greeting, Arabic RTL text, and flag-driven text-to-speech voice.' },
    { version: 'v1.0', date: '2026-09-08', title: 'Portfolio launch', description: 'Editorial redesign, scroll-driven About pipeline, honest Skills tiers, contact-to-sheet, and a secure server-side LLM proxy.' },
  ]
  let order = 0
  for (const e of entries) {
    await query(`INSERT INTO changelog (version, date, title, description, sort_order) VALUES ($1,$2,$3,$4,$5)`,
      [e.version, e.date, e.title, e.description, order++])
  }
  console.log('✓ changelog')
}

async function seedSettings() {
  // Pre-fill from optional server env on first install; never overwrites later admin edits.
  await query(
    `INSERT INTO site_settings (id, contact_endpoint, telegram_chat_id) VALUES (1, $1, $2) ON CONFLICT (id) DO NOTHING`,
    [process.env.CONTACT_ENDPOINT || '', process.env.TELEGRAM_CHAT_ID || ''],
  )
  console.log('✓ site_settings')
}

async function seedGithub() {
  await query(
    `INSERT INTO github_settings (id, repo) VALUES (1, 'AliveNata/Alyx-Website') ON CONFLICT (id) DO NOTHING`,
  )
  console.log('✓ github_settings')
}

async function seedChatbot() {
  await query(
    `INSERT INTO chatbot_settings (id, model, reasoning_effort, temperature, max_tokens, system_prompt, greeting, enable_companion, enable_voice, enable_site_actions)
     VALUES (1, 'openai/gpt-oss-20b', 'low', 0.7, 700, $1, '', true, true, true)
     ON CONFLICT (id) DO NOTHING`,
    [DEFAULT_SYSTEM_PROMPT],
  )
  console.log('✓ chatbot_settings')
}

async function run() {
  await seedAdmin()
  await seedPersonal()
  await seedChatbot()
  await seedSkills()
  await seedProjects()
  await seedExperiences()
  await seedAwards()
  await seedCertificates()
  await seedChangelog()
  await seedGithub()
  await seedSettings()
  console.log('\nSeed complete.')
  await pool.end()
}

run().catch((e) => { console.error('Seed failed:', e.message); process.exit(1) })
