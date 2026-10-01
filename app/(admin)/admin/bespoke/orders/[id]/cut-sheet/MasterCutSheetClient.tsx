"use client"

import { useEffect } from "react"
import { Printer, Scissors, ArrowLeft, Check, QrCode } from "lucide-react"
import Link from "next/link"

export default function MasterCutSheetClient({ order }: { order: any }) {
  const specs = typeof order.designSpecs === "string" ? JSON.parse(order.designSpecs) : order.designSpecs
  const measurements =
    typeof order.customMeasurements === "string"
      ? JSON.parse(order.customMeasurements)
      : order.customMeasurements || order.measurementProfile || {}

  const printDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="bg-white text-black min-h-screen p-4 md:p-8 font-mono text-xs selection:bg-black selection:text-white">
      {/* Print Controls (Hidden on Print) */}
      <div className="print:hidden max-w-4xl mx-auto mb-6 flex justify-between items-center bg-neutral-900 text-white p-4 rounded-xl shadow-lg">
        <Link
          href="/admin/bespoke/orders"
          className="inline-flex items-center gap-2 text-xs font-sans text-neutral-300 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Workshop Pipeline
        </Link>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-sans font-bold px-4 py-2 rounded-lg text-xs transition shadow"
        >
          <Printer className="w-4 h-4" />
          Print Master Cut Sheet (A4)
        </button>
      </div>

      {/* Printable Sheet Wrapper */}
      <div className="max-w-4xl mx-auto border-2 border-black p-8 shadow-sm print:p-0 print:border-none">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="w-5 h-5 text-black" />
              <span className="text-xl font-bold tracking-widest uppercase font-serif">
                BERBER BESPOKE ATELIER
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-600">
              Master Tailor Specification & Pattern Cutting Blueprint
            </p>
            <p className="text-[10px] text-neutral-500">Banani Flagship Atelier, Dhaka • +880 1700-000000</p>
          </div>

          <div className="text-right">
            <div className="border border-black px-3 py-1 text-center mb-1">
              <span className="text-[9px] uppercase block text-neutral-500">Commission Code</span>
              <span className="text-base font-bold tracking-wider">{order.orderNumber}</span>
            </div>
            <span className="text-[10px] text-neutral-500 block">Date Issued: {printDate}</span>
          </div>
        </div>

        {/* Client & Garment Overview Table */}
        <div className="grid grid-cols-2 border border-black mb-4">
          <div className="p-3 border-r border-black space-y-1">
            <span className="text-[9px] uppercase font-bold text-neutral-500 block">Client Profile</span>
            <div className="text-sm font-bold">{order.user?.name || "Bespoke Client"}</div>
            <div>Phone: {order.user?.phone || "N/A"}</div>
            <div>Email: {order.user?.email || "N/A"}</div>
          </div>

          <div className="p-3 space-y-1">
            <span className="text-[9px] uppercase font-bold text-neutral-500 block">Garment Architecture</span>
            <div className="text-sm font-bold">{order.garmentType.replace(/_/g, " ")}</div>
            <div>Cut / Silhouette: <strong className="uppercase">{specs.silhouette || "Slim Sartorial"}</strong></div>
            <div>Canvas: <strong>{specs.canvasType || "Half Canvas"}</strong></div>
          </div>
        </div>

        {/* Technical Cloth & Material Specifications */}
        <div className="border border-black mb-4">
          <div className="bg-neutral-100 border-b border-black px-3 py-1.5 font-bold uppercase text-[10px]">
            1. Cloth & Trimmings Specification
          </div>
          <div className="p-3 grid grid-cols-3 gap-3">
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block">Selected Cloth & Mill</span>
              <strong className="text-xs block">{specs.fabric?.name || "Standard Wool"}</strong>
              <span className="text-[10px] text-neutral-600">{specs.fabric?.millName || "Italy"}</span>
            </div>
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block">Composition & Count</span>
              <strong className="text-xs block">{specs.fabric?.composition || "100% Wool"}</strong>
              <span className="text-[10px] text-neutral-600">{specs.fabric?.superCount || "Super 150s"} • {specs.fabric?.weightGsm || "270"}gsm</span>
            </div>
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block">Required Meterage</span>
              <strong className="text-xs block">
                {order.garmentType === "THREE_PIECE_SUIT" ? "3.85 Meters" : "3.25 Meters"}
              </strong>
              <span className="text-[10px] text-neutral-600">Pre-shrunk & steamed</span>
            </div>
          </div>
          <div className="border-t border-black p-3 grid grid-cols-3 gap-3 bg-neutral-50/50">
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block">Interior Silk Lining</span>
              <strong className="text-xs block">{specs.lining || "Midnight Navy Bemberg"}</strong>
            </div>
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block">Button Specification</span>
              <strong className="text-xs block">{specs.button || "Dark Horn Buttons"}</strong>
            </div>
            <div>
              <span className="text-[9px] text-neutral-500 uppercase block">Waistband & Hem</span>
              <strong className="text-xs block">{specs.trousers?.waistband || "Side Adjusters"}</strong>
              <span className="text-[10px] text-neutral-600">{specs.trousers?.hem || "Clean Plain"}</span>
            </div>
          </div>
          {specs.waistcoat && (
            <div className="border-t border-black p-3 grid grid-cols-3 gap-3 bg-neutral-100/70">
              <div>
                <span className="text-[9px] text-neutral-500 uppercase block font-bold">Waistcoat / Vest Style</span>
                <strong className="text-xs block">{specs.waistcoat.style}</strong>
                <span className="text-[10px] text-neutral-600">{specs.waistcoat.fabric || "Matching Cloth"}</span>
              </div>
              <div>
                <span className="text-[9px] text-neutral-500 uppercase block font-bold">Vest Pockets</span>
                <strong className="text-xs block">{specs.waistcoat.pockets}</strong>
              </div>
              <div>
                <span className="text-[9px] text-neutral-500 uppercase block font-bold">Vest Rear & Cinch</span>
                <strong className="text-xs block">{specs.waistcoat.back}</strong>
              </div>
            </div>
          )}
        </div>

        {/* 14-Point Anatomical Master Dimensions */}
        <div className="border border-black mb-4">
          <div className="bg-neutral-100 border-b border-black px-3 py-1.5 font-bold uppercase text-[10px] flex justify-between">
            <span>2. Master Cutter Dimensions (Unit: Inches)</span>
            <span className="text-neutral-500 text-[9px]">Posture: {measurements.shoulderType || "Normal"} Shoulder • {measurements.postureType || "Regular"} Spine</span>
          </div>

          <div className="p-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-300 text-[9px] text-neutral-500 uppercase">
                  <th className="py-1">Measurement Point</th>
                  <th className="py-1">Recorded Body</th>
                  <th className="py-1">Allowance / Ease</th>
                  <th className="py-1">Final Cut Dim</th>
                  <th className="py-1 text-right">Verified (✓)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="py-1.5 font-bold">Neck Circumference</td>
                  <td>{measurements.neck || "16.0"}"</td>
                  <td>+0.5"</td>
                  <td className="font-bold">{measurements.neck ? Number(measurements.neck) + 0.5 : "16.5"}"</td>
                  <td className="text-right">[ &nbsp; ]</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold">Chest (Fullest Point)</td>
                  <td>{measurements.chest || "40.0"}"</td>
                  <td>+3.5" (Slim Ease)</td>
                  <td className="font-bold">{measurements.chest ? Number(measurements.chest) + 3.5 : "43.5"}"</td>
                  <td className="text-right">[ &nbsp; ]</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold">Stomach / Waist</td>
                  <td>{measurements.stomach || "35.0"}"</td>
                  <td>+2.5"</td>
                  <td className="font-bold">{measurements.stomach ? Number(measurements.stomach) + 2.5 : "37.5"}"</td>
                  <td className="text-right">[ &nbsp; ]</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold">Shoulder Width (Bone to Bone)</td>
                  <td>{measurements.shoulderWidth || "18.5"}"</td>
                  <td>Exact Cut</td>
                  <td className="font-bold">{measurements.shoulderWidth || "18.5"}"</td>
                  <td className="text-right">[ &nbsp; ]</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold">Sleeve Length (Shoulder to Cuff)</td>
                  <td>{measurements.sleeveLength || "25.0"}"</td>
                  <td>+1.5" Inlay</td>
                  <td className="font-bold">{measurements.sleeveLength || "25.0"}"</td>
                  <td className="text-right">[ &nbsp; ]</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold">Jacket Finished Length</td>
                  <td>{measurements.jacketLength || "29.5"}"</td>
                  <td>Exact</td>
                  <td className="font-bold">{measurements.jacketLength || "29.5"}"</td>
                  <td className="text-right">[ &nbsp; ]</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold">Trouser Waist</td>
                  <td>{measurements.trouserWaist || "34.0"}"</td>
                  <td>+0.5" Ease</td>
                  <td className="font-bold">{measurements.trouserWaist ? Number(measurements.trouserWaist) + 0.5 : "34.5"}"</td>
                  <td className="text-right">[ &nbsp; ]</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-bold">Trouser Inseam / Outseam</td>
                  <td>{measurements.inseam || "31.0"}" / {measurements.outseam || "41.0"}"</td>
                  <td>+2.0" Hem Inlay</td>
                  <td className="font-bold">{measurements.inseam || "31.0"}"</td>
                  <td className="text-right">[ &nbsp; ]</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Monogram & Special Workshop Instructions */}
        <div className="grid grid-cols-2 border border-black mb-4">
          <div className="p-3 border-r border-black space-y-1">
            <span className="text-[9px] uppercase font-bold text-neutral-500 block">
              3. Monogramming & Embroidery
            </span>
            {specs.monogram ? (
              <div>
                <div className="text-sm font-bold tracking-widest text-black border border-black p-2 text-center bg-neutral-50">
                  {specs.monogram.text}
                </div>
                <div className="text-[10px] mt-1 text-neutral-600">
                  Font: {specs.monogram.font} • Thread: {specs.monogram.color} • Position: Inside Right Chest Pocket
                </div>
              </div>
            ) : (
              <div className="text-neutral-400 italic">No monogram requested for this commission.</div>
            )}
          </div>

          <div className="p-3 space-y-1">
            <span className="text-[9px] uppercase font-bold text-neutral-500 block">
              4. Cutter & Fitting Verification
            </span>
            <div className="space-y-1.5 pt-1 text-[10px]">
              <div className="flex justify-between">
                <span>Pattern Drafter:</span>
                <span className="border-b border-black w-32 inline-block"></span>
              </div>
              <div className="flex justify-between">
                <span>Master Cutter:</span>
                <span className="border-b border-black w-32 inline-block"></span>
              </div>
              <div className="flex justify-between">
                <span>Baste Fitting Tailor:</span>
                <span className="border-b border-black w-32 inline-block"></span>
              </div>
              <div className="flex justify-between">
                <span>QA Passed Sign:</span>
                <span className="border-b border-black w-32 inline-block"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 text-[9px] text-neutral-500 uppercase border-t border-neutral-300">
          This document is the master proprietary cutting spec of Berber Bespoke Tailoring House. Handle with care.
        </div>
      </div>
    </div>
  )
}
