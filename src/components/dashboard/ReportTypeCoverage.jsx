import { Table } from 'react-bootstrap'

const ReportTypeCoverage = ({ reportStats = [] }) => (
  <div className="table-responsive">
    <Table hover size="sm" className="dashboard-table mb-0">
      <thead>
        <tr>
          <th>#</th>
          <th>Report Type</th>
          <th className="text-center">Records</th>
          <th className="text-center">Barangays Covered</th>
        </tr>
      </thead>
      <tbody>
        {reportStats.length === 0 ? (
          <tr>
            <td colSpan="4" className="row-empty">
              No data available
            </td>
          </tr>
        ) : (
          reportStats.map((stat, index) => (
            <tr key={stat.key}>
              <td>{index + 1}</td>
              <td>{stat.label}</td>
              <td className="text-center">{stat.records}</td>
              <td className="text-center">{stat.barangays}</td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  </div>
)

export default ReportTypeCoverage