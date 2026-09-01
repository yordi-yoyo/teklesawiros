import { toEC } from 'kenat'

// Converts any JS Date to an Ethiopian YYYY-MM-DD string (accurate, not the
// old "Gregorian year - 8" approximation - matches backend/src/utils/ethiopianDate.js)
export function toEthiopianString(jsDate) {
  const { year, month, day } = toEC(jsDate.getFullYear(), jsDate.getMonth() + 1, jsDate.getDate())
  const pad = n => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}`
}

export function todayEthiopian() {
  return toEthiopianString(new Date())
}

// n days before today, as an Ethiopian date string. Computed by first going
// back n days in the Gregorian calendar, then converting - so it lines up
// correctly with how attendance dates are actually stored.
export function ethiopianDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return toEthiopianString(d)
}

// Returns { startDate, endDate } Ethiopian date strings for a given period.
export function reportDateRange(period) {
  const endDate = todayEthiopian()
  if (period === 'daily')   return { startDate: endDate, endDate }
  if (period === 'weekly')  return { startDate: ethiopianDaysAgo(6), endDate }
  if (period === 'monthly') return { startDate: ethiopianDaysAgo(29), endDate }
  return { startDate: endDate, endDate }
}
