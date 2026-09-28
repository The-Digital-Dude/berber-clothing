"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface RevenueData {
  name: string
  total: number
  orders?: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-zinc-900 border border-zinc-800 text-white px-3 py-2 rounded-xl shadow-xl text-xs space-y-1">
        <p className="font-semibold text-zinc-400">{data.dateLabel || label}</p>
        <p className="text-amber-400 font-bold text-sm">
          ৳{Number(data.total || 0).toLocaleString()}
        </p>
        {data.orders !== undefined && (
          <p className="text-[11px] text-zinc-400">
            {data.orders} {data.orders === 1 ? "order" : "orders"}
          </p>
        )}
      </div>
    )
  }
  return null
}

export default function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            dy={8}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `৳${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(244, 244, 245, 0.6)", radius: 8 }} />
          <Bar
            dataKey="total"
            fill="#f59e0b"
            radius={[6, 6, 2, 2]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
