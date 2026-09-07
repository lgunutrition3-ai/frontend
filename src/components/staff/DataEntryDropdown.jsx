import { useLocation, useNavigate } from 'react-router-dom'
import { Form } from 'react-bootstrap'

const menuItems = [
  { path: '/staff/child-records', label: 'Child Records' },
  { path: '/staff/animal-raising', label: 'Animal Raising' },
  { path: '/staff/potable-water', label: 'Potable Water' },
  { path: '/staff/iodized-salt', label: 'Iodized Salt' },
  { path: '/staff/cr', label: 'With/Without CR' },
  { path: '/staff/backyard-gardening', label: 'Backyard Gardening' },
  { path: '/staff/pregnant-women', label: 'Pregnant Women' },
  { path: '/staff/vegetable-seeds', label: 'Vegetable Seeds' },
  { path: '/staff/animal-dispersal', label: 'Animal Dispersal' },
]

const DataEntryDropdown = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const currentValue = menuItems.some((item) => item.path === location.pathname)
    ? location.pathname
    : menuItems[0].path

  return (
    <Form.Group>
      <Form.Label>Data Entry</Form.Label>
      <Form.Select
        value={currentValue}
        onChange={(e) => navigate(e.target.value)}
        className="staff-selector-dropdown"
      >
        {menuItems.map((item) => (
          <option key={item.path} value={item.path}>
            {item.label}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
  )
}

export default DataEntryDropdown