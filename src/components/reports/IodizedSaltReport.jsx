import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { iodizedSaltApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col, Spinner } from 'react-bootstrap'
import { exportReportToDocx } from '../../utils/docxExport'
import nutritionLogo from '../../assets/nutritionlogo.jpg'

const IodizedSaltReport = () => {
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
  const [certifiedPosition, setCertifiedPosition] = useState('BHW')
  const [notedName, setNotedName] = useState('')
  const [notedPosition, setNotedPosition] = useState('BNAO')
  const [approvedName, setApprovedName] = useState('')
  const [approvedPosition, setApprovedPosition] = useState('BNC CHAIRMAN')

  useEffect(() => {
    if (barangay) {
      fetchRecords()
    }
  }, [barangay, startDate, endDate])

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await iodizedSaltApi.getByBarangay(barangay)
      
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
      
      // Count stores with each type
      const fineSaltCount = purokRecords.filter(r => 
        r.fineSaltFidel || r.fineSaltUFC || r.fineSaltPacificBay || r.fineSaltOthers
      ).length
      
      const rockSaltCount = purokRecords.filter(r => 
        r.rockSaltAtlantic || r.rockSaltFidel || r.rockSaltLasap || 
        r.rockSaltPagAsa || r.rockSaltJay || r.rockSaltOthers
      ).length
      
      const oilCount = purokRecords.filter(r => 
        r.oilUFC || r.oilJolly || r.oilOthers
      ).length
      
      purokReports.push({
        purok: p,
        totalStores: purokRecords.length,
        fineSalt: fineSaltCount,
        rockSalt: rockSaltCount,
        oil: oilCount
      })
    }
    
    const total = {
      totalStores: purokReports.reduce((sum, p) => sum + p.totalStores, 0),
      fineSalt: purokReports.reduce((sum, p) => sum + p.fineSalt, 0),
      rockSalt: purokReports.reduce((sum, p) => sum + p.rockSalt, 0),
      oil: purokReports.reduce((sum, p) => sum + p.oil, 0)
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
      p.totalStores || 0,
      p.fineSalt || 0,
      p.rockSalt || 0,
      p.oil || 0
    ])

    body.push([
      'TOTAL',
      report.total.totalStores || 0,
      report.total.fineSalt || 0,
      report.total.rockSalt || 0,
      report.total.oil || 0
    ])

    await exportReportToDocx({
      titleLines: [
        'CONSOLIDATED REPORT ON SARI-SARI STORES',
        '(RETAIL) SELLING IODIZED SALT'
      ],
      infoLines: [
        `BARANGAY: ${barangayName}`,
        `DATE: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`
      ],
      headers: ['PUROK', 'TOTAL STORES', 'FINE SALT', 'ROCK SALT', 'COOKING OIL'],
      body,
      signatures: {
        left: [
          { label: 'Prepared by:', name: certifiedName, position: certifiedPosition },
          { label: 'Noted by:', name: notedName, position: notedPosition }
        ],
        right: [
          { label: 'Approved by:', name: approvedName, position: approvedPosition }
        ]
      },
      fileName: `Iodized_Salt_Report_${barangayName}_${report.year}`
    })
  }

  return (
    <div>
      <h4 className="mb-4">Iodized Salt Stores Report</h4>

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
                <span className="text-muted">Iodized Salt Stores</span>
              </div>
              <Button variant="success" onClick={handleExportDocx}>
                <i className="bi bi-file-earmark-word-fill me-2"></i>Export Word
              </Button>
            </div>

            <div className="text-center mb-4">
              <h5 className="text-uppercase fw-bold mb-1">
                CONSOLIDATED REPORT ON SARI-SARI STORES (RETAIL) SELLING IODIZED SALT
              </h5>
              <p className="mb-0"><strong>BARANGAY:</strong> {barangay.toUpperCase()}</p>
              <p className="mb-0"><strong>DATE:</strong> {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}</p>
            </div>

            <Table bordered responsive className="mb-4">
              <thead>
                <tr className="text-center">
                  <th style={{ width: '12%' }}>PUROK</th>
                  <th style={{ width: '18%' }}>TOTAL STORES</th>
                  <th style={{ width: '18%' }}>FINE SALT</th>
                  <th style={{ width: '18%' }}>ROCK SALT</th>
                  <th style={{ width: '18%' }}>COOKING OIL</th>
                </tr>
              </thead>
              <tbody>
                {report.purokReports.map((p) => (
                  <tr key={p.purok}>
                    <td>{p.purok}</td>
                    <td className="text-center">{p.totalStores || 0}</td>
                    <td className="text-center">{p.fineSalt || 0}</td>
                    <td className="text-center">{p.rockSalt || 0}</td>
                    <td className="text-center">{p.oil || 0}</td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td>TOTAL</td>
                  <td className="text-center">{report.total.totalStores || 0}</td>
                  <td className="text-center">{report.total.fineSalt || 0}</td>
                  <td className="text-center">{report.total.rockSalt || 0}</td>
                  <td className="text-center">{report.total.oil || 0}</td>
                </tr>
              </tbody>
            </Table>

            <Row className="mt-3">
              <Col md={4}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <img 
                    src={nutritionLogo} 
                    alt="Logo" 
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      objectFit: 'cover',
                      borderRadius: '50%',
                      border: '1px solid #198754'
                    }} 
                  />
                  <strong>Prepared by:</strong>
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
              <Col md={4}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <img 
                    src={nutritionLogo} 
                    alt="Logo" 
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      objectFit: 'cover',
                      borderRadius: '50%',
                      border: '1px solid #198754'
                    }} 
                  />
                  <strong>Noted by:</strong>
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
              <Col md={4}>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <img 
                    src={nutritionLogo} 
                    alt="Logo" 
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      objectFit: 'cover',
                      borderRadius: '50%',
                      border: '1px solid #198754'
                    }} 
                  />
                  <strong>Approved by:</strong>
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

export default IodizedSaltReport