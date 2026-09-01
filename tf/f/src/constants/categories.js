// Student category system - must stay in sync with backend/src/utils/studentCategory.js
//
//   MIDIB_1 -> ምድብ 1 (ህጻናት / children), ages 7–13, ID prefix ህ
//   MIDIB_2 -> ምድብ 2 (ማእከላውያን / teenagers), ages 14–17, ID prefix ማ
//   MIDIB_3 -> ምድብ 3 (ወጣት / adults), ages 18+, ID prefix ወ

export const CATEGORIES = {
  MIDIB_1: { number: 'ምድብ 1', name: 'ህጻናት', ageRange: '7–13', badge: 'child', idPrefix: 'ህ' },
  MIDIB_2: { number: 'ምድብ 2', name: 'ማእከላውያን', ageRange: '14–17', badge: 'teen', idPrefix: 'ማ' },
  MIDIB_3: { number: 'ምድብ 3', name: 'ወጣት', ageRange: '18+', badge: 'adult', idPrefix: 'ወ' },
}

// e.g. "ምድብ 1 - ህጻናት (7–13)". Falls back to the API's own categoryLabel field
// if it's present (the backend now includes it directly), otherwise computes it here.
export const categoryLabel = (code) => {
  const c = CATEGORIES[code]
  return c ? `${c.number} - ${c.name} (${c.ageRange})` : (code || '—')
}

// Same as categoryLabel but without the "ምድብ N -" prefix, e.g. "ህጻናት (7–13)".
export const categoryNameAge = (code) => {
  const c = CATEGORIES[code]
  return c ? `${c.name} (${c.ageRange})` : (code || '—')
}

// Just the plain category name, e.g. "ህጻናት".
export const categoryName = (code) => CATEGORIES[code]?.name || (code || '—')

export const categoryBadge = (code) => CATEGORIES[code]?.badge || ''

// Computes the category client-side from an Ethiopian birth year, mirroring
// backend/src/utils/ethiopianDate.js + studentCategory.js exactly. Used to
// conditionally show/hide fields in the student form before the student is saved.
export const categoryForBirthYear = (birthYear) => {
  const year = parseInt(birthYear, 10)
  if (!year || isNaN(year)) return null
  const currentEthiopianYear = new Date().getFullYear() - 8
  const age = currentEthiopianYear - year
  if (age <= 13) return 'MIDIB_1'
  if (age <= 17) return 'MIDIB_2'
  return 'MIDIB_3'
}
