// components/layout/OverallReportLayout.jsx
import { Outlet } from 'react-router-dom'
import OverallReportDropdown from './OverallReportDropdown'
import './css/ReportLayout.css'

const OverallReportLayout = () => {
  return (
    <div className="report-layout">
      <div className="layout-body">
        <main className="content-wrapper">
          <div className="overall-report-mobile-nav">
            <OverallReportDropdown />
          </div>
          <div className="content-area">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default OverallReportLayout
