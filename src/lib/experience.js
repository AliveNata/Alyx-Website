// Data/professional career start year. Years of experience are derived from
// this so "7+ years" auto-increments each year. Change this one number to
// re-anchor (e.g. 2018 if counting from the first IT role).
export const EXPERIENCE_SINCE = 2019

export const yearsExp = () => Math.max(1, new Date().getFullYear() - EXPERIENCE_SINCE)

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty']

// Capitalized word form for prose, e.g. 7 -> "Seven". Falls back to the number.
export const yearsExpWord = () => WORDS[yearsExp()] || String(yearsExp())
