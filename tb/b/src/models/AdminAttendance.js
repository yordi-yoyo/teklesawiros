const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdminAttendance = sequelize.define('AdminAttendance', {
  date: DataTypes.STRING, // Ethiopian date string YYYY-MM-DD (STRING, not DATEONLY, since Ethiopian month 13 has no equivalent in SQL DATE)
  present: DataTypes.BOOLEAN,
  status: { type: DataTypes.STRING, defaultValue: 'PRESENT' },
}, {
  tableName: 'admin_attendance',
  timestamps: false,
});

module.exports = AdminAttendance;
