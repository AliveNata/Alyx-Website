import assert from 'node:assert/strict'
import { versionDiffers } from './promptVersions.js'

// Plain node assert script (repo has no test runner). Run: node src/promptVersions.test.js
// Guards the PK-1 snapshot dedup decision: a save creates a version only when the
// prompt or a tuning field changed, so toggling a feature never spams history.

// A latest version as pg returns it: temperature/max_tokens are strings (NUMERIC/
// INT), text fields are strings.
const latest = {
  system_prompt: 'You are Alyx.',
  model: 'openai/gpt-oss-20b',
  reasoning_effort: 'low',
  temperature: '0.7',
  max_tokens: '700',
  greeting: '',
}

// Arrange + Assert: no latest (empty history) always differs, so the first save
// seeds a version.
assert.equal(versionDiffers(null, latest), true)

// Arrange + Assert: an identical config (e.g. a save that only flipped a feature
// toggle or edited a lead URL) does NOT create a new version. The just-saved row
// carries the same values; temperature/max_tokens may arrive as numbers.
assert.equal(versionDiffers(latest, { ...latest, temperature: 0.7, max_tokens: 700 }), false)

// Arrange + Assert: a changed system prompt differs.
assert.equal(versionDiffers(latest, { ...latest, system_prompt: 'You are Alyx, concise.' }), true)

// Arrange + Assert: a changed tuning field differs, across every tracked one.
assert.equal(versionDiffers(latest, { ...latest, temperature: 0.9 }), true)
assert.equal(versionDiffers(latest, { ...latest, max_tokens: 900 }), true)
assert.equal(versionDiffers(latest, { ...latest, model: 'llama-3.3-70b' }), true)
assert.equal(versionDiffers(latest, { ...latest, reasoning_effort: 'high' }), true)
assert.equal(versionDiffers(latest, { ...latest, greeting: 'Hi!' }), true)

// Arrange + Assert: numeric equality ignores string formatting, so "0.70" vs 0.7
// is not a spurious change.
assert.equal(versionDiffers({ ...latest, temperature: '0.70' }, { ...latest, temperature: 0.7 }), false)

// Arrange + Assert: a null tuning value normalizes like a blank, so null vs a
// default does not look like a change when both are absent.
assert.equal(versionDiffers({ ...latest, greeting: null }, { ...latest, greeting: '' }), false)

console.log('promptVersions.test.js: all assertions passed')
