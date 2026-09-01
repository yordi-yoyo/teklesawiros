import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileBreadcrumb from '../components/MobileBreadcrumb'
import {
  getStudents,
  markAttendance,
  getAttendanceSummary,
  getStudentAttendance,
} from '../api'
import { categoryLabel } from '../constants/categories'
import { downloadAttendanceReport, downloadAllStudentsReport } from '../utils/attendanceReport'
import { reportDateRange } from '../utils/ethiopianDate'
import { getAttendanceReport } from '../api'

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

const STATUSES = [
  { value: 'PRESENT',    label: '✅ ተገኝቷል/ታለች' },
  { value: 'ABSENT',     label: '❌ አልተገኘም/ችም' },
  { value: 'PERMISSION', label: '📝 ፍቃድ' },
]

export default function Attendance() {
  const [students,      setStudents]      = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const [selStudent,    setSelStudent]    = useState('')
  const [status,        setStatus]        = useState('PRESENT')
  const [summary,       setSummary]       = useState(null)
  const [records,       setRecords]       = useState([])
  const [loading,       setLoading]       = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [message,       setMessage]       = useState(null)
  const [downloading,   setDownloading]   = useState(false)

  // All-students report
  const [reportPeriod,     setReportPeriod]     = useState('daily')
  const [reportDownloading, setReportDownloading] = useState(false)
  const [reportMsg,        setReportMsg]         = useState(null)

  useEffect(() => {
    getStudents()
      .then(r => setStudents(toArray(r.data)))
      .catch(() => {})
  }, [])

  const loadStudentData = async id => {
    if (!id) return
    setLoading(true)
    try {
      const [sumRes, recRes] = await Promise.all([
        getAttendanceSummary(id),
        getStudentAttendance(id),
      ])
      setSummary(sumRes.data)
      setRecords(recRes.data || [])
    } catch {
      setSummary(null)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const selectStudent = (id) => {
    setSelStudent(id)
    setStudentSearch('')
    setShowStudentDropdown(false)
    setSummary(null)
    setRecords([])
    setMessage(null)
    loadStudentData(id)
  }

  const handleMark = async () => {
    if (!selStudent) {
      setMessage({ type: 'error', text: 'ተማሪ ይምረጡ' }); return
    }
    setSaving(true); setMessage(null)
    try {
      await markAttendance(selStudent, status)
      setMessage({ type: 'success', text: `ምርክ ተመዝግቧል — ${STATUSES.find(s => s.value === status)?.label}` })
      loadStudentData(selStudent)
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'ስህተት ተከስቷል' })
    } finally { setSaving(false) }
  }

  const selectedStudent = students.find(s => String(s.id) === String(selStudent))

  const handleDownloadReport = async () => {
    if (!selectedStudent || !summary) return
    setDownloading(true)
    try {
      await downloadAttendanceReport(selectedStudent, summary, records, categoryLabel(selectedStudent.category))
    } catch (e) {
      setMessage({ type: 'error', text: 'ሪፖርት ማውረድ አልተሳካም' })
    } finally { setDownloading(false) }
  }

  const handleDownloadAllStudentsReport = async () => {
    setReportDownloading(true); setReportMsg(null)
    try {
      const { startDate, endDate } = reportDateRange(reportPeriod)
      const res = await getAttendanceReport(startDate, endDate)
      await downloadAllStudentsReport(res.data || [], reportPeriod, startDate, endDate)
    } catch (e) {
      setReportMsg({ type: 'error', text: 'ሪፖርት ማውረድ አልተሳካም' })
    } finally { setReportDownloading(false) }
  }

  const filteredStudents = students.filter(s =>
    `${s.firstName || ''} ${s.fatherName || ''} ${s.grandfatherName || ''} ${s.studentNumber || ''}`
      .toLowerCase().includes(studentSearch.toLowerCase())
  )

  const statusBadge = (s) => {
    const st = s.status || (s.present ? 'PRESENT' : 'ABSENT')
    if (st === 'PRESENT') return { cls: 'active', label: '✅  ተገኝቷል/ታለች' }
    if (st === 'PERMISSION') return { cls: 'teen', label: '📝 ፍቃድ' }
    return { cls: 'inactive', label: '❌ አልተገኘም/ችም' }
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="main-content">
        <MobileBreadcrumb />
        <div className="page-topbar">
          <div>
            <h1>ቁጥጥር</h1>
            <p>ተማሪዎችን ይቆጣጠሩ</p>
          </div>
        </div>

        <div className="content-body">
          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Mark Attendance */}
            <div className="card">
              <h3 style={st.cardTitle}>📋 ቁጥጥር</h3>
              <div className="eth-divider" />

              {message && (
                <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>
                  {message.text}
                </div>
              )}

              <div className="form-group" style={{ marginBottom: '14px', position: 'relative' }}>
                <label className="form-label">ተማሪ ፈልግ (በስም ወይም በቁጥር)</label>
                <input
                  className="form-input"
                  placeholder="🔍 ተማሪ ፈልግ..."
                  value={selectedStudent ? `${selectedStudent.studentNumber ? selectedStudent.studentNumber + ' — ' : ''}${selectedStudent.firstName} ${selectedStudent.fatherName}` : studentSearch}
                  onChange={e => {
                    setStudentSearch(e.target.value)
                    setSelStudent('')
                    setSummary(null)
                    setRecords([])
                    setShowStudentDropdown(true)
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                />
                {showStudentDropdown && studentSearch.trim() && (
                  <div style={{ position: 'absolute', zIndex: 10, top: '100%', left: 0, right: 0, maxHeight: '220px', overflowY: 'auto', background: '#fff', border: '1px solid var(--border-light)', borderRadius: '6px', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {filteredStudents.length === 0 ? (
                      <div style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-light)' }}>ምንም ተማሪ አልተገኘም</div>
                    ) : filteredStudents.slice(0, 10).map(s => (
                      <div
                        key={s.id}
                        onClick={() => selectStudent(s.id)}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}
                      >
                        <strong>{s.firstName} {s.fatherName}</strong>{' '}
                        <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>{s.studentNumber}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">ሁኔታ</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {STATUSES.map(s => (
                    <label key={s.value} style={{ ...st.radioLabel, ...(status === s.value ? st.radioLabelActive : {}) }}>
                      <input
                        type="radio" name="status" value={s.value}
                        checked={status === s.value}
                        onChange={() => setStatus(s.value)}
                        style={{ marginRight: '5px' }}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <button className="btn-primary" onClick={handleMark} disabled={saving} style={{ width: '100%' }}>
                {saving ? 'በመመዝገብ ላይ...' : '📝 መዝግብ'}
              </button>
            </div>

            {/* Attendance Summary */}
            <div className="card">
              <h3 style={st.cardTitle}>📊 ማጠቃለያ</h3>
              <div className="eth-divider" />

              {!selStudent ? (
                <div className="empty-state">
                  <div className="empty-icon"></div>
                  ተማሪ ለማየት ይምረጡ
                </div>
              ) : loading ? (
                <div className="empty-state"><div className="empty-icon"></div>...</div>
              ) : summary ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...st.summaryHeader }}>
                    <span style={st.studentName}>
                      {selectedStudent?.firstName} {selectedStudent?.fatherName}
                    </span>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={handleDownloadReport}
                      disabled={downloading}
                    >
                      {downloading ? '...' : '📄 ሪፖርት አውርድ (Word)'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <div style={st.summaryBox('#d4edda', '#155724')}>
                      <div style={st.sumLabel}>ተገኝቷል</div>
                      <div style={st.sumValue}>{summary.presentSessions ?? 0}</div>
                    </div>
                    <div style={st.summaryBox('#f8d7da', '#721c24')}>
                      <div style={st.sumLabel}>አልተገኘም</div>
                      <div style={st.sumValue}>{summary.absentSessions ?? 0}</div>
                    </div>
                    <div style={st.summaryBox('#fff3cd', '#856404')}>
                      <div style={st.sumLabel}>ፍቃድ</div>
                      <div style={st.sumValue}>{summary.permissionSessions ?? 0}</div>
                    </div>
                    <div style={st.summaryBox('#cce5ff', '#004085')}>
                      <div style={st.sumLabel}>የምርክ %</div>
                      <div style={st.sumValue}>{Math.round(summary.attendancePercentage ?? 0)}%</div>
                    </div>
                  </div>

                  {summary.attendancePercentage !== undefined && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '6px' }}>
                        የምርክ መጠን: {Math.round(summary.attendancePercentage)}%
                      </div>
                      <div style={{ background: 'var(--cream-dark)', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, summary.attendancePercentage)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, var(--green-eth), var(--gold))',
                          borderRadius: '8px',
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  ምርክ ታሪክ አልተገኘም
                </div>
              )}
            </div>
          </div>

          {/* All-Students Report (daily/weekly/monthly) */}
          <div className="card" style={{ marginTop: '20px' }}>
            <h3 style={st.cardTitle}>📄 የሁሉም ተማሪዎች ሪፖርት</h3>
            <div className="eth-divider" />

            {reportMsg && (
              <div className={`alert alert-${reportMsg.type === 'error' ? 'error' : 'success'}`}>
                {reportMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ marginBottom: 0, minWidth: '180px' }}>
                <label className="form-label">የሪፖርት ዓይነት</label>
                <select className="form-input" value={reportPeriod} onChange={e => setReportPeriod(e.target.value)}>
                  <option value="daily">ዕለታዊ (Daily)</option>
                  <option value="weekly">ሳምንታዊ (Weekly)</option>
                  <option value="monthly">ወርሃዊ (Monthly)</option>
                </select>
              </div>
              <button className="btn-primary" onClick={handleDownloadAllStudentsReport} disabled={reportDownloading}>
                {reportDownloading ? 'በማውረድ ላይ...' : '📄 ሁሉንም ተማሪዎች ሪፖርት አውርድ (Word)'}
              </button>
            </div>
          </div>

          {/* Attendance Records Table */}
          {selStudent && records.length > 0 && (
            <div className="card" style={{ marginTop: '20px', padding: 0, overflowX: 'auto' }}>
              <div style={{ padding: '16px 20px 0' }}>
                <h3 style={st.cardTitle}>📋attendance history</h3>
                <div className="eth-divider" style={{ margin: '10px 0' }} />
              </div>
              <table className="eth-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ቀን</th>
                    <th>ሁኔታ</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const b = statusBadge(r)
                    return (
                      <tr key={r.id}>
                        <td style={{ fontSize: '12px', color: 'var(--text-light)' }}>{i + 1}</td>
                        <td>{r.date || '—'}</td>
                        <td><span className={`badge badge-${b.cls}`}>{b.label}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const st = {
  cardTitle: { fontFamily: "'Noto Serif Ethiopic', serif", fontSize: '15px', color: 'var(--brown-dark)', fontWeight: '700', marginBottom: '12px' },
  radioLabel: { display: 'flex', alignItems: 'center', padding: '7px 12px', border: '1px solid var(--border-light)', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', background: '#fff' },
  radioLabelActive: { borderColor: 'var(--gold)', background: '#FDF6E9' },
  summaryHeader: { padding: '10px 0', borderBottom: '1px solid var(--border-light)' },
  studentName: { fontFamily: "'Noto Serif Ethiopic', serif", fontSize: '15px', fontWeight: '700', color: 'var(--brown-dark)' },
  summaryBox: (bg, color) => ({ background: bg, border: `1px solid ${color}22`, borderRadius: '10px', padding: '14px', textAlign: 'center' }),
  sumLabel: { fontSize: '11px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '4px' },
  sumValue: { fontSize: '26px', fontWeight: '700', color: 'var(--brown-dark)', fontFamily: "'Noto Serif Ethiopic', serif" },
}