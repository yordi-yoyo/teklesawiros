import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

const PAGE_LABELS = {
  '/dashboard':  'ዳሽቦርድ',
  '/students':   'ተማሪዎች',
  '/courses':    'ትምህርቶች',
  '/attendance': 'ቁጥጥር',
  '/admins':     'አድሚኖች',
}

export default function MobileBreadcrumb() {
  const location = useLocation()
  const navigate = useNavigate()
  const label = PAGE_LABELS[location.pathname] || ''

  return (
    <div className="mobile-breadcrumb">
      <button className="mobile-breadcrumb-home" onClick={() => navigate('/dashboard')} aria-label="ዳሽቦርድ"><Home size={15} /></button>
      <span className="mobile-breadcrumb-sep">›</span>
      <span className="mobile-breadcrumb-current">{label}</span>
    </div>
  )
}
