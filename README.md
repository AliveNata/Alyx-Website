# Alief Akbar — Portfolio Website

> Personal portfolio website for **Alief Akbar**, Data Engineer & BI Analyst.  
> Built with React 18 + Vite + Tailwind CSS, featuring an AI-powered chatbot assistant named **Alyx**.

🌐 **Live:** [alyx-website.netlify.app](https://alyx-website.netlify.app) *(update with your actual URL)*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Icons | Bootstrap Icons, Devicons, Simple Icons |
| AI Chat | Groq API (LLaMA 3.1) |
| Voice | Web Speech API (Microsoft Azure Neural / OpenAI Turbo voices) |
| Deployment | Netlify |

---

## Features

### Portfolio Sections
- **Hero** — Animated intro with dynamic years of experience, theme-aware gradient photo overlay
- **About** — Bio, background, and personal summary
- **Skills** — Tech stack with brand-accurate icons (Devicons + Simple Icons + local SVG)
- **Projects** — Showcase of key data engineering & BI projects
- **Experience** — Timeline with IT / Freelance / Non-IT tabs, show more/less per tab
- **Contact** — JWT-style token verification form, social links, availability status

### Alyx AI Chatbot
- **Groq LLM** (LLaMA 3.1-8b) with portfolio grounding — answers questions about Alief's skills, experience, and projects
- **Suggestion tree** — Clickable quick questions organized by topic
- **Voice output** — Text-to-speech with smart voice selection: prioritizes **OpenAI Turbo voices** (Nova, Shimmer, Onyx) via Microsoft Azure Edge neural engine
- **Voice presets** — Gender (Female / Male), Tone (Human / Anime / Orc), Age (Child / Young / Adult / Elder)
- **Speech input** — Voice recognition for hands-free questions
- **Modes** — Portfolio assistant / Curhat (casual chat) / English Practice
- **LLM response cache** — localStorage cache to avoid duplicate API calls
- **Rate limit display** — Real-time Groq API quota shown in header
- **Drag & resize** — Draggable, minimizable, maximizable chat window
- **Persistent memory** — Conversation history maintained across session

### UI / UX
- **3 themes** — Code (default dark), Dark (slate), Light
- **Neon pulse button** — "Ask Alyx AI" pill with cyan glow animation
- **Smart positioning** — Chat button automatically rises above footer when scrolling to bottom
- **Glitter animation** — Close pill ↔ Header X transition with scale + glow effect
- **Scroll-triggered animations** — Section fade-in via IntersectionObserver

---

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx        # Navigation + theme switcher
│   ├── Hero.jsx          # Landing section with photo
│   ├── About.jsx         # Bio section
│   ├── Skills.jsx        # Tech stack grid with SkillIcon component
│   ├── Projects.jsx      # Project cards
│   ├── Experience.jsx    # Timeline + Awards/Certificates
│   ├── Contact.jsx       # Contact form with token verification
│   ├── ChatBot.jsx       # Alyx AI assistant (full-featured)
│   └── Footer.jsx
├── data/
│   └── portfolio.js      # Single source of truth for all content
├── App.jsx               # Root layout + chat toggle logic
├── main.jsx              # Entry point + CSS imports
└── index.css             # Global styles, theme overrides, animations

public/
└── icons/                # Custom SVGs: dbt, Looker, Tableau, Power BI, Hive
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/AliveNata/Alyx-Website.git
cd Alyx-Website
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

> Get a free API key at [console.groq.com](https://console.groq.com)

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

---

## What's New in v2.0

### 🎨 UI Overhaul
- Migrated all icons to **Bootstrap Icons**, **Devicons**, and **Simple Icons** for brand-accurate tech logos
- **3 themes** — Code (default), Dark (slate), Light — with theme-aware hero photo gradients
- Light theme hero text gets a **white blur glow** for readability over the background photo
- Compact **neon pulse** "Ask Alyx AI" button that lifts above the footer when scrolling down
- **Glitter animation** when the Close pill transitions to the chatbox header X button (and back)

### 💬 Alyx AI Chatbot (New)
- Full AI assistant powered by **Groq LLaMA 3.1** with portfolio grounding
- **Suggestion tree** — quick-click topic questions
- **Voice output** with smart voice scoring: prioritizes **OpenAI Turbo voices** (Nova, Shimmer, Onyx) served via Microsoft Azure Edge — closest to ChatGPT/Gemini voice quality
- **Voice presets** — Gender, Tone (Human / Anime / Orc), Age (Child → Elder)
- **Active voice display** — shows which voice engine is currently selected
- **Speech input** — hands-free mic mode with voice recognition
- **3 chat modes** — Portfolio Q&A / Curhat (casual) / English Practice
- **LLM response cache** — avoids duplicate API calls via localStorage
- **Rate limit display** — live Groq API quota in chatbox header
- **Drag, minimize, maximize** — fully interactive floating window

### 📋 Portfolio Sections
- **Experience tabs** — IT / Freelance / Non-IT, each shows 3 latest entries + Show More button
- **Dynamic years** — auto-updates every year
- **Contact form** — JWT-style token verification before sending
- Location updated to **APAC (Asia Pacific)**

---

## Chatbot — Alyx

Alyx uses **Groq's LLaMA 3.1-8b-instant** model with a portfolio grounding system prompt. It supports three modes:

| Mode | Trigger |
|---|---|
| Portfolio Assistant | Default — answers questions about Alief |
| Curhat / Casual Chat | Emotional / personal messages |
| English Practice | User asks to practice English |

Voice output leverages **Microsoft Azure Neural voices** available in Edge/Chrome, with automatic scoring to prioritize the highest-quality voices (OpenAI Turbo tier > Multilingual Natural > Online Natural > local).

---

## Changelog

### v2.0.0
- Full UI overhaul with Bootstrap Icons, Devicons, and Simple Icons
- Alyx AI chatbot with Groq LLM, voice presets, suggestion tree, and drag/resize
- Multi-theme support (Code / Dark / Light) with theme-aware gradients
- Experience section tabs with show more/less per category
- Smart chat button positioning (lifts above footer)
- Glitter animation for Close pill ↔ Header X transition
- OpenAI Turbo voices prioritization for human-like TTS
- Voice loading polling fix for Microsoft Edge online voices
- Dynamic years of experience calculation
- JWT-style contact form token verification

---

## License

MIT — feel free to use as a template. Attribution appreciated!

---

*Made with ☕ and too many data pipelines.*
