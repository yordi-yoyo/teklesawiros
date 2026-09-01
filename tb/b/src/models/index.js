const sequelize = require('../config/db');

const Student = require('./Student');
const Course = require('./Course');
const CourseCategory = require('./CourseCategory');
const CourseProgress = require('./CourseProgress');
const Attendance = require('./Attendance');
const Admin = require('./Admin');
const AdminAttendance = require('./AdminAttendance');

// Student <-> CourseProgress (like @OneToMany(mappedBy="student") / @ManyToOne)
Student.hasMany(CourseProgress, { as: 'courses', foreignKey: 'studentId', onDelete: 'CASCADE' });
CourseProgress.belongsTo(Student, { as: 'student', foreignKey: 'studentId' });

// Course <-> CourseProgress
Course.hasMany(CourseProgress, { as: 'progressEntries', foreignKey: 'courseId' });
CourseProgress.belongsTo(Course, { as: 'course', foreignKey: 'courseId' });

// CourseCategory <-> Course
CourseCategory.hasMany(Course, { as: 'courses', foreignKey: 'categoryId' });
Course.belongsTo(CourseCategory, { as: 'category', foreignKey: 'categoryId' });

// CourseCategory <-> CourseCategory (subcategories)
CourseCategory.hasMany(CourseCategory, { as: 'subcategories', foreignKey: 'parentId' });
CourseCategory.belongsTo(CourseCategory, { as: 'parent', foreignKey: 'parentId' });

// Student <-> Attendance
Student.hasMany(Attendance, { as: 'attendanceRecords', foreignKey: 'studentId', onDelete: 'CASCADE' });
Attendance.belongsTo(Student, { as: 'student', foreignKey: 'studentId' });

// Admin <-> AdminAttendance
Admin.hasMany(AdminAttendance, { as: 'attendanceRecords', foreignKey: 'adminId', onDelete: 'CASCADE' });
AdminAttendance.belongsTo(Admin, { as: 'admin', foreignKey: 'adminId' });

module.exports = {
  sequelize,
  Student,
  Course,
  CourseCategory,
  CourseProgress,
  Attendance,
  Admin,
  AdminAttendance,
};
