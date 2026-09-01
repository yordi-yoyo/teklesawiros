require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const { sequelize } = require('./models');
const { basicAuth } = require('./middleware/auth');
const seedSuperAdmin = require('./seed/seedSuperAdmin');

const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const courseCategoryRoutes = require('./routes/courseCategories');
const courseProgressRoutes = require('./routes/courseProgress');
const attendanceRoutes = require('./routes/attendance');
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admins');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS ||
  'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,https://teklesawiros.netlify.app'
).split(',').map(o => o.trim());

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json());
app.use(basicAuth); // parses Basic auth header into req.admin if valid, on every request

app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/course-categories', courseCategoryRoutes);
app.use('/api/course-progress', courseProgressRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admins', adminRoutes);

async function start() {
  // createDatabaseIfNotExist=true equivalent: create the DB before Sequelize connects to it.
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
  });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'religious_db'}\``);
  await conn.end();

  await sequelize.authenticate();
  await sequelize.sync({ alter: true }); // ddl-auto: update equivalent

  await seedSuperAdmin();

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Teklesawiros backend (Node) listening on port ${port}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});