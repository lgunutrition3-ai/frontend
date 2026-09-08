import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'
import { childRecordApi } from '../api/auth'
import {
  animalRaisingApi,
  potableWaterApi,
  iodizedSaltApi,
  crApi,
  backyardGardeningApi,
  pregnantWomenApi,
  vegetableSeedApi,
  animalDispersalApi,
} from '../api/reports'
import { Row, Col, Spinner, Container, Alert } from 'react-bootstrap'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts'

import { formatDate, formatToday } from '../utils/formatDate'
import StatCard from '../components/dashboard/StatCard'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import ChartCard from '../components/dashboard/ChartCard'
import StaffOverviewStats from '../components/dashboard/StaffOverviewStats'
import StaffByBarangayChart from '../components/dashboard/StaffByBarangayChart'
import MonthlyTrendChart from '../components/dashboard/MonthlyTrendChart'
import ReportTypeCoverage from '../components/dashboard/ReportTypeCoverage'

import './css/Dashboard.css'

const STATUS_COLORS = {
  'Normal': '#198754',
  'MAM': '#ffc107',
  'SAM': '#fd7e14',
  'Underweight': '#dc3545',
  'Severely Underweight': '#6f0000',
}

const REPORT_CONFIGS = [
  { key: 'child-records', label: 'Child Records', api: childRecordApi, nameKey: 'fullName' },
  { key: 'animal-raising', label: 'Animal Raising', api: animalRaisingApi, nameKey: 'householdName' },
  { key: 'potable-water', label: 'Potable Water', api: potableWaterApi, nameKey: 'householdName' },
  { key: 'iodized-salt', label: 'Iodized Salt', api: iodizedSaltApi, nameKey: 'storeName' },
  { key: 'cr', label: 'CR (Toilet)', api: crApi, nameKey: 'householdName' },
  { key: 'backyard-gardening', label: 'Backyard Gardening', api: backyardGardeningApi, nameKey: 'householdName' },
  { key: 'pregnant-women', label: 'Pregnant Women', api: pregnantWomenApi, nameKey: 'womanName' },
  { key: 'vegetable-seeds', label: 'Vegetable Seeds', api: vegetableSeedApi, nameKey: 'householdName' },
  { key: 'animal-dispersal', label: 'Animal Dispersal', api: animalDispersalApi, nameKey: 'householdName' },
]

const AdminDashboard = () => {
  const { user } = useAuth()
  const [staff, setStaff] = useState([])
  const [reportStats, setReportStats] = useState([])
  const [recentRecords, setRecentRecords] = useState([])
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalBarangays: 0,
    totalChildren: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError('')

      const typeResults = await Promise.all(
        REPORT_CONFIGS.map((cfg) =>
          cfg.api.getAll().catch((err) => {
            console.error(`Failed to fetch ${cfg.label}:`, err)
            return []
          })
        )
      )

      const categoryStats = REPORT_CONFIGS.map((cfg, i) => {
        const data = typeResults[i] || []
        const coveredBarangays = new Set(data.map((r) => r.barangay).filter(Boolean)).size
        return { key: cfg.key, label: cfg.label, records: data.length, barangays: coveredBarangays }
      })
      setReportStats(categoryStats)

      const childRecords = typeResults[0] || []

      const totalRecords = categoryStats.reduce((sum, s) => sum + s.records, 0)
      const coveredBarangays = new Set()
      typeResults.forEach((arr) =>
        (arr || []).forEach((r) => { if (r.barangay) coveredBarangays.add(r.barangay) })
      )

      setStats({
        totalRecords,
        totalBarangays: coveredBarangays.size,
        totalChildren: childRecords.length,
      })

      const recent = REPORT_CONFIGS.flatMap((cfg, i) =>
        (typeResults[i] || []).map((r) => ({
          type: cfg.label,
          name: r[cfg.nameKey] || '',
          barangay: r.barangay,
          recordedBy: r.recordedBy || '',
          recordedDate: r.recordedDate,
        }))
      )
      recent.sort((a, b) => new Date(b.recordedDate) - new Date(a.recordedDate))
      setRecentRecords(recent.slice(0, 10))

      const staffData = await api.get('/admin/staff').then((r) => r.data).catch((err) => {
        console.error('Failed to fetch staff:', err)
        return []
      })
      setStaff(staffData)
    } catch (err) {
      console.error('Error fetching admin dashboard:', err)
      setError('Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </div>
    )
  }

  const today = formatToday()

  // Barangay distribution (top 8)
  const barangayCounts = {}
  recentRecords.forEach((r) => {
    if (r.barangay) barangayCounts[r.barangay] = (barangayCounts[r.barangay] || 0) + 1
  })
  const barangayData = Object.entries(barangayCounts)
    .map(([barangay, count]) => ({ barangay, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Nutritional status breakdown (from child records)
  const childRecords = recentRecords.filter((r) => r.type === 'Child Records')
  const statusCounts = {}
  childRecords.forEach((r) => {
    const status = r.nutritionalStatus || 'Unknown'
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Staff performance
  const staffPerformance = {}
  staff.forEach((s) => { staffPerformance[s.username] = 0 })
  recentRecords.forEach((r) => {
    if (r.recordedBy && staffPerformance[r.recordedBy] !== undefined) {
      staffPerformance[r.recordedBy]++
    }
  })
  const staffPerfData = Object.entries(staffPerformance)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return (
    <Container fluid className="px-3 px-md-4 dashboard-page">
      <DashboardHeader
        title="Admin Dashboard"
        subtitle="System-wide overview of nutrition records and staff"
        role="Administrator"
        date={today}
      />

      {error && <Alert variant="danger" className="dashboard-alert">{error}</Alert>}

      {/* Overview Stats */}
      <h2 className="dashboard-section-title">System Overview</h2>
      <Row className="g-4 mb-4">
        <Col xs={12} sm={6} md={3}>
          <StatCard title="Total Records" value={stats.totalRecords} color="primary" icon="file-text" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard title="Barangays" value={stats.totalBarangays} color="info" icon="map" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard title="Total Children" value={stats.totalChildren} color="success" icon="people" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard title="Total Staff" value={staff.length} color="warning" icon="person-badge" />
        </Col>
      </Row>

      {/* Staff Section */}
      <h2 className="dashboard-section-title">Staff</h2>
      <StaffOverviewStats staff={staff} />

      <Row className="g-4 mb-4">
        <Col xs={12} lg={7}>
          <ChartCard title="Staff by Barangay" icon="bi-person-vcard">
            <StaffByBarangayChart staff={staff} />
          </ChartCard>
        </Col>
        <Col xs={12} lg={5}>
          <ChartCard title="Monthly Entries (Current Year)" icon="bi-graph-up">
            <MonthlyTrendChart records={recentRecords} />
          </ChartCard>
        </Col>
      </Row>

      {/* Report Coverage */}
      <h2 className="dashboard-section-title">Reports</h2>
      <Row className="g-4 mb-4">
        <Col xs={12}>
          <div className="dashboard-table-card">
            <div className="table-card-header">
              <h5><i className="bi bi-clipboard-data me-2"></i>Report Type Coverage</h5>
            </div>
            <ReportTypeCoverage reportStats={reportStats} />
          </div>
        </Col>
      </Row>

      {/* Analytics */}
      <h2 className="dashboard-section-title">Analytics</h2>
      <Row className="g-4 mb-4">
        <Col xs={12} lg={7}>
          <ChartCard title="Records by Barangay (Top 8)" icon="bi-graph-up">
            {barangayData.length === 0 ? (
              <p className="chart-empty mb-0">No records yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={barangayData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="barangay" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" name="Records" stroke="#198754" strokeWidth={2.5} dot={{ r: 4, fill: '#198754' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Col>
        <Col xs={12} lg={5}>
          <ChartCard title="Nutritional Status" icon="bi-pie-chart-fill">
            {statusData.length === 0 ? (
              <p className="chart-empty mb-0">No child records yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={STATUS_COLORS[entry.name] || '#adb5bd'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Col>
      </Row>

      {/* Staff Performance */}
      {staffPerfData.length > 0 && (
        <>
          <h2 className="dashboard-section-title">Staff Performance</h2>
          <Row className="g-4 mb-4">
            <Col xs={12}>
              <ChartCard title="Records by Staff Member" icon="bi-trophy">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={staffPerfData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Records" fill="#E3A008" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </Col>
          </Row>
        </>
      )}

      {/* Recent Entries */}
      <h2 className="dashboard-section-title">Recent Entries</h2>
      <div className="dashboard-table-card">
        <div className="table-card-header">
          <h5><i className="bi bi-clock-history me-2"></i>Last 10 System Entries</h5>
        </div>
        {recentRecords.length === 0 ? (
          <p className="text-muted text-center py-4 mb-0">No records yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="dashboard-table mb-0">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Name</th>
                  <th>Barangay</th>
                  <th className="d-none d-md-table-cell">Recorded By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((r, i) => (
                  <tr key={i}>
                    <td><span className="fw-semibold">{r.type}</span></td>
                    <td>{r.name}</td>
                    <td>{r.barangay}</td>
                    <td className="d-none d-md-table-cell">{r.recordedBy || '-'}</td>
                    <td>{formatDate(r.recordedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Container>
  )
}

export default AdminDashboard
