-- Alyx portfolio - Postgres schema
-- Run via: npm run migrate  (or psql -f schema.sql)

-- Phase 2 (RAG) stores embeddings. Dev and the VPS superuser own the actual
-- creation; for the non-superuser app role this is a no-op once vector exists,
-- so migrate never fails. IF NOT EXISTS returns early before any privilege check.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  token_version INT  NOT NULL DEFAULT 0,  -- bumped on login/password change to invalidate other sessions
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 0;

-- One-time tokens for email-verified password change / reset.
CREATE TABLE IF NOT EXISTS auth_tokens (
  id                SERIAL PRIMARY KEY,
  user_id           INT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,          -- 'pw_change' | 'pw_reset'
  token_hash        TEXT NOT NULL,          -- sha256 of the token sent in the link
  new_password_hash TEXT,                   -- pre-computed bcrypt hash for pw_change
  expires_at        TIMESTAMPTZ NOT NULL,
  used_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single-row site identity (id is always 1).
CREATE TABLE IF NOT EXISTS personal_info (
  id       INT PRIMARY KEY DEFAULT 1,
  name     TEXT NOT NULL DEFAULT '',
  nickname TEXT NOT NULL DEFAULT '',
  title    TEXT NOT NULL DEFAULT '',
  tagline  TEXT NOT NULL DEFAULT '',
  email    TEXT NOT NULL DEFAULT '',
  github   TEXT NOT NULL DEFAULT '',
  linkedin TEXT NOT NULL DEFAULT '',
  bio      TEXT NOT NULL DEFAULT '',
  CONSTRAINT personal_info_singleton CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS skills (
  id         SERIAL PRIMARY KEY,
  category   TEXT NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '',
  level      INT  NOT NULL DEFAULT 80,
  sort_order INT  NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tech        JSONB NOT NULL DEFAULT '[]',
  category    TEXT NOT NULL DEFAULT 'Other',
  image       TEXT NOT NULL DEFAULT '',
  github      TEXT NOT NULL DEFAULT '',
  link        TEXT NOT NULL DEFAULT '',
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- exp_type: 'it' | 'freelance' | 'nonit'
CREATE TABLE IF NOT EXISTS experiences (
  id           SERIAL PRIMARY KEY,
  exp_type     TEXT NOT NULL DEFAULT 'it',
  role         TEXT NOT NULL,
  company      TEXT NOT NULL DEFAULT '',
  period       TEXT NOT NULL DEFAULT '',
  duration     TEXT NOT NULL DEFAULT '',
  location     TEXT NOT NULL DEFAULT '',
  work_type    TEXT NOT NULL DEFAULT '',
  description  JSONB NOT NULL DEFAULT '[]',
  technologies JSONB NOT NULL DEFAULT '[]',
  projects     JSONB NOT NULL DEFAULT '[]',
  highlight    JSONB,
  sort_order   INT  NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS awards (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT '',
  metrics     JSONB NOT NULL DEFAULT '[]',
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS certificates (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  issuer      TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL DEFAULT '',
  icon        TEXT NOT NULL DEFAULT '',
  link        TEXT NOT NULL DEFAULT '',
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS changelog (
  id          SERIAL PRIMARY KEY,
  version     TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL DEFAULT '',
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  source_ref  TEXT,  -- null for manual entries; GitHub ref (rel:/sha:) for mirrored ones
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE changelog ADD COLUMN IF NOT EXISTS source_ref TEXT;

-- Single-row GitHub mirror config (id is always 1).
CREATE TABLE IF NOT EXISTS github_settings (
  id             INT PRIMARY KEY DEFAULT 1,
  repo           TEXT NOT NULL DEFAULT '',
  last_synced_at TIMESTAMPTZ,
  CONSTRAINT github_settings_singleton CHECK (id = 1)
);

-- status: planned | in-progress | done
CREATE TABLE IF NOT EXISTS features (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'planned',
  sort_order  INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single-row misc site settings (id is always 1). Non-secret config that used
-- to live in Netlify env, now editable from the admin.
CREATE TABLE IF NOT EXISTS site_settings (
  id               INT PRIMARY KEY DEFAULT 1,
  contact_endpoint TEXT NOT NULL DEFAULT '',  -- Google Apps Script URL for the contact form
  telegram_chat_id TEXT NOT NULL DEFAULT '',  -- destination for CV-download notifications
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);

-- Single-row chatbot configuration (id is always 1). Read by the site at load,
-- edited from the admin panel. The Groq API key stays server-side.
CREATE TABLE IF NOT EXISTS chatbot_settings (
  id               INT PRIMARY KEY DEFAULT 1,
  model            TEXT    NOT NULL DEFAULT 'openai/gpt-oss-20b',
  reasoning_effort TEXT    NOT NULL DEFAULT 'low',
  temperature      NUMERIC NOT NULL DEFAULT 0.7,
  max_tokens       INT     NOT NULL DEFAULT 700,
  system_prompt    TEXT    NOT NULL DEFAULT '',
  greeting         TEXT    NOT NULL DEFAULT '',
  enable_companion    BOOLEAN NOT NULL DEFAULT true,
  enable_voice        BOOLEAN NOT NULL DEFAULT true,
  enable_site_actions BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT chatbot_settings_singleton CHECK (id = 1)
);

-- Chat logging (P1-1). No raw PII is stored: content is redacted before insert
-- (or NULL for curhat / opted-out), and ip/ua are HMAC-hashed, never raw.
-- gen_random_uuid() is in PG 18 core, so no pgcrypto extension is required.
CREATE TABLE IF NOT EXISTS conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    TEXT UNIQUE NOT NULL,       -- client-generated id, one per chat session
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,               -- set later by a session-timeout job
  lang          TEXT,
  mode          TEXT,                      -- portfolio | curhat | english
  consent_state TEXT NOT NULL,             -- notice_default | opted_out
  ip_hash       TEXT,                      -- HMAC-SHA256(ip, salt); NULL if salt unset
  ua_hash       TEXT                       -- HMAC-SHA256(ua, salt); NULL if salt unset
);

-- Telemetry columns (tokens_in/out, model, latency_ms, cache_hit,
-- retrieved_sources, rate_limit_snapshot) are created nullable now and
-- populated by P1-2 / P2, so there is no second migration.
CREATE TABLE IF NOT EXISTS messages (
  id                  BIGSERIAL PRIMARY KEY,
  conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role                TEXT NOT NULL,        -- user | assistant
  content             TEXT,                 -- redacted text; NULL when not stored
  tokens_in           INT,
  tokens_out          INT,
  model               TEXT,
  latency_ms          INT,
  cache_hit           BOOLEAN,
  retrieved_sources   JSONB,
  rate_limit_snapshot JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS conversations_started_at_idx ON conversations(started_at);
-- Per-IP daily token budget (P1-6) sums messages by conversations.ip_hash.
CREATE INDEX IF NOT EXISTS conversations_ip_hash_idx ON conversations(ip_hash);

-- Analytics layer (P1-4). Aggregate metrics only; raw message content never
-- leaves the base tables. Day grain is the message/conversation created day in
-- the server timezone. The dashboard (P1-5) reads mv_chat_daily.

-- Which conversation does each message belong to, and under what mode/lang?
-- One flat row per message, so the aggregates below never re-join.
-- CREATE OR REPLACE VIEW can only append columns; a removal/rename/retype is a
-- DROP VIEW + recreate migration.
CREATE OR REPLACE VIEW v_message_context AS
SELECT
  m.id,
  m.conversation_id,
  m.role,
  m.tokens_in,
  m.tokens_out,
  m.latency_ms,
  m.cache_hit,
  m.created_at,
  c.mode,
  c.lang
FROM messages AS m
JOIN conversations AS c ON c.id = m.conversation_id;

-- How many messages, tokens, latency and cache hits per day? Assistant-only
-- metrics (tokens/latency/cache) are filtered to role = 'assistant' inside the
-- aggregates so user rows never dilute them.
-- CREATE OR REPLACE VIEW can only append columns; a removal/rename/retype is a
-- DROP VIEW + recreate migration.
CREATE OR REPLACE VIEW v_message_daily AS
SELECT
  created_at::date AS day,
  count(*) AS messages,
  count(*) FILTER (WHERE role = 'assistant') AS assistant_messages,
  coalesce(sum(tokens_in), 0) AS tokens_in,
  coalesce(sum(tokens_out), 0) AS tokens_out,
  avg(tokens_out) FILTER (WHERE role = 'assistant') AS avg_tokens_out,
  avg(latency_ms) FILTER (WHERE role = 'assistant' AND latency_ms IS NOT NULL) AS avg_latency_ms,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)
    FILTER (WHERE role = 'assistant' AND latency_ms IS NOT NULL) AS p95_latency_ms,
  count(*) FILTER (WHERE role = 'assistant' AND cache_hit IS TRUE) AS cache_hits
FROM v_message_context
GROUP BY created_at::date;

-- How many conversations started per day, split by mode, lang and opt-out?
-- CREATE OR REPLACE VIEW can only append columns; a removal/rename/retype is a
-- DROP VIEW + recreate migration.
CREATE OR REPLACE VIEW v_conversation_daily AS
SELECT
  started_at::date AS day,
  count(*) AS conversations,
  count(*) FILTER (WHERE mode = 'portfolio') AS conversations_portfolio,
  count(*) FILTER (WHERE mode = 'curhat') AS conversations_curhat,
  count(*) FILTER (WHERE mode = 'english') AS conversations_english,
  count(*) FILTER (WHERE lang = 'id') AS conversations_lang_id,
  count(*) FILTER (WHERE lang = 'en') AS conversations_lang_en,
  count(*) FILTER (WHERE consent_state = 'opted_out') AS opted_out
FROM conversations
GROUP BY started_at::date;

-- Daily rollup the dashboard reads. Created WITH DATA so the first load has
-- rows; the nightly cron keeps it fresh via REFRESH ... CONCURRENTLY.
-- Matviews cannot be CREATE OR REPLACE: a shape change is a DROP MATERIALIZED
-- VIEW + recreate migration, not an edit in place.
-- FULL OUTER JOIN so a day with only conversations (or only messages) still
-- appears; coalesce the day and counts so no column is NULL from a missing side.
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_chat_daily AS
SELECT
  coalesce(c.day, m.day) AS day,
  coalesce(c.conversations, 0) AS conversations,
  coalesce(c.conversations_portfolio, 0) AS conversations_portfolio,
  coalesce(c.conversations_curhat, 0) AS conversations_curhat,
  coalesce(c.conversations_english, 0) AS conversations_english,
  coalesce(c.conversations_lang_id, 0) AS conversations_lang_id,
  coalesce(c.conversations_lang_en, 0) AS conversations_lang_en,
  coalesce(m.messages, 0) AS messages,
  coalesce(m.assistant_messages, 0) AS assistant_messages,
  coalesce(m.tokens_in, 0) AS tokens_in,
  coalesce(m.tokens_out, 0) AS tokens_out,
  m.avg_tokens_out,
  m.avg_latency_ms,
  m.p95_latency_ms,
  -- Lights up once P2-6 sets cache_hit; ~0 until then.
  CASE WHEN m.assistant_messages > 0
    THEN coalesce(m.cache_hits, 0)::numeric / m.assistant_messages END AS cache_hit_rate,
  CASE WHEN c.conversations > 0
    THEN coalesce(c.opted_out, 0)::numeric / c.conversations END AS opt_out_rate
FROM v_conversation_daily AS c
FULL OUTER JOIN v_message_daily AS m ON m.day = c.day
WITH DATA;

-- Unique index is required for REFRESH MATERIALIZED VIEW CONCURRENTLY.
CREATE UNIQUE INDEX IF NOT EXISTS mv_chat_daily_day_uidx ON mv_chat_daily(day);

-- Phase 2 (RAG) vector store. One row per CMS record (a project, skill group,
-- experience, award, certificate, the personal_info blurb). source_table +
-- source_id point back at the origin row; anchor is the site deep-link the chat
-- UI cites. embedding is multilingual-e5-small (384-dim). The UNIQUE key lets
-- the reindex upsert by origin row and prune rows whose source is gone.
-- The corpus is dozens of rows, so exact search (ORDER BY embedding <=> q) is
-- correct and an ANN index would only add error. If it grows into the thousands,
-- add: CREATE INDEX ON portfolio_chunks USING hnsw (embedding vector_cosine_ops).
CREATE TABLE IF NOT EXISTS portfolio_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table TEXT NOT NULL,
  source_id    TEXT NOT NULL,
  anchor       TEXT NOT NULL,
  content      TEXT NOT NULL,
  embedding    VECTOR(384),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_id)
);

-- Shared server-side answer cache (P2-6). A grounded portfolio reply is computed
-- once (one Groq call) and replayed for the same normalized question from any
-- visitor, so a repeat question costs no Groq call and no token budget. key is
-- sha256(mode|lang|normalizedQuery); only grounded portfolio answers are stored
-- here (never curhat/english, the not-sure reply, or the legacy stuffing
-- fallback). Invalidated three ways: a TTL (CACHE_TTL_DAYS), a size cap
-- (CACHE_MAX_ROWS, oldest trimmed first), and a full clear at the end of every
-- successful reindex. Durable so it survives the frequent pm2 restarts.
CREATE TABLE IF NOT EXISTS chat_cache (
  key        TEXT PRIMARY KEY,                 -- sha256 hex of mode|lang|normalized query
  reply      TEXT NOT NULL,
  citations  JSONB NOT NULL DEFAULT '[]',
  lang       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hits       INT NOT NULL DEFAULT 0
);
-- created_at drives both the TTL sweep and the oldest-first overflow trim.
CREATE INDEX IF NOT EXISTS chat_cache_created_at_idx ON chat_cache(created_at);
