"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Scissors,
  CheckCircle2,
  ChevronRight,
  Phone,
  Mail,
  User,
  Coffee,
  ShieldCheck,
  ArrowRight,
  MessageSquare,
  Building,
  Info,
} from "lucide-react"
import Link from "next/link"

const PURPOSES = [
  {
    id: "INITIAL_CONSULTATION_AND_MEASUREMENT",
    title: "Initial Bespoke Fitting & Measurement",
    subtitle: "Full 30+ anatomical measurement session, master fabric swatch review & silhouette consultation.",
    duration: "45 mins",
    icon: Scissors,
    tag: "Recommended for New Clients",
  },
  {
    id: "BASTE_TRIAL_FITTING",
    title: "Baste / Muslin Trial Suit Fitting",
    subtitle: "Try your unfinished canvas structure in-person to fine-tune posture balance and chest drape.",
    duration: "30 mins",
    icon: Sparkles,
    tag: "Existing Orders",
  },
  {
    id: "FINAL_FITTING_AND_PICKUP",
    title: "Final Fitting & Suit Collection",
    subtitle: "Final inspection, try-on in our VIP lounge, and collection with premium garment bag & wooden hanger.",
    duration: "30 mins",
    icon: CheckCircle2,
    tag: "Suit Ready",
  },
  {
    id: "GENERAL_STYLING",
    title: "VIP Styling & Fabric Consultation",
    subtitle: "Browse physical swatches from Italian & English mills with our senior sartorial stylist.",
    duration: "45 mins",
    icon: Coffee,
    tag: "Consultation Only",
  },
]

const GARMENT_INTERESTS = [
  "Two-Piece Bespoke Suit (Jacket + Trouser)",
  "Three-Piece Bespoke Suit (+ Waistcoat)",
  "Formal Tuxedo / Black Tie Dinner Suit",
  "Tailored Blazer / Sport Coat",
  "Bespoke Trousers / Chinos",
  "Bespoke Dress Shirt",
  "Wedding / Groom Party Package",
]

export default function AppointmentBookingClient() {
  const [selectedPurpose, setSelectedPurpose] = useState(PURPOSES[0].id)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<{ slot: string; available: boolean; remainingCapacity: number }[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string>("")
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false)

  // Form Fields
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [garmentInterest, setGarmentInterest] = useState(GARMENT_INTERESTS[0])
  const [eventDate, setEventDate] = useState("")
  const [notes, setNotes] = useState("")

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmedBooking, setConfirmedBooking] = useState<{
    appointment: any
    formattedDate: string
    purposeLabel: string
    waLink: string
  } | null>(null)

  // Generate next 14 days for date picker
  const dates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + (i === 0 ? 1 : i + 1)) // starting tomorrow
    const isoDate = d.toISOString().split("T")[0]
    return {
      iso: isoDate,
      dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString("en-US", { month: "short" }),
    }
  })

  // Set default date to tomorrow on mount
  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      setSelectedDate(dates[0].iso)
    }
  }, [dates, selectedDate])

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    if (!selectedDate) return

    setIsLoadingSlots(true)
    setSelectedSlot("")

    fetch(`/api/bespoke/appointments?date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.slots) {
          setAvailableSlots(data.slots)
          // Auto-select first available slot
          const firstAvailable = data.slots.find((s: any) => s.available)
          if (firstAvailable) setSelectedSlot(firstAvailable.slot)
        }
      })
      .catch((err) => {
        console.error("Error loading appointment slots:", err)
      })
      .finally(() => {
        setIsLoadingSlots(false)
      })
  }, [selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!selectedDate || !selectedSlot) {
      setSubmitError("Please select an appointment date and time slot.")
      return
    }

    if (!name || !phone) {
      setSubmitError("Please provide your name and phone number.")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/bespoke/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentDate: selectedDate,
          timeSlot: selectedSlot,
          purpose: selectedPurpose,
          garmentInterest,
          guestName: name,
          guestPhone: phone,
          guestEmail: email || null,
          eventDate: eventDate || null,
          notes: notes || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to book appointment.")
      }

      setConfirmedBooking(data)
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render Confirmation State
  if (confirmedBooking) {
    return (
      <div className="w-full bg-berber-bg min-h-screen text-berber-text py-12 md:py-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-berber-surface border border-berber-gold/40 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
            {/* Header Stamp */}
            <div className="text-center space-y-3 mb-8">
              <div className="w-16 h-16 bg-berber-gold/15 text-berber-gold border border-berber-gold/30 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-xs uppercase tracking-[0.25em] text-berber-gold font-bold">
                Atelier Fitting Confirmed
              </p>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-berber-black mb-3">
                We Look Forward to Welcoming You
              </h1>
              <p className="text-berber-text-muted text-sm max-w-lg mx-auto">
                Your appointment has been logged in our master atelier schedule. Our Master Tailor and VIP styling team will have fabrics and fitting suites prepared.
              </p>
            </div>

            {/* Appointment Ticket Details */}
            <div className="bg-berber-muted/60 border border-berber-border rounded-2xl p-6 mb-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-berber-border text-sm">
                <div>
                  <span className="text-berber-text-muted text-xs block uppercase">Client Name</span>
                  <span className="font-semibold text-berber-black">{name}</span>
                </div>
                <div>
                  <span className="text-berber-text-muted text-xs block uppercase">Contact Phone</span>
                  <span className="font-semibold text-berber-black">{phone}</span>
                </div>
                <div>
                  <span className="text-berber-text-muted text-xs block uppercase">Date & Time</span>
                  <span className="font-semibold text-berber-gold">
                    {confirmedBooking.formattedDate} ({selectedSlot})
                  </span>
                </div>
                <div>
                  <span className="text-berber-text-muted text-xs block uppercase">Service</span>
                  <span className="font-semibold text-berber-black">{confirmedBooking.purposeLabel}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 text-sm text-berber-text-muted">
                <MapPin className="w-5 h-5 text-berber-gold shrink-0 mt-0.5" />
                <div>
                  <strong className="text-berber-black block">Berber Flagship Atelier & Tailoring House</strong>
                  House 12, Road 11, Block D, Banani, Dhaka, Bangladesh (Valet Parking Available)
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={confirmedBooking.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-7 py-3.5 rounded-full transition shadow-lg"
              >
                <MessageSquare className="w-5 h-5" />
                Open WhatsApp Confirmation
              </a>
              <Link
                href="/bespoke/builder"
                className="inline-flex items-center justify-center gap-2 bg-berber-gold hover:bg-yellow-600 text-white font-bold px-7 py-3.5 rounded-full transition shadow-md"
              >
                <Scissors className="w-5 h-5" />
                Explore Suit Studio Online
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const activePurposeObj = PURPOSES.find((p) => p.id === selectedPurpose)

  return (
    <div className="w-full bg-berber-bg min-h-screen text-berber-text">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-berber-gold/15 border border-berber-gold/30 text-berber-black px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <Building className="w-3.5 h-3.5 text-berber-gold" />
            Flagship Showroom & Master Atelier
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-berber-black tracking-tight mb-4">
            Book a Private Bespoke Fitting
          </h1>
          <p className="text-berber-text-muted text-base md:text-lg leading-relaxed">
            Experience timeless bespoke tailoring at our Banani Flagship Atelier. Meet our Master Tailors for 1-on-1 precision body measurement, luxury cloth tactile exploration, and styling consultation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form & Stepper */}
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Select Appointment Purpose */}
            <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 shadow-berber">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-berber-border">
                <span className="w-7 h-7 bg-berber-gold text-white text-xs font-bold rounded-full flex items-center justify-center">
                  1
                </span>
                <h2 className="text-xl font-heading font-bold text-berber-black">Select Consultation Purpose</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PURPOSES.map((p) => {
                  const Icon = p.icon
                  const isSelected = selectedPurpose === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPurpose(p.id)}
                      className={`text-left p-5 rounded-2xl border transition-all duration-200 relative ${
                        isSelected
                          ? "bg-berber-gold/10 border-berber-gold shadow-sm ring-1 ring-berber-gold"
                          : "bg-white border-berber-border hover:border-neutral-300 text-berber-text"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-xl ${isSelected ? "bg-berber-gold text-white" : "bg-berber-muted text-berber-black"}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-medium text-berber-gold bg-berber-gold/15 px-2.5 py-0.5 rounded-full border border-berber-gold/20">
                          {p.duration}
                        </span>
                      </div>
                      <h3 className="font-bold text-berber-black text-base mb-1">{p.title}</h3>
                      <p className="text-xs text-berber-text-muted leading-relaxed">{p.subtitle}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Date & Slot Picker */}
            <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 shadow-berber">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-berber-border">
                <span className="w-7 h-7 bg-berber-gold text-white text-xs font-bold rounded-full flex items-center justify-center">
                  2
                </span>
                <h2 className="text-xl font-heading font-bold text-berber-black">Select Date & Preferred Time Slot</h2>
              </div>

              {/* Date Scroll Bar */}
              <div className="mb-6">
                <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                  Available Dates (Next 14 Days)
                </label>
                <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-neutral-300">
                  {dates.map((d) => {
                    const isSelected = selectedDate === d.iso
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setSelectedDate(d.iso)}
                        className={`shrink-0 w-20 py-3 px-2 rounded-2xl border text-center transition ${
                          isSelected
                            ? "bg-berber-gold text-white font-bold border-berber-gold shadow-md shadow-berber-gold/20"
                            : "bg-white border-berber-border text-berber-text hover:border-neutral-300 hover:text-berber-black"
                        }`}
                      >
                        <span className={`text-[11px] block uppercase ${isSelected ? "text-white/90 font-semibold" : "text-berber-text-muted"}`}>
                          {d.dayName}
                        </span>
                        <span className="text-xl font-bold block my-0.5">{d.dayNum}</span>
                        <span className={`text-[10px] block uppercase ${isSelected ? "text-white/80" : "text-neutral-400"}`}>
                          {d.monthName}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time Slot Grid */}
              <div>
                <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                  Select 45-Minute Atelier Fitting Slot
                </label>

                {isLoadingSlots ? (
                  <div className="py-8 text-center text-berber-text-muted text-sm animate-pulse">
                    Checking Master Tailor calendar availability...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="py-6 text-center text-berber-text-muted text-sm">
                    Please select a date above to load available atelier slots.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableSlots.map((item) => {
                      const isSelected = selectedSlot === item.slot
                      return (
                        <button
                          key={item.slot}
                          type="button"
                          disabled={!item.available}
                          onClick={() => setSelectedSlot(item.slot)}
                          className={`py-3 px-3.5 rounded-2xl border text-xs font-medium transition flex flex-col items-center justify-center gap-1 ${
                            !item.available
                              ? "bg-neutral-100 border-neutral-200 text-neutral-400 cursor-not-allowed line-through"
                              : isSelected
                              ? "bg-berber-gold text-white font-bold border-berber-gold shadow-md shadow-berber-gold/20"
                              : "bg-white border-berber-border text-berber-text hover:border-neutral-300 hover:text-berber-black"
                          }`}
                        >
                          <Clock className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-berber-gold"}`} />
                          <span>{item.slot}</span>
                          {item.available && (
                            <span className={`text-[10px] ${isSelected ? "text-white/90" : "text-berber-text-muted"}`}>
                              {item.remainingCapacity} VIP slot left
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Guest & Tailoring Details */}
            <form onSubmit={handleSubmit} className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 space-y-6 shadow-berber">
              <div className="flex items-center gap-3 pb-4 border-b border-berber-border">
                <span className="w-7 h-7 bg-berber-gold text-white text-xs font-bold rounded-full flex items-center justify-center">
                  3
                </span>
                <h2 className="text-xl font-heading font-bold text-berber-black">Guest Profile & Tailoring Interests</h2>
              </div>

              {submitError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-berber-text-muted absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Mahfuzur Rahman"
                      className="w-full bg-white border border-berber-border rounded-2xl pl-10 pr-4 py-3 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-2">
                    Phone Number (for WhatsApp Confirmation) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-berber-text-muted absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full bg-white border border-berber-border rounded-2xl pl-10 pr-4 py-3 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-2">
                    Email Address (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-berber-text-muted absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mahfuz@example.com"
                      className="w-full bg-white border border-berber-border rounded-2xl pl-10 pr-4 py-3 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-2">
                    Garment of Interest
                  </label>
                  <select
                    value={garmentInterest}
                    onChange={(e) => setGarmentInterest(e.target.value)}
                    className="w-full bg-white border border-berber-border rounded-2xl px-4 py-3 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                  >
                    {GARMENT_INTERESTS.map((g) => (
                      <option key={g} value={g} className="bg-white text-black">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-2">
                    Upcoming Wedding / Event Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-white border border-berber-border rounded-2xl px-4 py-3 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-2">
                    Special Tailoring Notes / Requests
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Interested in Loro Piana Tasmanian wools"
                    className="w-full bg-white border border-berber-border rounded-2xl px-4 py-3 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-berber-gold hover:bg-yellow-600 disabled:opacity-50 text-white font-bold py-4 rounded-full text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-berber-gold/20"
                >
                  {isSubmitting ? (
                    <span>Confirming Atelier Reservation...</span>
                  ) : (
                    <>
                      <span>Confirm Atelier Reservation</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-berber-text-muted mt-3">
                  No advance payment required for initial consultation & fitting sessions.
                </p>
              </div>
            </form>
          </div>

          {/* Right Column: Atelier Info Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 space-y-6 shadow-berber">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-berber-gold text-xs font-bold uppercase tracking-wider">
                  <Building className="w-4 h-4" />
                  Flagship Destination
                </div>
                <h3 className="text-xl font-heading font-bold text-berber-black">
                  Banani Atelier & VIP Lounge
                </h3>
                <p className="text-xs text-berber-text-muted leading-relaxed">
                  House 12, Road 11, Block D, Banani, Dhaka. Designed as an intimate sanctuary for bespoke menswear.
                </p>
              </div>

              <div className="border-t border-b border-berber-border py-4 space-y-3 text-xs text-berber-text">
                <div className="flex justify-between">
                  <span className="text-berber-text-muted">Opening Hours:</span>
                  <span className="font-semibold text-berber-black">11:00 AM – 9:30 PM (Daily)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-berber-text-muted">Master Tailor:</span>
                  <span className="font-semibold text-berber-black">Savile Row & Italian Trained</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-berber-text-muted">Cloth Library:</span>
                  <span className="font-semibold text-berber-gold">500+ Mill Swatches In-Store</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-berber-text-muted">Hospitality:</span>
                  <span className="font-semibold text-berber-black">Artisan Espresso Bar & Valet</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-berber-text-muted">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-berber-gold shrink-0 mt-0.5" />
                  <span>Complimentary alterations and lifetime pressing warranty on all bespoke commissions.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Coffee className="w-4 h-4 text-berber-gold shrink-0 mt-0.5" />
                  <span>Private fitting suites reserved exclusively for you during your 45-minute consultation.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
