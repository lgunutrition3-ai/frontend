import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { getWeightForAgeZScore } from './whoWeightForAge'
import { getLengthForAgeZScore } from './whoHeightForAge'
import { getWeightForLengthHeightZScore } from './whoWeightForLengthHeight'
import nutritionLogo from '../assets/nutritionlogo.jpg'

// OPT Plus status codes (per DOH OPT Plus workbook conventions):
//   WFA: N (normal), UW (< -2 SD), SUW (< -3 SD), OW (> +2 SD)
//   HFA: N (normal), St (< -2 SD), SSt (< -3 SD), T (> +2 SD)
//   WFH: N (-2..+2 SD), MW (< -2 SD), SW (< -3 SD), OW (+2..+3 SD), Ob (> +3 SD)
export function getWfaStatusCode(record) {
  const z = getWeightForAgeZScore(record.weight, record.ageMonths, record.sex)
  if (z === null) return ''
  if (z < -3) return 'SUW'
  if (z < -2) return 'UW'
  if (z > 2) return 'OW'
  return 'N'
}

export function getHfaStatusCode(record) {
  const z = getLengthForAgeZScore(record.height, record.ageMonths, record.sex)
  if (z === null) return ''
  if (z < -3) return 'SSt'
  if (z < -2) return 'St'
  if (z > 2) return 'T'
  return 'N'
}

export function getWfhStatusCode(record) {
  const z = getWeightForLengthHeightZScore(record.weight, record.height, record.ageMonths, record.sex)
  if (z === null) return ''
  if (z < -3) return 'SW'
  if (z < -2) return 'MW'
  if (z <= 2) return 'N'
  if (z <= 3) return 'OW'
  return 'Ob'
}

const sexCode = (sex) => (sex === 'Male' ? 'M' : sex === 'Female' ? 'F' : '')
const purokLabel = (purok) => (purok != null && purok !== '' ? `PUROK ${purok}` : '')
const fmtDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d) ? '' : d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Theme — matches the green (#198754) used throughout the app's docx reports
// ---------------------------------------------------------------------------
const THEME = {
  headerFill: '198754',      // dark green banner
  headerText: 'FFFFFF',
  subFill: 'D1F2E0',         // light green info band
  tableHeaderFill: '198754',
  tableHeaderText: 'FFFFFF',
  border: 'B7B7B7',
  statusColors: {
    N: { fill: '198754', text: 'FFFFFF' },   // Normal — green
    UW: { fill: 'FFC107', text: '000000' },  // moderate — yellow
    St: { fill: 'FFC107', text: '000000' },
    MW: { fill: 'FFC107', text: '000000' },
    SUW: { fill: 'DC3545', text: 'FFFFFF' }, // severe — red
    SSt: { fill: 'DC3545', text: 'FFFFFF' },
    SW: { fill: 'DC3545', text: 'FFFFFF' },
    OW: { fill: '0DCAF0', text: '000000' },  // above normal — blue
    T: { fill: '0DCAF0', text: '000000' },
    Ob: { fill: '0DCAF0', text: '000000' },
  },
}

const thinBorder = {
  top: { style: 'thin', color: { argb: THEME.border } },
  bottom: { style: 'thin', color: { argb: THEME.border } },
  left: { style: 'thin', color: { argb: THEME.border } },
  right: { style: 'thin', color: { argb: THEME.border } },
}

async function loadLogoBuffer() {
  try {
    const res = await fetch(nutritionLogo)
    if (!res.ok) throw new Error(`Logo fetch failed: ${res.status}`)
    return await res.arrayBuffer()
  } catch (err) {
    console.warn('Nutrition logo could not be loaded for the Excel export:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Build the styled "Nut_StatusTool" sheet
// ---------------------------------------------------------------------------
async function buildNutStatusToolSheet(workbook, barangay, records, year) {
  const sheet = workbook.addWorksheet('Nut_StatusTool', {
    views: [{ state: 'frozen', ySplit: 9 }],
  })

  const HEADERS = [
    'Child Seq.',
    'Address or Location',
    'Name of Mother or Caregiver',
    "Full Name of Child",
    'Belongs to IP Group?',
    'Sex',
    'Date of Birth',
    'Date Measured',
    'Weight (kg)',
    'Height (cm)',
    'Age in Months',
    'Weight for Age Status',
    'Height for Age Status',
    'Weight for Lt/Ht Status',
  ]
  const COL_COUNT = HEADERS.length

  sheet.columns = [
    { width: 9 }, { width: 16 }, { width: 26 }, { width: 26 }, { width: 12 },
    { width: 7 }, { width: 13 }, { width: 13 }, { width: 10 }, { width: 10 },
    { width: 10 }, { width: 15 }, { width: 15 }, { width: 15 },
  ]

  // --- Logo ---
  const logoBuffer = await loadLogoBuffer()
  let topRow = 1
  if (logoBuffer) {
    const imageId = workbook.addImage({ buffer: logoBuffer, extension: 'jpeg' })
    sheet.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 60, height: 60 },
    })
    sheet.getRow(1).height = 46
    topRow = 1
  }

  // --- Title banner (merged, green fill) ---
  sheet.mergeCells(1, 2, 1, COL_COUNT)
  const titleCell = sheet.getCell(1, 2)
  titleCell.value = 'Community Level e-OPT PLUS Tool'
  titleCell.font = { bold: true, size: 16, color: { argb: THEME.headerText } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.headerFill } }
  for (let c = 1; c <= COL_COUNT; c++) {
    sheet.getCell(1, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.headerFill } }
  }

  sheet.mergeCells(2, 1, 2, COL_COUNT)
  const subtitleCell = sheet.getCell(2, 1)
  subtitleCell.value = 'Republic of the Philippines  •  Department of Health  •  National Nutrition Council'
  subtitleCell.font = { italic: true, size: 10, color: { argb: THEME.headerText } }
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  for (let c = 1; c <= COL_COUNT; c++) {
    sheet.getCell(2, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.headerFill } }
  }
  sheet.getRow(2).height = 20

  // --- Info band (barangay / municipality / province / region / year) ---
  sheet.mergeCells(3, 1, 3, COL_COUNT)
  const infoCell = sheet.getCell(3, 1)
  infoCell.value = `Barangay: ${barangay || ''}      Municipality: UBAY      Province: BOHOL      Region: VII Central Visayas      Year: ${year}`
  infoCell.font = { bold: true, size: 11 }
  infoCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  for (let c = 1; c <= COL_COUNT; c++) {
    sheet.getCell(3, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.subFill } }
  }
  sheet.getRow(3).height = 22
  sheet.getRow(4).height = 6 // spacer

  // --- Table header row (row 5) ---
  const headerRowIdx = 5
  const headerRow = sheet.getRow(headerRowIdx)
  HEADERS.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: THEME.tableHeaderText }, size: 10 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.tableHeaderFill } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = thinBorder
  })
  headerRow.height = 30

  // --- Data rows ---
  let rowIdx = headerRowIdx + 1
  records.forEach((r, i) => {
    const wfa = getWfaStatusCode(r)
    const hfa = getHfaStatusCode(r)
    const wfh = getWfhStatusCode(r)

    const values = [
      i + 1,
      purokLabel(r.purok),
      r.motherOrCaregiver || '',
      r.fullName || '',
      '',
      sexCode(r.sex),
      fmtDate(r.birthdate),
      fmtDate(r.recordedDate),
      r.weight ?? '',
      r.height ?? '',
      r.ageMonths ?? '',
      wfa,
      hfa,
      wfh,
    ]

    const row = sheet.getRow(rowIdx)
    values.forEach((v, idx) => {
      const cell = row.getCell(idx + 1)
      cell.value = v
      cell.border = thinBorder
      cell.alignment = { vertical: 'middle', horizontal: idx <= 4 ? 'left' : 'center' }
      cell.font = { size: 10 }
    })

    // Color-code the three status cells (columns 12, 13, 14)
    ;[[12, wfa], [13, hfa], [14, wfh]].forEach(([col, code]) => {
      const c = THEME.statusColors[code]
      if (c) {
        const cell = row.getCell(col)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.fill } }
        cell.font = { bold: true, size: 10, color: { argb: c.text } }
      }
    })

    // Zebra striping on plain columns for readability
    if (i % 2 === 1) {
      for (let c = 1; c <= 11; c++) {
        const cell = row.getCell(c)
        if (!cell.fill) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } }
        }
      }
    }

    rowIdx++
  })

  return sheet
}

// ---------------------------------------------------------------------------
// Main export — Nut_StatusTool only
// ---------------------------------------------------------------------------
export async function exportOptPlusExcel({ barangay, records }) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Nutrition Management System'
  workbook.created = new Date()

  const year = new Date().getFullYear()
  await buildNutStatusToolSheet(workbook, barangay, records, year)

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const safeName = (barangay || 'Barangay').replace(/[^A-Za-z0-9_-]+/g, '_')
  saveAs(blob, `OPT_Plus_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`)
}