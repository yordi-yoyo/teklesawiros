const express = require('express');
const { Op } = require('sequelize');
const { Attendance, Student, CourseProgress, Course } = require('../models');
const { nowEthiopian } = require('../utils/ethiopianDate');

const router = express.Router();

// Accepts either ?status=PRESENT|ABSENT|PERMISSION (preferred) or the older
// ?present=true|false for backward compatibility.
function resolveStatus(query) {
  if (query.status && ['PRESENT', 'ABSENT', 'PERMISSION'].includes(query.status)) {
    return query.status;
  }
  return query.present === 'true' ? 'PRESENT' : 'ABSENT';
}

// POST /api/attendance/:studentId?status=PRESENT|ABSENT|PERMISSION
router.post('/:studentId', async (req, res) => {
  const student = await Student.findByPk(req.params.studentId);
  if (!student) return res.status(500).json({ message: 'Student not found' });

  const status = resolveStatus(req.query);
  const attendance = await Attendance.create({
    studentId: student.id,
    present: status === 'PRESENT',
    status,
    date: nowEthiopian(),
  });
  return res.json(attendance);
});

// GET /api/attendance/student/:studentId
router.get('/student/:studentId', async (req, res) => {
  const records = await Attendance.findAll({
    where: { studentId: req.params.studentId },
    include: [{
      model: Student,
      as: 'student',
      include: [{ model: CourseProgress, as: 'courses', include: [{ model: Course, as: 'course' }] }],
    }],
  });
  return res.json(records);
});

// GET /api/attendance/student/:studentId/summary
router.get('/student/:studentId/summary', async (req, res) => {
  const records = await Attendance.findAll({ where: { studentId: req.params.studentId } });
  const presentCount    = records.filter(r => (r.status || (r.present ? 'PRESENT' : 'ABSENT')) === 'PRESENT').length;
  const permissionCount = records.filter(r => r.status === 'PERMISSION').length;
  const absentCount     = records.length - presentCount - permissionCount;
  const attendancePercentage = records.length === 0 ? 0 : (presentCount * 100.0) / records.length;

  return res.json({
    studentId: Number(req.params.studentId),
    totalSessions: records.length,
    presentSessions: presentCount,
    absentSessions: absentCount,
    permissionSessions: permissionCount,
    attendancePercentage,
  });
});

// GET /api/attendance/student/:studentId/date-range?startDate=X&endDate=Y
router.get('/student/:studentId/date-range', async (req, res) => {
  const { startDate, endDate } = req.query;
  const records = await Attendance.findAll({
    where: {
      studentId: req.params.studentId,
      date: { [Op.between]: [startDate, endDate] },
    },
  });
  return res.json(records);
});

// GET /api/attendance/report?startDate=X&endDate=Y - ALL students' attendance in range
router.get('/report', async (req, res) => {
  const { startDate, endDate } = req.query;
  const where = {};
  if (startDate && endDate) {
    where.date = { [Op.between]: [startDate, endDate] };
  }
  const records = await Attendance.findAll({
    where,
    include: [{ model: Student, as: 'student' }],
    order: [['date', 'ASC']],
  });
  return res.json(records);
});

module.exports = router;
