import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileBreadcrumb from '../components/MobileBreadcrumb'
import Kenat from 'kenat';
import { getStudents, getCourses, getAdmins } from '../api'
import { isSuperAdmin } from '../utils/currentAdmin'
import { CATEGORIES, categoryLabel, categoryBadge, categoryNameAge, categoryName } from '../constants/categories'
// Safely extract an array from any API response shape
const toArray = (payload) => {
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload) } catch { return [] }
  }
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const firstArray = Object.values(payload).find(v => Array.isArray(v))
    if (firstArray) return firstArray
  }
  return []
}
export default function Dashboard() {
  const [students, setStudents] = useState([])
  const [courses,  setCourses]  = useState([])
  const [adminCount, setAdminCount] = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([getStudents(), getCourses()])
      .then(([s, c]) => {
        setStudents(toArray(s.data))
        setCourses(toArray(c.data))
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Admin roster is superadmin-only on the backend, so only fetch it
    // when the logged-in admin is actually a superadmin.
    if (isSuperAdmin()) {
      getAdmins()
        .then(r => setAdminCount(toArray(r.data).length))
        .catch(() => {})
    }
  }, [])
  // Backend category enum: MIDIB_1 (7-13), MIDIB_2 (14-17), MIDIB_3 (18+)
  const total   = students.length
  const cat1    = students.filter(s => s.category === 'MIDIB_1').length
  const cat2    = students.filter(s => s.category === 'MIDIB_2').length
  const cat3    = students.filter(s => s.category === 'MIDIB_3').length
  const totalCourses = courses.length

  // Ethiopian calendar date (e.g. "ግንቦት ፳፭ ፳፻፲፯")
  const ethiopianDateString = new Kenat().format({ lang: 'amharic', showWeekday: true })

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <MobileBreadcrumb />
        <div className="page-topbar">
          <div>
            <h1>ዳሽቦርድ</h1>
            <p>ወደ አቡነ ሰላማ ጉባኤ ቤት እንኳን ደህና መጡ</p>
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(232,184,75,0.7)' }}>
            {ethiopianDateString}
          </div>
        </div>

        <div className="content-body">
          {loading ? (
            <div className="empty-state"><div className="empty-icon"></div>...</div>
          ) : (
            <>
              {/* Stats */}
              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-icon"></div>
                  <div className="stat-label">{categoryNameAge('MIDIB_1')}</div>
                  <div className="stat-value">{cat1}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"></div>
                  <div className="stat-label">{categoryNameAge('MIDIB_2')}</div>
                  <div className="stat-value">{cat2}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"></div>
                  <div className="stat-label">{categoryNameAge('MIDIB_3')}</div>
                  <div className="stat-value">{cat3}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon"></div>
                  <div className="stat-label">ጠቅላላ ትምህርቶች</div>
                  <div className="stat-value">{totalCourses}</div>
                </div>
              </div>

              <div className="eth-divider" />

              {/* Bottom panels */}
              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: isSuperAdmin() ? '1fr 1fr 1fr' : '1fr 1fr', gap: '18px' }}>
                <div className="card">
                  <h3 style={panel.title}> ተማሪዎች በምድብ (Ethiopian Age)</h3>
                  <div className="eth-divider" style={{ margin: '10px 0' }} />
                  <div style={panel.row}>
                    <span>{categoryNameAge('MIDIB_1')}</span>
                    <span className="badge badge-child">{cat1}</span>
                  </div>
                  <div style={panel.row}>
                    <span>{categoryNameAge('MIDIB_2')}</span>
                    <span className="badge badge-teen">{cat2}</span>
                  </div>
                  <div style={panel.row}>
                    <span>{categoryNameAge('MIDIB_3')}</span>
                    <span className="badge badge-adult">{cat3}</span>
                  </div>
                </div>

                <div className="card">
                  <h3 style={panel.title}> ትምህርቶች</h3>
                  <div className="eth-divider" style={{ margin: '10px 0' }} />
                  <div style={panel.row}>
                    <span>ጠቅላላ ትምህርቶች</span>
                    <strong>{totalCourses}</strong>
                  </div>
                  {courses.map(c => (
                    <div key={c.id} style={panel.row}>
                      <span>{c.courseName}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                        {c.duration || '—'}
                      </span>
                    </div>
                  ))}
                </div>

                {isSuperAdmin() && (
                  <div className="card">
                    <h3 style={panel.title}> አድሚኖች</h3>
                    <div className="eth-divider" style={{ margin: '10px 0' }} />
                    <div style={panel.row}>
                      <span>ጠቅላላ አድሚኖች</span>
                      <strong>{adminCount ?? '—'}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent students */}
              {students.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <div className="card">
                    <h3 style={{ ...panel.title, marginBottom: '14px' }}> የቅርብ ጊዜ ተማሪዎች</h3>
                    <div style={{ overflowX: 'auto' }}>
                    <table className="eth-table">
                      <thead>
                        <tr>
                          <th>ስም</th>
                          <th>ስልክ</th>
                          <th>ምድብ</th>
                          <th>የጥምቀት ስም</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.slice(0, 5).map(s => (
                          <tr key={s.id}>
                            <td>{s.firstName} {s.fatherName}</td>
                            <td>{s.mobile || '—'}</td>
                            <td>
                              <span className={`badge badge-${categoryBadge(s.category)}`}>
                                {categoryLabel(s.category)}
                              </span>
                            </td>
                            <td>{s.christianName || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const panel = {
  title: { fontFamily: "'Noto Serif Ethiopic', serif", fontSize: '14px', color: '#3A2210', fontWeight: '700' },
  row:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #F0E3C5', fontSize: '13px' },
}
