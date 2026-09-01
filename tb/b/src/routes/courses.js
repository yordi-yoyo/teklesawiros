const express = require('express');
const { Course, CourseProgress, Student, CourseCategory } = require('../models');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/courses - accepts an optional categoryId
router.post('/', async (req, res) => {
  const { courseName, duration, courseOrder, categoryId } = req.body;
  const course = await Course.create({ courseName, duration, courseOrder, categoryId: categoryId || null });
  return res.json(course);
});

// GET /api/courses - includes a live studentCount per course + its category
router.get('/', async (req, res) => {
  const courses = await Course.findAll({
    order: [['courseOrder', 'ASC']],
    include: [{ model: CourseCategory, as: 'category', include: [{ model: CourseCategory, as: 'parent' }] }],
  });
  const withCounts = await Promise.all(courses.map(async c => {
    const studentCount = await CourseProgress.count({ where: { courseId: c.id } });
    return { ...c.toJSON(), studentCount };
  }));
  return res.json(withCounts);
});

// GET /api/courses/:id/roster - every student currently on this course, with completion status
router.get('/:id/roster', async (req, res) => {
  const progress = await CourseProgress.findAll({
    where: { courseId: req.params.id },
    include: [{ model: Student, as: 'student' }],
  });
  return res.json(progress);
});

// PUT /api/courses/:id - SUPERADMIN only
router.put('/:id', requireRole('SUPERADMIN'), async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).end();

  const { courseName, duration, courseOrder, categoryId } = req.body;
  if (courseName !== undefined) course.courseName = courseName;
  if (duration !== undefined) course.duration = duration;
  if (courseOrder !== undefined) course.courseOrder = courseOrder;
  if (categoryId !== undefined) course.categoryId = categoryId || null;
  await course.save();

  return res.json(course);
});
// POST /api/courses/:id/enroll - SUPERADMIN only - manually add an existing
// student to this course, regardless of what course they're currently on
router.post('/:id/enroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const existing = await CourseProgress.findOne({ where: { studentId, courseId: course.id } });
    if (existing) return res.status(400).json({ message: 'Student already enrolled in this course' });

    const progress = await CourseProgress.create({ studentId, courseId: course.id, completed: false });
    return res.json(progress);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// DELETE /api/courses/:id - SUPERADMIN only
router.delete('/:id', requireRole('SUPERADMIN'), async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) return res.status(404).end();
  await course.destroy();
  return res.status(204).end();
});

module.exports = router;
