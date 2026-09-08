import { Router } from 'express'
import { query } from './db.js'

// Public aggregate endpoint. Returns the whole portfolio in the exact shape the
// front-end already expects (see src/data/portfolio.js), so the site can swap
// its static import for one fetch with minimal changes.
export const portfolioRouter = Router()

portfolioRouter.get('/', async (_req, res) => {
  const [personal, skillRows, projects, expRows, awards, certificates] = await Promise.all([
    query('SELECT * FROM personal_info WHERE id = 1'),
    query('SELECT * FROM skills ORDER BY sort_order ASC, id ASC'),
    query('SELECT * FROM projects ORDER BY sort_order ASC, id ASC'),
    query('SELECT * FROM experiences ORDER BY sort_order ASC, id ASC'),
    query('SELECT * FROM awards ORDER BY sort_order ASC, id ASC'),
    query('SELECT * FROM certificates ORDER BY sort_order ASC, id ASC'),
  ])

  // Group skills back into { "Category": [ {name, icon, level}, ... ] }.
  const skills = {}
  for (const s of skillRows.rows) {
    ;(skills[s.category] ||= []).push({ name: s.name, icon: s.icon, level: s.level })
  }

  // Split experiences by type into the three arrays the UI renders. Expose
  // workType (camelCase) so the shape matches the static data the UI expects.
  const mapExp = (e) => ({ ...e, workType: e.work_type })
  const byType = { it: [], freelance: [], nonit: [] }
  for (const e of expRows.rows) (byType[e.exp_type] || byType.it).push(mapExp(e))

  res.json({
    personalInfo: personal.rows[0] || {},
    skills,
    projects: projects.rows,
    experiencesIT: byType.it,
    experiencesFreelance: byType.freelance,
    experiencesNonIT: byType.nonit,
    awards: awards.rows,
    certificates: certificates.rows,
  })
})
