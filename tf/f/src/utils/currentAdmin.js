// Reads the currently logged-in admin's identity, stored at login time
// (see pages/Login.jsx). Used for role-aware UI - hiding edit/delete
// buttons from non-superadmin logins, etc.

export const getCurrentAdmin = () => ({
  id: localStorage.getItem('adminId'),
  username: localStorage.getItem('adminUsername'),
  role: localStorage.getItem('adminRole'),
  adminNumber: localStorage.getItem('adminNumber'),
  fullName: localStorage.getItem('adminFullName'),
})

export const isSuperAdmin = () => localStorage.getItem('adminRole') === 'SUPERADMIN'
