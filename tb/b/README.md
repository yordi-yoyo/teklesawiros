# Teklesawiros Backend (Node.js)

A Node.js/Express + Sequelize/MySQL rewrite of the original Spring Boot backend.
Same API routes, same JSON field names as before — the existing React frontend
(`fixed-frontend`) works against this with **zero changes**, just point
`BASE_URL` in `src/api/index.js` at wherever this runs.

## Run locally

1. Have MySQL running locally (or set `DB_HOST`/`DB_PORT` to a remote one).
2. `cp .env.example .env` and fill in your local values (DB password, etc).
3. `npm install`
4. `npm start` (or `npm run dev` for auto-restart on file changes)

The server creates the database if it doesn't exist, creates all tables on
boot (`sequelize.sync({ alter: true })`, same idea as `ddl-auto: update`),
and seeds one superadmin from `ADMIN_USERNAME`/`ADMIN_PASSWORD` if the
`admin` table is empty.

## Roles

- **SUPERADMIN** (exactly one, seeded on first run): the only role allowed to
  hit any `PUT` or `DELETE` endpoint anywhere in the API — editing/deleting
  students, deleting courses, editing/deleting admin accounts, and creating
  new admin accounts (`POST /api/admins`).
- **ADMIN**: everything else — viewing data, creating students, marking
  attendance, logging in, changing their own password.

Create the 4 admin accounts by logging in as the superadmin and calling:

```
POST /api/admins
Authorization: Basic <superadmin creds>
{ "fullName": "...", "username": "...", "password": "...", "role": "ADMIN" }
```

Each gets an auto-generated number: `SA-001` for the superadmin, `AD-001`,
`AD-002`, `AD-003`, `AD-004` for the admins.

## Endpoints

Same paths as the original Java backend, plus new `/api/admins/*` routes:

- `POST /api/admin/login`, `POST /api/admin/change-password`
- `GET/POST/PUT/DELETE /api/students`, `GET /api/students/:id/courses`, `GET /api/students/:id/full-details`
- `GET/POST/DELETE /api/courses`
- `POST /api/course-progress/approve?studentId=&courseId=`
- `POST/GET /api/attendance/...` (student attendance)
- `GET/POST/PUT/DELETE /api/admins`, `POST/GET /api/admins/:id/attendance` (admin's own attendance)

## Notes

- Auth is HTTP Basic, matching the old backend — the frontend's existing
  `btoa(username:password)` login flow needs no changes.
- Passwords are bcrypt-hashed and password changes persist to the DB (unlike
  the very first Java version, which reset on every restart).
- `admin.password` is never included in any API response.
