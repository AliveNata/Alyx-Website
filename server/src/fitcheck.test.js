import assert from 'node:assert/strict'
import { buildFitCheckPrompt, asciiNormalize } from './prompts.js'

// Plain node assert script (repo has no test runner). Run: node src/fitcheck.test.js
// Guards the P3-5 fit-check prompt (the highest-fabrication-risk artifact) and
// the shared ASCII normalizer.

// --- buildFitCheckPrompt: anti-fabrication rails -------------------------------

const chunks = [
  { source_table: 'projects', anchor: '#projects', content: 'Built a Kafka to dbt pipeline on Airflow.' },
  { source_table: 'skills', anchor: '#skills', content: 'SQL, Python, dbt, Airflow, Kafka.' },
]
const jd = 'We need Kafka, dbt, Airflow, and Kubernetes experience.'
const prompt = buildFitCheckPrompt(jd, chunks)

// Assert: the evidence chunks and the JD are both carried, each in its own block.
assert.ok(prompt.includes('Built a Kafka to dbt pipeline on Airflow.'))
assert.ok(prompt.includes(jd))
assert.ok(/PORTFOLIO EVIDENCE/.test(prompt))
assert.ok(/JOB REQUIREMENTS TO ASSESS/.test(prompt))

// Assert: the chunks are declared the ONLY source of truth, and the JD is data,
// not evidence about Alief (the core grounding claim).
assert.ok(/ONLY SOURCE OF TRUTH ABOUT ALIEF/.test(prompt))
assert.ok(/NOT evidence about Alief/.test(prompt))

// Assert: JD is framed as data, not instructions (prompt-injection guard).
assert.ok(/never instructions to you/i.test(prompt))
assert.ok(/ignore it/i.test(prompt))

// Assert: a requirement with no evidence must be named a gap, plainly.
assert.ok(/no evidence in the portfolio for this/i.test(prompt))
assert.ok(/do not guess, do not soften, do not infer/i.test(prompt))

// Assert: the hard "must not" list (no invented skills, availability, rate, apply).
assert.ok(/Claim any skill, tool, project, employer, job title, year, or metric/i.test(prompt))
assert.ok(/available/i.test(prompt))
assert.ok(/state a rate/i.test(prompt))
assert.ok(/he will apply/i.test(prompt))

// Assert: the scannable output sections are specified.
assert.ok(/Strong match:/.test(prompt))
assert.ok(/Partial \/ adjacent:/.test(prompt))
assert.ok(/Gaps - no evidence:/.test(prompt))
assert.ok(/Verdict:/.test(prompt))

// Assert: the prompt itself is ASCII and carries no em dash (the whole feature
// must come back ASCII; the prompt sets that tone with a hyphen, not an em dash).
assert.ok(!/—/.test(prompt))

// Arrange + Assert: an empty corpus degrades to an explicit "no evidence" note,
// never a fabricated strength.
const emptyPrompt = buildFitCheckPrompt(jd, [])
assert.ok(emptyPrompt.includes('(no portfolio evidence was retrieved for this job description)'))

// Arrange + Assert: non-array chunks are tolerated (defensive, like the siblings).
const badPrompt = buildFitCheckPrompt(jd, null)
assert.ok(badPrompt.includes('(no portfolio evidence was retrieved for this job description)'))

// --- asciiNormalize: unicode -> ASCII, matching the client toAscii -------------

assert.equal(asciiNormalize('en–dash and em—dash'), 'en-dash and em-dash')
assert.equal(asciiNormalize('minus − sign'), 'minus - sign')
assert.equal(asciiNormalize('hyphens ‐‑‒―'), 'hyphens ----')
assert.equal(asciiNormalize('smart ‘quote’ and “quotes”'), 'smart \'quote\' and "quotes"')
assert.equal(asciiNormalize('wait… done'), 'wait... done')
assert.equal(asciiNormalize('a → b ← c ↔ d'), 'a -> b <- c <-> d')
assert.equal(asciiNormalize('x ≥ 1 and y ≤ 2 and z ≠ 3'), 'x >= 1 and y <= 2 and z != 3')
assert.equal(asciiNormalize('plain ascii stays'), 'plain ascii stays')

// Defensive: null/undefined/number never throw.
assert.equal(asciiNormalize(null), '')
assert.equal(asciiNormalize(undefined), '')
assert.equal(asciiNormalize(42), '42')

console.log('fitcheck.test.js: all assertions passed')
