
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { iodizedSaltApi } from '../../api/reports'
import { BARANGAYS } from '../../utils/constants'
import { useStaffDataEntry } from './StaffDataEntryContext'
import DataEntryDropdown from './DataEntryDropdown'
import NameSuggestionField from './NameSuggestionField'
import { GuideToggle, GuidePanel } from './InputGuide'
import './css/recordTable.css'
import LoadingOverlay from '../common/LoadingOverlay'
import { Card, Form, Button, Alert, Table, Row, Col, Pagination } from 'react-bootstrap'
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa'

const IodizedSaltEntry = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const { selectedBarangay, setSelectedBarangay, searchTerm, setSearchTerm, recordDate, setRecordDate, purok, setPurok, name, setName, selectMode, setSelectMode } = useStaffDataEntry()
  const [formData, setFormData] = useState({
    barangay: user?.barangay || '',
    purok: purok,
    storeName: name,
    fineSaltFidel: false,
    fineSaltUFC: false,
    fineSaltPacificBay: false,
    fineSaltOthers: '',
    rockSaltAtlantic: false,
    rockSaltFidel: false,
    rockSaltLasap: false,
    rockSaltPagAsa: false,
    rockSaltJay: false,
    rockSaltOthers: '',
    oilUFC: false,
    oilJolly: false,
    oilOthers: '',
    recordedDate: recordDate,
    recordedBy: user?.username || ''
  })
  const [records, setRecords] = useState([])
  const [showGuide, setShowGuide] = useState(false)
  const [filteredRecords, setFilteredRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [busyMessage, setBusyMessage] = useState('')
  const formCardRef = useRef(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(15)

  // Search and Filter state
  const [filters, setFilters] = useState({
    purok: '',
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [batchDeleting, setBatchDeleting] = useState(false)

  useEffect(() => {
    if (!selectMode) {
      setSelectedIds([])
    }
  }, [selectMode])

  useEffect(() => {
    if (selectedBarangay) {
      fetchRecords()
    }
  }, [selectedBarangay])

  useEffect(() => {
    applyFiltersAndSearch()
  }, [searchTerm, records, filters])

  useEffect(() => {
    setSelectedIds(prev => prev.filter(id => filteredRecords.some(r => r.id === id)))
  }, [filteredRecords])

  const fetchRecords = async () => {
    setLoading(true)
    setBusyMessage('Loading records...')
    try {
      const data = await iodizedSaltApi.getByBarangay(selectedBarangay)
      setRecords(data)
      setFilteredRecords(data)
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
      setBusyMessage('')
    }
  }

  const applyFiltersAndSearch = () => {
    let filtered = [...records]

    // Search by store name only
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(record =>
        record.storeName?.toLowerCase().includes(search)
      )
    }

    // Apply filters
    if (filters.purok) {
      filtered = filtered.filter(record => record.purok === parseInt(filters.purok))
    }

    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(record => {
        const recDate = record.recordedDate ? String(record.recordedDate).split('T')[0] : ''
        if (!recDate) return false
        if (filters.startDate && recDate < filters.startDate) return false
        if (filters.endDate && recDate > filters.endDate) return false
        return true
      })
    }

    filtered.sort((a, b) => {
      if (a.purok !== b.purok) return a.purok - b.purok
      const nameCompare = (a.storeName || '').localeCompare(b.storeName || '')
      if (nameCompare !== 0) return nameCompare
      return new Date(b.recordedDate) - new Date(a.recordedDate)
    })

    setFilteredRecords(filtered)
    setCurrentPage(1)
  }

  // Get current records for pagination
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber)

  // Next/Previous page
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value)
    setRecordsPerPage(newSize)
    setCurrentPage(1)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    setBusyMessage(editingId ? 'Updating...' : 'Saving...')

    try {
      const data = {
        ...formData,
        purok: parseInt(formData.purok),
        recordedDate: recordDate
      }

      if (editingId) {
        await iodizedSaltApi.update(editingId, data)
        setSuccess('Record updated successfully!')
      } else {
        await iodizedSaltApi.create(data)
        setSuccess('Record saved successfully!')
      }

      setFormData({
        barangay: user?.barangay || '',
        purok: purok,
        storeName: name,
        fineSaltFidel: false,
        fineSaltUFC: false,
        fineSaltPacificBay: false,
        fineSaltOthers: '',
        rockSaltAtlantic: false,
        rockSaltFidel: false,
        rockSaltLasap: false,
        rockSaltPagAsa: false,
        rockSaltJay: false,
        rockSaltOthers: '',
        oilUFC: false,
        oilJolly: false,
        oilOthers: '',
        recordedDate: new Date().toISOString().split('T')[0],
        recordedBy: user?.username || ''
      })
      setEditingId(null)
      setRecordDate(new Date().toISOString().split('T')[0])
      fetchRecords()
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Error saving record'
      setError(errorMsg)
    } finally {
      setLoading(false)
      setBusyMessage('')
    }
  }

  const handleEdit = (record) => {
    const formattedDate = record.recordedDate ? record.recordedDate.split('T')[0] : new Date().toISOString().split('T')[0]

    setFormData({
      barangay: record.barangay,
      purok: record.purok,
      storeName: record.storeName || '',
      fineSaltFidel: record.fineSaltFidel,
      fineSaltUFC: record.fineSaltUFC,
      fineSaltPacificBay: record.fineSaltPacificBay,
      fineSaltOthers: record.fineSaltOthers || '',
      rockSaltAtlantic: record.rockSaltAtlantic,
      rockSaltFidel: record.rockSaltFidel,
      rockSaltLasap: record.rockSaltLasap,
      rockSaltPagAsa: record.rockSaltPagAsa,
      rockSaltJay: record.rockSaltJay,
      rockSaltOthers: record.rockSaltOthers || '',
      oilUFC: record.oilUFC,
      oilJolly: record.oilJolly,
      oilOthers: record.oilOthers || '',
      recordedDate: formattedDate,
      recordedBy: record.recordedBy || user?.username || ''
    })
    setPurok(record.purok)
    setName(record.storeName || '')
    setRecordDate(formattedDate)
    setEditingId(record.id)
    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    setDeleting(true)
    try {
      await iodizedSaltApi.delete(id)
      fetchRecords()
    } catch (error) {
      alert('Error deleting record')
    } finally {
      setDeleting(false)
    }
  }

  const handleSelectRecord = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredRecords.map(r => r.id))
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected record(s)?`)) return
    setBatchDeleting(true)
    try {
      await iodizedSaltApi.deleteMany(selectedIds)
      setSelectedIds([])
      fetchRecords()
    } catch (error) {
      alert('Error deleting records')
    } finally {
      setBatchDeleting(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  const clearFilters = () => {
    setFilters({
      purok: '',
      startDate: '',
      endDate: '',
    })
    setSearchTerm('')
    setShowFilters(false)
  }

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value })
  }

  // Render pagination items
  const renderPagination = () => {
    let items = []
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => paginate(1)}>
          1
        </Pagination.Item>
      )
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />)
      }
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => paginate(number)}
        >
          {number}
        </Pagination.Item>
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" />)
      }
      items.push(
        <Pagination.Item key={totalPages} onClick={() => paginate(totalPages)}>
          {totalPages}
        </Pagination.Item>
      )
    }

    return items
  }

  const pageSizeOptions = [5, 10, 15, 25, 50, 100]

  return (
    <div>
      <LoadingOverlay show={loading || deleting} message={deleting ? 'Deleting...' : busyMessage} />
      <h4 className="mb-4">Sari-Sari Stores Selling Iodized Salt</h4>

      <Row className="mb-3">
        <Col md={4}>
          <DataEntryDropdown />
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Barangay</Form.Label>
            <Form.Select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              disabled={!isAdmin}
            >
              <option value="">Select Barangay</option>
              {BARANGAYS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Card className="mb-4" ref={formCardRef}>
        <Card.Header className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">{editingId ? 'Edit' : 'New'} Store Entry</h6>
          <GuideToggle open={showGuide} onClick={() => setShowGuide(!showGuide)} />
        </Card.Header>
        <Card.Body>
          {/* Input guide */}
          <GuidePanel open={showGuide}>
            <strong>Iodized Salt Survey</strong>
            <ul className="mb-0 ps-3">
              <li><strong>Purok</strong> and <strong>Record Date</strong> (top control) are required; enter the <strong>Store Name</strong> being surveyed.</li>
              <li>Tick <strong>only the brands actually present/available in the store</strong> at the time of visit:</li>
              <li><strong>Fine Iodized Salt</strong>: Fidel, UFC, Pacific Bay, or type other brands under Others.</li>
              <li><strong>Rock Salt (Coarse)</strong>: Atlantic, Fidel, Lasap, Pag-Asa, Jay, or Others.</li>
              <li><strong>Fortified Cooking Oil</strong>: UFC, Jolly, or Others.</li>
            </ul>
          </GuidePanel>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}


          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Purok</Form.Label>
                  <Form.Select
                    value={formData.purok}
                    onChange={(e) => {
                      setFormData({ ...formData, purok: e.target.value })
                      setPurok(e.target.value)
                    }}
                    required
                  >
                    <option value="">Select Purok</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <option key={p} value={p}>Purok {p}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <NameSuggestionField
                  label="Store Name"
                  value={formData.storeName}
                  onChange={(value) => {
                    setFormData({ ...formData, storeName: value })
                    setName(value)
                  }}
                  suggestions={records.map((r) => r.storeName).filter(Boolean)}
                  placeholder="Enter store name"
                />
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Record Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-3 mb-3">Fine Iodized Salt</h6>
            <Row className="mb-3">
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Fidel"
                  checked={formData.fineSaltFidel}
                  onChange={(e) => setFormData({ ...formData, fineSaltFidel: e.target.checked })}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="UFC"
                  checked={formData.fineSaltUFC}
                  onChange={(e) => setFormData({ ...formData, fineSaltUFC: e.target.checked })}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Pacific Bay"
                  checked={formData.fineSaltPacificBay}
                  onChange={(e) => setFormData({ ...formData, fineSaltPacificBay: e.target.checked })}
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  type="text"
                  placeholder="Others"
                  value={formData.fineSaltOthers}
                  onChange={(e) => setFormData({ ...formData, fineSaltOthers: e.target.value })}
                />
              </Col>
            </Row>

            <h6 className="mt-3 mb-3">Rock Salt (Coarse) Iodized Salt</h6>
            <Row className="mb-3">
              <Col md={2}>
                <Form.Check
                  type="checkbox"
                  label="Atlantic"
                  checked={formData.rockSaltAtlantic}
                  onChange={(e) => setFormData({ ...formData, rockSaltAtlantic: e.target.checked })}
                />
              </Col>
              <Col md={2}>
                <Form.Check
                  type="checkbox"
                  label="Fidel"
                  checked={formData.rockSaltFidel}
                  onChange={(e) => setFormData({ ...formData, rockSaltFidel: e.target.checked })}
                />
              </Col>
              <Col md={2}>
                <Form.Check
                  type="checkbox"
                  label="Lasap"
                  checked={formData.rockSaltLasap}
                  onChange={(e) => setFormData({ ...formData, rockSaltLasap: e.target.checked })}
                />
              </Col>
              <Col md={2}>
                <Form.Check
                  type="checkbox"
                  label="Pag-Asa"
                  checked={formData.rockSaltPagAsa}
                  onChange={(e) => setFormData({ ...formData, rockSaltPagAsa: e.target.checked })}
                />
              </Col>
              <Col md={2}>
                <Form.Check
                  type="checkbox"
                  label="Jay"
                  checked={formData.rockSaltJay}
                  onChange={(e) => setFormData({ ...formData, rockSaltJay: e.target.checked })}
                />
              </Col>
              <Col md={2}>
                <Form.Control
                  type="text"
                  placeholder="Others"
                  value={formData.rockSaltOthers}
                  onChange={(e) => setFormData({ ...formData, rockSaltOthers: e.target.value })}
                />
              </Col>
            </Row>

            <h6 className="mt-3 mb-3">Fortified Cooking Oil</h6>
            <Row className="mb-3">
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="UFC"
                  checked={formData.oilUFC}
                  onChange={(e) => setFormData({ ...formData, oilUFC: e.target.checked })}
                />
              </Col>
              <Col md={3}>
                <Form.Check
                  type="checkbox"
                  label="Jolly"
                  checked={formData.oilJolly}
                  onChange={(e) => setFormData({ ...formData, oilJolly: e.target.checked })}
                />
              </Col>
              <Col md={6}>
                <Form.Control
                  type="text"
                  placeholder="Others"
                  value={formData.oilOthers}
                  onChange={(e) => setFormData({ ...formData, oilOthers: e.target.value })}
                />
              </Col>
            </Row>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : (editingId ? 'Update' : 'Save')}
            </Button>
            {editingId && (
              <Button variant="secondary" className="ms-2" onClick={() => {
                setEditingId(null)
                setFormData({
                  barangay: user?.barangay || '',
                  purok: purok,
                  storeName: name,
                  fineSaltFidel: false,
                  fineSaltUFC: false,
                  fineSaltPacificBay: false,
                  fineSaltOthers: '',
                  rockSaltAtlantic: false,
                  rockSaltFidel: false,
                  rockSaltLasap: false,
                  rockSaltPagAsa: false,
                  rockSaltJay: false,
                  rockSaltOthers: '',
                  oilUFC: false,
                  oilJolly: false,
                  oilOthers: '',
                  recordedDate: new Date().toISOString().split('T')[0],
                  recordedBy: user?.username || ''
                })
                setRecordDate(new Date().toISOString().split('T')[0])
              }}>
                Cancel
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col>
              <h6 className="mb-0 d-inline">Records ({filteredRecords.length} total)</h6>
              {selectedIds.length > 0 && (
                <>
                  <Button variant="danger" size="sm" className="ms-2" onClick={handleBatchDelete} disabled={batchDeleting}>
                    {batchDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="ms-2"
                    onClick={() => {
                      setSelectedIds([])
                      setSelectMode(false)
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </Col>
            <Col md={6}>
              <div className="d-flex align-items-center gap-2">
                <div className="position-relative w-100">
                  <Form.Control
                    type="text"
                    placeholder="Search by store name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pe-5"
                  />
                  {searchTerm && (
                    <Button
                      variant="link"
                      className="position-absolute end-0 top-50 translate-middle-y text-decoration-none p-0 me-2"
                      onClick={clearSearch}
                      style={{ color: '#6c757d' }}
                    >
                      <FaTimes />
                    </Button>
                  )}
                </div>
                <Button
                  variant={showFilters ? "primary" : "outline-secondary"}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter /> Filters
                </Button>
                {(searchTerm || Object.values(filters).some(v => v)) && (
                  <Button variant="danger" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Header>

        {/* Filter Section */}
        {showFilters && (
          <Card.Body className="bg-light border-bottom">
            <Row>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Purok</Form.Label>
                  <Form.Select
                    value={filters.purok}
                    onChange={(e) => handleFilterChange('purok', e.target.value)}
                  >
                    <option value="">All Puroks</option>
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                      <option key={p} value={p}>Purok {p}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        )}

        <Card.Body className="p-0">
          <Table responsive hover className="record-table mb-0" size="sm">
            <thead>
              <tr>
                <th className="record-check-head">
                  <Form.Check
                    type="checkbox"
                    checked={filteredRecords.length > 0 && selectedIds.length === filteredRecords.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>#</th>
                <th>Purok</th>
                <th>Store Name</th>
                <th>Fine Salt</th>
                <th>Rock Salt</th>
                <th>Oil</th>
                <th>Recorded Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-3 text-muted">
                    {searchTerm || Object.values(filters).some(v => v)
                      ? 'No records found matching your filters'
                      : 'No records found'}
                  </td>
                </tr>
              ) : (
                currentRecords.map((record, index) => (
                  <tr key={record.id} onClick={() => handleSelectRecord(record.id)} style={{ cursor: 'pointer' }} className={selectedIds.includes(record.id) ? 'record-selected' : ''}>
                    <td className="record-check-cell">
                      <Form.Check
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={(e) => { e.stopPropagation(); handleSelectRecord(record.id) }}
                      />
                    </td>
                    <td>{indexOfFirstRecord + index + 1}</td>
                    <td>Purok {record.purok}</td>
                    <td>{record.storeName}</td>
                    <td>
                      {record.fineSaltFidel && 'Fidel '}
                      {record.fineSaltUFC && 'UFC '}
                      {record.fineSaltPacificBay && 'Pacific Bay '}
                      {record.fineSaltOthers}
                    </td>
                    <td>
                      {record.rockSaltAtlantic && 'Atlantic '}
                      {record.rockSaltFidel && 'Fidel '}
                      {record.rockSaltLasap && 'Lasap '}
                      {record.rockSaltPagAsa && 'Pag-Asa '}
                      {record.rockSaltJay && 'Jay '}
                      {record.rockSaltOthers}
                    </td>
                    <td>
                      {record.oilUFC && 'UFC '}
                      {record.oilJolly && 'Jolly '}
                      {record.oilOthers}
                    </td>
                    <td>{record.recordedDate ? new Date(record.recordedDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <Button variant="outline-primary" size="sm" className="action-btn action-edit" onClick={(e) => { e.stopPropagation(); handleEdit(record) }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                      </Button>
                      <Button variant="outline-danger" size="sm" className="action-btn action-delete ms-1" onClick={(e) => { e.stopPropagation(); handleDelete(record.id) }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>

        {/* Pagination Footer */}
        {filteredRecords.length > 0 && (
          <Card.Footer>
            <Row className="align-items-center">
              <Col md={4} className="text-muted">
                Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredRecords.length)} of {filteredRecords.length} records
              </Col>
              <Col md={4} className="d-flex justify-content-center">
                <Pagination className="mb-0">
                  <Pagination.Prev
                    onClick={prevPage}
                    disabled={currentPage === 1}
                  />
                  {renderPagination()}
                  <Pagination.Next
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </Col>
              <Col md={4} className="d-flex justify-content-end align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: '14px' }}>Rows per page:</span>
                <Form.Select
                  value={recordsPerPage}
                  onChange={handlePageSizeChange}
                  style={{ width: '80px', display: 'inline-block' }}
                  size="sm"
                >
                  {pageSizeOptions.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Card.Footer>
        )}
      </Card>
    </div>
  )
}

export default IodizedSaltEntry
