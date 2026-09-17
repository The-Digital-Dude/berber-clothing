"use client"
import { useState } from "react"
import { Gift, Mail, User, MessageSquare, CheckCircle } from "lucide-react"

const DENOMINATIONS = [500, 1000, 2000, 5000]

export default function GiftCardStore() {
  const [amount, setAmount] = useState<number>(1000)
  const [form, setForm] = useState({
    recipientEmail: "",
    recipientName: "",
    senderName: "",
    senderEmail: "",
    message: "",
  })
  const [step, setStep] = useState<"select" | "details" | "done">("select")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ code: string; amount: number } | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/store/gift-card/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, ...form }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
    setResult(data)
    setStep("done")
  }

  if (step === "done" && result) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Gift Card Sent!</h1>
        <p className="text-gray-500 mb-8">
          A ৳{result.amount.toLocaleString()} gift card has been emailed to <strong>{form.recipientEmail}</strong>.
        </p>
        <div className="bg-[#f9f5ef] rounded-2xl p-8 mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Gift Card Code</p>
          <p className="font-mono text-2xl font-bold tracking-widest text-[#0f0e0c]">{result.code}</p>
          <p className="text-[#c9a84c] text-xl font-bold mt-3">৳{result.amount.toLocaleString()}</p>
        </div>
        <button
          onClick={() => { setStep("select"); setForm({ recipientEmail:"", recipientName:"", senderName:"", senderEmail:"", message:"" }); setResult(null) }}
          className="px-6 py-3 border rounded-xl text-sm font-medium hover:bg-gray-50"
        >
          Send Another
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#f9f5ef] rounded-2xl mb-4">
          <Gift className="w-8 h-8 text-[#c9a84c]" />
        </div>
        <h1 className="text-4xl font-bold mb-3">Gift Cards</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Give the gift of choice. Berber gift cards are delivered instantly by email and valid for one year.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Left — preview card */}
        <div className="flex flex-col gap-6">
          <div className="relative bg-[#0f0e0c] rounded-3xl p-8 overflow-hidden aspect-[1.6/1] flex flex-col justify-between">
            {/* Decorative circles */}
            <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-[#c9a84c]/10" />
            <div className="absolute -right-4 -bottom-12 w-56 h-56 rounded-full bg-[#c9a84c]/5" />
            <div className="relative">
              <p className="text-[#c9a84c] font-bold text-xl tracking-[0.3em] uppercase">Berber</p>
              <p className="text-white/40 text-xs mt-1 tracking-widest">GIFT CARD</p>
            </div>
            <div className="relative flex items-end justify-between">
              <div>
                <p className="text-white/40 text-xs mb-1">Value</p>
                <p className="text-white text-4xl font-bold">৳{amount.toLocaleString()}</p>
              </div>
              {form.recipientName && (
                <div className="text-right">
                  <p className="text-white/40 text-xs mb-1">For</p>
                  <p className="text-white font-medium">{form.recipientName}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#f9f5ef] rounded-2xl p-5 text-sm text-gray-600 space-y-2">
            <p className="font-medium text-gray-900">How it works</p>
            <ul className="space-y-1.5 list-none">
              {["Choose a denomination below", "Fill in the recipient's details", "They receive the code by email instantly", "They enter the code at checkout to redeem"].map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#c9a84c]/20 text-[#c9a84c] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right — form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount picker */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Amount</label>
            <div className="grid grid-cols-4 gap-2">
              {DENOMINATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setAmount(d)}
                  className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                    amount === d
                      ? "border-[#0f0e0c] bg-[#0f0e0c] text-white"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  ৳{d >= 1000 ? `${d/1000}k` : d}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><Mail className="w-4 h-4" /> Recipient</p>
            <input
              required
              type="email"
              placeholder="recipient@email.com"
              value={form.recipientEmail}
              onChange={set("recipientEmail")}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f0e0c]/20"
            />
            <input
              type="text"
              placeholder="Recipient's name (optional)"
              value={form.recipientName}
              onChange={set("recipientName")}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f0e0c]/20"
            />
          </div>

          {/* Sender */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5"><User className="w-4 h-4" /> From (optional)</p>
            <input
              type="text"
              placeholder="Your name"
              value={form.senderName}
              onChange={set("senderName")}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f0e0c]/20"
            />
            <input
              type="email"
              placeholder="your@email.com (get a confirmation)"
              value={form.senderEmail}
              onChange={set("senderEmail")}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f0e0c]/20"
            />
          </div>

          {/* Message */}
          <div>
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2"><MessageSquare className="w-4 h-4" /> Personal message (optional)</p>
            <textarea
              rows={3}
              placeholder="Write a short note…"
              value={form.message}
              onChange={set("message")}
              className="w-full border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0f0e0c]/20"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0f0e0c] text-white rounded-xl font-bold text-sm tracking-wide disabled:opacity-50 hover:bg-[#c9a84c] transition-colors"
          >
            {loading ? "Sending…" : `Send ৳${amount.toLocaleString()} Gift Card`}
          </button>

          <p className="text-center text-xs text-gray-400">
            Gift cards are non-refundable and valid for 1 year from purchase.
          </p>
        </form>
      </div>
    </div>
  )
}
