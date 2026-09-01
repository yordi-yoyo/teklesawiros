const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CourseCategory = sequelize.define('CourseCategory', {
  name: DataTypes.STRING,
  parentId: DataTypes.INTEGER, // null = top-level category, set = subcategory
}, {
  tableName: 'course_category',
  timestamps: false,
});

module.exports = CourseCategory;