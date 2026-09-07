import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  PageOrientation,
} from 'docx'
import { saveAs } from 'file-saver'
import nutritionLogo from '../assets/nutritionlogo.jpg'

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

// ---------------------------------------------------------------------------
// Table helpers
// ---------------------------------------------------------------------------

const makeCell = (text, { bold = false, size = 20, widthPct } = {}) => {
  return new TableCell({
    width: widthPct
      ? { size: widthPct, type: WidthType.PERCENTAGE }
      : { size: 20, type: WidthType.PERCENTAGE },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    verticalAlign: 'center',
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: String(text ?? ''), bold, size })],
      }),
    ],
  })
}

const makeTable = (
  headers,
  body,
  { boldLastRow = true, cellFontSize = 20 } = {}
) => {
  const colWidth = Math.floor(100 / headers.length)

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) =>
      makeCell(h, { bold: true, size: cellFontSize, widthPct: colWidth })
    ),
  })

  const bodyRows = body.map((row, i) => {
    const bold = boldLastRow && i === body.length - 1
    return new TableRow({
      children: row.map((cell) =>
        makeCell(cell, { bold, size: cellFontSize, widthPct: colWidth })
      ),
    })
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  })
}

// ---------------------------------------------------------------------------
// Signature helpers - using paragraphs for independent positioning
// ---------------------------------------------------------------------------

// Helper to create a signature block with label on left and name/position below
const makeSignatureParagraphs = (label, name, position) => {
  const paragraphs = []
  
  // Label with name on the same line
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: label, bold: true, size: 20 }),
        new TextRun({ text: ` ${name || '________________'}`, size: 20 }),
      ],
    })
  )
  
  // Position below, indented
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      indent: { left: 700 },
      spacing: { after: 200 },
      children: [new TextRun({ text: position || '', size: 20 })],
    })
  )
  
  return paragraphs
}

// Create signature rows with proper alignment using paragraph tabs
const makeSignatures = (leftSignatures, rightSignatures) => {
  const children = []
  
  // First row - left and right signatures on same line using tab stops
  const leftText = leftSignatures.length > 0 ? `${leftSignatures[0].label}` : ''
  const leftName = leftSignatures.length > 0 ? (leftSignatures[0].name || '________________') : ''
  const rightText = rightSignatures.length > 0 ? `${rightSignatures[0].label}` : ''
  const rightName = rightSignatures.length > 0 ? (rightSignatures[0].name || '________________') : ''
  
  // Create a paragraph with tab stops for left and right alignment
  if (leftText || rightText) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 40 },
        tabStops: [
          {
            type: 'left',
            position: 0,
          },
          {
            type: 'right',
            position: 9000,
          },
        ],
        children: [
          new TextRun({ text: leftText, bold: true, size: 20 }),
          new TextRun({ text: ` ${leftName}`, size: 20 }),
          new TextRun({ text: '\t', size: 20 }),
          new TextRun({ text: rightText, bold: true, size: 20 }),
          new TextRun({ text: ` ${rightName}`, size: 20 }),
        ],
      })
    )
  }
  
  // Second row - positions
  const leftPos = leftSignatures.length > 0 ? (leftSignatures[0].position || '') : ''
  const rightPos = rightSignatures.length > 0 ? (rightSignatures[0].position || '') : ''
  
  if (leftPos || rightPos) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 200 },
        tabStops: [
          {
            type: 'left',
            position: 0,
          },
          {
            type: 'right',
            position: 9000,
          },
        ],
        children: [
          new TextRun({ text: leftPos, size: 20 }),
          new TextRun({ text: '\t', size: 20 }),
          new TextRun({ text: rightPos, size: 20 }),
        ],
      })
    )
  }
  
  // Additional signature rows if needed
  const maxRows = Math.max(leftSignatures.length, rightSignatures.length)
  for (let i = 1; i < maxRows; i++) {
    const leftLabel = i < leftSignatures.length ? `${leftSignatures[i].label}` : ''
    const leftName = i < leftSignatures.length ? (leftSignatures[i].name || '________________') : ''
    const rightLabel = i < rightSignatures.length ? `${rightSignatures[i].label}` : ''
    const rightName = i < rightSignatures.length ? (rightSignatures[i].name || '________________') : ''
    
    if (leftLabel || rightLabel) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 40 },
          tabStops: [
            {
              type: 'left',
              position: 0,
            },
            {
              type: 'right',
              position: 9000,
            },
          ],
          children: [
            new TextRun({ text: leftLabel, bold: true, size: 20 }),
            new TextRun({ text: ` ${leftName}`, size: 20 }),
            new TextRun({ text: '\t', size: 20 }),
            new TextRun({ text: rightLabel, bold: true, size: 20 }),
            new TextRun({ text: ` ${rightName}`, size: 20 }),
          ],
        })
      )
    }
    
    const leftPos2 = i < leftSignatures.length ? (leftSignatures[i].position || '') : ''
    const rightPos2 = i < rightSignatures.length ? (rightSignatures[i].position || '') : ''
    
    if (leftPos2 || rightPos2) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 200 },
          tabStops: [
            {
              type: 'left',
              position: 0,
            },
            {
              type: 'right',
              position: 9000,
            },
          ],
          children: [
            new TextRun({ text: leftPos2, size: 20 }),
            new TextRun({ text: '\t', size: 20 }),
            new TextRun({ text: rightPos2, size: 20 }),
          ],
        })
      )
    }
  }
  
  return children
}

// ---------------------------------------------------------------------------
// Logo loading — resilient. If it fails (flaky mobile connection, etc.)
// the export still proceeds without the logo instead of crashing outright.
// ---------------------------------------------------------------------------

let cachedLogoData = null

const getLogoData = async () => {
  if (cachedLogoData) return cachedLogoData
  try {
    const res = await fetch(nutritionLogo)
    if (!res.ok) throw new Error(`Logo fetch failed: ${res.status}`)
    const buf = await res.arrayBuffer()
    cachedLogoData = new Uint8Array(buf)
    return cachedLogoData
  } catch (err) {
    console.warn('Nutrition logo could not be loaded for the DOCX export:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Cross-platform save.
//
// Desktop browsers handle Blob downloads fine via file-saver. Most mobile
// browsers (iOS Safari/Chrome, Android in-app webviews) do NOT reliably
// download blobs — they'll often just try to open/render the raw bytes,
// which is why the "same" exported file looks broken/different on phone.
// The fix is to hand the file to the OS share sheet via the Web Share API
// when available, which lets the user save it properly (Files / Drive /
// WhatsApp / etc). We fall back to saveAs everywhere else.
// ---------------------------------------------------------------------------

const isMobileDevice = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod|android/i.test(navigator.userAgent)

const saveDocxBlob = async (blob, rawFileName) => {
  const fileName = rawFileName.endsWith('.docx')
    ? rawFileName
    : `${rawFileName}.docx`

  if (isMobileDevice() && typeof navigator.canShare === 'function') {
    try {
      const file = new File([blob], fileName, { type: DOCX_MIME })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName })
        return
      }
    } catch (err) {
      // User cancelled the share sheet — don't fall through to a
      // second save prompt, just stop quietly.
      if (err && err.name === 'AbortError') return
      console.warn('Web Share export failed, falling back to saveAs:', err)
    }
  }

  saveAs(blob, fileName)
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

export const exportReportToDocx = async ({
  govLines = [],
  titleLines = [],
  infoLines = [],
  infoCenter = false,
  headers = [],
  body = [],
  boldLastRow = true,
  cellFontSize = 20,
  signatures = { left: [], right: [] },
  fileName,
  orientation, // 'portrait' | 'landscape' | undefined (auto)
}) => {
  const logoData = await getLogoData()

  const children = []

  if (logoData) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'jpg',
            data: logoData,
            transformation: { width: 90, height: 90 },
          }),
        ],
        spacing: { after: 120 },
      })
    )
  }

  govLines.forEach((line) => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [new TextRun({ text: line, bold: true, size: 22 })],
      })
    )
  })

  titleLines.forEach((line, i) => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: i === titleLines.length - 1 ? 120 : 20 },
        children: [new TextRun({ text: line, bold: true, size: 28 })],
      })
    )
  })

  infoLines.forEach((line) => {
    children.push(
      new Paragraph({
        alignment: infoCenter ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 40 },
        children: [new TextRun({ text: line, size: 22 })],
      })
    )
  })

  if (headers.length > 0) {
    children.push(new Paragraph({ spacing: { after: 120 }, children: [] }))
    children.push(makeTable(headers, body, { boldLastRow, cellFontSize }))
  }

  // Add signatures as independent paragraphs (not inside a table)
  if (
    (signatures.left && signatures.left.length > 0) ||
    (signatures.right && signatures.right.length > 0)
  ) {
    children.push(new Paragraph({ spacing: { after: 250 }, children: [] }))
    const sigChildren = makeSignatures(signatures.left || [], signatures.right || [])
    children.push(...sigChildren)
  }

  // Auto-landscape for wide tables so columns don't get squeezed —
  // unless the caller explicitly asked for a specific orientation.
  const resolvedOrientation =
    orientation || (headers.length > 8 ? 'landscape' : 'portrait')

  const pageSize =
    resolvedOrientation === 'landscape'
      ? { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE }
      : { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
            size: pageSize,
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  await saveDocxBlob(blob, fileName)
}