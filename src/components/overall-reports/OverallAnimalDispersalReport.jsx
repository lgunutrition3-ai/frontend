// components/overall-reports/OverallAnimalDispersalReport.jsx
import { useState, useEffect } from 'react'
import { animalDispersalApi } from '../../api/reports'
import { Card, Row, Col, Form, Spinner, Table, Button, Alert } from 'react-bootstrap'
import { exportReportToDocx } from '../../utils/docxExport'
import nutritionLogo from '../../assets/nutritionlogo.jpg'

const OverallAnimalDispersalReport = () => {
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
      const allRecords = await animalDispersalApi.getAll()
      
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
          chickenMale: barangayRecords.reduce((sum, r) => sum + (r.chickenMale || 0), 0),
          chickenFemale: barangayRecords.reduce((sum, r) => sum + (r.chickenFemale || 0), 0),
          pigMale: barangayRecords.reduce((sum, r) => sum + (r.pigMale || 0), 0),
          pigFemale: barangayRecords.reduce((sum, r) => sum + (r.pigFemale || 0), 0),
          goatMale: barangayRecords.reduce((sum, r) => sum + (r.goatMale || 0), 0),
          goatFemale: barangayRecords.reduce((sum, r) => sum + (r.goatFemale || 0), 0),
          cowMale: barangayRecords.reduce((sum, r) => sum + (r.cowMale || 0), 0),
          cowFemale: barangayRecords.reduce((sum, r) => sum + (r.cowFemale || 0), 0),
          otherMale: barangayRecords.reduce((sum, r) => sum + (r.otherMale || 0), 0),
          otherFemale: barangayRecords.reduce((sum, r) => sum + (r.otherFemale || 0), 0),
        }
      })
      
      const overallTotal = {
        chickenMale: barangayReports.reduce((sum, b) => sum + b.chickenMale, 0),
        chickenFemale: barangayReports.reduce((sum, b) => sum + b.chickenFemale, 0),
        pigMale: barangayReports.reduce((sum, b) => sum + b.pigMale, 0),
        pigFemale: barangayReports.reduce((sum, b) => sum + b.pigFemale, 0),
        goatMale: barangayReports.reduce((sum, b) => sum + b.goatMale, 0),
        goatFemale: barangayReports.reduce((sum, b) => sum + b.goatFemale, 0),
        cowMale: barangayReports.reduce((sum, b) => sum + b.cowMale, 0),
        cowFemale: barangayReports.reduce((sum, b) => sum + b.cowFemale, 0),
        otherMale: barangayReports.reduce((sum, b) => sum + b.otherMale, 0),
        otherFemale: barangayReports.reduce((sum, b) => sum + b.otherFemale, 0),
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
      b.chickenMale || 0,
      b.chickenFemale || 0,
      b.pigMale || 0,
      b.pigFemale || 0,
      b.goatMale || 0,
      b.goatFemale || 0,
      b.cowMale || 0,
      b.cowFemale || 0,
      b.otherMale || 0,
      b.otherFemale || 0,
    ])

    body.push([
      '', 'Total',
      report.overallTotal?.chickenMale || 0,
      report.overallTotal?.chickenFemale || 0,
      report.overallTotal?.pigMale || 0,
      report.overallTotal?.pigFemale || 0,
      report.overallTotal?.goatMale || 0,
      report.overallTotal?.goatFemale || 0,
      report.overallTotal?.cowMale || 0,
      report.overallTotal?.cowFemale || 0,
      report.overallTotal?.otherMale || 0,
      report.overallTotal?.otherFemale || 0,
    ])

    await exportReportToDocx({
      govLines: [
        'Republic of the Philippines',
        'Province of Bohol',
        'Municipality of Ubay',
        'MUNICIPAL NUTRITION COUNCIL'
      ],
      titleLines: [`ANIMAL DISPERSAL OVERALL REPORT ${yearDisplay}`],
      infoLines,
      infoCenter: true,
      headers: ['#', 'BARANGAY', 'CHK M', 'CHK F', 'PIG M', 'PIG F', 'GOAT M', 'GOAT F', 'COW M', 'COW F', 'OTH M', 'OTH F'],
      body,
      cellFontSize: 16,
      signatures: {
        left: [{ label: 'PREPARED BY:', name: report.preparedBy, position: report.preparedPosition }],
        right: [{ label: 'NOTED BY:', name: report.notedBy, position: report.notedPosition }]
      },
      fileName: `Overall_AnimalDispersal_Report_${yearDisplay}`
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
            <h1 className="mb-0">Animal Dispersal Overall Report</h1>
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
              <h6 className="text-muted">Total Chicken</h6>
              <h2 className="mb-0 text-info">{report.overallTotal?.chickenMale + report.overallTotal?.chickenFemale || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Pigs</h6>
              <h2 className="mb-0 text-success">{report.overallTotal?.pigMale + report.overallTotal?.pigFemale || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Goats</h6>
              <h2 className="mb-0 text-warning">{report.overallTotal?.goatMale + report.overallTotal?.goatFemale || 0}</h2>
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
              <div className="fw-bold fs-5 text-success">ANIMAL DISPERSAL OVERALL REPORT {yearDisplay}</div>
              {startDate && endDate && (
                <div className="text-muted small">{new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive bordered hover className="mb-0" size="sm">
            <thead>
              <tr className="text-center">
                <th>#</th>
                <th>BARANGAY</th>
                <th>CHK M</th>
                <th>CHK F</th>
                <th>PIG M</th>
                <th>PIG F</th>
                <th>GOAT M</th>
                <th>GOAT F</th>
                <th>COW M</th>
                <th>COW F</th>
                <th>OTH M</th>
                <th>OTH F</th>
              </tr>
            </thead>
            <tbody>
              {report.barangays.map((barangay, i) => (
                <tr key={barangay.barangay}>
                  <td className="text-center">{i + 1}</td>
                  <td>{barangay.barangay}</td>
                  <td className="text-center">{barangay.chickenMale || 0}</td>
                  <td className="text-center">{barangay.chickenFemale || 0}</td>
                  <td className="text-center">{barangay.pigMale || 0}</td>
                  <td className="text-center">{barangay.pigFemale || 0}</td>
                  <td className="text-center">{barangay.goatMale || 0}</td>
                  <td className="text-center">{barangay.goatFemale || 0}</td>
                  <td className="text-center">{barangay.cowMale || 0}</td>
                  <td className="text-center">{barangay.cowFemale || 0}</td>
                  <td className="text-center">{barangay.otherMale || 0}</td>
                  <td className="text-center">{barangay.otherFemale || 0}</td>
                </tr>
              ))}
              <tr className="table-primary fw-bold">
                <td colSpan={2}>Total</td>
                <td className="text-center">{report.overallTotal?.chickenMale || 0}</td>
                <td className="text-center">{report.overallTotal?.chickenFemale || 0}</td>
                <td className="text-center">{report.overallTotal?.pigMale || 0}</td>
                <td className="text-center">{report.overallTotal?.pigFemale || 0}</td>
                <td className="text-center">{report.overallTotal?.goatMale || 0}</td>
                <td className="text-center">{report.overallTotal?.goatFemale || 0}</td>
                <td className="text-center">{report.overallTotal?.cowMale || 0}</td>
                <td className="text-center">{report.overallTotal?.cowFemale || 0}</td>
                <td className="text-center">{report.overallTotal?.otherMale || 0}</td>
                <td className="text-center">{report.overallTotal?.otherFemale || 0}</td>
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

export default OverallAnimalDispersalReport