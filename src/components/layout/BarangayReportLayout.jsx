import { Outlet } from 'react-router-dom'
import BarangayReportDropdown from './BarangayReportDropdown'
import './css/BarangayReportLayout.css'

const BarangayReportLayout = () => {
  return (
    <div className="barangay-report-layout">
      <div className="layout-body">
        <main className="content-wrapper">
          <div className="barangay-report-mobile-nav">
            <BarangayReportDropdown />
          </div>
          <div className="content-area">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default BarangayReportLayout