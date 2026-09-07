// pages/AllRecords.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { 
  animalRaisingApi, 
  potableWaterApi, 
  iodizedSaltApi, 
  crApi, 
  backyardGardeningApi, 
  pregnantWomenApi, 
  vegetableSeedApi, 
  animalDispersalApi 
} from '../api/reports'
import { Card, Form, Button, Alert, Table, Row, Col, Pagination, Badge, Spinner, InputGroup } from 'react-bootstrap'
import { 
  FaSearch, 
  FaTimes, 
  FaFileWord, 
  FaSync, 
  FaDatabase,
  FaPiggyBank,
  FaWater,
  FaStore,
  FaFileAlt,
  FaSeedling,
  FaUserMd,
  FaLeaf,
  FaPaw
} from 'react-icons/fa'
import { exportReportToDocx } from '../utils/docxExport'

const AllRecords = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBarangay, setSelectedBarangay] = useState('')
  const [records, setRecords] = useState({
    animalRaising: [],
    potableWater: [],
    iodizedSalt: [],
    cr: [],
    backyardGardening: [],
    pregnantWomen: [],
    vegetableSeed: [],
    animalDispersal: []
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(20)
  const [barangays, setBarangays] = useState([])

  useEffect(() => {
    fetchAllRecords()
  }, [])

  const fetchAllRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const [
        animalRaising,
        potableWater,
        iodizedSalt,
        cr,
        backyardGardening,
        pregnantWomen,
        vegetableSeed,
        animalDispersal
      ] = await Promise.all([
        animalRaisingApi.getAll().catch(() => []),
        potableWaterApi.getAll().catch(() => []),
        iodizedSaltApi.getAll().catch(() => []),
        crApi.getAll().catch(() => []),
        backyardGardeningApi.getAll().catch(() => []),
        pregnantWomenApi.getAll().catch(() => []),
        vegetableSeedApi.getAll().catch(() => []),
        animalDispersalApi.getAll().catch(() => [])
      ])

      const addType = (records, type) => records.map(r => ({ ...r, _type: type }))
      
      setRecords({
        animalRaising: addType(animalRaising, 'Animal Raising'),
        potableWater: addType(potableWater, 'Potable Water'),
        iodizedSalt: addType(iodizedSalt, 'Iodized Salt'),
        cr: addType(cr, 'CR'),
        backyardGardening: addType(backyardGardening, 'Backyard Gardening'),
        pregnantWomen: addType(pregnantWomen, 'Pregnant Women'),
        vegetableSeed: addType(vegetableSeed, 'Vegetable Seeds'),
        animalDispersal: addType(animalDispersal, 'Animal Dispersal')
      })

      const allBarangays = [...new Set([
        ...animalRaising.map(r => r.barangay),
        ...potableWater.map(r => r.barangay),
        ...iodizedSalt.map(r => r.barangay),
        ...cr.map(r => r.barangay),
        ...backyardGardening.map(r => r.barangay),
        ...pregnantWomen.map(r => r.barangay),
        ...vegetableSeed.map(r => r.barangay),
        ...animalDispersal.map(r => r.barangay)
      ])].filter(Boolean).sort()
      
      setBarangays(allBarangays)
    } catch (error) {
      setError('Error fetching records')
    } finally {
      setLoading(false)
    }
  }

  const getAllRecords = () => {
    let all = []
    Object.keys(records).forEach(key => {
      if (Array.isArray(records[key])) {
        all = [...all, ...records[key]]
      }
    })
    return all
  }

  const filterRecords = (recordArray) => {
    let filtered = [...recordArray]
    
    if (selectedBarangay) {
      filtered = filtered.filter(r => r.barangay === selectedBarangay)
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(r => {
        const name = r.womanName || r.householdName || r.storeName || r.fullName || ''
        const barangay = r.barangay || ''
        return name.toLowerCase().includes(search) || 
               barangay.toLowerCase().includes(search)
      })
    }
    
    return filtered
  }

  const getCurrentRecords = () => {
    let filtered = []
    
    if (activeTab === 'all') {
      filtered = filterRecords(getAllRecords())
    } else {
      filtered = filterRecords(records[activeTab] || [])
    }
    
    const indexOfLastRecord = currentPage * recordsPerPage
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
    return {
      current: filtered.slice(indexOfFirstRecord, indexOfLastRecord),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / recordsPerPage)
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      'Animal Raising': <FaPiggyBank />,
      'Potable Water': <FaWater />,
      'Iodized Salt': <FaStore />,
      'CR': <FaFileAlt />,
      'Backyard Gardening': <FaSeedling />,
      'Pregnant Women': <FaUserMd />,
      'Vegetable Seeds': <FaLeaf />,
      'Animal Dispersal': <FaPaw />
    }
    return icons[type] || <FaDatabase />
  }

  const getTypeColor = (type) => {
    const colors = {
      'Animal Raising': '#4e73df',
      'Potable Water': '#1cc88a',
      'Iodized Salt': '#f6c23e',
      'CR': '#36b9cc',
      'Backyard Gardening': '#1cc88a',
      'Pregnant Women': '#e74a3b',
      'Vegetable Seeds': '#1cc88a',
      'Animal Dispersal': '#4e73df'
    }
    return colors[type] || '#858796'
  }

  const formatSeedTypes = (seedData) => {
    if (!seedData) return '-'
    try {
      let seeds = seedData
      if (typeof seeds === 'string') {
        seeds = JSON.parse(seeds)
      }
      if (Array.isArray(seeds)) {
        const seedSummary = {}
        seeds.forEach(s => {
          if (s.type) {
            const type = s.type.charAt(0).toUpperCase() + s.type.slice(1)
            if (!seedSummary[type]) seedSummary[type] = 0
            seedSummary[type] += s.count || 1
          }
        })
        return Object.entries(seedSummary)
          .map(([type, count]) => `${type} (${count})`)
          .join(', ')
      }
      return seedData
    } catch (e) {
      return seedData
    }
  }

  const getIodizedSaltDetails = (record) => {
    const details = []
    if (record.fineSaltFidel || record.fineSaltUFC || record.fineSaltPacificBay || record.fineSaltOthers) {
      const fine = []
      if (record.fineSaltFidel) fine.push('Fidel')
      if (record.fineSaltUFC) fine.push('UFC')
      if (record.fineSaltPacificBay) fine.push('Pacific Bay')
      if (record.fineSaltOthers) fine.push(record.fineSaltOthers)
      details.push(`Fine: ${fine.join(', ')}`)
    }
    if (record.rockSaltAtlantic || record.rockSaltFidel || record.rockSaltLasap || record.rockSaltPagAsa || record.rockSaltJay || record.rockSaltOthers) {
      const rock = []
      if (record.rockSaltAtlantic) rock.push('Atlantic')
      if (record.rockSaltFidel) rock.push('Fidel')
      if (record.rockSaltLasap) rock.push('Lasap')
      if (record.rockSaltPagAsa) rock.push('Pag-Asa')
      if (record.rockSaltJay) rock.push('Jay')
      if (record.rockSaltOthers) rock.push(record.rockSaltOthers)
      details.push(`Rock: ${rock.join(', ')}`)
    }
    if (record.oilUFC || record.oilJolly || record.oilOthers) {
      const oil = []
      if (record.oilUFC) oil.push('UFC')
      if (record.oilJolly) oil.push('Jolly')
      if (record.oilOthers) oil.push(record.oilOthers)
      details.push(`Oil: ${oil.join(', ')}`)
    }
    return details.length > 0 ? details.join(' | ') : '-'
  }

  const renderRecordRow = (record, index) => {
    const typeColor = getTypeColor(record._type)

    const renderFields = (record) => {
      switch(record._type) {
        case 'Animal Raising':
        case 'Animal Dispersal':
          return (
            <div className="d-flex gap-3 flex-wrap">
              <span className="badge bg-light text-dark border">
                🐔 {record.chickenMale || 0}M / {record.chickenFemale || 0}F
              </span>
              <span className="badge bg-light text-dark border">
                🐷 {record.pigMale || 0}M / {record.pigFemale || 0}F
              </span>
              <span className="badge bg-light text-dark border">
                🐐 {record.goatMale || 0}M / {record.goatFemale || 0}F
              </span>
              {record._type === 'Animal Raising' && (
                <>
                  <span className="badge bg-light text-dark border">
                    🐄 {record.cowMale || 0}M / {record.cowFemale || 0}F
                  </span>
                  <span className="badge bg-light text-dark border">
                    🐃 {record.carabaoMale || 0}M / {record.carabaoFemale || 0}F
                  </span>
                </>
              )}
            </div>
          )
        case 'Potable Water':
          return (
            <div className="d-flex gap-2 flex-wrap">
              <Badge bg={record.level1 ? 'success' : 'danger'}>
                {record.level1 ? '✅ L1' : '❌ L1'}
              </Badge>
              <Badge bg={record.level2 ? 'success' : 'danger'}>
                {record.level2 ? '✅ L2' : '❌ L2'}
              </Badge>
              <Badge bg={record.level3 ? 'success' : 'danger'}>
                {record.level3 ? '✅ L3' : '❌ L3'}
              </Badge>
            </div>
          )
        case 'Iodized Salt':
          return (
            <div className="text-start" style={{ fontSize: '0.8rem' }}>
              {getIodizedSaltDetails(record)}
            </div>
          )
        case 'CR':
          return (
            <Badge bg={record.withCR ? 'success' : 'danger'}>
              {record.withCR ? '✅ With CR' : '❌ Without CR'}
            </Badge>
          )
        case 'Backyard Gardening':
          return (
            <Badge bg={record.hasGarden ? 'success' : 'danger'}>
              {record.hasGarden ? '🌱 Has Garden' : '❌ No Garden'}
            </Badge>
          )
        case 'Pregnant Women':
          return (
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <span className="badge bg-light text-dark border">{record.weight || '-'} kg</span>
              <span className="badge bg-light text-dark border">{record.height || '-'} cm</span>
              <Badge bg={record.bmiCategory === 'Normal BMI' || record.bmiCategory === 'Normal' ? 'success' : 
                        record.bmiCategory === 'Low BMI' || record.bmiCategory === 'Underweight' ? 'warning' : 
                        record.bmiCategory === 'High BMI' || record.bmiCategory === 'Overweight' ? 'danger' : 'secondary'}>
                {record.bmiCategory || '-'}
              </Badge>
            </div>
          )
        case 'Vegetable Seeds':
          return (
            <div className="d-flex flex-column gap-1">
              <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                {formatSeedTypes(record.seedTypes)}
              </span>
              {record.beneficiaries && (
                <span className="badge bg-success" style={{ width: 'fit-content' }}>
                  {record.beneficiaries}
                </span>
              )}
            </div>
          )
        default:
          return <span className="text-muted">-</span>
      }
    }

    const getName = (record) => {
      return record.womanName || record.householdName || record.storeName || record.fullName || '-'
    }

    return (
      <tr key={record.id || index}>
        <td className="text-center text-muted">{((currentPage - 1) * recordsPerPage) + index + 1}</td>
        <td>
          <Badge 
            style={{ backgroundColor: typeColor }} 
            className="d-flex align-items-center gap-1"
          >
            {getTypeIcon(record._type)}
            <span>{record._type}</span>
          </Badge>
        </td>
        <td>
          <span className="fw-medium">{record.barangay || '-'}</span>
        </td>
        <td className="text-center">Purok {record.purok || '-'}</td>
        <td>
          <strong>{getName(record)}</strong>
        </td>
        <td>{renderFields(record)}</td>
        <td className="text-nowrap">
          <small className="text-muted">
            {record.recordedDate ? new Date(record.recordedDate).toLocaleDateString() : 'N/A'}
          </small>
        </td>
        <td className="text-center">
          <small className="text-muted">{record.recordedBy || '-'}</small>
        </td>
      </tr>
    )
  }

  const { current, total, totalPages } = getCurrentRecords()

  const paginate = (pageNumber) => setCurrentPage(pageNumber)
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1) }
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1) }
  const handlePageSizeChange = (e) => {
    setRecordsPerPage(parseInt(e.target.value))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedBarangay('')
  }

  const handleExportDocx = async () => {
    const exportData = current.map((record, i) => {
      let details = ''
      if (record._type === 'Iodized Salt') {
        details = getIodizedSaltDetails(record)
      } else if (record._type === 'Vegetable Seeds') {
        details = record.beneficiaries ? `${record.beneficiaries} | ${formatSeedTypes(record.seedTypes)}` : formatSeedTypes(record.seedTypes)
      } else {
        details = '...'
      }
      return [
        i + 1,
        record._type || '',
        record.barangay || '',
        `Purok ${record.purok || ''}`,
        record.womanName || record.householdName || record.storeName || record.fullName || '-',
        details
      ]
    })

    await exportReportToDocx({
      titleLines: ['All Records Report'],
      infoLines: [`Generated: ${new Date().toLocaleString()}`],
      infoCenter: true,
      headers: ['#', 'Type', 'Barangay', 'Purok', 'Name', 'Details'],
      body: exportData,
      boldLastRow: false,
      cellFontSize: 16,
      orientation: 'landscape',
      signatures: { left: [], right: [] },
      fileName: 'All_Records_Report'
    })
  }

  const renderPagination = () => {
    let items = []
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    if (startPage > 1) {
      items.push(<Pagination.Item key={1} onClick={() => paginate(1)}>1</Pagination.Item>)
      if (startPage > 2) items.push(<Pagination.Ellipsis key="ellipsis1" />)
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item key={number} active={number === currentPage} onClick={() => paginate(number)}>
          {number}
        </Pagination.Item>
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) items.push(<Pagination.Ellipsis key="ellipsis2" />)
      items.push(<Pagination.Item key={totalPages} onClick={() => paginate(totalPages)}>{totalPages}</Pagination.Item>)
    }

    return items
  }

  const tabs = [
    { key: 'all', label: 'All Records', icon: <FaDatabase /> },
    { key: 'animalRaising', label: 'Animal Raising', icon: <FaPiggyBank /> },
    { key: 'potableWater', label: 'Potable Water', icon: <FaWater /> },
    { key: 'iodizedSalt', label: 'Iodized Salt', icon: <FaStore /> },
    { key: 'cr', label: 'CR', icon: <FaFileAlt /> },
    { key: 'backyardGardening', label: 'Backyard Gardening', icon: <FaSeedling /> },
    { key: 'pregnantWomen', label: 'Pregnant Women', icon: <FaUserMd /> },
    { key: 'vegetableSeed', label: 'Vegetable Seeds', icon: <FaLeaf /> },
    { key: 'animalDispersal', label: 'Animal Dispersal', icon: <FaPaw /> }
  ]

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center py-5">
        <Spinner animation="border" variant="success" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 text-muted">Loading all records...</p>
      </div>
    )
  }

  const totalRecords = getAllRecords().length

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="mb-1 d-flex align-items-center gap-2">
            <FaDatabase className="text-success" />
            All Records
          </h4>
          <p className="text-muted small mb-0">
            Total: <strong>{totalRecords}</strong> records across all report types
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <Button variant="outline-secondary" size="sm" onClick={fetchAllRecords}>
            <FaSync className="me-1" /> Refresh
          </Button>
          <Button variant="success" size="sm" onClick={handleExportDocx}>
            <FaFileWord className="me-1" /> Export Word
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      <Card className="mb-3 border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={5}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">Search</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-white">
                    <FaSearch className="text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchTerm('')}
                    >
                      <FaTimes />
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted">Barangay</Form.Label>
                <Form.Select
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value)}
                  className="bg-white"
                >
                  <option value="">All Barangays</option>
                  {barangays.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              {(searchTerm || selectedBarangay) && (
                <Button variant="outline-danger" size="sm" onClick={clearFilters} className="w-100">
                  <FaTimes className="me-1" /> Clear Filters
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div className="mb-3" style={{ overflowX: 'auto' }}>
        <div className="d-flex gap-1 flex-nowrap" style={{ minWidth: 'fit-content' }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key
            const count = tab.key === 'all' 
              ? totalRecords 
              : records[tab.key]?.length || 0
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setCurrentPage(1) }}
                className={`btn btn-sm d-flex align-items-center gap-1 px-3 py-2 border-0 ${
                  isActive 
                    ? 'btn-success text-white shadow-sm' 
                    : 'btn-light text-dark hover-bg-light'
                }`}
                style={{ 
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                  backgroundColor: isActive ? '#198754' : '#f8f9fa',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <Badge 
                  bg={isActive ? 'light' : 'secondary'} 
                  text={isActive ? 'dark' : 'white'}
                  className="ms-1"
                  style={{ fontSize: '0.65rem' }}
                >
                  {count}
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center pt-3">
          <span className="text-muted small">
            Showing <strong>{current.length}</strong> of <strong>{total}</strong> records
          </span>
          <Form.Select
            value={recordsPerPage}
            onChange={handlePageSizeChange}
            style={{ width: '80px', fontSize: '0.8rem' }}
            size="sm"
            className="bg-light"
          >
            {[5, 10, 15, 20, 25, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </Form.Select>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="bg-light">
                <tr>
                  <th className="text-center" style={{ width: '5%' }}>#</th>
                  <th style={{ width: '12%' }}>Type</th>
                  <th style={{ width: '12%' }}>Barangay</th>
                  <th className="text-center" style={{ width: '8%' }}>Purok</th>
                  <th style={{ width: '12%' }}>Name</th>
                  <th>Details</th>
                  <th style={{ width: '10%' }}>Date</th>
                  <th className="text-center" style={{ width: '10%' }}>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {current.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">
                      <FaDatabase className="mb-2" style={{ fontSize: '2rem', opacity: 0.3 }} />
                      <p className="mb-0">No records found</p>
                    </td>
                  </tr>
                ) : (
                  current.map((record, index) => renderRecordRow(record, index))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
        {total > 0 && (
          <Card.Footer className="bg-white border-0">
            <Row className="align-items-center">
              <Col md={4} className="text-muted small">
                Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, total)} of {total} records
              </Col>
              <Col md={8}>
                <div className="d-flex justify-content-end">
                  <Pagination className="mb-0" size="sm">
                    <Pagination.Prev onClick={prevPage} disabled={currentPage === 1} />
                    {renderPagination()}
                    <Pagination.Next onClick={nextPage} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              </Col>
            </Row>
          </Card.Footer>
        )}
      </Card>
    </div>
  )
}

export default AllRecords