// Explicit lead-intent detection (P3). Turns a portfolio-mode message into a
// cta signal the chat handler puts on the done meta, so the UI (P3-2) can offer
// the right next step. MVP is explicit-only: a cta fires on explicit keywords in
// the visitor's message, not on a behavior score. curhat and english are outside
// the funnel entirely and always return null, mirroring the mode gate in chat.js.

// Channel is where the cta sends the visitor; tier is how warm the intent is.
// Keyword sets are plain consts so they can be tuned without touching the logic.
// These are the server's own sets, intentionally separate from the client's
// TOPIC_KEYWORDS (those route canned answers; these gate a lead cta).

// Hiring / availability -> booking. The strong words (an explicit hire/recruit)
// read as a hot lead; the rest (availability, freelance, rate, budget) are warm.
// The warm set must cover every term the client's TOPIC_KEYWORDS.availability can
// show an availability chip on (P3-3 BUG3): if the client surfaces the chip but
// the server recompute returns null, the lead is dropped with a 400. So the terms
// added here (opportunity, looking for, remote, consult, full/part time, open to,
// hirable) mirror that client set, keeping server and client in agreement.
const HIRE_STRONG = ['hire', 'hiring', 'recruit', 'recruiter', 'recruiting', 'rekrut', 'merekrut']
const HIRE_WARM = [
  'available', 'availability', 'open to', 'open to work', 'open for work',
  'freelance', 'freelancer', 'rate', 'rates', 'budget', 'remote', 'hirable',
  'opportunity', 'opportunities', 'looking for', 'consult', 'consulting',
  'full time', 'part time', 'join your team', 'join the team',
  'tersedia', 'lowongan', 'proyek', 'butuh',
]

// Mentoring / learning -> sociabuzz (the paid 1-on-1 channel). Always warm.
const MENTOR = [
  'mentor', 'mentoring', 'mentorship', '1 on 1', 'one on one', 'learn from',
  'teach me', 'coach', 'coaching', 'tutor', 'guidance', 'guide me',
  'belajar sama', 'belajar dari', 'ajarin', 'bimbingan',
]

// Async contact -> email. Always warm. Deliberately checked last: a message that
// also says "hire" is a booking lead, not a plain contact one. Covers the client's
// TOPIC_KEYWORDS.contact set (P3-3 BUG3) so a contact chip the client shows always
// recomputes to a lead instead of a 400 (mail, reach, phone, number, linkedin,
// github, connect were missing).
const CONTACT = [
  'contact', 'reach', 'reach out', 'get in touch', 'email', 'mail', 'phone',
  'number', 'linkedin', 'github', 'connect', 'social', 'message',
  'alivenata', 'alvnts', 'hubungi', 'kontak',
]

// Sections that corroborate a hiring intent when retrieval pulled them. They
// only promote an existing keyword hit's confidence; they never trigger a cta on
// their own (a visitor reading the experience section is not a lead).
const HIRE_SECTIONS = new Set(['experience', 'about'])

// Normalize for whole-word-ish matching: lowercase, every run of non-alphanumeric
// becomes a single space, padded with spaces at both ends. So a keyword wrapped
// in spaces matches only on word boundaries (" rate " never hits "generate"), and
// punctuation-joined phrases like "1-on-1" collapse to the same form as "1 on 1".
function normalize(text) {
  return ` ${String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `
}

function hasAny(haystack, keywords) {
  for (const kw of keywords) {
    if (haystack.includes(` ${kw} `)) return true
  }
  return false
}

// Returns { tier, channel } or null. Never throws: a bad input resolves to null
// so the chat handler can call it inline without a guard.
export function detectLeadCta(message, mode, retrievedSections) {
  // Funnel is portfolio-only. curhat and english never surface a cta.
  if (mode === 'curhat' || mode === 'english') return null

  const text = normalize(message)
  if (text.trim() === '') return null

  const sections = Array.isArray(retrievedSections)
    ? retrievedSections.map((s) => String(s).replace(/^#/, ''))
    : []
  const sectionCorroborates = sections.some((s) => HIRE_SECTIONS.has(s))

  // Booking wins over the others: an explicit hire/availability ask is the
  // strongest intent, so it takes precedence even if contact words also appear.
  if (hasAny(text, HIRE_STRONG)) return { tier: 'hot', channel: 'booking' }
  if (hasAny(text, HIRE_WARM)) {
    // A pulled experience/about section nudges a soft availability ask to hot.
    return { tier: sectionCorroborates ? 'hot' : 'warm', channel: 'booking' }
  }

  if (hasAny(text, MENTOR)) return { tier: 'warm', channel: 'sociabuzz' }

  if (hasAny(text, CONTACT)) return { tier: 'warm', channel: 'email' }

  return null
}
