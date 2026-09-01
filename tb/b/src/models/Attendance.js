const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Attendance = sequelize.define('Attendance', {
  date: DataTypes.STRING, // Ethiopian date string YYYY-MM-DD (STRING, not DATEONLY, since Ethiopian month 13 has no equivalent in SQL DATE)
  present: DataTypes.BOOLEAN,
  // 'PRESENT' | 'ABSENT' | 'PERMISSION' (ፍቃድ) - present boolean above is kept
  // in sync (true only for PRESENT) for backward compatibility.
  status: { type: DataTypes.STRING, defaultValue: 'PRESENT' },
}, {
  tableName: 'attendance',
  timestamps: false,
});

module.exports = Attendance;
