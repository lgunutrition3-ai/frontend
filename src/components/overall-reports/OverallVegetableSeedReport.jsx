// components/overall-reports/OverallVegetableSeedReport.jsx
import { useState, useEffect } from 'react'
import { vegetableSeedApi } from '../../api/reports'
import { Card, Row, Col, Form, Spinner, Table, Button, Alert } from 'react-bootstrap'
import { exportReportToDocx } from '../../utils/docxExport'
import nutritionLogo from '../../assets/nutritionlogo.jpg'

const OverallVegetableSeedReport = () => {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Seed type selections
  const [seedType1, setSeedType1] = useState('')
  const [seedType2, setSeedType2] = useState('')
  const [seedType3, setSeedType3] = useState('')
  const [availableSeedTypes, setAvailableSeedTypes] = useState([])
  
  // Signature fields
  const [preparedName, setPreparedName] = useState('')
  const [preparedPosition, setPreparedPosition] = useState('MNPC')
  const [notedName, setNotedName] = useState('')
  const [notedPosition, setNotedPosition] = useState('RN')

  useEffect(() => {
    fetchOverallReport()
  }, [startDate, endDate, seedType1, seedType2, seedType3])

  const fetchOverallReport = async () => {
    setLoading(true)
    setError('')
    try {
      const allRecords = await vegetableSeedApi.getAll()
      
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
      
      // Extract all seed types
      const allSeedTypes = new Set()
      dateFiltered.forEach(r => {
        if (r.seedTypes) {
          try {
            let seeds = r.seedTypes
            if (typeof seeds === 'string') {
              seeds = JSON.parse(seeds)
            }
            if (Array.isArray(seeds)) {
              seeds.forEach(s => {
                if (s.type) allSeedTypes.add(s.type)
              })
            }
          } catch (e) {
            if (typeof r.seedTypes === 'string') {
              r.seedTypes.split(',').forEach(s => {
                const trimmed = s.trim()
                if (trimmed) allSeedTypes.add(trimmed)
              })
            }
          }
        }
      })
      
      const seedTypesArray = Array.from(allSeedTypes).sort()
      setAvailableSeedTypes(seedTypesArray)
      
      if (seedTypesArray.length > 0 && !seedType1) setSeedType1(seedTypesArray[0])
      if (seedTypesArray.length > 1 && !seedType2) setSeedType2(seedTypesArray[1])
      if (seedTypesArray.length > 2 && !seedType3) setSeedType3(seedTypesArray[2])
      
      const barangays = [...new Set(dateFiltered.map(r => r.barangay))].sort()
      const barangayReports = barangays.map(barangay => {
        const barangayRecords = dateFiltered.filter(r => r.barangay === barangay)
        const totalHouseholds = barangayRecords.length
        
        const seedCounts = {}
        barangayRecords.forEach(r => {
          if (r.seedTypes) {
            try {
              let seeds = r.seedTypes
              if (typeof seeds === 'string') {
                seeds = JSON.parse(seeds)
              }
              if (Array.isArray(seeds)) {
                seeds.forEach(s => {
                  if (s.type && s.count) {
                    if (!seedCounts[s.type]) seedCounts[s.type] = 0
                    seedCounts[s.type] += s.count
                  }
                })
              }
            } catch (e) {}
          }
        })
        
        const count1 = seedType1 ? (seedCounts[seedType1] || 0) : 0
        const count2 = seedType2 ? (seedCounts[seedType2] || 0) : 0
        const count3 = seedType3 ? (seedCounts[seedType3] || 0) : 0
        
        return {
          barangay,
          totalHouseholds,
          count1: count1 || 0,
          count2: count2 || 0,
          count3: count3 || 0,
          subTotal: (count1 + count2 + count3) || 0
        }
      })
      
      const overallTotal = {
        totalHouseholds: barangayReports.reduce((sum, b) => sum + b.totalHouseholds, 0),
        count1: barangayReports.reduce((sum, b) => sum + b.count1, 0),
        count2: barangayReports.reduce((sum, b) => sum + b.count2, 0),
        count3: barangayReports.reduce((sum, b) => sum + b.count3, 0),
        subTotal: barangayReports.reduce((sum, b) => sum + b.subTotal, 0),
        totalBarangays: barangayReports.length
      }
      
      setReport({
        barangays: barangayReports,
        overallTotal,
        startDate,
        endDate,
        seedType1,
        seedType2,
        seedType3,
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

    const seedLabel1 = report.seedType1 || '______'
    const seedLabel2 = report.seedType2 || '______'
    const seedLabel3 = report.seedType3 || '______'

    const body = (report.barangays || []).map((b, i) => [
      i + 1,
      b.barangay,
      b.totalHouseholds || 0,
      b.count1 || 0,
      b.count2 || 0,
      b.count3 || 0,
      b.subTotal || 0
    ])

    body.push([
      '', 'Total',
      report.overallTotal?.totalHouseholds || 0,
      report.overallTotal?.count1 || 0,
      report.overallTotal?.count2 || 0,
      report.overallTotal?.count3 || 0,
      report.overallTotal?.subTotal || 0
    ])

    await exportReportToDocx({
      govLines: [
        'Republic of the Philippines',
        'Province of Bohol',
        'Municipality of Ubay',
        'MUNICIPAL NUTRITION COUNCIL'
      ],
      titleLines: [`VEGETABLE SEEDS ${yearDisplay}`],
      infoLines,
      infoCenter: true,
      headers: ['#', 'BARANGAY', 'TOTAL HOUSEHOLDS', `NO. OF ${seedLabel1}`, `NO. OF ${seedLabel2}`, `NO. OF ${seedLabel3}`, 'SUB-TOTAL'],
      body,
      cellFontSize: 16,
      orientation: 'landscape',
      signatures: {
        left: [{ label: 'PREPARED BY:', name: report.preparedBy, position: report.preparedPosition }],
        right: [{ label: 'NOTED BY:', name: report.notedBy, position: report.notedPosition }]
      },
      fileName: `Overall_VegetableSeed_Report_${yearDisplay}`
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
            <h1 className="mb-0">Vegetable Seeds Overall Report</h1>
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

      {availableSeedTypes.length > 0 && (
        <Card className="mb-3 border-0 shadow-sm">
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">Seed Type 1</Form.Label>
                  <Form.Select value={seedType1} onChange={(e) => setSeedType1(e.target.value)}>
                    <option value="">Select Seed Type</option>
                    {availableSeedTypes.map(seed => (
                      <option key={seed} value={seed}>{seed}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">Seed Type 2</Form.Label>
                  <Form.Select value={seedType2} onChange={(e) => setSeedType2(e.target.value)}>
                    <option value="">Select Seed Type</option>
                    {availableSeedTypes.map(seed => (
                      <option key={seed} value={seed}>{seed}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="small fw-bold text-muted">Seed Type 3</Form.Label>
                  <Form.Select value={seedType3} onChange={(e) => setSeedType3(e.target.value)}>
                    <option value="">Select Seed Type</option>
                    {availableSeedTypes.map(seed => (
                      <option key={seed} value={seed}>{seed}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Row className="g-4 mb-4">
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Barangays</h6>
              <h2 className="mb-0 text-success">{report.overallTotal?.totalBarangays || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Total Households</h6>
              <h2 className="mb-0 text-info">{report.overallTotal?.totalHouseholds || 0}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h6 className="text-muted">Sub-Total Seeds</h6>
              <h2 className="mb-0 text-warning">{report.overallTotal?.subTotal || 0}</h2>
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
              <div className="fw-bold fs-5 text-success">VEGETABLE SEEDS {yearDisplay}</div>
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
                <th style={{ width: '5%' }}>#</th>
                <th>BARANGAY</th>
                <th style={{ width: '15%' }}>TOTAL HOUSEHOLDS</th>
                <th style={{ width: '12%' }}>NO. OF {report.seedType1 || '______'}</th>
                <th style={{ width: '12%' }}>NO. OF {report.seedType2 || '______'}</th>
                <th style={{ width: '12%' }}>NO. OF {report.seedType3 || '______'}</th>
                <th style={{ width: '10%' }}>SUB-TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {report.barangays.map((barangay, i) => (
                <tr key={barangay.barangay}>
                  <td className="text-center">{i + 1}</td>
                  <td>{barangay.barangay}</td>
                  <td className="text-center">{barangay.totalHouseholds || 0}</td>
                  <td className="text-center">{barangay.count1 || 0}</td>
                  <td className="text-center">{barangay.count2 || 0}</td>
                  <td className="text-center">{barangay.count3 || 0}</td>
                  <td className="text-center">{barangay.subTotal || 0}</td>
                </tr>
              ))}
              <tr className="table-primary fw-bold">
                <td colSpan={2}>Total</td>
                <td className="text-center">{report.overallTotal?.totalHouseholds || 0}</td>
                <td className="text-center">{report.overallTotal?.count1 || 0}</td>
                <td className="text-center">{report.overallTotal?.count2 || 0}</td>
                <td className="text-center">{report.overallTotal?.count3 || 0}</td>
                <td className="text-center">{report.overallTotal?.subTotal || 0}</td>
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

export default OverallVegetableSeedReport