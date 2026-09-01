const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Course = sequelize.define('Course', {
  courseName: DataTypes.STRING,
  duration: DataTypes.STRING,
  courseOrder: DataTypes.INTEGER,
}, {
  tableName: 'course',
  timestamps: false,
});

module.exports = Course;
