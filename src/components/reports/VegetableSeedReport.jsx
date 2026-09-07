import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { vegetableSeedApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { Card, Form, Button, Alert, Table, Row, Col, Spinner } from 'react-bootstrap'
import { exportReportToDocx } from '../../utils/docxExport'
import nutritionLogo from '../../assets/nutritionlogo.jpg'

const VegetableSeedReport = () => {
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
  
  const [selectedSeed1, setSelectedSeed1] = useState('')
  const [selectedSeed2, setSelectedSeed2] = useState('')
  const [selectedSeed3, setSelectedSeed3] = useState('')
  
  const [certifiedName, setCertifiedName] = useState('')
  const [certifiedPosition, setCertifiedPosition] = useState('BNS')
  const [approvedName, setApprovedName] = useState('')
  const [approvedPosition, setApprovedPosition] = useState('BRGY. CAPTAIN')

  const getAllSeedTypes = () => {
    const seedSet = new Set()
    records.forEach(record => {
      if (record.seedTypes) {
        try {
          const seeds = typeof record.seedTypes === 'string' ? JSON.parse(record.seedTypes) : record.seedTypes
          seeds.forEach(s => {
            if (s.type) seedSet.add(s.type)
          })
        } catch (e) {}
      }
    })
    return Array.from(seedSet).sort()
  }

  const seedOptions = getAllSeedTypes()

  useEffect(() => {
    if (barangay) {
      fetchRecords()
    }
  }, [barangay, startDate, endDate])

  useEffect(() => {
    if (records.length > 0) {
      const allSeeds = getAllSeedTypes()
      if (allSeeds.length > 0 && !selectedSeed1) setSelectedSeed1(allSeeds[0])
      if (allSeeds.length > 1 && !selectedSeed2) setSelectedSeed2(allSeeds[1])
      if (allSeeds.length > 2 && !selectedSeed3) setSelectedSeed3(allSeeds[2])
    }
  }, [records])

  const fetchRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await vegetableSeedApi.getByBarangay(barangay, 0)
      
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
      let poorFamiliesCount = 0
      const seedCounts = {}
      
      purokRecords.forEach(r => {
        poorFamiliesCount += 1
        if (r.seedTypes) {
          try {
            const seeds = typeof r.seedTypes === 'string' ? JSON.parse(r.seedTypes) : r.seedTypes
            seeds.forEach(s => {
              if (!seedCounts[s.type]) seedCounts[s.type] = 0
              seedCounts[s.type] += s.count
            })
          } catch (e) {}
        }
      })
      
      const count1 = selectedSeed1 ? (seedCounts[selectedSeed1] || 0) : 0
      const count2 = selectedSeed2 ? (seedCounts[selectedSeed2] || 0) : 0
      const count3 = selectedSeed3 ? (seedCounts[selectedSeed3] || 0) : 0
      const subTotal = count1 + count2 + count3
      
      purokReports.push({
        purok: p,
        poorFamilies: poorFamiliesCount,
        count1: count1,
        count2: count2,
        count3: count3,
        subTotal: subTotal,
        seedTypes: seedCounts
      })
    }
    
    const total = {
      poorFamilies: purokReports.reduce((sum, p) => sum + p.poorFamilies, 0),
      count1: purokReports.reduce((sum, p) => sum + p.count1, 0),
      count2: purokReports.reduce((sum, p) => sum + p.count2, 0),
      count3: purokReports.reduce((sum, p) => sum + p.count3, 0),
      subTotal: purokReports.reduce((sum, p) => sum + p.subTotal, 0)
    }
    
    const startYear = new Date(startDate).getFullYear()
    const endYear = new Date(endDate).getFullYear()
    const yearDisplay = startYear === endYear ? startYear.toString() : `${startYear}-${endYear}`
    setReport({ 
      purokReports, 
      total, 
      barangay, 
      year: yearDisplay, 
      startDate, 
      endDate,
      selectedSeed1,
      selectedSeed2,
      selectedSeed3
    })
  }

  useEffect(() => {
    if (records.length > 0) {
      generateReport(records)
    }
  }, [selectedSeed1, selectedSeed2, selectedSeed3])

  const handleExportDocx = async () => {
    if (!report) return

    const barangayName = barangay.toUpperCase()

    const body = report.purokReports.map((p) => [
      p.purok,
      p.poorFamilies || 0,
      p.count1 || 0,
      p.count2 || 0,
      p.count3 || 0,
      p.subTotal || 0
    ])

    body.push([
      'TOTAL',
      report.total.poorFamilies || 0,
      report.total.count1 || 0,
      report.total.count2 || 0,
      report.total.count3 || 0,
      report.total.subTotal || 0
    ])

    await exportReportToDocx({
      titleLines: [
        'CONSOLIDATED REPORT ON POOR FAMILIES',
        `GIVEN VEGETABLE SEEDS CY.${report.year}`
      ],
      infoLines: [
        `BARANGAY: ${barangayName}`,
        `DATE: ${new Date(report.startDate).toLocaleDateString()} - ${new Date(report.endDate).toLocaleDateString()}`
      ],
      headers: [
        'PUROK',
        'NO. OF POOR FAMILIES',
        `NO. OF ${report.selectedSeed1 || '______'}`,
        `NO. OF ${report.selectedSeed2 || '______'}`,
        `NO. OF ${report.selectedSeed3 || '______'}`,
        'SUB-TOTAL'
      ],
      body,
      cellFontSize: 18,
      signatures: {
        left: [{ label: 'CERTIFIED CORRECT:', name: certifiedName, position: certifiedPosition }],
        right: [{ label: 'APPROVED BY:', name: approvedName, position: approvedPosition }]
      },
      fileName: `Vegetable_Seed_Report_${barangayName}_${report.year}`
    })
  }

  return (
    <div>
      <h4 className="mb-4">Vegetable Seed Report</h4>

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
          
          <Row className="mt-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Seed Type 1</Form.Label>
                <Form.Select 
                  value={selectedSeed1} 
                  onChange={(e) => setSelectedSeed1(e.target.value)}
                >
                  <option value="">Select Seed Type</option>
                  {seedOptions.map((seed) => (
                    <option key={seed} value={seed}>{seed}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Seed Type 2</Form.Label>
                <Form.Select 
                  value={selectedSeed2} 
                  onChange={(e) => setSelectedSeed2(e.target.value)}
                >
                  <option value="">Select Seed Type</option>
                  {seedOptions.map((seed) => (
                    <option key={seed} value={seed}>{seed}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Seed Type 3</Form.Label>
                <Form.Select 
                  value={selectedSeed3} 
                  onChange={(e) => setSelectedSeed3(e.target.value)}
                >
                  <option value="">Select Seed Type</option>
                  {seedOptions.map((seed) => (
                    <option key={seed} value={seed}>{seed}</option>
                  ))}
                </Form.Select>
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
                <span className="text-muted">Vegetable Seed Report</span>
              </div>
              <Button variant="success" onClick={handleExportDocx}>
                <i className="bi bi-file-earmark-word-fill me-2"></i>Export Word
              </Button>
            </div>

            <div className="text-center mb-4">
              <h5 className="text-uppercase fw-bold mb-1">
                CONSOLIDATED REPORT ON POOR FAMILIES GIVEN VEGETABLE SEEDS CY.{report.year}
              </h5>
              <p className="mb-0"><strong>BARANGAY:</strong> {barangay.toUpperCase()}</p>
              <p className="mb-0"><strong>DATE:</strong> {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}</p>
            </div>

            <Table bordered responsive className="mb-4">
              <thead>
                <tr className="text-center">
                  <th style={{ width: '8%' }}>PUROK</th>
                  <th style={{ width: '15%' }}>NO. OF POOR FAMILIES</th>
                  <th style={{ width: '15%' }}>NO. OF {report.selectedSeed1 || '______'}</th>
                  <th style={{ width: '15%' }}>NO. OF {report.selectedSeed2 || '______'}</th>
                  <th style={{ width: '15%' }}>NO. OF {report.selectedSeed3 || '______'}</th>
                  <th style={{ width: '10%' }}>SUB-TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {report.purokReports.map((p) => (
                  <tr key={p.purok}>
                    <td>{p.purok}</td>
                    <td className="text-center">{p.poorFamilies || 0}</td>
                    <td className="text-center">{p.count1 || 0}</td>
                    <td className="text-center">{p.count2 || 0}</td>
                    <td className="text-center">{p.count3 || 0}</td>
                    <td className="text-center">{p.subTotal || 0}</td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td>TOTAL</td>
                  <td className="text-center">{report.total.poorFamilies || 0}</td>
                  <td className="text-center">{report.total.count1 || 0}</td>
                  <td className="text-center">{report.total.count2 || 0}</td>
                  <td className="text-center">{report.total.count3 || 0}</td>
                  <td className="text-center">{report.total.subTotal || 0}</td>
                </tr>
              </tbody>
            </Table>

            <Row className="mt-4">
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

export default VegetableSeedReport