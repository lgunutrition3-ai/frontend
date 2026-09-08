import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { formatDate, formatToday } from '../utils/formatDate'
import StatCard from '../components/dashboard/StatCard'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import ChartCard from '../components/dashboard/ChartCard'

import './css/Dashboard.css'

const REPORT_TYPES = [
  { key: 'child-records', label: 'Child Records', api: childRecordApi, icon: 'bi-heart-pulse', color: 'primary', route: '/staff/child-records' },
  { key: 'animal-raising', label: 'Animal Raising', api: animalRaisingApi, icon: 'bi-bull', color: 'success', route: '/staff/animal-raising' },
  { key: 'potable-water', label: 'Potable Water', api: potableWaterApi, icon: 'bi-droplet', color: 'info', route: '/staff/potable-water' },
  { key: 'iodized-salt', label: 'Iodized Salt', api: iodizedSaltApi, icon: 'bi-mortarboard', color: 'warning', route: '/staff/iodized-salt' },
  { key: 'cr', label: 'CR (Toilet)', api: crApi, icon: 'bi-house', color: 'danger', route: '/staff/cr' },
  { key: 'backyard-gardening', label: 'Backyard Gardening', api: backyardGardeningApi, icon: 'bi-flower1', color: 'success', route: '/staff/backyard-gardening' },
  { key: 'pregnant-women', label: 'Pregnant Women', api: pregnantWomenApi, icon: 'bi-gender-female', color: 'primary', route: '/staff/pregnant-women' },
  { key: 'vegetable-seeds', label: 'Vegetable Seeds', api: vegetableSeedApi, icon: 'bi-leaf', color: 'info', route: '/staff/vegetable-seeds' },
  { key: 'animal-dispersal', label: 'Animal Dispersal', api: animalDispersalApi, icon: 'bi-arrow-left-right', color: 'warning', route: '/staff/animal-dispersal' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const StaffDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reportCounts, setReportCounts] = useState([])
  const [recentRecords, setRecentRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setError('')
      const results = await Promise.all(
        REPORT_TYPES.map((rt) =>
          rt.api.getAll().catch((err) => {
            console.error(`Failed to fetch ${rt.label}:`, err)
            return []
          })
        )
      )

      const userId = user?.id != null ? String(user.id) : null
      const username = user?.username || null

      const counts = REPORT_TYPES.map((rt, i) => {
        const data = results[i] || []
        const myRecords = data.filter((r) => {
          const rb = r.recordedBy != null ? String(r.recordedBy) : null
          return rb && (rb === userId || rb === username)
        })
        return {
          key: rt.key,
          label: rt.label,
          icon: rt.icon,
          color: rt.color,
          route: rt.route,
          total: myRecords.length,
        }
      })
      setReportCounts(counts)

      const allMyRecords = REPORT_TYPES.flatMap((rt, i) =>
        (results[i] || [])
          .filter((r) => {
            const rb = r.recordedBy != null ? String(r.recordedBy) : null
            return rb && (rb === userId || rb === username)
          })
          .map((r) => ({
            type: rt.label,
            name: r.fullName || r.householdName || r.storeName || r.womanName || '-',
            barangay: r.barangay,
            recordedBy: r.recordedBy,
            date: r.recordedDate,
          }))
      )
      allMyRecords.sort((a, b) => new Date(b.date) - new Date(a.date))
      setRecentRecords(allMyRecords.slice(0, 10))
    } catch (err) {
      console.error('Error fetching staff dashboard:', err)
      setError('Error loading dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const totalRecords = reportCounts.reduce((sum, r) => sum + r.total, 0)

  const year = new Date().getFullYear()
  const monthlyData = MONTHS.map((month, i) => ({
    month,
    count: recentRecords.filter((r) => {
      const d = new Date(r.date)
      return d.getFullYear() === year && d.getMonth() === i
    }).length,
  }))

  const today = formatToday()

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading dashboard...</p>
      </div>
    )
  }

  return (
    <Container fluid className="px-3 px-md-4 dashboard-page">
      <DashboardHeader
        title={`Welcome, ${user?.username}!`}
        subtitle={`Barangay ${user?.barangay || 'N/A'} - Staff Dashboard`}
        role="BNS Staff"
        date={today}
      />

      {error && <Alert variant="danger" className="dashboard-alert">{error}</Alert>}

      {/* Overview Stats */}
      <h2 className="dashboard-section-title">My Overview</h2>
      <Row className="g-4 mb-4">
        <Col xs={12} sm={6} md={3}>
          <StatCard title="My Total Records" value={totalRecords} color="primary" icon="file-text" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard title="Report Types Used" value={reportCounts.filter((r) => r.total > 0).length} color="success" icon="clipboard-data" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard title="My Barangay" value={user?.barangay || '-'} color="info" icon="geo-alt" />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <StatCard title="This Month" value={monthlyData[new Date().getMonth()]?.count || 0} color="warning" icon="calendar-check" />
        </Col>
      </Row>

      {/* Quick Entry Links */}
      <h2 className="dashboard-section-title">Quick Data Entry</h2>
      <Row className="g-3 mb-4">
        {reportCounts.map((rt) => (
          <Col xs={6} sm={4} md={3} lg={2} key={rt.key}>
            <div
              className="stat-card cursor-pointer"
              style={{ cursor: 'pointer', flexDirection: 'column', textAlign: 'center', padding: '16px 12px' }}
              onClick={() => navigate(rt.route)}
            >
              <i className={`bi ${rt.icon} fs-3 mb-2`} style={{ color: 'var(--bs-primary)' }}></i>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#3c4a5b' }}>{rt.label}</div>
              <div style={{ fontSize: '11px', color: '#7a8698' }}>{rt.total} records</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Monthly Trend */}
      <h2 className="dashboard-section-title">My Monthly Entries</h2>
      <Row className="g-4 mb-4">
        <Col xs={12}>
          <ChartCard title={`Entries in ${year}`} icon="bi-graph-up">
            {monthlyData.every((d) => d.count === 0) ? (
              <p className="chart-empty mb-0">No entries this year</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Entries" fill="#0B4F4A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </Col>
      </Row>

      {/* Recent Entries */}
      <h2 className="dashboard-section-title">Recent Entries</h2>
      <div className="dashboard-table-card">
        <div className="table-card-header">
          <h5><i className="bi bi-clock-history me-2"></i>Last 10 Entries</h5>
        </div>
        {recentRecords.length === 0 ? (
          <p className="text-muted text-center py-4 mb-0">No entries yet. Start by adding data above.</p>
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
                    <td>{formatDate(r.date)}</td>
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

export default StaffDashboard
