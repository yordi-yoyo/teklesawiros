const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Admin, AdminAttendance } = require('../models');
const { generateAdminNumber } = require('../utils/adminNumber');
const { requireRole } = require('../middleware/auth');
const { nowEthiopian } = require('../utils/ethiopianDate');

const router = express.Router();

function toSafeView(admin) {
  return {
    id: admin.id,
    adminNumber: admin.adminNumber,
    fullName: admin.fullName,
    username: admin.username,
    role: admin.role,
    createdAt: admin.createdAt,
    phone: admin.phone,
    address: admin.address,
    christianName: admin.christianName,
    religiousEducationLevel: admin.religiousEducationLevel,
    qeneSchoolStatus: admin.qeneSchoolStatus,
  };
}

// POST /api/admins - SUPERADMIN only (create a new admin account)
router.post('/', requireRole('SUPERADMIN'), async (req, res) => {
  const { fullName, username, password, role, phone, address, christianName, religiousEducationLevel, qeneSchoolStatus } = req.body;

  try {
    const existing = await Admin.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ message: `Username already taken: ${username}` });
    }
    if (role === 'SUPERADMIN') {
      const superadminCount = await Admin.count({ where: { role: 'SUPERADMIN' } });
      if (superadminCount > 0) {
        return res.status(400).json({ message: 'A superadmin already exists. Only one superadmin is allowed.' });
      }
    }

    const adminNumber = await generateAdminNumber(role);
    const admin = await Admin.create({
      fullName,
      username,
      password: await bcrypt.hash(password, 10),
      role,
      adminNumber,
      phone,
      address,
      christianName,
      religiousEducationLevel,
      qeneSchoolStatus,
      createdAt: nowEthiopian(),
    });

    return res.status(201).json(toSafeView(admin));
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// GET /api/admins - SUPERADMIN only (the whole admin roster is superadmin-only now)
router.get('/', requireRole('SUPERADMIN'), async (req, res) => {
  const admins = await Admin.findAll({ order: [['createdAt', 'ASC']] });
  return res.json(admins.map(toSafeView));
});

// GET /api/admins/:id - SUPERADMIN only
router.get('/:id', requireRole('SUPERADMIN'), async (req, res) => {
  const admin = await Admin.findByPk(req.params.id);
  if (!admin) return res.status(404).end();
  return res.json(toSafeView(admin));
});

// PUT /api/admins/:id - SUPERADMIN only
router.put('/:id', requireRole('SUPERADMIN'), async (req, res) => {
  const admin = await Admin.findByPk(req.params.id);
  if (!admin) return res.status(404).end();

  if (req.body.fullName) admin.fullName = req.body.fullName;
  if (req.body.username) admin.username = req.body.username;
  if (req.body.phone !== undefined) admin.phone = req.body.phone;
  if (req.body.address !== undefined) admin.address = req.body.address;
  if (req.body.christianName !== undefined) admin.christianName = req.body.christianName;
  if (req.body.religiousEducationLevel !== undefined) admin.religiousEducationLevel = req.body.religiousEducationLevel;
  if (req.body.qeneSchoolStatus !== undefined) admin.qeneSchoolStatus = req.body.qeneSchoolStatus;

  // Superadmin can directly set a new password for any admin - no old
  // password needed, since only the superadmin can reach this route at all.
  if (req.body.newPassword) {
    if (req.body.newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    admin.password = await bcrypt.hash(req.body.newPassword, 10);
  }

  await admin.save();

  return res.json(toSafeView(admin));
});

// DELETE /api/admins/:id - SUPERADMIN only (the superadmin account itself can't be deleted)
router.delete('/:id', requireRole('SUPERADMIN'), async (req, res) => {
  const admin = await Admin.findByPk(req.params.id);
  if (!admin) return res.status(404).end();
  if (admin.role === 'SUPERADMIN') {
    return res.status(403).json({ message: 'The superadmin account cannot be deleted.' });
  }
  await admin.destroy();
  return res.status(204).end();
});

// ── Admin attendance: SUPERADMIN sets it for admins ──────────────
// POST /api/admins/:id/attendance?status=PRESENT|ABSENT|PERMISSION
router.post('/:id/attendance', requireRole('SUPERADMIN'), async (req, res) => {
  const admin = await Admin.findByPk(req.params.id);
  if (!admin) return res.status(500).json({ message: 'Admin not found' });

  const status = ['PRESENT', 'ABSENT', 'PERMISSION'].includes(req.query.status)
    ? req.query.status
    : (req.query.present === 'true' ? 'PRESENT' : 'ABSENT');

  const record = await AdminAttendance.create({
    adminId: admin.id,
    present: status === 'PRESENT',
    status,
    date: nowEthiopian(),
  });
  return res.json(record);
});

// GET /api/admins/:id/attendance - SUPERADMIN only
router.get('/:id/attendance', requireRole('SUPERADMIN'), async (req, res) => {
  const records = await AdminAttendance.findAll({ where: { adminId: req.params.id } });
  return res.json(records);
});

// GET /api/admins/:id/attendance/summary - SUPERADMIN only
router.get('/:id/attendance/summary', requireRole('SUPERADMIN'), async (req, res) => {
  const records = await AdminAttendance.findAll({ where: { adminId: req.params.id } });
  const presentCount    = records.filter(r => (r.status || (r.present ? 'PRESENT' : 'ABSENT')) === 'PRESENT').length;
  const permissionCount = records.filter(r => r.status === 'PERMISSION').length;
  const absentCount     = records.length - presentCount - permissionCount;
  const attendancePercentage = records.length === 0 ? 0 : (presentCount * 100.0) / records.length;

  return res.json({
    adminId: Number(req.params.id),
    totalSessions: records.length,
    presentSessions: presentCount,
    absentSessions: absentCount,
    permissionSessions: permissionCount,
    attendancePercentage,
  });
});

// GET /api/admins/:id/attendance/date-range?startDate=X&endDate=Y
router.get('/:id/attendance/date-range', async (req, res) => {
  const { startDate, endDate } = req.query;
  const records = await AdminAttendance.findAll({
    where: {
      adminId: req.params.id,
      date: { [Op.between]: [startDate, endDate] },
    },
  });
  return res.json(records);
});

module.exports = router;
