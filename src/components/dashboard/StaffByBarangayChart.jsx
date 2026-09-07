import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const StaffByBarangayChart = ({ staff = [] }) => {
  const counts = {}
  staff.forEach((s) => {
    if (s.barangay) counts[s.barangay] = (counts[s.barangay] || 0) + 1
  })

  const data = Object.entries(counts)
    .map(([barangay, count]) => ({ barangay, count }))
    .sort((a, b) => b.count - a.count)

  if (data.length === 0) {
    return <p className="text-muted text-center py-5 mb-0">No staff yet</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="barangay" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#0B4F4A" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default StaffByBarangayChart