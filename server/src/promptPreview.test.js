import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Plain node assert script (repo has no test runner). Run: node src/promptPreview.test.js
// Guards the PK-1 playground's ZERO-side-effect contract by static inspection:
// the module must not import or call any of chat.js's logging / cache / budget
// helpers, and must not write chatbot_settings. A live Groq call needs a key and
// a DB, so this trace (not a network call) is the enforceable guarantee.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raw = fs.readFileSync(path.join(__dirname, 'promptPreview.js'), 'utf8')

// Scan the CODE only: the module's prose comments name these helpers to explain
// why they are absent, so strip block and line comments before asserting. The
// file has no regex literals or URLs that would trip a naive strip.
const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

// Assert: no logging path. logTurn is the only turn-logger; the preview must
// never write a conversation or message row.
assert.ok(!/logTurn/.test(src), 'preview must not log a turn')
assert.ok(!/INSERT\s+INTO\s+conversations/i.test(src), 'preview must not write conversations')
assert.ok(!/INSERT\s+INTO\s+messages/i.test(src), 'preview must not write messages')

// Assert: no answer-cache touch (read or write).
for (const fn of ['getCached', 'putCached', 'bumpHits', 'sweepCache', 'cacheKey']) {
  assert.ok(!new RegExp(fn).test(src), `preview must not touch the cache (${fn})`)
}
assert.ok(!/chat_cache/i.test(src), 'preview must not reference the cache table')

// Assert: no token-budget read. The live budget check sums tokens by ip_hash;
// the preview must not run it.
assert.ok(!/ip_hash/i.test(src), 'preview must not read the token budget')
assert.ok(!/date_trunc/i.test(src), 'preview must not run the daily budget query')

// Assert: no settings write. The playground tests a CANDIDATE config and must
// never persist it to the single settings row.
assert.ok(!/INSERT\s+INTO\s+chatbot_settings/i.test(src), 'preview must not write settings')
assert.ok(!/UPDATE\s+chatbot_settings/i.test(src), 'preview must not update settings')

// Assert: it DOES reuse the real pipeline pieces (retrieval + grounded prompt +
// the one-shot Groq call + the fixed not-sure reply), so the preview mirrors the
// live portfolio path rather than a divergent one.
assert.ok(/retrieveChunks/.test(src), 'preview must retrieve the real chunks')
assert.ok(/buildRetrievalPrompt/.test(src), 'preview must build the grounded prompt')
assert.ok(/groqChatOnce/.test(src), 'preview must use the non-streaming Groq call')
assert.ok(/notSureReply/.test(src), 'preview must return the fixed not-sure reply below threshold')

console.log('promptPreview.test.js: all assertions passed')
