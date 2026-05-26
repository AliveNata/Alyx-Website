import { useState, useRef, useEffect, useCallback } from 'react'
import { chatbotKnowledge, personalInfo } from '../data/portfolio'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const LLM_CONFIG = {
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
  // llama-3.1-8b-instant is smaller/faster and has much looser daily quotas than 70b.
  // Switch back to 'llama-3.3-70b-versatile' if you upgrade to paid tier.
  model: 'llama-3.1-8b-instant',
  temperature: 0.7,
  maxTokens: 500,
}

const FALLBACK_MSG = "I'm not sure I understand your question, but I can help you learn more about Alief's background, skills, or availability. What would you like to ask about?"

// Build grounding context from the portfolio data itself (single source of truth).
const PORTFOLIO_CONTEXT = Object.entries(chatbotKnowledge.topics || {})
  .map(([k, v]) => `## ${k.toUpperCase()}\n${v}`)
  .join('\n\n')

const SYSTEM_PROMPT = `You are Alyx, an AI assistant for ${personalInfo.name}'s portfolio website. You are friendly, professional, and strictly grounded in the portfolio content below.

=== PORTFOLIO KNOWLEDGE (primary source of truth) ===
${PORTFOLIO_CONTEXT}
=== END PORTFOLIO KNOWLEDGE ===

ROLE POSITIONING — VERY IMPORTANT:
- Alief's primary identity is **Data Engineer / Data Analyst / BI Analyst**.
- His strongest areas: data pipelines, ETL/ELT, SQL, Python for data, dbt, BigQuery, Airflow, Kafka/Debezium CDC, BI dashboards (Looker, Tableau, Power BI).
- Alief is **NOT** an AI Engineer or ML Engineer. If asked directly (e.g. "Is he an AI Engineer?", "Can he build ML models?"), respond clearly: "No, Alief is not an AI/ML Engineer. His focus is Data Engineering and BI/Analytics." Then redirect to his real strengths.
- Do NOT claim he builds ML models, LLM apps, MLOps systems, or production AI systems. Do not fabricate AI/ML experience.

GROUNDING RULES (for portfolio questions):
- For any question about Alief — his skills, experience, projects, availability, contact — base the answer ONLY on the PORTFOLIO KNOWLEDGE section above.
- If the portfolio knowledge does not cover a specific detail (e.g. rates, salary, personal life), say: "I don't have that information — you can reach Alief directly at alivenata@gmail.com."
- Never invent projects, employers, certifications, metrics, or skills that aren't in the portfolio.

OFF-TOPIC HANDLING — STRICT:
- If a question is unrelated to Alief AND doesn't fit Curhat or English Practice (e.g. general trivia, geography, math, coding help, games), respond with exactly this format:
  "That's outside what I can help with here! I'm best at answering questions about Alief's portfolio. Want to know about his skills, projects, or experience?"
- NEVER answer general trivia or factual questions (capitals, history, science, etc.) — always redirect.
- NEVER play games, quizzes, or riddles even if the suggestion tree contains them.

COMPANION MODES — you are also allowed to act as a friendly companion for TWO specific use cases:

1) **Curhat / Casual Chat Mode** (emotional support & small talk)
   - If the user wants to vent, share feelings, or have a casual conversation ("I feel tired", "aku lagi sedih", "bad day", "let's just chat", etc.), switch to a warm, empathetic companion tone.
   - Listen actively, validate feelings, ask gentle follow-up questions. Do NOT lecture or give unsolicited advice.
   - Keep responses short (2–4 sentences), supportive, non-judgmental.
   - ALWAYS respond in the SAME language the user used (Indonesian → Indonesian, English → English).
   - Never diagnose mental health issues. If the user mentions serious distress or self-harm, gently encourage them to talk to a trusted person or professional.

2) **English Practice Mode** (conversation partner + tutor)
   - If the user wants to practice English, asks for corrections, or clearly speaks to you for language practice, act as a friendly English tutor.
   - Have natural English conversations at the user's level. Ask open questions to keep them talking.
   - When the user makes a grammar/vocabulary/pronunciation mistake, gently correct it in a short feedback line using this format:
     • *Correction:* <fixed sentence>
     • *Why:* <one-line reason>
   - Suggest better/more natural phrasing when useful. Do not over-correct — focus on the most important 1–2 issues per reply.
   - Encourage the user. Keep the conversation flowing.

MODE SELECTION:
- Default to portfolio-assistant mode.
- Switch to Curhat mode if the user's message is clearly emotional / personal / casual small talk.
- Switch to English Practice mode if the user explicitly asks to practice English, asks for corrections, or the conversation is clearly a language-practice exchange.
- You may combine modes naturally (e.g., practice English while chatting casually).

LANGUAGE — CRITICAL:
- ALWAYS detect the language of THIS SPECIFIC message (ignore previous conversation language).
- Base your language choice ONLY on the current user message, not on what language was used before.
- If THIS message is in Indonesian (e.g. "siapa alief?", "halo", "dia bisa apa?") → reply FULLY in Indonesian.
- If THIS message is in English (e.g. "who is Alief?", "is he an AI Engineer?") → reply FULLY in English.
- Do NOT carry over the previous reply's language. Each message is independent.
- Do NOT mix languages unless the user mixes languages in THIS message.
- Exception: English Practice mode always stays in English regardless.

STYLE:
- Default length: concise (2–4 sentences).
- Friendly, warm, professional tone.
- Use markdown sparingly (bold/bullets only when it improves clarity).`

// ============================================================
// VOICE PRESETS
// ============================================================
const VOICE_PRESETS = {
  gender: [
    { id: 'female', label: 'Female', pitchShift:  0.18, match: ['female', 'woman', 'girl', 'nova', 'shimmer', 'ava', 'emma', 'jenny', 'aria', 'michelle', 'zira', 'samantha', 'victoria', 'karen', 'moira', 'tessa', 'eva', 'susan', 'sonia', 'libby', 'clara', 'natasha', 'joanna', 'kendra', 'kimberly', 'ivy', 'nicole', 'amy', 'jessica', 'sara', 'luna', 'serena', 'jane', 'ashley', 'amber', 'cora', 'elizabeth', 'monica', 'nancy', 'ana', 'phoebe', 'carly', 'freya', 'joanne', 'kim', 'elsie', 'tina', 'maisie', 'bella', 'olivia', 'hollie', 'leah', 'rosa', 'imani', 'molly', 'asilia', 'ezinne', 'aashi', 'ananya', 'kavya', 'neerja'] },
    { id: 'male',   label: 'Male',   pitchShift: -0.12, match: ['male', 'man', 'boy', 'onyx', 'alloy', 'fable', 'echo', 'brian', 'andrew', 'ryan', 'guy', 'david', 'mark', 'alex', 'daniel', 'fred', 'george', 'tony', 'thomas', 'oliver', 'liam', 'noah', 'jason', 'eric', 'roger', 'jacob', 'brandon', 'steffan', 'christopher', 'derek', 'dustin', 'lewis', 'samuel', 'adam', 'william', 'darren', 'duncan', 'neil', 'tim', 'ken', 'elliot', 'ethan', 'alfie', 'yan', 'sam', 'connor', 'luke', 'mitchell', 'wayne', 'james', 'arjun', 'prabhat', 'kunal', 'rehaan', 'abeo', 'chilemba', 'elimu'] },
  ],
  // Natural baselines. "Human" is tuned to sound as real as possible (pitch ~1.0, rate ~1.0).
  tone: [
    { id: 'human', label: 'Human', pitch: 0.97, rate: 1.05 },   // warm, slightly breathy baseline
    { id: 'anime', label: 'Anime', pitch: 1.65, rate: 1.18 },   // bright, lively
    { id: 'orc',   label: 'Orc',   pitch: 0.40, rate: 0.82 },   // deep, slow
  ],
  age: [
    { id: 'child',  label: 'Child',  pitchShift:  0.40, rateShift:  0.08 },
    { id: 'young',  label: 'Young',  pitchShift:  0.12, rateShift:  0.03 },
    { id: 'adult',  label: 'Adult',  pitchShift:  0.00, rateShift:  0.00 },
    { id: 'elder',  label: 'Elder',  pitchShift: -0.22, rateShift: -0.15 },
  ],
}

// ── Module-level pure helpers (no state/props) ──────────────────────────────

const CACHE_KEY = 'alyx-llm-cache-v3'
const loadCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') } catch { return {} } }
const saveCache = (obj) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(obj)) } catch {} }

const stripMarkdown = (t) =>
  t.replace(/\*\*(.*?)\*\*/g, '$1')
   .replace(/\*(.*?)\*/g, '$1')
   .replace(/`(.*?)`/g, '$1')
   .replace(/[📧💼🔗🌸👹🧑🧒🧔🧓👩👨▸•]/g, '')

const composeNodeReply = (node) => {
  let reply = node.answer || ''
  if (node.ending) {
    const tag = node.endingType ? `\n\n**${node.endingType}**` : ''
    reply = `${reply ? reply + '\n\n' : ''}${node.ending}${tag}`
  }
  return reply
}

const findInTree = (nodes, q) => {
  const lower = q.toLowerCase().trim()
  for (const node of nodes) {
    if (node.question.toLowerCase() === lower) return node
    if (node.followUps) {
      const found = findInTree(node.followUps, q)
      if (found) return found
    }
  }
  return null
}

const fuzzyFindInTree = (nodes, q) => {
  const tokens = q.toLowerCase().split(/\W+/).filter(t => t.length > 3)
  if (!tokens.length) return null
  let best = null, bestScore = 0
  const walk = (list) => {
    for (const n of list) {
      const score = tokens.reduce((acc, t) => acc + (n.question.toLowerCase().includes(t) ? 1 : 0), 0)
      if (score > bestScore) { bestScore = score; best = n }
      if (n.followUps) walk(n.followUps)
    }
  }
  walk(nodes)
  return bestScore >= 2 ? best : null
}

const TOPIC_KEYWORDS = {
  skills:       ['skill', 'skills', 'stack', 'tech stack', 'tech', 'tool', 'tools', 'language', 'python', 'sql', 'bigquery', 'postgres', 'postgresql', 'mysql', 'airflow', 'spark', 'dbt', 'kafka', 'debezium', 'hive', 'pandas', 'looker', 'tableau', 'power bi', 'data engineering', 'bi tool', 'keahlian', 'kemampuan', 'bisa apa', 'menguasai', 'expertise', 'proficient', 'good at', 'capable'],
  experience:   ['experience', 'experiences', 'work', 'worked', 'working', 'job', 'jobs', 'career', 'company', 'companies', 'role', 'roles', 'position', 'positions', 'rata', 'rata.id', 'telkomsel', 'intrepid', 'fabelio', 'pengalaman', 'kerja', 'bekerja', 'history', 'background', 'years', 'employer', 'employment'],
  projects:     ['project', 'projects', 'built', 'build', 'building', 'portfolio', 'case study', 'case studies', 'pipeline', 'pipelines', 'dashboard', 'dashboards', 'scraper', 'alyx scraper', 'repo', 'repository', 'github project', 'proyek', 'showcase', 'demo', 'etl', 'automation'],
  contact:      ['contact', 'email', 'mail', 'reach', 'reach out', 'phone', 'number', 'linkedin', 'github', 'social', 'message', 'hubungi', 'kontak', 'get in touch', 'connect', 'alivenata', 'alvnts'],
  availability: ['available', 'availability', 'hire', 'hiring', 'hirable', 'freelance', 'freelancer', 'open to', 'opportunity', 'opportunities', 'looking for', 'tersedia', 'lowongan', 'recruit', 'remote', 'full time', 'full-time', 'part time', 'part-time', 'consult', 'consulting'],
  awards:       ['award', 'awards', 'achievement', 'achievements', 'recognition', 'honor', 'honours', 'penghargaan', 'prestasi', 'top performer', 'winner', 'won', 'nominated'],
  certificates: ['certificate', 'certificates', 'certification', 'certifications', 'certified', 'sertifikat', 'sertifikasi', 'credential', 'credentials', 'course', 'training', 'dqlab', 'glints'],
  about:        ['about', 'who is', "who's", 'bio', 'biography', 'profile', 'introduce', 'introduction', 'tell me about', 'siapa', 'siapa sih', 'alief', 'aliv', 'aliev', 'akbar'],
}

const findTopicByKeyword = (q) => {
  const lower = ' ' + q.toLowerCase().trim().replace(/[?!.,]/g, ' ') + ' '
  let best = null, bestScore = 0
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      const needle = ' ' + kw + ' '
      if (lower.includes(needle)) score += kw.length + 2
      else if (lower.includes(kw)) score += Math.floor(kw.length / 2)
    }
    if (score > bestScore) { bestScore = score; best = topic }
  }
  return bestScore >= 3 ? best : null
}

const isAboutAlief = (q) => /\b(alief|aliv|aliev|akbar)\b/i.test(q)

const parseRateLimitHeaders = (headers, setRateLimit) => {
  const get = (...names) => { for (const n of names) { const v = headers.get(n); if (v) return v } return null }
  const getNum = (...names) => { const v = get(...names); if (!v) return null; const n = parseFloat(v); return Number.isFinite(n) ? n : v }
  const info = {
    limitRequests:     getNum('x-ratelimit-limit-requests',     'X-RateLimit-Limit-Requests'),
    remainingRequests: getNum('x-ratelimit-remaining-requests', 'X-RateLimit-Remaining-Requests'),
    limitTokens:       getNum('x-ratelimit-limit-tokens',       'X-RateLimit-Limit-Tokens'),
    remainingTokens:   getNum('x-ratelimit-remaining-tokens',   'X-RateLimit-Remaining-Tokens'),
    resetRequests:     get('x-ratelimit-reset-requests',        'X-RateLimit-Reset-Requests'),
    resetTokens:       get('x-ratelimit-reset-tokens',          'X-RateLimit-Reset-Tokens'),
    updatedAt: Date.now(),
  }
  if (info.limitRequests != null || info.limitTokens != null) setRateLimit(info)
}

// ────────────────────────────────────────────────────────────────────────────

function BotAvatar({ size = 'md' }) {
  const dims = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7'
  return (
    <div className={`${dims} shrink-0 inline-flex items-center justify-center`}>
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <line x1="24" y1="10" x2="24" y2="5" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="4" r="2" fill="#a855f7" />
        <rect x="10" y="10" width="28" height="24" rx="6" fill="#0a0f1c" stroke="#a855f7" strokeWidth="1.8" />
        <circle cx="18" cy="21" r="2.5" fill="#00d4ff" />
        <circle cx="30" cy="21" r="2.5" fill="#00d4ff" />
        <rect x="18" y="27" width="1.5" height="3" rx="0.5" fill="#00ff88" />
        <rect x="20.5" y="26" width="1.5" height="4" rx="0.5" fill="#00ff88" />
        <rect x="23" y="25" width="1.5" height="5" rx="0.5" fill="#00ff88" />
        <rect x="25.5" y="26" width="1.5" height="4" rx="0.5" fill="#00ff88" />
        <rect x="28" y="27" width="1.5" height="3" rx="0.5" fill="#00ff88" />
        <rect x="8" y="18" width="2" height="6" rx="1" fill="#a855f7" />
        <rect x="38" y="18" width="2" height="6" rx="1" fill="#a855f7" />
      </svg>
    </div>
  )
}

export default function ChatBot({ onClose, showHeaderClose = false }) {
  const initialTree = chatbotKnowledge.suggestedQuestionsTree || []

  const [messages, setMessages] = useState([
    { role: 'assistant', content: chatbotKnowledge.greeting }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [currentSuggestions, setCurrentSuggestions] = useState(initialTree)

  // Voice state
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [speakingIndex, setSpeakingIndex] = useState(null)
  const [voicePreset, setVoicePreset] = useState(() => {
    if (typeof window === 'undefined') return { gender: 'female', tone: 'human', age: 'adult' }
    try {
      const saved = localStorage.getItem('alivyx-voice-preset')
      return saved ? JSON.parse(saved) : { gender: 'female', tone: 'human', age: 'adult' }
    } catch {
      return { gender: 'female', tone: 'human', age: 'adult' }
    }
  })
  const [availableVoices, setAvailableVoices] = useState([])
  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [micLang, setMicLang] = useState('id-ID')
  const [rateLimit, setRateLimit] = useState(null) // { remainingRequests, limitRequests, remainingTokens, limitTokens, resetRequests, resetTokens }
  // Client-side usage tracker (fallback when CORS blocks rate-limit headers).
  // Persisted to localStorage with daily reset.
  const [localUsage, setLocalUsage] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('alyx-local-usage') || '{}')
      const today = new Date().toISOString().slice(0, 10)
      if (raw.date === today) return raw
    } catch {}
    return { date: new Date().toISOString().slice(0, 10), requests: 0, tokens: 0 }
  })

  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const voiceReplyFlagRef = useRef(false)
  const messagesRef = useRef(messages)
  const respondToQueryRef = useRef(null)

  const llmMode = !!LLM_CONFIG.apiKey

  // Setup SpeechRecognition (voice input)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setSpeechSupported(false); return }
    setSpeechSupported(true)
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true

    rec.onresult = (event) => {
      let finalText = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += t
        else interim += t
      }
      setInterimTranscript(interim)
      if (finalText) {
        setInterimTranscript('')
        voiceReplyFlagRef.current = true
        submitVoiceMessage(finalText.trim())
      }
    }
    rec.onerror = () => { setIsListening(false); setInterimTranscript('') }
    rec.onend = () => { setIsListening(false); setInterimTranscript('') }
    recognitionRef.current = rec
    return () => { try { rec.abort() } catch {} }
  }, [])

  const MIC_LANGS = [
    { code: 'id-ID', flag: '🇮🇩', label: 'ID' },
    { code: 'en-US', flag: '🇺🇸', label: 'EN' },
    { code: 'ja-JP', flag: '🇯🇵', label: 'JA' },
    { code: 'zh-CN', flag: '🇨🇳', label: 'ZH' },
    { code: 'ko-KR', flag: '🇰🇷', label: 'KO' },
    { code: 'fr-FR', flag: '🇫🇷', label: 'FR' },
    { code: 'de-DE', flag: '🇩🇪', label: 'DE' },
    { code: 'ar-SA', flag: '🇸🇦', label: 'AR' },
  ]

  const startListening = () => {
    if (!recognitionRef.current || isListening) return
    recognitionRef.current.lang = micLang
    try {
      stopSpeaking()
      setInterimTranscript('')
      recognitionRef.current.start()
      setIsListening(true)
    } catch {}
  }
  const stopListening = () => {
    if (!recognitionRef.current) return
    try { recognitionRef.current.stop() } catch {}
    setIsListening(false)
  }

  const submitVoiceMessage = async (transcript) => {
    if (!transcript) return
    const userMessage = { role: 'user', content: transcript }
    const newMessages = [...messagesRef.current, userMessage]
    setMessages(newMessages)
    await respondToQueryRef.current?.(transcript, newMessages, true)
  }

  // Load system voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const ss = window.speechSynthesis

    const load = () => {
      const v = ss.getVoices()
      if (v.length) setAvailableVoices(v)
    }

    // Try immediately (Chrome may already have voices if page was open a while)
    load()

    // onvoiceschanged fires once when browser finishes its initial voice load
    ss.onvoiceschanged = load

    // Edge loads Turbo/Online voices lazily — poll for 20s to catch late arrivals.
    // Polling only updates state when count actually changes (no spurious re-renders).
    let lastCount = 0
    const poll = setInterval(() => {
      const v = ss.getVoices()
      if (v.length !== lastCount) { lastCount = v.length; setAvailableVoices(v) }
    }, 800)
    const stopPoll = setTimeout(() => clearInterval(poll), 20_000)

    return () => {
      // Only clear the handler if it's still ours (avoid stomping on other instances)
      if (ss.onvoiceschanged === load) ss.onvoiceschanged = null
      // Do NOT call ss.cancel() here — it runs on every hot-reload / StrictMode
      // double-invoke and leaves the synthesis engine in a broken state.
      clearInterval(poll)
      clearTimeout(stopPoll)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('alivyx-voice-preset', JSON.stringify(voicePreset))
  }, [voicePreset])

useEffect(() => {
    try { localStorage.setItem('alyx-local-usage', JSON.stringify(localUsage)) } catch {}
  }, [localUsage])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (!minimized) inputRef.current?.focus() }, [minimized])

  // Drag
  useEffect(() => {
    if (!dragging) return
    const handleMove = (e) => {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      setPos({ x: dragStartRef.current.posX + dx, y: dragStartRef.current.posY + dy })
    }
    const handleUp = () => setDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging])

  const handleDragStart = (e) => {
    if (e.target.closest('button')) return
    dragStartRef.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y }
    setDragging(true)
    e.preventDefault()
  }

  // ============================================================
  // VOICE: pick best matching voice + speak
  // ============================================================
  // Detect spoken language from text content (used for voice selection)
  const detectLang = (text) => {
    if (/[぀-ヿ一-鿿]/.test(text)) return /[぀-ヿ]/.test(text) ? 'ja' : 'zh'
    if (/[가-힣]/.test(text)) return 'ko'
    if (/[؀-ۿ]/.test(text)) return 'ar'
    if (/\b(saya|anda|adalah|dengan|untuk|tidak|yang|dalam|ini|itu|dan|atau|dari|ke|di|pada|juga|sudah|bisa|akan|apa|bagaimana|karena|lebih|seperti|mereka|kita|kami)\b/i.test(text)) return 'id'
    return 'en'
  }

  const pickVoice = useCallback((lang = 'en') => {
    if (!availableVoices.length) return null
    const genderPref = VOICE_PRESETS.gender.find(g => g.id === voicePreset.gender)

    // Try to find voices for the requested language, fallback to English
    const langPool = availableVoices.filter(v => v.lang.toLowerCase().startsWith(lang))
    const enPool   = availableVoices.filter(v => /^en/i.test(v.lang))
    const pool     = langPool.length ? langPool : (enPool.length ? enPool : availableVoices)

    const scoreVoice = (v) => {
      let score = 0
      const name = v.name.toLowerCase()
      if (!v.localService) score += 80
      if (/turbo.*multilingual.*online|turbo.*online/.test(name)) score += 220
      if (/turbo/.test(name)) score += 200
      if (/nova.*turbo|shimmer.*turbo/.test(name)) score += 50
      if (/multilingual.*online.*natural|online.*natural.*multilingual/.test(name)) score += 140
      if (/online.*natural|natural.*online/.test(name)) score += 120
      if (/natural|neural|premium|enhanced/.test(name)) score += 80
      if (/microsoft.*online/.test(name)) score += 60
      if (/google.*english|google.*us|google.*uk/.test(name)) score += 80
      if (name.startsWith('google')) score += 40
      if (/samantha|karen|daniel|aaron|kate/.test(name)) score += 60
      // Gender match (+100) / mismatch (-200)
      const oppositeGender = VOICE_PRESETS.gender.find(g => g.id !== voicePreset.gender)
      const hasGenderMatch    = genderPref.match.some(k => new RegExp(`\\b${k}\\b`).test(name))
      const hasGenderMismatch = oppositeGender?.match.some(k => new RegExp(`\\b${k}\\b`).test(name))
      if (hasGenderMatch) score += 100
      else if (hasGenderMismatch) score -= 200
      if (/en-us/i.test(v.lang)) score += 15
      if (/espeak|festival|compact|robot|zira desktop|david desktop|hazel desktop/.test(name)) score -= 100
      return { voice: v, score }
    }

    const scored = pool.map(scoreVoice).sort((a, b) => b.score - a.score)
    return scored[0]?.voice || pool[0]
  }, [availableVoices, voicePreset.gender])

  // Compute fresh on every render — pickVoice is a useCallback so it's cheap
  const activeVoice = pickVoice()

  const speak = (text, index) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const tone   = VOICE_PRESETS.tone.find(t => t.id === voicePreset.tone)
    const age    = VOICE_PRESETS.age.find(a => a.id === voicePreset.age)
    const gender = VOICE_PRESETS.gender.find(g => g.id === voicePreset.gender)
    const basePitch = Math.max(0, Math.min(2, tone.pitch + age.pitchShift + (gender?.pitchShift ?? 0)))
    const baseRate  = Math.max(0.1, Math.min(2, tone.rate + age.rateShift))
    const clean = stripMarkdown(text)
    const lang  = detectLang(clean)
    const voice = pickVoice(lang)
    const isTurbo = voice && /turbo|online.*natural/i.test(voice.name)
    const chunks = clean
      .split(/(?<=[.!?,;])\s+/)
      .map(s => s.trim())
      .filter(Boolean)
      .concat() // copy

    if (!chunks.length) return

    // Chain utterances via onend (not forEach) — Edge/Chrome drop queued speak()
    // calls when multiple are pushed synchronously; chaining is reliable.
    const makeUtter = (chunk) => {
      const utter = new SpeechSynthesisUtterance(chunk)
      const pitchJitter = (Math.random() - 0.5) * (isTurbo ? 0.03 : 0.08)
      const rateJitter  = (Math.random() - 0.5) * (isTurbo ? 0.02 : 0.06)
      // Turbo/Azure voices: use pitch=1.0 to avoid silent failure (Azure rejects non-1.0 pitch);
      // still apply rate so Tone/Age presets have some effect.
      utter.pitch  = isTurbo ? 1.0 : Math.max(0, Math.min(2, basePitch + pitchJitter))
      utter.rate   = Math.max(0.1, Math.min(2, baseRate + rateJitter))
      utter.volume = 0.93
      if (voice) utter.voice = voice
      utter.lang = voice?.lang || (lang === 'en' ? 'en-US' : lang)
      return utter
    }

    let chunkIdx = 0
    const speakNext = () => {
      if (chunkIdx >= chunks.length) { setSpeakingIndex(null); return }
      const utter = makeUtter(chunks[chunkIdx++])
      if (chunkIdx === 1) utter.onstart = () => setSpeakingIndex(index)
      utter.onend = speakNext
      utter.onerror = () => setSpeakingIndex(null)
      window.speechSynthesis.speak(utter)
    }

    // Promise microtask: gives cancel() one tick to flush (Edge Azure TTS needs this),
    // while still inheriting the user-gesture activation context (unlike setTimeout/rAF).
    Promise.resolve().then(() => {
      window.speechSynthesis.resume() // ensure not paused after cancel() in Edge
      speakNext()
    })
  }

  const stopSpeaking = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    setSpeakingIndex(null)
  }

  const sendToLLM = async (conversationHistory) => {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LLM_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: LLM_CONFIG.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: LLM_CONFIG.temperature,
        max_tokens: LLM_CONFIG.maxTokens,
      }),
    })
    parseRateLimitHeaders(response.headers, setRateLimit)
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Groq API ${response.status}: ${body.slice(0, 200)}`)
    }
    const data = await response.json()
    const tokensUsed = data.usage?.total_tokens ?? 200
    setLocalUsage(prev => {
      const today = new Date().toISOString().slice(0, 10)
      const base = prev.date === today ? prev : { date: today, requests: 0, tokens: 0 }
      return { date: today, requests: base.requests + 1, tokens: base.tokens + tokensUsed }
    })
    return data.choices[0].message.content
  }

  const autoSpeakIfEnabled = (text, newMessagesLength, forceSpeak = false) => {
    if (voiceEnabled || forceSpeak) {
      setTimeout(() => speak(text, newMessagesLength), 200)
    }
  }

  const respondToQuery = async (query, baseMessages, forceSpeak = false) => {
    // If voice input was used, always speak the reply back
    const shouldSpeak = forceSpeak || voiceReplyFlagRef.current
    voiceReplyFlagRef.current = false
    setIsTyping(true)
    // 1a. Try EXACT tree match
    let node = findInTree(initialTree, query)

    // 1b. Portfolio scraping — if query is about Alief or portfolio topics,
    //     answer from chatbotKnowledge.topics directly. NO LLM CALL → saves quota.
    // Skip scraping for AI/ML questions so LLM can handle the denial via system prompt.
    const isAiMlQuery = /\b(ai|ml|machine\s*learn|deep\s*learn|neural|llm|gpt|artificial\s*intel|nlp|computer\s*vision|data\s*scien|tensorflow|pytorch|sklearn|scikit|ai\s*engineer|ml\s*engineer|build\s*model|train\s*model)\b/i.test(query)
    // Skip scraping for Indonesian queries — LLM must handle language mirroring.
    const isIndonesian = /\b(siapa|apa|apakah|bagaimana|gimana|berapa|kenapa|mengapa|kapan|dimana|di mana|cerita|tolong|boleh|bisa|dong|sih|ya|yuk|gak|nggak|tidak|bukan|dan|atau|dengan|untuk|dari|ke|di|yang|ini|itu|ada|punya|kerja|proyek|skill|tentang|kasih tau|kasih|tau|tahu)\b/i.test(query)
    if (!node && !isAiMlQuery && !isIndonesian) {
      let topic = findTopicByKeyword(query)
      // If the query clearly mentions Alief but no topic matched → default to `about`
      if (!topic && isAboutAlief(query)) topic = 'about'
      if (topic && chatbotKnowledge.topics?.[topic]) {
        await new Promise(r => setTimeout(r, 350))
        const reply = chatbotKnowledge.topics[topic]
        const newMessages = [...baseMessages, { role: 'assistant', content: reply }]
        setMessages(newMessages)
        setCurrentSuggestions(initialTree)
        setIsTyping(false)
        autoSpeakIfEnabled(reply, newMessages.length - 1, shouldSpeak)
        return
      }
    }

    // 1c. Fuzzy tree match — handle paraphrases before falling through to LLM
    if (!node) {
      node = fuzzyFindInTree(initialTree, query)
    }

    if (node) {
      await new Promise(r => setTimeout(r, 500))
      const reply = composeNodeReply(node)
      const hasFollowUps = node.followUps?.length
      setCurrentSuggestions(hasFollowUps ? node.followUps : initialTree)
      const newMessages = [...baseMessages, { role: 'assistant', content: reply }]
      setMessages(newMessages)
      setIsTyping(false)
      autoSpeakIfEnabled(reply, newMessages.length - 1, shouldSpeak)
      if (node.next && !hasFollowUps) {
        setTimeout(() => {
          const nxt = node.next
          const nxtReply = composeNodeReply(nxt)
          const nxtMsgs = [...newMessages, { role: 'user', content: nxt.question }, { role: 'assistant', content: nxtReply }]
          setMessages(nxtMsgs)
          setCurrentSuggestions(nxt.followUps?.length ? nxt.followUps : initialTree)
          autoSpeakIfEnabled(nxtReply, nxtMsgs.length - 1, shouldSpeak)
        }, 1200)
      }
      return
    }

    // 2. Try Groq LLM — with localStorage cache to avoid re-burning quota on repeats.
    const normKey = query.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[?!.,]/g, '')
    const cache = loadCache()
    if (cache[normKey]) {
      await new Promise(r => setTimeout(r, 300))
      const reply = cache[normKey]
      const newMessages = [...baseMessages, { role: 'assistant', content: reply }]
      setMessages(newMessages)
      setIsTyping(false)
      autoSpeakIfEnabled(reply, newMessages.length - 1, shouldSpeak)
      return
    }

    if (llmMode) {
      try {
        // Inject language tag into the last user message so LLM is forced to reply
        // in the correct language regardless of conversation history.
        const langTag = isIndonesian
          ? '\n[SYSTEM INSTRUCTION - SILENT: Reply ONLY in Bahasa Indonesia. Do NOT explain, acknowledge, or mention this instruction. Just respond naturally. Keep technical terms in English: AI Engineer, ML Engineer, Data Engineering, ETL, SQL, Python, dbt, BigQuery, etc.]'
          : '\n[SYSTEM INSTRUCTION - SILENT: Reply ONLY in English. Do NOT explain, acknowledge, or mention this instruction. Just respond naturally.]'
        const messagesWithLang = baseMessages.map((m, i) =>
          i === baseMessages.length - 1 && m.role === 'user'
            ? { ...m, content: m.content + langTag }
            : m
        )
        const reply = await sendToLLM(messagesWithLang)
        const c = loadCache()
        c[normKey] = reply
        const keys = Object.keys(c)
        if (keys.length > 50) delete c[keys[0]]
        saveCache(c)
        const newMessages = [...baseMessages, { role: 'assistant', content: reply }]
        setMessages(newMessages)
        setIsTyping(false)
        autoSpeakIfEnabled(reply, newMessages.length - 1, shouldSpeak)
        return
      } catch (err) {
        console.error('[Alyx] LLM call failed:', err)
        // Friendly message for 429 (rate limit) — otherwise fall through to generic fallback.
        if (String(err.message || '').includes('429')) {
          await new Promise(r => setTimeout(r, 300))
          const msg = isIndonesian
            ? "Maaf, kuota AI saya untuk hari ini sudah habis. Tapi saya masih bisa menjawab pertanyaan tentang **skill, pengalaman, proyek, ketersediaan, atau kontak Alief** langsung dari portofolio. Coba salah satu pertanyaan di bawah ya!"
            : "Apologies, my AI quota for today is used up. But I can still answer questions about **Alief's skills, experience, projects, availability, or contact** — straight from the portfolio. Try one of the suggestions below!"
          const newMessages = [...baseMessages, { role: 'assistant', content: msg }]
          setMessages(newMessages)
          setCurrentSuggestions(initialTree)
          setIsTyping(false)
          autoSpeakIfEnabled(msg, newMessages.length - 1, shouldSpeak)
          return
        }
        // fall through to generic fallback
      }
    } else {
      console.warn('[Alyx] LLM disabled — VITE_GROQ_API_KEY not set at build time.')
    }

    // 3. Fallback
    await new Promise(r => setTimeout(r, 400))
    const newMessages = [...baseMessages, { role: 'assistant', content: FALLBACK_MSG }]
    setMessages(newMessages)
    setCurrentSuggestions(initialTree)
    setIsTyping(false)
    autoSpeakIfEnabled(FALLBACK_MSG, newMessages.length - 1, shouldSpeak)
  }

  // Keep refs fresh for speech recognition handler
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { respondToQueryRef.current = respondToQuery })

  const handleSend = async () => {
    if (!input.trim() || isTyping) return
    const userMessage = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    const query = input.trim()
    setInput('')
    await respondToQuery(query, newMessages)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleSuggestion = async (node) => {
    const userMessage = { role: 'user', content: node.question }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    await respondToQuery(node.question, newMessages)
  }

  const renderMarkdown = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-primary/50 px-1 rounded text-accent-cyan text-xs">$1</code>')
      .replace(/^• /gm, '<span class="text-accent-cyan">▸</span> ')
      .replace(/\n/g, '<br />')

  // Header status badge — computed before JSX
  const FREE_TPD = 500000
  const usageRatio = rateLimit?.remainingTokens != null && rateLimit?.limitTokens
    ? rateLimit.remainingTokens / rateLimit.limitTokens
    : llmMode && localUsage.tokens > 0
      ? Math.max(0, (FREE_TPD - localUsage.tokens) / FREE_TPD)
      : null
  const hasUsageData = rateLimit || localUsage.tokens > 0
  const statusDotColor = !llmMode ? 'bg-red-400'
    : usageRatio == null ? 'bg-accent-cyan'
    : usageRatio < 0.1 ? 'bg-red-400'
    : usageRatio < 0.4 ? 'bg-yellow-300'
    : 'bg-accent-green'
  const statusPulse = llmMode && (usageRatio == null || usageRatio >= 0.4)
  const usagePctLabel = usageRatio != null ? Math.round(usageRatio * 100) + '%' : null
  const usageBadgeClass = usageRatio == null ? '' : usageRatio < 0.1
    ? 'bg-red-500/20 text-red-400' : usageRatio < 0.4
    ? 'bg-yellow-500/20 text-yellow-300' : 'bg-accent-green/10 text-accent-green'
  const usageTooltip = !llmMode
    ? 'AI quota: offline — API key not configured at build time.'
    : rateLimit
      ? `AI Quota (Groq live)\n──────────────────────────\nRequests remaining: ${rateLimit.remainingRequests ?? '?'} / ${rateLimit.limitRequests ?? '?'}\nTokens remaining:   ${rateLimit.remainingTokens ?? '?'} / ${rateLimit.limitTokens ?? '?'}\nResets in: ${rateLimit.resetTokens ?? '?'}`
      : hasUsageData
        ? `AI Usage\n──────────────────────────\nRequests today: ${localUsage.requests}\nTokens used:    ${localUsage.tokens.toLocaleString()} / ~${FREE_TPD.toLocaleString()}\nResets at: 07:00 WIB (daily)`
        : 'AI ready — usage info will appear after your first AI chat.'

  const containerClass = maximized
    ? 'fixed inset-4 sm:inset-8 max-w-none'
    : 'fixed bottom-24 right-4 w-[400px] max-w-[calc(100vw-1.5rem)]'
  const heightStyle = maximized ? {} : { height: minimized ? 'auto' : 'min(580px, calc(100vh - 9rem))' }

  return (
    <div
      className={`${containerClass} z-50 bg-surface-dark border border-surface-border rounded-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden ${dragging ? 'select-none' : ''}`}
      style={{ ...heightStyle, transform: `translate(${pos.x}px, ${pos.y}px)` }}
    >
      {/* Header */}
      <div
        onMouseDown={handleDragStart}
        className={`bg-surface-card border-b border-surface-border px-3 py-2.5 flex items-center justify-between shrink-0 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex flex-col gap-[2px] text-gray-600 cursor-grab px-0.5">
            <div className="flex gap-[2px]"><span className="w-[3px] h-[3px] rounded-full bg-current" /><span className="w-[3px] h-[3px] rounded-full bg-current" /></div>
            <div className="flex gap-[2px]"><span className="w-[3px] h-[3px] rounded-full bg-current" /><span className="w-[3px] h-[3px] rounded-full bg-current" /></div>
            <div className="flex gap-[2px]"><span className="w-[3px] h-[3px] rounded-full bg-current" /><span className="w-[3px] h-[3px] rounded-full bg-current" /></div>
          </div>
          <BotAvatar size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-white leading-tight flex items-center gap-1.5">
              Alyx
              <span className="relative inline-flex w-1.5 h-1.5">
                {statusPulse && <span className={`absolute inset-0 rounded-full ${statusDotColor} opacity-75 animate-ping`} />}
                <span className={`relative inline-block w-1.5 h-1.5 rounded-full ${statusDotColor}`} />
              </span>
            </h3>
            <div className="text-[10px] text-gray-500 font-mono truncate flex items-center gap-1 cursor-help" title={usageTooltip}>
              <span>AI Assistant</span>
              {!llmMode && <span className="text-red-400">• offline</span>}
              {llmMode && usagePctLabel && (
                <span className={`px-1 rounded text-[9px] ${usageBadgeClass}`}>{usagePctLabel}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {/* Voice toggle */}
          <button
            onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) stopSpeaking() }}
            className={`p-1.5 rounded transition-all ${
              voiceEnabled ? 'text-accent-green bg-accent-green/10' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
            title={voiceEnabled ? 'Voice On' : 'Voice Off'}
          >
            {voiceEnabled ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M9 7h3l5-4v18l-5-4H9a2 2 0 01-2-2V9a2 2 0 012-2z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l4-4m0 4l-4-4M9 7h3l5-4v18l-5-4H9a2 2 0 01-2-2V9a2 2 0 012-2z" />
              </svg>
            )}
          </button>
          {/* Voice settings */}
          <button
            onClick={() => setShowVoiceSettings(s => !s)}
            className={`p-1.5 rounded transition-all ${
              showVoiceSettings ? 'text-accent-purple bg-accent-purple/10' : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
            title="Voice settings"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={() => { setMinimized(!minimized); setMaximized(false); }}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-all"
            title={minimized ? 'Expand' : 'Minimize'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={() => { setMaximized(!maximized); setMinimized(false); }}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-all"
            title={maximized ? 'Restore' : 'Maximize'}
          >
            {maximized ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V4m0 0h4M3 4l5 5m13-5v4m0-4h-4m4 0l-5 5M3 16v4m0 0h4m-4 0l5-5m13 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
          {showHeaderClose && (
            <button
              key={`header-x-${showHeaderClose}`}
              onClick={() => { stopSpeaking(); onClose(); }}
              className="glitter-in p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
              title="Close"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Voice Settings Panel */}
      {showVoiceSettings && !minimized && (
        <div className="border-b border-surface-border bg-surface-card/60 p-3 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-accent-purple uppercase tracking-wider">🎙️ Voice Presets</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-500">
                {availableVoices.length} voices
              </span>
              <button
                type="button"
                title="Reload voices"
                onClick={() => {
                  const ss = window.speechSynthesis
                  if (!ss) return
                  const v = ss.getVoices()
                  if (v.length) setAvailableVoices(v)
                  // Re-arm onvoiceschanged in case it was cleared
                  ss.onvoiceschanged = () => {
                    const fresh = ss.getVoices()
                    if (fresh.length) setAvailableVoices(fresh)
                  }
                }}
                className="text-[10px] font-mono text-gray-500 hover:text-accent-cyan transition-colors"
              >
                ↻
              </button>
            </div>
          </div>
          {/* Active voice display */}
          {activeVoice && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-accent-purple/5 border border-accent-purple/20 rounded">
              <span className="text-[9px] font-mono text-gray-500 shrink-0">Voice:</span>
              <span className="text-[9px] font-mono text-accent-purple truncate">
                {activeVoice.name.replace(/Microsoft\s+/i, '').replace(/\s+Online.*$/i, '').replace(/\s+Multilingual.*$/i, '')}
              </span>
              {!activeVoice.localService && (
                <span className="text-[8px] font-mono text-accent-green shrink-0 ml-auto">● online</span>
              )}
            </div>
          )}
          {['gender', 'tone', 'age'].map((category) => (
            <div key={category}>
              <div className="text-[10px] font-mono text-gray-500 mb-1 capitalize">{category}</div>
              <div className="flex flex-wrap gap-1">
                {VOICE_PRESETS[category].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setVoicePreset(p => ({ ...p, [category]: opt.id }))}
                    className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                      voicePreset[category] === opt.id
                        ? 'bg-accent-purple/20 text-accent-purple border-accent-purple/40'
                        : 'bg-primary/40 text-gray-400 border-surface-border hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => speak("Hello! I'm Alyx, Alief's AI assistant. This is how I sound with your current voice preset.", -1)}
            className="w-full mt-1 py-1.5 text-[10px] font-mono rounded bg-accent-green/10 text-accent-green border border-accent-green/30 hover:bg-accent-green/20 transition-all"
          >
            ▶ Preview voice
          </button>
        </div>
      )}

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-primary/40">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <BotAvatar size="sm" />}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent-purple/20 text-white rounded-br-md border border-accent-purple/30'
                    : 'bg-surface-card text-gray-200 rounded-bl-md border border-surface-border'
                }`}>
                  {msg.role === 'assistant' ? (
                    <>
                      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                      <button
                        onClick={() => speakingIndex === i ? stopSpeaking() : speak(msg.content, i)}
                        className={`mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono transition-all ${
                          speakingIndex === i
                            ? 'text-accent-green'
                            : 'text-gray-500 hover:text-accent-cyan'
                        }`}
                        title={speakingIndex === i ? 'Stop' : 'Speak'}
                      >
                        {speakingIndex === i ? (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><rect x="5" y="5" width="10" height="10" rx="1" /></svg>
                            Stop
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M6 4l10 6-10 6V4z" /></svg>
                            Speak
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 shrink-0 inline-flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 justify-start">
                <BotAvatar size="sm" />
                <div className="bg-surface-card border border-surface-border rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="typing-dots flex gap-1">
                    <span className="w-2 h-2 bg-accent-purple rounded-full" />
                    <span className="w-2 h-2 bg-accent-purple rounded-full" />
                    <span className="w-2 h-2 bg-accent-purple rounded-full" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (tree-based) */}
          {currentSuggestions.length > 0 && (
            <div className="px-4 pb-2 pt-2 shrink-0 bg-primary/40 border-t border-surface-border">
              <div className="text-[10px] font-mono text-gray-500 mb-1.5">Suggested:</div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-hide">
                {currentSuggestions.map((node, idx) => (
                  <button
                    key={`${idx}-${node.question}`}
                    onClick={() => handleSuggestion(node)}
                    disabled={isTyping}
                    className="px-2.5 py-1 bg-surface-card border border-surface-border rounded-full text-xs text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-all disabled:opacity-40"
                  >
                    {node.question}
                  </button>
                ))}
                {currentSuggestions !== initialTree && (
                  <button
                    onClick={() => setCurrentSuggestions(initialTree)}
                    className="px-2.5 py-1 text-xs text-accent-purple hover:text-accent-cyan transition-all"
                  >
                    ↺ reset
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-surface-border px-3 py-3 shrink-0 bg-surface-card">
            {speechSupported && (
              <div className="text-[10px] font-mono text-gray-500 mb-1.5 flex items-center gap-1.5">
                <span className="text-accent-green">🎓</span>
                <span>Tip: tap {MIC_LANGS.find(l => l.code === micLang)?.flag} to change mic language, then tap the mic to speak — Alyx replies in voice too.</span>
              </div>
            )}
            {isListening && (
              <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-mono text-red-300 flex-1 truncate">
                  {interimTranscript || 'Listening...'}
                </span>
                <button onClick={stopListening} className="text-[10px] font-mono text-red-300 hover:text-white">stop</button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Speak now...' : 'Ask me anything...'}
                className="flex-1 px-4 py-2.5 bg-primary border border-surface-border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 transition-all"
                disabled={isTyping || isListening}
              />
              {speechSupported && (
                <div className="flex items-center gap-1 shrink-0">
                  {/* Language cycle button */}
                  <button
                    onClick={() => {
                      const idx = MIC_LANGS.findIndex(l => l.code === micLang)
                      setMicLang(MIC_LANGS[(idx + 1) % MIC_LANGS.length].code)
                    }}
                    disabled={isListening}
                    className="px-1.5 py-1 rounded-lg bg-primary border border-surface-border text-[10px] font-mono text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-all disabled:opacity-30"
                    title={`Mic language: ${MIC_LANGS.find(l => l.code === micLang)?.label} — click to change`}
                  >
                    {MIC_LANGS.find(l => l.code === micLang)?.flag}
                  </button>
                  {/* Mic button */}
                  <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={isTyping}
                    className={`p-2.5 rounded-xl transition-all border ${
                      isListening
                        ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                        : 'bg-primary text-accent-green border-accent-green/30 hover:bg-accent-green/10'
                    } disabled:opacity-30`}
                    title={`${isListening ? 'Stop' : 'Speak'} — ${MIC_LANGS.find(l => l.code === micLang)?.label}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-14 0m7 7v4m-4 0h8M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3z" />
                    </svg>
                  </button>
                </div>
              )}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-2.5 bg-gradient-to-r from-accent-cyan to-accent-purple rounded-xl text-white disabled:opacity-30 hover:shadow-lg hover:shadow-accent-purple/25 transition-all shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
