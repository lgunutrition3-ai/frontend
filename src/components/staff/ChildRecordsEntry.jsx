import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { childRecordApi } from '../../api/auth'
import { BARANGAYS } from '../../utils/constants'
import { getWeightForAgeZScore, classifyWeightForAge } from '../../utils/whoWeightForAge'
import { getLengthForAgeZScore, classifyHeightForAge } from '../../utils/whoHeightForAge'
import { getWeightForLengthHeightZScore, classifyWeightForLengthHeight } from '../../utils/whoWeightForLengthHeight'
import { exportOptPlusExcel, getWfaStatusCode, getHfaStatusCode, getWfhStatusCode } from '../../utils/optExport'
import { useStaffDataEntry } from './StaffDataEntryContext'
import DataEntryDropdown from './DataEntryDropdown'
import NameSuggestionField from './NameSuggestionField'
import './css/recordTable.css'
import './css/inputGuide.css'
import LoadingOverlay from '../common/LoadingOverlay'
import { Card, Form, Button, Alert, Table, Row, Col, Pagination } from 'react-bootstrap'
import { FaSearch, FaTimes, FaFilter, FaFileExcel, FaInfoCircle } from 'react-icons/fa'

const CHILD_STATUS_BADGES = {
  N: 'bg-success', UW: 'bg-warning', SUW: 'bg-danger', OW: 'bg-info',
  St: 'bg-warning', SSt: 'bg-danger', T: 'bg-info',
  MW: 'bg-warning', SW: 'bg-danger', Ob: 'bg-info',
}

const ChildRecordsEntry = () => {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin'
  const userBarangay = user?.barangay || ''
  const { selectedBarangay, setSelectedBarangay, searchTerm, setSearchTerm, recordDate, setRecordDate, purok, setPurok, name, setName, selectMode, setSelectMode } = useStaffDataEntry()

  const [formData, setFormData] = useState({
    barangay: userBarangay,
    purok: purok,
    targetCategory: 'Child (0–59 months)',
    fullName: name,
    motherOrCaregiver: '',
    sex: '',
    birthdate: '',
    ageMonths: '',
    weight: '',
    height: '',
    nutritionalStatus: '',
    recordedDate: recordDate,
  })
  const [records, setRecords] = useState([])
  const [filteredRecords, setFilteredRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [busyMessage, setBusyMessage] = useState('')
  const formCardRef = useRef(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [recordsPerPage, setRecordsPerPage] = useState(15)
  
  const [filters, setFilters] = useState({
    purok: '',
    nutritionalStatus: '',
    ageMin: '',
    ageMax: '',
    weightMin: '',
    weightMax: '',
    heightMin: '',
    heightMax: '',
    startDate: '',
    endDate: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
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
    setFormData((prev) => ({ ...prev, barangay: selectedBarangay }))
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
      const data = await childRecordApi.getAll()
      const filteredData = data.filter(r => r.barangay === selectedBarangay)
      setRecords(filteredData)
      setFilteredRecords(filteredData)
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
      setBusyMessage('')
    }
  }

  const applyFiltersAndSearch = () => {
    let filtered = [...records]

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(record => 
        record.fullName.toLowerCase().includes(search)
      )
    }

    if (filters.purok) {
      filtered = filtered.filter(record => record.purok === parseInt(filters.purok))
    }

    if (filters.nutritionalStatus) {
      filtered = filtered.filter(record => record.nutritionalStatus === filters.nutritionalStatus)
    }

    if (filters.ageMin) {
      filtered = filtered.filter(record => record.ageMonths >= parseInt(filters.ageMin))
    }

    if (filters.ageMax) {
      filtered = filtered.filter(record => record.ageMonths <= parseInt(filters.ageMax))
    }

    if (filters.weightMin) {
      filtered = filtered.filter(record => record.weight >= parseFloat(filters.weightMin))
    }

    if (filters.weightMax) {
      filtered = filtered.filter(record => record.weight <= parseFloat(filters.weightMax))
    }

    if (filters.heightMin) {
      filtered = filtered.filter(record => record.height >= parseFloat(filters.heightMin))
    }

    if (filters.heightMax) {
      filtered = filtered.filter(record => record.height <= parseFloat(filters.heightMax))
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
      const nameCompare = (a.fullName || '').localeCompare(b.fullName || '')
      if (nameCompare !== 0) return nameCompare
      return new Date(b.recordedDate) - new Date(a.recordedDate)
    })

    setFilteredRecords(filtered)
    setCurrentPage(1)
  }

  const calculateAge = (birthdate, recordedDate) => {
    if (!birthdate || !recordedDate) return ''
    const birth = new Date(birthdate)
    const recorded = new Date(recordedDate)
    
    if (birth > recorded) return ''
    
    let years = recorded.getFullYear() - birth.getFullYear()
    let months = recorded.getMonth() - birth.getMonth()
    
    if (months < 0) {
      years--
      months += 12
    }
    
    const totalMonths = (years * 12) + months
    
    const birthDay = birth.getDate()
    const recordedDay = recorded.getDate()
    if (recordedDay < birthDay) {
      return totalMonths - 1
    }
    
    return totalMonths
  }

  // DHS/WHO weight-for-age Z-score classification:
  //   Normal:                 z-score >= -2.0
  //   Moderately Underweight: -3.0 <= z-score < -2.0
  //   Severely Underweight:   z-score < -3.0
  const updateNutritionalStatus = (weight, ageMonths, sex) => {
    const zScore = getWeightForAgeZScore(weight, ageMonths, sex)
    return classifyWeightForAge(zScore)
  }

  const wfaZScore = getWeightForAgeZScore(formData.weight, formData.ageMonths, formData.sex)
  const hfaZScore = getLengthForAgeZScore(formData.height, formData.ageMonths, formData.sex)
  const hfaStatus = classifyHeightForAge(hfaZScore)
  const wfhZScore = getWeightForLengthHeightZScore(formData.weight, formData.height, formData.ageMonths, formData.sex)
  const wfhStatus = classifyWeightForLengthHeight(wfhZScore)

  const missingForZ = (needsHeight) => {
    const missing = []
    if (!formData.sex) missing.push('Sex')
    if (!formData.weight) missing.push('Weight')
    if (needsHeight && !formData.height) missing.push('Height')
    return missing.length ? `Requires: ${missing.join(', ')}` : ''
  }

  const handleExportExcel = async () => {
  try {
    await exportOptPlusExcel({ barangay: selectedBarangay, records: filteredRecords })
  } catch (err) {
    console.error('Export failed:', err)
    alert(`Export failed: ${err.message}`)
  }
}

  const handleDateChange = (field, value) => {
    const updatedForm = { ...formData, [field]: value }

    if (field === 'recordedDate') {
      setRecordDate(value)
    }

    if (field === 'birthdate' || field === 'recordedDate') {
      const age = calculateAge(updatedForm.birthdate, updatedForm.recordedDate)
      if (age !== '' && age !== null && age !== undefined) {
        updatedForm.ageMonths = age.toString()
        updatedForm.nutritionalStatus = updateNutritionalStatus(updatedForm.weight, age, updatedForm.sex)
      }
    }
    
    setFormData(updatedForm)
  }

  const handleWeightChange = (e) => {
    const weight = e.target.value
    setFormData(prev => {
      const newData = { ...prev, weight }
      newData.nutritionalStatus = updateNutritionalStatus(weight, prev.ageMonths, prev.sex)
      return newData
    })
  }

  const handleSexChange = (e) => {
    const sex = e.target.value
    setFormData(prev => {
      const newData = { ...prev, sex }
      newData.nutritionalStatus = updateNutritionalStatus(prev.weight, prev.ageMonths, sex)
      return newData
    })
  }

  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord)
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)

  const paginate = (pageNumber) => setCurrentPage(pageNumber)

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

  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value)
    setRecordsPerPage(newSize)
    setCurrentPage(1)
  }

  const checkDuplicateChild = (fullName, barangay, purok, excludeId = null) => {
    return records.some(record => 
      record.fullName.toLowerCase() === fullName.toLowerCase() &&
      record.barangay === barangay &&
      record.purok === parseInt(purok) &&
      record.id !== excludeId
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    setBusyMessage(editingId ? 'Updating...' : 'Saving...')

    try {
      const ageMonths = parseInt(formData.ageMonths)
      const weight = parseFloat(formData.weight)
      const height = parseFloat(formData.height)

      if (ageMonths < 0 || ageMonths > 59) {
        setError('Age must be between 0 and 59 months')
        setLoading(false)
        return
      }

      if (!formData.sex) {
        setError('Please select sex (required for Z-score calculation)')
        setLoading(false)
        return
      }

      if (weight < 0) {
        setError('Weight cannot be negative')
        setLoading(false)
        return
      }

      if (height < 0) {
        setError('Height cannot be negative')
        setLoading(false)
        return
      }

      const isDuplicate = checkDuplicateChild(
        formData.fullName,
        formData.barangay,
        formData.purok,
        editingId || null
      )

      if (isDuplicate) {
        setError(`A child named "${formData.fullName}" already exists in ${formData.barangay}, Purok ${formData.purok}`)
        setLoading(false)
        return
      }

      const data = {
        ...formData,
        purok: parseInt(formData.purok),
        ageMonths: ageMonths,
        weight: weight,
        height: height,
        recordedDate: formData.recordedDate,
        nutritionalStatus: updateNutritionalStatus(weight, ageMonths, formData.sex)
      }

      if (editingId) {
        await childRecordApi.update(editingId, data)
        setSuccess('Record updated successfully!')
      } else {
        await childRecordApi.create(data)
        setSuccess('Record saved successfully!')
      }

      setFormData({
        barangay: userBarangay,
        purok: purok,
        targetCategory: 'Child (0–59 months)',
        fullName: name,
        motherOrCaregiver: '',
        sex: '',
        birthdate: '',
        ageMonths: '',
        weight: '',
        height: '',
        nutritionalStatus: '',
        recordedDate: new Date().toISOString().split('T')[0],
      })
      setEditingId(null)
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
    setFormData({
      barangay: record.barangay,
      purok: record.purok,
      targetCategory: record.targetCategory,
      fullName: record.fullName,
      motherOrCaregiver: record.motherOrCaregiver || '',
      sex: record.sex || '',
      birthdate: record.birthdate ? record.birthdate.split('T')[0] : '',
      ageMonths: record.ageMonths,
      weight: record.weight,
      height: record.height,
      nutritionalStatus: record.nutritionalStatus,
      recordedDate: record.recordedDate ? record.recordedDate.split('T')[0] : new Date().toISOString().split('T')[0],
    })
    setPurok(record.purok)
    setName(record.fullName || '')
    setEditingId(record.id)
    formCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this record?')) return
    setDeleting(true)
    try {
      await childRecordApi.delete(id)
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
      await childRecordApi.deleteMany(selectedIds)
      setSelectedIds([])
      fetchRecords()
    } catch (error) {
      alert('Error deleting records')
    } finally {
      setBatchDeleting(false)
    }
  }

  const handleNonNegativeInput = (e, field) => {
    const value = e.target.value
    if (value === '' || parseFloat(value) >= 0) {
      setFormData({ ...formData, [field]: value })
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  const clearFilters = () => {
    setFilters({
      purok: '',
      nutritionalStatus: '',
      ageMin: '',
      ageMax: '',
      weightMin: '',
      weightMax: '',
      heightMin: '',
      heightMax: '',
      startDate: '',
      endDate: '',
    })
    setSearchTerm('')
    setShowFilters(false)
  }

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value })
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
      <h4 className="mb-4">Child Records</h4>

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
          <h6 className="mb-0">{editingId ? 'Edit' : 'New'} Record</h6>
          <Button
            variant="link"
            size="sm"
            className="p-0 text-decoration-none"
            onClick={() => setShowGuide(!showGuide)}
          >
            <FaInfoCircle className="me-1" />
            {showGuide ? 'Hide Input Guide' : 'Input Guide'}
          </Button>
        </Card.Header>
        <Card.Body>
          {showGuide && (
            <Alert variant="info" className="small mb-3 input-guide">
              <strong>How to fill out this form</strong>
              <ul className="mb-2 ps-3">
                <li><strong>Purok / Barangay</strong> — location of the child's household.</li>
                <li><strong>Full Name &amp; Mother/Caregiver</strong> — duplicates (same child name in the same barangay and purok) are blocked.</li>
                <li><strong>Record Date</strong> — date the child was measured. <strong>Birthdate</strong> — age in months is computed automatically and must be <strong>0–59 months</strong>.</li>
                <li><strong>Sex</strong> — required. Boys and girls use different WHO growth tables, so statuses stay blank until sex is chosen.</li>
                <li><strong>Weight</strong> — in kilograms, e.g., 7.8.</li>
                <li><strong>Height</strong> — in centimeters:
                  <ul className="mb-0">
                    <li><strong>Under 2 years old</strong> (recumbent length): valid range <strong>45 – 110 cm</strong></li>
                    <li><strong>2 years and older</strong> (standing height): valid range <strong>65 – 120 cm</strong></li>
                  </ul>
                </li>
              </ul>
              <strong>Auto-computed nutritional status (WHO Z-scores)</strong>
              <div className="table-responsive">
                <Table size="sm" bordered className="mb-2 mt-1 bg-white">
                  <thead>
                    <tr><th>Indicator</th><th>Normal</th><th>Moderate</th><th>Severe</th><th>Above normal</th></tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td>Weight-for-age<br /><span className="text-muted">(underweight)</span></td>
                    <td>&ge; -2.0 SD</td>
                    <td>Moderately Underweight: -3.0 to -2.0 SD</td>
                    <td>Severely Underweight: &lt; -3.0 SD</td>
                    <td>Overweight: &gt; +2.0 SD</td>
                  </tr>
                  <tr>
                    <td>Height-for-age<br /><span className="text-muted">(stunting)</span></td>
                    <td>&ge; -2.0 SD</td>
                    <td>Moderately Stunted: -3.0 to -2.0 SD</td>
                    <td>Severely Stunted: &lt; -3.0 SD</td>
                    <td>Tall: &gt; +2.0 SD</td>
                  </tr>
                  <tr>
                    <td>Weight-for-length/height<br /><span className="text-muted">(wasting)</span></td>
                    <td>-2.0 to +2.0 SD</td>
                    <td>Moderately Wasted: -3.0 to -2.0 SD</td>
                    <td>Severely Wasted: &lt; -3.0 SD</td>
                    <td>Overweight +2 to +3; Obese &gt; +3</td>
                  </tr>
                  </tbody>
                </Table>
              </div>
              <span className="text-muted">Status codes used in the table and Excel export — WFA: N / UW / SUW / OW · HFA: N / St / SSt / T · WFH: N / MW / SW / OW / Ob</span>
            </Alert>
          )}
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
              <Col md={8}>
                <NameSuggestionField
                  label="Full Name of the Child"
                  value={formData.fullName}
                  onChange={(value) => {
                    setFormData({ ...formData, fullName: value })
                    setName(value)
                  }}
                  suggestions={records.map((r) => r.fullName).filter(Boolean)}
                  required
                  placeholder="e.g., Jotojot, Jonathan"
                />
              </Col>
            </Row>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Name of Mother or Caregiver</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.motherOrCaregiver}
                    onChange={(e) => setFormData({ ...formData, motherOrCaregiver: e.target.value })}
                    required
                    placeholder="e.g., DELA CRUZ, MARIA"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Record Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.recordedDate}
                    onChange={(e) => handleDateChange('recordedDate', e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Birthdate</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => handleDateChange('birthdate', e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    Age will be calculated automatically
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Age (Months)</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.ageMonths || 'Auto-calculated'}
                    readOnly
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Weight (KG)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={handleWeightChange}
                    required
                    placeholder="e.g., 11.5"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault()
                      }
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Height (CM)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.height}
                    onChange={(e) => handleNonNegativeInput(e, 'height')}
                    required
                    placeholder="e.g., 85.0"
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault()
                      }
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Sex</Form.Label>
                  <Form.Select
                    value={formData.sex}
                    onChange={handleSexChange}
                    required
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Nutritional Status</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.nutritionalStatus || missingForZ(false) || 'Auto-calculated'}
                    readOnly
                    disabled
                    className={
                      formData.nutritionalStatus === 'Severely Underweight' ? 'text-danger fw-bold' :
                      formData.nutritionalStatus === 'Moderately Underweight' ? 'text-warning fw-bold' :
                      formData.nutritionalStatus === 'Normal' ? 'text-success fw-bold' :
                      formData.nutritionalStatus === 'Overweight' ? 'text-info fw-bold' :
                      ''
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Weight-for-Age Z-Score</Form.Label>
                  <Form.Control
                    type="text"
                    value={wfaZScore !== null ? `${wfaZScore.toFixed(2)} SD` : (missingForZ(false) || 'Auto-calculated')}
                    readOnly
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={{ span: 4, offset: 4 }}>
                <Form.Group className="mb-3">
                  <Form.Label>Height-for-Age Status</Form.Label>
                  <Form.Control
                    type="text"
                    value={hfaStatus || missingForZ(true) || 'Auto-calculated'}
                    readOnly
                    disabled
                    className={
                      hfaStatus === 'Severely Stunted' ? 'text-danger fw-bold' :
                      hfaStatus === 'Moderately Stunted' ? 'text-warning fw-bold' :
                      hfaStatus === 'Normal' ? 'text-success fw-bold' :
                      hfaStatus === 'Tall' ? 'text-info fw-bold' :
                      ''
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Height-for-Age Z-Score</Form.Label>
                  <Form.Control
                    type="text"
                    value={hfaZScore !== null ? `${hfaZScore.toFixed(2)} SD` : (missingForZ(true) || 'Auto-calculated')}
                    readOnly
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={{ span: 4, offset: 4 }}>
                <Form.Group className="mb-3">
                  <Form.Label>Weight for Length/Height Status</Form.Label>
                  <Form.Control
                    type="text"
                    value={wfhStatus || missingForZ(true) || 'Auto-calculated'}
                    readOnly
                    disabled
                    className={
                      wfhStatus === 'Severely Wasted' ? 'text-danger fw-bold' :
                      wfhStatus === 'Moderately Wasted' ? 'text-warning fw-bold' :
                      wfhStatus === 'Overweight' || wfhStatus === 'Obese' ? 'text-info fw-bold' :
                      wfhStatus === 'Normal' ? 'text-success fw-bold' :
                      ''
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Weight for Lt/Ht Z-Score</Form.Label>
                  <Form.Control
                    type="text"
                    value={
                      wfhZScore !== null ? `${wfhZScore.toFixed(2)} SD` :
                      (missingForZ(true) ||
                        (formData.height && formData.ageMonths !== '' && (
                          (() => {
                            const age = parseInt(formData.ageMonths)
                            const h = parseFloat(formData.height)
                            if (isNaN(age) || isNaN(h)) return false
                            if (age < 24) return h < 45 || h > 110
                            return h < 65 || h > 120
                          })()
                        )) ? 'Height outside measurable range' : 'Auto-calculated')
                    }
                    readOnly
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Saving...' : (editingId ? 'Update' : 'Save')}
            </Button>
            {editingId && (
              <Button variant="secondary" className="ms-2" onClick={() => {
                setEditingId(null)
                setFormData({
                  barangay: userBarangay,
                  purok: purok,
                  targetCategory: 'Child (0–59 months)',
                  fullName: name,
                  motherOrCaregiver: '',
                  sex: '',
                  birthdate: '',
                  ageMonths: '',
                  weight: '',
                  height: '',
                  nutritionalStatus: '',
                  recordedDate: new Date().toISOString().split('T')[0],
                })
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
                    placeholder="Search by name..."
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
                <Button
                  variant="outline-success"
                  onClick={handleExportExcel}
                  disabled={filteredRecords.length === 0}
                  title="Export filtered records to OPT Plus Excel format"
                >
                  <FaFileExcel /> Export Excel
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
        
        {showFilters && (
          <Card.Body className="bg-light border-bottom">
            <Row>
              <Col md={3}>
                <Form.Group className="mb-2">
                  <Form.Label>Purok</Form.Label>
                  <Form.Select
                    value={filters.purok}
                    onChange={(e) => handleFilterChange('purok', e.target.value)}
                  >
                    <option value="">All</option>
                    {[1,2,3,4,5,6,7].map((p) => (
                      <option key={p} value={p}>Purok {p}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-2">
                  <Form.Label>Nutritional Status</Form.Label>
                  <Form.Select
                    value={filters.nutritionalStatus}
                    onChange={(e) => handleFilterChange('nutritionalStatus', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="Normal">Normal</option>
                    <option value="Moderately Underweight">Moderately Underweight</option>
                    <option value="Severely Underweight">Severely Underweight</option>
                    <option value="Overweight">Overweight</option>
                    <option value="Underweight">Underweight (old records)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Age Min</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Min"
                    value={filters.ageMin}
                    onChange={(e) => handleFilterChange('ageMin', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Age Max</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Max"
                    value={filters.ageMax}
                    onChange={(e) => handleFilterChange('ageMax', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Weight Min</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Min KG"
                    value={filters.weightMin}
                    onChange={(e) => handleFilterChange('weightMin', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Weight Max</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Max KG"
                    value={filters.weightMax}
                    onChange={(e) => handleFilterChange('weightMax', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Height Min</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Min CM"
                    value={filters.heightMin}
                    onChange={(e) => handleFilterChange('heightMin', e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-2">
                  <Form.Label>Height Max</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Max CM"
                    value={filters.heightMax}
                    onChange={(e) => handleFilterChange('heightMax', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
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
          <Table responsive hover className="record-table mb-0">
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
                <th>Mother/Caregiver</th>
                <th>Name of Child</th>
                <th>Birthdate</th>
                <th>Sex</th>
                <th>Age (mos)</th>
                <th>Weight</th>
                <th>Height</th>
                <th>WFA</th>
                <th>HFA</th>
                <th>WFH</th>
                <th>Recorded Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan="15" className="text-center py-3 text-muted">
                    {searchTerm || Object.values(filters).some(v => v) 
                      ? 'No records found matching your filters' 
                      : 'No records found'}
                  </td>
                </tr>
              ) : (
                currentRecords.map((record, index) => {
                  const wfaCode = getWfaStatusCode(record)
                  const hfaCode = getHfaStatusCode(record)
                  const wfhCode = getWfhStatusCode(record)
                  return (
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
                      <td>{record.motherOrCaregiver || '—'}</td>
                      <td>{record.fullName}</td>
                      <td>{record.birthdate ? new Date(record.birthdate).toLocaleDateString() : 'N/A'}</td>
                      <td>{record.sex === 'Male' ? 'M' : record.sex === 'Female' ? 'F' : '—'}</td>
                      <td>{record.ageMonths}</td>
                      <td>{record.weight} kg</td>
                      <td>{record.height} cm</td>
                      <td>
                        {wfaCode ? (
                          <span className={`badge ${CHILD_STATUS_BADGES[wfaCode] || 'bg-secondary'}`}>{wfaCode}</span>
                        ) : record.nutritionalStatus ? (
                          <span className="badge bg-secondary" title="Legacy record - select sex to compute">{record.nutritionalStatus}</span>
                        ) : '—'}
                      </td>
                      <td>
                        {hfaCode ? <span className={`badge ${CHILD_STATUS_BADGES[hfaCode] || 'bg-secondary'}`}>{hfaCode}</span> : '—'}
                      </td>
                      <td>
                        {wfhCode ? <span className={`badge ${CHILD_STATUS_BADGES[wfhCode] || 'bg-secondary'}`}>{wfhCode}</span> : '—'}
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
                  )
                })
              )}
            </tbody>
          </Table>
        </Card.Body>
        
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

export default ChildRecordsEntry