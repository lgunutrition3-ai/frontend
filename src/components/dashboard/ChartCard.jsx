const ChartCard = ({ title, icon = 'bi-graph-up', children, className = '' }) => (
  <div className={`chart-card ${className}`}>
    <div className="chart-card-header">
      <h5 className="chart-card-title">
        <i className={`bi ${icon} me-2`}></i>
        {title}
      </h5>
    </div>
    <div className="chart-card-body">{children}</div>
  </div>
)

export default ChartCard