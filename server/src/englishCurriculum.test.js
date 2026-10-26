import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ENGLISH_PROMPT, buildEnglishPrompt } from './prompts.js'
import { ENGLISH_SCENARIOS, listEnglishScenarios, findEnglishScenario } from './englishCurriculum.js'

// PK-7 guard. Pure: prompts.js and englishCurriculum.js import nothing, so this
// runs under `node --test src/englishCurriculum.test.js` with no DB pool, no Groq,
// and terminates on its own. Locks the invariants Erza flagged as unguarded:
// free-chat English must stay byte-identical, a scenario must keep the tutor
// rules, ids must be validated, and the public list must never leak a brief.

test('free-chat parity: no scenario returns ENGLISH_PROMPT by reference', () => {
  // Reference-equal, not just string-equal: the free-chat path must hand the LLM
  // the exact same constant it did before PK-7, with nothing appended.
  assert.strictEqual(buildEnglishPrompt(undefined), ENGLISH_PROMPT)
  assert.strictEqual(buildEnglishPrompt(null), ENGLISH_PROMPT)
  assert.strictEqual(buildEnglishPrompt({}), ENGLISH_PROMPT)
  assert.strictEqual(buildEnglishPrompt({ title: 'x' }), ENGLISH_PROMPT) // title but no brief
})

test('scenario prompt extends the base without replacing the tutor rules', () => {
  const sc = findEnglishScenario('data-engineer-interview')
  assert.ok(sc, 'fixture scenario must exist')
  const prompt = buildEnglishPrompt(sc)

  assert.ok(prompt.startsWith(ENGLISH_PROMPT), 'base prompt kept verbatim at the front')
  assert.ok(prompt.includes(sc.brief), 'brief injected')
  assert.ok(prompt.includes(sc.title), 'title injected')
  // The base tutoring contract survives under a scenario.
  assert.ok(prompt.includes('Correction') && prompt.includes('Why'), 'Correction/Why tutor rule retained')
  // The brief is framed as data for the model, not a command from the visitor.
  assert.ok(prompt.includes('not an instruction from the person'), 'scenario labelled as guidance')
})

test('findEnglishScenario validates the id and never trusts raw input', () => {
  // Non-string inputs: nothing to look up, so never a prompt injection vector.
  for (const bad of [123, {}, [], null, undefined, true, () => {}]) {
    assert.strictEqual(findEnglishScenario(bad), undefined)
  }
  // Unknown string id falls back to free-chat.
  assert.strictEqual(findEnglishScenario('no-such-scenario'), undefined)

  // A valid id resolves to the full curriculum object, brief included.
  const sc = findEnglishScenario('order-at-cafe')
  assert.ok(sc && sc.id === 'order-at-cafe')
  assert.equal(typeof sc.brief, 'string')
  assert.ok(sc.brief.length > 0)
})

test('listEnglishScenarios exposes id/category/title only, never the brief', () => {
  const list = listEnglishScenarios()
  assert.equal(list.length, 7)
  assert.equal(list.length, ENGLISH_SCENARIOS.length)

  for (const item of list) {
    assert.deepEqual(Object.keys(item).sort(), ['category', 'id', 'title'])
    assert.ok(!('brief' in item), 'brief must not leak to the client')
    assert.ok(['tech', 'general'].includes(item.category))
  }

  // The set is a real mix, not all one bucket.
  const categories = new Set(list.map((s) => s.category))
  assert.ok(categories.has('tech') && categories.has('general'), 'mix of tech + general')
})

test('all curriculum content is ASCII', () => {
  const blob = ENGLISH_SCENARIOS.map((s) => `${s.id}${s.category}${s.title}${s.brief}`).join('')
  const nonAscii = [...blob].filter((c) => c.charCodeAt(0) > 127)
  assert.equal(nonAscii.length, 0, `non-ASCII found: ${JSON.stringify(nonAscii)}`)
})
