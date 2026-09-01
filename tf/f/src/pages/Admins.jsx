import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileBreadcrumb from '../components/MobileBreadcrumb'
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, markAdminAttendance, getAdminAttendance, getAdminAttendanceSummary, getCourseCategories } from '../api'
import { isSuperAdmin } from '../utils/currentAdmin'

// This whole page only renders for the superadmin (route + nav are gated),
// so canManage is effectively always true here - kept for clarity/safety.
const EMPTY = {
  fullName: '', username: '', password: '', role: 'ADMIN', newPassword: '',
  phone: '', address: '', christianName: '', religiousEducationLevel: '', qeneSchoolStatus: '',
}

const ATT_STATUSES = [
  { value: 'PRESENT',    label: '✅ ተገኝቷል' },
  { value: 'ABSENT',     label: '❌ አልተገኘም' },
  { value: 'PERMISSION', label: '📝 ፍቃድ' },
]

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

export default function Admins() {
  const canManage = isSuperAdmin()

  const [admins,  setAdmins]  = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState(EMPTY)
  const [error,   setError]   = useState('')
  const [saving,  setSaving]  = useState(false)

  // Attendance modal (superadmin sets it for a specific admin)
  const [attAdmin,   setAttAdmin]   = useState(null)
  const [attStatus,  setAttStatus]  = useState('PRESENT')
  const [attSummary, setAttSummary] = useState(null)
  const [attRecords, setAttRecords] = useState([])
  const [attLoading, setAttLoading] = useState(false)
  const [attSaving,  setAttSaving]  = useState(false)
  const [attMsg,     setAttMsg]     = useState(null)

  const load = () => {
    setLoading(true)
    getAdmins()
      .then(r => setAdmins(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAdmins([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getCourseCategories().then(r => setCategories(toArray(r.data))).catch(() => setCategories([]))
  }, [])

  const topLevelCategories = categories.filter(c => !c.parentId)
  const subcategoriesOf = (parentId) => categories.filter(c => c.parentId === parentId)

  const openNew  = () => { setForm(EMPTY); setEditing(null); setError(''); setModal(true) }
  const openEdit = a  => { setForm({ ...EMPTY, ...a, password: '' }); setEditing(a.id); setError(''); setModal(true) }
  const closeModal = () => { setModal(false); setError('') }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!editing && (!form.fullName || !form.username || !form.password)) {
      setError('ሙሉ ስም፣ የተጠቃሚ ስም እና የምስጢር ቃል ያስፈልጋል')
      return
    }
    setSaving(true); setError('')
    try {
      if (editing) {
        const payload = {
          fullName: form.fullName, username: form.username,
          phone: form.phone, address: form.address,
          christianName: form.christianName,
          religiousEducationLevel: form.religiousEducationLevel,
          qeneSchoolStatus: form.qeneSchoolStatus,
        }
        if (form.newPassword) payload.newPassword = form.newPassword
        await updateAdmin(editing, payload)
      } else {
        await createAdmin(form)
      }
      closeModal(); load()
    } catch (e) {
      setError(e.response?.data?.message || 'ስህተት ተከስቷል')
    } finally { setSaving(false) }
  }

  const handleDelete = async (a) => {
    if (a.role === 'SUPERADMIN') { alert('ዋና አድሚን መሰረዝ አይቻልም'); return }
    if (!window.confirm(`እርግጠኛ ነዎት ${a.fullName} ን መሰረዝ ይፈልጋሉ?`)) return
    try {
      await deleteAdmin(a.id)
      load()
    } catch (e) {
      alert(e.response?.data?.message || 'መሰረዝ አልተሳካም')
    }
  }

  const roleLabel = r => r === 'SUPERADMIN' ? 'ዋና አድሚን (Superadmin)' : 'አድሚን'
  const roleBadge = r => r === 'SUPERADMIN' ? 'active' : 'child'

  const openAttendance = (a) => {
    setAttAdmin(a); setAttMsg(null); setAttLoading(true)
    Promise.all([getAdminAttendanceSummary(a.id), getAdminAttendance(a.id)])
      .then(([sumRes, recRes]) => {
        setAttSummary(sumRes.data)
        setAttRecords(recRes.data || [])
      })
      .catch(() => { setAttSummary(null); setAttRecords([]) })
      .finally(() => setAttLoading(false))
  }
  const closeAttendance = () => { setAttAdmin(null); setAttSummary(null); setAttRecords([]) }

  const handleMarkAdminAttendance = async () => {
    setAttSaving(true); setAttMsg(null)
    try {
      await markAdminAttendance(attAdmin.id, attStatus)
      setAttMsg({ type: 'success', text: 'ምርክ ተመዝግቧል' })
      openAttendance(attAdmin) // refresh
    } catch (e) {
      setAttMsg({ type: 'error', text: e.response?.data?.message || 'ስህተት ተከስቷል' })
    } finally { setAttSaving(false) }
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <MobileBreadcrumb />
        <div className="page-topbar">
          <div>
            <h1>አድሚኖች</h1>
            <p>የአድሚን አካውንቶችን ያስተዳድሩ</p>
          </div>
          <button className="btn-primary" onClick={openNew}>+ አድሚን ጨምር</button>
        </div>

        <div className="content-body">
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            {loading ? (
              <div className="empty-state"><div className="empty-icon"></div>...</div>
            ) : admins.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"></div>ምንም አድሚን አልተገኘም</div>
            ) : (
              <table className="eth-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>የአድሚን ቁጥር</th>
                    <th>ሙሉ ስም</th>
                    <th>የተጠቃሚ ስም</th>
                    <th>ስልክ ቁጥር</th>
                    <th>የአብነት ት/ት ደረጃ</th>
                    <th>ሚና</th>
                    <th>actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a, i) => (
                    <tr key={a.id}>
                      <td style={{ color: 'var(--text-light)', fontSize: '12px' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{a.adminNumber}</td>
                      <td>{a.fullName}</td>
                      <td>{a.username}</td>
                      <td>{a.phone || '—'}</td>
                      <td>{a.qeneSchoolStatus || '—'}</td>
                      <td><span className={`badge badge-${roleBadge(a.role)}`}>{roleLabel(a.role)}</span></td>
                      <td style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => openEdit(a)}>edit</button>
                        <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => openAttendance(a)}>📋 attendance</button>
                        {a.role !== 'SUPERADMIN' && (
                          <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px', color: '#c0392b' }} onClick={() => handleDelete(a)}>delete</button>
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

      {attAdmin && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeAttendance()}>
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-title">📋 Attendance{attAdmin.fullName} ({attAdmin.adminNumber})</div>
            <div className="eth-divider" style={{ margin: '10px 0 16px' }} />

            {attMsg && (
              <div className={`alert alert-${attMsg.type === 'error' ? 'error' : 'success'}`}>
                {attMsg.text}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">ሁኔታ</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ATT_STATUSES.map(s => (
                  <label
                    key={s.value}
                    style={{
                      display: 'flex', alignItems: 'center', padding: '7px 12px',
                      border: `1px solid ${attStatus === s.value ? 'var(--gold)' : 'var(--border-light)'}`,
                      borderRadius: '7px', cursor: 'pointer', fontSize: '13px',
                      background: attStatus === s.value ? '#FDF6E9' : '#fff',
                    }}
                  >
                    <input type="radio" name="attStatus" checked={attStatus === s.value} onChange={() => setAttStatus(s.value)} style={{ marginRight: '5px' }} />
                    {s.label}
                  </label>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={handleMarkAdminAttendance} disabled={attSaving} style={{ width: '100%', marginBottom: '18px' }}>
              {attSaving ? 'በመመዝገብ ላይ...' : '📝 መዝግብ'}
            </button>

            {attLoading ? (
              <div className="empty-state"><div className="empty-icon"></div>...</div>
            ) : attSummary && (
              <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', fontSize: '12px' }}><div style={{ fontWeight: 700, fontSize: '18px' }}>{attSummary.totalSessions ?? 0}</div>ጠቅላላ</div>
                <div style={{ textAlign: 'center', fontSize: '12px' }}><div style={{ fontWeight: 700, fontSize: '18px', color: '#155724' }}>{attSummary.presentSessions ?? 0}</div>ተገኝቷል</div>
                <div style={{ textAlign: 'center', fontSize: '12px' }}><div style={{ fontWeight: 700, fontSize: '18px', color: '#721c24' }}>{attSummary.absentSessions ?? 0}</div>አልተገኘም</div>
                <div style={{ textAlign: 'center', fontSize: '12px' }}><div style={{ fontWeight: 700, fontSize: '18px', color: '#856404' }}>{attSummary.permissionSessions ?? 0}</div>ፍቃድ</div>
              </div>
            )}

            {attRecords.length > 0 && (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {attRecords.map(r => {
                  const s = r.status || (r.present ? 'PRESENT' : 'ABSENT')
                  const lbl = s === 'PRESENT' ? '✅ ተገኝቷል' : s === 'PERMISSION' ? '📝 ፍቃድ' : '❌ አልተገኘም'
                  return (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: '13px' }}>
                      <span>{r.date}</span><span>{lbl}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn-secondary" onClick={closeAttendance}>ዝጋ</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box">
            <div className="modal-title">{editing ? 'edit' : '➕ አዲስ አድሚን ጨምር'}</div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-grid">
              <div className="form-group"><label className="form-label">ሙሉ ስም *</label><input className="form-input" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="ሙሉ ስም" /></div>
              <div className="form-group"><label className="form-label">የተጠቃሚ ስም *</label><input className="form-input" value={form.username} onChange={e => set('username', e.target.value)} placeholder="username" /></div>
              {!editing && (
                <div className="form-group"><label className="form-label">password *</label><input className="form-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••" /></div>
              )}
              {editing && (
                <div className="form-group"><label className="form-label">new password (ካልቀየሩ ባዶ ይተዉ)</label><input className="form-input" type="password" value={form.newPassword} onChange={e => set('newPassword', e.target.value)} placeholder="••••••" /></div>
              )}

              <div className="form-group"><label className="form-label">ስልክ ቁጥር</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="09xxxxxxxx" /></div>
              <div className="form-group"><label className="form-label">ሙሉ አድራሻ</label><input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="አድራሻ" /></div>
              <div className="form-group"><label className="form-label">የክርስትና ስም</label><input className="form-input" value={form.christianName} onChange={e => set('christianName', e.target.value)} placeholder="የክርስትና ስም" /></div>
              <div className="form-group"><label className="form-label">ሃይማኖታዊ የት/ት ደረጃ</label><input className="form-input" value={form.religiousEducationLevel} onChange={e => set('religiousEducationLevel', e.target.value)} placeholder="ደረጃ" /></div>
                           <div className="form-group">
                <label className="form-label">የአብነት ትምህርት ሁኔታ</label>
                <input className="form-input" value={form.qeneSchoolStatus} onChange={e => set('qeneSchoolStatus', e.target.value)} placeholder="ቅኔ ቤት ትምህርት ሁኔታ" />
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
