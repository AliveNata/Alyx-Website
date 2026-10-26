# Alief Akbar - Portfolio Website

> Full-stack personal portfolio for Alief Akbar, Data Engineer / BI, with a
> content-managed admin panel and a server-authoritative AI assistant named Alyx.

Live: alyxlabs.tech

---

## What it is

Not a static site. The portfolio is backed by a database and a small admin CMS, so
every section can be edited without touching code or redeploying. The Alyx chatbot runs
server-side: the browser sends a session id, a message, a language and a consent flag,
and the server assembles the prompt, retrieves context, calls the model and streams the
reply. The browser never assembles the prompt and never holds the model key.

```
Browser
  |
  |-- alyxlabs.tech            React (Vite) static site + /admin panel
  |        |
  |        '-- /api/*          Express API  ->  PostgreSQL (+ pgvector)
  |                                 |
  |                                 '-- Groq LLM + local embeddings
  |
  '-- The public site reads /api/portfolio at runtime, with bundled static
      data as a fallback, so it stays up even if the API is down.
```

### Chat flow (server-authoritative)

`POST /api/chat` is the single authoritative path:

1. The server resolves the mode (portfolio / companion / english-practice).
2. For portfolio mode it checks a semantic cache, then embeds the query locally and
   retrieves the top matching portfolio chunks from pgvector by cosine distance.
3. It builds a retrieval prompt that answers only from the retrieved context, or returns
   a not-sure reply when nothing clears the similarity threshold.
4. It streams the answer over SSE, with section-level citations derived server-side from
   the retrieved chunks (not emitted by the model).

Companion and english-practice modes bypass retrieval by design.

---

## Features

### Public portfolio
- Live content: Hero, Skills, Projects, Experience, Recognition, Contact all render from
  the API, with static fallback data baked in.
- Three themes (code / dark / light), dynamic years of experience.
- Preloader boot sequence + particle canvas.
- Contact form posted server-side (`POST /api/contact`) with a rotating anti-bot token
  and a honeypot; forwarded to the configured endpoint and emailed to the owner.

### Alyx AI chatbot
- Server-authoritative chat over `POST /api/chat`, streamed via SSE.
- RAG grounded in the live portfolio data (pgvector), with section-level citations.
- Semantic cache for repeated portfolio questions.
- Three modes: portfolio Q&A, companion chat, English practice (with scenario prompts).
- Multi-language UI and replies, time-aware greeting, Arabic RTL, flag-driven voice.
- Honest fit-check: paste a job description and get a strengths-and-gaps read grounded
  only in portfolio evidence, with explicit "no evidence in the portfolio" gaps.
- Live model token/rate-limit telemetry; per-session and per-IP daily token budget.

### Lead funnel
- Explicit-intent detection only (no behavior scoring): a hire / booking / mentoring /
  contact message surfaces a single, dismissible CTA chip.
- Leads stored in their own table (separate retention from conversations), with an admin
  Leads inbox and status lifecycle.
- Hot leads trigger an email notification (SMTP-gated, best-effort).
- Optional AI-drafted first-person handoff message to the owner.

### CV management + gated page-1 viewer
- Admin uploads a PDF; the server renders page 1 to a public PNG teaser, counts the
  pages and moves the full PDF to a private directory outside the web path.
- The public viewer shows page 1 plus one tracked download path. The full PDF streams
  only through a rate-limited endpoint that logs a hashed view/download row.
- Honest by design: this is friction and tracking, not DRM, not a lock.
- Optional, non-blocking email capture on download (default OFF).

### Admin panel (`/admin`)
- CRUD CMS for Personal info, Skills, Projects, Experience, Awards, Certificates, with
  pagination, reorder and per-row tooltips.
- Icon picker with live preview and upload.
- Chatbot settings (model, temperature, tokens, system prompt, greeting, toggles) plus a
  prompt playground and version history.
- Analytics dashboard: KPI tiles and hand-rolled SVG charts over the chat logs, plus a
  CV view/download card.
- Leads inbox and changelog / GitHub mirror.
- Security: single-session login, email-verified password change, forgot/reset flow,
  idle auto-logout, rate limiting.

### Logging and privacy
- Chat turns logged with email / phone / handle redacted; IP and user agent hashed with
  HMAC-SHA256 (keyed by a salt). Companion-mode and opted-out content is not stored.
- Consent notice and opt-out, bilingual then extended to the eight UI languages.
- Retention and analytics-refresh handled by scheduled OS cron jobs.

### Security hardening
- Dependencies patched (multer 2.x, react-router 7.x, and advisory bumps on the Express
  and nodemailer chains).
- Chat and README HTML sanitized with DOMPurify (tight allowlist).
- Upload allowlist is images-only for CMS assets (no SVG) and PDF-only for the CV, each
  with its own size cap; `/uploads` served with `X-Content-Type-Options: nosniff`.
- Security headers / CSP, and rate limits on the public endpoints.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3, React Router 7 |
| Icons | Bootstrap Icons, Devicon (subset), Simple Icons |
| API | Node.js, Express, PostgreSQL (`pg`) + pgvector |
| Auth | JWT + bcrypt, single active session, email-verified reset (Nodemailer) |
| AI chat | Groq (`openai/gpt-oss-20b`) via a server-side route |
| Embeddings | Local, in-process (`@huggingface/transformers`, multilingual e5-small, q8) |
| CV render | pdf-to-img (pdfjs + prebuilt canvas), pure JS, no system packages |
| Sanitizing | DOMPurify |
| Hosting | VPS (nginx + Node + Postgres) |

---

## Project structure

```
src/
  components/        # Public site: Hero, Skills, Projects, Experience, ChatBot, Navbar,
                     #   GatedCvViewer, ...
  admin/             # Admin panel: login, dashboard, CRUD, settings, Analytics, Leads
  lib/               # apiBase, PortfolioContext (fetch + fallback), cv, experience helper
  data/portfolio.js  # Static fallback content
  App.jsx / main.jsx # Public app + routing (public vs /admin)
  index.css

server/              # Express + PostgreSQL API
  src/               # routes + logic: auth, crud, portfolio, chat, groq, retrieve,
                     #   embed, reindex, cache, intent, lead, contact, cv, cvRender,
                     #   settings, redact, mailer, ...
  schema.sql         # database schema
  src/{migrate,seed}.js

public/icons/        # custom SVG logos
```

---

## Local development

### Frontend
```bash
git clone https://github.com/AliveNata/Alyx-Website.git
cd Alyx-Website
npm install
npm run dev            # http://localhost:5173  (/admin for the panel)
npm run build          # production build
```

Optional frontend `.env`: `VITE_API_URL` points at the API (defaults to the local API in
dev, same origin in production). `VITE_CONTACT_SHEET_URL` is an optional fallback for the
contact form endpoint.

### API + database
```bash
cd server
npm install
cp .env.example .env   # DATABASE_URL, JWT_SECRET, ADMIN_*, GROQ_API_KEY, LOG_HASH_SALT,
                       #   SMTP_*, and the chatbot / lead settings
npm run migrate        # create / update tables (includes pgvector + CV columns)
npm run seed           # seed content + the first admin user
npm run reindex        # embed the portfolio corpus into pgvector
npm start              # http://localhost:4000
```

Postgres needs the `pgvector` extension available. A docker-compose Postgres 18 is used
for dev parity. Local embeddings load in-process on first use; set `EMBED_WARM_ON_BOOT=1`
to warm them at startup.

Deployment (VPS: nginx + Node + Postgres) is documented separately. Do not commit
secrets; all keys and endpoints live in the server environment.

---

## Changelog

### v4.0.0 - Ask Alyx AI: server-authoritative chat, RAG, lead funnel
- Chat moved fully server-side (`POST /api/chat`): the server assembles the prompt,
  retrieves context and streams the reply over SSE; the browser never holds the model
  key or the prompt.
- RAG over pgvector with section-level citations and a semantic cache; an honest
  fit-check that reads a pasted job description against portfolio evidence only.
- Explicit-intent lead funnel: a single CTA chip, a leads inbox, hot-lead email
  notifications, and an optional AI-drafted handoff message.
- CV management with a gated page-1 viewer: a public page-1 image, the full PDF kept
  private and streamed only through a rate-limited, logged download.
- Privacy-preserving logging (redaction + HMAC-hashed IP / user agent + consent) and an
  analytics dashboard.
- Security hardening: dependency patches, DOMPurify sanitizing, image / PDF upload
  allowlists, CSP and rate limits.

### v3.0.0 - Full-stack + admin CMS
- Express + PostgreSQL API; the public site reads content live with a static fallback.
- Admin panel (`/admin`): CRUD for every section, image upload, chatbot + site settings,
  GitHub changelog mirror.
- Auth: JWT single-session, email-verified password change, forgot/reset, idle
  auto-logout, rate limiting.
- Chatbot moved to a server-side route (key never in the browser); 8-language UI +
  replies, time-aware greeting, Arabic RTL, flag-driven voice.
- Security headers (HSTS, CSP, X-Frame-Options, ...) and hardening.

### v2.1.0
- Preloader boot sequence; language-aware chatbot; `$ get_cv` button; Telegram
  CV-download notifications.

### v2.0.0
- Full UI overhaul (Bootstrap Icons / Devicons / Simple Icons), Alyx AI chatbot, 3
  themes, experience tabs, dynamic years, contact form.

---

## License

Copyright (c) 2026 Alief Akbar. All rights reserved.

This repository is published for portfolio and reference purposes. You are welcome to
read the code, but it is not licensed for reuse, redistribution, or use as a template
without written permission.
