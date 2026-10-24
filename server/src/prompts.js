// System prompts for POST /api/chat. Portfolio mode reuses the admin-editable
// base prompt from chatbot_settings; curhat and english are fixed server
// constants so the browser cannot rewrite the persona or leak portfolio facts
// into a personal chat.

const CONTACT_EMAIL = 'alivenata@gmail.com'

const LANG_NAMES = {
  en: 'English', id: 'Bahasa Indonesia', ja: 'Japanese', zh: 'Chinese',
  ko: 'Korean', fr: 'French', de: 'German', ar: 'Arabic',
}

// Supportive companion. No portfolio facts: curhat is personal, not a pitch.
export const CURHAT_PROMPT = `You are Alyx, a warm and supportive companion. The person wants to vent, share how they feel, or just chat casually.

HOW TO RESPOND:
- Listen first and validate what they feel before anything else.
- Keep it short: 2 to 4 sentences, and ask one gentle follow-up question.
- Do not lecture, do not pile on advice they did not ask for, do not diagnose.
- If they mention serious distress or self-harm, gently encourage them to reach out to someone they trust or a professional.
- Do NOT bring up Alief's portfolio, skills, projects, or career here. This is a personal conversation.

REPLY LANGUAGE:
- Reply in the SAME language the person writes in.
- If their language is unclear, reply in Bahasa Indonesia.
- Never reply only in English when the person wrote in another language.`

// English-practice tutor. No portfolio facts: the point is the language.
export const ENGLISH_PROMPT = `You are Alyx, a friendly English conversation partner and tutor. The person wants to practice English with you.

HOW TO RESPOND:
- Hold a natural English conversation at the person's level and ask open questions to keep them talking.
- When they make a mistake that matters, correct it gently on its own lines:
  Correction: <the fixed sentence>
  Why: <one short reason>
- Fix the 1 to 2 most important issues per reply, not every small slip.
- Encourage them and keep the conversation moving.
- Do NOT bring up Alief's portfolio, skills, projects, or career here.

REPLY LANGUAGE:
- Converse in English by design, because that is the practice.
- The short Why explanation may be written in Bahasa Indonesia when the person's interface language is Indonesian, so the correction lands.`

const arr = (v) => (Array.isArray(v) ? v : [])

// Flatten the portfolio aggregate into a grounding block the model reads as the
// source of truth. Defensive about missing fields so a partial DB still works.
function portfolioToContext(p) {
  if (!p || typeof p !== 'object') return '(portfolio data unavailable)'
  const out = []

  const info = p.personalInfo || {}
  out.push([
    '## ABOUT',
    `Name: ${info.name || ''}`,
    `Title: ${info.title || ''}`,
    `Tagline: ${info.tagline || ''}`,
    `Email: ${info.email || ''}`,
    `GitHub: ${info.github || ''}`,
    `LinkedIn: ${info.linkedin || ''}`,
    `Bio: ${info.bio || ''}`,
  ].join('\n'))

  const skillLines = Object.entries(p.skills || {}).map(
    ([cat, items]) => `${cat}: ${arr(items).map((s) => s.name).filter(Boolean).join(', ')}`,
  )
  if (skillLines.length) out.push(`## SKILLS\n${skillLines.join('\n')}`)

  const projects = arr(p.projects)
  if (projects.length) {
    out.push('## PROJECTS\n' + projects.map((pr) => {
      const tech = arr(pr.tech).join(', ')
      return `- ${pr.title}${pr.category ? ` [${pr.category}]` : ''}: ${pr.description || ''}${tech ? ` (Tech: ${tech})` : ''}`
    }).join('\n'))
  }

  const expSections = [
    ['IT / Data experience', arr(p.experiencesIT)],
    ['Freelance experience', arr(p.experiencesFreelance)],
    ['Non-IT experience', arr(p.experiencesNonIT)],
  ].filter(([, rows]) => rows.length)
  if (expSections.length) {
    out.push('## EXPERIENCE\n' + expSections.map(([label, rows]) =>
      `${label}:\n` + rows.map((e) => {
        const points = arr(e.description).map((d) => `  - ${d}`).join('\n')
        return `- ${e.role}${e.company ? ` at ${e.company}` : ''}${e.period ? ` (${e.period})` : ''}${points ? `\n${points}` : ''}`
      }).join('\n'),
    ).join('\n\n'))
  }

  const awards = arr(p.awards)
  if (awards.length) out.push('## AWARDS\n' + awards.map((a) => `- ${a.title}: ${a.description || ''}`).join('\n'))

  const certs = arr(p.certificates)
  if (certs.length) out.push('## CERTIFICATES\n' + certs.map((c) => `- ${c.title}${c.issuer ? ` (${c.issuer}${c.date ? `, ${c.date}` : ''})` : ''}`).join('\n'))

  return out.join('\n\n')
}

// Portfolio-mode system prompt: admin base + injected portfolio + grounding.
export function buildPortfolioPrompt(baseSystemPrompt, portfolio) {
  const base = (baseSystemPrompt || '').trim()
  return `${base}

=== PORTFOLIO KNOWLEDGE (primary source of truth) ===
${portfolioToContext(portfolio)}
=== END PORTFOLIO KNOWLEDGE ===

GROUNDING: Answer questions about Alief only from the PORTFOLIO KNOWLEDGE above. If a detail is not there (rates, salary, personal life), say you do not have it and point them to ${CONTACT_EMAIL}. Never invent projects, employers, certifications, metrics, or skills.`
}

// A one-line reply-language reinforcement appended to every system prompt, so
// the mode's own language rule is restated for the specific request.
export function languageNudge(lang, mode) {
  if (mode === 'english') {
    return lang === 'id'
      ? 'Reply in English; you may write the short Why explanation in Bahasa Indonesia.'
      : 'Reply in English.'
  }
  if (mode === 'curhat') {
    const name = LANG_NAMES[lang]
    return name
      ? `Reply in ${name} to match the person. If their language is unclear, use Bahasa Indonesia.`
      : "Reply in the person's language. If it is unclear, use Bahasa Indonesia."
  }
  const name = LANG_NAMES[lang]
  return name ? `Reply in ${name}.` : 'Reply in the same language the user wrote in.'
}
