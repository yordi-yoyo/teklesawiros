const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/admin/login - the Authorization header was already validated by
// the basicAuth middleware in server.js, so if req.admin is set, login is good.
router.post('/login', requireAuth, (req, res) => {
  const admin = req.admin;
  return res.json({
    message: 'Login successful',
    id: admin.id,
    username: admin.username,
    adminNumber: admin.adminNumber,
    fullName: admin.fullName,
    role: admin.role,
  });
});

// POST /api/admin/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  const admin = req.admin;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const matches = currentPassword && await bcrypt.compare(currentPassword, admin.password);
  if (!matches) {
    return res.status(401).json({ message: 'Current password is incorrect', success: false });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters', success: false });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match', success: false });
  }

  admin.password = await bcrypt.hash(newPassword, 10);
  await admin.save();

  return res.json({ message: 'Password changed successfully', success: true });
});

module.exports = router;
