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

// Retrieval-mode system prompt (P2-3): same admin base as portfolio mode, but
// instead of inlining the whole portfolio it carries only the chunks retrieved
// for this question. Each chunk keeps a stable [source_table#anchor] label so
// P2-4 can turn it into a deep-linked citation without changing this builder.
// The GROUNDING rule is stricter than buildPortfolioPrompt's: answer ONLY from
// these chunks, so the model cannot lean on half-remembered facts from training.
export function buildRetrievalPrompt(baseSystemPrompt, chunks) {
  const base = (baseSystemPrompt || '').trim()
  const context = arr(chunks).map((c) => {
    // anchor is a section id like '#projects'; drop the leading '#' so the label
    // reads [projects#projects], not [projects##projects]. Fall back to the row id.
    const label = c.anchor ? String(c.anchor).replace(/^#/, '') : c.source_id
    return `[${c.source_table}#${label}] ${c.content}`
  }).join('\n\n')

  return `${base}

=== RETRIEVED CONTEXT (the only source of truth for this question) ===
${context}
=== END RETRIEVED CONTEXT ===

GROUNDING: Answer only from the RETRIEVED CONTEXT above. If it does not contain the answer, say you do not have that detail and point them to ${CONTACT_EMAIL}. Do not use any outside knowledge about Alief, and never invent projects, employers, certifications, metrics, or skills.`
}

// Soft-handoff draft prompt (P3-4). The visitor can ask the bot to draft a short
// message that THEY will send to Alief, then edit it before sending. The draft is
// written in the visitor's own first person ("Hi Alief, I'm reaching out about
// ...") and may only summarize what the visitor asked in this conversation. It is
// a starting point the visitor edits, so the plain, honest version is the correct
// one: the prompt forbids inventing any visitor detail and forbids asserting
// anything about Alief, because the bot can know neither. Same grounding
// discipline as buildRetrievalPrompt / notSureReply, aimed at the handoff note.
// `userMessages` are the recent user turns (already redacted when stored).
export function buildDraftPrompt(userMessages) {
  const asked = arr(userMessages)
    .map((m) => String(m || '').trim())
    .filter((m) => m.length > 1)
    .map((m) => `- ${m}`)
    .join('\n') || '- (no specific question was captured)'

  return `You are helping a website visitor write a short message that THEY will send to Alief. Write it in the visitor's own voice: first person ("I", "me", "my"), addressed to Alief. The visitor will read, edit, and send it themselves.

WHAT THE VISITOR ASKED IN THIS CONVERSATION (the only source for the message):
${asked}

HOW TO WRITE IT:
- Start with "Hi Alief," then 2 to 4 short sentences in the first person.
- Summarize only what the visitor asked about above, and that they would like to connect.
- Keep it plain and specific. No marketing tone, no flattery.

YOU MUST NOT:
- Invent the visitor's name, company, role, email, location, or any detail they did not state. If something is unknown, leave it out. Do not add a signature or a made-up name.
- Claim anything about Alief: not his availability, his rates, his skills, his experience, his interest, or that he will reply or agree to anything.
- Promise anything, set any deadline, or invent a project, budget, or timeline.
- Add a subject line, labels, or quotation marks around the message.

Output only the message text, nothing else.`
}

// Language-aware "not sure" reply for the retrieval path (P2-3, decisions B/E).
// When no retrieved chunk clears the similarity threshold, the bot says it does
// not have the answer instead of guessing. This is fixed text, streamed as
// deltas by chat.js (no LLM call), so it stays honest with zero fabrication.
// Keyed by the same 8 language codes the chatbox offers (ChatBot.jsx), EN
// fallback. The non-ASCII copy is intentional, matching the frontend's existing
// localized strings (GREET / NOTICE); native-speaker review welcome later.
const NOT_SURE = {
  en: `I don't have that about Alief, and I'd rather not guess. You can email him at ${CONTACT_EMAIL}, or ask me about his skills, experience, or projects.`,
  id: `Aku belum punya info itu soal Alief, dan nggak mau menebak. Kamu bisa email dia di ${CONTACT_EMAIL}, atau tanya aku soal skill, pengalaman, atau proyeknya.`,
  ja: `それについてはAliefの情報を持っていないので、推測は控えますね。${CONTACT_EMAIL} にメールするか、彼のスキルや経験、プロジェクトについて聞いてください。`,
  zh: `关于这个我没有Alief的相关信息，就不乱猜了。你可以发邮件到 ${CONTACT_EMAIL}，或者问我他的技能、经验或项目。`,
  ko: `그건 Alief에 대한 정보가 없어서 추측하지 않을게요. ${CONTACT_EMAIL} 로 메일을 보내거나, 그의 기술이나 경력, 프로젝트에 대해 물어봐 주세요.`,
  fr: `Je n'ai pas cette information sur Alief, et je préfère ne pas deviner. Vous pouvez lui écrire à ${CONTACT_EMAIL}, ou me poser des questions sur ses compétences, son expérience ou ses projets.`,
  de: `Diese Information über Alief habe ich nicht, und ich möchte nicht raten. Du kannst ihm an ${CONTACT_EMAIL} schreiben oder mich nach seinen Fähigkeiten, seiner Erfahrung oder seinen Projekten fragen.`,
  ar: `ليس لدي هذه المعلومة عن Alief، ولا أريد التخمين. يمكنك مراسلته على ${CONTACT_EMAIL}، أو اسألني عن مهاراته أو خبرته أو مشاريعه.`,
}

export function notSureReply(lang) {
  return NOT_SURE[lang] || NOT_SURE.en
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
