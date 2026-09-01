const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CourseProgress = sequelize.define('CourseProgress', {
  completed: { type: DataTypes.BOOLEAN, defaultValue: false },
  completedDate: DataTypes.STRING, // Ethiopian date string
}, {
  tableName: 'course_progress',
  timestamps: false,
});

module.exports = CourseProgress;