// One-off script: enrolls every existing student into the first course of
// any category track they aren't already enrolled in. Safe to run more
// than once - it only adds missing tracks, never touches existing progress.
//
// Run from tb/b with:  node src/scripts/backfillCourseTracks.js
require('dotenv').config();
const { sequelize, Student, Course, CourseProgress } = require('../models');

async function run() {
  const allCourses = await Course.findAll({ order: [['courseOrder', 'ASC']] });
  if (allCourses.length === 0) {
    console.log('No courses configured - nothing to backfill.');
    return;
  }

  const firstCourseByCategory = new Map();
  for (const course of allCourses) {
    const key = course.categoryId ?? 'none';
    if (!firstCourseByCategory.has(key)) firstCourseByCategory.set(key, course);
  }

  const students = await Student.findAll();
  let created = 0;

  for (const student of students) {
    const existing = await CourseProgress.findAll({
      where: { studentId: student.id },
      include: [{ model: Course, as: 'course' }],
    });
    const enrolledCategoryKeys = new Set(
      existing.map(p => p.course?.categoryId ?? 'none')
    );

    for (const [key, course] of firstCourseByCategory.entries()) {
      if (enrolledCategoryKeys.has(key)) continue; // already has this track
      await CourseProgress.create({
        studentId: student.id,
        courseId: course.id,
        completed: false,
      });
      created++;
      console.log(`Enrolled student ${student.id} (${student.firstName} ${student.fatherName}) into "${course.courseName}"`);
    }
  }

  console.log(`Done. Created ${created} new course-progress row(s).`);
}

run()
  .then(() => sequelize.close())
  .catch(err => {
    console.error('Backfill failed:', err);
    sequelize.close();
  });