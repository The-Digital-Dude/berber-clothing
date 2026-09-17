"use client"
import { useState } from "react"
import Image from "next/image"
import { Plus, Trash2, Search, TrendingUp } from "lucide-react"
import { toast } from "sonner"

export default function FBTClient({ products }: { products: any[] }) {
  const [primaryId, setPrimaryId] = useState("")
  const [pairs, setPairs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [primarySearch, setPrimarySearch] = useState("")
  const [secondarySearch, setSecondarySearch] = useState("")
  const [selectedSecondary, setSelectedSecondary] = useState("")
  const [score, setScore] = useState("1")

  const filteredPrimary = products.filter((p) =>
    p.name.toLowerCase().includes(primarySearch.toLowerCase())
  ).slice(0, 8)

  const pairedIds = new Set(pairs.map((p) => p.secondaryId))
  const filteredSecondary = products.filter((p) =>
    p.id !== primaryId &&
    !pairedIds.has(p.id) &&
    p.name.toLowerCase().includes(secondarySearch.toLowerCase())
  ).slice(0, 8)

  const loadPairs = async (id: string) => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/fbt?productId=${id}`)
      const data = await res.json()
      setPairs(data.pairs ?? [])
    } finally {
      setLoading(false)
    }
  }

  const selectPrimary = (id: string) => {
    setPrimaryId(id)
    setPrimarySearch("")
    loadPairs(id)
  }

  const addPair = async () => {
    if (!primaryId || !selectedSecondary) return
    const res = await fetch("/api/admin/fbt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryId, secondaryId: selectedSecondary, score: Number(score) }),
    })
    if (res.ok) {
      toast.success("Pair added")
      setSelectedSecondary("")
      setSecondarySearch("")
      loadPairs(primaryId)
    } else {
      toast.error("Failed to add pair")
    }
  }

  const removePair = async (id: string) => {
    const res = await fetch("/api/admin/fbt", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setPairs((prev) => prev.filter((p) => p.id !== id))
      toast.success("Pair removed")
    } else {
      toast.error("Failed to remove")
    }
  }

  const primary = products.find((p) => p.id === primaryId)

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Primary product selector */}
      <div className="rounded-xl border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">1. Select Primary Product</h2>
        {primary ? (
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-amber-50 border-amber-200">
            {primary.images[0] && (
              <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                <Image src={primary.images[0].url} alt={primary.name} fill className="object-cover" />
              </div>
            )}
            <p className="font-medium text-sm flex-1">{primary.name}</p>
            <button onClick={() => { setPrimaryId(""); setPairs([]) }} className="text-xs text-muted-foreground hover:text-red-500">Change</button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                value={primarySearch}
                onChange={(e) => setPrimarySearch(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            {primarySearch && (
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {filteredPrimary.map((p) => (
                  <button key={p.id} onClick={() => selectPrimary(p.id)} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left">
                    {p.images[0] && (
                      <div className="relative w-8 h-8 rounded overflow-hidden shrink-0">
                        <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                      </div>
                    )}
                    <p className="text-sm">{p.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pairs manager */}
      <div className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">2. Add Suggested Products</h2>
          {pairs.length > 0 && <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{pairs.length} paired</span>}
        </div>
        {!primaryId ? (
          <p className="text-sm text-muted-foreground">Select a primary product first.</p>
        ) : (
          <>
            {/* Add pair */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <input
                  value={secondarySearch}
                  onChange={(e) => { setSecondarySearch(e.target.value); setSelectedSecondary("") }}
                  placeholder="Search to add…"
                  className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              {secondarySearch && !selectedSecondary && (
                <div className="border rounded-lg divide-y max-h-36 overflow-y-auto">
                  {filteredSecondary.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-3 py-2">
                      {pairedIds.size > 0 && products.filter(p => p.id !== primaryId).length <= pairedIds.size
                        ? "All available products are already paired."
                        : "No products found."}
                    </p>
                  ) : filteredSecondary.map((p) => (
                    <button key={p.id} onClick={() => { setSelectedSecondary(p.id); setSecondarySearch(p.name) }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left">
                      {p.images[0] && (
                        <div className="relative w-8 h-8 rounded overflow-hidden shrink-0">
                          <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                        </div>
                      )}
                      <p className="text-sm">{p.name}</p>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 border rounded-lg px-3 py-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-12 text-sm focus:outline-none"
                    title="Score (higher = shown first)"
                  />
                </div>
                <button
                  onClick={addPair}
                  disabled={!selectedSecondary}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            {/* Existing pairs */}
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : pairs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pairings yet for this product.</p>
            ) : (
              <div className="space-y-2">
                {pairs.map((pair) => (
                  <div key={pair.id} className="flex items-center gap-3 p-2 border rounded-lg">
                    {pair.secondary?.images?.[0] && (
                      <div className="relative w-9 h-9 rounded overflow-hidden shrink-0">
                        <Image src={pair.secondary.images[0].url} alt={pair.secondary.name} fill className="object-cover" />
                      </div>
                    )}
                    <p className="text-sm flex-1">{pair.secondary?.name}</p>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-slate-100 rounded-full">score {pair.score}</span>
                    <button onClick={() => removePair(pair.id)} className="p-1 rounded hover:bg-red-50 text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
