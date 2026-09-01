const express = require('express');
const { Op } = require('sequelize');
const { CourseProgress, Course, Student } = require('../models');
const { nowEthiopian } = require('../utils/ethiopianDate');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/course-progress/approve?studentId=X&courseId=Y
router.post('/approve', requireRole('SUPERADMIN'), async (req, res) => {
  try {
    const { studentId, courseId } = req.query;

    const progress = await CourseProgress.findOne({
      where: { studentId, courseId },
      include: [{ model: Course, as: 'course' }],
    });
    if (!progress) {
      return res.status(500).json({ message: 'Course not assigned to student' });
    }
    if (progress.completed) {
      return res.status(500).json({ message: 'Course already completed' });
    }

    progress.completed = true;
    progress.completedDate = nowEthiopian();
    await progress.save();

    // "Next" = the closest higher courseOrder in the SAME category track -
    // a student may be progressing through several tracks (e.g. zema and
    // nbab) at once, and courseOrder numbers aren't guaranteed to be
    // contiguous (e.g. 1, then 4, with nothing at 2 or 3), so this is not
    // simply "+1".
    const nextCourse = await Course.findOne({
      where: {
        categoryId: progress.course.categoryId,
        courseOrder: { [Op.gt]: progress.course.courseOrder },
      },
      order: [['courseOrder', 'ASC']],
    });

    if (nextCourse) {
      await CourseProgress.create({
        studentId,
        courseId: nextCourse.id,
        completed: false,
      });
    } else {
      // Last course in this track - records this student's most recently
      // finished track. (If they finish multiple tracks, this ends up
      // holding whichever one was completed last.)
      await Student.update(
        { finishedCourseId: progress.course.id },
        { where: { id: studentId } }
      );
    }

    return res.send('Course approved successfully');
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;