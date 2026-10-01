"use client"

import { useState } from "react"
import {
  Scissors,
  Save,
  CheckCircle2,
  Info,
  ChevronRight,
  Sparkles,
  User,
  ShieldCheck,
  PlusCircle,
  HelpCircle,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const MEASUREMENT_FIELDS = [
  { key: "neck", label: "Neck Circumference", guide: "Measure around the base of the neck where the collar sits.", defaultVal: "16" },
  { key: "chest", label: "Chest Circumference", guide: "Measure around the fullest part of the chest under the armpits.", defaultVal: "40" },
  { key: "stomach", label: "Stomach / Midsection", guide: "Measure at the widest point of the stomach across the belly button.", defaultVal: "36" },
  { key: "shoulderWidth", label: "Shoulder Width", guide: "From the edge of the left shoulder bone straight across to the right.", defaultVal: "18.5" },
  { key: "sleeveLength", label: "Sleeve Length", guide: "From shoulder tip bone down over elbow to wrist bone.", defaultVal: "25" },
  { key: "bicep", label: "Bicep", guide: "Around the fullest part of the upper arm with arm relaxed.", defaultVal: "14" },
  { key: "jacketLength", label: "Jacket Length", guide: "From base of collar at back down to mid-crotch level.", defaultVal: "29.5" },
  { key: "trouserWaist", label: "Trouser Waist", guide: "Where you normally wear dress trousers (1-2\" below navel).", defaultVal: "34" },
  { key: "trouserHips", label: "Trouser Hips / Seat", guide: "Measure around the fullest part of the buttocks.", defaultVal: "40" },
  { key: "inseam", label: "Inseam Length", guide: "From the inner crotch seam straight down to bottom shoe contact.", defaultVal: "31" },
  { key: "outseam", label: "Outseam Length", guide: "From top waistband down outer leg to desired shoe break.", defaultVal: "41" },
  { key: "thigh", label: "Thigh Circumference", guide: "Measure around the fullest part of the upper thigh.", defaultVal: "24" },
  { key: "ankleOpening", label: "Ankle / Leg Opening", guide: "Standard tapered opening width around cuff.", defaultVal: "14.5" },
]

export default function MeasurementsClient({ initialProfiles = [] }: { initialProfiles: any[] }) {
  const [profiles, setProfiles] = useState<any[]>(initialProfiles)
  const [profileName, setProfileName] = useState("My Formal Bespoke Fit")
  const [unit, setUnit] = useState<"inch" | "cm">("inch")
  const [fitPreference, setFitPreference] = useState("SLIM")
  const [shoulderType, setShoulderType] = useState("NORMAL")
  const [postureType, setPostureType] = useState("REGULAR")

  const [formValues, setFormValues] = useState<Record<string, string>>({
    neck: "16",
    chest: "40",
    stomach: "35",
    shoulderWidth: "18.5",
    sleeveLength: "25",
    bicep: "14",
    jacketLength: "29.5",
    trouserWaist: "34",
    trouserHips: "40",
    inseam: "31",
    outseam: "41",
    thigh: "23.5",
    ankleOpening: "14.5",
  })

  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleFieldChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSavedSuccess(false)

    try {
      const payload: any = {
        profileName,
        unit,
        fitPreference,
        shoulderType,
        postureType,
        ...formValues,
      }

      const res = await fetch("/api/bespoke/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save profile.")

      toast.success("Measurement profile saved to your account!")
      setSavedSuccess(true)
      if (data.profile) {
        setProfiles([data.profile, ...profiles])
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full bg-berber-bg min-h-screen text-berber-text">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-berber-gold/15 border border-berber-gold/30 text-berber-black px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <Scissors className="w-3.5 h-3.5 text-berber-gold" />
            Precision Fit Guarantee
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-berber-black tracking-tight mb-3">
            14-Point Measurement Profile
          </h1>
          <p className="text-berber-text-muted text-sm md:text-base leading-relaxed">
            Record your exact anatomical dimensions for bespoke commissions. Once saved, your pattern blueprint is preserved for 1-click repeat orders.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Column */}
          <form onSubmit={handleSaveProfile} className="lg:col-span-8 bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 space-y-8 shadow-berber">
            {/* Profile Name & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-berber-border">
              <div>
                <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-2">
                  Profile Name
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. My Wedding Tuxedo Fit"
                  className="w-full bg-white border border-berber-border rounded-2xl px-4 py-3 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-2">
                  Measurement Unit
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUnit("inch")}
                    className={`py-2.5 rounded-full border text-xs font-bold transition ${
                      unit === "inch"
                        ? "bg-berber-gold text-white border-berber-gold shadow-sm"
                        : "bg-white text-berber-text border-berber-border"
                    }`}
                  >
                    Inches (in)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit("cm")}
                    className={`py-2.5 rounded-full border text-xs font-bold transition ${
                      unit === "cm"
                        ? "bg-berber-gold text-white border-berber-gold shadow-sm"
                        : "bg-white text-berber-text border-berber-border"
                    }`}
                  >
                    Centimeters (cm)
                  </button>
                </div>
              </div>
            </div>

            {/* Posture & Ergonomics */}
            <div>
              <h3 className="text-sm font-bold text-berber-black uppercase tracking-wider mb-4">
                Body Posture & Shoulder Slope
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-berber-text-muted block mb-1">Fit Preference</label>
                  <select
                    value={fitPreference}
                    onChange={(e) => setFitPreference(e.target.value)}
                    className="w-full bg-white border border-berber-border rounded-2xl px-3 py-2.5 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                  >
                    <option value="SLIM">Slim Sartorial Fit</option>
                    <option value="REGULAR">Classic Regular Fit</option>
                    <option value="RELAXED">Relaxed Drape</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-berber-text-muted block mb-1">Shoulder Slope</label>
                  <select
                    value={shoulderType}
                    onChange={(e) => setShoulderType(e.target.value)}
                    className="w-full bg-white border border-berber-border rounded-2xl px-3 py-2.5 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                  >
                    <option value="NORMAL">Regular Shoulder Angle</option>
                    <option value="SQUARE">Square / Athletic Shoulders</option>
                    <option value="SLOPING">Sloping Shoulders</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-berber-text-muted block mb-1">Spine Posture</label>
                  <select
                    value={postureType}
                    onChange={(e) => setPostureType(e.target.value)}
                    className="w-full bg-white border border-berber-border rounded-2xl px-3 py-2.5 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                  >
                    <option value="REGULAR">Regular Standing Posture</option>
                    <option value="ERECT">Military Erect Posture</option>
                    <option value="STOOPED">Forward Leaning Posture</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 14 Key Measurement Points */}
            <div>
              <h3 className="text-sm font-bold text-berber-black uppercase tracking-wider mb-4">
                Key Body Dimensions ({unit})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {MEASUREMENT_FIELDS.map((f) => (
                  <div key={f.key} className="bg-berber-muted/50 border border-berber-border rounded-2xl p-4 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-berber-black">{f.label}</label>
                      <span className="text-[10px] text-berber-gold font-mono uppercase font-bold">{unit}</span>
                    </div>
                    <input
                      type="number"
                      step="0.25"
                      required
                      value={formValues[f.key] || ""}
                      onChange={(e) => handleFieldChange(f.key, e.target.value)}
                      placeholder={f.defaultVal}
                      className="w-full bg-white border border-berber-border rounded-xl px-3 py-2 text-xs text-berber-black font-mono focus:outline-none focus:border-berber-gold"
                    />
                    <p className="text-[10px] text-berber-text-muted leading-tight">{f.guide}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-berber-gold hover:bg-yellow-600 text-white font-bold py-4 rounded-full text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-berber-gold/20"
            >
              {isSaving ? (
                <span>Saving Profile...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Measurement Profile</span>
                </>
              )}
            </button>
          </form>

          {/* Right Info & Atelier Option */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 space-y-4 shadow-berber">
              <h3 className="text-base font-heading font-bold text-berber-black">Prefer In-Person Precision?</h3>
              <p className="text-xs text-berber-text-muted leading-relaxed">
                Don't want to measure yourself? You can book a complimentary fitting session at our Flagship Atelier in Banani, Dhaka.
              </p>
              <Link
                href="/bespoke/book-appointment"
                className="w-full inline-flex items-center justify-center gap-2 bg-berber-gold/15 hover:bg-berber-gold/25 text-berber-black border border-berber-gold/30 px-5 py-3 rounded-full text-xs font-bold transition"
              >
                Book Flagship Atelier Fitting
              </Link>
            </div>

            <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 space-y-3 text-xs text-berber-text-muted shadow-berber">
              <h4 className="text-berber-black font-bold text-sm">Perfect Fit Guarantee</h4>
              <p className="leading-relaxed">
                Every garment handcrafted from your measurement profile includes complimentary in-house adjustments at our atelier.
              </p>
              <div className="pt-2">
                <Link href="/bespoke/builder" className="text-berber-gold hover:text-yellow-700 font-semibold flex items-center gap-1">
                  Launch Suit Configurator <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
