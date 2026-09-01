const { Student } = require('../models');
const { CATEGORIES } = require('./studentCategory');
const { currentEthiopian } = require('./ethiopianDate');

// e.g. "ህ-0001/2018", "ማ-0001/2018", "ወ-0001/2018". The leading Amharic letter
// tells you the category, the number is a per-category sequence for THAT
// registration year, and the trailing /YYYY is the Ethiopian year registered.
async function generateStudentNumber(category, options = {}) {
  const digit = CATEGORIES[category]?.digit || '0';
  const year = currentEthiopian().year;

  // Sequence restarts each Ethiopian year, scoped to category + year, so
  // numbering stays clean year over year instead of growing forever.
  const countInCategoryThisYear = await Student.count({
    where: { category, registrationYear: year },
    ...options,
  });
  const next = countInCategoryThisYear + 1;
  return { studentNumber: `${digit}-${String(next).padStart(4, '0')}/${year}`, registrationYear: year };
}

module.exports = { generateStudentNumber };
