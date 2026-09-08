// Password policy shared by the change/reset endpoints. The client mirrors these
// rules in its strength UI; the server enforces them as the source of truth.
export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 6 characters', test: (p) => p.length >= 6 },
  { key: 'upper', label: 'An uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { key: 'symbol', label: 'A symbol (!@#$%^&*)', test: (p) => /[!@#$%^&*]/.test(p) },
  { key: 'number', label: 'A number (0-9)', test: (p) => /[0-9]/.test(p) },
]

export function validatePassword(pw) {
  const failed = PASSWORD_RULES.filter((r) => !r.test(pw || ''))
  return { ok: failed.length === 0, failed: failed.map((r) => r.label) }
}
