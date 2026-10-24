import assert from 'node:assert/strict'
import { redact, hashValue } from './redact.js'

// Plain node assert script (repo has no test runner). Run: node src/redact.test.js

// Email
assert.equal(redact('reach me at alief.n@example.com please'), 'reach me at [email] please')

// International phone
assert.equal(redact('call +62 812-3456-7890 now'), 'call [phone] now')

// Indonesian local phone
assert.equal(redact('wa 081234567890 ya'), 'wa [phone] ya')

// @handle
assert.equal(redact('follow @alief_n on ig'), 'follow [handle] on ig')

// Mixed, all three in one line
assert.equal(
  redact('email alief@x.co atau call 08123456789 atau @alief'),
  'email [email] atau call [phone] atau [handle]',
)

// Clean text is untouched
assert.equal(redact('what is your experience with dbt and airflow?'), 'what is your experience with dbt and airflow?')

// Short standalone numbers are left alone (not phone-like)
assert.equal(redact('i have 3 years and 2 projects'), 'i have 3 years and 2 projects')

// hashValue: null when salt unset
delete process.env.LOG_HASH_SALT
assert.equal(hashValue('1.2.3.4'), null)

// hashValue: deterministic hex when salt set, null on empty value
process.env.LOG_HASH_SALT = 'test-salt'
const h = hashValue('1.2.3.4')
assert.match(h, /^[0-9a-f]{64}$/)
assert.equal(hashValue('1.2.3.4'), h)
assert.equal(hashValue(''), null)

console.log('redact.test.js: PASS')
