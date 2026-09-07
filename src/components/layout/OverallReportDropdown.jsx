import { useLocation, useNavigate } from 'react-router-dom'
import { Form } from 'react-bootstrap'

const overallReportMenuItems = [
  { path: '/overall-report', label: 'Vitamin A Report' },
  { path: '/overall-report/pregnant-women', label: 'Pregnant Women BMI' },
  { path: '/overall-report/animal-raising', label: 'Animal Raising' },
  { path: '/overall-report/animal-dispersal', label: 'Animal Dispersal' },
  { path: '/overall-report/backyard-gardening', label: 'Backyard Gardening' },
  { path: '/overall-report/vegetable-seeds', label: 'Vegetable Seeds' },
  { path: '/overall-report/potable-water', label: 'Potable Water' },
  { path: '/overall-report/iodized-salt', label: 'Iodized Salt Stores' },
  { path: '/overall-report/cr', label: 'With & Without CR' }
]

const OverallReportDropdown = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const currentValue = overallReportMenuItems.some((item) => item.path === location.pathname)
    ? location.pathname
    : overallReportMenuItems[0].path

  return (
    <Form.Group>
      <Form.Label className="report-mobile-label">Reports</Form.Label>
      <Form.Select
        value={currentValue}
        onChange={(e) => navigate(e.target.value)}
        className="report-mobile-dropdown"
      >
        {overallReportMenuItems.map((item) => (
          <option key={item.path} value={item.path}>
            {item.label}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  )
}

export default OverallReportDropdown
