import { Table } from 'react-bootstrap'

const RecentRecordsTable = ({ records = [] }) => {
  const sorted = [...records]
    .sort((a, b) => new Date(b.recordedDate) - new Date(a.recordedDate))
    .slice(0, 10)

  if (sorted.length === 0) {
    return <p className="chart-empty mb-0">No recent records</p>
  }

  return (
    <div className="table-responsive">
      <Table hover size="sm" className="dashboard-table mb-0">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Report Type</th>
            <th>Barangay</th>
            <th>Purok</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{r.name || '-'}</td>
              <td>{r.type}</td>
              <td>{r.barangay}</td>
              <td>{r.purok ? `Purok ${r.purok}` : '-'}</td>
              <td>{r.recordedDate ? new Date(r.recordedDate).toLocaleDateString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export default RecentRecordsTable