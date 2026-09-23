import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileBreadcrumb from '../components/MobileBreadcrumb'
import { getStudents, createStudent, updateStudent, deleteStudent } from '../api'
import { categoryLabel, categoryBadge, categoryForBirthYear } from '../constants/categories'
import { isSuperAdmin } from '../utils/currentAdmin'
import EtCalendar from 'et-calendar-react'
import { toEC, toGC } from 'kenat'

const PHONE_RE = /^\d{10}$/

const EMPTY = {
  firstName: '', fatherName: '', grandfatherName: '', christianName: '',
  birthDay: '', birthMonth: '', birthYear: '',
  confessionFatherName: '', churchName: '', religiousRank: '',
  address: '', subcity: '', woreda: '', houseNumber: '',
  homePhone: '', mobile: '', studentOrWorker: '',
  educationLevel: '', schoolName: '', isSundaySchoolStudent: '',
}

export default function Students() {
  const [students, setStudents] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [error,    setError]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [search,   setSearch]   = useState('')
  const [viewing,  setViewing]  = useState(null)
  const canManage = isSuperAdmin()
  const formCategory = categoryForBirthYear(form.birthYear)
  const isAdult = formCategory === 'MIDIB_3' 

  const load = () => {
    setLoading(true)
    getStudents()
      .then(r => {
        let data = r.data
        if (typeof data === 'string') {
          try { data = JSON.parse(data) } catch (e) { data = [] }
        }
        if (Array.isArray(data)) setStudents(data)
        else if (data && Array.isArray(data.content)) setStudents(data.content)
        else setStudents([])
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew  = () => { setForm(EMPTY); setEditing(null); setError(''); setModal(true) }
  const openEdit = s  => { setForm({ ...EMPTY, ...s }); setEditing(s.id); setError(''); setModal(true) }
  const closeModal = () => { setModal(false); setError('') }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.firstName || !form.fatherName) { setError('ስም ያስፈልጋል (firstName እና fatherName)'); return }
    if (!form.grandfatherName) { setError('የአያት ስም ያስፈልጋል'); return }
    if (!form.address) { setError('አድራሻ ያስፈልጋል'); return }
    if (!form.mobile) { setError('ስልክ ቁጥር ያስፈልጋል'); return }
    if (!PHONE_RE.test(form.mobile)) { setError('ስልክ ቁጥር በትክክል 10 አሃዝ መሆን አለበት (ለምሳሌ 0912345678)'); return }
    if (form.homePhone && !PHONE_RE.test(form.homePhone)) { setError('ተጨማሪ ስልክ 10 አሃዝ መሆን አለበት'); return }
    if (!form.birthYear) { setError('የልደት ዓ.ም ያስፈልጋል (Ethiopian year)'); return }
    setSaving(true); setError('')
    try {
      if (editing) {
        await updateStudent(editing, {
          firstName: form.firstName,
          fatherName: form.fatherName,
          grandfatherName: form.grandfatherName,
          christianName: form.christianName,
          mobile: form.mobile,
          homePhone: form.homePhone,
          studentOrWorker: form.studentOrWorker,
          address: form.address,
          subcity: form.subcity,
          woreda: form.woreda,
          houseNumber: form.houseNumber,
          churchName: form.churchName,
          religiousRank: form.religiousRank,
          confessionFatherName: form.confessionFatherName,
          educationLevel: form.educationLevel,
          schoolName: form.schoolName,
          isSundaySchoolStudent: form.isSundaySchoolStudent,
        })
      } else {
        await createStudent(form)
      }
      closeModal(); load()
    } catch (e) {
      setError(e.response?.data?.message || 'ስህተት ተከስቷል')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('እርግጠኛ ነዎት ይህን ተማሪ መሰረዝ ይፈልጋሉ?')) return
    try {
      await deleteStudent(id)
      load()
    } catch (e) {
      alert('መሰረዝ አልተሳካም')
    }
  }

  const filtered = students.filter(s =>
    `${s.firstName || ''} ${s.fatherName || ''} ${s.grandfatherName || ''} ${s.christianName || ''} ${s.mobile || ''} ${s.studentNumber || ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  // For displaying the mobile/homePhone labels correctly in the view modal too
  const labelFor = (student, key) => {
    const cat = student.category
    if (key === 'mobile') return cat === 'MIDIB_3' ? 'ሞባይል' : 'የወላጅ ሞባይል'
    if (key === 'homePhone') return 'ተጨማሪ ስልክ'
    return ''
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <MobileBreadcrumb />
        <div className="page-topbar">
          <div>
            <h1>ተማሪዎች</h1>
            <p>ሁሉንም ተማሪዎች ያስተዳድሩ</p>
          </div>
          <button className="btn-primary" onClick={openNew}>+ ተማሪ ጨምር</button>
        </div>

        <div className="content-body">
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="form-input"
              style={{ maxWidth: '300px' }}
              placeholder=" ተማሪ ፈልግ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
              ጠቅላላ: {filtered.length} ተማሪዎች
            </span>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            {loading ? (
              <div className="empty-state"><div className="empty-icon"></div>...</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"></div>
                ምንም ተማሪ አልተገኘም
              </div>
            ) : (
              <table className="eth-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>የተማሪ ቁጥር</th>
                    <th>ሙሉ ስም</th>
                    <th>የክርስትና ስም</th>
                    <th>ስልክ</th>
                    <th>ምድብ</th>
                    <th>ቤ/ክርስቲያን</th>
                    <th>actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} onClick={() => setViewing(s)} style={{ cursor: 'pointer' }}>
                      <td style={{ color: 'var(--text-light)', fontSize: '12px' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{s.studentNumber || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{s.firstName} {s.fatherName} {s.grandfatherName}</td>
                      <td>{s.christianName || '—'}</td>
                      <td>{s.mobile || s.homePhone || '—'}</td>
                      <td><span className={`badge badge-${categoryBadge(s.category)}`}>{categoryLabel(s.category)}</span></td>
                      <td>{s.churchName || '—'}</td>
                      <td style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        {canManage ? (
                          <>
                            <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => openEdit(s)}>edit</button>
                            <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: '12px', color: '#c0392b' }} onClick={() => handleDelete(s.id)}>delete</button>
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

      {/* View Student Details */}
      {viewing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewing(null)}>
          <div className="modal-box" style={{ maxWidth: '600px' }}>
            <div className="modal-title">👤 {viewing.firstName} {viewing.fatherName} {viewing.grandfatherName}</div>
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '13px' }}>
              <ViewRow label="የተማሪ ቁጥር" value={viewing.studentNumber} />
              <ViewRow label="ምድብ" value={categoryLabel(viewing.category)} />
              <ViewRow label="የክርስትና  ስም" value={viewing.christianName} />
              <ViewRow label="ልደት" value={[viewing.birthDay, viewing.birthMonth, viewing.birthYear].filter(Boolean).join('/')} />
              <ViewRow label={labelFor(viewing, 'mobile')} value={viewing.mobile} />
              <ViewRow label={labelFor(viewing, 'homePhone')} value={viewing.homePhone} />
              {viewing.studentOrWorker && <ViewRow label="ተማሪ/ሰራተኛ" value={viewing.studentOrWorker} />}
              <ViewRow label="አድራሻ" value={viewing.address} />
              <ViewRow label="ደብር/ቤ/ክርስቲያን ስም" value={viewing.churchName} />
              <ViewRow label="የሃይማኖት ደረጃ" value={viewing.religiousRank} />
              <ViewRow label="የንስሀ አባት ስም" value={viewing.confessionFatherName} />
              <ViewRow label="የትምህርት ደረጃ" value={viewing.educationLevel} />
              {viewing.category !== 'MIDIB_3' && <ViewRow label="የትምህርት ቤት ስም" value={viewing.schoolName} />}
              <ViewRow label="የሰንበት ተማሪ ነው?" value={viewing.isSundaySchoolStudent} />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setViewing(null)}>ዝጋ</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-title">
              👤 ግላዊ መረጃ {editing ? ' edit' : ' አዲስ ተማሪ'}
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-grid">
              <div className="form-group"><label className="form-label">የመጀመሪያ ስም </label><input className="form-input" value={form.firstName} onChange={e => set('firstName', e.target.value)}  /></div>
              <div className="form-group"><label className="form-label">የአባት ስም *</label><input className="form-input" value={form.fatherName} onChange={e => set('fatherName', e.target.value)}  /></div>
              <div className="form-group"><label className="form-label">የአያት ስም *</label><input className="form-input" value={form.grandfatherName} onChange={e => set('grandfatherName', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">የክርስትና  ስም</label><input className="form-input" value={form.christianName} onChange={e => set('christianName', e.target.value)}  /></div>

            
              <div className="form-group">
                <label className="form-label">የልደት ቀን (Ethiopian)</label>
                <EtCalendar
                  calendarType={true}
                  lang="am"
                  fullWidth
                  placeholder="የልደት ቀን ይምረጡ"
                  value={
                    form.birthYear && form.birthMonth && form.birthDay
                      ? (() => {
                          const gc = toGC(Number(form.birthYear), Number(form.birthMonth), Number(form.birthDay))
                          return new Date(gc.year, gc.month - 1, gc.day)
                        })()
                      : null
                  }
                  onChange={(newDate) => {
                    const ec = toEC(newDate.getFullYear(), newDate.getMonth() + 1, newDate.getDate())
                    setForm(f => ({ ...f, birthDay: String(ec.day), birthMonth: String(ec.month), birthYear: String(ec.year) }))
                  }}
                />
                {form.birthYear && (
                  <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
                    {form.birthDay}/{form.birthMonth}/{form.birthYear} ዓ.ም
                  </div>
                )}
              </div>

              {/* Own mobile: adults get a normal ሞባይል field; children/teens get their PARENT's mobile in this same field */}
              <div className="form-group">
                <label className="form-label">{isAdult ? 'ሞባይል *' : 'የወላጅ ሞባይል *'}</label>
                <input
                  className="form-input"
                  value={form.mobile}
                  onChange={e => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="09xxxxxxxx"
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>
              <div className="form-group">
                <label className="form-label">ተጨማሪ ስልክ</label>
                <input
                  className="form-input"
                  value={form.homePhone}
                  onChange={e => set('homePhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="09xxxxxxxx"
                  maxLength={10}
                  inputMode="numeric"
                />
              </div>

              {/* Adults only (ወጣት): student/worker status */}
              {isAdult && (
                <div className="form-group">
                  <label className="form-label">ተማሪ ወይስ ሰራተኛ?</label>
                  <select className="form-input" value={form.studentOrWorker} onChange={e => set('studentOrWorker', e.target.value)}>
                    <option value="">ይምረጡ</option>
                    <option value="ተማሪ">ተማሪ</option>
                    <option value="ሰራተኛ">ሰራተኛ</option>
                  </select>
                </div>
              )}

              <div className="form-group"><label className="form-label">አድራሻ *</label><input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">ክፍለ ከተማ</label><input className="form-input" value={form.subcity} onChange={e => set('subcity', e.target.value)}  /></div>
              <div className="form-group"><label className="form-label">ወረዳ</label><input className="form-input" value={form.woreda} onChange={e => set('woreda', e.target.value)}  /></div>
              <div className="form-group"><label className="form-label">የቤት ቁጥር</label><input className="form-input" value={form.houseNumber} onChange={e => set('houseNumber', e.target.value)} /></div>

              <div className="form-group"><label className="form-label">ደብር/ቤተክርስቲያን ስም</label><input className="form-input" value={form.churchName} onChange={e => set('churchName', e.target.value)}  /></div>
              <div className="form-group"><label className="form-label">የሃይማኖት ደረጃ</label><input className="form-input" value={form.religiousRank} onChange={e => set('religiousRank', e.target.value)} placeholder="ዲያቆን፣ ንፍቅ ዲያቆን..." /></div>
              <div className="form-group"><label className="form-label">የንስሀ አባት ስም</label><input className="form-input" value={form.confessionFatherName} onChange={e => set('confessionFatherName', e.target.value)}  /></div>
              <div className="form-group"><label className="form-label">የዓለማዊ ትምህርት ደረጃ</label><input className="form-input" value={form.educationLevel} onChange={e => set('educationLevel', e.target.value)} /></div>
              {!isAdult && (
                <div className="form-group"><label className="form-label">የትምህርት ቤት ስም</label><input className="form-input" value={form.schoolName} onChange={e => set('schoolName', e.target.value)} placeholder="ት/ቤት" /></div>
              )}
              <div className="form-group">
                <label className="form-label">የሰንበት ተማሪ ነው?</label>
                <select className="form-input" value={form.isSundaySchoolStudent} onChange={e => set('isSundaySchoolStudent', e.target.value)}>
                  <option value="">ይምረጡ</option><option value="አዎ">አዎ</option><option value="አይ">አይ</option>
                </select>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={closeModal}>ይሰርዙ</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? 'በማስቀመጥ ላይ...' : editing ? '✔ ያድሱ' : '✔ ጨምር'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ViewRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 600 }}>{label}</div>
      <div style={{ color: 'var(--text-dark)' }}>{value || '—'}</div>
    </div>
  )
}
