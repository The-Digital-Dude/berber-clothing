"use client"

const FUNNEL_STEPS = [
  { key: "page_view", label: "Page Views" },
  { key: "add_to_cart", label: "Add to Cart" },
  { key: "checkout_start", label: "Checkout Start" },
  { key: "purchase", label: "Purchase" },
]

interface Props {
  topSearches: { query: string; count: number }[]
  funnelCounts: Record<string, number>
}

export default function AnalyticsDashboard({ topSearches, funnelCounts }: Props) {
  const maxSearchCount = topSearches[0]?.count ?? 1

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <section>
        <h2 className="text-lg font-semibold mb-4">Conversion Funnel (Last 7 days)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {FUNNEL_STEPS.map((step, i) => {
            const count = funnelCounts[step.key] ?? 0
            const prev = i === 0 ? count : (funnelCounts[FUNNEL_STEPS[i - 1].key] ?? 1)
            const rate = i === 0 ? 100 : prev > 0 ? Math.round((count / prev) * 100) : 0
            return (
              <div key={step.key} className="bg-white border rounded-xl p-4">
                <p className="text-sm text-gray-500">{step.label}</p>
                <p className="text-3xl font-bold mt-1">{count.toLocaleString()}</p>
                {i > 0 && <p className="text-sm text-gray-400 mt-1">{rate}% from prev</p>}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Top Search Queries</h2>
        {topSearches.length === 0 ? (
          <p className="text-gray-400 text-sm">No search data yet.</p>
        ) : (
          <div className="bg-white border rounded-xl divide-y">
            {topSearches.map((s) => (
              <div key={s.query} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.query}</p>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-1.5 bg-black rounded-full" style={{ width: `${(s.count / maxSearchCount) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm text-gray-500 shrink-0">{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
