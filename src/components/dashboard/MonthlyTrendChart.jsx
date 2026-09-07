import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MonthlyTrendChart = ({ records = [] }) => {
  const year = new Date().getFullYear()

  const data = MONTHS.map((month, i) => ({
    month,
    count: records.filter((r) => {
      const d = new Date(r.recordedDate)
      return d.getFullYear() === year && d.getMonth() === i
    }).length,
  }))

  const hasData = data.some((d) => d.count > 0)
  if (!hasData) {
    return <p className="text-muted text-center py-5 mb-0">No records this year</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#20c997" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default MonthlyTrendChart