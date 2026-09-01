import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach Basic Auth to every request from stored credentials
api.interceptors.request.use(cfg => {
  const creds = localStorage.getItem('basicAuth')
  if (creds) cfg.headers.Authorization = `Basic ${creds}`
  return cfg
})

// Auto-logout on 401
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('basicAuth')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────
// Backend: POST /api/admin/login with Basic Auth header
export const login = (username, password) => {
  const encoded = btoa(`${username}:${password}`)
  return axios.post(
    `${BASE_URL}/api/admin/login`,
    {},
    {
      headers: {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    }
  )
}

export const changePassword = (data) =>
  api.post('/admin/change-password', data)

// ── Students ──────────────────────────────────────
export const getStudents       = ()        => api.get('/students')
export const getStudent        = id        => api.get(`/students/${id}`)
export const createStudent     = data      => api.post('/students', data)
export const updateStudent     = (id, d)   => api.put(`/students/${id}`, d)
export const getStudentCourses = id        => api.get(`/students/${id}/courses`)
export const getStudentFullDetails = id    => api.get(`/students/${id}/full-details`)

// ── Courses ──────────────────────────────────────
export const getCourses    = ()      => api.get('/courses')
export const getCourseCategories   = ()      => api.get('/course-categories')
export const createCourseCategory  = data    => api.post('/course-categories', data)
export const updateCourseCategory  = (id, d) => api.put(`/course-categories/${id}`, d)
export const deleteCourseCategory  = id      => api.delete(`/course-categories/${id}`)
export const getCourseRoster = id    => api.get(`/courses/${id}/roster`)
export const enrollStudentInCourse = (courseId, studentId) => api.post(`/courses/${courseId}/enroll`, { studentId })
export const createCourse  = data    => api.post('/courses', data)
export const updateCourse  = (id, d) => api.put(`/courses/${id}`, d)

// ── Course Progress ───────────────────────────────
// Backend: POST /api/course-progress/approve?studentId=X&courseId=Y
export const approveCourse = (studentId, courseId) =>
  api.post(`/course-progress/approve?studentId=${studentId}&courseId=${courseId}`)

// ── Attendance ────────────────────────────────────
// Backend: POST /api/attendance/{studentId}?status=PRESENT|ABSENT|PERMISSION
export const markAttendance = (studentId, status) =>
  api.post(`/attendance/${studentId}?status=${status}`)

// Backend: GET /api/attendance/student/{studentId}
export const getStudentAttendance = studentId =>
  api.get(`/attendance/student/${studentId}`)

// Backend: GET /api/attendance/student/{studentId}/summary
export const getAttendanceSummary = studentId =>
  api.get(`/attendance/student/${studentId}/summary`)

// Backend: GET /api/attendance/student/{studentId}/date-range?startDate=X&endDate=Y
export const getAttendanceByDateRange = (studentId, startDate, endDate) =>
  api.get(`/attendance/student/${studentId}/date-range?startDate=${startDate}&endDate=${endDate}`)

// Backend: GET /api/attendance/report?startDate=X&endDate=Y - ALL students in range
export const getAttendanceReport = (startDate, endDate) =>
  api.get(`/attendance/report?startDate=${startDate}&endDate=${endDate}`)

export default api
export const deleteStudent = id => api.delete(`/students/${id}`)
export const deleteCourse = id => api.delete(`/courses/${id}`)

// ── Admins (superadmin manages admin accounts) ────
export const getAdmins       = ()      => api.get('/admins')
export const getAdmin        = id      => api.get(`/admins/${id}`)
export const createAdmin     = data    => api.post('/admins', data)
export const updateAdmin     = (id, d) => api.put(`/admins/${id}`, d)
export const deleteAdmin     = id      => api.delete(`/admins/${id}`)

// ── Admin attendance (superadmin sets it for admins) ──
export const markAdminAttendance = (adminId, status) =>
  api.post(`/admins/${adminId}/attendance?status=${status}`)

export const getAdminAttendance = adminId =>
  api.get(`/admins/${adminId}/attendance`)

export const getAdminAttendanceSummary = adminId =>
  api.get(`/admins/${adminId}/attendance/summary`)