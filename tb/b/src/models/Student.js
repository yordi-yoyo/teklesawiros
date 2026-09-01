const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { labelFor } = require('../utils/studentCategory');

const Student = sequelize.define('Student', {
  firstName: DataTypes.STRING,
  fatherName: DataTypes.STRING,
  grandfatherName: DataTypes.STRING,
  christianName: DataTypes.STRING,

  birthDay: DataTypes.STRING,
  birthMonth: DataTypes.STRING,
  birthYear: DataTypes.STRING,

  hasConfessionFather: DataTypes.STRING,
  confessionFatherName: DataTypes.STRING,
  churchName: DataTypes.STRING,

  noConfessionReason: DataTypes.STRING(1000),

  religiousRank: DataTypes.STRING,

  address: DataTypes.STRING,
  subcity: DataTypes.STRING,
  woreda: DataTypes.STRING,
  houseNumber: DataTypes.STRING,
  homePhone: DataTypes.STRING,
  mobile: DataTypes.STRING,
  secondaryMobile: DataTypes.STRING, // alternate phone - used for MIDIB_3 (ወጣት) students
  studentOrWorker: DataTypes.STRING, // e.g. "ተማሪ" or "ሰራተኛ" - used for MIDIB_3 (ወጣት) students

  educationLevel: DataTypes.STRING,
  schoolName: DataTypes.STRING,
  isSundaySchoolStudent: DataTypes.STRING,
  currentStatus: DataTypes.STRING,

  parentName: DataTypes.STRING,
  parentAddress: DataTypes.STRING,
  parentSubcity: DataTypes.STRING,
  parentWoreda: DataTypes.STRING,
  parentHouseNumber: DataTypes.STRING,
  parentHomePhone: DataTypes.STRING,
  parentMobile: DataTypes.STRING,

  formDate: DataTypes.STRING, // Ethiopian date string
  registrantName: DataTypes.STRING,
  signature: DataTypes.STRING,

  createdAt: DataTypes.STRING, // Ethiopian date string

  category: DataTypes.ENUM('MIDIB_1', 'MIDIB_2', 'MIDIB_3'),

  // e.g. "1-0001" - leading digit reflects category (1/2/3), generated at creation.
  studentNumber: { type: DataTypes.STRING, unique: true },
  registrationYear: DataTypes.INTEGER, // Ethiopian year, used to scope studentNumber sequencing per year

  finishedCourseId: DataTypes.BIGINT,

  imageurl: DataTypes.STRING,

  // Not a real DB column - computed on the fly so every API response
  // includes the ready-to-display Amharic label alongside the raw code.
  categoryLabel: {
    type: DataTypes.VIRTUAL,
    get() {
      return labelFor(this.getDataValue('category'));
    },
  },
}, {
  tableName: 'student',
  timestamps: false, // createdAt is a manually-managed DATEONLY column, not Sequelize's auto timestamp
});

module.exports = Student;
