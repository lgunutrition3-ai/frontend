import nutritionLogo from '../../assets/nutritionlogo.jpg'

const DashboardHeader = ({ title, subtitle, role, date }) => (
  <div className="dashboard-header">
    <img className="dashboard-header-logo" src={nutritionLogo} alt="Nutrition Logo" />
    <div className="dashboard-header-body">
      <h1 className="dashboard-title">{title}</h1>
      <p className="dashboard-subtitle mb-0">{subtitle}</p>
      <span className="dashboard-role-badge">{role}</span>
    </div>
    {date && <div className="dashboard-date">{date}</div>}
  </div>
)

export default DashboardHeader