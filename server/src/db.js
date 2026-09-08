import pg from 'pg'

// Single shared pool for the whole API.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
})

export const query = (text, params) => pool.query(text, params)
