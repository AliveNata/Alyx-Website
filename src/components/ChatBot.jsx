import { useState, useRef, useEffect, useCallback } from 'react'
import DOMPurify from 'dompurify'
import { chatbotKnowledge, personalInfo } from '../data/portfolio'
import { API_BASE } from '../lib/apiBase'
import { fetchCvSettings, viewCv, downloadCv, logCv, STATIC_CV_URL } from '../lib/cv'
import GatedCvViewer from './GatedCvViewer'

// The server-authoritative chat endpoint owns the prompt, the context, and the
// model. The browser sends only the message plus a few flags, and never sees
// GROQ_API_KEY.
const CHAT_URL = `${API_BASE}/api/chat`

// LLMs love em-dashes; normalize em/en-dashes to a plain " - " so replies stay ASCII.
const stripEmDash = (t) => (t || '').replace(/\s*[—–]\s*/g, ' - ')

// ─── Site Actions ────────────────────────────────────────────────────────────
// Pattern-matched commands that control the portfolio UI directly.
// Checked BEFORE LLM — zero quota cost, instant response.
const SITE_ACTIONS = [
  // ── Scroll to sections ──
  {
    patterns: [/\b(home|hero|beranda|awal|halaman\s*awal|paling\s*atas|top)\b/i],
    action: () => document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' }),
    reply: { id: 'Oke! Scroll ke bagian Home. 🏠', en: 'Sure! Scrolling to Home. 🏠' },
  },
  {
    patterns: [/\b(about|tentang|profil|bio|deskripsi\s*diri)\b/i],
    action: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }),
    reply: { id: 'Oke! Scroll ke bagian About. 👤', en: 'Sure! Scrolling to About. 👤' },
  },
  {
    patterns: [/\b(skills?|keahlian|kemampuan|teknologi|tech\s*stack)\b/i],
    action: () => document.getElementById('skills')?.scrollIntoView({ behavior: 'smooth' }),
    reply: { id: 'Oke! Scroll ke bagian Skills. 🛠️', en: 'Sure! Scrolling to Skills. 🛠️' },
  },
  {
    patterns: [/\b(projects?|proyek|portofolio|portfolio|karya)\b/i],
    action: () => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' }),
    reply: { id: 'Oke! Scroll ke bagian Projects. 🚀', en: 'Sure! Scrolling to Projects. 🚀' },
  },
  {
    patterns: [/\b(experiences?|pengalaman|karir|riwayat\s*kerja|kerja|pekerjaan)\b/i],
    action: () => document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' }),
    reply: { id: 'Oke! Scroll ke bagian Experience. 💼', en: 'Sure! Scrolling to Experience. 💼' },
  },
  {
    patterns: [/\b(contact|kontak|hubungi|reach\s*out|email|form)\b/i],
    action: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }),
    reply: { id: 'Oke! Scroll ke bagian Contact. 📬', en: 'Sure! Scrolling to Contact. 📬' },
  },
  // ── Open links ──
  {
    patterns: [/\b(linkedin|linked\s*in)\b/i],
    action: () => window.open(personalInfo.linkedin, '_blank'),
    reply: { id: 'Membuka LinkedIn Alief di tab baru! 🔗', en: "Opening Alief's LinkedIn in a new tab! 🔗" },
  },
  {
    patterns: [/\b(github|git\s*hub|repo|repository)\b/i],
    action: () => window.open(personalInfo.github, '_blank'),
    reply: { id: 'Membuka GitHub Alief di tab baru! 🐙', en: "Opening Alief's GitHub in a new tab! 🐙" },
  },
  {
    // get_cv (PK-18): no longer force-downloads. The reply carries a view +
    // download affordance (cvOffer) so the visitor can read it in a tab first.
    patterns: [/\b(cv|resume|curriculum\s*vitae|unduh\s*cv|download\s*cv)\b/i],
    action: () => {},
    cvOffer: true,
    reply: { id: 'Ini CV Alief. Kamu bisa lihat dulu atau langsung unduh.', en: "Here is Alief's CV. You can view it first or download it." },
  },
  {
    patterns: [/\b(copy|salin|kopas)\b.*\b(email)\b|\bemail\b.*\b(copy|salin|kopas)\b/i],
    action: () => navigator.clipboard?.writeText(personalInfo.email),
    reply: { id: `Email ${personalInfo.email} sudah disalin ke clipboard! 📋`, en: `Email ${personalInfo.email} copied to clipboard! 📋` },
  },
  // ── Change theme ──
  {
    patterns: [/\b(dark|gelap|malam|dark\s*mode|tema\s*gelap)\b/i],
    action: () => {
      document.body.classList.remove('theme-code', 'theme-dark', 'theme-light')
      document.body.classList.add('theme-dark')
      localStorage.setItem('alivyx-theme', 'dark')
    },
    reply: { id: 'Theme diganti ke Dark mode! 🌙', en: 'Switched to Dark theme! 🌙' },
  },
  {
    patterns: [/\b(light|terang|siang|light\s*mode|tema\s*terang|putih)\b/i],
    action: () => {
      document.body.classList.remove('theme-code', 'theme-dark', 'theme-light')
      document.body.classList.add('theme-light')
      localStorage.setItem('alivyx-theme', 'light')
    },
    reply: { id: 'Theme diganti ke Light mode! ☀️', en: 'Switched to Light theme! ☀️' },
  },
  {
    patterns: [/\b(code|default|terminal|original|hijau|cyan|dark\s*code)\b/i],
    action: () => {
      document.body.classList.remove('theme-code', 'theme-dark', 'theme-light')
      document.body.classList.add('theme-code')
      localStorage.setItem('alivyx-theme', 'code')
    },
    reply: { id: 'Theme diganti ke Code (default)! 💻', en: 'Switched to Code theme (default)! 💻' },
  },
]

// Returns matched action or null. Only triggers on navigation/action intent keywords.
const NAV_TRIGGER = /\b(scroll|pergi|bawa|tampil|show|lihat|ke|to|go|open|buka|ganti|switch|change|download|unduh|copy|salin)\b/i

function detectSiteAction(query, isIndonesian) {
  // Must contain a navigation/action verb to avoid false positives on general questions
  if (!NAV_TRIGGER.test(query) &&
      !/\b(linkedin|github|cv|resume|dark\s*mode|light\s*mode|dark\s*theme|light\s*theme)\b/i.test(query)) return null
  for (const sa of SITE_ACTIONS) {
    if (sa.patterns.some(p => p.test(query))) return sa
  }
  return null
}

const FALLBACK_MSG = "I'm not sure I understand your question, but I can help you learn more about Alief's background, skills, or availability. What would you like to ask about?"

// Mode-aware last-resort fallback (PK-7). When even the server retry streamed
// nothing, portfolio keeps FALLBACK_MSG, but english and curhat get a short line
// that stays in character, so a dropped turn never derails a role-play or a vent
// into portfolio talk. en + id written; any other chat language falls back to en.
// ASCII only.
const MODE_FALLBACK = {
  english: {
    en: 'Sorry, I missed that. Could you say it another way?',
    id: 'Maaf, aku belum nangkep. Coba ulangi dengan cara lain ya?',
  },
  curhat: {
    en: "Sorry, I didn't quite catch that. Want to tell me again?",
    id: 'Maaf, aku kurang nangkep. Mau cerita lagi pelan-pelan?',
  },
}
const modeFallback = (mode, uiLang) => {
  const m = MODE_FALLBACK[mode]
  return m ? (m[uiLang] || m.en) : null
}

// BCP-47 tag per detected TTS language. Forcing utter.lang to this makes
// multilingual/turbo voices switch accent (e.g. read Arabic in Arabic, not English).
const LANG_BCP = { en: 'en-US', id: 'id-ID', ja: 'ja-JP', zh: 'zh-CN', ko: 'ko-KR', fr: 'fr-FR', de: 'de-DE', ar: 'ar-SA' }

// English TTS only: data abbreviations the speech engine reads as words ("BI" ->
// "bye", "ETL" -> "ettle"). Spelling each out letter by letter makes it say the
// letters instead. Applied to the spoken string just before TTS; the on-screen
// reply never changes. Match is whole-word and case-sensitive so ordinary words
// stay intact (hits "CV", leaves the "cv" inside a longer word alone). Keyed so
// the set stays easy to tune — longer tokens listed before shorter ones.
const EN_SPOKEN_ABBR = {
  ETL: 'E T L', ELT: 'E L T', SQL: 'S Q L', API: 'A P I', GCP: 'G C P',
  ODS: 'O D S', DWH: 'D W H', KPI: 'K P I', dbt: 'd b t',
  BI: 'B I', AI: 'A I', ML: 'M L', CV: 'C V',
}
const EN_ABBR_RE = new RegExp(`\\b(${Object.keys(EN_SPOKEN_ABBR).join('|')})\\b`, 'g')
const spellOutAbbr = (text) => text.replace(EN_ABBR_RE, (m) => EN_SPOKEN_ABBR[m] || m)

// Time-of-day bucket from the local hour. Four buckets so Indonesian keeps its
// pagi/siang/sore/malam distinction; other languages collapse duplicates.
const greetPeriod = (h) => h < 5 ? 'night' : h < 11 ? 'morning' : h < 15 ? 'afternoon' : h < 18 ? 'evening' : 'night'

// Time-aware greeting per language: a salutation that fits the local hour +
// the fixed intro. Fixes the greeting always saying konnichiwa / konnichiwa
// regardless of time (now konbanwa at night, ohayou in the morning, etc.).
const GREET = {
  en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good afternoon', night: 'Good evening', body: "! I'm Alyx, Alief's AI Assistant. I can help you learn more about Alief Akbar." },
  id: { morning: 'Selamat pagi', afternoon: 'Selamat siang', evening: 'Selamat sore', night: 'Selamat malam', body: '! Aku Alyx, Asisten AI Alief. Aku bisa bantu kamu kenal lebih jauh soal Alief Akbar.' },
  ja: { morning: 'おはようございます', afternoon: 'こんにちは', evening: 'こんにちは', night: 'こんばんは', body: '！アリフのAIアシスタント、Alyxです。アリフ・アクバルについてお答えします。' },
  zh: { morning: '早上好', afternoon: '下午好', evening: '下午好', night: '晚上好', body: '！我是 Alyx，Alief 的 AI 助手。我可以帮你了解 Alief Akbar。' },
  ko: { morning: '좋은 아침이에요', afternoon: '안녕하세요', evening: '안녕하세요', night: '좋은 저녁이에요', body: '! 저는 Alief의 AI 어시스턴트 Alyx입니다. Alief Akbar에 대해 알려드릴게요.' },
  fr: { morning: 'Bonjour', afternoon: 'Bonjour', evening: 'Bonjour', night: 'Bonsoir', body: " ! Je suis Alyx, l'assistant IA d'Alief. Je peux vous en dire plus sur Alief Akbar." },
  de: { morning: 'Guten Morgen', afternoon: 'Guten Tag', evening: 'Guten Tag', night: 'Guten Abend', body: '! Ich bin Alyx, Aliefs KI-Assistent. Ich kann dir mehr über Alief Akbar erzählen.' },
  ar: { morning: 'صباح الخير', afternoon: 'مساء الخير', evening: 'مساء الخير', night: 'مساء الخير', body: '! أنا Alyx، مساعد Alief الذكي. يمكنني إخبارك المزيد عن Alief Akbar.' },
}
const buildGreeting = (lang) => {
  const g = GREET[lang] || GREET.en
  return g[greetPeriod(new Date().getHours())] + g.body
}

// Localized chatbox UI + starter suggestions, keyed by the short code of the
// selected mic flag (micLang.split('-')[0]). Picking a flag switches the whole
// chatbox surface to that language and drives the reply language.
const UI_TEXT = {
  en: {
    suggestedLabel: 'Suggested:',
    tip: 'Tip: tap the flag to change mic language, then tap the mic to speak. Alyx replies in voice too.',
    placeholder: 'Ask me anything...',
    listening: 'Speak now...',
    fallback: FALLBACK_MSG,
    aiBusy: "AI is a bit busy right now. Please wait a moment and try again. Meanwhile I can still answer questions about **Alief's skills, experience, projects, availability, or contact** from the portfolio!",
    suggestions: ["What are Alief's key skills?", 'Tell me about his experience', 'What projects has he built?', 'How can I contact him?'],
  },
  id: {
    suggestedLabel: 'Saran:',
    tip: 'Tip: ketuk bendera untuk ganti bahasa mic, lalu ketuk mic untuk bicara. Alyx menjawab dengan suara juga.',
    placeholder: 'Tanya apa saja...',
    listening: 'Bicara sekarang...',
    fallback: 'Maaf, aku kurang paham pertanyaannya, tapi aku bisa bantu soal latar belakang, skill, atau ketersediaan Alief. Mau tanya apa?',
    aiBusy: 'Koneksi AI lagi sibuk, mohon tunggu sebentar lalu coba lagi. Sementara itu aku masih bisa menjawab soal **skill, pengalaman, proyek, ketersediaan, atau kontak Alief** dari portofolio.',
    suggestions: ['Apa skill utama Alief?', 'Ceritakan pengalamannya', 'Proyek apa yang pernah dibuat?', 'Bagaimana cara menghubunginya?'],
  },
  ja: {
    suggestedLabel: '候補:',
    tip: 'ヒント：旗をタップして音声言語を変更し、マイクをタップして話してください。Alyxは音声でも返答します。',
    placeholder: '何でも聞いてください...',
    listening: '今話してください...',
    fallback: 'うまく理解できませんでしたが、アリフの経歴・スキル・空き状況についてお答えできます。何が知りたいですか？',
    aiBusy: 'AIが少し混み合っています。少し待ってからもう一度お試しください。その間も、アリフの**スキル・経験・プロジェクト・空き状況・連絡先**についてお答えできます。',
    suggestions: ['アリフの主なスキルは？', '経験について教えて', 'どんなプロジェクトを作った？', '連絡方法は？'],
  },
  zh: {
    suggestedLabel: '建议:',
    tip: '提示：点击旗帜切换语音语言，然后点击麦克风说话。Alyx 也会用语音回复。',
    placeholder: '问我任何问题...',
    listening: '请说话...',
    fallback: '抱歉，我不太明白你的问题，但我可以介绍 Alief 的背景、技能或空档情况。你想了解什么？',
    aiBusy: 'AI 有点繁忙，请稍后再试。同时我仍可以从作品集回答关于 Alief 的**技能、经验、项目、空档或联系方式**的问题。',
    suggestions: ['Alief 的核心技能是什么？', '介绍一下他的经历', '他做过哪些项目？', '如何联系他？'],
  },
  ko: {
    suggestedLabel: '추천:',
    tip: '팁: 깃발을 눌러 음성 언어를 바꾸고, 마이크를 눌러 말하세요. Alyx는 음성으로도 답합니다.',
    placeholder: '무엇이든 물어보세요...',
    listening: '지금 말하세요...',
    fallback: '질문을 잘 이해하지 못했지만, Alief의 배경, 기술, 가능 여부에 대해 알려드릴 수 있어요. 무엇이 궁금하세요?',
    aiBusy: 'AI가 잠시 바쁩니다. 잠시 후 다시 시도해 주세요. 그동안에도 Alief의 **기술, 경력, 프로젝트, 가능 여부, 연락처**에 대해 답할 수 있어요.',
    suggestions: ['Alief의 핵심 기술은?', '경력을 알려줘', '어떤 프로젝트를 했나요?', '어떻게 연락하나요?'],
  },
  fr: {
    suggestedLabel: 'Suggestions :',
    tip: 'Astuce : touchez le drapeau pour changer la langue du micro, puis touchez le micro pour parler. Alyx répond aussi en voix.',
    placeholder: 'Posez-moi une question...',
    listening: 'Parlez maintenant...',
    fallback: "Je n'ai pas bien compris, mais je peux vous renseigner sur le parcours, les compétences ou la disponibilité d'Alief. Que voulez-vous savoir ?",
    aiBusy: "L'IA est un peu occupée. Veuillez réessayer dans un instant. En attendant, je peux répondre sur les **compétences, l'expérience, les projets, la disponibilité ou le contact** d'Alief.",
    suggestions: ["Quelles sont les compétences clés d'Alief ?", 'Parlez-moi de son expérience', 'Quels projets a-t-il réalisés ?', 'Comment le contacter ?'],
  },
  de: {
    suggestedLabel: 'Vorschläge:',
    tip: 'Tipp: Tippe auf die Flagge, um die Mikrofonsprache zu ändern, dann aufs Mikrofon zum Sprechen. Alyx antwortet auch per Stimme.',
    placeholder: 'Frag mich etwas...',
    listening: 'Sprich jetzt...',
    fallback: 'Ich habe die Frage nicht ganz verstanden, aber ich kann dir über Aliefs Hintergrund, Fähigkeiten oder Verfügbarkeit helfen. Was möchtest du wissen?',
    aiBusy: 'Die KI ist gerade etwas ausgelastet. Bitte versuche es gleich noch einmal. In der Zwischenzeit kann ich Fragen zu Aliefs **Fähigkeiten, Erfahrung, Projekten, Verfügbarkeit oder Kontakt** beantworten.',
    suggestions: ['Was sind Aliefs Kernkompetenzen?', 'Erzähl von seiner Erfahrung', 'Welche Projekte hat er gebaut?', 'Wie kann ich ihn kontaktieren?'],
  },
  ar: {
    suggestedLabel: 'اقتراحات:',
    tip: 'نصيحة: اضغط على العلم لتغيير لغة الميكروفون، ثم اضغط على الميكروفون للتحدث. يردّ Alyx بالصوت أيضاً.',
    placeholder: 'اسألني أي شيء...',
    listening: 'تحدث الآن...',
    fallback: 'لم أفهم سؤالك تماماً، لكن يمكنني مساعدتك بخصوص خلفية Alief ومهاراته أو توفره. ماذا تريد أن تعرف؟',
    aiBusy: 'الذكاء الاصطناعي مشغول قليلاً الآن. يرجى المحاولة بعد لحظات. في هذه الأثناء يمكنني الإجابة عن **مهارات Alief وخبرته ومشاريعه وتوفره وطريقة التواصل**.',
    suggestions: ['ما أهم مهارات Alief؟', 'حدثني عن خبرته', 'ما المشاريع التي أنجزها؟', 'كيف أتواصل معه؟'],
  },
}

// Consent notice + opt-out copy, keyed by the same language codes as UI_TEXT.
// Honest and self-contained: there is no privacy-policy page to link to.
// Non-ASCII translations are intentional; native-speaker review welcome later.
const NOTICE = {
  en: {
    body: 'To improve Alyx, chats here may be stored with personal details removed. You can turn that off.',
    optOut: "Don't store my messages",
    dismiss: 'Got it',
    privacy: 'Privacy',
    off: 'not storing messages',
  },
  id: {
    body: 'Untuk membuat Alyx lebih baik, obrolan di sini bisa disimpan dengan data pribadi dihapus. Kamu bisa mematikannya.',
    optOut: 'Jangan simpan pesan saya',
    dismiss: 'Oke',
    privacy: 'Privasi',
    off: 'pesan tidak disimpan',
  },
  ja: {
    body: 'Alyxを改善するため、ここでの会話は個人情報を除いて保存されることがあります。オフにもできます。',
    optOut: 'メッセージを保存しない',
    dismiss: 'OK',
    privacy: 'プライバシー',
    off: 'メッセージは保存しません',
  },
  zh: {
    body: '为了改进 Alyx，这里的对话可能会在移除个人信息后被保存。你可以随时关闭。',
    optOut: '不要保存我的消息',
    dismiss: '知道了',
    privacy: '隐私',
    off: '不保存消息',
  },
  ko: {
    body: 'Alyx를 개선하기 위해 여기 대화는 개인정보를 제거한 뒤 저장될 수 있어요. 언제든 끌 수 있어요.',
    optOut: '내 메시지를 저장하지 않기',
    dismiss: '확인',
    privacy: '개인정보',
    off: '메시지를 저장하지 않음',
  },
  fr: {
    body: "Pour améliorer Alyx, les conversations ici peuvent être conservées sans vos données personnelles. Vous pouvez désactiver cela.",
    optOut: 'Ne pas enregistrer mes messages',
    dismiss: 'Compris',
    privacy: 'Confidentialité',
    off: 'messages non enregistrés',
  },
  de: {
    body: 'Um Alyx zu verbessern, können Chats hier ohne persönliche Daten gespeichert werden. Du kannst das abschalten.',
    optOut: 'Meine Nachrichten nicht speichern',
    dismiss: 'Verstanden',
    privacy: 'Datenschutz',
    off: 'Nachrichten werden nicht gespeichert',
  },
  ar: {
    body: 'لتحسين Alyx، قد تُحفظ المحادثات هنا بعد إزالة البيانات الشخصية. يمكنك إيقاف ذلك في أي وقت.',
    optOut: 'عدم حفظ رسائلي',
    dismiss: 'حسناً',
    privacy: 'الخصوصية',
    off: 'لا يتم حفظ الرسائل',
  },
}

// Section-level citations (P2-4). The server sends only { anchor, section } from
// a fixed allowlist; the client owns both the visible label and the scroll target,
// so no text from the database ever reaches the DOM. CITED_SECTIONS mirrors the
// real section ids rendered by src/components/* and gates every chip: a section
// outside it is dropped, never linked. Labels follow the GREET/NOTICE pattern,
// en + id defined, other chat languages fall back to en.
const CITED_SECTIONS = new Set(['about', 'projects', 'skills', 'experience', 'recognition'])
const SECTION_LABELS = {
  en: { about: 'About', projects: 'Projects', skills: 'Skills', experience: 'Experience', recognition: 'Recognition' },
  id: { about: 'Tentang', projects: 'Proyek', skills: 'Keahlian', experience: 'Pengalaman', recognition: 'Penghargaan' },
}
// Lead-in before the chip row, and the verb for each chip's screen-reader label.
const SOURCES_LABEL = { en: 'Sources', id: 'Sumber' }
const GOTO_LABEL = { en: 'Go to', id: 'Buka bagian' }

// Lead CTA (P3-2). A single gentle chip under a grounded portfolio answer when
// the server marks the turn with a lead cta. Value-first: it never shows on the
// first reply (CTA_TURN_FLOOR), at most once per browser session (CTA_FLAG in
// sessionStorage, the same shape as the consent notice flag), and can be waved
// off. Copy follows the GREET/NOTICE pattern: en + id written, every other chat
// language falls back to en. One channel per chip, keyed by the server's cta.
const CTA_TURN_FLOOR = 2
const CTA_FLAG = 'alyx-cta-v1'
const CTA_CHANNELS = new Set(['booking', 'sociabuzz', 'email'])
const CTA_COPY = {
  en: {
    dismiss: 'Not now',
    dismissAria: 'Hide this suggestion',
    booking: { lead: 'Want to talk to Alief directly?', action: 'Book a short call', opened: 'Opening the booking page in a new tab.' },
    sociabuzz: { lead: 'Looking for mentoring?', action: 'See mentoring on SociaBuzz', opened: 'Opening SociaBuzz in a new tab.' },
    email: {
      lead: 'Prefer to reach Alief by email?',
      action: 'Leave your email',
      emailLabel: 'Your email',
      messageLabel: 'Message to Alief',
      notePlaceholder: 'Write your message, or use the draft button.',
      draftAction: 'Draft a message for me',
      drafting: 'Drafting...',
      draftError: 'Could not draft right now. You can still write your message.',
      send: 'Send',
      cancel: 'Cancel',
      invalid: 'Enter a valid email.',
      error: 'Could not send. Please try again.',
      sent: 'Sent. Alief will reply to your email.',
    },
  },
  id: {
    dismiss: 'Nanti aja',
    dismissAria: 'Sembunyikan saran ini',
    booking: { lead: 'Mau ngobrol langsung sama Alief?', action: 'Jadwalkan panggilan singkat', opened: 'Membuka halaman jadwal di tab baru.' },
    sociabuzz: { lead: 'Lagi cari mentoring?', action: 'Lihat mentoring di SociaBuzz', opened: 'Membuka SociaBuzz di tab baru.' },
    email: {
      lead: 'Lebih nyaman lewat email?',
      action: 'Tinggalkan email kamu',
      emailLabel: 'Email kamu',
      messageLabel: 'Pesan untuk Alief',
      notePlaceholder: 'Tulis pesanmu, atau pakai tombol draf.',
      draftAction: 'Buatkan draf',
      drafting: 'Menyusun draf...',
      draftError: 'Belum bisa buat draf sekarang. Kamu tetap bisa tulis pesannya.',
      send: 'Kirim',
      cancel: 'Batal',
      invalid: 'Masukkan email yang valid.',
      error: 'Gagal mengirim. Coba lagi ya.',
      sent: 'Terkirim. Alief bakal balas ke emailmu.',
    },
  },
}
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim())

// Fit-check (P3-5). An explicit affordance a recruiter opens to paste a job
// description and get an honest, grounded read of how Alief fits. Copy follows
// the GREET/NOTICE pattern: en + id written, every other chat language falls
// back to en. The framing is deliberately honest, not salesy: the value is that
// it names gaps, so the copy promises exactly that and nothing more.
const FITCHECK_JD_MIN = 40   // too short to assess; nudge for more of the posting
const FITCHECK_JD_MAX = 6000 // matches the server cap; client truncates to match
const FITCHECK_COPY = {
  en: {
    entry: 'Check fit with a job description',
    close: 'Close',
    heading: 'Paste a job description',
    intro: 'You will get an honest read: where the portfolio matches, and where it has no evidence. It will not oversell.',
    placeholder: 'Paste the job posting here...',
    hint: 'Paste the full posting. Up to 6000 characters.',
    submit: 'Check the fit',
    checking: 'Reading the posting...',
    cancel: 'Cancel',
    userTurn: 'Check Alief against this job description.',
    tooShort: 'Paste a bit more of the posting so the check has something to work with.',
    error: 'Could not run the check right now. Please try again in a moment.',
    errorMode: 'The fit-check reads the portfolio, so switch the mode to Portfolio and try again.',
  },
  id: {
    entry: 'Cek kecocokan dengan lowongan',
    close: 'Tutup',
    heading: 'Tempel deskripsi lowongan',
    intro: 'Kamu bakal dapat penilaian jujur: bagian mana yang cocok dengan portofolio, dan mana yang belum ada buktinya. Nggak dilebih-lebihkan.',
    placeholder: 'Tempel isi lowongannya di sini...',
    hint: 'Tempel lowongan lengkapnya. Maksimal 6000 karakter.',
    submit: 'Cek kecocokan',
    checking: 'Membaca lowongan...',
    cancel: 'Batal',
    userTurn: 'Cek kecocokan Alief dengan lowongan ini.',
    tooShort: 'Tempel lowongannya sedikit lebih lengkap biar ada yang bisa dinilai.',
    error: 'Belum bisa menjalankan pengecekan sekarang. Coba lagi sebentar ya.',
    errorMode: 'Fit-check membaca portofolio, jadi ganti mode ke Portofolio lalu coba lagi.',
  },
  // ja/zh/ko/ar carry their native script, matching UI_TEXT / NOTICE. The mode
  // picker's "Portfolio" label stays the literal "Portfolio" in every language
  // (it is the feature name), so errorMode names that same literal the visitor
  // sees. First-pass copy; native-speaker review welcome later, as with the
  // consent notice.
  ja: {
    entry: '求人情報との相性をチェック',
    close: '閉じる',
    heading: '求人情報を貼り付けてください',
    intro: '正直な評価をお返しします。ポートフォリオと合う部分と、裏づけがない部分の両方をお伝えし、誇張はしません。',
    placeholder: '求人の内容をここに貼り付けてください...',
    hint: '求人の全文を貼り付けてください。最大6000文字です。',
    submit: '相性をチェック',
    checking: '求人を読んでいます...',
    cancel: 'キャンセル',
    userTurn: 'この求人情報とAliefの相性をチェックして。',
    tooShort: '評価できるように、求人の内容をもう少し貼り付けてください。',
    error: '今はチェックを実行できませんでした。少し待ってからもう一度お試しください。',
    errorMode: '相性チェックはポートフォリオを参照するので、モードを「Portfolio」に切り替えてもう一度お試しください。',
  },
  zh: {
    entry: '对照职位描述检查匹配度',
    close: '关闭',
    heading: '粘贴职位描述',
    intro: '你会得到一个诚实的评估：作品集在哪些地方匹配，哪些地方还没有证据，不会夸大。',
    placeholder: '把职位信息粘贴到这里...',
    hint: '粘贴完整的职位信息。最多6000个字符。',
    submit: '检查匹配度',
    checking: '正在阅读职位信息...',
    cancel: '取消',
    userTurn: '对照这份职位描述看看 Alief 的匹配度。',
    tooShort: '再多粘贴一点职位信息，这样才有内容可以评估。',
    error: '现在无法进行检查，请稍后再试。',
    errorMode: '匹配度检查需要读取作品集，请把模式切换到 Portfolio 后再试。',
  },
  ko: {
    entry: '채용 공고와 적합도 확인',
    close: '닫기',
    heading: '채용 공고를 붙여넣어 주세요',
    intro: '솔직한 평가를 드려요. 포트폴리오와 맞는 부분과 근거가 없는 부분을 모두 짚어 드리고, 부풀리지 않아요.',
    placeholder: '채용 공고 내용을 여기에 붙여넣어 주세요...',
    hint: '공고 전문을 붙여넣어 주세요. 최대 6000자예요.',
    submit: '적합도 확인',
    checking: '공고를 읽고 있어요...',
    cancel: '취소',
    userTurn: '이 채용 공고와 Alief의 적합도를 확인해 줘.',
    tooShort: '평가할 내용이 있도록 공고를 조금 더 붙여넣어 주세요.',
    error: '지금은 확인을 실행할 수 없어요. 잠시 후 다시 시도해 주세요.',
    errorMode: '적합도 체크는 포트폴리오를 참고하니, 모드를 Portfolio로 바꾼 뒤 다시 시도해 주세요.',
  },
  fr: {
    entry: "Vérifier l'adéquation avec une offre d'emploi",
    close: 'Fermer',
    heading: "Collez une offre d'emploi",
    intro: "Vous aurez un avis honnête : ce qui correspond au portfolio et ce qui n'a aucune preuve. Sans survente.",
    placeholder: "Collez l'offre d'emploi ici...",
    hint: "Collez l'offre complète. Jusqu'à 6000 caractères.",
    submit: "Vérifier l'adéquation",
    checking: "Lecture de l'offre...",
    cancel: 'Annuler',
    userTurn: "Évaluez l'adéquation d'Alief avec cette offre d'emploi.",
    tooShort: "Collez un peu plus de l'offre pour que le bilan ait de quoi travailler.",
    error: 'Impossible de lancer le bilan pour le moment. Réessayez dans un instant.',
    errorMode: "Le bilan d'adéquation lit le portfolio : passez le mode sur Portfolio et réessayez.",
  },
  de: {
    entry: 'Passung mit einer Stellenanzeige prüfen',
    close: 'Schließen',
    heading: 'Füge eine Stellenanzeige ein',
    intro: 'Du bekommst eine ehrliche Einschätzung: wo das Portfolio passt und wo es keine Belege gibt. Ohne Schönfärberei.',
    placeholder: 'Füge die Stellenanzeige hier ein...',
    hint: 'Füge die vollständige Anzeige ein. Bis zu 6000 Zeichen.',
    submit: 'Passung prüfen',
    checking: 'Anzeige wird gelesen...',
    cancel: 'Abbrechen',
    userTurn: 'Prüfe Aliefs Passung zu dieser Stellenanzeige.',
    tooShort: 'Füge etwas mehr von der Anzeige ein, damit die Prüfung etwas zum Arbeiten hat.',
    error: 'Die Prüfung lässt sich gerade nicht ausführen. Bitte versuch es gleich noch einmal.',
    errorMode: 'Der Fit-Check liest das Portfolio. Stelle den Modus auf Portfolio und versuch es erneut.',
  },
  ar: {
    entry: 'تحقق من التوافق مع وصف وظيفي',
    close: 'إغلاق',
    heading: 'الصق وصفاً وظيفياً',
    intro: 'ستحصل على تقييم صادق: أين يتوافق ملف الأعمال وأين لا يوجد دليل، بلا مبالغة.',
    placeholder: 'الصق إعلان الوظيفة هنا...',
    hint: 'الصق الإعلان كاملاً. حتى 6000 حرف.',
    submit: 'تحقق من التوافق',
    checking: 'جارٍ قراءة الإعلان...',
    cancel: 'إلغاء',
    userTurn: 'قيّم مدى توافق Alief مع هذا الوصف الوظيفي.',
    tooShort: 'الصق جزءاً أكبر من الإعلان حتى يكون هناك ما يمكن تقييمه.',
    error: 'تعذّر تشغيل الفحص الآن. يرجى المحاولة بعد لحظات.',
    errorMode: 'يعتمد فحص التوافق على قراءة ملف الأعمال، لذا بدّل الوضع إلى Portfolio ثم حاول مرة أخرى.',
  },
}

// Explicit chat-mode picker (PK-4). "Auto" keeps the detectMode heuristic; the
// other three force the mode the server already understands (portfolio runs the
// hybrid RAG routing, companion and english bypass it). Labels follow the
// GREET/NOTICE pattern: en + id written, every other chat language falls back to
// en. Order here is the pill order. "tip" is the hover/aria hint per option.
const CHAT_MODES = ['auto', 'portfolio', 'curhat', 'english']
const MODE_LABELS = {
  en: {
    label: 'Mode',
    auto: 'Auto', portfolio: 'Portfolio', curhat: 'Companion', english: 'English',
    tip: {
      auto: 'Alyx reads each message and picks the mode',
      portfolio: 'Answer from Alief\'s portfolio',
      curhat: 'A warm, listening companion chat',
      english: 'Practice English and get corrections',
    },
  },
  id: {
    label: 'Mode',
    auto: 'Auto', portfolio: 'Portofolio', curhat: 'Curhat', english: 'Inggris',
    tip: {
      auto: 'Alyx membaca tiap pesan dan memilih modenya',
      portfolio: 'Menjawab dari portofolio Alief',
      curhat: 'Teman ngobrol yang hangat dan mau mendengar',
      english: 'Latihan bahasa Inggris plus koreksi',
    },
  },
  // ja/zh/ko/ar carry their native script, matching UI_TEXT / NOTICE. "Portfolio"
  // stays the Latin feature name (the fit-check errorMode points visitors at that
  // same literal), "auto" and the companion mode are translated to their meaning,
  // and "english" takes each language's own name for English, as id does ("Inggris").
  // First-pass copy; native-speaker review welcome later.
  ja: {
    label: 'モード',
    auto: '自動', portfolio: 'Portfolio', curhat: '話し相手', english: '英語',
    tip: {
      auto: 'Alyxが各メッセージを読んでモードを選びます',
      portfolio: 'アリフのポートフォリオから回答します',
      curhat: '温かく話を聞く相手とのチャット',
      english: '英語を練習して添削を受けられます',
    },
  },
  zh: {
    label: '模式',
    auto: '自动', portfolio: 'Portfolio', curhat: '陪伴', english: '英语',
    tip: {
      auto: 'Alyx 读取每条消息并自动选择模式',
      portfolio: '根据 Alief 的作品集作答',
      curhat: '温暖倾听的陪伴聊天',
      english: '练习英语并获得纠正',
    },
  },
  ko: {
    label: '모드',
    auto: '자동', portfolio: 'Portfolio', curhat: '말벗', english: '영어',
    tip: {
      auto: 'Alyx가 메시지마다 읽고 모드를 고릅니다',
      portfolio: 'Alief의 포트폴리오를 바탕으로 답합니다',
      curhat: '따뜻하게 들어주는 말벗 대화',
      english: '영어를 연습하고 교정을 받아요',
    },
  },
  fr: {
    label: 'Mode',
    auto: 'Auto', portfolio: 'Portfolio', curhat: 'Compagnon', english: 'Anglais',
    tip: {
      auto: 'Alyx lit chaque message et choisit le mode',
      portfolio: "Répond à partir du portfolio d'Alief",
      curhat: "Une conversation chaleureuse à l'écoute",
      english: "S'entraîner en anglais et recevoir des corrections",
    },
  },
  de: {
    label: 'Modus',
    auto: 'Auto', portfolio: 'Portfolio', curhat: 'Begleiter', english: 'Englisch',
    tip: {
      auto: 'Alyx liest jede Nachricht und wählt den Modus',
      portfolio: 'Antwortet aus Aliefs Portfolio',
      curhat: 'Ein warmes, zuhörendes Begleitgespräch',
      english: 'Englisch üben und Korrekturen bekommen',
    },
  },
  ar: {
    label: 'الوضع',
    auto: 'تلقائي', portfolio: 'Portfolio', curhat: 'رفيق', english: 'الإنجليزية',
    tip: {
      auto: 'يقرأ Alyx كل رسالة ويختار الوضع',
      portfolio: 'يجيب من ملف أعمال Alief',
      curhat: 'محادثة رفيق دافئة تنصت إليك',
      english: 'تدرّب على الإنجليزية واحصل على تصحيحات',
    },
  },
}

// Scenario-practice chip copy (PK-7). English mode only. en + id are written; any
// other chat language falls back to en, matching the GREET/NOTICE/MODE pattern.
// PRACTICE_LEAD is the start of the visible user turn that kicks off a role-play
// ("Let's practice: <title>") and stays English: it is the message sent to the
// English tutor, and the scenario titles are English too.
const PRACTICE_LABELS = {
  en: { heading: 'Or practice a scenario', hint: 'Pick one, or just keep typing to chat freely.', active: 'Practicing', end: 'End scenario' },
  id: { heading: 'Atau coba satu skenario', hint: 'Pilih satu, atau tetap ketik buat ngobrol bebas.', active: 'Lagi latihan', end: 'Selesai' },
}
const PRACTICE_LEAD = "Let's practice"

// get_cv affordance copy (PK-18). en + id written, every other chat language
// falls back to en, matching the GREET/NOTICE pattern. The capture copy is
// honest: it asks, it never claims a verified download.
const CV_COPY = {
  en: {
    view: 'View CV',
    download: 'Download',
    captureLead: 'Want Alief to follow up? Leave your email.',
    emailLabel: 'Your email',
    send: 'Send',
    cancel: 'No thanks',
    invalid: 'Enter a valid email.',
    error: 'Could not send. Please try again.',
    sent: 'Thanks. Alief will be in touch.',
  },
  id: {
    view: 'Lihat CV',
    download: 'Unduh',
    captureLead: 'Mau Alief follow up? Tinggalkan emailmu.',
    emailLabel: 'Email kamu',
    send: 'Kirim',
    cancel: 'Nggak dulu',
    invalid: 'Masukkan email yang valid.',
    error: 'Gagal mengirim. Coba lagi ya.',
    sent: 'Makasih. Alief bakal menghubungi kamu.',
  },
}

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

// v8: cache entries carry { reply, citations } so a cache hit re-renders the
// citation chips (P2-4). Older v7 string entries are abandoned, not migrated.
const CACHE_KEY = 'alyx-llm-cache-v8'
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

// A fuzzy tree match needs both an absolute floor and that the matched words
// cover most of the query's own content words. Without the ratio, a specific
// question that merely shares 2 words with a scripted node (e.g. "Alief" + "data")
// was answered from a generic tree reply instead of reaching the server RAG.
const FUZZY_TREE_MIN_RATIO = 0.5
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
  return bestScore >= 2 && bestScore / tokens.length >= FUZZY_TREE_MIN_RATIO ? best : null
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

// ─── Head vs tail routing ────────────────────────────────────────────────────
// A "head" question is a bare/broad topic ask ("what are his skills?") that the
// canned topic dump answers completely. A "tail" question is longer/specific
// ("did Alief use Redis caching in the clinic project?") and must reach the
// server RAG for a grounded, cited answer. headTopicOf returns the topic for a
// head question, else null (-> fall through to RAG). HEAD_MAX_WORDS is a tunable
// threshold: at or below it a single dominant topic keyword is treated as bare.
const HEAD_MAX_WORDS = 5

// Curated head questions (the suggestion chips). A typed query that closely
// mirrors one of these is a head question regardless of length, so chip
// paraphrases longer than HEAD_MAX_WORDS still route to the canned dump.
const HEAD_CHIPS = [
  ...(chatbotKnowledge.suggestedQuestions || []),
  ...(chatbotKnowledge.suggestedQuestionsTree || []).map(n => n.question),
  ...UI_TEXT.en.suggestions,
].filter(Boolean).map(s => s.toLowerCase())

// Content words only (drop short glue words and punctuation) for overlap scoring.
const meaningfulTokens = (s) => s.toLowerCase().replace(/[?!.,'’]/g, ' ').split(/\s+/).filter(t => t.length > 3)

// True when the query shares enough content words with a curated chip to count
// as the same broad head question (>=3 shared words AND >=60% of the query's).
// A specific tail query shares few of its own words with any chip, so it fails.
const fuzzyMatchesHeadChip = (query) => {
  const qt = meaningfulTokens(query)
  if (qt.length < 3) return false
  for (const chip of HEAD_CHIPS) {
    const ct = new Set(meaningfulTokens(chip))
    if (!ct.size) continue
    const shared = qt.filter(t => ct.has(t)).length
    if (shared >= 3 && shared / qt.length >= 0.6) return true
  }
  return false
}

const headTopicOf = (query) => {
  // (a) Close paraphrase of a curated head chip -> its topic.
  if (fuzzyMatchesHeadChip(query)) {
    const t = findTopicByKeyword(query)
    if (t) return t
    if (isAboutAlief(query)) return 'about'
  }
  // (b) Short query with a single dominant topic keyword -> bare topic.
  const wordCount = query.trim().replace(/[?!.,]/g, ' ').split(/\s+/).filter(Boolean).length
  if (wordCount <= HEAD_MAX_WORDS) {
    const t = findTopicByKeyword(query)
    if (t) return t
    if (isAboutAlief(query)) return 'about'
  }
  return null
}

// ─── Follow-up detection (PK-2b) ─────────────────────────────────────────────
// A context-dependent follow-up ("tell me more about that", "why?") must bypass
// the portfolio client fast-paths (1a/1b/1c) and the history-blind localStorage
// cache so it reaches the server, where PK-2 builds the contextualized retrieval
// query from history. Without this, a follow-up matches a generic fast-path and
// returns the bio instead of elaborating on the prior answer.
//
// Referential / continuation cues (EN + a few ID). Multi-word phrases sit in the
// same alternation; \b keeps "it/this/that" whole-word so they don't fire inside
// a longer word. No /g flag -> test() is stateless.
const FOLLOWUP_CUES = /\b(that|it|this|those|these|them|they|there|more|else|also|another|again|elaborate|continue|go on|tell me more|what about|how about|why|itu|ini|lagi|lanjut|kenapa|terus|jelasin|lebih|selain itu)\b/i

// A short mid-conversation turn leans on prior context even without a cue word.
// Counted as plain whitespace tokens (not stopword-stripped) so an ordinary
// standalone question like "what are his skills" stays >3 and is NOT a follow-up.
const FOLLOWUP_MAX_TOKENS = 3

// baseMessages is [greeting, (user, assistant)*, currentUser]. The >=2 user-turn
// guard is the load-bearing one: a first question has exactly 1 user turn, so it
// can never be a follow-up and first-turn routing stays byte-identical to today.
const looksLikeFollowUp = (query, baseMessages) => {
  const userTurns = baseMessages.filter(m => m.role === 'user').length
  if (userTurns < 2) return false
  if (FOLLOWUP_CUES.test(query)) return true
  const tokens = query.trim().replace(/[?!.,;:]/g, ' ').split(/\s+/).filter(Boolean)
  return tokens.length <= FOLLOWUP_MAX_TOKENS
}

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
    { role: 'assistant', content: buildGreeting('en') }
  ])
  // Admin-configurable chatbot settings (model, prompt, toggles). Fetched once
  // from the API; null until loaded, in which case hardcoded defaults are used.
  const [settings, setSettings] = useState(null)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [currentSuggestions, setCurrentSuggestions] = useState(initialTree)

  // Explicit chat mode (PK-4). 'auto' defers to detectMode; any other value is
  // sent verbatim on every /api/chat call until the visitor changes it. Remembered
  // per viewer; a stray value falls back to 'auto'.
  const [chatMode, setChatMode] = useState(() => {
    try {
      const saved = localStorage.getItem('alyx-chat-mode')
      return CHAT_MODES.includes(saved) ? saved : 'auto'
    } catch { return 'auto' }
  })
  // Suggested-chip list expanded/collapsed (PK-6). Default expanded; remembered
  // per viewer. Only the chip list hides, the header with the toggle stays.
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(() => {
    try { return localStorage.getItem('alyx-suggestions-expanded') !== '0' } catch { return true }
  })

  // English-practice scenarios (PK-7). `englishScenarios` is null until the first
  // fetch on entering English mode (public GET /api/english-scenarios, which
  // returns id/category/title only, never the server-side briefs). `activeScenario`
  // holds the picked scenario object, or null for free-chat; `activeScenarioRef`
  // mirrors it so respondToQuery reads the live value without a stale closure. A
  // scenario only ever applies to English mode.
  const [englishScenarios, setEnglishScenarios] = useState(null)
  const [activeScenario, setActiveScenario] = useState(null)
  const activeScenarioRef = useRef(null)

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
  const [micLang, setMicLang] = useState('en-US')
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

  // Consent: whether the one-time notice was dismissed and whether the visitor
  // opted out of storage. optedOut drives `consent` on every /api/chat call.
  const [privacy, setPrivacy] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('alyx-privacy') || '{}')
      return { noticeDismissed: !!raw.noticeDismissed, optedOut: !!raw.optedOut }
    } catch { return { noticeDismissed: false, optedOut: false } }
  })
  const [noticeOpen, setNoticeOpen] = useState(() => {
    try { return !JSON.parse(localStorage.getItem('alyx-privacy') || '{}').noticeDismissed } catch { return true }
  })

  // Lead CTA (P3-2). `cta.hostIndex` is the message index that owns the one chip
  // shown this session (null until claimed); `dismissed` hides it after "not now".
  // `ctaForm` drives the inline email mini-form and the post-engage confirmation:
  // status is idle | invalid | sending | error, and `done` holds the one-line
  // confirmation shown in place of the offer after a successful engage.
  const [cta, setCta] = useState({ hostIndex: null, dismissed: false })
  // `hp` is the honeypot (P3-3): a hidden, offscreen field a human never sees and
  // a bot tends to fill. It is sent with the lead; the server silently drops a
  // submission when it is non-empty.
  const [ctaForm, setCtaForm] = useState({ open: false, email: '', note: '', hp: '', status: 'idle', done: '', drafting: false, draftError: '' })

  // Fit-check (P3-5). `open` toggles the JD panel; `status` is 'idle' | 'short' |
  // 'loading' | 'error'; `error` holds the resolved message line. The assessment
  // itself lands as an assistant message, not here.
  const [fitCheck, setFitCheck] = useState({ open: false, jd: '', status: 'idle', error: '' })

  // get_cv (PK-18). cvSettings resolves the managed CV + the capture toggle; it
  // starts on the static fallback so get_cv works before the fetch returns. The
  // capture is per-session-ish, keyed by the offering message index in cvCapture,
  // so each get_cv reply owns its own small, dismissible email field. status is
  // idle | invalid | sending | error; done holds the one-line confirmation.
  const [cvSettings, setCvSettings] = useState({ cvUrl: STATIC_CV_URL, previewUrl: '', pages: 0, leadCapture: false })
  const [cvCapture, setCvCapture] = useState({ hostIndex: null, email: '', hp: '', status: 'idle', done: '' })
  // Gated page-1 viewer (PK-25). When a gated CV exists (previewUrl set), the
  // get_cv reply offers a single "View CV" button that opens this instead of
  // handing over the full PDF; the fallback path keeps the inline view/download.
  const [cvViewerOpen, setCvViewerOpen] = useState(false)

  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const voiceReplyFlagRef = useRef(false)
  const messagesRef = useRef(messages)
  const respondToQueryRef = useRef(null)

  // One stable id per browser chat session, for server-side logging/memory in
  // later phases. S0-1 only passes it through.
  const sessionIdRef = useRef(null)
  if (!sessionIdRef.current) {
    try {
      let sid = localStorage.getItem('alyx-session-id')
      if (!sid) { sid = crypto.randomUUID(); localStorage.setItem('alyx-session-id', sid) }
      sessionIdRef.current = sid
    } catch { sessionIdRef.current = crypto.randomUUID() }
  }

  // LLM goes through the server /api/chat endpoint, always available in production.
  const llmMode = true

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
    { code: 'id-ID', cc: 'id', label: 'ID' },
    { code: 'en-US', cc: 'us', label: 'EN' },
    { code: 'ja-JP', cc: 'jp', label: 'JA' },
    { code: 'zh-CN', cc: 'cn', label: 'ZH' },
    { code: 'ko-KR', cc: 'kr', label: 'KO' },
    { code: 'fr-FR', cc: 'fr', label: 'FR' },
    { code: 'de-DE', cc: 'de', label: 'DE' },
    { code: 'ar-SA', cc: 'sa', label: 'AR' },
  ]

  // Short language code of the selected flag (id/en/ja/zh/ko/fr/de/ar) and its
  // localized UI strings. Drives the whole chatbox surface + reply language.
  const uiLang = UI_TEXT[micLang.split('-')[0]] ? micLang.split('-')[0] : 'en'
  const T = UI_TEXT[uiLang]
  // Consent notice follows the chat language (all 8 UI_TEXT langs), EN fallback.
  const N = NOTICE[uiLang] || NOTICE.en
  // ar is the only RTL code shipped. Drives both the notice and the message
  // bubble/chip mirroring (PK-3); every LTR language keeps its layout untouched.
  const isRtl = uiLang === 'ar'
  const noticeRtl = isRtl
  // Mode picker labels for the current chat language, en fallback (PK-4).
  const M = MODE_LABELS[uiLang] || MODE_LABELS.en
  // Scenario-practice labels for the current chat language, en fallback (PK-7).
  const P = PRACTICE_LABELS[uiLang] || PRACTICE_LABELS.en

  // Admin greeting override wins; otherwise the time-aware localized greeting.
  const greetingFor = (lang) => settings?.greeting?.trim() || buildGreeting(lang)
  const voiceAllowed = settings?.enable_voice !== false
  // Companion/english modes only exist when admin leaves the companion on; with it
  // off detectMode never leaves portfolio, so the mode picker would be dead (PK-4).
  const companionEnabled = settings?.enable_companion !== false

  // Load admin chatbot settings once. On failure, hardcoded defaults stay in use.
  useEffect(() => {
    const url = `${API_BASE}/api/chatbot`
    fetch(url).then((r) => r.ok ? r.json() : null).then((s) => { if (s && s.model) setSettings(s) }).catch(() => {})
  }, [])

  // Resolve the managed CV + capture toggle once (PK-18). Fails open to the
  // static fallback inside fetchCvSettings, so get_cv never breaks.
  useEffect(() => { fetchCvSettings().then(setCvSettings) }, [])

  // Apply a greeting override to a fresh conversation once settings arrive.
  useEffect(() => {
    if (settings?.greeting?.trim() && messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: settings.greeting.trim() }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  // When the flag changes on a fresh conversation (only the greeting shown),
  // swap the greeting + starter suggestions to the selected language.
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([{ role: 'assistant', content: greetingFor(uiLang) }])
      setCurrentSuggestions(uiLang === 'en' ? initialTree : T.suggestions.map(q => ({ question: q })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiLang])

  const FlagImg = ({ cc, label }) => (
    <img
      src={`https://flagcdn.com/w20/${cc}.png`}
      srcSet={`https://flagcdn.com/w40/${cc}.png 2x`}
      width="20"
      alt={label}
      className="rounded-sm object-cover"
      style={{ height: '14px', width: '20px' }}
    />
  )

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

    // Same site-action check as handleSend
    const isId = /\b(halo|hai|oke|ya|ke|buka|ganti|scroll|pergi|lihat|tampil|salin|unduh)\b/i.test(transcript)
    const siteAction = settings?.enable_site_actions === false ? null : detectSiteAction(transcript, isId)
    if (siteAction) {
      try { siteAction.action() } catch (e) { console.warn('[Alyx] Action failed:', e) }
      const reply = isId ? siteAction.reply.id : siteAction.reply.en
      const updated = [...newMessages, { role: 'assistant', content: reply, ...(siteAction.cvOffer ? { cvOffer: true } : {}) }]
      setMessages(updated)
      speak(reply, updated.length - 1)
      return
    }

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
    try { localStorage.setItem('alyx-privacy', JSON.stringify(privacy)) } catch {}
  }, [privacy])

useEffect(() => {
    try { localStorage.setItem('alyx-local-usage', JSON.stringify(localUsage)) } catch {}
  }, [localUsage])

  useEffect(() => {
    try { localStorage.setItem('alyx-chat-mode', chatMode) } catch {}
  }, [chatMode])

  useEffect(() => {
    try { localStorage.setItem('alyx-suggestions-expanded', suggestionsExpanded ? '1' : '0') } catch {}
  }, [suggestionsExpanded])

  // Load the scenario chips once, the first time the visitor opens English mode
  // (PK-7). Lazy so the public site never fetches them until they are needed; a
  // failure stays silent and simply leaves English as free-chat only.
  useEffect(() => {
    if (chatMode !== 'english' || englishScenarios !== null) return
    let cancelled = false
    fetch(`${API_BASE}/api/english-scenarios`)
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => { if (!cancelled && Array.isArray(list)) setEnglishScenarios(list) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [chatMode, englishScenarios])

  // Leaving English mode drops any active scenario, so switching to Portfolio or
  // Companion and back always starts clean at free-chat (PK-7).
  useEffect(() => {
    if (chatMode !== 'english' && activeScenarioRef.current) {
      activeScenarioRef.current = null
      setActiveScenario(null)
    }
  }, [chatMode])

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

    // Try native voices for the requested language first. If none exist,
    // prefer a multilingual/turbo voice (it can pronounce the target language
    // once utter.lang is set) before falling back to an English-only voice.
    const langPool  = availableVoices.filter(v => v.lang.toLowerCase().startsWith(lang))
    const multiPool = availableVoices.filter(v => /multilingual|turbo/i.test(v.name))
    const enPool    = availableVoices.filter(v => /^en/i.test(v.lang))
    const pool = langPool.length ? langPool
      : (lang !== 'en' && multiPool.length ? multiPool
      : (enPool.length ? enPool : availableVoices))

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
    // A non-English flag authoritatively sets the language (the reply is forced
    // to it), which is more reliable than sniffing the text — and covers French
    // and German, which detectLang can't tell apart from English.
    const lang  = uiLang !== 'en' ? uiLang : detectLang(clean)
    const voice = pickVoice(lang)
    const isTurbo = voice && /turbo|online.*natural/i.test(voice.name)
    // English voice path only: spell out data abbreviations so the TTS reads the
    // letters, not a mangled word (PK-5). Screen text (clean) is left untouched.
    const spoken = lang === 'en' ? spellOutAbbr(clean) : clean
    const chunks = spoken
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
      // Keep a native-matching voice's own tag; otherwise force the target
      // language so multilingual voices pronounce it correctly (e.g. Arabic).
      utter.lang = (voice && voice.lang.toLowerCase().startsWith(lang))
        ? voice.lang
        : (LANG_BCP[lang] || 'en-US')
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

  // No mode selector exists in the UI yet, so infer one from clear cues and
  // default to portfolio. Stopgap until a real mode toggle ships; the server
  // treats any unknown value as portfolio. When companion is admin-disabled we
  // never leave portfolio, matching the old behavior.
  const detectMode = (q) => {
    if (settings?.enable_companion === false) return 'portfolio'
    if (/\b(practice english|english practice|latihan (bahasa )?inggris|correct my (english|grammar)|grammar check|koreksi (bahasa )?inggris)\b/i.test(q)) return 'english'
    if (/\b(curhat|cerita dong|pengen cerita|temani|ngobrol santai|lagi (sedih|galau|capek|lelah|stress|stres|down)|sedih|galau|capek banget|lelah banget|kesepian|lonely|feeling (down|sad|low)|bad day|i(?:'m| am) (sad|tired|exhausted|lonely|depressed|stressed)|just (wanna|want to) (chat|talk)|vent)\b/i.test(q)) return 'curhat'
    return 'portfolio'
  }

  // POST to the server-authoritative endpoint and read its SSE stream. The server
  // owns the prompt and the model; we send the message, mode, language hint, and
  // recent history. onDelta receives the full accumulated reply each time it grows,
  // so the bubble can fill live. Pre-stream errors (budget/rate_limited/busy) still
  // arrive as a normal JSON response and throw here for the caller to handle.
  const sendToChat = async ({ message, history, mode, lang, scenario, onDelta }) => {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionIdRef.current,
        mode,
        message,
        lang,
        // Scenario id rides only on English turns (PK-7); the server validates it
        // against the curriculum and ignores an unknown id. Omitted everywhere else.
        ...(mode === 'english' && scenario ? { scenario } : {}),
        history: history.slice(-8).map(m => ({ role: m.role, content: m.content })),
        consent: !privacy.optedOut,
      }),
    })
    parseRateLimitHeaders(response.headers, setRateLimit)
    const ctype = response.headers.get('content-type') || ''
    if (!response.ok || !ctype.includes('text/event-stream') || !response.body) {
      if (response.status === 429) throw new Error('Chat API 429: rate_limited')
      const body = await response.text().catch(() => '')
      throw new Error(`Chat API ${response.status}: ${body.slice(0, 200)}`)
    }

    setLocalUsage(prev => {
      const today = new Date().toISOString().slice(0, 10)
      const base = prev.date === today ? prev : { date: today, requests: 0, tokens: 0 }
      return { date: today, requests: base.requests + 1, tokens: base.tokens }
    })

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buf = '', reply = '', meta = null, streamErr = null
    // A transport drop mid-stream rejects read(); keep the partial reply and mark
    // it interrupted here, so the caller does not discard it for the fallback.
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        let nl
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim()
          buf = buf.slice(nl + 1)
          if (!line.startsWith('data:')) continue
          let evt
          try { evt = JSON.parse(line.slice(5).trim()) } catch { continue }
          if (evt.type === 'delta' && evt.text) { reply += evt.text; onDelta?.(stripEmDash(reply)) }
          else if (evt.type === 'done') meta = evt.meta || null
          else if (evt.type === 'error') streamErr = evt.error || 'stream error'
        }
      }
    } catch {
      streamErr = streamErr || 'transport_drop'
    }
    return { reply: stripEmDash(reply), meta, streamErr }
  }

  const autoSpeakIfEnabled = (text, newMessagesLength, forceSpeak = false) => {
    if (!voiceAllowed) return // voice disabled by admin
    if (voiceEnabled || forceSpeak) {
      setTimeout(() => speak(text, newMessagesLength), 200)
    }
  }

  const respondToQuery = async (query, baseMessages, forceSpeak = false) => {
    // If voice input was used, always speak the reply back
    const shouldSpeak = forceSpeak || voiceReplyFlagRef.current
    voiceReplyFlagRef.current = false
    setIsTyping(true)

    // Effective chat mode (PK-4): computed ONCE here so the portfolio fast-path
    // and the server call cannot disagree. 'auto' (or companion off) defers to the
    // detectMode heuristic; any explicit pick overrides it. The canned/tree fast
    // path (1a/1b/1c) is portfolio-only: curhat and english skip straight to the
    // server so the picked mode is honored no matter how the question is worded.
    const mode = (chatMode === 'auto' || !companionEnabled) ? detectMode(query) : chatMode

    // PK-2b: a context-dependent follow-up in portfolio mode must skip the client
    // fast-paths (1a/1b/1c) and the history-blind localStorage cache so it reaches
    // the server's history-aware retrieval. Gated to portfolio so curhat/english
    // (already server-bound) are untouched, and to prior-conversation so a first
    // turn is never a follow-up (routing identical to today).
    const isFollowUp = mode === 'portfolio' && looksLikeFollowUp(query, baseMessages)

    // 1a. Try EXACT tree match (portfolio mode only; never for a follow-up)
    let node = (mode === 'portfolio' && !isFollowUp) ? findInTree(initialTree, query) : null

    // 1b. Portfolio scraping — if query is about Alief or portfolio topics,
    //     answer from chatbotKnowledge.topics directly. NO LLM CALL → saves quota.
    // Skip scraping for AI/ML questions so LLM can handle the denial via system prompt.
    const isAiMlQuery = /\b(ai|ml|machine\s*learn|deep\s*learn|neural|llm|gpt|artificial\s*intel|nlp|computer\s*vision|data\s*scien|tensorflow|pytorch|sklearn|scikit|ai\s*engineer|ml\s*engineer|build\s*model|train\s*model)\b/i.test(query)
    // Skip scraping for Indonesian queries — LLM must handle language mirroring.
    const isIndonesian = /\b(halo|hai|selamat|pagi|siang|sore|malam|terima|kasih|makasih|oke|iya|ya|nggak|gak|mau|bisa|bantu|tanya|coba|lihat|sama|juga|sudah|udah|belum|lagi|terus|bagus|baik|senang|info|lah|nih|kak|mas|pak|bu|saya|anda|kamu|lo|gue|dia|mereka|kita|kami|siapa|apa|apakah|bagaimana|gimana|berapa|kenapa|mengapa|kapan|dimana|cerita|tolong|boleh|dong|sih|yuk|tidak|bukan|dan|atau|dengan|untuk|dari|ke|di|yang|ini|itu|ada|punya|kerja|proyek|tentang|tahu|tau|kasih tau)\b/i.test(query)
    const isNonLatin = /[぀-ヿ㐀-䶿一-鿿가-힯؀-ۿ]/.test(query)
    const isNonEnglish = isIndonesian || isNonLatin
    // Canned topic dump fires ONLY for a bare-topic head question; specific/long
    // questions fall through to the server RAG so they get a grounded, cited
    // answer. chatbotKnowledge.topics is English-only, so a non-English head
    // question also falls through to RAG and is answered in the user's language
    // (no English leak). isAiMlQuery still skips so the LLM owns the denial.
    if (mode === 'portfolio' && !node && !isAiMlQuery && !isFollowUp) {
      const topic = headTopicOf(query)
      // PK-10: pick the canned dump by language. English (!isNonEnglish) keeps
      // topics[topic] byte-identical. An Indonesian-only query (Latin, not ja/zh/
      // ko/ar) gets topicsId[topic] when a template exists. Everything else (other
      // non-Latin, or ID with no ID template) stays null and falls through to RAG.
      const isIndonesianOnly = isIndonesian && !isNonLatin
      const cannedTopicText =
        !isNonEnglish ? chatbotKnowledge.topics?.[topic] :
        isIndonesianOnly ? chatbotKnowledge.topicsId?.[topic] :
        null
      if (topic && cannedTopicText) {
        await new Promise(r => setTimeout(r, 350))
        const reply = cannedTopicText
        // Canned lead cta (P3-2 gap). An availability/contact head question is
        // answered from chatbotKnowledge here with NO server turn, so the server's
        // done-meta cta never fires and the chip was lost. Mirror the server
        // mapping client-side on the same `cta` field the live path uses, so the
        // existing claim/gate effect (turn-floor, once-per-session, configured
        // destination) applies identically. This branch is already gated to
        // portfolio mode, so curhat/english can never produce a canned cta.
        // `context` carries the question for the no-conversation lead path (the
        // server redacts it); other canned topics get no chip.
        const cannedCta =
          topic === 'availability' ? { tier: 'hot', channel: 'booking', context: query } :
          topic === 'contact' ? { tier: 'warm', channel: 'email', context: query } :
          null
        const newMessages = [...baseMessages, { role: 'assistant', content: reply, cta: cannedCta }]
        setMessages(newMessages)
        setCurrentSuggestions(initialTree)
        setIsTyping(false)
        autoSpeakIfEnabled(reply, newMessages.length - 1, shouldSpeak)
        return
      }
    }

    // 1c. Fuzzy tree match — handle paraphrases before falling through to LLM
    if (mode === 'portfolio' && !node && !isFollowUp) {
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

    // 2. Try the server LLM — with localStorage cache to avoid re-burning quota on repeats.
    // A non-English flag sets the reply language; the English flag falls back to
    // detecting the language of the query, so typing Indonesian still replies in it.
    let lang = uiLang
    if (uiLang === 'en') {
      if (/[぀-ヿ]/.test(query)) lang = 'ja'
      else if (/[一-鿿㐀-䶿]/.test(query)) lang = 'zh'
      else if (/[가-힯]/.test(query)) lang = 'ko'
      else if (/[؀-ۿ]/.test(query)) lang = 'ar'
      else if (isIndonesian) lang = 'id'
    }
    // `mode` was resolved once at the top of respondToQuery (PK-4) and is reused
    // here, so the fast-path gate and this server call always agree on the mode.
    const normKey = mode + '|' + uiLang + '|' + query.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[?!.,]/g, '')
    // A follow-up skips the client cache entirely: its key (mode|lang|query) has
    // no history, so replaying it would leak an answer meant for a different prior
    // turn (the same leak PK-2 fixed server-side). Read is skipped here; write is
    // skipped below. Non-follow-up turns use the cache exactly as today (quota).
    const cache = loadCache()
    if (!isFollowUp && cache[normKey]) {
      await new Promise(r => setTimeout(r, 300))
      // v8 entries are { reply, citations }; tolerate any stray string entry.
      const hit = cache[normKey]
      const reply = typeof hit === 'string' ? hit : hit.reply
      const citations = typeof hit === 'string' ? null : (hit.citations || null)
      const newMessages = [...baseMessages, { role: 'assistant', content: reply, citations }]
      setMessages(newMessages)
      setIsTyping(false)
      autoSpeakIfEnabled(reply, newMessages.length - 1, shouldSpeak)
      return
    }

    if (llmMode) {
      try {
        // The assistant bubble appears on the first delta (replacing the typing
        // dots) and grows as more text streams in. Index is fixed: the assistant
        // row sits right after baseMessages.
        const replyIdx = baseMessages.length
        let started = false
        const onDelta = (full) => {
          if (!started) {
            started = true
            setIsTyping(false)
            setMessages([...baseMessages, { role: 'assistant', content: full }])
          } else {
            setMessages((prev) => { const c = prev.slice(); c[replyIdx] = { role: 'assistant', content: full }; return c })
          }
        }
        // Prior turns only; the current question goes in `message`.
        // Carry the active scenario id on English turns so the role-play stays on
        // the same scenario until the visitor ends it or picks another (PK-7). Read
        // from the ref to dodge a stale closure right after a chip is picked.
        const scenario = mode === 'english' ? (activeScenarioRef.current?.id || null) : null
        const { reply, meta, streamErr } = await sendToChat({ message: query, history: baseMessages.slice(0, -1), mode, lang, scenario, onDelta })

        if (reply) {
          // A broken stream keeps the partial text plus a short note.
          const note = streamErr ? (uiLang === 'id' ? '\n\n(koneksi terputus)' : '\n\n(connection interrupted)') : ''
          const finalText = reply + note
          // Citations ride the done meta and only exist on a complete grounded
          // portfolio answer (P2-4). A broken stream never carries them.
          const citations = !streamErr && meta && Array.isArray(meta.citations) ? meta.citations : null
          // Lead cta (P3-2) rides the live done meta only. It is intentionally not
          // cached below (decision D): the chip comes from a LIVE server turn, so a
          // cache-replay reply simply carries no chip. The claim/gate logic lives
          // in the effect that watches `messages`. `context` pins the question that
          // earned the chip (P3-3 BUG2) so the server recomputes the tier over it,
          // not over a later message like "thanks"; the canned path already does this.
          const liveCta = !streamErr && meta && meta.cta && CTA_CHANNELS.has(meta.cta.channel)
            ? { ...meta.cta, context: query }
            : null
          setMessages([...baseMessages, { role: 'assistant', content: finalText, citations, cta: liveCta }])
          if (!streamErr && !isFollowUp) { // cache only a complete, non-follow-up reply, with its citations
            const c = loadCache()
            c[normKey] = { reply, citations }
            const keys = Object.keys(c)
            if (keys.length > 50) delete c[keys[0]]
            saveCache(c)
          }
          setIsTyping(false)
          autoSpeakIfEnabled(reply, replyIdx, shouldSpeak)
          return
        }
        // Nothing streamed: fall through to the generic fallback below.
      } catch (err) {
        console.error('[Alyx] LLM call failed:', err)
        // Friendly message for 429 (rate limit) — otherwise fall through to generic fallback.
        if (String(err.message || '').includes('429')) {
          await new Promise(r => setTimeout(r, 300))
          const msg = T.aiBusy
          const newMessages = [...baseMessages, { role: 'assistant', content: msg }]
          setMessages(newMessages)
          setCurrentSuggestions(uiLang === 'en' ? initialTree : T.suggestions.map(q => ({ question: q })))
          setIsTyping(false)
          autoSpeakIfEnabled(msg, newMessages.length - 1, shouldSpeak)
          return
        }
        // fall through to generic fallback
      }
    } else {
      console.warn('[Alyx] LLM disabled.')
    }

    // 3. Fallback. Mode-aware (PK-7): portfolio keeps FALLBACK_MSG; english and
    // curhat get a neutral in-character line so a dropped turn (e.g. an empty
    // model completion that survived the server retry) never breaks a role-play
    // or a vent with portfolio talk.
    await new Promise(r => setTimeout(r, 400))
    const fallbackText = modeFallback(mode, uiLang) || T.fallback
    const newMessages = [...baseMessages, { role: 'assistant', content: fallbackText }]
    setMessages(newMessages)
    // In English mode leave the chips/suggestions as they are, so an active
    // scenario is not yanked back to the portfolio suggestion tree on a fallback.
    if (mode !== 'english') {
      setCurrentSuggestions(uiLang === 'en' ? initialTree : T.suggestions.map(q => ({ question: q })))
    }
    setIsTyping(false)
    autoSpeakIfEnabled(fallbackText, newMessages.length - 1, shouldSpeak)
  }

  // Keep refs fresh for speech recognition handler
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { respondToQueryRef.current = respondToQuery })

  // The destination for a cta channel, or '' when the admin left it blank. A
  // blank destination hides that channel's chip entirely (decision A).
  const ctaDestination = (channel) => {
    if (channel === 'booking') return settings?.calendly_url?.trim() || ''
    if (channel === 'sociabuzz') return settings?.sociabuzz_url?.trim() || ''
    // The public payload no longer carries the raw contact email (PK-24); it only
    // says whether the channel is on. The email chip opens an inline form that
    // submits via /api/lead, so this value only gates the chip and is never a URL.
    if (channel === 'email') return settings?.contact_email_enabled ? 'enabled' : ''
    return ''
  }

  // Claim the one CTA chip for this session (P3-2, decision C). Runs when a reply
  // arrives or settings load. Gates: once-per-session (sessionStorage flag and the
  // host already claimed), value-first turn-floor (the opening greeting does not
  // count toward the floor), a non-null cta on the latest reply, and a configured
  // destination for its channel. Only the most recent assistant message can be
  // claimed, so the chip always sits under the turn that earned it.
  useEffect(() => {
    if (cta.hostIndex !== null) return
    try { if (sessionStorage.getItem(CTA_FLAG) === '1') return } catch {}
    const idx = messages.length - 1
    const last = messages[idx]
    if (!last || last.role !== 'assistant' || !last.cta || !CTA_CHANNELS.has(last.cta.channel)) return
    // Turn-floor holds CTAs back from visitors still browsing. A fit-check chip
    // sets `bypassTurnFloor` because a pasted JD is already strong hire intent, so
    // it skips the floor; every other path (grounded/canned) still earns it.
    if (!last.cta.bypassTurnFloor) {
      const replies = messages.reduce((n, m, i) => n + (m.role === 'assistant' && i > 0 ? 1 : 0), 0)
      if (replies < CTA_TURN_FLOOR) return
    }
    if (!ctaDestination(last.cta.channel)) return
    setCta({ hostIndex: idx, dismissed: false })
    try { sessionStorage.setItem(CTA_FLAG, '1') } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, settings])

  // Best-effort lead write (P3-2, decision E). The server resolves the
  // conversation, recomputes the tier, and redacts context, so the client sends
  // only the channel, session id, optional email, and optional note. A failure is
  // swallowed: the funnel must never block the visitor's own action (the external
  // tab still opens). Returns the response ok flag for the email form to reflect.
  const postLead = async ({ channel, contactValue, context, message, honeypot = '' }) => {
    try {
      const res = await fetch(`${API_BASE}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          channel,
          honeypot,
          ...(contactValue ? { contact_value: contactValue } : {}),
          ...(context ? { context } : {}),
          ...(message ? { message } : {}),
        }),
      })
      return res.ok
    } catch { return false }
  }

  // Booking / mentoring: open the destination in a new tab, write the lead, then
  // replace the offer with a one-line confirmation. Email opens the inline form.
  const engageCta = (channel) => {
    const copy = (CTA_COPY[uiLang] || CTA_COPY.en)[channel]
    // Forward the question that earned this chip as context for every channel
    // (P3-3 BUG2). Both the canned and live paths now set cta.context to that
    // question; the host-turn user message is the fallback. The server redacts it,
    // uses it as the tier basis, and relies on it when no conversation exists.
    const context = messages[cta.hostIndex]?.cta?.context || messages[cta.hostIndex - 1]?.content || ''
    if (channel === 'email') { setCtaForm({ open: true, email: '', note: '', hp: '', status: 'idle', done: '', drafting: false, draftError: '' }); return }
    const url = ctaDestination(channel)
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    postLead({ channel, context })
    setCtaForm({ open: false, email: '', note: '', hp: '', status: 'idle', done: copy.opened, drafting: false, draftError: '' })
  }

  const dismissCta = () => setCta((s) => ({ ...s, dismissed: true }))

  // Ask the server to draft the handoff message (P3-4). The draft fills the
  // message box; the visitor then edits it freely. Graceful by design: any
  // failure leaves a short inline note and a working plain form, so the draft is
  // a convenience, never a dependency. Server-authoritative (it resolves the
  // conversation from the session and grounds the draft in the visitor's own
  // questions); the client sends only the session id.
  const requestDraft = async () => {
    const copy = (CTA_COPY[uiLang] || CTA_COPY.en).email
    setCtaForm((f) => ({ ...f, drafting: true, draftError: '' }))
    try {
      const res = await fetch(`${API_BASE}/api/lead/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionIdRef.current }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.draft) setCtaForm((f) => ({ ...f, note: data.draft, drafting: false, draftError: '' }))
      else setCtaForm((f) => ({ ...f, drafting: false, draftError: copy.draftError }))
    } catch {
      setCtaForm((f) => ({ ...f, drafting: false, draftError: copy.draftError }))
    }
  }

  // Email mini-form submit (P3-2, decision F). Validate locally for fast feedback,
  // then let the server be authoritative. On success swap to the sent confirmation.
  const submitEmailLead = async () => {
    const copy = (CTA_COPY[uiLang] || CTA_COPY.en).email
    const email = ctaForm.email.trim()
    if (!isValidEmail(email)) { setCtaForm((f) => ({ ...f, status: 'invalid' })); return }
    setCtaForm((f) => ({ ...f, status: 'sending' }))
    // The host chip carries the question that earned it (P3-3 BUG2), with the
    // host-turn user message as fallback. The message box (P3-4) is the handoff
    // body: send it as `message` for the email Alief receives, and keep it in
    // `context` too so the lead's stored summary and tier basis are unchanged.
    const earnedContext = messages[cta.hostIndex]?.cta?.context || messages[cta.hostIndex - 1]?.content || ''
    const message = ctaForm.note.trim()
    const context = [earnedContext, message].filter(Boolean).join(' | ')
    const ok = await postLead({ channel: 'email', contactValue: email, context, message, honeypot: ctaForm.hp })
    if (ok) setCtaForm({ open: false, email: '', note: '', hp: '', status: 'idle', done: copy.sent, drafting: false, draftError: '' })
    else setCtaForm((f) => ({ ...f, status: 'error' }))
  }

  // get_cv affordance (PK-18). View opens the managed CV (static fallback) in a
  // new tab; download forces a save. Both log a hashed signal row, never raw PII.
  const handleCvView = () => { logCv('view'); viewCv(cvSettings.cvUrl) }
  const handleCvDownload = (hostIndex) => {
    logCv('download')
    downloadCv(cvSettings.cvUrl) // never awaited: the download is not blocked
    // Soft lead capture (#2), gated by the admin toggle and OFF by default. Just
    // reveals the dismissible field; it reuses the P3 /api/lead path on submit.
    if (cvSettings.leadCapture) setCvCapture({ hostIndex, email: '', hp: '', status: 'idle', done: '' })
  }

  // Submit the optional CV follow-up (#2) through the EXISTING lead funnel. The
  // context names the real action and carries the "email" keyword the server's
  // earned-cta guard recomputes an email lead from, so the lead persists and the
  // P3-4 soft handoff fires. The download already happened; this never blocks it.
  const submitCvLead = async () => {
    const copy = CV_COPY[uiLang] || CV_COPY.en
    const email = cvCapture.email.trim()
    if (!isValidEmail(email)) { setCvCapture((f) => ({ ...f, status: 'invalid' })); return }
    setCvCapture((f) => ({ ...f, status: 'sending' }))
    const ok = await postLead({
      channel: 'email',
      contactValue: email,
      context: 'Downloaded the CV and asked Alief to follow up by email.',
      honeypot: cvCapture.hp,
    })
    if (ok) setCvCapture((f) => ({ ...f, email: '', hp: '', status: 'idle', done: copy.sent }))
    else setCvCapture((f) => ({ ...f, status: 'error' }))
  }

  const dismissCvCapture = () => setCvCapture((f) => ({ ...f, hostIndex: null, status: 'idle', done: '' }))

  // Run the fit-check (P3-5). Explicit, never auto-detected: the recruiter opens
  // the panel and pastes a JD. The request shows as a user turn so the thread
  // reads in order, then the grounded assessment arrives as an assistant message.
  // Server-authoritative (it resolves the conversation, retrieves, grounds, and
  // ASCII-normalizes); the client sends only the session id and the JD text. Any
  // failure rolls back the optimistic user turn and leaves an inline error, so a
  // failed check never strands a half-written turn in the thread.
  const submitFitCheck = async () => {
    const copy = FITCHECK_COPY[uiLang] || FITCHECK_COPY.en
    const jd = fitCheck.jd.trim()
    if (jd.length < FITCHECK_JD_MIN) { setFitCheck((f) => ({ ...f, status: 'short', error: copy.tooShort })); return }

    // Snapshot the thread before the optimistic user turn, so an error can roll
    // back to exactly this state.
    const before = messages
    const base = [...messages, { role: 'user', content: copy.userTurn }]
    setMessages(base)
    setFitCheck((f) => ({ ...f, status: 'loading', error: '' }))
    setIsTyping(true)

    try {
      const res = await fetch(`${API_BASE}/api/fitcheck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionIdRef.current, jd: jd.slice(0, FITCHECK_JD_MAX), lang: uiLang }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.assessment) {
        setIsTyping(false)
        setMessages(before)
        setFitCheck((f) => ({ ...f, status: 'error', error: res.status === 403 ? copy.errorMode : copy.error }))
        return
      }
      // A JD paste is strong hire intent, so attach a gentle booking chip to the
      // assessment, but only when a booking destination is configured. It rides
      // the same `cta` field + claim gate as the chat path (turn-floor, once per
      // session, dismissible), so it stays value-first and adds no new CTA logic.
      // The forwarded `context` names the real action (a recruiter running a JD
      // fit-check), which both reads honestly in the lead record and carries the
      // "recruiter" keyword the server recomputes the booking tier from, so the
      // lead actually persists instead of 400-ing as "no lead intent".
      // `bypassTurnFloor` lets this one chip skip the value-first turn-floor in the
      // claim gate (a JD paste is already the strongest hire-intent signal, so the
      // floor that holds CTAs back from browsers does not apply here). Every other
      // gate still runs: once per session, dismissible, destination-configured.
      const bookingReady = !!(settings?.calendly_url?.trim())
      const cta = bookingReady
        ? { tier: 'hot', channel: 'booking', context: 'Recruiter ran a job description fit-check.', bypassTurnFloor: true }
        : null
      const updated = [...base, { role: 'assistant', content: data.assessment, cta }]
      setMessages(updated)
      setIsTyping(false)
      setFitCheck({ open: false, jd: '', status: 'idle', error: '' })
      autoSpeakIfEnabled(data.assessment, updated.length - 1, false)
    } catch {
      setIsTyping(false)
      setMessages(before)
      setFitCheck((f) => ({ ...f, status: 'error', error: copy.error }))
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isTyping) return
    const query = input.trim()
    const userMessage = { role: 'user', content: query }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')

    // Check for site action first — zero quota, instant
    const isId = /\b(halo|hai|oke|ya|ke|buka|ganti|scroll|pergi|lihat|tampil|salin|unduh)\b/i.test(query)
    const siteAction = settings?.enable_site_actions === false ? null : detectSiteAction(query, isId)
    if (siteAction) {
      try { siteAction.action() } catch (e) { console.warn('[Alyx] Action failed:', e) }
      const reply = isId ? siteAction.reply.id : siteAction.reply.en
      const updated = [...newMessages, { role: 'assistant', content: reply, ...(siteAction.cvOffer ? { cvOffer: true } : {}) }]
      setMessages(updated)
      speak(reply, updated.length - 1)
      return
    }

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

  // Start an English role-play (PK-7). Set the ref first so the sendToChat call
  // inside respondToQuery carries the scenario id on this very turn, then post a
  // visible user turn that opens the role-play. English mode only.
  const startScenario = async (scenario) => {
    if (isTyping) return
    activeScenarioRef.current = scenario
    setActiveScenario(scenario)
    const query = `${PRACTICE_LEAD}: ${scenario.title}`
    const newMessages = [...messages, { role: 'user', content: query }]
    setMessages(newMessages)
    await respondToQuery(query, newMessages)
  }

  // Clear the scenario and return to free-chat English (PK-7). No message is sent;
  // the next turn simply carries no scenario id.
  const endScenario = () => {
    activeScenarioRef.current = null
    setActiveScenario(null)
  }

  // Scroll the portfolio to a cited section (P2-4). `section` always comes from
  // CITED_SECTIONS via the render guard, so getElementById hits a real node; the
  // extra guard is defensive. On a phone, or when the chat is maximized, the
  // window covers the page, so collapse it first, then scroll once the collapse
  // has painted, so the target actually lands in view.
  const scrollToSection = (section) => {
    if (!CITED_SECTIONS.has(section)) return
    const el = document.getElementById(section)
    if (!el) return
    const covers = maximized || (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 640px)').matches)
    if (covers) { setMaximized(false); setMinimized(true) }
    requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  // Normalize unicode the LLM may emit (dashes, arrows, comparisons, smart quotes) to plain ASCII
  const toAscii = (s) =>
    s
      .replace(/[‐‑‒–—―−]/g, '-')
      .replace(/…/g, '...')
      .replace(/[‘’‛]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/→/g, '->')
      .replace(/←/g, '<-')
      .replace(/↔/g, '<->')
      .replace(/≥/g, '>=')
      .replace(/≤/g, '<=')
      .replace(/≠/g, '!=')

  const renderMarkdown = (text) =>
    toAscii(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-primary/50 px-1 rounded text-accent-cyan text-xs">$1</code>')
      .replace(/^[•\-] /gm, '<span class="text-gray-500">-</span> ')
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
              {!llmMode && <span className="text-red-400 inline-flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />offline</span>}
              {llmMode && usagePctLabel && (
                <span className={`px-1 rounded text-[9px] ${usageBadgeClass}`}>{usagePctLabel}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {voiceAllowed && <>
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
          </>}
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
      {voiceAllowed && showVoiceSettings && !minimized && (
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
            Preview voice
          </button>
        </div>
      )}

      {!minimized && (
        <>
          {/* Consent notice + opt-out. Shown once; collapses to a reopenable line. */}
          {noticeOpen ? (
            <div dir={noticeRtl ? 'rtl' : undefined} className="shrink-0 bg-surface-card border-b border-surface-border px-4 py-3">
              <p dir="auto" className="text-xs text-gray-300 leading-relaxed">{N.body}</p>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={privacy.optedOut}
                  onClick={() => setPrivacy(p => ({ ...p, optedOut: !p.optedOut }))}
                  className="inline-flex items-center gap-2 text-[11px] font-mono text-gray-400 hover:text-white rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-purple/50"
                >
                  <span className={`relative inline-flex h-4 w-7 items-center rounded-full border transition-colors ${privacy.optedOut ? 'bg-accent-purple/30 border-accent-purple/50' : 'bg-primary border-surface-border'}`}>
                    <span className={`inline-block h-3 w-3 rounded-full transition-transform ${privacy.optedOut ? 'translate-x-3.5 bg-accent-purple' : 'translate-x-0.5 bg-gray-400'}`} />
                  </span>
                  <span dir="auto">{N.optOut}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setPrivacy(p => ({ ...p, noticeDismissed: true })); setNoticeOpen(false) }}
                  className="px-2.5 py-1 text-[11px] font-mono rounded border border-surface-border text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                >
                  {N.dismiss}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              dir={noticeRtl ? 'rtl' : undefined}
              onClick={() => setNoticeOpen(true)}
              className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 border-b border-surface-border text-[10px] font-mono text-gray-500 hover:text-accent-cyan transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
            >
              <i className="bi bi-shield-check leading-none" aria-hidden="true" />
              <span dir="auto">{privacy.optedOut ? `${N.privacy} - ${N.off}` : N.privacy}</span>
            </button>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-primary/40">
            {messages.map((msg, i) => (
              // RTL (ar): dir="rtl" on the row flips the flex axis so the avatar
              // and bubble mirror to the right; the bubble's pointed corner swaps
              // sides to match (PK-3). LTR languages pass dir=undefined, unchanged.
              <div key={i} dir={isRtl ? 'rtl' : undefined} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <BotAvatar size="sm" />}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? `bg-accent-purple/20 text-white border border-accent-purple/30 ${isRtl ? 'rounded-bl-md' : 'rounded-br-md'}`
                    : `bg-surface-card text-gray-200 border border-surface-border ${isRtl ? 'rounded-br-md' : 'rounded-bl-md'}`
                }`} dir="auto">
                  {msg.role === 'assistant' ? (
                    <>
                      {/* Assistant content comes from the LLM / RAG corpus, so a prompt
                          injection could smuggle raw HTML into the reply. renderMarkdown emits
                          only strong/em/code/span/br with class/dir, so we sanitize to exactly
                          that allowlist: legit formatting survives, any injected tag or attribute
                          (script, img, onerror, href, style) is stripped before it reaches the DOM. */}
                      <div dir="auto" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderMarkdown(msg.content), { ALLOWED_TAGS: ['strong', 'em', 'code', 'span', 'br'], ALLOWED_ATTR: ['class', 'dir'] }) }} />
                      {voiceAllowed && <button
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
                      </button>}
                      {Array.isArray(msg.citations) && (() => {
                        // Chips are built only from the section allowlist: label and
                        // scroll target both come from client maps, never chunk text.
                        const cites = msg.citations.filter((c) => c && CITED_SECTIONS.has(c.section))
                        if (!cites.length) return null
                        const labels = SECTION_LABELS[uiLang] || SECTION_LABELS.en
                        const goto = GOTO_LABEL[uiLang] || GOTO_LABEL.en
                        return (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span dir="auto" className="text-[10px] font-mono text-gray-500">
                              {(SOURCES_LABEL[uiLang] || SOURCES_LABEL.en) + ':'}
                            </span>
                            {cites.map((c) => {
                              const label = labels[c.section] || SECTION_LABELS.en[c.section]
                              return (
                                <button
                                  key={c.section}
                                  type="button"
                                  onClick={() => scrollToSection(c.section)}
                                  aria-label={`${goto} ${label}`}
                                  dir="auto"
                                  className="px-2 py-0.5 text-[11px] font-mono rounded border border-surface-border text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                                >
                                  {label}
                                </button>
                              )
                            })}
                          </div>
                        )
                      })()}
                      {/* get_cv affordance (PK-18). View opens the CV in a tab,
                          Download saves it. When the admin turned the capture on,
                          Download reveals a small, dismissible email field that
                          rides the existing lead funnel; it never blocks the save. */}
                      {msg.cvOffer && (() => {
                        const copy = CV_COPY[uiLang] || CV_COPY.en
                        const captureOpen = cvSettings.leadCapture && cvCapture.hostIndex === i
                        // Gated (PK-25): a single button opens the page-1 viewer,
                        // which owns the download + its own lead capture. No inline
                        // view/download handoff of the full PDF.
                        if (cvSettings.previewUrl) {
                          return (
                            <div dir="auto" className="mt-2.5">
                              <button
                                type="button"
                                onClick={() => setCvViewerOpen(true)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded border border-accent-cyan/40 text-accent-cyan hover:border-accent-cyan hover:bg-accent-cyan/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                              >
                                <i className="bi bi-eye" aria-hidden="true" /> {copy.view}
                              </button>
                            </div>
                          )
                        }
                        return (
                          <div dir="auto" className="mt-2.5 flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={handleCvView}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded border border-accent-cyan/40 text-accent-cyan hover:border-accent-cyan hover:bg-accent-cyan/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                              >
                                <i className="bi bi-eye" aria-hidden="true" /> {copy.view}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCvDownload(i)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded border border-surface-border text-gray-300 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                              >
                                <i className="bi bi-download" aria-hidden="true" /> {copy.download}
                              </button>
                            </div>

                            {cvCapture.done && cvCapture.hostIndex === i && (
                              <span className="text-[11px] font-mono text-accent-green">{cvCapture.done}</span>
                            )}

                            {captureOpen && !cvCapture.done && (
                              <div className="flex flex-col gap-2 rounded-lg border border-surface-border p-3">
                                <label className="flex flex-col gap-1">
                                  <span className="text-[11px] font-mono text-gray-500">{copy.captureLead}</span>
                                  <input
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    aria-label={copy.emailLabel}
                                    value={cvCapture.email}
                                    onChange={(e) => setCvCapture((f) => ({ ...f, email: e.target.value, status: f.status === 'invalid' ? 'idle' : f.status }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitCvLead() } }}
                                    placeholder="email@example.com"
                                    className="w-full px-2.5 py-1.5 text-[13px] rounded border border-surface-border bg-primary/60 text-gray-200 placeholder-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                                  />
                                </label>
                                {/* Honeypot (reuses the P3-3 pattern): offscreen, out of tab order,
                                    non-semantic name so autofill never touches it. Server drops any
                                    filled value. */}
                                <label style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
                                  Leave this field blank
                                  <input
                                    type="text"
                                    name="contact_ref_x"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    value={cvCapture.hp}
                                    onChange={(e) => setCvCapture((f) => ({ ...f, hp: e.target.value }))}
                                  />
                                </label>
                                {cvCapture.status === 'invalid' && <span className="text-[11px] font-mono text-red-400">{copy.invalid}</span>}
                                {cvCapture.status === 'error' && <span className="text-[11px] font-mono text-red-400">{copy.error}</span>}
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={submitCvLead}
                                    disabled={cvCapture.status === 'sending'}
                                    className="px-2.5 py-1 text-[11px] font-mono rounded border border-accent-cyan/40 text-accent-cyan hover:border-accent-cyan hover:bg-accent-cyan/10 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                                  >
                                    {cvCapture.status === 'sending' ? '...' : copy.send}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={dismissCvCapture}
                                    className="px-2.5 py-1 text-[11px] font-mono rounded text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                                  >
                                    {copy.cancel}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Lead CTA chip (P3-2). Shown under the one claimed host
                          message, from a LIVE cta only. Copy is gentle and lang
                          aware; the engage control reuses the plain citation-chip
                          look, the dismiss is a quiet text button. */}
                      {cta.hostIndex === i && !cta.dismissed && msg.cta && (() => {
                        const channel = msg.cta.channel
                        if (!ctaDestination(channel)) return null
                        const copy = (CTA_COPY[uiLang] || CTA_COPY.en)[channel]
                        const base = CTA_COPY[uiLang] || CTA_COPY.en
                        if (ctaForm.done) {
                          return (
                            <div dir="auto" className="mt-2.5 text-[11px] font-mono text-accent-green">{ctaForm.done}</div>
                          )
                        }
                        if (channel === 'email' && ctaForm.open) {
                          return (
                            <div dir="auto" className="mt-2.5 flex flex-col gap-2 rounded-lg border border-surface-border p-3">
                              <label className="flex flex-col gap-1">
                                <span className="text-[11px] font-mono text-gray-500">{copy.emailLabel}</span>
                                <input
                                  type="email"
                                  inputMode="email"
                                  autoComplete="email"
                                  value={ctaForm.email}
                                  onChange={(e) => setCtaForm((f) => ({ ...f, email: e.target.value, status: f.status === 'invalid' ? 'idle' : f.status }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submitEmailLead() } }}
                                  placeholder="email@example.com"
                                  className="w-full px-2.5 py-1.5 text-[13px] rounded border border-surface-border bg-primary/60 text-gray-200 placeholder-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                                />
                              </label>
                              {/* Honeypot (P3-3 BUG1): offscreen (not display:none, so a bot still
                                  fills it), out of the tab order. The name is deliberately non-semantic:
                                  "company" is a standard organization autofill token that Chrome/Edge
                                  could fill for a real person (a recruiter), silently dropping a valid
                                  lead. A nonsense name matches no profile field. A visually-hidden label
                                  tells a screen-reader user to skip it (clearer than aria-hidden on an
                                  input). Only a bot completes it; the server drops any filled value. */}
                              <label style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
                                Leave this field blank
                                <input
                                  type="text"
                                  name="contact_ref_x"
                                  tabIndex={-1}
                                  autoComplete="off"
                                  value={ctaForm.hp}
                                  onChange={(e) => setCtaForm((f) => ({ ...f, hp: e.target.value }))}
                                />
                              </label>
                              {/* Message to Alief (P3-4). Multiline and editable. The draft button
                                  asks the server to write a first-person starting point from the
                                  visitor's own questions; the visitor edits it freely. The field stays
                                  optional, so an email-only lead works exactly as it did in P3-2. */}
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[11px] font-mono text-gray-500">{copy.messageLabel}</span>
                                  <button
                                    type="button"
                                    onClick={requestDraft}
                                    disabled={ctaForm.drafting}
                                    className="px-2 py-0.5 text-[11px] font-mono rounded border border-surface-border text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                                  >
                                    {ctaForm.drafting ? copy.drafting : copy.draftAction}
                                  </button>
                                </div>
                                <textarea
                                  rows={4}
                                  value={ctaForm.note}
                                  onChange={(e) => setCtaForm((f) => ({ ...f, note: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitEmailLead() } }}
                                  placeholder={copy.notePlaceholder}
                                  className="w-full px-2.5 py-1.5 text-[13px] rounded border border-surface-border bg-primary/60 text-gray-200 placeholder-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 resize-y"
                                />
                                {ctaForm.draftError && <span className="text-[11px] font-mono text-gray-400">{ctaForm.draftError}</span>}
                              </div>
                              {ctaForm.status === 'invalid' && <span className="text-[11px] font-mono text-red-400">{copy.invalid}</span>}
                              {ctaForm.status === 'error' && <span className="text-[11px] font-mono text-red-400">{copy.error}</span>}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={submitEmailLead}
                                  disabled={ctaForm.status === 'sending'}
                                  className="px-2.5 py-1 text-[11px] font-mono rounded border border-accent-cyan/40 text-accent-cyan hover:border-accent-cyan hover:bg-accent-cyan/10 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                                >
                                  {ctaForm.status === 'sending' ? '...' : copy.send}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCtaForm({ open: false, email: '', note: '', hp: '', status: 'idle', done: '', drafting: false, draftError: '' })}
                                  className="px-2.5 py-1 text-[11px] font-mono rounded text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                                >
                                  {copy.cancel}
                                </button>
                              </div>
                            </div>
                          )
                        }
                        return (
                          <div dir="auto" className="mt-2.5 flex flex-col gap-1.5">
                            <span className="text-[11px] font-mono text-gray-500">{copy.lead}</span>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => engageCta(channel)}
                                className="px-2.5 py-1 text-[11px] font-mono rounded border border-accent-cyan/40 text-accent-cyan hover:border-accent-cyan hover:bg-accent-cyan/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                              >
                                {copy.action}
                              </button>
                              <button
                                type="button"
                                onClick={dismissCta}
                                aria-label={base.dismissAria}
                                className="px-1.5 py-1 text-[11px] font-mono rounded text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                              >
                                {base.dismiss}
                              </button>
                            </div>
                          </div>
                        )
                      })()}
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
              {/* Chevron collapses/expands the chip list (PK-6). The label itself
                  is the control for an easy target; the chevron rotates to show state. */}
              <button
                type="button"
                onClick={() => setSuggestionsExpanded(v => !v)}
                aria-expanded={suggestionsExpanded}
                dir="auto"
                className="flex items-center gap-1 mb-1.5 text-[10px] font-mono text-gray-500 hover:text-accent-cyan transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
              >
                <span>{T.suggestedLabel}</span>
                <svg
                  className={`w-3 h-3 transition-transform ${suggestionsExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {suggestionsExpanded && (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-hide">
                {currentSuggestions.map((node, idx) => (
                  <button
                    key={`${idx}-${node.question}`}
                    onClick={() => handleSuggestion(node)}
                    disabled={isTyping}
                    dir="auto"
                    className="px-2.5 py-1 bg-surface-card border border-surface-border rounded-full text-xs text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-all disabled:opacity-40"
                  >
                    {node.question}
                  </button>
                ))}
                {uiLang === 'en' && currentSuggestions !== initialTree && (
                  <button
                    onClick={() => setCurrentSuggestions(initialTree)}
                    className="px-2.5 py-1 text-xs text-accent-purple hover:text-accent-cyan transition-all"
                  >
                    ↺ reset
                  </button>
                )}
              </div>
              )}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-surface-border px-3 py-3 shrink-0 bg-surface-card">
            {/* Fit-check (P3-5). An explicit affordance, never auto-detected: the
                recruiter opens the panel and pastes a JD, and the grounded,
                honest assessment arrives as an assistant message. The panel is
                inline so it reuses the chat surface; loading shows in the thread
                as the normal typing dots, errors stay inline here. */}
            {(() => {
              const FC = FITCHECK_COPY[uiLang] || FITCHECK_COPY.en
              const loading = fitCheck.status === 'loading'
              if (!fitCheck.open) {
                return (
                  <button
                    type="button"
                    onClick={() => setFitCheck({ open: true, jd: '', status: 'idle', error: '' })}
                    disabled={isTyping}
                    dir="auto"
                    className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono rounded border border-surface-border text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8} aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h4m-7 4h10a2 2 0 002-2V7l-4-4H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>{FC.entry}</span>
                  </button>
                )
              }
              return (
                <div dir="auto" className="mb-2 flex flex-col gap-2 rounded-lg border border-surface-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-gray-200">{FC.heading}</span>
                      <span className="text-[11px] text-gray-500 leading-relaxed">{FC.intro}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFitCheck({ open: false, jd: '', status: 'idle', error: '' })}
                      aria-label={FC.close}
                      className="shrink-0 px-1.5 py-0.5 text-[11px] font-mono rounded text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                    >
                      {FC.close}
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    autoFocus
                    value={fitCheck.jd}
                    maxLength={FITCHECK_JD_MAX}
                    onChange={(e) => setFitCheck((f) => ({ ...f, jd: e.target.value, status: f.status === 'short' || f.status === 'error' ? 'idle' : f.status, error: '' }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { e.preventDefault(); setFitCheck({ open: false, jd: '', status: 'idle', error: '' }) }
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitFitCheck() }
                    }}
                    placeholder={FC.placeholder}
                    aria-label={FC.heading}
                    className="w-full px-2.5 py-1.5 text-[13px] rounded border border-surface-border bg-primary/60 text-gray-200 placeholder-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 resize-y"
                  />
                  <span className="text-[11px] font-mono text-gray-500">{FC.hint}</span>
                  {fitCheck.error && <span className="text-[11px] font-mono text-red-400">{fitCheck.error}</span>}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={submitFitCheck}
                      disabled={loading || !fitCheck.jd.trim()}
                      className="px-2.5 py-1 text-[11px] font-mono rounded border border-accent-cyan/40 text-accent-cyan hover:border-accent-cyan hover:bg-accent-cyan/10 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                    >
                      {loading ? FC.checking : FC.submit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFitCheck({ open: false, jd: '', status: 'idle', error: '' })}
                      disabled={loading}
                      className="px-2.5 py-1 text-[11px] font-mono rounded text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                    >
                      {FC.cancel}
                    </button>
                  </div>
                </div>
              )
            })()}
            {/* Mode picker (PK-4): Auto keeps detectMode; an explicit pick is sent
                on every message until changed. Hidden when the companion is off. */}
            {companionEnabled && (
              <div dir="auto" role="group" aria-label={M.label} className="mb-2 flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-mono text-gray-500 mr-0.5">{M.label}</span>
                {CHAT_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setChatMode(m)}
                    aria-pressed={chatMode === m}
                    title={M.tip[m]}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50 ${
                      chatMode === m
                        ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40'
                        : 'bg-primary/40 text-gray-400 border-surface-border hover:text-white'
                    }`}
                  >
                    {M[m]}
                  </button>
                ))}
              </div>
            )}
            {/* Scenario practice (PK-7): English mode only. A gentle set of chips
                that open a role-play; free-chat stays the default, so typing in
                the box works whether or not a scenario is picked. Reuses the
                suggestion-chip visual, no new palette. */}
            {companionEnabled && chatMode === 'english' && (
              activeScenario ? (
                <div dir="auto" className="mb-2 flex items-center gap-2 text-[10px] font-mono text-gray-500">
                  <span className="truncate">{P.active}: <span className="text-accent-cyan">{activeScenario.title}</span></span>
                  <button
                    type="button"
                    onClick={endScenario}
                    disabled={isTyping}
                    className="shrink-0 px-2 py-0.5 rounded border border-surface-border text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                  >
                    {P.end}
                  </button>
                </div>
              ) : Array.isArray(englishScenarios) && englishScenarios.length > 0 ? (
                <div dir="auto" className="mb-2">
                  <div className="flex items-baseline gap-1.5 mb-1.5 text-[10px] font-mono text-gray-500">
                    <span>{P.heading}</span>
                    <span className="text-gray-600">{P.hint}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto scrollbar-hide">
                    {englishScenarios.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => startScenario(s)}
                        disabled={isTyping}
                        className="px-2.5 py-1 bg-surface-card border border-surface-border rounded-full text-xs text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-all disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/50"
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            )}
            {voiceAllowed && speechSupported && (
              <div dir="auto" className="text-[10px] font-mono text-gray-500 mb-1.5 flex items-center gap-1.5">
                <i className="bi bi-info-circle-fill text-accent-green leading-none" />
                <span>{T.tip}</span>
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
                dir="auto"
                placeholder={isListening ? T.listening : T.placeholder}
                className="flex-1 px-4 py-2.5 bg-primary border border-surface-border rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent-purple/50 focus:ring-1 focus:ring-accent-purple/20 transition-all"
                disabled={isTyping || isListening}
              />
              {voiceAllowed && speechSupported && (
                <div className="flex items-center gap-1 shrink-0">
                  {/* Language cycle button */}
                  <button
                    onClick={() => {
                      const idx = MIC_LANGS.findIndex(l => l.code === micLang)
                      setMicLang(MIC_LANGS[(idx + 1) % MIC_LANGS.length].code)
                    }}
                    disabled={isListening}
                    className="px-1.5 py-1 rounded-lg bg-primary border border-surface-border text-[10px] font-mono text-gray-400 hover:text-accent-cyan hover:border-accent-cyan/40 transition-all disabled:opacity-30"
                    title={`Mic language: ${MIC_LANGS.find(l => l.code === micLang)?.label} · click to change`}
                  >
                    {(() => { const l = MIC_LANGS.find(x => x.code === micLang); return l ? <FlagImg cc={l.cc} label={l.label} /> : null })()}
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
                    title={`${isListening ? 'Stop' : 'Speak'} · ${MIC_LANGS.find(l => l.code === micLang)?.label}`}
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

      {/* Gated page-1 CV viewer (PK-25). Portals to <body>, so the ChatBot's own
          transform does not trap it; the get_cv reply toggles it open. */}
      <GatedCvViewer
        open={cvViewerOpen}
        onClose={() => setCvViewerOpen(false)}
        previewUrl={cvSettings.previewUrl}
        pages={cvSettings.pages}
        leadCapture={cvSettings.leadCapture}
        sessionId={sessionIdRef.current}
        lang={uiLang}
      />
    </div>
  )
}
