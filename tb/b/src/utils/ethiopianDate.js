// Accurate Gregorian -> Ethiopian calendar conversion, using the kenat library.
// (The previous "Gregorian year - 8" shortcut was wrong for ~3.5 months every
// year - from Ethiopian New Year in September through December - because the
// Ethiopian year only lags by 7, not 8, during that stretch.)

const { toEC } = require('kenat');

function currentEthiopian() {
  const now = new Date();
  return toEC(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function calculateAge(birthYear) {
  const currentEthiopianYear = currentEthiopian().year;
  return currentEthiopianYear - birthYear;
}

function nowEthiopian() {
  const { year, month, day } = currentEthiopian();
  const pad = n => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`; // YYYY-MM-DD, matches LocalDate serialization
}

module.exports = { calculateAge, nowEthiopian, currentEthiopian };
