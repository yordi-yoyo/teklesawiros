import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel } from 'docx'

// 'Nyala' is the Ethiopic-script font bundled with Windows since Vista - the
// safest choice for readers opening this .docx on a normal Windows PC.
// Without an explicit font, Word falls back to a font with no Ge'ez glyphs
// and the Amharic text renders as empty boxes.
const AMHARIC_FONT = 'Nyala'

const statusLabel = (s) => s === 'PRESENT' ? 'ተገኝቷል' : s === 'PERMISSION' ? 'ፍቃድ' : 'አልተገኘም'

function run(text, opts = {}) {
  return new TextRun({ text: String(text ?? '—'), font: AMHARIC_FONT, ...opts })
}

function para(text, opts = {}) {
  return new Paragraph({ children: [run(text, opts)], ...(opts.spacing ? { spacing: opts.spacing } : {}) })
}

function heading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [run(text, { bold: true, size: 26 })],
    spacing: { before: 200, after: 100 },
  })
}

function cell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({ children: [run(text, { bold: !!opts.bold })] })],
    width: { size: opts.width || 33, type: WidthType.PERCENTAGE },
  })
}

const docDefaults = {
  styles: {
    default: {
      document: { run: { font: AMHARIC_FONT, size: 22 } },
    },
  },
}

// ── Single-student report ──────────────────────────────
// student: { firstName, fatherName, studentNumber }
// summary: { totalSessions, presentSessions, absentSessions, permissionSessions, attendancePercentage }
// records: [{ date, status }]
export async function downloadAttendanceReport(student, summary, records, categoryLabelText) {
  const rows = [
    new TableRow({ children: [cell('ቀን', { bold: true }), cell('ሁኔታ', { bold: true })] }),
    ...records.map(r => new TableRow({
      children: [cell(r.date), cell(statusLabel(r.status || (r.present ? 'PRESENT' : 'ABSENT')))],
    })),
  ]

  const doc = new Document({
    ...docDefaults,
    sections: [{
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [run('ተክለ ሳዊሮስ ሰንበት ት/ቤት', { bold: true, size: 32 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [run('የምርክ ሪፖርት (Attendance Report)', { bold: true, size: 24 })], spacing: { after: 300 } }),
        para(`ስም: ${student.firstName} ${student.fatherName}`, { bold: true }),
        para(`የተማሪ ቁጥር: ${student.studentNumber || '—'}`),
        para(`ምድብ: ${categoryLabelText || '—'}`, { spacing: { after: 300 } }),

        heading('ማጠቃለያ (Summary)'),
        para(`ጠቅላላ: ${summary.totalSessions ?? 0}`),
        para(`ተገኝቷል: ${summary.presentSessions ?? 0}`),
        para(`አልተገኘም: ${summary.absentSessions ?? 0}`),
        para(`ፍቃድ: ${summary.permissionSessions ?? 0}`),
        para(`የምርክ መጠን: ${Math.round(summary.attendancePercentage ?? 0)}%`, { spacing: { after: 300 } }),

        heading('ዝርዝር (Details)'),
        new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }),
      ],
    }],
  })

  await triggerDownload(doc, `attendance-${student.studentNumber || student.firstName}.docx`)
}

// ── All-students report (daily/weekly/monthly) ─────────
// records: [{ date, status, student: { firstName, fatherName, studentNumber, category } }]
const PERIOD_LABEL = { daily: 'ዕለታዊ (Daily)', weekly: 'ሳምንታዊ (Weekly)', monthly: 'ወርሃዊ (Monthly)' }

export async function downloadAllStudentsReport(records, period, startDate, endDate) {
  const presentCount    = records.filter(r => (r.status || (r.present ? 'PRESENT' : 'ABSENT')) === 'PRESENT').length
  const permissionCount = records.filter(r => r.status === 'PERMISSION').length
  const absentCount     = records.length - presentCount - permissionCount

  const rows = [
    new TableRow({
      children: [
        cell('ቀን', { bold: true, width: 15 }),
        cell('ስም', { bold: true, width: 35 }),
        cell('የተማሪ ቁጥር', { bold: true, width: 20 }),
        cell('ሁኔታ', { bold: true, width: 30 }),
      ],
    }),
    ...records.map(r => new TableRow({
      children: [
        cell(r.date, { width: 15 }),
        cell(`${r.student?.firstName || ''} ${r.student?.fatherName || ''}`, { width: 35 }),
        cell(r.student?.studentNumber, { width: 20 }),
        cell(statusLabel(r.status || (r.present ? 'PRESENT' : 'ABSENT')), { width: 30 }),
      ],
    })),
  ]

  const doc = new Document({
    ...docDefaults,
    sections: [{
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [run('ተክለ ሳዊሮስ ሰንበት ት/ቤት', { bold: true, size: 32 })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [run('አቡነ ሰላማ ከሣቴ ብርሃን ጉባኤ ቤት  ', { bold: true, size: 32 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [run('የሁሉም ተማሪዎች attendance ሪፖርት', { bold: true, size: 24 })], spacing: { after: 200 } }),
        para(`የሪፖርት ዓይነት: ${PERIOD_LABEL[period] || period}`, { bold: true }),
        para(`ከ: ${startDate}  እስከ: ${endDate}`, { spacing: { after: 300 } }),

        heading('ማጠቃለያ (Summary)'),
        para(`ጠቅላላ ምዝገባዎች: ${records.length}`),
        para(`ተገኝቷል: ${presentCount}`),
        para(`አልተገኘም: ${absentCount}`),
        para(`ፍቃድ: ${permissionCount}`, { spacing: { after: 300 } }),

        heading('ዝርዝር (Details)'),
        records.length > 0
          ? new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })
          : para(' ምንም attendance አልተመዘገበም'),
      ],
    }],
  })

  await triggerDownload(doc, `attendance-report-${period}-${startDate}_to_${endDate}.docx`)
}

async function triggerDownload(doc, filename) {
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
