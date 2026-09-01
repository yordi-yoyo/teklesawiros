const bcrypt = require('bcryptjs');
const { Admin } = require('../models');
const { generateAdminNumber } = require('../utils/adminNumber');
const { nowEthiopian } = require('../utils/ethiopianDate');

async function seedSuperAdmin() {
  const count = await Admin.count();
  if (count > 0) return;

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  await Admin.create({
    fullName: 'Super Admin',
    username,
    password: await bcrypt.hash(password, 10),
    role: 'SUPERADMIN',
    adminNumber: await generateAdminNumber('SUPERADMIN'),
    createdAt: nowEthiopian(),
  });

  console.log(`Seeded initial superadmin: ${username}`);
}

module.exports = seedSuperAdmin;
