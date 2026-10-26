import assert from 'node:assert/strict'
import { validateContact, decideContactStatus } from './contact.js'

// Plain node assert script (repo has no test runner). Run: node src/contact.test.js
// Guards the PK-23 contact endpoint's two decision points: what a valid
// submission looks like (validation + length caps + email shape) and when a
// submission counts as sent (email primary, Sheet fallback).

// --- validateContact: presence, trimming, caps, email shape -------------------

// Arrange + Assert: a clean submission is accepted and trimmed.
const ok = validateContact({ name: '  Jane  ', email: ' jane@example.com ', message: '  hi there  ' })
assert.deepEqual(ok, { name: 'Jane', email: 'jane@example.com', message: 'hi there' })

// Assert: each required field, missing or blank, is rejected.
assert.ok(validateContact({ email: 'a@b.co', message: 'x' }).error)
assert.ok(validateContact({ name: 'A', message: 'x' }).error)
assert.ok(validateContact({ name: 'A', email: 'a@b.co' }).error)
assert.ok(validateContact({ name: '   ', email: 'a@b.co', message: 'x' }).error)

// Assert: a malformed email is rejected, a well-formed one passes.
assert.ok(validateContact({ name: 'A', email: 'not-an-email', message: 'x' }).error)
assert.ok(validateContact({ name: 'A', email: 'a@b', message: 'x' }).error) // no dot in domain
assert.ok(!validateContact({ name: 'A', email: 'a@b.co', message: 'x' }).error)

// Assert: length caps reject over-long name / email / message.
assert.ok(validateContact({ name: 'n'.repeat(201), email: 'a@b.co', message: 'x' }).error)
assert.ok(validateContact({ name: 'A', email: 'a'.repeat(316) + '@b.co', message: 'x' }).error) // 321 chars > 320 cap
assert.ok(validateContact({ name: 'A', email: 'a@b.co', message: 'm'.repeat(5001) }).error)
// At the caps exactly, it is still accepted.
assert.ok(!validateContact({ name: 'n'.repeat(200), email: 'a@b.co', message: 'm'.repeat(5000) }).error)

// Assert: non-string / nullish bodies never throw, they just fail closed.
assert.ok(validateContact(null).error)
assert.ok(validateContact({ name: 42, email: {}, message: [] }).error)

// --- decideContactStatus: email primary, Sheet fallback ----------------------

// Assert: a real email send is success on its own (Sheet best-effort).
assert.equal(decideContactStatus({ emailDelivered: true, sheetDelivered: false }), true)
// Assert: no email but a 2xx Sheet forward is the fallback success.
assert.equal(decideContactStatus({ emailDelivered: false, sheetDelivered: true }), true)
// Assert: both channels succeeding is still success.
assert.equal(decideContactStatus({ emailDelivered: true, sheetDelivered: true }), true)
// Assert: both missing is the only failure.
assert.equal(decideContactStatus({ emailDelivered: false, sheetDelivered: false }), false)

console.log('contact.test.js: all assertions passed')
