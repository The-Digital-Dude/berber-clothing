"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Scissors,
  Sparkles,
  Layers,
  Check,
  ChevronRight,
  ChevronLeft,
  Calendar,
  ShoppingBag,
  ShieldCheck,
  Building,
  Info,
  User,
  Phone,
  Mail,
  Palette,
  Eye,
  RotateCcw,
  Sparkle,
  ArrowRight,
  HelpCircle,
  Maximize2,
  Minimize2,
  RefreshCw,
  Compass,
  Shirt,
  X,
  ZoomIn,
} from "lucide-react"
import Link from "next/link"

// Config Options
const GARMENT_TYPES = [
  { id: "BLAZER_ONLY", name: "Artisan Blazer / Sport Coat", desc: "1-Piece Standalone Tailored Jacket", basePrice: 16000 },
  { id: "BLAZER_WAISTCOAT", name: "Blazer with Waistcoat", desc: "2-Piece Set: Tailored Jacket & Bespoke Waistcoat", basePrice: 22000 },
  { id: "THREE_PIECE_SUIT", name: "Blazer with Waistcoat & Trousers", desc: "3-Piece Complete Suit: Jacket, Waistcoat & Trousers", basePrice: 28000 },
]

const SILHOUETTES = [
  { id: "SLIM", name: "Slim Sartorial Cut", desc: "Close-fitting chest, tapered waist and clean modern silhouette." },
  { id: "CLASSIC", name: "Modern Classic Fit", desc: "Timeless drape with balanced comfort and sharp British tailoring." },
  { id: "RELAXED", name: "Relaxed Florentine Cut", desc: "Soft unconstructed shoulders with effortless Italian drape." },
]

const BREASTING = [
  { id: "SB_2", name: "Single Breasted (2 Buttons)", desc: "The versatile gold standard for all occasions." },
  { id: "SB_1", name: "Single Breasted (1 Button)", desc: "Deep V-stance, ideal for evening and black tie." },
  { id: "DB_6_2", name: "Double Breasted (6x2)", desc: "Bold, commanding, and impeccably formal." },
]

const LAPELS = [
  { id: "NOTCH", name: "Notch Lapel (3.25\")", desc: "Classic and versatile for daily business and events." },
  { id: "PEAK", name: "Peak Lapel (3.75\")", desc: "Elongates the silhouette, broadening the chest." },
  { id: "SHAWL", name: "Shawl Satin Collar", desc: "Smooth rounded sweep for black-tie dinner suits." },
]

const POCKETS = [
  { id: "FLAP", name: "Standard Flap Pockets", desc: "Traditional and formal." },
  { id: "SLANTED_TICKET", name: "Slanted with Ticket Pocket (+৳800)", desc: "British equestrian flair with coin pocket.", price: 800 },
  { id: "JETTED", name: "Double Jetted (No Flap)", desc: "Ultra-clean minimalist tuxedo styling." },
  { id: "PATCH", name: "Neapolitan Patch Pockets", desc: "Relaxed Mediterranean casual luxury." },
]

const VENTS = [
  { id: "SIDE_DUAL", name: "Dual Side Vents", desc: "Maximum mobility and classic drape when seated." },
  { id: "CENTER", name: "Single Center Vent", desc: "Traditional American style." },
  { id: "NONE", name: "Ventless Back", desc: "Sleek formal tuxedo finish." },
]

const BUTTONS = [
  { id: "HORN_DARK", name: "Dark Water Buffalo Horn", color: "#222222", price: 0 },
  { id: "HORN_AMBER", name: "Amber Tortoise Horn", color: "#8b5a2b", price: 500 },
  { id: "COROZO_NAVY", name: "Ecuadorian Corozo Nut (Navy)", color: "#1b2838", price: 600 },
  { id: "MOP_SMOKE", name: "Mother of Pearl (Smoked)", color: "#4a4e58", price: 1200 },
  { id: "ANTIQUE_BRASS", name: "Embossed Antique Brass (Blazer)", color: "#c5a059", price: 1500 },
]

const LININGS = [
  { id: "SILK_NAVY", name: "Midnight Navy Bemberg Silk", color: "#141c2b", price: 0 },
  { id: "SILK_CRIMSON", name: "Imperial Crimson Bemberg Silk", color: "#6b1426", price: 800 },
  { id: "PAISLEY_GOLD", name: "Royal Gold Jacquard Paisley", color: "#b38f4d", price: 1500 },
  { id: "FLORAL_ART", name: "Artisanal Botanical Print Silk", color: "#2e4036", price: 1800 },
]

const TROUSER_WAISTBANDS = [
  { id: "SIDE_ADJUSTERS", name: "Side Metal Adjusters (Beltless Clean Look)", price: 600 },
  { id: "GURKHA", name: "Extended Gurkha Cross-Over Waistband", price: 1200 },
  { id: "BELT_LOOPS", name: "Traditional Belt Loops", price: 0 },
]

const TROUSER_PLEATS = [
  { id: "FLAT", name: "Flat Front (No Pleats)", desc: "Streamlined contemporary cut." },
  { id: "SINGLE_PLEAT", name: "Single Forward Pleat", desc: "Adds comfortable room through the thighs." },
  { id: "DOUBLE_PLEAT", name: "Double Classic Pleats", desc: "Vintage sartorial elegance." },
]

const TROUSER_HEMS = [
  { id: "PLAIN", name: "Plain Clean Hem", desc: "Standard no-break or slight break." },
  { id: "CUFF_1_5", name: "1.5\" Classic Turn-Up Cuffs", desc: "Weights the hem for a razor-sharp crease.", price: 400 },
  { id: "CUFF_2", name: "2\" Sartorial Wide Cuffs", desc: "Bold Italian statement cuff.", price: 500 },
]

// Bespoke Waistcoat / Vest Customization Options
const WAISTCOAT_STYLES = [
  {
    id: "SB_5_V",
    name: "Single Breasted (5 Buttons) Classic V",
    desc: "Timeless classic vest with sharp V-opening.",
    price: 0,
    buttons: 5,
    type: "SB",
  },
  {
    id: "SB_6_NOTCH",
    name: "Single Breasted (6 Buttons) with Notch Lapel",
    desc: "Distinguished British collar with notch points.",
    price: 1200,
    buttons: 6,
    type: "SB_LAPEL",
  },
  {
    id: "SB_6_SHAWL",
    name: "Single Breasted (6 Buttons) with Shawl Collar",
    desc: "Smooth rounded sweep collar for regal black-tie elegance.",
    price: 1500,
    buttons: 6,
    type: "SB_SHAWL",
  },
  {
    id: "DB_6_3",
    name: "Double Breasted (6x3) Sartorial Peak Lapel",
    desc: "Regal Ascot styling with wide overlapping closure and flat bottom hem.",
    price: 2000,
    buttons: 6,
    type: "DB",
  },
  {
    id: "HORSESHOE_FORMAL",
    name: "Deep Horseshoe Scoop (Formal Black Tie)",
    desc: "Low-cut evening vest revealing crisp dress shirt studs and bowtie.",
    price: 1800,
    buttons: 3,
    type: "HORSESHOE",
  },
]

const WAISTCOAT_POCKETS = [
  { id: "JETTED_2", name: "2 Lower Jetted Pockets", desc: "Clean and streamlined traditional vest pockets.", price: 0 },
  {
    id: "WELT_4",
    name: "4 Pockets (2 Chest Welts + 2 Watch Pockets)",
    desc: "Vintage pocket watch chain configuration with fob buttonhole.",
    price: 600,
  },
]

const WAISTCOAT_BACKS = [
  {
    id: "MATCHING_LINING",
    name: "Matching Cupro Silk with Adjustable Cinch Buckle",
    desc: "Breathable lining silk with an antique metal slider buckle.",
    price: 0,
  },
  {
    id: "FULL_WOOL_BACK",
    name: "Full Matching Wool Back (Double-Sided Cloth)",
    desc: "Warm and substantial, tailored for wearing comfortably without a jacket.",
    price: 1500,
  },
]

const WAISTCOAT_FABRICS = [
  {
    id: "MATCH_SUIT",
    name: "Matching Suit Cloth",
    desc: "Crafted from the identical primary suit fabric.",
    price: 0,
    color: null,
  },
  {
    id: "DOVE_GREY",
    name: "Contrast Morning Dove Grey Super 130s",
    desc: "Royal Ascot traditional contrast vest cloth.",
    price: 2500,
    color: "#8e9aaf",
  },
  {
    id: "CHAMPAGNE_GOLD",
    name: "Contrast Champagne Silk Jacquard Brocade",
    desc: "Opulent celebratory and wedding contrast.",
    price: 3200,
    color: "#c9a24d",
  },
  {
    id: "IVORY_WOOL",
    name: "Contrast Cream Ivory Twill Wool",
    desc: "Classic Mediterranean summer regatta vest.",
    price: 2800,
    color: "#e8e1cf",
  },
  {
    id: "BURGUNDY_VELVET",
    name: "Contrast Imperial Burgundy Silk Velvet",
    desc: "Rich evening gala statement vest.",
    price: 3500,
    color: "#5b1424",
  },
]

// Preset Quick Recipes
const PRESETS = [
  {
    name: "Royal Mayfair 3-Piece",
    tag: "Royal Ascot",
    garmentId: "THREE_PIECE_SUIT",
    fabricCode: "LP-160-CHR",
    breastingId: "SB_2",
    lapelId: "PEAK",
    pocketId: "FLAP",
    buttonId: "HORN_DARK",
    liningId: "SILK_NAVY",
    waistbandId: "GURKHA",
  },
  {
    name: "Savile Row 2-Piece Vest Set",
    tag: "Boardroom",
    garmentId: "BLAZER_WAISTCOAT",
    fabricCode: "VBC-150-NVY",
    breastingId: "DB_6_2",
    lapelId: "PEAK",
    pocketId: "SLANTED_TICKET",
    buttonId: "HORN_DARK",
    liningId: "PAISLEY_GOLD",
    waistbandId: "SIDE_ADJUSTERS",
  },
  {
    name: "Riviera Summer Artisan Blazer",
    tag: "Destination",
    garmentId: "BLAZER_ONLY",
    fabricCode: "HL-LIN-SND",
    breastingId: "SB_2",
    lapelId: "NOTCH",
    pocketId: "PATCH",
    buttonId: "HORN_AMBER",
    liningId: "SILK_NAVY",
    waistbandId: "SIDE_ADJUSTERS",
  },
]

export default function SuitBuilderClient({ initialFabrics = [] }: { initialFabrics: any[] }) {
  const searchParams = useSearchParams()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [fabrics, setFabrics] = useState(initialFabrics)
  const [isLoadingFabrics, setIsLoadingFabrics] = useState(false)
  const [previewAngle, setPreviewAngle] = useState<"FRONT" | "BACK" | "INSIDE" | "WAISTCOAT">("FRONT")

  // Selections
  const [garmentType, setGarmentType] = useState(GARMENT_TYPES[0])
  const [selectedFabric, setSelectedFabric] = useState<any>(initialFabrics[0] || null)
  const [silhouette, setSilhouette] = useState(SILHOUETTES[0])
  const [breasting, setBreasting] = useState(BREASTING[0])
  const [lapel, setLapel] = useState(LAPELS[0])
  const [pocket, setPocket] = useState(POCKETS[0])
  const [vent, setVent] = useState(VENTS[0])
  const [button, setButton] = useState(BUTTONS[0])
  const [lining, setLining] = useState(LININGS[0])
  const [waistband, setWaistband] = useState(TROUSER_WAISTBANDS[0])
  const [pleat, setPleat] = useState(TROUSER_PLEATS[0])
  const [hem, setHem] = useState(TROUSER_HEMS[0])
  const [canvasType, setCanvasType] = useState<"HALF" | "FULL">("HALF")

  // Waistcoat specific selections
  const [waistcoatStyle, setWaistcoatStyle] = useState(WAISTCOAT_STYLES[0])
  const [waistcoatPocket, setWaistcoatPocket] = useState(WAISTCOAT_POCKETS[0])
  const [waistcoatBack, setWaistcoatBack] = useState(WAISTCOAT_BACKS[0])
  const [waistcoatFabricChoice, setWaistcoatFabricChoice] = useState(WAISTCOAT_FABRICS[0])

  // Monogramming
  const [hasMonogram, setHasMonogram] = useState(false)
  const [monogramText, setMonogramText] = useState("")
  const [monogramFont, setMonogramFont] = useState("SCRIPT")
  const [monogramColor, setMonogramColor] = useState("GOLD")

  // Sizing Mode
  const [fittingMethod, setFittingMethod] = useState<"OUTLET_FITTING" | "SMART_FIT" | "SELF_MEASURE">("OUTLET_FITTING")
  const [heightCm, setHeightCm] = useState("175")
  const [weightKg, setWeightKg] = useState("72")
  const [chestInch, setChestInch] = useState("40")
  const [waistInch, setWaistInch] = useState("34")
  const [inseamInch, setInseamInch] = useState("31")

  // Customer details
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentChoice, setPaymentChoice] = useState<"DEPOSIT_50" | "FULL_100">("DEPOSIT_50")
  const [fabricFilter, setFabricFilter] = useState<string>("ALL")
  const [inspectedFabric, setInspectedFabric] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null)

  // Dynamic step list based on garment selection
  const steps = [
    { id: "GARMENT", label: "Garment Style", subtitle: "Commission" },
    { id: "FABRIC", label: "Cloth & Mill", subtitle: "European Wools" },
    { id: "JACKET", label: "Jacket Cut", subtitle: "Lapel & Pockets" },
    ...(garmentType.id === "BLAZER_WAISTCOAT" || garmentType.id === "THREE_PIECE_SUIT"
      ? [{ id: "WAISTCOAT", label: "Waistcoat Craft", subtitle: "Vest Architecture" }]
      : []),
    { id: "LINING", label: "Silk Lining", subtitle: "Canvassing" },
    ...(garmentType.id === "THREE_PIECE_SUIT"
      ? [{ id: "TROUSERS", label: "Trousers Cut", subtitle: "Waist & Pleats" }]
      : []),
    { id: "SIZING", label: "Monogram & Sizing", subtitle: "Atelier Fitting" },
    { id: "REVIEW", label: "Review & Order", subtitle: "Confirmation" },
  ]

  // Clamp current step index when steps count changes
  useEffect(() => {
    if (currentStepIndex >= steps.length) {
      setCurrentStepIndex(steps.length - 1)
    }
  }, [garmentType, steps.length, currentStepIndex])

  // Auto-load lookbook blueprints from query params
  useEffect(() => {
    if (!searchParams) return

    const qGarment = searchParams.get("garment")
    const qFabric = searchParams.get("fabric")
    const qBreasting = searchParams.get("breasting")
    const qLapel = searchParams.get("lapel")
    const qPocket = searchParams.get("pocket")
    const qButton = searchParams.get("button")
    const qLining = searchParams.get("lining")
    const qWaistband = searchParams.get("waistband")
    const qPleat = searchParams.get("pleat")
    const qHem = searchParams.get("hem")

    if (qGarment) {
      const matchG = GARMENT_TYPES.find((g) => g.id === qGarment)
      if (matchG) setGarmentType(matchG)
    }
    if (qFabric && fabrics.length > 0) {
      const matchF = fabrics.find((f) => f.code === qFabric)
      if (matchF) setSelectedFabric(matchF)
    }
    if (qBreasting) {
      const matchB = BREASTING.find((b) => b.id === qBreasting)
      if (matchB) setBreasting(matchB)
    }
    if (qLapel) {
      const matchL = LAPELS.find((l) => l.id === qLapel)
      if (matchL) setLapel(matchL)
    }
    if (qPocket) {
      const matchP = POCKETS.find((p) => p.id === qPocket)
      if (matchP) setPocket(matchP)
    }
    if (qButton) {
      const matchBtn = BUTTONS.find((btn) => btn.id === qButton)
      if (matchBtn) setButton(matchBtn)
    }
    if (qLining) {
      const matchLin = LININGS.find((lin) => lin.id === qLining)
      if (matchLin) setLining(matchLin)
    }
    if (qWaistband) {
      const matchW = TROUSER_WAISTBANDS.find((w) => w.id === qWaistband)
      if (matchW) setWaistband(matchW)
    }
    if (qPleat) {
      const matchPl = TROUSER_PLEATS.find((pl) => pl.id === qPleat)
      if (matchPl) setPleat(matchPl)
    }
    if (qHem) {
      const matchH = TROUSER_HEMS.find((h) => h.id === qHem)
      if (matchH) setHem(matchH)
    }
  }, [searchParams, fabrics])

  useEffect(() => {
    if (fabrics.length === 0) {
      setIsLoadingFabrics(true)
      fetch("/api/bespoke/fabrics")
        .then((res) => res.json())
        .then((data) => {
          if (data.fabrics && data.fabrics.length > 0) {
            setFabrics(data.fabrics)
            setSelectedFabric(data.fabrics[0])
          }
        })
        .finally(() => setIsLoadingFabrics(false))
    }
  }, [fabrics])

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    const g = GARMENT_TYPES.find((item) => item.id === preset.garmentId)
    if (g) setGarmentType(g)
    const f = fabrics.find((item) => item.code === preset.fabricCode)
    if (f) setSelectedFabric(f)
    const b = BREASTING.find((item) => item.id === preset.breastingId)
    if (b) setBreasting(b)
    const l = LAPELS.find((item) => item.id === preset.lapelId)
    if (l) setLapel(l)
    const p = POCKETS.find((item) => item.id === preset.pocketId)
    if (p) setPocket(p)
    const btn = BUTTONS.find((item) => item.id === preset.buttonId)
    if (btn) setButton(btn)
    const lin = LININGS.find((item) => item.id === preset.liningId)
    if (lin) setLining(lin)
    const w = TROUSER_WAISTBANDS.find((item) => item.id === preset.waistbandId)
    if (w) setWaistband(w)
  }

  // Price Calculation
  const basePrice = garmentType.basePrice
  const fabricUpgrade = selectedFabric?.pricePerMeter ? Math.max(0, (selectedFabric.pricePerMeter - 3000) * 3.5) : 0
  const canvasAddon = canvasType === "FULL" ? 4500 : 0
  const pocketAddon = pocket.price || 0
  const buttonAddon = button.price || 0
  const liningAddon = lining.price || 0
  const waistbandAddon = waistband.price || 0
  const hemAddon = hem.price || 0
  const monogramAddon = hasMonogram && monogramText.trim() ? 800 : 0

  const waistcoatAddon =
    garmentType.id === "BLAZER_WAISTCOAT" || garmentType.id === "THREE_PIECE_SUIT"
      ? (waistcoatStyle.price || 0) +
        (waistcoatPocket.price || 0) +
        (waistcoatBack.price || 0) +
        (waistcoatFabricChoice.price || 0)
      : 0

  const customizationsPrice =
    fabricUpgrade +
    canvasAddon +
    pocketAddon +
    buttonAddon +
    liningAddon +
    waistbandAddon +
    hemAddon +
    monogramAddon +
    waistcoatAddon

  const totalPrice = basePrice + customizationsPrice
  const depositAmount = Math.round(totalPrice * 0.5)

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName || !customerPhone) {
      alert("Please provide your name and phone number.")
      return
    }

    setIsSubmitting(true)

    const designSpecs = {
      garmentType: garmentType.name,
      fabric: selectedFabric,
      silhouette: silhouette.name,
      breasting: breasting.name,
      lapel: lapel.name,
      pocket: pocket.name,
      vent: vent.name,
      button: button.name,
      lining: lining.name,
      canvasType: canvasType === "FULL" ? "Full Floating Horsehair Canvas" : "Half Canvas Structure",
      waistcoat:
        garmentType.id === "THREE_PIECE_SUIT"
          ? {
              style: waistcoatStyle.name,
              pockets: waistcoatPocket.name,
              back: waistcoatBack.name,
              fabric: waistcoatFabricChoice.name,
              colorHex: waistcoatFabricChoice.color || selectedFabric?.colorHex || clothColor,
            }
          : null,
      trousers: {
        waistband: waistband.name,
        pleats: pleat.name,
        hem: hem.name,
      },
      monogram: hasMonogram ? { text: monogramText, font: monogramFont, color: monogramColor } : null,
      fittingMethod,
      measurements:
        fittingMethod === "OUTLET_FITTING"
          ? "To be taken in-person at Flagship Atelier"
          : { heightCm, weightKg, chestInch, waistInch, inseamInch },
    }

    try {
      const res = await fetch("/api/bespoke/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garmentType: garmentType.id,
          designSpecs,
          fabricId: selectedFabric?.id || null,
          customMeasurements: designSpecs.measurements,
          basePrice,
          customizationsPrice,
          totalPrice,
          depositAmount: paymentChoice === "DEPOSIT_50" ? depositAmount : totalPrice,
          fulfillmentType: "OUTLET_PICKUP",
          customerName,
          customerPhone,
          customerEmail,
          notes,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit commission")

      setConfirmedOrder(data)
    } catch (err: any) {
      alert(err.message || "An error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Order Confirmed Screen
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-berber-surface border border-berber-gold/40 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden text-center">
          <div className="w-16 h-16 bg-berber-gold/15 text-berber-gold border border-berber-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <p className="text-xs uppercase tracking-[0.25em] text-berber-gold font-bold mb-2">
            Bespoke Commission Logged
          </p>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-berber-black mb-2">
            Commission #{confirmedOrder.orderNumber}
          </h1>
          <p className="text-berber-text-muted text-sm max-w-lg mx-auto mb-8">
            Thank you, {customerName}. Your bespoke blueprint has been logged in our master workshop. We have reserved your cloth and our Master Tailor will review the cutting specifications.
          </p>

          <div className="bg-berber-muted/60 border border-berber-border rounded-2xl p-6 text-left mb-8 space-y-3 text-sm">
            <div className="flex justify-between border-b border-berber-border pb-2">
              <span className="text-berber-text-muted">Garment Style:</span>
              <span className="font-semibold text-berber-black">{garmentType.name} ({silhouette.name})</span>
            </div>
            <div className="flex justify-between border-b border-berber-border pb-2">
              <span className="text-berber-text-muted">Selected Cloth:</span>
              <span className="font-semibold text-berber-black">{selectedFabric?.name}</span>
            </div>
            {(garmentType.id === "BLAZER_WAISTCOAT" || garmentType.id === "THREE_PIECE_SUIT") && (
              <div className="flex justify-between border-b border-berber-border pb-2">
                <span className="text-berber-text-muted">Waistcoat Architecture:</span>
                <span className="font-semibold text-berber-black">{waistcoatStyle.name}</span>
              </div>
            )}
            <div className="flex justify-between border-b border-berber-border pb-2">
              <span className="text-berber-text-muted">Fitting Arrangement:</span>
              <span className="font-semibold text-berber-black">
                {fittingMethod === "OUTLET_FITTING" ? "Flagship Atelier Showroom Fitting" : "Online Measurements"}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-berber-text">Commission Total:</span>
              <span className="font-bold text-berber-black text-base font-mono">৳{totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={confirmedOrder.waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-7 py-3.5 rounded-full transition shadow-lg"
            >
              Open WhatsApp Status & Tailor Concierge
            </a>
            {fittingMethod === "OUTLET_FITTING" && (
              <Link
                href="/bespoke/book-appointment"
                className="inline-flex items-center justify-center gap-2 bg-berber-gold hover:bg-yellow-600 text-white font-bold px-7 py-3.5 rounded-full transition shadow-md"
              >
                <Calendar className="w-5 h-5" />
                Book Your Atelier Fitting Slot
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  const clothColor = selectedFabric?.colorHex || "#1B2A4A"
  const liningColor = lining?.color || "#141c2b"
  const vestColor = waistcoatFabricChoice.color || clothColor
  const activeStep = steps[currentStepIndex] || steps[0]

  return (
    <div className="w-full bg-berber-bg min-h-screen text-berber-text">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Studio Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-berber-border gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-[0.25em] text-berber-gold font-bold">
                Artisanal Made-to-Measure Studio
              </span>
              <span className="text-[10px] bg-berber-gold/15 border border-berber-gold/30 text-berber-black px-2.5 py-0.5 rounded-full font-mono font-semibold">
                Live SVG Mannequin
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-heading font-bold text-berber-black">
              Design Your Bespoke Suit
            </h1>
          </div>

          {/* Live Price Header Badge */}
          <div className="bg-berber-surface border border-berber-border rounded-2xl px-5 py-3 flex items-center gap-4 shrink-0 shadow-berber">
            <div>
              <span className="text-[10px] uppercase text-berber-text-muted font-bold block">Commission Estimate</span>
              <span className="text-2xl font-bold text-berber-black font-mono">৳{totalPrice.toLocaleString()}</span>
            </div>
            <div className="h-8 w-px bg-berber-border" />
            <div>
              <span className="text-[10px] uppercase text-berber-text-muted font-bold block">50% Deposit</span>
              <span className="text-sm font-semibold text-berber-gold font-mono">৳{depositAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Preset Recipe Bar */}
        <div className="mb-6 p-4 rounded-2xl bg-berber-surface border border-berber-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-berber">
          <div className="flex items-center gap-2 text-xs font-semibold text-berber-black">
            <Sparkles className="w-4 h-4 text-berber-gold" />
            <span>Quick Style Recipes:</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin scrollbar-thumb-neutral-300">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className="shrink-0 text-xs px-3.5 py-1.5 rounded-full border border-berber-border bg-berber-muted hover:border-berber-gold hover:text-berber-black text-berber-text font-medium transition flex items-center gap-1.5"
              >
                <span className="text-[9px] uppercase font-bold text-berber-gold bg-berber-gold/15 px-2 py-0.5 rounded-full">
                  {p.tag}
                </span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-thin scrollbar-thumb-neutral-300">
          {steps.map((s, idx) => {
            const isActive = currentStepIndex === idx
            const isPassed = currentStepIndex > idx
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStepIndex(idx)}
                className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition flex items-center gap-2 border ${
                  isActive
                    ? "bg-berber-gold text-white border-berber-gold shadow-md shadow-berber-gold/20"
                    : isPassed
                    ? "bg-berber-surface text-berber-black border-berber-border font-medium"
                    : "bg-berber-muted text-berber-text-muted border-berber-border/80 hover:text-berber-black"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? "bg-white text-berber-gold" : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {isPassed ? "✓" : idx + 1}
                </span>
                <span>{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* Main Studio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Dynamic SVG Mannequin & Multi-Angle Preview */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 relative overflow-hidden shadow-berber">
              {/* Angle Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-berber-border mb-4 gap-2">
                <span className="text-[11px] uppercase tracking-wider font-bold text-berber-text-muted flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-berber-gold" />
                  View Angle:
                </span>

                <div className="flex flex-wrap bg-berber-muted p-1 rounded-full border border-berber-border gap-1">
                  {(["FRONT", "BACK", "INSIDE"] as const).map((ang) => (
                    <button
                      key={ang}
                      type="button"
                      onClick={() => setPreviewAngle(ang)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                        previewAngle === ang
                          ? "bg-berber-black text-white shadow-sm"
                          : "text-berber-text-muted hover:text-berber-black"
                      }`}
                    >
                      {ang === "FRONT" ? "Front" : ang === "BACK" ? "Back & Vents" : "Inside Lining"}
                    </button>
                  ))}

                  {(garmentType.id === "BLAZER_WAISTCOAT" || garmentType.id === "THREE_PIECE_SUIT") && (
                    <button
                      type="button"
                      onClick={() => setPreviewAngle("WAISTCOAT")}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition flex items-center gap-1 ${
                        previewAngle === "WAISTCOAT"
                          ? "bg-berber-gold text-white shadow-sm font-bold"
                          : "text-berber-gold hover:text-yellow-700 bg-berber-gold/15 border border-berber-gold/30"
                      }`}
                    >
                      <Shirt className="w-3 h-3" />
                      Waistcoat
                    </button>
                  )}
                </div>
              </div>

              {/* Precision SVG Mannequin Canvas */}
              <div className="aspect-[3/4] bg-[#F9F9F7] rounded-2xl relative overflow-hidden flex items-center justify-center p-4 border border-berber-border shadow-inner">
                {/* Texture Ambient Gradient */}
                <div
                  className="absolute inset-0 opacity-10 transition-colors duration-700 pointer-events-none"
                  style={{
                    backgroundColor:
                      previewAngle === "INSIDE"
                        ? liningColor
                        : previewAngle === "WAISTCOAT"
                        ? vestColor
                        : clothColor,
                  }}
                />

                {/* 1. FRONT VIEW MANNEQUIN */}
                {previewAngle === "FRONT" && (
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                    <svg viewBox="0 0 300 400" className="w-64 h-80 drop-shadow-xl">
                      <defs>
                        <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={clothColor} stopOpacity="1" />
                          <stop offset="100%" stopColor="#111827" stopOpacity="0.85" />
                        </linearGradient>
                        <linearGradient id="vestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={vestColor} stopOpacity="1" />
                          <stop offset="100%" stopColor="#111827" stopOpacity="0.9" />
                        </linearGradient>
                        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" />
                        </filter>
                      </defs>

                      {/* Dress Shirt Collar Underneath */}
                      <polygon points="120,40 150,85 180,40" fill="#ffffff" stroke="#e5e5e5" strokeWidth="1" />
                      <polygon points="150,75 140,160 160,160" fill="#1e293b" /> {/* Silk Tie */}

                      {/* Waistcoat Layer (Rendered beneath jacket) */}
                      {(garmentType.id === "BLAZER_WAISTCOAT" || garmentType.id === "THREE_PIECE_SUIT") && (
                        <g>
                          {waistcoatStyle.type === "HORSESHOE" ? (
                            <path
                              d="M 115 65 Q 150 145 185 65 L 192 235 L 150 255 L 108 235 Z"
                              fill="url(#vestGrad)"
                              stroke="#c5a880"
                              strokeWidth="1.2"
                            />
                          ) : waistcoatStyle.type === "DB" ? (
                            <path
                              d="M 115 60 L 150 135 L 185 60 L 195 235 L 105 235 Z"
                              fill="url(#vestGrad)"
                              stroke="#c5a880"
                              strokeWidth="1.2"
                            />
                          ) : (
                            <path
                              d="M 115 60 L 150 130 L 185 60 L 195 235 L 150 258 L 105 235 Z"
                              fill="url(#vestGrad)"
                              stroke="#c5a880"
                              strokeWidth="1.2"
                            />
                          )}

                          {/* Vest Tiny Center Buttons */}
                          {waistcoatStyle.type === "DB" ? (
                            <g fill={button.color} stroke="#c5a880" strokeWidth="0.5">
                              <circle cx="140" cy="150" r="2.5" />
                              <circle cx="160" cy="150" r="2.5" />
                              <circle cx="140" cy="175" r="2.5" />
                              <circle cx="160" cy="175" r="2.5" />
                              <circle cx="140" cy="200" r="2.5" />
                              <circle cx="160" cy="200" r="2.5" />
                            </g>
                          ) : (
                            <g fill={button.color} stroke="#c5a880" strokeWidth="0.5">
                              <circle cx="150" cy="140" r="2.5" />
                              <circle cx="150" cy="160" r="2.5" />
                              <circle cx="150" cy="180" r="2.5" />
                              <circle cx="150" cy="200" r="2.5" />
                              <circle cx="150" cy="220" r="2.5" />
                            </g>
                          )}
                        </g>
                      )}

                      {/* Main Jacket Torso */}
                      {garmentType.id !== "TROUSERS_ONLY" && (
                        <path
                          d={
                            breasting.id === "DB_6_2"
                              ? "M 60 85 L 115 45 L 185 45 L 240 85 L 225 260 L 75 260 Z"
                              : "M 65 85 L 115 45 L 185 45 L 235 85 L 220 255 L 80 255 Z"
                          }
                          fill="url(#suitGrad)"
                          stroke="#404040"
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Lapel Geometry (Notch, Peak, or Shawl) */}
                      {garmentType.id !== "TROUSERS_ONLY" && lapel.id === "PEAK" && (
                        <g fill={garmentType.id === "TUXEDO" ? "#0f0f12" : clothColor} stroke="#c5a880" strokeWidth="1.5">
                          <polygon points="115,45 80,105 105,120 150,180 150,45" />
                          <polygon points="185,45 220,105 195,120 150,180 150,45" />
                        </g>
                      )}
                      {garmentType.id !== "TROUSERS_ONLY" && lapel.id === "NOTCH" && (
                        <g fill={garmentType.id === "TUXEDO" ? "#0f0f12" : clothColor} stroke="#c5a880" strokeWidth="1.5">
                          <polygon points="115,45 85,95 100,105 90,115 150,175 150,45" />
                          <polygon points="185,45 215,95 200,105 210,115 150,175 150,45" />
                        </g>
                      )}
                      {garmentType.id !== "TROUSERS_ONLY" && lapel.id === "SHAWL" && (
                        <g fill="#0f0f12" stroke="#c5a880" strokeWidth="1.5">
                          <path d="M 115 45 Q 85 110 150 185 Q 135 110 115 45 Z" />
                          <path d="M 185 45 Q 215 110 150 185 Q 165 110 185 45 Z" />
                        </g>
                      )}

                      {/* Chest Pocket Welt with White Silk Pocket Square */}
                      {garmentType.id !== "TROUSERS_ONLY" && (
                        <>
                          <rect x="95" y="110" width="35" height="6" fill="#18181b" stroke="#71717a" strokeWidth="0.8" />
                          <polygon points="100,110 112,98 125,110" fill="#ffffff" />
                        </>
                      )}

                      {/* Jacket Pockets (Flap, Slanted, Jetted, Patch) */}
                      {garmentType.id !== "TROUSERS_ONLY" &&
                        (pocket.id === "PATCH" ? (
                          <g fill="none" stroke="#c5a880" strokeWidth="1.5">
                            <rect x="75" y="195" width="45" height="40" rx="10" />
                            <rect x="180" y="195" width="45" height="40" rx="10" />
                          </g>
                        ) : (
                          <g fill="#18181b" stroke="#71717a" strokeWidth="1">
                            <rect x="78" y="200" width="45" height="8" rx="2" transform={pocket.id === "SLANTED_TICKET" ? "rotate(8 78 200)" : ""} />
                            <rect x="177" y="200" width="45" height="8" rx="2" transform={pocket.id === "SLANTED_TICKET" ? "rotate(-8 177 200)" : ""} />
                            {pocket.id === "SLANTED_TICKET" && (
                              <rect x="182" y="178" width="30" height="6" rx="2" transform="rotate(-8 182 178)" fill="#18181b" stroke="#c5a880" />
                            )}
                          </g>
                        ))}

                      {/* Button Styling on Jacket Closure */}
                      {garmentType.id !== "TROUSERS_ONLY" &&
                        (breasting.id === "DB_6_2" ? (
                          <g fill={button.color} stroke="#ffffff" strokeWidth="0.5">
                            <circle cx="130" cy="155" r="4.5" />
                            <circle cx="170" cy="155" r="4.5" />
                            <circle cx="130" cy="190" r="4.5" />
                            <circle cx="170" cy="190" r="4.5" />
                            <circle cx="130" cy="225" r="4.5" />
                            <circle cx="170" cy="225" r="4.5" />
                          </g>
                        ) : breasting.id === "SB_1" ? (
                          <circle cx="150" cy="190" r="5" fill={button.color} stroke="#ffffff" strokeWidth="0.8" />
                        ) : (
                          <g fill={button.color} stroke="#ffffff" strokeWidth="0.8">
                            <circle cx="150" cy="180" r="5" />
                            <circle cx="150" cy="215" r="5" />
                          </g>
                        ))}

                      {/* Trousers Layer */}
                      {garmentType.id !== "BLAZER_ONLY" && (
                        <g fill="url(#suitGrad)" stroke="#404040" strokeWidth="1.2">
                          <path d="M 95 255 L 75 385 L 135 385 L 150 290 L 165 385 L 225 385 L 205 255 Z" />
                          {/* Creases */}
                          <line x1="105" y1="260" x2="105" y2="385" stroke="#71717a" strokeDasharray="3,3" strokeWidth="0.8" />
                          <line x1="195" y1="260" x2="195" y2="385" stroke="#71717a" strokeDasharray="3,3" strokeWidth="0.8" />
                          {/* Turn up cuffs */}
                          {hem.id.includes("CUFF") && (
                            <g fill="#18181b" stroke="#c5a880" strokeWidth="1">
                              <rect x="75" y="372" width="60" height="13" />
                              <rect x="165" y="372" width="60" height="13" />
                            </g>
                          )}
                        </g>
                      )}
                    </svg>
                  </div>
                )}

                {/* 2. BACK VIEW MANNEQUIN */}
                {previewAngle === "BACK" && (
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                    <svg viewBox="0 0 300 400" className="w-64 h-80 drop-shadow-2xl">
                      <defs>
                        <linearGradient id="backSuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={clothColor} stopOpacity="1" />
                          <stop offset="100%" stopColor="#08080a" stopOpacity="0.85" />
                        </linearGradient>
                      </defs>

                      {/* Back Jacket Torso */}
                      {garmentType.id !== "TROUSERS_ONLY" && (
                        <>
                          <path d="M 65 85 L 115 45 L 185 45 L 235 85 L 220 255 L 80 255 Z" fill="url(#backSuitGrad)" stroke="#404040" strokeWidth="1.5" />
                          {/* Spine Seam */}
                          <line x1="150" y1="45" x2="150" y2="255" stroke="#52525b" strokeWidth="1.2" />

                          {/* Vents (Dual, Center, or None) */}
                          {vent.id === "SIDE_DUAL" && (
                            <g stroke="#c5a880" strokeWidth="2">
                              <line x1="90" y1="185" x2="90" y2="255" />
                              <line x1="210" y1="185" x2="210" y2="255" />
                              <text x="150" y="225" fill="#c5a880" textAnchor="middle" fontSize="9" fontFamily="sans-serif">
                                Dual Side Vents
                              </text>
                            </g>
                          )}
                          {vent.id === "CENTER" && (
                            <g stroke="#c5a880" strokeWidth="2">
                              <line x1="150" y1="175" x2="150" y2="255" />
                              <text x="150" y="210" fill="#c5a880" textAnchor="middle" fontSize="9" fontFamily="sans-serif">
                                Single Center Vent
                              </text>
                            </g>
                          )}
                          {vent.id === "NONE" && (
                            <text x="150" y="210" fill="#a1a1aa" textAnchor="middle" fontSize="9" fontFamily="sans-serif">
                              Clean Ventless Back
                            </text>
                          )}
                        </>
                      )}

                      {/* Trousers Back Seat */}
                      {garmentType.id !== "BLAZER_ONLY" && (
                        <g fill="url(#backSuitGrad)" stroke="#404040" strokeWidth="1.2">
                          <path d="M 95 255 L 75 385 L 135 385 L 150 290 L 165 385 L 225 385 L 205 255 Z" />
                          {/* Back jetted pockets */}
                          <line x1="105" y1="270" x2="135" y2="270" stroke="#71717a" strokeWidth="2" />
                          <line x1="165" y1="270" x2="195" y2="270" stroke="#71717a" strokeWidth="2" />
                        </g>
                      )}
                    </svg>
                  </div>
                )}

                {/* 3. INSIDE LINING & MONOGRAM VIEW */}
                {previewAngle === "INSIDE" && (
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                    <div
                      className="w-56 h-72 rounded-2xl border-2 border-berber-gold/50 p-6 flex flex-col justify-between relative shadow-2xl overflow-hidden"
                      style={{ backgroundColor: liningColor }}
                    >
                      {/* Floating Canvas Pattern Lines */}
                      <div className="absolute inset-0 opacity-15 border border-dashed border-white pointer-events-none" />

                      <div>
                        <div className="flex justify-between items-center pb-2 border-b border-white/20">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-white/90">
                            {canvasType === "FULL" ? "Full Floating Canvas" : "Half Canvas Interior"}
                          </span>
                          <span className="text-[9px] text-amber-300 font-mono">Bemberg Silk</span>
                        </div>
                        <p className="text-[11px] text-white/80 font-medium mt-1">{lining.name}</p>
                      </div>

                      {/* Embroidered Monogram Pocket Welt */}
                      <div className="bg-black/60 border border-amber-400/40 rounded-xl p-3 text-center space-y-1 shadow-lg">
                        <span className="text-[9px] uppercase tracking-widest text-neutral-400 block">
                          Interior Pocket Welt
                        </span>
                        {hasMonogram && monogramText ? (
                          <div
                            className={`text-sm tracking-widest font-bold ${
                              monogramColor === "GOLD"
                                ? "text-amber-400"
                                : monogramColor === "SILVER"
                                ? "text-neutral-200"
                                : "text-rose-400"
                            } ${monogramFont === "SCRIPT" ? "font-serif italic" : "font-sans uppercase"}`}
                          >
                            {monogramText}
                          </div>
                        ) : (
                          <div className="text-[10px] text-neutral-400 italic">
                            (Add custom monogram in Sizing Step)
                          </div>
                        )}
                      </div>

                      <div className="text-[9px] text-center text-white/60">
                        Hand-stitched in Banani Atelier
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. DEDICATED BESPOKE WAISTCOAT STUDIO VIEW */}
                {previewAngle === "WAISTCOAT" && (
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                    <svg viewBox="0 0 320 360" className="w-64 h-76 drop-shadow-2xl">
                      <defs>
                        <linearGradient id="standaloneVestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={vestColor} stopOpacity="1" />
                          <stop offset="100%" stopColor="#08080a" stopOpacity="0.85" />
                        </linearGradient>
                        <linearGradient id="vestBackLiningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop
                            offset="0%"
                            stopColor={waistcoatBack.id === "FULL_WOOL_BACK" ? vestColor : liningColor}
                            stopOpacity="1"
                          />
                          <stop offset="100%" stopColor="#08080a" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>

                      {/* Vest Title Tag */}
                      <text x="80" y="25" fill="#c5a880" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        FRONT VEST
                      </text>
                      <text x="240" y="25" fill="#a1a1aa" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                        REAR & CINCH
                      </text>

                      {/* --- LEFT: FRONT VEST --- */}
                      <g transform="translate(10, 20)">
                        {/* Shirt Collar Background */}
                        <polygon points="50,20 70,50 90,20" fill="#ffffff" stroke="#d4d4d8" strokeWidth="0.8" />
                        <polygon points="70,45 64,110 76,110" fill="#1e293b" />

                        {/* Main Vest Body */}
                        {waistcoatStyle.type === "HORSESHOE" ? (
                          <path
                            d="M 25 45 Q 70 125 115 45 L 125 210 L 70 235 L 15 210 Z"
                            fill="url(#standaloneVestGrad)"
                            stroke="#404040"
                            strokeWidth="1.5"
                          />
                        ) : waistcoatStyle.type === "DB" ? (
                          <path
                            d="M 25 40 L 70 100 L 115 40 L 125 215 L 15 215 Z"
                            fill="url(#standaloneVestGrad)"
                            stroke="#404040"
                            strokeWidth="1.5"
                          />
                        ) : (
                          <path
                            d="M 25 40 L 70 95 L 115 40 L 125 210 L 70 238 L 15 210 Z"
                            fill="url(#standaloneVestGrad)"
                            stroke="#404040"
                            strokeWidth="1.5"
                          />
                        )}

                        {/* Lapel details if selected */}
                        {waistcoatStyle.type === "SB_LAPEL" && (
                          <g fill={vestColor} stroke="#c5a880" strokeWidth="1">
                            <polygon points="25,40 40,75 55,70 70,95 25,40" />
                            <polygon points="115,40 100,75 85,70 70,95 115,40" />
                          </g>
                        )}
                        {waistcoatStyle.type === "SB_SHAWL" && (
                          <g fill={vestColor} stroke="#c5a880" strokeWidth="1">
                            <path d="M 25 40 Q 45 70 70 95 Q 50 65 25 40 Z" />
                            <path d="M 115 40 Q 95 70 70 95 Q 90 65 115 40 Z" />
                          </g>
                        )}

                        {/* Vest Pockets */}
                        <rect x="25" y="170" width="30" height="5" rx="1" fill="#18181b" stroke="#71717a" strokeWidth="0.8" />
                        <rect x="85" y="170" width="30" height="5" rx="1" fill="#18181b" stroke="#71717a" strokeWidth="0.8" />

                        {/* Optional Upper 2 Chest Welts (WELT_4) */}
                        {waistcoatPocket.id === "WELT_4" && (
                          <>
                            <rect x="30" y="120" width="25" height="4" rx="1" fill="#18181b" stroke="#c5a880" strokeWidth="0.8" />
                            <rect x="85" y="120" width="25" height="4" rx="1" fill="#18181b" stroke="#c5a880" strokeWidth="0.8" />
                            {/* Vintage Pocket Watch Chain Arc */}
                            <path d="M 50 124 Q 68 150 70 140" fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="1,1" />
                          </>
                        )}

                        {/* Buttons */}
                        {waistcoatStyle.type === "DB" ? (
                          <g fill={button.color} stroke="#ffffff" strokeWidth="0.5">
                            <circle cx="58" cy="115" r="3" />
                            <circle cx="82" cy="115" r="3" />
                            <circle cx="58" cy="145" r="3" />
                            <circle cx="82" cy="145" r="3" />
                            <circle cx="58" cy="175" r="3" />
                            <circle cx="82" cy="175" r="3" />
                          </g>
                        ) : waistcoatStyle.type === "HORSESHOE" ? (
                          <g fill={button.color} stroke="#ffffff" strokeWidth="0.5">
                            <circle cx="70" cy="145" r="3" />
                            <circle cx="70" cy="170" r="3" />
                            <circle cx="70" cy="195" r="3" />
                          </g>
                        ) : (
                          <g fill={button.color} stroke="#ffffff" strokeWidth="0.5">
                            <circle cx="70" cy="105" r="3" />
                            <circle cx="70" cy="128" r="3" />
                            <circle cx="70" cy="151" r="3" />
                            <circle cx="70" cy="174" r="3" />
                            <circle cx="70" cy="197" r="3" />
                            {waistcoatStyle.buttons === 6 && <circle cx="70" cy="218" r="3" />}
                          </g>
                        )}
                      </g>

                      {/* --- RIGHT: REAR VEST & CINCH --- */}
                      <g transform="translate(170, 20)">
                        {/* Rear Vest Shell */}
                        <path
                          d="M 25 40 L 70 30 L 115 40 L 125 210 L 70 215 L 15 210 Z"
                          fill="url(#vestBackLiningGrad)"
                          stroke="#404040"
                          strokeWidth="1.5"
                        />
                        {/* Center Back Seam */}
                        <line x1="70" y1="30" x2="70" y2="215" stroke="#52525b" strokeWidth="1" />

                        {/* Waist Cinch Straps */}
                        <g>
                          <path d="M 25 155 L 60 160" stroke="#c5a880" strokeWidth="3" />
                          <path d="M 115 155 L 80 160" stroke="#c5a880" strokeWidth="3" />
                          {/* Metallic Slider Cinch Buckle */}
                          <rect x="60" y="156" width="20" height="8" rx="1" fill="#e4e4e7" stroke="#000" strokeWidth="0.8" />
                          <line x1="70" y1="156" x2="70" y2="164" stroke="#000" strokeWidth="1" />
                        </g>

                        {/* Tailor Label */}
                        <rect x="52" y="55" width="36" height="18" fill="#09090b" stroke="#c5a880" strokeWidth="0.8" />
                        <text x="70" y="67" fill="#c5a880" fontSize="5" fontWeight="bold" textAnchor="middle">
                          BERBER ATELIER
                        </text>
                      </g>
                    </svg>
                  </div>
                )}
              </div>

              {/* Spec Quick Sheet */}
              <div className="mt-4 pt-4 border-t border-berber-border space-y-2 text-xs text-berber-text">
                <div className="flex justify-between">
                  <span className="text-berber-text-muted">Lapel & Canvas:</span>
                  <span className="text-berber-black font-semibold">
                    {lapel.name.split("(")[0]} • {canvasType === "FULL" ? "Full Canvas" : "Half Canvas"}
                  </span>
                </div>
                {garmentType.id === "THREE_PIECE_SUIT" && (
                  <div className="flex justify-between">
                    <span className="text-berber-text-muted">Waistcoat:</span>
                    <span className="text-berber-gold font-bold">
                      {waistcoatStyle.name.split("(")[0]} ({waistcoatFabricChoice.name.split(" ")[0]})
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-berber-text-muted">Pockets & Vents:</span>
                  <span className="text-berber-black font-semibold">{pocket.name.split("(")[0]} • {vent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-berber-text-muted">Interior Silk:</span>
                  <span className="text-berber-black font-semibold">{lining.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customizer Controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: Garment Type */}
            {activeStep.id === "GARMENT" && (
              <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in shadow-berber">
                <div className="flex items-center justify-between pb-4 border-b border-berber-border">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-berber-black">Choose Garment Commission</h2>
                    <p className="text-xs text-berber-text-muted">Select the bespoke garment you wish to craft.</p>
                  </div>
                  <Scissors className="w-5 h-5 text-berber-gold" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {GARMENT_TYPES.map((g) => {
                    const isSelected = garmentType.id === g.id
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setGarmentType(g)
                          if (g.id === "THREE_PIECE_SUIT") {
                            setPreviewAngle("WAISTCOAT")
                          } else {
                            setPreviewAngle("FRONT")
                          }
                        }}
                        className={`text-left p-5 rounded-2xl border transition-all duration-200 relative ${
                          isSelected
                            ? "bg-berber-gold/10 border-berber-gold ring-1 ring-berber-gold shadow-sm"
                            : "bg-white border-berber-border hover:border-neutral-300 text-berber-text"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-berber-black text-base">{g.name}</h3>
                          <span className="text-xs font-mono font-bold text-berber-gold">
                            ৳{g.basePrice.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-berber-text-muted">{g.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Fabric & Mill Selection */}
            {activeStep.id === "FABRIC" && (
              <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in shadow-berber">
                <div className="flex items-center justify-between pb-4 border-b border-berber-border">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-berber-black">Select European Cloth & Mill</h2>
                    <p className="text-xs text-berber-text-muted">Finest wools, linens, and velvets woven by historic mills.</p>
                  </div>
                  <Palette className="w-5 h-5 text-berber-gold" />
                </div>

                {/* Mill & Season Category Filters */}
                <div className="flex flex-wrap gap-2 pb-2">
                  {[
                    { id: "ALL", label: "All Fabrics" },
                    { id: "VBC", label: "Vitale Barberis (Italy)" },
                    { id: "LP", label: "Loro Piana (Italy)" },
                    { id: "BRITISH", label: "Savile Row & Scabal" },
                    { id: "LINEN", label: "Summer Linen" },
                    { id: "VELVET", label: "Evening Velvet" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFabricFilter(tab.id)}
                      className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition border ${
                        fabricFilter === tab.id
                          ? "bg-berber-black text-white border-berber-black shadow-sm"
                          : "bg-white text-berber-text-muted border-berber-border hover:text-berber-black hover:bg-berber-muted"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {isLoadingFabrics ? (
                  <div className="py-12 text-center text-berber-text-muted text-sm">Loading curated cloth swatches...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fabrics
                      .filter((f) => {
                        if (fabricFilter === "ALL") return true
                        if (fabricFilter === "VBC") return f.millName?.includes("Canonico") || f.code?.includes("VBC")
                        if (fabricFilter === "LP") return f.millName?.includes("Loro Piana") || f.code?.includes("LP")
                        if (fabricFilter === "BRITISH")
                          return (
                            f.millName?.includes("Scabal") ||
                            f.millName?.includes("Dormeuil") ||
                            f.millName?.includes("Savile") ||
                            f.code?.includes("SCB") ||
                            f.code?.includes("DRM")
                          )
                        if (fabricFilter === "LINEN")
                          return f.composition?.includes("Linen") || f.season?.includes("Summer") || f.code?.includes("LIN")
                        if (fabricFilter === "VELVET")
                          return f.composition?.includes("Velvet") || f.code?.includes("EMR")
                        return true
                      })
                      .map((f) => {
                        const isSelected = selectedFabric?.id === f.id || selectedFabric?.code === f.code
                        return (
                          <div
                            key={f.code}
                            onClick={() => setSelectedFabric(f)}
                            className={`cursor-pointer text-left p-4 rounded-2xl border transition-all duration-200 flex gap-4 items-start relative group ${
                              isSelected
                                ? "bg-berber-gold/10 border-berber-gold ring-1 ring-berber-gold shadow-sm"
                                : "bg-white border-berber-border hover:border-neutral-300 text-berber-text"
                            }`}
                          >
                            <div
                              className="w-16 h-16 rounded-xl shrink-0 border border-neutral-300 shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: f.colorHex }}
                            >
                              {f.swatchImageUrl && (
                                <img
                                  src={f.swatchImageUrl}
                                  alt={f.name}
                                  className="w-full h-full object-cover opacity-90"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-berber-black text-xs truncate">{f.name}</h3>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setInspectedFabric(f)
                                  }}
                                  className="p-1 rounded-full bg-berber-muted hover:bg-berber-gold hover:text-white text-berber-text-muted transition ml-1 shrink-0"
                                  title="Inspect Weave & Mill Specs"
                                >
                                  <ZoomIn className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[11px] text-berber-gold font-bold mb-1">{f.millName}</p>
                              <p className="text-[10px] text-berber-text-muted">
                                {f.composition} • {f.weightGsm}gsm
                              </p>
                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-berber-border/60">
                                <span className="text-[10px] text-neutral-400">
                                  {f.season || "All Season"}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-berber-gold">
                                  {f.superCount || "Fine Wool"}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}

                {/* Swatch & Mill Provenance Modal */}
                {inspectedFabric && (
                  <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setInspectedFabric(null)}
                  >
                    <div
                      className="bg-white border border-berber-border rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setInspectedFabric(null)}
                        className="absolute top-5 right-5 p-2 rounded-full bg-berber-muted hover:bg-berber-gold hover:text-white text-berber-black transition"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-berber-gold bg-berber-gold/15 px-2.5 py-0.5 rounded-full">
                          European Mill Archive
                        </span>
                        <span className="text-xs font-mono text-berber-text-muted">{inspectedFabric.code}</span>
                      </div>

                      <div>
                        <h3 className="text-2xl font-heading font-bold text-berber-black mb-1">
                          {inspectedFabric.name}
                        </h3>
                        <p className="text-sm font-semibold text-berber-gold">{inspectedFabric.millName}</p>
                      </div>

                      {/* Swatch Close-up Viewer */}
                      <div
                        className="w-full h-44 rounded-2xl border border-berber-border shadow-inner relative overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: inspectedFabric.colorHex }}
                      >
                        {inspectedFabric.textureImageUrl ? (
                          <img
                            src={inspectedFabric.textureImageUrl}
                            alt={inspectedFabric.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center text-white/80 space-y-1">
                            <Layers className="w-8 h-8 mx-auto" />
                            <p className="text-xs font-mono uppercase tracking-wider">High-Res Sartorial Weave</p>
                          </div>
                        )}
                        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>100% Macro Weave</span>
                        </div>
                      </div>

                      {/* Technical Specifications Grid */}
                      <div className="bg-berber-muted/60 border border-berber-border rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[10px] uppercase text-berber-text-muted block font-semibold">Composition</span>
                          <span className="font-bold text-berber-black">{inspectedFabric.composition}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-berber-text-muted block font-semibold">Super Count</span>
                          <span className="font-bold text-berber-black">{inspectedFabric.superCount || "Fine Yarn"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-berber-text-muted block font-semibold">Fabric Weight</span>
                          <span className="font-bold text-berber-black">{inspectedFabric.weightGsm} GSM (Midweight)</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-berber-text-muted block font-semibold">Seasonality</span>
                          <span className="font-bold text-berber-black">{inspectedFabric.season || "All Season"}</span>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFabric(inspectedFabric)
                            setInspectedFabric(null)
                          }}
                          className="flex-1 bg-berber-gold hover:bg-yellow-600 text-white font-bold py-3.5 rounded-full text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-berber-gold/20"
                        >
                          <Check className="w-4 h-4" />
                          <span>Select This Cloth for Commission</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Jacket Cut & Architecture */}
            {activeStep.id === "JACKET" && (
              <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in shadow-berber">
                <div className="pb-4 border-b border-berber-border">
                  <h2 className="text-xl font-heading font-bold text-berber-black">Jacket Architecture & Silhouette</h2>
                  <p className="text-xs text-berber-text-muted">Configure the cut, lapels, pockets, and buttons.</p>
                </div>

                {/* Silhouette */}
                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                    Fit Silhouette
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SILHOUETTES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSilhouette(s)}
                        className={`p-3.5 rounded-2xl border text-left text-xs transition ${
                          silhouette.id === s.id
                            ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                            : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                        }`}
                      >
                        <span className="block font-bold text-berber-black mb-1">{s.name}</span>
                        <span className="text-[11px] text-berber-text-muted leading-snug">{s.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Contextual Tailor Advice Box */}
                  <div className="mt-3 p-3 rounded-2xl bg-berber-muted/60 border border-berber-border/80 flex items-start gap-2.5 text-xs">
                    <Sparkles className="w-4 h-4 text-berber-gold shrink-0 mt-0.5" />
                    <div className="text-[11px] text-berber-text">
                      <span className="font-bold text-berber-black">Master Tailor Advice: </span>
                      {silhouette.id === "SLIM" &&
                        "Slim Sartorial cut is sculpted close to the chest and taper. Best for modern events and athletic frames."}
                      {silhouette.id === "CLASSIC" &&
                        "Modern Classic offers the quintessential Savile Row balance — comfortable through chest and waist for daily executive wear."}
                      {silhouette.id === "RELAXED" &&
                        "Florentine unconstructed cut drops shoulder padding for a soft, natural Italian drape in linen and tropical wools."}
                    </div>
                  </div>
                </div>

                {/* Breasting & Lapel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                      Breasting / Buttons
                    </label>
                    <div className="space-y-2">
                      {BREASTING.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBreasting(b)}
                          className={`w-full p-3 rounded-2xl border text-left text-xs transition ${
                            breasting.id === b.id
                              ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                              : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                          }`}
                        >
                          <span className="block font-bold text-berber-black">{b.name}</span>
                          <span className="text-[10px] text-berber-text-muted">{b.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                      Lapel Style & Width
                    </label>
                    <div className="space-y-2">
                      {LAPELS.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setLapel(l)}
                          className={`w-full p-3 rounded-2xl border text-left text-xs transition ${
                            lapel.id === l.id
                              ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                              : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                          }`}
                        >
                          <span className="block font-bold text-berber-black">{l.name}</span>
                          <span className="text-[10px] text-berber-text-muted">{l.desc}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 text-[10px] text-berber-text-muted italic flex items-center gap-1">
                      <Info className="w-3 h-3 text-berber-gold shrink-0" />
                      <span>
                        {lapel.id === "PEAK" && "Peak lapels broaden shoulders and command formal executive authority."}
                        {lapel.id === "NOTCH" && "Notch lapels are the versatile standard for daily business and weddings."}
                        {lapel.id === "SHAWL" && "Shawl collar is exclusively for black-tie dinner suits and tuxedo galas."}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pockets & Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                      Jacket Pockets
                    </label>
                    <div className="space-y-2">
                      {POCKETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPocket(p)}
                          className={`w-full p-3 rounded-2xl border text-left text-xs transition ${
                            pocket.id === p.id
                              ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                              : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                          }`}
                        >
                          <span className="block font-bold text-berber-black">{p.name}</span>
                          <span className="text-[10px] text-berber-text-muted">{p.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                      Sartorial Buttons
                    </label>
                    <div className="space-y-2">
                      {BUTTONS.map((btn) => (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => setButton(btn)}
                          className={`w-full p-3 rounded-2xl border text-left text-xs transition flex items-center justify-between ${
                            button.id === btn.id
                              ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                              : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full border border-neutral-300" style={{ backgroundColor: btn.color }} />
                            <span className="text-berber-black font-medium">{btn.name}</span>
                          </div>
                          {btn.price > 0 && <span className="text-[10px] text-berber-gold font-bold">+৳{btn.price}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DEDICATED STEP: Bespoke Waistcoat / Vest Architecture */}
            {activeStep.id === "WAISTCOAT" && (
              <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in shadow-berber">
                <div className="flex items-center justify-between pb-4 border-b border-berber-border">
                  <div>
                    <h2 className="text-xl font-heading font-bold text-berber-black">Bespoke Waistcoat / Vest Craft</h2>
                    <p className="text-xs text-berber-text-muted">
                      The signature centerpiece of a British Three-Piece Commission.
                    </p>
                  </div>
                  <Shirt className="w-5 h-5 text-berber-gold" />
                </div>

                {/* Waistcoat Style & Cut */}
                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                    Vest Closure & Collar Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {WAISTCOAT_STYLES.map((ws) => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => {
                          setWaistcoatStyle(ws)
                          setPreviewAngle("WAISTCOAT")
                        }}
                        className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                          waistcoatStyle.id === ws.id
                            ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold shadow-sm"
                            : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-berber-black text-xs">{ws.name}</span>
                            {ws.price > 0 && <span className="text-[10px] text-berber-gold font-bold">+৳{ws.price}</span>}
                          </div>
                          <p className="text-[11px] text-berber-text-muted">{ws.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vest Pockets & Watch Chain */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                      Vest Pocket Configuration
                    </label>
                    <div className="space-y-2">
                      {WAISTCOAT_POCKETS.map((wp) => (
                        <button
                          key={wp.id}
                          type="button"
                          onClick={() => {
                            setWaistcoatPocket(wp)
                            setPreviewAngle("WAISTCOAT")
                          }}
                          className={`w-full p-3.5 rounded-2xl border text-left text-xs transition ${
                            waistcoatPocket.id === wp.id
                              ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                              : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-berber-black">{wp.name}</span>
                            {wp.price > 0 && <span className="text-[10px] text-berber-gold font-bold">+৳{wp.price}</span>}
                          </div>
                          <span className="text-[10px] text-berber-text-muted block">{wp.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                      Rear Backing & Adjuster Cinch
                    </label>
                    <div className="space-y-2">
                      {WAISTCOAT_BACKS.map((wb) => (
                        <button
                          key={wb.id}
                          type="button"
                          onClick={() => {
                            setWaistcoatBack(wb)
                            setPreviewAngle("WAISTCOAT")
                          }}
                          className={`w-full p-3.5 rounded-2xl border text-left text-xs transition ${
                            waistcoatBack.id === wb.id
                              ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                              : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-berber-black">{wb.name}</span>
                            {wb.price > 0 && <span className="text-[10px] text-berber-gold font-bold">+৳{wb.price}</span>}
                          </div>
                          <span className="text-[10px] text-berber-text-muted block">{wb.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optional Contrast Cloth Selection */}
                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                    Waistcoat Fabric & Contrast Cloth
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {WAISTCOAT_FABRICS.map((wf) => (
                      <button
                        key={wf.id}
                        type="button"
                        onClick={() => {
                          setWaistcoatFabricChoice(wf)
                          setPreviewAngle("WAISTCOAT")
                        }}
                        className={`p-3.5 rounded-2xl border text-left text-xs transition flex items-start gap-3 ${
                          waistcoatFabricChoice.id === wf.id
                            ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                            : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg border border-neutral-300 shrink-0 mt-0.5 shadow-inner"
                          style={{ backgroundColor: wf.color || clothColor }}
                        />
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-berber-black block truncate">{wf.name}</span>
                          </div>
                          {wf.price > 0 && <span className="text-[10px] text-berber-gold font-bold block">+৳{wf.price}</span>}
                          <span className="text-[10px] text-berber-text-muted block mt-0.5">{wf.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP: Silk Lining & Internal Canvassing */}
            {activeStep.id === "LINING" && (
              <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in shadow-berber">
                <div className="pb-4 border-b border-berber-border">
                  <h2 className="text-xl font-heading font-bold text-berber-black">Interior Silk Lining & Canvassing</h2>
                  <p className="text-xs text-berber-text-muted">The secret of bespoke comfort lies on the inside.</p>
                </div>

                {/* Canvassing */}
                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                    Interior Construction & Canvassing
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setCanvasType("HALF")}
                      className={`p-4 rounded-2xl border text-left transition ${
                        canvasType === "HALF"
                          ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                          : "bg-white border-berber-border text-berber-text-muted"
                      }`}
                    >
                      <span className="block font-bold text-berber-black text-sm mb-1">Half Canvas Construction (Standard)</span>
                      <span className="text-xs text-berber-text-muted leading-relaxed">
                        Natural horsehair chest canvas providing structured drape with light, flexible movement.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCanvasType("FULL")}
                      className={`p-4 rounded-2xl border text-left transition ${
                        canvasType === "FULL"
                          ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                          : "bg-white border-berber-border text-berber-text-muted"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="block font-bold text-berber-black text-sm">Full Floating Canvas (+৳4,500)</span>
                        <span className="text-[10px] bg-berber-gold text-white font-extrabold px-2.5 py-0.5 rounded-full">
                          Savile Row
                        </span>
                      </div>
                      <span className="text-xs text-berber-text-muted leading-relaxed">
                        Hand-stitched full floating canvas that molds completely to your body shape over time.
                      </span>
                    </button>
                  </div>

                  {/* Savile Row Canvassing Guidance Box */}
                  <div className="mt-3 p-3 rounded-2xl bg-berber-muted/60 border border-berber-border/80 flex items-start gap-2.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-berber-gold shrink-0 mt-0.5" />
                    <div className="text-[11px] text-berber-text">
                      <span className="font-bold text-berber-black">Savile Row Canvas Heritage: </span>
                      {canvasType === "FULL"
                        ? "Full Floating Canvas contains hand-stitched horsehair and wool canvas from shoulder to hem that softens and permanently contours to your exact body posture over time."
                        : "Half Canvas provides a natural structured chest piece with lightweight flexible lower body movement for everyday wear."}
                    </div>
                  </div>
                </div>

                {/* Lining */}
                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                    Bemberg Silk Interior Lining
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {LININGS.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setLining(l)}
                        className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                          lining.id === l.id
                            ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                            : "bg-white border-berber-border text-berber-text-muted"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl border border-neutral-300 shadow-sm" style={{ backgroundColor: l.color }} />
                          <div>
                            <span className="block text-xs font-bold text-berber-black">{l.name}</span>
                            <span className="text-[10px] text-berber-text-muted">100% Breathable Cupro Bemberg</span>
                          </div>
                        </div>
                        {l.price > 0 && <span className="text-xs text-berber-gold font-bold">+৳{l.price}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP: Trousers Craft */}
            {activeStep.id === "TROUSERS" && (
              <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in shadow-berber">
                <div className="pb-4 border-b border-berber-border">
                  <h2 className="text-xl font-heading font-bold text-berber-black">Trousers Architecture & Waistband</h2>
                  <p className="text-xs text-berber-text-muted">Custom waistband adjusters, pleats, and hem cuffs.</p>
                </div>

                {/* Waistband */}
                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                    Waistband Fastening
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TROUSER_WAISTBANDS.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setWaistband(w)}
                        className={`p-3.5 rounded-2xl border text-left text-xs transition ${
                          waistband.id === w.id
                            ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                            : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                        }`}
                      >
                        <span className="block font-bold text-berber-black mb-1">{w.name}</span>
                        {w.price > 0 && <span className="text-[10px] text-berber-gold font-bold">+৳{w.price}</span>}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-[10px] text-berber-text-muted italic flex items-center gap-1">
                    <Info className="w-3 h-3 text-berber-gold shrink-0" />
                    <span>
                      {waistband.id === "SIDE_ADJUSTERS" && "Side metal adjusters deliver a clean, beltless European silhouette without leather bunching."}
                      {waistband.id === "GURKHA" && "Extended Gurkha cross-over waistband offers vintage military sartorial flair."}
                      {waistband.id === "BELT_LOOPS" && "Traditional loops for pairing with your favorite dress belts."}
                    </span>
                  </div>
                </div>

                {/* Pleats & Hem */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                      Front Pleats
                    </label>
                    <div className="space-y-2">
                      {TROUSER_PLEATS.map((pl) => (
                        <button
                          key={pl.id}
                          type="button"
                          onClick={() => setPleat(pl)}
                          className={`w-full p-3 rounded-2xl border text-left text-xs transition ${
                            pleat.id === pl.id
                              ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                              : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                          }`}
                        >
                          <span className="block font-bold text-berber-black">{pl.name}</span>
                          <span className="text-[10px] text-berber-text-muted">{pl.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                      Trouser Hem & Cuffs
                    </label>
                    <div className="space-y-2">
                      {TROUSER_HEMS.map((h) => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setHem(h)}
                          className={`w-full p-3 rounded-2xl border text-left text-xs transition ${
                            hem.id === h.id
                              ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold"
                              : "bg-white border-berber-border text-berber-text-muted hover:text-berber-black"
                          }`}
                        >
                          <span className="block font-bold text-berber-black">{h.name}</span>
                          <span className="text-[10px] text-berber-text-muted">{h.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: Monogramming & Sizing Pathway */}
            {activeStep.id === "SIZING" && (
              <div className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in shadow-berber">
                <div className="pb-4 border-b border-berber-border">
                  <h2 className="text-xl font-heading font-bold text-berber-black">Personal Monogram & Fitting Method</h2>
                  <p className="text-xs text-berber-text-muted">Embroidery customization and how you want measurements taken.</p>
                </div>

                {/* Monogram Section */}
                <div className="bg-berber-muted/60 border border-berber-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-berber-black block">Custom Monogram Embroidery (+৳800)</span>
                      <span className="text-xs text-berber-text-muted">Embroidered on the interior chest pocket welt.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasMonogram}
                      onChange={(e) => setHasMonogram(e.target.checked)}
                      className="w-5 h-5 accent-berber-gold cursor-pointer"
                    />
                  </div>

                  {hasMonogram && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="Your Initials / Name (e.g. M.R.)"
                        maxLength={20}
                        value={monogramText}
                        onChange={(e) => setMonogramText(e.target.value.toUpperCase())}
                        className="bg-white border border-berber-border rounded-xl px-3 py-2 text-xs text-berber-black uppercase focus:outline-none focus:border-berber-gold"
                      />
                      <select
                        value={monogramFont}
                        onChange={(e) => setMonogramFont(e.target.value)}
                        className="bg-white border border-berber-border rounded-xl px-3 py-2 text-xs text-berber-black focus:outline-none"
                      >
                        <option value="SCRIPT">Classic English Script</option>
                        <option value="BLOCK">Modern Block Sans</option>
                        <option value="SERIF">Roman Serif</option>
                      </select>
                      <select
                        value={monogramColor}
                        onChange={(e) => setMonogramColor(e.target.value)}
                        className="bg-white border border-berber-border rounded-xl px-3 py-2 text-xs text-berber-black focus:outline-none"
                      >
                        <option value="GOLD">Imperial Gold Thread</option>
                        <option value="SILVER">Platinum Silver Thread</option>
                        <option value="CRIMSON">Burgundy Silk Thread</option>
                        <option value="NAVY">Tone-on-Tone Navy</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Fitting Method Choice */}
                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                    How Would You Like Your Measurements Taken?
                  </label>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setFittingMethod("OUTLET_FITTING")}
                      className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-4 ${
                        fittingMethod === "OUTLET_FITTING"
                          ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold shadow-sm"
                          : "bg-white border-berber-border text-berber-text-muted"
                      }`}
                    >
                      <Building className="w-5 h-5 text-berber-gold shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-bold text-berber-black text-sm">
                          Flagship Atelier Showroom Fitting (Recommended)
                        </span>
                        <span className="text-xs text-berber-text-muted leading-relaxed block mt-0.5">
                          Visit our Banani Flagship showroom to have 30+ precision anatomical measurements recorded by our Master Tailor.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFittingMethod("SMART_FIT")}
                      className={`w-full p-4 rounded-2xl border text-left transition flex items-start gap-4 ${
                        fittingMethod === "SMART_FIT"
                          ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold shadow-sm"
                          : "bg-white border-berber-border text-berber-text-muted"
                      }`}
                    >
                      <Sparkles className="w-5 h-5 text-berber-gold shrink-0 mt-0.5" />
                      <div>
                        <span className="block font-bold text-berber-black text-sm">Smart Fit Estimation</span>
                        <span className="text-xs text-berber-text-muted leading-relaxed block mt-0.5">
                          Enter height, weight, and key sizes for algorithm-backed precision estimation.
                        </span>
                      </div>
                    </button>
                  </div>

                  {fittingMethod === "SMART_FIT" && (
                    <div className="grid grid-cols-3 gap-3 pt-4">
                      <div>
                        <label className="text-[11px] text-berber-text-muted block mb-1">Height (cm)</label>
                        <input
                          type="number"
                          value={heightCm}
                          onChange={(e) => setHeightCm(e.target.value)}
                          className="w-full bg-white border border-berber-border rounded-xl px-3 py-2 text-xs text-berber-black"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-berber-text-muted block mb-1">Weight (kg)</label>
                        <input
                          type="number"
                          value={weightKg}
                          onChange={(e) => setWeightKg(e.target.value)}
                          className="w-full bg-white border border-berber-border rounded-xl px-3 py-2 text-xs text-berber-black"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-berber-text-muted block mb-1">Chest (inches)</label>
                        <input
                          type="number"
                          value={chestInch}
                          onChange={(e) => setChestInch(e.target.value)}
                          className="w-full bg-white border border-berber-border rounded-xl px-3 py-2 text-xs text-berber-black"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP: Final Review & Checkout */}
            {activeStep.id === "REVIEW" && (
              <form onSubmit={handleCreateOrder} className="bg-berber-surface border border-berber-border rounded-3xl p-6 md:p-8 space-y-6 animate-in fade-in shadow-berber">
                <div className="pb-4 border-b border-berber-border">
                  <h2 className="text-xl font-heading font-bold text-berber-black">Review Blueprint & Submit Commission</h2>
                  <p className="text-xs text-berber-text-muted">Complete guest details to register your bespoke commission.</p>
                </div>

                {/* Commission Summary Table */}
                <div className="bg-berber-muted/60 border border-berber-border rounded-2xl p-5 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-berber-border pb-2">
                    <span className="text-berber-text-muted">Garment Commission:</span>
                    <span className="text-berber-black font-semibold">{garmentType.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-berber-border pb-2">
                    <span className="text-berber-text-muted">Selected Cloth:</span>
                    <span className="text-berber-black font-semibold">{selectedFabric?.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-berber-border pb-2">
                    <span className="text-berber-text-muted">Jacket Architecture:</span>
                    <span className="text-berber-black font-medium">
                      {breasting.name} • {lapel.name} • {pocket.name}
                    </span>
                  </div>
                  {(garmentType.id === "BLAZER_WAISTCOAT" || garmentType.id === "THREE_PIECE_SUIT") && (
                    <div className="flex justify-between border-b border-berber-border pb-2">
                      <span className="text-berber-text-muted">Waistcoat Architecture:</span>
                      <span className="text-berber-gold font-semibold">
                        {waistcoatStyle.name} • {waistcoatPocket.name} ({waistcoatFabricChoice.name})
                      </span>
                    </div>
                  )}
                  {garmentType.id === "THREE_PIECE_SUIT" && (
                    <div className="flex justify-between border-b border-berber-border pb-2">
                      <span className="text-berber-text-muted">Trousers Details:</span>
                      <span className="text-berber-black font-medium">
                        {waistband.name} • {pleat.name} • {hem.name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 text-sm font-bold">
                    <span className="text-berber-text">Total Commission Value:</span>
                    <span className="text-berber-black font-mono text-base">৳{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Contact Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Mahfuzur Rahman"
                      className="w-full bg-white border border-berber-border rounded-xl px-4 py-3 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-2">
                      Phone Number (for WhatsApp Concierge) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full bg-white border border-berber-border rounded-xl px-4 py-3 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-2">
                      Special Tailoring Notes / Event Date
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Wedding on 15th Nov, preference for high-waisted rise"
                      className="w-full bg-white border border-berber-border rounded-xl px-4 py-3 text-xs text-berber-black focus:outline-none focus:border-berber-gold"
                    />
                  </div>
                </div>

                {/* Payment Option Tier Selection */}
                <div>
                  <label className="text-xs font-bold text-berber-black uppercase tracking-wider block mb-3">
                    Payment Preference
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentChoice("DEPOSIT_50")}
                      className={`p-4 rounded-2xl border text-left transition ${
                        paymentChoice === "DEPOSIT_50"
                          ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold shadow-sm"
                          : "bg-white border-berber-border text-berber-text-muted hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-berber-black text-sm">50% Commitment Deposit</span>
                        <span className="text-xs font-mono font-bold text-berber-gold">৳{depositAmount.toLocaleString()}</span>
                      </div>
                      <span className="text-[11px] text-berber-text-muted block leading-relaxed">
                        Pay 50% now to reserve European cloth & start master cutting. Balance due at final fitting.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentChoice("FULL_100")}
                      className={`p-4 rounded-2xl border text-left transition ${
                        paymentChoice === "FULL_100"
                          ? "bg-berber-gold/10 border-berber-gold text-berber-black font-bold ring-1 ring-berber-gold shadow-sm"
                          : "bg-white border-berber-border text-berber-text-muted hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-berber-black text-sm">100% Full Payment</span>
                        <span className="text-xs font-mono font-bold text-berber-gold">৳{totalPrice.toLocaleString()}</span>
                      </div>
                      <span className="text-[11px] text-berber-text-muted block leading-relaxed">
                        Full payment upfront with VIP Priority atelier cutter allocation.
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-berber-gold hover:bg-yellow-600 disabled:opacity-50 text-white font-bold py-4 rounded-full text-sm transition flex items-center justify-center gap-2 shadow-xl shadow-berber-gold/20"
                >
                  {isSubmitting ? (
                    <span>Logging Commission Blueprint...</span>
                  ) : (
                    <>
                      <span>
                        Submit Commission (
                        {paymentChoice === "DEPOSIT_50"
                          ? `Pay 50% Deposit ৳${depositAmount.toLocaleString()}`
                          : `Pay Full ৳${totalPrice.toLocaleString()}`}
                        )
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Stepper Footer Controls */}
            <div className="flex justify-between items-center pt-4">
              {currentStepIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex((idx) => Math.max(0, idx - 1))}
                  className="px-5 py-2.5 rounded-full border border-berber-border bg-white text-berber-black hover:bg-berber-muted text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous: {steps[currentStepIndex - 1]?.label}
                </button>
              ) : <div />}

              {currentStepIndex < steps.length - 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStepIndex((idx) => Math.min(steps.length - 1, idx + 1))}
                  className="px-6 py-2.5 rounded-full bg-berber-gold hover:bg-yellow-600 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-berber-gold/10 ml-auto"
                >
                  Continue: {steps[currentStepIndex + 1]?.label}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
