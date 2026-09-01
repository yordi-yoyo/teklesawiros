import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login      from './pages/Login'
import Dashboard  from './pages/Dashboard'
import Students   from './pages/Students'
import Courses    from './pages/Courses'
import Attendance from './pages/Attendance'
import Admins     from './pages/Admins'
import { isSuperAdmin } from './utils/currentAdmin'

function PrivateRoute({ children }) {
  // Guard on basicAuth (Basic Auth credentials), not JWT token
  const auth = localStorage.getItem('basicAuth')
  return auth ? children : <Navigate to="/" replace />
}

function SuperAdminRoute({ children }) {
  const auth = localStorage.getItem('basicAuth')
  if (!auth) return <Navigate to="/" replace />
  return isSuperAdmin() ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Login />} />
        <Route path="/dashboard"  element={<PrivateRoute><Dashboard  /></PrivateRoute>} />
        <Route path="/students"   element={<PrivateRoute><Students   /></PrivateRoute>} />
        <Route path="/courses"    element={<PrivateRoute><Courses    /></PrivateRoute>} />
        <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
        <Route path="/admins"     element={<SuperAdminRoute><Admins     /></SuperAdminRoute>} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
