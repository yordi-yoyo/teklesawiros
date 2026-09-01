import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileBreadcrumb from '../components/MobileBreadcrumb'
import {
  getCourses, createCourse, updateCourse, getCourseRoster, approveCourse, deleteCourse,
  getCourseCategories, createCourseCategory, updateCourseCategory, deleteCourseCategory,
  getStudents, enrollStudentInCourse,
} from '../api'
import { isSuperAdmin } from '../utils/currentAdmin'

const EMPTY = { courseName: '', duration: '', courseOrder: '', categoryId: '' }

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

export default function Courses() {
  const [courses,  setCourses]  = useState([])
  const [categories, setCategories] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [error,    setError]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [search,   setSearch]   = useState('')
  const canManage = isSuperAdmin()

  // Roster panel (opened by clicking a course row)
  const [rosterCourse,  setRosterCourse]  = useState(null)
  const [roster,        setRoster]        = useState([])
  const [rosterLoading, setRosterLoading] = useState(false)
  const [approvingId,   setApprovingId]   = useState(null)
  const [allStudents, setAllStudents] = useState([])
  const [addingStudentId, setAddingStudentId] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  // Manage categories panel
  const [catModal, setCatModal] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatParent, setNewCatParent] = useState('')
  const [catSaving, setCatSaving] = useState(false)
  const [catError, setCatError] = useState('')
const [editingCatId, setEditingCatId] = useState(null)
  const load = () => {
    setLoading(true)
    Promise.all([getCourses(), getCourseCategories()])
      .then(([c, cat]) => {
        setCourses(toArray(c.data))
        setCategories(toArray(cat.data))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const topLevelCategories = categories.filter(c => !c.parentId)
  const subcategoriesOf = (parentId) => categories.filter(c => c.parentId === parentId)
  const categoryPath = (id) => {
    const cat = categories.find(c => c.id === id)
    if (!cat) return null
    const parent = categories.find(c => c.id === cat.parentId)
    return parent ? `${parent.name} > ${cat.name}` : cat.name
  }

  const openNew  = () => { setForm(EMPTY); setEditing(null); setError(''); setModal(true) }
  const openEdit = (c, e) => { e.stopPropagation(); setForm({ courseName: c.courseName || '', duration: c.duration || '', courseOrder: c.courseOrder ?? '', categoryId: c.categoryId || '' }); setEditing(c.id); setError(''); setModal(true) }
  const closeModal = () => { setModal(false); setError('') }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.courseName) { setError('የትምህርት ስም ያስፈልጋል'); return }
    if (!form.courseOrder) { setError('ቅደም ተከተል ያስፈልጋል'); return }
    setSaving(true); setError('')
    try {
      const payload = { ...form, courseOrder: parseInt(form.courseOrder), categoryId: form.categoryId || null }
      if (editing) {
        await updateCourse(editing, payload)
      } else {
        await createCourse(payload)
      }
      closeModal(); load()
    } catch (e) {
      setError(e.response?.data?.message || 'ስህተት ተከስቷል')
    } finally { setSaving(false) }
  }

  const handleDeleteCourse = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('እርግጠኛ ነዎት ይህን ትምህርት መሰረዝ ይፈልጋሉ?')) return
    try {
      await deleteCourse(id)
      load()
    } catch (e) {
      alert('መሰረዝ አልተሳካም')
    }
  }

   const openRoster = (course) => {
    setRosterCourse(course)
    setRosterLoading(true)
    setEnrollError('')
    setAddingStudentId('')
    setStudentSearch('')
    Promise.all([getCourseRoster(course.id), getStudents()])
      .then(([r, s]) => {
        setRoster(toArray(r.data))
        setAllStudents(toArray(s.data))
      })
      .catch(() => { setRoster([]); setAllStudents([]) })
      .finally(() => setRosterLoading(false))
  }

    const handleAddStudent = async (studentId) => {
    if (!studentId) return
    setAddingStudentId(studentId)
    setEnrolling(true); setEnrollError('')
    try {
      await enrollStudentInCourse(rosterCourse.id, studentId)
      openRoster(rosterCourse) // refresh roster + student list
      load() // refresh student counts on the course list
    } catch (e) {
      setEnrollError(e.response?.data?.message || 'ስህተት ተከስቷል')
    } finally { setEnrolling(false); setAddingStudentId('') }
  }
  const closeRoster = () => { setRosterCourse(null); setRoster([]) }

  // Marks the student finished on THIS course - backend auto-enrolls them
  // into whatever course comes next (by courseOrder), so this is also how
  // you "add them to the next course."
  const handleFinish = async (studentId) => {
    setApprovingId(studentId)
    try {
      await approveCourse(studentId, rosterCourse.id)
      openRoster(rosterCourse) // refresh roster
      load() // refresh student counts
    } catch (e) {
      alert(e.response?.data?.message || e.response?.data || 'ስህተት ተከስቷል')
    } finally { setApprovingId(null) }
  }

 const handleSaveCategory = async () => {
  if (!newCatName.trim()) { setCatError('ስም ያስፈልጋል'); return }
  setCatSaving(true); setCatError('')
  try {
    if (editingCatId) {
      await updateCourseCategory(editingCatId, { name: newCatName, parentId: newCatParent || null })
    } else {
      await createCourseCategory({ name: newCatName, parentId: newCatParent || null })
    }
    setNewCatName(''); setNewCatParent(''); setEditingCatId(null)
    load()
  } catch (e) {
    setCatError(e.response?.data?.message || 'ስህተት ተከስቷል')
  } finally { setCatSaving(false) }
}

const openEditCategory = (cat) => {
  setEditingCatId(cat.id); setNewCatName(cat.name); setNewCatParent(cat.parentId || '')
}

  const handleDeleteCategory = async (id) => {
    if (!canManage) return
    if (!window.confirm('እርግጠኛ ነዎት ይህን ምድብ መሰረዝ ይፈልጋሉ?')) return
    try {
      await deleteCourseCategory(id)
      load()
    } catch (e) {
      alert('መሰረዝ አልተሳካም')
    }
  }

  const filteredCourses = courses.filter(c =>
    `${c.courseName || ''} ${c.duration || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const matchingStudents = allStudents
    .filter(s => !roster.some(r => r.student?.id === s.id))
    .filter(s => {
      const q = studentSearch.trim().toLowerCase()
      if (!q) return false
      const name = `${s.firstName || ''} ${s.fatherName || ''} ${s.grandfatherName || ''}`.toLowerCase()
      const num = (s.studentNumber || '').toLowerCase()
      return name.includes(q) || num.includes(q)
    })
    .slice(0, 10)

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <MobileBreadcrumb />
        <div className="page-topbar">
          <div>
            <h1>ትምህርቶች</h1>
            <p>ትምህርት ይምረጡ የተማሪዎችን ዝርዝር ለማየት እና ለማጽደቅ</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={() => setCatModal(true)}>ምድብ</button>
            <button className="btn-primary" onClick={openNew}>+ ትምህርት ጨምር</button>
          </div>
        </div>

        <div className="content-body">
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="form-input"
              style={{ maxWidth: '300px' }}
              placeholder="🔍 ትምህርት ፈልግ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
              ጠቅላላ: {filteredCourses.length} ትምህርቶች
            </span>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            {loading ? (
              <div className="empty-state"><div className="empty-icon"></div>...</div>
            ) : filteredCourses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"></div>
                ምንም ትምህርት አልተገኘም። ትምህርት ይጨምሩ።
              </div>
            ) : (
              <table className="eth-table">
                <thead>
                  <tr>
                    <th>ቅደም ተከተል</th>
                    <th>የትምህርት ስም</th>
                    <th>ምድብ</th>
                    <th>ጊዜ (Duration)</th>
                    <th>ተማሪዎች</th>
                    <th>edit/delete</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map(c => (
                    <tr key={c.id} onClick={() => openRoster(c)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: 'var(--text-light)', fontSize: '12px' }}>{c.courseOrder}</td>
                      <td style={{ fontWeight: 600 }}>{c.courseName}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-light)' }}>{categoryPath(c.categoryId) || '—'}</td>
                      <td>{c.duration || '—'}</td>
                      <td><span className="badge badge-active">👥 {c.studentCount ?? 0}</span></td>
                      <td style={{ display: 'flex', gap: '6px' }}>
                        {canManage ? (
                          <>
                            <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={e => openEdit(c, e)}>edit</button>
                            <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px', color: '#c0392b' }} onClick={e => handleDeleteCourse(c.id, e)}>delete</button>
                          </>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Manage Categories/Subcategories - any admin can add, only superadmin can delete */}
      {catModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setCatModal(false)}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-title"> የትምህርት ምድቦች</div>
            <div className="eth-divider" style={{ margin: '10px 0 16px' }} />

            {catError && <div className="alert alert-error">{catError}</div>}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">የምድብ ስም</label>
                <input className="form-input" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="ለምሳሌ..ውዳሴ ማርያም" />
              </div>
           
            </div>
<button className="btn-primary" onClick={handleSaveCategory} disabled={catSaving} style={{ marginBottom: '18px' }}>
  {catSaving ? 'በማስቀመጥ ላይ...' : editingCatId ? '✔ update' : '+ ጨምር'}
</button>
            

            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {topLevelCategories.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"></div>ምንም ምድብ የለም</div>
              ) : topLevelCategories.map(cat => (
                <div key={cat.id} style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '13px' }}>
                    {cat.name}
                    {canManage && <button className="btn-secondary" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => openEditCategory(cat)}>edit</button>}
{canManage && <button className="btn-secondary" style={{ padding: '3px 8px', fontSize: '11px', color: '#c0392b' }} onClick={() => handleDeleteCategory(cat.id)}>delete</button>}
                  </div>
                  {subcategoriesOf(cat.id).map(sub => (
                    <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '16px', fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                      ↳ {sub.name}
            {canManage && <button className="btn-secondary" style={{ padding: '3px 8px', fontSize: '11px' }} onClick={() => openEditCategory(sub)}>edit</button>}
{canManage && <button className="btn-secondary" style={{ padding: '3px 8px', fontSize: '11px', color: '#c0392b' }} onClick={() => handleDeleteCategory(sub.id)}>delete</button>}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setCatModal(false)}>ዝጋ</button>
            </div>
          </div>
        </div>
      )}

      {/* Course Roster Modal - click a course row to open */}
      {rosterCourse && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeRoster()}>
          <div className="modal-box" style={{ maxWidth: '560px' }}>
            <div className="modal-title">👥 {rosterCourse.courseName} —ተማሪዎች ({roster.length})</div>
            <div className="eth-divider" style={{ margin: '10px 0 16px' }} />

            <div style={{ marginBottom: '16px' }}>
              <input
                className="form-input"
                placeholder="🔍 ተማሪ በስም ወይም በቁጥር ፈልግ..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
              />
              {studentSearch.trim() && (
                <div style={{ maxHeight: '180px', overflowY: 'auto', marginTop: '6px', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                  {matchingStudents.length === 0 ? (
                    <div style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-light)' }}>ምንም ተማሪ አልተገኘም</div>
                  ) : matchingStudents.map(s => (
                    <div
                      key={s.id}
                      onClick={() => !enrolling && handleAddStudent(s.id)}
                      style={{
                        padding: '8px 12px', cursor: enrolling ? 'default' : 'pointer',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        borderBottom: '1px solid var(--border-light)',
                        opacity: enrolling && addingStudentId === s.id ? 0.5 : 1,
                      }}
                    >
                      <span>
                        <strong>{s.firstName} {s.fatherName}</strong>{' '}
                        <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>{s.studentNumber}</span>
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--accent)' }}>
                        {enrolling && addingStudentId === s.id ? '...' : '+ ጨምር'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {enrollError && <div className="alert alert-error">{enrollError}</div>}

            {rosterLoading ? (
              <div className="empty-state"><div className="empty-icon"></div>...</div>
            ) : roster.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"></div>
                በዚህ ትምህርት ውስጥ ምንም ተማሪ የለም
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {roster.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>
                        {r.student?.firstName} {r.student?.fatherName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                        {r.student?.studentNumber || '—'}
                      </div>
                    </div>
                    {r.completed ? (
                      <span className="badge badge-active">አጠናቅቋል/ቃለች</span>
                    ) : (
                      <button
                        className="btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                        disabled={approvingId === r.student?.id}
                        onClick={() => handleFinish(r.student?.id)}
                        title="ይህ ተማሪ ይህን ትምህርት ካጠናቀቀ በኋላ ወደ ቀጣዩ ትምህርት በራስ-ሰር ይመዘገባል"
                      >
                        {approvingId === r.student?.id ? '...' : '✔ አጠናቀቀ/ች → ቀጣይ ትምህርት'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button className="btn-secondary" onClick={closeRoster}>ዝጋ</button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Course Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box">
            <div className="modal-title">{editing ? 'edit course' : '➕ አዲስ ትምህርት ጨምር'}</div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">የትምህርት ስም *</label>
                <input className="form-input" value={form.courseName} onChange={e => set('courseName', e.target.value)} placeholder="የትምህርት ስም" />
              </div>
              <div className="form-group">
                <label className="form-label">ጊዜ (Duration)</label>
                <input className="form-input" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="ለምሳሌ: 3 ወር" />
              </div>
              <div className="form-group">
                <label className="form-label">ቅደም ተከተል (courseOrder) *</label>
                <input className="form-input" type="number" value={form.courseOrder} onChange={e => set('courseOrder', e.target.value)} placeholder="1, 2, 3..." />
              </div>
              <div className="form-group full">
                <label className="form-label">ምድብ</label>
                <select className="form-input" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                  <option value="">ምድብ የሌለው</option>
                  {topLevelCategories.map(cat => (
                    <React.Fragment key={cat.id}>
                      <option value={cat.id}>{cat.name}</option>
                      {subcategoriesOf(cat.id).map(sub => (
                        <option key={sub.id} value={sub.id}>&nbsp;&nbsp;↳ {sub.name}</option>
                      ))}
                    </React.Fragment>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={closeModal}>ይሰርዙ</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? 'በማስቀመጥ ላይ...' : editing ? '✔ update' : '✔ ጨምር'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}