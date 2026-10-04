import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Label } from 'recharts'
import type { CountyData } from '../types'

interface ChartProps {
  data: CountyData[]
  title: string
}

export default function Chart({ data, title }: ChartProps) {
  if (!data.length) return <div role="status" aria-live="polite">No data to display</div>

  // Sort by ratio for cleaner visualization
  const sorted = [...data].sort((a, b) => a.income_to_rent_ratio - b.income_to_rent_ratio)

  return (
    <div style={{ width: '100%', height: 300 }}>
      <h3 id="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sorted} aria-describedby="chart-title">
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="name"
            tickFormatter={(name) => name.length > 15 ? name.slice(0, 15) + '…' : name}
            interval={0}
            tick={{ fontSize: 10 }}
          />
          <YAxis label={{ value: 'Income-to-Rent Ratio', angle: -90, position: 'insideLeft', offset: 20 }} />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2), 'Ratio']}
            labelFormatter={(name) => name}
          />
          <Bar
            dataKey="income_to_rent_ratio"
            name="Income-to-Rent Ratio"
            fill="#2196f3"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
