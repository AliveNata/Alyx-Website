import crypto from 'node:crypto'

// Best-effort regex scrub, not a DLP guarantee: it is a strong default that
// catches common email/phone/@handle shapes, not every possible leak.

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g

// Order matters: emails are scrubbed first so the phone pass never eats the
// digits inside an address. @handles are scrubbed last so they do not swallow
// the domain of an email that was already replaced.

// International (+62...) and Indonesian local (08..., 021-...) formats. Requires
// at least 8 digits total so short standalone numbers are left alone.
const PHONE_RE = /(?<![\w@])\+?\d[\d\s().-]{7,}\d/g

// A leading @ followed by a username, e.g. @alief_n. Not preceded by a word
// char, so it will not fire on the local part of an email.
const HANDLE_RE = /(?<![\w])@[A-Za-z0-9._]{2,}/g

export function redact(text) {
  if (typeof text !== 'string' || !text) return text
  return text
    .replace(EMAIL_RE, '[email]')
    .replace(PHONE_RE, '[phone]')
    .replace(HANDLE_RE, '[handle]')
}

// HMAC-SHA256 hex of value keyed by LOG_HASH_SALT. Returns null when the salt
// is unset or the value is empty, so logging stays optional (never crashes).
export function hashValue(value) {
  const salt = process.env.LOG_HASH_SALT
  if (!salt || !value) return null
  return crypto.createHmac('sha256', salt).update(String(value)).digest('hex')
}
