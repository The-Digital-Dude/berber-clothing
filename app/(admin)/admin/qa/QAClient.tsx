"use client"
import { useState } from "react"
import { CheckCircle, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export default function QAClient({ data }: { data: any[] }) {
  const [items, setItems] = useState(data)
  const [filter, setFilter] = useState<"all" | "unanswered" | "answered">("unanswered")
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const visible = items.filter((q) => {
    if (filter === "unanswered") return !q.answer
    if (filter === "answered") return !!q.answer
    return true
  })

  const unansweredCount = items.filter((q) => !q.answer).length

  const patch = async (id: string, payload: object) => {
    const res = await fetch(`/api/admin/qa/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems((prev) => prev.map((q) => (q.id === id ? { ...q, ...updated } : q)))
      return true
    }
    toast.error("Failed to update")
    return false
  }

  const submitAnswer = async (id: string) => {
    const answer = drafts[id]?.trim()
    if (!answer) return
    const ok = await patch(id, { answer, isPublished: true })
    if (ok) {
      setDrafts((d) => { const n = { ...d }; delete n[id]; return n })
      toast.success("Answer published")
    }
  }

  const togglePublished = async (q: any) => {
    await patch(q.id, { answer: q.answer, isPublished: !q.isPublished })
    toast.success(q.isPublished ? "Unpublished" : "Published")
  }

  const remove = async (id: string) => {
    if (!confirm("Delete this Q&A?")) return
    const res = await fetch(`/api/admin/qa/${id}`, { method: "DELETE" })
    if (res.ok) setItems((prev) => prev.filter((q) => q.id !== id))
    else toast.error("Failed to delete")
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["unanswered", "all", "answered"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? "bg-amber-500 text-white" : "bg-white border text-muted-foreground hover:border-gray-300"}`}
          >
            {f} {f === "unanswered" && unansweredCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unansweredCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Q&A list */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="rounded-xl border bg-white px-6 py-12 text-center text-muted-foreground">No questions found.</div>
        )}
        {visible.map((q) => (
          <div key={q.id} className="rounded-xl border bg-white p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{q.question}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {q.guestName || q.userId || "Anonymous"} · {q.product?.name} · {new Date(q.createdAt).toLocaleDateString("en-BD")}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {q.answer && (
                  <button onClick={() => togglePublished(q)} title={q.isPublished ? "Unpublish" : "Publish"} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    {q.isPublished ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                  </button>
                )}
                <button onClick={() => remove(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {q.answer ? (
              <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 text-sm">
                <p className="text-xs font-semibold text-green-700 mb-1 uppercase tracking-wide">Answer</p>
                <p className="text-gray-700">{q.answer}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={drafts[q.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                  placeholder="Type your answer…"
                  className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  onClick={() => submitAnswer(q.id)}
                  disabled={!drafts[q.id]?.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-40 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" /> Publish Answer
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
