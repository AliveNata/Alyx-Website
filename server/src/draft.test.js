import assert from 'node:assert/strict'
import { buildDraftPrompt } from './prompts.js'

// Plain node assert script (repo has no test runner). Run: node src/draft.test.js
// Guards the P3-4 handoff draft prompt: it must ground on the visitor's own
// questions and must forbid fabricating visitor details or claims about Alief.

// Arrange: two recent visitor questions.
const prompt = buildDraftPrompt([
  'What kind of data pipelines has Alief built?',
  'Is he open to a short consulting project?',
])

// Assert: the visitor's questions are carried verbatim as the only source.
assert.ok(prompt.includes('What kind of data pipelines has Alief built?'))
assert.ok(prompt.includes('Is he open to a short consulting project?'))

// Assert: first-person framing from the visitor to Alief.
assert.ok(/first person/i.test(prompt))
assert.ok(prompt.includes('Hi Alief,'))

// Assert: the anti-fabrication rails are present (the audit-critical part).
assert.ok(/Invent the visitor's name, company/i.test(prompt))
assert.ok(/Claim anything about Alief/i.test(prompt))
assert.ok(/availability/i.test(prompt))
assert.ok(/Promise anything/i.test(prompt))

// Arrange + Assert: empty input degrades to an honest placeholder, never invents.
const empty = buildDraftPrompt([])
assert.ok(empty.includes('(no specific question was captured)'))

// Arrange + Assert: non-array input is tolerated (defensive, like the siblings).
const bad = buildDraftPrompt(null)
assert.ok(bad.includes('(no specific question was captured)'))

// Arrange + Assert: blank and non-string entries are dropped, real ones kept.
const mixed = buildDraftPrompt(['  ', '', 'Can he help with dbt?', null, 42])
assert.ok(mixed.includes('Can he help with dbt?'))
assert.ok(!mixed.includes('- \n- \n'))

console.log('draft.test.js: all assertions passed')
