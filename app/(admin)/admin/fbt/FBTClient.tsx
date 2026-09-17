"use client"
import { useState } from "react"
import Image from "next/image"
import { Plus, Trash2, Search, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"

type Product = { id: string; name: string; images: { url: string }[] }
type Pair = { id: string; primaryId: string; secondaryId: string; score: number; secondary: Product }

export default function FBTClient({ products, initialPairs }: { products: Product[]; initialPairs: Pair[] }) {
  const [pairs, setPairs] = useState<Pair[]>(initialPairs)
  // expanded state per primary: which row has the add-search open
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [score, setScore] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState("")

  const pairsFor = (primaryId: string) => pairs.filter((p) => p.primaryId === primaryId)

  const addPair = async (primaryId: string) => {
    const secondaryId = selected[primaryId]
    if (!secondaryId) return
    const s = Number(score[primaryId] || "1")
    const res = await fetch("/api/admin/fbt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryId, secondaryId, score: s }),
    })
    if (!res.ok) { toast.error("Failed to add pair"); return }
    const data = await res.json()
    const sec = products.find((p) => p.id === secondaryId)!
    setPairs((prev) => [...prev.filter((p) => !(p.primaryId === primaryId && p.secondaryId === secondaryId)), { ...data.pair, secondary: sec }])
    setSelected((prev) => ({ ...prev, [primaryId]: "" }))
    setSearch((prev) => ({ ...prev, [primaryId]: "" }))
    toast.success("Pair added")
  }

  const removePair = async (pairId: string) => {
    const res = await fetch("/api/admin/fbt", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pairId }),
    })
    if (!res.ok) { toast.error("Failed to remove"); return }
    setPairs((prev) => prev.filter((p) => p.id !== pairId))
    toast.success("Pair removed")
  }

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Global search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter products…"
          className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* One row per primary product */}
      <div className="space-y-3">
        {filteredProducts.map((primary) => {
          const myPairs = pairsFor(primary.id)
          const isOpen = expanded[primary.id] ?? false
          const q = search[primary.id] || ""
          const pairedIds = new Set(myPairs.map((p) => p.secondaryId))
          const suggestions = products.filter(
            (p) => p.id !== primary.id && !pairedIds.has(p.id) && p.name.toLowerCase().includes(q.toLowerCase())
          ).slice(0, 6)

          return (
            <div key={primary.id} className="border rounded-xl bg-white overflow-hidden">
              {/* Primary row header */}
              <div className="flex items-center gap-3 px-4 py-3">
                {primary.images[0] && (
                  <div className="relative w-9 h-9 rounded overflow-hidden shrink-0">
                    <Image src={primary.images[0].url} alt={primary.name} fill className="object-cover" />
                  </div>
                )}
                <p className="font-medium text-sm flex-1">{primary.name}</p>

                {/* Existing pairs inline */}
                <div className="hidden sm:flex items-center gap-2 flex-wrap">
                  {myPairs.map((pair) => (
                    <div key={pair.id} className="flex items-center gap-1.5 bg-slate-100 rounded-full pl-1 pr-2 py-0.5">
                      {pair.secondary?.images?.[0] && (
                        <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
                          <Image src={pair.secondary.images[0].url} alt={pair.secondary.name} fill className="object-cover" />
                        </div>
                      )}
                      <span className="text-xs text-slate-700 max-w-[100px] truncate">{pair.secondary?.name}</span>
                      <button
                        onClick={() => removePair(pair.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors ml-0.5"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {myPairs.length === 0 && (
                    <span className="text-xs text-muted-foreground">No suggestions yet</span>
                  )}
                </div>

                <button
                  onClick={() => setExpanded((prev) => ({ ...prev, [primary.id]: !isOpen }))}
                  className="ml-2 p-1.5 rounded-lg hover:bg-slate-100 text-muted-foreground transition-colors"
                  title={isOpen ? "Collapse" : "Add / manage"}
                >
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>

              {/* Expanded: add new pair + full list on mobile */}
              {isOpen && (
                <div className="border-t bg-slate-50 px-4 py-3 space-y-3">
                  {/* Mobile pairs list */}
                  {myPairs.length > 0 && (
                    <div className="sm:hidden space-y-1">
                      {myPairs.map((pair) => (
                        <div key={pair.id} className="flex items-center gap-2">
                          <span className="text-sm flex-1 truncate">{pair.secondary?.name}</span>
                          <span className="text-xs text-muted-foreground">score {pair.score}</span>
                          <button onClick={() => removePair(pair.id)} className="p-1 text-red-400 hover:text-red-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add pair UI */}
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 relative">
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        value={q}
                        onChange={(e) => { setSearch((p) => ({ ...p, [primary.id]: e.target.value })); setSelected((p) => ({ ...p, [primary.id]: "" })) }}
                        placeholder="Search product to suggest…"
                        className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      />
                      {q && !selected[primary.id] && (
                        <div className="absolute z-10 top-full mt-1 w-full bg-white border rounded-lg shadow-md divide-y max-h-40 overflow-y-auto">
                          {suggestions.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-3 py-2">
                              {pairedIds.size >= products.length - 1 ? "All products already paired." : "No matches."}
                            </p>
                          ) : suggestions.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => { setSelected((prev) => ({ ...prev, [primary.id]: p.id })); setSearch((prev) => ({ ...prev, [primary.id]: p.name })) }}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                            >
                              {p.images[0] && (
                                <div className="relative w-7 h-7 rounded overflow-hidden shrink-0">
                                  <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                                </div>
                              )}
                              <span className="text-sm">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={score[primary.id] || "1"}
                      onChange={(e) => setScore((prev) => ({ ...prev, [primary.id]: e.target.value }))}
                      className="w-14 border rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                      title="Score (higher = shown first)"
                    />
                    <button
                      onClick={() => addPair(primary.id)}
                      disabled={!selected[primary.id]}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>

                  {/* Desktop score legend */}
                  <p className="text-xs text-muted-foreground">Score = display priority (higher shown first). You can add as many suggestions as you like.</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No products found.</p>
      )}
    </div>
  )
}
