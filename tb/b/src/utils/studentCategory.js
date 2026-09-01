// Student category system.
//
//   MIDIB_1 -> ምድብ 1 (ህጻናት / children), ages 7–13
//   MIDIB_2 -> ምድብ 2 (ማእከላውያን / teenagers), ages 14–17
//   MIDIB_3 -> ምድብ 3 (ወጣት / adults), ages 18+
//
// The DB stores the ASCII code (MIDIB_1/2/3) - the Amharic label lives here,
// in one place, so backend and frontend both read from the same definitions
// (the frontend keeps its own copy of this file in sync, see
// fixed-frontend/src/constants/categories.js).

const CATEGORIES = {
  MIDIB_1: { number: 'ምድብ 1', name: 'ህጻናት', ageRange: '7–13', digit: 'ህ' },
  MIDIB_2: { number: 'ምድብ 2', name: 'ማእከላውያን', ageRange: '14–17', digit: 'ማ' },
  MIDIB_3: { number: 'ምድብ 3', name: 'ወጣት', ageRange: '18+', digit: 'ወ' },
};

// Any age below 7 still falls into MIDIB_1 (no category exists below "children").
function categoryForAge(age) {
  if (age <= 13) return 'MIDIB_1';
  if (age <= 17) return 'MIDIB_2';
  return 'MIDIB_3';
}

function labelFor(categoryCode) {
  const c = CATEGORIES[categoryCode];
  return c ? `${c.number} - ${c.name} (${c.ageRange})` : categoryCode;
}

module.exports = { CATEGORIES, categoryForAge, labelFor };
