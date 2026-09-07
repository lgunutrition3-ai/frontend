import { useLocation, useNavigate } from 'react-router-dom'
import { Form } from 'react-bootstrap'
import { barangayReportMenuItems } from './barangayReportMenu'

const BarangayReportDropdown = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const flatItems = barangayReportMenuItems.flatMap((section) => section.items)

  const currentValue = flatItems.some((item) => item.path === location.pathname)
    ? location.pathname
    : flatItems[0].path

  return (
    <Form.Group>
      <Form.Label className="report-mobile-label">Reports</Form.Label>
      <Form.Select
        value={currentValue}
        onChange={(e) => navigate(e.target.value)}
        className="report-mobile-dropdown"
      >
        {flatItems.map((item) => (
          <option key={item.path} value={item.path}>
            {item.label}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  )
}

export default BarangayReportDropdown