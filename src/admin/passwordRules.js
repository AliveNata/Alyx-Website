// Mirror of the server-side policy (server/src/password.js) for the live UI.
export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 6 characters', test: (p) => p.length >= 6 },
  { key: 'upper', label: 'An uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { key: 'symbol', label: 'A symbol (!@#$%^&*)', test: (p) => /[!@#$%^&*]/.test(p) },
  { key: 'number', label: 'A number (0-9)', test: (p) => /[0-9]/.test(p) },
]

export const passwordValid = (p) => PASSWORD_RULES.every((r) => r.test(p || ''))
