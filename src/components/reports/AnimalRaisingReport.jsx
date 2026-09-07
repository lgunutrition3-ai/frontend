import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { animalRaisingApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col, Spinner } from 'react-bootstrap'
import { exportReportToDocx } from '../../utils/docxExport'
import nutritionLogo from '../../assets/nutritionlogo.jpg'

const AnimalRaisingReport = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const userBarangay = user?.barangay || ''
  
  const [barangay, setBarangay] = useState(isAdmin ? '' : userBarangay)
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)
  
  const [certifiedName, setCertifiedName] = useState('')
  const [certifiedPosition, setCertifiedPosition] = useState('BNS')
  const [approvedName, setApprovedName] = useState('')
  const [approvedPosition, setApprovedPosition] = useState('BRGY. CAPTAIN')

  useEffect(() => {
    if (barangay) {
      fetchRecords()
    }
  }, [barangay, startDate, endDate])

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await animalRaisingApi.getByBarangay(barangay, 0)
      
      const filtered = data.filter(r => {
        const recordDate = new Date(r.recordedDate)
        const start = new Date(startDate)
        const end = new Date(endDate)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        return recordDate >= start && recordDate <= end
      })
      
      setRecords(filtered)
      generateReport(filtered)
    } catch (error) {
      setError('Error fetching records')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = (data) => {
    const purokReports = []
    for (let p = 1; p <= 7; p++) {
      const purokRecords = data.filter(r => r.purok === p)
      purokReports.push({
        purok: p,
        households: purokRecords.length,
        chickenMale: purokRecords.reduce((sum, r) => sum + (r.chickenMale || 0), 0),
        chickenFemale: purokRecords.reduce((sum, r) => sum + (r.chickenFemale || 0), 0),
        pigMale: purokRecords.reduce((sum, r) => sum + (r.pigMale || 0), 0),
        pigFemale: purokRecords.reduce((sum, r) => sum + (r.pigFemale || 0), 0),
        goatMale: purokRecords.reduce((sum, r) => sum + (r.goatMale || 0), 0),
        goatFemale: purokRecords.reduce((sum, r) => sum + (r.goatFemale || 0), 0),
        cowMale: purokRecords.reduce((sum, r) => sum + (r.cowMale || 0), 0),
        cowFemale: purokRecords.reduce((sum, r) => sum + (r.cowFemale || 0), 0),
        carabaoMale: purokRecords.reduce((sum, r) => sum + (r.carabaoMale || 0), 0),
        carabaoFemale: purokRecords.reduce((sum, r) => sum + (r.carabaoFemale || 0), 0),
        otherMale: purokRecords.reduce((sum, r) => sum + (r.otherMale || 0), 0),
        otherFemale: purokRecords.reduce((sum, r) => sum + (r.otherFemale || 0), 0)
      })
    }
    const total = {
      households: purokReports.reduce((sum, p) => sum + p.households, 0),
      chickenMale: purokReports.reduce((sum, p) => sum + p.chickenMale, 0),
      chickenFemale: purokReports.reduce((sum, p) => sum + p.chickenFemale, 0),
      pigMale: purokReports.reduce((sum, p) => sum + p.pigMale, 0),
      pigFemale: purokReports.reduce((sum, p) => sum + p.pigFemale, 0),
      goatMale: purokReports.reduce((sum, p) => sum + p.goatMale, 0),
      goatFemale: purokReports.reduce((sum, p) => sum + p.goatFemale, 0),
      cowMale: purokReports.reduce((sum, p) => sum + p.cowMale, 0),
      cowFemale: purokReports.reduce((sum, p) => sum + p.cowFemale, 0),
      carabaoMale: purokReports.reduce((sum, p) => sum + p.carabaoMale, 0),
      carabaoFemale: purokReports.reduce((sum, p) => sum + p.carabaoFemale, 0),
      otherMale: purokReports.reduce((sum, p) => sum + p.otherMale, 0),
      otherFemale: purokReports.reduce((sum, p) => sum + p.otherFemale, 0)
    }
    const startYear = new Date(startDate).getFullYear()
    const endYear = new Date(endDate).getFullYear()
    const yearDisplay = startYear === endYear ? startYear.toString() : `${startYear}-${endYear}`
    setReport({ purokReports, total, barangay, year: yearDisplay, startDate, endDate })
  }

  const handleExportDocx = async () => {
    if (!report) return

    const barangayName = barangay.toUpperCase()

    const body = report.purokReports.map((p) => [
      p.purok,
      p.chickenMale || 0, p.chickenFemale || 0,
      p.pigMale || 0, p.pigFemale || 0,
      p.goatMale || 0, p.goatFemale || 0,
      p.cowMale || 0, p.cowFemale || 0,
      p.carabaoMale || 0, p.carabaoFemale || 0,
      p.otherMale || 0, p.otherFemale || 0,
      ''
    ])

    body.push([
      'TOTAL',
      report.total.chickenMale || 0, report.total.chickenFemale || 0,
      report.total.pigMale || 0, report.total.pigFemale || 0,
      report.total.goatMale || 0, report.total.goatFemale || 0,
      report.total.cowMale || 0, report.total.cowFemale || 0,
      report.total.carabaoMale || 0, report.total.carabaoFemale || 0,
      report.total.otherMale || 0, report.total.otherFemale || 0,
      ''
    ])

    await exportReportToDocx({
      titleLines: [
        'CONSOLIDATED REPORT ON',
        `HOUSEHOLD ANIMAL RAISING ${report.year}`
      ],
      infoLines: [
        `BARANGAY: ${barangayName}`,
        `DATE: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`,
        `TOTAL HOUSEHOLD: ${report.total.households}`
      ],
      headers: ['PUROK', 'Chicken M', 'Chicken F', 'Pig M', 'Pig F', 'Goat M', 'Goat F', 'Cow M', 'Cow F', 'Carabao M', 'Carabao F', 'Other M', 'Other F', 'Signature'],
      body,
      cellFontSize: 14,
      signatures: {
        left: [{ label: 'CERTIFIED CORRECT:', name: certifiedName, position: certifiedPosition }],
        right: [{ label: 'APPROVED BY:', name: approvedName, position: approvedPosition }]
      },
      fileName: `Animal_Raising_Report_${barangayName}_${report.year}`
    })
  }

  return (
    <div>
      <h4 className="mb-4">Animal Raising Report</h4>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Select Barangay</Form.Label>
                <Form.Select 
                  value={barangay} 
                  onChange={(e) => setBarangay(e.target.value)}
                  disabled={!isAdmin}
                >
                  <option value="">-- Select a Barangay --</option>
                  {BARANGAYS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Form.Select>
                {!isAdmin && (
                  <Form.Text className="text-muted">
                    Showing records for your barangay: <strong>{userBarangay}</strong>
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading records...</p>
        </div>
      )}

      {!loading && error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && report && barangay && (
        <Card className="border-0 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <img 
                  src={nutritionLogo} 
                  alt="Nutrition Logo" 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '2px solid #198754'
                  }} 
                />
                <span className="text-muted">Animal Raising Report</span>
              </div>
              <Button variant="success" onClick={handleExportDocx}>
                <i className="bi bi-file-earmark-word-fill me-2"></i>Export Word
              </Button>
            </div>

            <div className="text-center mb-4">
              <h5 className="text-uppercase fw-bold mb-1">
                CONSOLIDATED REPORT ON HOUSEHOLD ANIMAL RAISING {report.year}
              </h5>
              <p className="mb-0"><strong>BARANGAY:</strong> {barangay.toUpperCase()}</p>
              <p className="mb-0"><strong>DATE:</strong> {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}</p>
              <p className="mb-0"><strong>TOTAL HOUSEHOLD:</strong> {report.total.households}</p>
            </div>

            <Table bordered responsive className="mb-4" size="sm">
              <thead>
                <tr className="text-center">
                  <th rowSpan="2">PUROK</th>
                  <th colSpan="2">Chicken</th>
                  <th colSpan="2">Pig</th>
                  <th colSpan="2">Goat</th>
                  <th colSpan="2">Cow</th>
                  <th colSpan="2">Carabao</th>
                  <th colSpan="2">Other</th>
                  <th rowSpan="2">Signature</th>
                </tr>
                <tr className="text-center">
                  <th>M</th><th>F</th>
                  <th>M</th><th>F</th>
                  <th>M</th><th>F</th>
                  <th>M</th><th>F</th>
                  <th>M</th><th>F</th>
                  <th>M</th><th>F</th>
                </tr>
              </thead>
              <tbody>
                {report.purokReports.map((p) => (
                  <tr key={p.purok}>
                    <td>{p.purok}</td>
                    <td>{p.chickenMale || 0}</td>
                    <td>{p.chickenFemale || 0}</td>
                    <td>{p.pigMale || 0}</td>
                    <td>{p.pigFemale || 0}</td>
                    <td>{p.goatMale || 0}</td>
                    <td>{p.goatFemale || 0}</td>
                    <td>{p.cowMale || 0}</td>
                    <td>{p.cowFemale || 0}</td>
                    <td>{p.carabaoMale || 0}</td>
                    <td>{p.carabaoFemale || 0}</td>
                    <td>{p.otherMale || 0}</td>
                    <td>{p.otherFemale || 0}</td>
                    <td></td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td>TOTAL</td>
                  <td>{report.total.chickenMale || 0}</td>
                  <td>{report.total.chickenFemale || 0}</td>
                  <td>{report.total.pigMale || 0}</td>
                  <td>{report.total.pigFemale || 0}</td>
                  <td>{report.total.goatMale || 0}</td>
                  <td>{report.total.goatFemale || 0}</td>
                  <td>{report.total.cowMale || 0}</td>
                  <td>{report.total.cowFemale || 0}</td>
                  <td>{report.total.carabaoMale || 0}</td>
                  <td>{report.total.carabaoFemale || 0}</td>
                  <td>{report.total.otherMale || 0}</td>
                  <td>{report.total.otherFemale || 0}</td>
                  <td></td>
                </tr>
              </tbody>
            </Table>

            <Row className="mt-3">
              <Col md={6}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <img 
                    src={nutritionLogo} 
                    alt="Logo" 
                    style={{ 
                      width: '25px', 
                      height: '25px', 
                      objectFit: 'cover',
                      borderRadius: '50%',
                      border: '1px solid #198754'
                    }} 
                  />
                  <strong>CERTIFIED CORRECT:</strong>
                </div>
                <Row>
                  <Col md={6}>
                    <Form.Control
                      type="text"
                      placeholder="Name"
                      value={certifiedName}
                      onChange={(e) => setCertifiedName(e.target.value)}
                      size="sm"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Control
                      type="text"
                      placeholder="Position"
                      value={certifiedPosition}
                      onChange={(e) => setCertifiedPosition(e.target.value)}
                      size="sm"
                    />
                  </Col>
                </Row>
              </Col>
              <Col md={6}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <img 
                    src={nutritionLogo} 
                    alt="Logo" 
                    style={{ 
                      width: '25px', 
                      height: '25px', 
                      objectFit: 'cover',
                      borderRadius: '50%',
                      border: '1px solid #198754'
                    }} 
                  />
                  <strong>APPROVED BY:</strong>
                </div>
                <Row>
                  <Col md={6}>
                    <Form.Control
                      type="text"
                      placeholder="Name"
                      value={approvedName}
                      onChange={(e) => setApprovedName(e.target.value)}
                      size="sm"
                    />
                  </Col>
                  <Col md={6}>
                    <Form.Control
                      type="text"
                      placeholder="Position"
                      value={approvedPosition}
                      onChange={(e) => setApprovedPosition(e.target.value)}
                      size="sm"
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </div>
  )
}

export default AnimalRaisingReport