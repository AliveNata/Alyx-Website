-- Alyx portfolio - Postgres schema
-- Run via: npm run migrate  (or psql -f schema.sql)

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
