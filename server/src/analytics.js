import { Router } from 'express'
import { query } from './db.js'
import { requireAuth } from './auth.js'

export const analyticsRouter = Router()

// Admin-only. Serves the pre-aggregated daily rollup for the P1-5 dashboard.
// Reads mv_chat_daily only (aggregate counts/metrics), never raw messages.
// ?days=N limits to the last N days; default 30, capped at 365.
analyticsRouter.get('/', requireAuth, async (req, res) => {
  const raw = Number.parseInt(req.query.days, 10)
  const days = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 365) : 30
  const { rows } = await query(
    `SELECT day, conversations, conversations_portfolio, conversations_curhat,
            conversations_english, conversations_lang_id, conversations_lang_en,
            messages, assistant_messages, tokens_in, tokens_out, avg_tokens_out,
            avg_latency_ms, p95_latency_ms, cache_hit_rate, opt_out_rate
       FROM mv_chat_daily
      WHERE day >= (current_date - ($1::int - 1))
      ORDER BY day`,
    [days],
  )
  res.json({ days, rows })
})
