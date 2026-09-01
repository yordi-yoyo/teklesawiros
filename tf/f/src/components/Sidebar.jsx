import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, GraduationCap, BookOpen, ClipboardCheck, UserCog, LogOut } from 'lucide-react'
import abuneImg from '../assets/abuneselama.jpg'
import tekleImg  from '../assets/teklesawiros.jpg'
import { getCurrentAdmin, isSuperAdmin } from '../utils/currentAdmin'

const navItems = [
  { path: '/dashboard',   Icon: LayoutDashboard, label: 'ዳሽቦርድ'   },
  { path: '/students',    Icon: GraduationCap,   label: 'ተማሪዎች'   },
  { path: '/courses',     Icon: BookOpen,        label: 'ትምህርቶች'   },
  { path: '/attendance',  Icon: ClipboardCheck,  label: 'ቁጥጥር'     },
  { path: '/admins',      Icon: UserCog,         label: 'አድሚኖች', superAdminOnly: true },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const me = getCurrentAdmin()
  const visibleNavItems = navItems.filter(item => !item.superAdminOnly || isSuperAdmin())

  const handleLogout = () => {
    localStorage.removeItem('basicAuth')
    localStorage.removeItem('adminUsername')
    localStorage.removeItem('adminId')
    localStorage.removeItem('adminRole')
    localStorage.removeItem('adminNumber')
    localStorage.removeItem('adminFullName')
    navigate('/')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logos">
          <img src={abuneImg} alt="አቡነ ሰላማ" />
          <img src={tekleImg}  alt="ተክለ ሳዊሮስ" />
        </div>
        <div className="sidebar-title">
          ተክለ ሳዊሮስ ሰንበት ት/ቤት 
       
          <br />
     
           <span>ከሣቴ ብርሃን ጉባኤ ቤት     
                    
                  </span> <br/>
                  
          <span style={{ fontSize: '10px', opacity: 0.7 }}>Student Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {visibleNavItems.map(item => (
          <button
            key={item.path}
            className={`nav-link${location.pathname === item.path ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon"><item.Icon size={18} strokeWidth={2} /></span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {me.fullName && (
          <div style={{ fontSize: '11px', opacity: 0.75, marginBottom: '8px', textAlign: 'center' }}>
            {me.adminNumber} — {me.fullName}<br />
            {me.role === 'SUPERADMIN' ? 'ዋና አድሚን' : 'አድሚን'}
          </div>
        )}
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <LogOut size={15} /> ውጣ / Logout
        </button>
      </div>
    </aside>
  )
}
