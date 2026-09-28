"use client"

import { useState, useEffect } from "react"
import { Zap } from "lucide-react"

function getTimeLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s }
}

export default function FlashSaleCountdown({
  saleName,
  discountLabel,
  endsAt,
  compact = false,
}: {
  saleName: string
  discountLabel: string
  endsAt: string
  compact?: boolean
}) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endsAt))

  useEffect(() => {
    const id = setInterval(() => {
      const t = getTimeLeft(endsAt)
      setTimeLeft(t)
      if (!t) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  if (!timeLeft) return null

  const pad = (n: number) => String(n).padStart(2, "0")

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-2xs font-mono">
        <Zap className="w-3 h-3 fill-amber-300 text-amber-300 animate-pulse" />
        <span>{discountLabel}</span>
        <span>·</span>
        <span>
          {timeLeft.d > 0 && `${timeLeft.d}d `}
          {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
        </span>
      </span>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-rose-950/90 via-zinc-900 to-amber-950/80 border border-rose-500/30 rounded-2xl shadow-sm text-white">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-500/40 flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 text-rose-400 fill-amber-400" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-rose-300 flex items-center gap-1.5">
            <span>{saleName}</span>
            <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[9px] font-extrabold">LIVE</span>
          </p>
          <p className="text-xs text-zinc-300 mt-0.5 font-medium">{discountLabel} applied automatically at checkout</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 font-mono font-black text-xs text-white shrink-0 self-end sm:self-auto">
        <span className="text-[10px] text-zinc-400 uppercase font-sans font-bold mr-1">Ends in:</span>
        {timeLeft.d > 0 && (
          <>
            <span className="bg-zinc-800/90 border border-zinc-700 px-2 py-1 rounded-lg">{timeLeft.d}d</span>
            <span className="text-zinc-500">:</span>
          </>
        )}
        <span className="bg-zinc-800/90 border border-zinc-700 px-2 py-1 rounded-lg">{pad(timeLeft.h)}h</span>
        <span className="text-zinc-500">:</span>
        <span className="bg-zinc-800/90 border border-zinc-700 px-2 py-1 rounded-lg">{pad(timeLeft.m)}m</span>
        <span className="text-zinc-500">:</span>
        <span className="bg-rose-600/90 border border-rose-500 px-2 py-1 rounded-lg text-white">{pad(timeLeft.s)}s</span>
      </div>
    </div>
  )
}
