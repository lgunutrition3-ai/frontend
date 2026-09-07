import { Row, Col } from 'react-bootstrap'
import StatCard from './StatCard'

const StaffOverviewStats = ({ staff = [] }) => {
  const active = staff.filter((s) => s.isActive).length
  const inactive = staff.length - active
  const barangays = new Set(staff.map((s) => s.barangay).filter(Boolean)).size

  return (
    <Row className="g-4 mb-4">
      <Col xs={12} sm={6} md={3}>
        <StatCard title="Total Staff" value={staff.length} color="primary" icon="person-badge" />
      </Col>
      <Col xs={12} sm={6} md={3}>
        <StatCard title="Active Staff" value={active} color="success" icon="person-check" />
      </Col>
      <Col xs={12} sm={6} md={3}>
        <StatCard title="Inactive Staff" value={inactive} color="danger" icon="person-x" />
      </Col>
      <Col xs={12} sm={6} md={3}>
        <StatCard title="Barangays Covered" value={barangays} color="info" icon="map" />
      </Col>
    </Row>
  )
}

export default StaffOverviewStats