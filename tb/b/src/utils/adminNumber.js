const { Admin } = require('../models');

// e.g. "SA-001" for the superadmin, "AD-001", "AD-002", ... for admins
async function generateAdminNumber(role) {
  const countForRole = await Admin.count({ where: { role } });
  const prefix = role === 'SUPERADMIN' ? 'SA' : 'AD';
  const next = countForRole + 1;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

module.exports = { generateAdminNumber };
