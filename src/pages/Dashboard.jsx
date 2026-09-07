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
  PieChart, Pie, Cell, Legend
} from 'recharts'

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
  { key: 'child-records', label: 'Vitamin A (Child Records)', nameKey: 'fullName' },
  { key: 'animal-raising', label: 'Animal Raising', nameKey: 'householdName' },
  { key: 'potable-water', label: 'Potable Water', nameKey: 'householdName' },
  { key: 'iodized-salt', label: 'Iodized Salt', nameKey: 'storeName' },
  { key: 'cr', label: 'With/Without CR', nameKey: 'householdName' },
  { key: 'backyard-gardening', label: 'Backyard Gardening', nameKey: 'householdName' },
  { key: 'pregnant-women', label: 'Pregnant Women', nameKey: 'womanName' },
  { key: 'vegetable-seeds', label: 'Vegetable Seeds', nameKey: 'householdName' },
  { key: 'animal-dispersal', label: 'Animal Dispersal', nameKey: 'householdName' },
]

const REPORT_APIS = {
  'child-records': () => childRecordApi.getAll(),
  'animal-raising': () => animalRaisingApi.getAll(),
  'potable-water': () => potableWaterApi.getAll(),
  'iodized-salt': () => iodizedSaltApi.getAll(),
  'cr': () => crApi.getAll(),
  'backyard-gardening': () => backyardGardeningApi.getAll(),
  'pregnant-women': () => pregnantWomenApi.getAll(),
  'vegetable-seeds': () => vegetableSeedApi.getAll(),
  'animal-dispersal': () => animalDispersalApi.getAll(),
}

const Dashboard = () => {
  const { user, isAdmin } = useAuth()
  const [records, setRecords] = useState([])
  const [staff, setStaff] = useState([])
  const [reportStats, setReportStats] = useState([])
  const [recentRecords, setRecentRecords] = useState([])
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalBarangays: 0,
    totalChildren: 0,
    myRecords: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setError('')

      const typeResults = await Promise.all(
        REPORT_CONFIGS.map((cfg) => REPORT_APIS[cfg.key]().catch(() => []))
      )

      const isOwnRecord = (r) => isAdmin || r.recordedBy === user?.id || r.recordedBy === user?.username

      const categoryStats = REPORT_CONFIGS.map((cfg, i) => {
        const data = (typeResults[i] || []).filter(isOwnRecord)
        const coveredBarangays = new Set(data.map((r) => r.barangay).filter(Boolean)).size
        return { key: cfg.key, label: cfg.label, records: data.length, barangays: coveredBarangays }
      })
      setReportStats(categoryStats)

      const childRecords = (typeResults[0] || []).filter(isOwnRecord)
      setRecords(childRecords)

      const totalRecords = categoryStats.reduce((sum, s) => sum + s.records, 0)
      const coveredBarangays = new Set()
      typeResults.forEach((arr, i) =>
        (arr || []).filter(isOwnRecord).forEach((r) => { if (r.barangay) coveredBarangays.add(r.barangay) })
      )

      setStats({
        totalRecords,
        totalBarangays: coveredBarangays.size,
        totalChildren: childRecords.length,
        myRecords: (typeResults[0] || []).filter((r) => r.recordedBy === user?.id).length,
      })

      const recent = REPORT_CONFIGS.flatMap((cfg, i) =>
        (typeResults[i] || []).filter(isOwnRecord).map((r) => ({
          type: cfg.label,
          name: r[cfg.nameKey] || '',
          barangay: r.barangay,
          purok: r.purok,
          recordedDate: r.recordedDate,
        }))
      )
      setRecentRecords(recent)

      if (isAdmin) {
        const staffData = await api.get('/admin/staff').then((r) => r.data)
        setStaff(staffData)
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
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

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const scopedRecords = records
  const trendRecords = recentRecords

  // Barangay distribution (top 8 by count)
  const barangayCounts = {}
  scopedRecords.forEach((r) => {
    barangayCounts[r.barangay] = (barangayCounts[r.barangay] || 0) + 1
  })
  const barangayData = Object.entries(barangayCounts)
    .map(([barangay, count]) => ({ barangay, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Nutritional status breakdown
  const statusCounts = {}
  scopedRecords.forEach((r) => {
    statusCounts[r.nutritionalStatus] = (statusCounts[r.nutritionalStatus] || 0) + 1
  })
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // Age group breakdown
  const ageGroups = { '6-11 months': 0, '12-59 months': 0 }
  scopedRecords.forEach((r) => {
    if (r.ageMonths >= 6 && r.ageMonths <= 11) ageGroups['6-11 months']++
    else if (r.ageMonths >= 12 && r.ageMonths <= 59) ageGroups['12-59 months']++
  })
  const ageData = Object.entries(ageGroups).map(([name, value]) => ({ name, value }))

  const AnalyticsSection = () => (
    <Row className="g-4 mb-4">
      <Col xs={12} lg={7}>
        <ChartCard title={isAdmin ? 'Records by Barangay (Top 8)' : 'My Records by Barangay'} icon="bi-graph-up">
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
            <p className="chart-empty mb-0">No records yet</p>
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

      <Col xs={12}>
        <ChartCard title="Age Group Distribution" icon="bi-people-fill">
          {ageData.every((a) => a.value === 0) ? (
            <p className="chart-empty mb-0">No records yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ageData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" name="Children" stroke="#0B4F4A" strokeWidth={2.5} dot={{ r: 5, fill: '#0B4F4A' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </Col>
    </Row>
  )

  if (isAdmin) {
    return (
      <Container fluid className="px-3 px-md-4 dashboard-page">
        <DashboardHeader
          title="Admin Dashboard"
          subtitle="System-wide overview of nutrition records and staff"
          role="Administrator"
          date={today}
        />

        {error && <Alert variant="danger" className="dashboard-alert">{error}</Alert>}

        <h2 className="dashboard-section-title">Overview</h2>
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
              <MonthlyTrendChart records={trendRecords} />
            </ChartCard>
          </Col>
        </Row>

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

        <h2 className="dashboard-section-title">Analytics</h2>
        <AnalyticsSection />
      </Container>
    )
  }

  return (
    <Container fluid className="px-3 px-md-4 dashboard-page">
      <DashboardHeader
        title="BNS Dashboard"
        subtitle={`Welcome back, ${user?.username}!`}
        role={user?.role?.toUpperCase() || 'STAFF'}
        date={today}
      />

      {error && <Alert variant="danger" className="dashboard-alert">{error}</Alert>}

      <h2 className="dashboard-section-title">Overview</h2>
      <Row className="g-4 mb-4">
        <Col xs={12} sm={6} md={3}>
          <StatCard title="My Records" value={stats.myRecords} color="primary" icon="file-earmark-text" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard title="Total Records" value={stats.totalRecords} color="info" icon="file-text" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard title="Total Children" value={stats.totalChildren} color="success" icon="people" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard title="Barangays" value={stats.totalBarangays} color="warning" icon="map" />
        </Col>
      </Row>

      <h2 className="dashboard-section-title">Performance</h2>
      <Row className="g-4 mb-4">
        <Col xs={12}>
          <ChartCard title="Monthly Entries (Current Year)" icon="bi-graph-up">
            <MonthlyTrendChart records={trendRecords} />
          </ChartCard>
        </Col>
      </Row>

      <h2 className="dashboard-section-title">Analytics</h2>
      <AnalyticsSection />
    </Container>
  )
}

export default Dashboard