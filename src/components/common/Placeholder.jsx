const Placeholder = ({ title }) => {
  return (
    <div className="text-center py-5">
      <h3 className="text-muted">{title}</h3>
      <p className="text-muted">This report is coming soon...</p>
      <div className="mt-4">
        <span style={{ fontSize: '48px' }}>📊</span>
      </div>
    </div>
  )
}

export default Placeholder