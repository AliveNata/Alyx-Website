# Alief Akbar - Portfolio Website

> Full-stack personal portfolio for **Alief Akbar**, Data Engineer & BI Analyst - with a
> content-managed admin panel and an AI assistant named **Alyx**.

🌐 **Live:** [alyxlabs.tech](https://alyxlabs.tech)

---

## Architecture

Not just a static site - the portfolio is backed by a database and a small admin CMS,
so every section can be edited without touching code or redeploying.

```
Browser
  |
  |-- alyxlabs.tech            React (Vite) static site + /admin panel
  |        |
  |        '-- /api/*          Express API  ->  PostgreSQL
  |
  '-- The public site reads /api/portfolio at runtime, with the bundled
      static data as a fallback, so it stays up even if the API is down.
```

- **Frontend** - React 18 + Vite + Tailwind. Public portfolio + `/admin` panel (same app, client-side routed).
- **API** - Node + Express + PostgreSQL. JWT auth, CRUD for all content, image upload, chatbot config, GitHub changelog mirror.
- **Chatbot proxy** - Alyx talks to Groq through a server route, so the API key never ships to the browser.
- **Deploy** - runs all-in-one on a VPS (nginx + Node + Postgres), or hybrid (frontend on Netlify, API on the VPS).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3, React Router |
| Icons | Bootstrap Icons, Devicons, Simple Icons |
| API | Node.js, Express, PostgreSQL (`pg`) |
| Auth | JWT + bcrypt, single active session, email-verified password reset (Nodemailer) |
| AI Chat | Groq (`openai/gpt-oss-20b`) via a server-side proxy |
| Voice | Web Speech API (flag-driven language + voice presets) |
| Hosting | VPS (nginx + pm2) all-in-one, or Netlify + VPS hybrid |

---

## Features

### Public portfolio
- **Live content** - Hero, Skills, Projects, Experience, Recognition, Contact all render from the API (static fallback baked in).
- **Dynamic years of experience** - auto-increments each year.
- **3 themes** - Code (default dark), Dark, Light - with theme-aware gradients.
- **Preloader** - boot-sequence terminal + particle canvas.
- **CV download -> Telegram** - owner gets a real-time alert (time, geo, IP, browser, OS) on every download.

### Admin panel (`/admin`)
- **CRUD CMS** for Personal info, Skills, Projects, Experience, Awards, Certificates - with pagination, reorder, and per-row tooltips.
- **Icon picker** - live preview + upload / drag-and-drop for skill logos.
- **Chatbot settings** - model, temperature, tokens, system prompt, greeting, and feature toggles, all editable.
- **Changelog + GitHub** - mirror commits/releases from the repo into the changelog with one click (README rendered inline).
- **Site settings** - contact endpoint + Telegram chat id, editable in-app (secrets stay in server env).
- **Security** - single-session login, email-verified password change, forgot/reset flow, 5-minute idle auto-logout, rate limiting.

### Alyx AI chatbot
- **Groq LLM** grounded in the live portfolio data.
- **8-language UI + replies** driven by the mic flag (ID, EN, JA, ZH, KO, FR, DE, AR), time-of-day-aware greeting, Arabic RTL.
- **Voice** - text-to-speech that follows the selected flag language, plus mic input.
- **Modes** - Portfolio Q&A / casual chat / English practice.
- **Rate-limit display** - live Groq quota in the header.
- **Draggable / resizable** floating window.

---

## Project Structure

```
src/
├── components/        # Public site: Hero, Skills, Projects, Experience, ChatBot, ...
├── admin/             # Admin panel: login, dashboard, CRUD, chatbot/site settings
├── lib/               # apiBase, PortfolioContext (fetch + fallback), experience helper
├── data/portfolio.js  # Static fallback content
├── App.jsx / main.jsx # Public app + routing (public vs /admin)
└── index.css

server/                # Express + PostgreSQL API
├── src/               # routes: auth, crud, portfolio, chatbot, github, settings, groq, cv-notify
├── schema.sql         # database schema
└── src/{migrate,seed}.js

public/icons/          # custom SVG logos
```

---

## Getting Started

### Frontend
```bash
git clone https://github.com/AliveNata/Alyx-Website.git
cd Alyx-Website
npm install
npm run dev            # http://localhost:5173  (/admin for the panel)
```

Optional `.env` (frontend): `VITE_API_URL` points at the API (defaults to the local API in
dev, and to the same origin in production). `VITE_CONTACT_SHEET_URL` is an optional fallback
for the contact form endpoint.

### API + database
```bash
cd server
npm install
cp .env.example .env   # set DATABASE_URL, JWT_SECRET, ADMIN_*, GROQ_API_KEY, TELEGRAM_*, SMTP_* ...
npm run migrate        # create tables
npm run seed           # seed content + the first admin user
npm start              # http://localhost:4000
```

Deployment (VPS all-in-one or Netlify hybrid) is documented separately.

---

## Changelog

### v3.0.0 - Full-stack + admin CMS
- Express + PostgreSQL API; the public site reads content live with a static fallback.
- Admin panel (`/admin`): CRUD for every section, image upload, chatbot + site settings, GitHub changelog mirror.
- Auth: JWT single-session, email-verified password change, forgot/reset, idle auto-logout, rate limiting.
- Chatbot moved to a server-side proxy (key never in the browser); 8-language UI + replies, time-aware greeting, Arabic RTL, flag-driven voice.
- Security headers (HSTS, CSP, X-Frame-Options, ...) and hardening.

### v2.1.0
- Preloader boot sequence; language-aware chatbot; `$ get_cv` button; Telegram CV-download notifications.

### v2.0.0
- Full UI overhaul (Bootstrap Icons / Devicons / Simple Icons), Alyx AI chatbot, 3 themes, experience tabs, dynamic years, contact form.

---

## License

MIT - feel free to use as a template. Attribution appreciated.

---

*Made with too many data pipelines.*
