// components/layout/OverallReportSidebar.jsx
import { Nav, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { 
  FaBaby, 
  FaWater, 
  FaFileAlt, 
  FaSeedling, 
  FaPiggyBank,
  FaPaw,
  FaUserMd,
  FaStore,
  FaAppleAlt,
  FaTint,
  FaLeaf,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa'

const OverallReportSidebar = ({ collapsed, onToggleCollapse }) => {
  const location = useLocation()

  const menuItems = [
    {
      section: 'Nutrition Reports',
      items: [
        { 
          path: '/overall-report', 
          icon: <FaAppleAlt />, 
          label: 'Vitamin A Report'
        },
        { 
          path: '/overall-report/pregnant-women', 
          icon: <FaUserMd />, 
          label: 'Pregnant Women BMI'
        }
      ]
    },
    {
      section: 'Livelihood Reports',
      items: [
        { 
          path: '/overall-report/animal-raising', 
          icon: <FaPiggyBank />, 
          label: 'Animal Raising'
        },
        { 
          path: '/overall-report/animal-dispersal', 
          icon: <FaPaw />, 
          label: 'Animal Dispersal'
        },
        { 
          path: '/overall-report/backyard-gardening', 
          icon: <FaSeedling />, 
          label: 'Backyard Gardening'
        },
        { 
          path: '/overall-report/vegetable-seeds', 
          icon: <FaLeaf />, 
          label: 'Vegetable Seeds'
        }
      ]
    },
    {
      section: 'Infrastructure Reports',
      items: [
        { 
          path: '/overall-report/potable-water', 
          icon: <FaTint />, 
          label: 'Potable Water'
        },
        { 
          path: '/overall-report/iodized-salt', 
          icon: <FaStore />, 
          label: 'Iodized Salt Stores'
        },
        { 
          path: '/overall-report/cr', 
          icon: <FaFileAlt />, 
          label: 'With & Without CR'
        }
      ]
    }
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  const NavItem = ({ item }) => {
    const link = (
      <Nav.Link
        as={Link}
        to={item.path}
        className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
      >
        <span className="sidebar-icon">{item.icon}</span>
        <span className="sidebar-label">{item.label}</span>
      </Nav.Link>
    )

    if (!collapsed) return link

    return (
      <OverlayTrigger placement="right" overlay={<Tooltip>{item.label}</Tooltip>}>
        {link}
      </OverlayTrigger>
    )
  }

  return (
    <div className="overall-report-sidebar">
      <div className="sidebar-header">
        <img 
          src="/nutritionlogo.jpg" 
          alt="Nutrition Logo" 
          className="sidebar-logo"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%23198754"%3E%3Cpath d="M12 2C12 2 6 8.5 6 13.5C6 17.09 8.69 20 12 20C15.31 20 18 17.09 18 13.5C18 8.5 12 2 12 2Z" fill="%230B4F4A"/%3E%3C/svg%3E'
          }}
        />
        {!collapsed && <h5 className="sidebar-title">Overall Reports</h5>}
        {collapsed && <h5 className="sidebar-title-collapsed">OR</h5>}
      </div>

      <button
        type="button"
        className="collapse-toggle-btn"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
      </button>

      <Nav className="flex-column sidebar-nav">
        {menuItems.map((section, index) => (
          <div key={index} className="sidebar-section">
            {!collapsed && <div className="section-title">{section.section}</div>}
            {section.items.map((item, subIndex) => (
              <NavItem key={subIndex} item={item} />
            ))}
          </div>
        ))}
      </Nav>
    </div>
  )
}

export default OverallReportSidebar