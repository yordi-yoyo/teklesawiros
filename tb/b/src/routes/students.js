const express = require('express');
const { sequelize, Student, Course, CourseProgress, Attendance } = require('../models');
const { calculateAge, nowEthiopian } = require('../utils/ethiopianDate');
const { categoryForAge } = require('../utils/studentCategory');
const { generateStudentNumber } = require('../utils/studentNumber');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/students - create, and auto-enroll in the first course (courseOrder ASC).
// Wrapped in a transaction: if there's no course to enroll in (or anything else
// fails), the whole thing rolls back - no half-created student left behind.
router.post('/', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const body = req.body;
    const age = calculateAge(parseInt(body.birthYear, 10));
    const category = categoryForAge(age);

    // Count/generate must happen inside the transaction too, so concurrent
    // creates in the same category can't race to the same number.
    const { studentNumber, registrationYear } = await generateStudentNumber(category, { transaction: t });

    const student = await Student.create({
      ...body,
      category,
      studentNumber,
      registrationYear,
      createdAt: nowEthiopian(),
      formDate: nowEthiopian(),
    }, { transaction: t });
    // Enroll the student in the first course of EVERY category track
    // (zema, nbab, etc.) so they can progress through multiple tracks
    // in parallel, instead of a single global "first course."
    const allCourses = await Course.findAll({ order: [['courseOrder', 'ASC']], transaction: t });
    if (allCourses.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'No courses configured - add a course before adding students' });
    }

    const firstCourseByCategory = new Map(); // categoryId (or 'none') -> lowest-courseOrder course
    for (const c of allCourses) {
      const key = c.categoryId ?? 'none';
      const existing = firstCourseByCategory.get(key);
      if (!existing || c.courseOrder < existing.courseOrder) {
        firstCourseByCategory.set(key, c);
      }
    }

    for (const firstCourse of firstCourseByCategory.values()) {
      await CourseProgress.create({
        studentId: student.id,
        courseId: firstCourse.id,
        completed: false,
      }, { transaction: t });
    }

    await t.commit();
    return res.json(student);
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/students
router.get('/', async (req, res) => {
  const students = await Student.findAll();
  return res.json(students);
});

// GET /api/students/:id
router.get('/:id', async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).end();
  return res.json(student);
});

// GET /api/students/:id/courses
router.get('/:id/courses', async (req, res) => {
  const exists = await Student.findByPk(req.params.id);
  if (!exists) return res.json(null); // matches Optional.empty() -> body null, same as original

  const progress = await CourseProgress.findAll({
    where: { studentId: req.params.id },
    include: [{ model: Course, as: 'course' }], // student intentionally omitted (matches @JsonBackReference)
  });
  return res.json(progress);
});

// GET /api/students/:id/full-details
router.get('/:id/full-details', async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).end();

  const courseProgress = await CourseProgress.findAll({
    where: { studentId: req.params.id },
    include: [{ model: Course, as: 'course' }],
  });

  return res.json({ student, courseProgress });
});

// PUT /api/students/:id - SUPERADMIN only
router.put('/:id', requireRole('SUPERADMIN'), async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).end();

  const editableFields = [
    'firstName', 'fatherName', 'grandfatherName', 'christianName',
    'mobile', 'homePhone', 'studentOrWorker',
    'address', 'subcity', 'woreda', 'houseNumber',
    'churchName', 'religiousRank', 'confessionFatherName',
    'educationLevel', 'schoolName', 'isSundaySchoolStudent',
  ];
  for (const field of editableFields) {
    if (req.body[field] !== undefined && req.body[field] !== null) {
      student[field] = req.body[field];
    }
  }
  await student.save();
  return res.json(student);
});

// DELETE /api/students/:id - SUPERADMIN only
router.delete('/:id', requireRole('SUPERADMIN'), async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  if (!student) return res.status(404).end();

  await Attendance.destroy({ where: { studentId: req.params.id } });
  await CourseProgress.destroy({ where: { studentId: req.params.id } });
  await student.destroy();
  return res.status(204).end();
});

module.exports = router;
