const StatCard = ({ title, value, color, icon }) => (
  <div className="stat-card">
    <div className={`stat-icon stat-accent-${color}`}>
      <i className={`bi bi-${icon}`}></i>
    </div>
    <div className="min-width-0">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{title}</div>
    </div>
  </div>
)

export default StatCard