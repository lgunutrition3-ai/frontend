// components/overall-reports/OverallIodizedSaltReport.jsx
import { useState, useEffect } from 'react'
import { iodizedSaltApi } from '../../api/reports'
import { Card, Row, Col, Form, Spinner, Table, Button, Alert } from 'react-bootstrap'
import { exportReportToDocx } from '../../utils/docxExport'
import nutritionLogo from '../../assets/nutritionlogo.jpg'

const OverallIodizedSaltReport = () => {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Signature fields
  const [preparedName, setPreparedName] = useState('')
  const [preparedPosition, setPreparedPosition] = useState('MNPC')
  const [notedName, setNotedName] = useState('')
  const [notedPosition, setNotedPosition] = useState('RN')

  useEffect(() => {
    fetchOverallReport()
  }, [startDate, endDate])

  const fetchOverallReport = async () => {
    setLoading(true)
    setError('')
    try {
      const allRecords = await iodizedSaltApi.getAll()
      
      let dateFiltered = allRecords
      if (startDate && endDate) {
        dateFiltered = allRecords.filter(r => {
          const recordDate = new Date(r.recordedDate)
          const start = new Date(startDate)
          const end = new Date(endDate)
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
          return recordDate >= start && recordDate <= end
        })
      }
      
      const barangays = [...new Set(dateFiltered.map(r => r.barangay))].sort()
      const barangayReports = barangays.map(barangay => {
        const barangayRecords = dateFiltered.filter(r => r.barangay === barangay)
        return {
          barangay,
          stores: barangayRecords.length,
          fineSalt: barangayRecords.filter(r => r.fineSaltFidel || r.fineSaltUFC || r.fineSaltPacificBay || r.fineSaltOthers).length,
          rockSalt: barangayRecords.filter(r => r.rockSaltAtlantic || r.rockSaltFidel || r.rockSaltLasap || r.rockSaltPagAsa || r.rockSaltJay || r.rockSaltOthers).length,
          oil: barangayRecords.filter(r => r.oilUFC || r.oilJolly || r.oilOthers).length
        }
      })
      
      const overallTotal = {
        stores: barangayReports.reduce((sum, b) => sum + b.stores, 0),
        fineSalt: barangayReports.reduce((sum, b) => sum + b.fineSalt, 0),
        rockSalt: barangayReports.reduce((sum, b) => sum + b.rockSalt, 0),
        oil: barangayReports.reduce((sum, b) => sum + b.oil, 0),
        totalBarangays: barangayReports.length
      }
      
      setReport({
        barangays: barangayReports,
        overallTotal,
        startDate,
        endDate,
        preparedBy: preparedName || 'Cristine A. Macahis',
        preparedPosition: preparedPosition || 'MNPC',
        notedBy: notedName || 'Jehd Stephen O. Cutamora',
        notedPosition: notedPosition || 'RN'
      })
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching report')
    } finally {
      setLoading(false)
    }
  }

  const getYearDisplay = () => {
    if (!startDate || !endDate) return 'All Records'
    const startYear = new Date(startDate).getFullYear()
    const endYear = new Date(endDate).getFullYear()
    return startYear === endYear ? startYear.toString() : `${startYear}-${endYear}`
  }

  const handleExportDocx = async () => {
    if (!report) return

    const yearDisplay = getYearDisplay()

    const infoLines = []
    if (startDate && endDate) {
      infoLines.push(`DATE: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`)
    }

    const body = (report.barangays || []).map((b, i) => [
      i + 1,
      b.barangay,
      b.stores || 0,
      b.fineSalt || 0,
      b.rockSalt || 0,
      b.oil || 0
    ])

    body.push([
      '', 'Total',
      report.overallTotal?.stores || 0,
      report.overallTotal?.fineSalt || 0,
      report.overallTotal?.rockSalt || 0,
      report.overallTotal?.oil || 0
    ])

    await exportReportToDocx({
      govLines: [
        'Republic of the Philippines',
        'Province of Bohol',
        'Municipality of Ubay',
        'MUNICIPAL NUTRITION COUNCIL'
      ],
      titleLines: [`IODIZED SALT OVERALL REPORT ${yearDisplay}`],
      infoLines,
      infoCenter: true,
      headers: ['#', 'BARANGAY', 'STORES', 'FINE SALT', 'ROCK SALT', 'OIL'],
      body,
      cellFontSize: 18,
      signatures: {
        left: [{ label: 'PREPARED BY:', name: report.preparedBy, position: report.preparedPosition }],
        right: [{ label: 'NOTED BY:', name: report.notedBy, position: report.notedPosition }]
      },
      fileName: `Overall_IodizedSalt_Report_${yearDisplay}`
    })
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading overall report...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={fetchOverallReport}>Retry</Button>
      </div>
    )
  }

  if (!report || report.barangays.length === 0) {
    return (
      <div className="text-center py-5">
        <Alert variant="info">No records found.</Alert>
      </div>
    )
  }

  const yearDisplay = getYearDisplay()

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <img src={nutritionLogo} alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #198754' }} />
          <div>
            <h1 className="mb-0">Iodized Salt Overall Report</h1>
            <small className="text-muted">{yearDisplay}</small>
          </div>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '150px' }} />
          <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '150px' }} />
          {(startDate || endDate) && (
            <Button variant="outline-secondary" onClick={() => { setStartDate(''); setEndDate(''); }}>
              Clear Dates
            </Button>
          )}
          <Button variant="success" onClick={handleExportDocx}>
            <i className="bi bi-file-earmark-word-fill me-2"></i>Export Word
          </Button>
        </div>
      </div>

      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Barangays</h6>
              <h2 className="mb-0 text-success">{report.overallTotal?.totalBarangays || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Stores</h6>
              <h2 className="mb-0 text-info">{report.overallTotal?.stores || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Fine Salt</h6>
              <h2 className="mb-0 text-success">{report.overallTotal?.fineSalt || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Rock Salt</h6>
              <h2 className="mb-0 text-warning">{report.overallTotal?.rockSalt || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Header className="text-center bg-white border-0 pt-3">
          <div className="d-flex align-items-center justify-content-center gap-3">
            <img src={nutritionLogo} alt="Logo" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #198754' }} />
            <div>
              <div className="fw-bold">MUNICIPAL NUTRITION COUNCIL</div>
              <div className="fw-bold fs-5 text-success">IODIZED SALT OVERALL REPORT {yearDisplay}</div>
              {startDate && endDate && (
                <div className="text-muted small">{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive bordered hover className="mb-0">
            <thead>
              <tr className="text-center">
                <th style={{ width: '5%' }}>#</th>
                <th>BARANGAY</th>
                <th style={{ width: '12%' }}>STORES</th>
                <th style={{ width: '12%' }}>FINE SALT</th>
                <th style={{ width: '12%' }}>ROCK SALT</th>
                <th style={{ width: '12%' }}>OIL</th>
              </tr>
            </thead>
            <tbody>
              {report.barangays.map((barangay, i) => (
                <tr key={barangay.barangay}>
                  <td className="text-center">{i + 1}</td>
                  <td>{barangay.barangay}</td>
                  <td className="text-center">{barangay.stores || 0}</td>
                  <td className="text-center">{barangay.fineSalt || 0}</td>
                  <td className="text-center">{barangay.rockSalt || 0}</td>
                  <td className="text-center">{barangay.oil || 0}</td>
                </tr>
              ))}
              <tr className="table-primary fw-bold">
                <td colSpan={2}>Total</td>
                <td className="text-center">{report.overallTotal?.stores || 0}</td>
                <td className="text-center">{report.overallTotal?.fineSalt || 0}</td>
                <td className="text-center">{report.overallTotal?.rockSalt || 0}</td>
                <td className="text-center">{report.overallTotal?.oil || 0}</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Row className="mt-4">
        <Col md={6}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <img src={nutritionLogo} alt="Logo" style={{ width: '25px', height: '25px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #198754' }} />
            <p className="fw-bold mb-0">PREPARED BY:</p>
          </div>
          <Row>
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Name"
                value={preparedName}
                onChange={(e) => setPreparedName(e.target.value)}
                size="sm"
              />
            </Col>
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Position"
                value={preparedPosition}
                onChange={(e) => setPreparedPosition(e.target.value)}
                size="sm"
              />
            </Col>
          </Row>
        </Col>
        <Col md={6}>
          <div className="d-flex align-items-center gap-2 mb-1">
            <img src={nutritionLogo} alt="Logo" style={{ width: '25px', height: '25px', objectFit: 'cover', borderRadius: '50%', border: '1px solid #198754' }} />
            <p className="fw-bold mb-0">NOTED BY:</p>
          </div>
          <Row>
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Name"
                value={notedName}
                onChange={(e) => setNotedName(e.target.value)}
                size="sm"
              />
            </Col>
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Position"
                value={notedPosition}
                onChange={(e) => setNotedPosition(e.target.value)}
                size="sm"
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  )
}

export default OverallIodizedSaltReport