const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Admin = sequelize.define('Admin', {
  adminNumber: { type: DataTypes.STRING, unique: true },
  fullName: DataTypes.STRING,
  username: { type: DataTypes.STRING, unique: true },
  password: DataTypes.STRING, // bcrypt hash, never returned to clients
  role: DataTypes.ENUM('SUPERADMIN', 'ADMIN'),
  createdAt: DataTypes.STRING, // Ethiopian date string

  phone: DataTypes.STRING,             // ስልክ ቁጥር
  address: DataTypes.STRING,           // ሙሉ አድራሻ
  christianName: DataTypes.STRING,     // የክርስትና ስም
  religiousEducationLevel: DataTypes.STRING, // ሃይማኖታዊ የት/ት ደረጃ
  qeneSchoolStatus: DataTypes.STRING,  // ቅኔ ቤት ትምህርት ሁኔታ - set/edited by superadmin only
}, {
  tableName: 'admin',
  timestamps: false,
});

module.exports = Admin;
