# Deploy Guide - Alyx Portfolio

This project has two parts:

| Part | Where | Domain |
| --- | --- | --- |
| **Frontend** (Vite static site + `/admin`) | Netlify | `alyxlabs.tech` |
| **API + PostgreSQL** (`server/`) | VPS (Hostinger KVM 2) | `api.alyxlabs.tech` |
| **Netlify Functions** (`groq-chat`, `cv-notify`) | Netlify | (same site) |

```
Browser
  |
  |-- https://alyxlabs.tech ............ Netlify (static site + /admin + functions)
  |         |
  |         '-- fetch https://api.alyxlabs.tech/api/... (CORS)
  |
  '-- https://api.alyxlabs.tech ........ VPS: nginx -> Node (Express :4000) -> PostgreSQL
```

The site always falls back to the static data baked into the bundle, so it keeps
working even if the VPS/API is down.

> **All-in-one alternative** (frontend also on the VPS) is covered at the end.

---

## Part A - VPS: PostgreSQL + API

SSH into the VPS as a sudo user (Ubuntu assumed):

```bash
ssh youruser@YOUR_VPS_IP
```

### 1. Install Node 20, PostgreSQL, nginx, certbot

```bash
sudo apt update && sudo apt upgrade -y
# Node 20 (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql nginx certbot python3-certbot-nginx git
sudo npm install -g pm2
node -v && psql --version && nginx -v
```

### 2. Create the database and user

```bash
sudo -u postgres psql
```

Inside psql (use a strong password):

```sql
CREATE DATABASE alyx_portfolio;
CREATE USER alyx WITH PASSWORD 'STRONG_DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE alyx_portfolio TO alyx;
\c alyx_portfolio
GRANT ALL ON SCHEMA public TO alyx;
\q
```

### 3. Get the code onto the VPS

```bash
cd /opt
sudo git clone https://github.com/AliveNata/Alyx-Website.git alyx
sudo chown -R $USER:$USER /opt/alyx
cd /opt/alyx/server
npm install --omit=dev
```

### 4. Configure `server/.env`

```bash
cp .env.example .env
nano .env
```

Fill in (see the full reference table below):

```ini
DATABASE_URL=postgres://alyx:STRONG_DB_PASSWORD@localhost:5432/alyx_portfolio
JWT_SECRET=<run: openssl rand -hex 32>
ADMIN_EMAIL=alivenata@gmail.com
ADMIN_PASSWORD=<strong first-login password>
PORT=4000
CORS_ORIGINS=https://alyxlabs.tech,https://www.alyxlabs.tech,https://alyxdev.netlify.app
PUBLIC_URL=https://api.alyxlabs.tech
APP_URL=https://alyxlabs.tech
SMTP_USER=alivenata@gmail.com
SMTP_PASS=<Gmail App Password>
SMTP_FROM=Alyx Admin <alivenata@gmail.com>
# optional
GITHUB_TOKEN=
CONTACT_ENDPOINT=
TELEGRAM_CHAT_ID=
```

### 5. Create tables + seed initial data

```bash
npm run migrate   # creates all tables (idempotent)
npm run seed      # inserts portfolio data + admin user (skips tables that already have rows)
```

`seed` reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` and creates the admin login. It only
fills content tables when empty, so it is safe to re-run.

### 6. Run the API with pm2 (auto-restart + boot on reboot)

```bash
cd /opt/alyx/server
pm2 start src/index.js --name alyx-api
pm2 save
pm2 startup        # run the command it prints (sets up the systemd boot hook)
pm2 logs alyx-api  # verify: "Alyx API listening on :4000"
```

Quick local check on the VPS:

```bash
curl http://localhost:4000/health   # -> {"ok":true}
```

### 7. nginx reverse proxy for `api.alyxlabs.tech`

```bash
sudo nano /etc/nginx/sites-available/api.alyxlabs.tech
```

```nginx
server {
    listen 80;
    server_name api.alyxlabs.tech;

    # uploaded images can be large-ish
    client_max_body_size 8M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/api.alyxlabs.tech /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 8. HTTPS (Let's Encrypt)

DNS must already point `api.alyxlabs.tech` to the VPS (see Part B) before running this.

```bash
sudo certbot --nginx -d api.alyxlabs.tech
```

Certbot rewrites the nginx block to listen on 443 and auto-renews. Verify:

```bash
curl https://api.alyxlabs.tech/health   # -> {"ok":true}
```

### 9. Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Postgres stays on `localhost` (not exposed). Do **not** open port 5432.

---

## Part B - DNS (at your domain registrar / Hostinger DNS)

| Type | Name | Value |
| --- | --- | --- |
| A | `api` | `YOUR_VPS_IP` |
| A / ALIAS | `@` (alyxlabs.tech) | Netlify (per Part C) |
| CNAME | `www` | Netlify |

Wait for `api.alyxlabs.tech` to resolve to the VPS IP before running certbot (step 8).
Check with `dig api.alyxlabs.tech +short`.

---

## Part C - Frontend on Netlify

1. **Custom domain**: Netlify site -> Domain management -> add `alyxlabs.tech` (and `www`). Follow Netlify's DNS instructions for the apex `@` record.
2. **Environment variables** (Site configuration -> Environment variables):

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://api.alyxlabs.tech` |
   | `VITE_CONTACT_SHEET_URL` | (existing Apps Script URL) |
   | `GROQ_API_KEY` | (existing) |
   | `TELEGRAM_BOT_TOKEN` | (existing) |
   | `TELEGRAM_CHAT_ID` | (existing) |
   | `API_URL` | `https://api.alyxlabs.tech` (lets `cv-notify` read the admin-set chat id) |

3. **Redeploy** so `VITE_API_URL` is baked into the new build (env changes need a rebuild).
4. Make sure the VPS `CORS_ORIGINS` includes `https://alyxlabs.tech` (it does above). Restart the API after any change: `pm2 restart alyx-api`.

The public site now reads live data from the VPS API, and `/admin` writes to it.

---

## Part D - Environment variable reference

**VPS `server/.env`:**

| Var | Purpose | Secret? |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection | yes |
| `JWT_SECRET` | signs admin tokens (`openssl rand -hex 32`) | yes |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seed the first admin login | yes |
| `PORT` | API port behind nginx (4000) | no |
| `CORS_ORIGINS` | comma-separated allowed site origins | no |
| `PUBLIC_URL` | base for uploaded image URLs (`https://api.alyxlabs.tech`) | no |
| `APP_URL` | frontend origin for password email links (`https://alyxlabs.tech`) | no |
| `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Gmail SMTP for password reset/verify emails | yes (`SMTP_PASS`) |
| `GITHUB_TOKEN` | optional, raises GitHub sync rate limit | yes |
| `CONTACT_ENDPOINT` / `TELEGRAM_CHAT_ID` | optional, pre-fill admin Settings on first seed | no |

**Netlify:** `VITE_API_URL`, `VITE_CONTACT_SHEET_URL`, `GROQ_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `API_URL` (see Part C).

Secrets stay in env only. Non-secret config (contact endpoint, telegram chat id, chatbot model/prompt) is editable in **/admin -> Settings / Chatbot** and overrides the env fallback.

---

## Part E - Gmail App Password (for password emails)

The change-password and forgot-password flows email a link via Gmail SMTP.

1. Enable 2-Step Verification on the Google account (`myaccount.google.com` -> Security).
2. Go to `myaccount.google.com/apppasswords`, generate a password (16 chars).
3. Put it in `SMTP_PASS` on the VPS, then `pm2 restart alyx-api`.

Until this is set, the API prints the link to `pm2 logs alyx-api` instead of emailing (dev fallback).

---

## Part F - Updating after code changes

```bash
cd /opt/alyx
git pull
cd server
npm install --omit=dev     # if server deps changed
npm run migrate            # if schema.sql changed (idempotent)
pm2 restart alyx-api
```

The frontend redeploys itself on Netlify when you push to `main` (or trigger a deploy).

**Backups worth taking:**
- Database: `pg_dump alyx_portfolio > backup.sql` (cron it).
- Uploaded images live in `/opt/alyx/server/uploads/` - back this folder up too.

---

## Part G - All-in-one VPS (optional, no Netlify)

If you'd rather serve everything from the VPS:

1. Build the frontend on the VPS (or upload `dist/`):
   ```bash
   cd /opt/alyx && npm install && npm run build   # do NOT set VITE_API_URL
   ```
   With `VITE_API_URL` unset, the frontend calls `/api` on its own origin - no CORS needed.
2. nginx for `alyxlabs.tech`: serve `dist/` and proxy `/api` + `/uploads` to Node:
   ```nginx
   server {
       listen 80;
       server_name alyxlabs.tech www.alyxlabs.tech;
       root /opt/alyx/dist;
       index index.html;

       location /api/     { proxy_pass http://127.0.0.1:4000; proxy_set_header Host $host; proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto $scheme; }
       location /uploads/ { proxy_pass http://127.0.0.1:4000; }
       location /         { try_files $uri /index.html; }   # SPA fallback
   }
   ```
   Then `sudo certbot --nginx -d alyxlabs.tech -d www.alyxlabs.tech`.
3. Fold the two Netlify Functions into the API - see **Part H**. After that there is
   no dependency on Netlify at all.

The hybrid setup (Parts A-C) is recommended unless you specifically want a single box.

---

## Part H - Fold the Netlify Functions into the API (for full-VPS)

The two functions (`groq-chat` = LLM proxy, `cv-notify` = Telegram) read Netlify env
and run on Netlify. To drop Netlify entirely, port them to Express routes. This also
works in the hybrid setup (the Netlify frontend just calls `api.alyxlabs.tech/api/...`),
so it is a safe one-way consolidation - after it, `netlify/functions/` is unused.

### H.1 Create `server/src/groq.js`

```js
import { Router } from 'express'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
export const RL_HEADERS = [
  'x-ratelimit-limit-requests', 'x-ratelimit-remaining-requests',
  'x-ratelimit-limit-tokens', 'x-ratelimit-remaining-tokens',
  'x-ratelimit-reset-requests', 'x-ratelimit-reset-tokens',
]

export const groqRouter = Router()

groqRouter.post('/', async (req, res) => {
  const key = process.env.GROQ_API_KEY
  if (!key) return res.status(500).json({ error: 'Missing GROQ_API_KEY on server' })
  const resp = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(req.body || {}),
  })
  const text = await resp.text()
  for (const h of RL_HEADERS) { const v = resp.headers.get(h); if (v) res.set(h, v) }
  res.status(resp.status).type('application/json').send(text)
})
```

### H.2 Create `server/src/cvnotify.js`

```js
import { Router } from 'express'
import { query } from './db.js'

function parseBrowser(ua) {
  if (/Edg\//.test(ua))     return `Edge ${ua.match(/Edg\/([\d]+)/)?.[1] ?? ''}`
  if (/OPR\//.test(ua))     return `Opera ${ua.match(/OPR\/([\d]+)/)?.[1] ?? ''}`
  if (/Chrome\//.test(ua))  return `Chrome ${ua.match(/Chrome\/([\d]+)/)?.[1] ?? ''}`
  if (/Firefox\//.test(ua)) return `Firefox ${ua.match(/Firefox\/([\d]+)/)?.[1] ?? ''}`
  if (/Safari\//.test(ua))  return `Safari ${ua.match(/Version\/([\d]+)/)?.[1] ?? ''}`
  return 'Unknown Browser'
}
function parseOS(ua) {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11'
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1'
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7'
  if (/Android ([\d.]+)/.test(ua)) return `Android ${ua.match(/Android ([\d.]+)/)?.[1] ?? ''}`
  if (/iPhone|iPad/.test(ua)) return 'iOS'
  if (/Mac OS X/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown OS'
}

async function resolveChatId() {
  try {
    const { rows } = await query('SELECT telegram_chat_id FROM site_settings WHERE id = 1')
    if (rows[0]?.telegram_chat_id) return rows[0].telegram_chat_id
  } catch { /* fall back to env */ }
  return process.env.TELEGRAM_CHAT_ID || ''
}

export const cvNotifyRouter = Router()

cvNotifyRouter.post('/', async (req, res) => {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = await resolveChatId()
  if (!token || !chatId) return res.status(500).json({ error: 'Missing Telegram config' })

  const ip   = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown'
  const ua   = req.headers['user-agent'] || ''
  const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
  const browser = parseBrowser(ua)
  const os = parseOS(ua)

  let location = 'Unknown'
  try {
    const geo = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country`).then(r => r.json())
    if (geo.status === 'success') location = `${geo.city}, ${geo.country}`
  } catch {}

  const text = [`📄 CV Downloaded!`, `⏰ ${time} WIB`, `🏙️ ${location}`, `🌐 ${ip}`, `💻 ${browser} · ${os}`].join('\n')
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch(() => {})

  res.json({ ok: true })
})
```

### H.3 Edit `server/src/index.js`

Add imports:
```js
import { groqRouter, RL_HEADERS } from './groq.js'
import { cvNotifyRouter } from './cvnotify.js'
```

Add `exposedHeaders` to the `cors(...)` config (so the chatbot's rate-limit UI can read
the forwarded headers cross-origin in the hybrid setup):
```js
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true)
    cb(new Error(`Origin not allowed: ${origin}`))
  },
  exposedHeaders: RL_HEADERS,
}))
```

Mount the two routes (next to the other `app.use('/api/...')` lines):
```js
app.use('/api/groq-chat', groqRouter)
app.use('/api/cv-notify', cvNotifyRouter)
```

### H.4 Point the frontend at the API routes

`src/components/ChatBot.jsx` (line ~7) - `API_BASE` is already imported there:
```js
const LLM_PROXY_URL = `${API_BASE}/api/groq-chat`
```

`src/components/Navbar.jsx` - add the import, then update the fetch:
```js
import { API_BASE } from '../lib/apiBase'
// ...
fetch(`${API_BASE}/api/cv-notify`, { method: 'POST' }).catch(() => {})
```

### H.5 Env + cleanup

Move these into `server/.env` on the VPS (they used to be Netlify env):
```ini
GROQ_API_KEY=<value>
TELEGRAM_BOT_TOKEN=<value>
TELEGRAM_CHAT_ID=544787916
```
`pm2 restart alyx-api`. Once verified, `netlify/functions/` and those Netlify env vars
are no longer used and can be removed.

### H.6 Verify

```bash
curl -X POST https://api.alyxlabs.tech/api/cv-notify -H "Content-Type: application/json" -d '{}'
# -> {"ok":true}  (and a Telegram message arrives)
```
Open the site, chat with Alyx (uses `/api/groq-chat`), and download the CV (fires
`/api/cv-notify`). With this done the whole stack runs on the VPS - no Netlify.

---

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Site shows old/static data only | API unreachable - `curl https://api.alyxlabs.tech/api/portfolio`; check CORS_ORIGINS + `pm2 logs alyx-api` |
| Admin login fails | `ADMIN_PASSWORD` seeded? re-run `npm run seed`; check `JWT_SECRET` is set |
| CORS error in browser console | add the exact site origin to `CORS_ORIGINS`, `pm2 restart alyx-api` |
| Uploaded images 404 | `PUBLIC_URL` must be `https://api.alyxlabs.tech`; `uploads/` writable |
| Password email never arrives | `SMTP_PASS` is a Google **App Password**, not the login password; check `pm2 logs` |
| GitHub sync 403 | rate limit - set `GITHUB_TOKEN`; README uses a rate-limit-free CDN and is unaffected |
| API won't start | `pm2 logs alyx-api` - usually a bad `DATABASE_URL` or Postgres not running (`sudo systemctl status postgresql`) |
