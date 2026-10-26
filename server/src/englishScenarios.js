import { Router } from 'express'
import { listEnglishScenarios } from './englishCurriculum.js'

export const englishScenariosRouter = Router()

// Public (PK-7): the chatbox fetches these to render the scenario chips when the
// visitor enters English mode. Only id, category, and title are exposed; the
// server-only briefs never leave the server (see englishCurriculum.js).
englishScenariosRouter.get('/', (_req, res) => {
  res.json(listEnglishScenarios())
})
