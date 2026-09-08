import { createContext, useContext, useEffect, useState } from 'react'
import { API_BASE } from './apiBase'
import {
  personalInfo, skills, projects,
  experiencesIT, experiencesFreelance, experiencesNonIT,
  awards, certificates,
} from '../data/portfolio'

// Static data ships in the bundle and is the fallback: the site renders fully
// even before the API responds, or if the API/VPS is down.
const FALLBACK = { personalInfo, skills, projects, experiencesIT, experiencesFreelance, experiencesNonIT, awards, certificates }

const Ctx = createContext(FALLBACK)
export const usePortfolio = () => useContext(Ctx)

const nonEmptyObj = (o) => o && typeof o === 'object' && Object.keys(o).length > 0
const nonEmptyArr = (a) => Array.isArray(a) && a.length > 0

export function PortfolioProvider({ children }) {
  const [data, setData] = useState(FALLBACK)

  useEffect(() => {
    let alive = true
    fetch(`${API_BASE}/api/portfolio`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d) return
        // Use live data per section when present; otherwise keep the static fallback.
        setData({
          personalInfo: nonEmptyObj(d.personalInfo) ? d.personalInfo : FALLBACK.personalInfo,
          skills: nonEmptyObj(d.skills) ? d.skills : FALLBACK.skills,
          projects: nonEmptyArr(d.projects) ? d.projects : FALLBACK.projects,
          experiencesIT: nonEmptyArr(d.experiencesIT) ? d.experiencesIT : FALLBACK.experiencesIT,
          experiencesFreelance: nonEmptyArr(d.experiencesFreelance) ? d.experiencesFreelance : FALLBACK.experiencesFreelance,
          experiencesNonIT: nonEmptyArr(d.experiencesNonIT) ? d.experiencesNonIT : FALLBACK.experiencesNonIT,
          awards: nonEmptyArr(d.awards) ? d.awards : FALLBACK.awards,
          certificates: nonEmptyArr(d.certificates) ? d.certificates : FALLBACK.certificates,
        })
      })
      .catch(() => { /* keep fallback */ })
    return () => { alive = false }
  }, [])

  return <Ctx.Provider value={data}>{children}</Ctx.Provider>
}
