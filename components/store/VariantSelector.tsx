"use client"

import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"
import { useCartStore } from "@/store/useCartStore"
import { useCartUIStore } from "@/store/useCartUIStore"
import { useCompareStore } from "@/store/useCompareStore"
import NotifyMeForm from "@/components/store/NotifyMeForm"
import SizeGuideModal from "@/components/store/SizeGuideModal"
import SizeQuiz from "@/components/store/SizeQuiz"
import { Columns2, Truck, Clock, Layers, Sparkles, Check, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export type PackageTier = "1-piece" | "2-piece" | "3-piece"

export default function VariantSelector({
  product,
  flashSale,
  attr1Label = "Size",
  attr2Label = "Color",
  categoryId,
  sizeChartImage,
  matchingSet,
  initialPackage,
}: {
  product: any
  flashSale?: any
  attr1Label?: string
  attr2Label?: string
  categoryId?: string
  sizeChartImage?: string | null
  matchingSet?: {
    waistcoat?: any | null
    trouser?: any | null
  }
  initialPackage?: string
}) {
  const router = useRouter()
  const addItem = useCartStore((s) => s.addItem)
  const openCartDrawer = useCartUIStore((s) => s.open)
  const { toggleItem: toggleCompare, hasItem: inCompare } = useCompareStore()
  const comparing = inCompare(product.id)

  const waistcoat = matchingSet?.waistcoat
  const trouser = matchingSet?.trouser
  const hasMatchingSet = !!(waistcoat && trouser)
  const hasWaistcoatOnly = !!(waistcoat && !trouser)

  // Package Tier State
  const defaultPackage: PackageTier =
    initialPackage === "3-piece" && hasMatchingSet
      ? "3-piece"
      : initialPackage === "2-piece" && (hasMatchingSet || hasWaistcoatOnly)
      ? "2-piece"
      : hasMatchingSet
      ? "3-piece" // Default to complete suit if available for superior customer experience
      : "1-piece"

  const [selectedPackage, setSelectedPackage] = useState<PackageTier>(defaultPackage)

  // Blazer Variants
  const blazerVariants = product.variants || []
  const blazerSizes = Array.from(new Set(blazerVariants.map((v: any) => v.size))) as string[]
  const colors = Array.from(new Set(blazerVariants.map((v: any) => v.color))) as string[]

  // Waistcoat Variants
  const waistcoatVariants = waistcoat?.variants || []
  const waistcoatSizes = Array.from(new Set(waistcoatVariants.map((v: any) => v.size))) as string[]

  // Trouser Variants
  const trouserVariants = trouser?.variants || []
  const trouserSizes = Array.from(new Set(trouserVariants.map((v: any) => v.size))) as string[]

  // Selections
  const [selectedColor, setSelectedColor] = useState<string | null>(colors[0] || null)
  const [selectedBlazerSize, setSelectedBlazerSize] = useState<string | null>(blazerSizes[0] || null)
  const [selectedWaistcoatSize, setSelectedWaistcoatSize] = useState<string | null>(waistcoatSizes[0] || blazerSizes[0] || null)
  const [selectedTrouserSize, setSelectedTrouserSize] = useState<string | null>(trouserSizes[0] || "32")

  // Auto-align waistcoat size when blazer size changes if available
  const handleBlazerSizeChange = (size: string) => {
    setSelectedBlazerSize(size)
    if (waistcoatSizes.includes(size)) {
      setSelectedWaistcoatSize(size)
    }
  }

  // Active Variant Lookups
  const activeBlazerVariant = useMemo(() => {
    return blazerVariants.find((v: any) => v.size === selectedBlazerSize && v.color === selectedColor)
  }, [selectedBlazerSize, selectedColor, blazerVariants])

  const activeWaistcoatVariant = useMemo(() => {
    if (!waistcoat) return null
    return waistcoatVariants.find((v: any) => v.size === selectedWaistcoatSize && (v.color === selectedColor || !v.color))
      || waistcoatVariants.find((v: any) => v.size === selectedWaistcoatSize)
  }, [selectedWaistcoatSize, selectedColor, waistcoatVariants, waistcoat])

  const activeTrouserVariant = useMemo(() => {
    if (!trouser) return null
    return trouserVariants.find((v: any) => v.size === selectedTrouserSize && (v.color === selectedColor || !v.color))
      || trouserVariants.find((v: any) => v.size === selectedTrouserSize)
  }, [selectedTrouserSize, selectedColor, trouserVariants, trouser])

  // Price Calculations
  const blazerPrice = Number(activeBlazerVariant?.price ?? product.price) || 0
  const waistcoatPrice = waistcoat ? (Number(activeWaistcoatVariant?.price ?? waistcoat.price) || 0) : 0
  const trouserPrice = trouser ? (Number(activeTrouserVariant?.price ?? trouser.price) || 0) : 0

  const packageTotalPrice = useMemo(() => {
    if (selectedPackage === "3-piece") {
      return blazerPrice + waistcoatPrice + trouserPrice
    }
    if (selectedPackage === "2-piece") {
      return blazerPrice + waistcoatPrice
    }
    return blazerPrice
  }, [selectedPackage, blazerPrice, waistcoatPrice, trouserPrice])

  // Stock Checks
  const blazerStock = activeBlazerVariant?.stock || 0
  const waistcoatStock = activeWaistcoatVariant?.stock || 0
  const trouserStock = activeTrouserVariant?.stock || 0

  const isOutOfStock = useMemo(() => {
    if (selectedPackage === "1-piece") return blazerStock <= 0
    if (selectedPackage === "2-piece") return blazerStock <= 0 || waistcoatStock <= 0
    if (selectedPackage === "3-piece") return blazerStock <= 0 || waistcoatStock <= 0 || trouserStock <= 0
    return false
  }, [selectedPackage, blazerStock, waistcoatStock, trouserStock])

  const outOfStockReason = useMemo(() => {
    if (blazerStock <= 0) return `Blazer Size ${selectedBlazerSize} is out of stock`
    if ((selectedPackage === "2-piece" || selectedPackage === "3-piece") && waistcoatStock <= 0) {
      return `Waistcoat Size ${selectedWaistcoatSize} is out of stock`
    }
    if (selectedPackage === "3-piece" && trouserStock <= 0) {
      return `Trouser Waist Size ${selectedTrouserSize} is out of stock`
    }
    return null
  }, [selectedPackage, blazerStock, waistcoatStock, trouserStock, selectedBlazerSize, selectedWaistcoatSize, selectedTrouserSize])

  // Delivery estimate: order before 3pm → ships today, else tomorrow
  const now = new Date()
  const cutoffHour = 15
  const shipsToday = now.getHours() < cutoffHour
  const dispatchDay = shipsToday ? "today" : "tomorrow"
  const arrivalDays = "3–5 business days"

  const addToCart = (): boolean => {
    if (!activeBlazerVariant) {
      toast.error("Please select a Blazer size.")
      return false
    }
    if (selectedPackage === "2-piece" && !activeWaistcoatVariant) {
      toast.error("Please select a Waistcoat size.")
      return false
    }
    if (selectedPackage === "3-piece" && (!activeWaistcoatVariant || !activeTrouserVariant)) {
      toast.error("Please select all sizes (Blazer, Waistcoat & Trousers).")
      return false
    }

    if (isOutOfStock) {
      toast.error(outOfStockReason || "Selected items are out of stock.")
      return false
    }

    const setGroupId = crypto.randomUUID()
    const blazerImage = product.images?.[0]?.url || ""

    // 1. Single Blazer (1-Piece)
    if (selectedPackage === "1-piece") {
      addItem({
        id: activeBlazerVariant.id,
        variantId: activeBlazerVariant.id,
        productId: product.id,
        productSlug: product.slug,
        name: `${product.name} (Single Blazer)`,
        price: blazerPrice,
        size: selectedBlazerSize!,
        color: selectedColor!,
        image: blazerImage,
        quantity: 1,
      })
      return true
    }

    // 2. Blazer with Waistcoat (2-Piece)
    if (selectedPackage === "2-piece" && waistcoat && activeWaistcoatVariant) {
      addItem({
        id: activeBlazerVariant.id,
        variantId: activeBlazerVariant.id,
        productId: product.id,
        productSlug: product.slug,
        name: `${product.name}`,
        price: blazerPrice,
        size: selectedBlazerSize!,
        color: selectedColor!,
        image: blazerImage,
        quantity: 1,
        setGroupId,
      })

      addItem({
        id: activeWaistcoatVariant.id,
        variantId: activeWaistcoatVariant.id,
        productId: waistcoat.id,
        productSlug: waistcoat.slug,
        name: `${waistcoat.name}`,
        price: waistcoatPrice,
        size: selectedWaistcoatSize!,
        color: selectedColor!,
        image: waistcoat.images?.[0]?.url || blazerImage,
        quantity: 1,
        setGroupId,
      })
      return true
    }

    // 3. Blazer with Waistcoat & Trousers (3-Piece Complete Suit)
    if (selectedPackage === "3-piece" && waistcoat && activeWaistcoatVariant && trouser && activeTrouserVariant) {
      addItem({
        id: activeBlazerVariant.id,
        variantId: activeBlazerVariant.id,
        productId: product.id,
        productSlug: product.slug,
        name: `${product.name}`,
        price: blazerPrice,
        size: selectedBlazerSize!,
        color: selectedColor!,
        image: blazerImage,
        quantity: 1,
        setGroupId,
      })

      addItem({
        id: activeWaistcoatVariant.id,
        variantId: activeWaistcoatVariant.id,
        productId: waistcoat.id,
        productSlug: waistcoat.slug,
        name: `${waistcoat.name}`,
        price: waistcoatPrice,
        size: selectedWaistcoatSize!,
        color: selectedColor!,
        image: waistcoat.images?.[0]?.url || blazerImage,
        quantity: 1,
        setGroupId,
      })

      addItem({
        id: activeTrouserVariant.id,
        variantId: activeTrouserVariant.id,
        productId: trouser.id,
        productSlug: trouser.slug,
        name: `${trouser.name}`,
        price: trouserPrice,
        size: selectedTrouserSize!,
        color: selectedColor!,
        image: trouser.images?.[0]?.url || blazerImage,
        quantity: 1,
        setGroupId,
      })
      return true
    }

    return false
  }

  const handleAddToCart = () => {
    if (addToCart()) {
      const packageLabel =
        selectedPackage === "3-piece"
          ? `3-Piece Suit (Blazer: ${selectedBlazerSize}, Waistcoat: ${selectedWaistcoatSize}, Trouser: ${selectedTrouserSize})`
          : selectedPackage === "2-piece"
          ? `2-Piece Set (Blazer: ${selectedBlazerSize}, Waistcoat: ${selectedWaistcoatSize})`
          : `Single Blazer (${selectedBlazerSize})`

      toast.success(`Added to bag!`, { description: packageLabel })
      openCartDrawer()
    }
  }

  const handleBuyNow = () => {
    if (addToCart()) {
      router.push("/checkout")
    }
  }

  return (
    <div id="variant-selector" className="space-y-7">
      {/* ─────────────────────────────────────────────────────────────
          1. PACKAGE TIER SELECTOR (Single Blazer / 2-Piece / 3-Piece)
          ───────────────────────────────────────────────────────────── */}
      {(hasMatchingSet || hasWaistcoatOnly) && (
        <div className="space-y-3 pb-2 border-b border-berber-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-berber-black flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-berber-gold" />
              Select Suit Package
            </h3>
            <span className="text-[11px] font-mono font-bold text-berber-gold">
              ৳{packageTotalPrice.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1-Piece: Single Blazer */}
            <button
              type="button"
              onClick={() => setSelectedPackage("1-piece")}
              className={`relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                selectedPackage === "1-piece"
                  ? "border-berber-black bg-berber-black text-white shadow-md"
                  : "border-berber-border bg-white text-berber-text hover:border-berber-gold"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider">1-Piece</span>
                  {selectedPackage === "1-piece" && <Check className="w-3.5 h-3.5 text-berber-gold" />}
                </div>
                <p className={`text-[11px] font-medium leading-tight ${selectedPackage === "1-piece" ? "text-neutral-300" : "text-berber-text-muted"}`}>
                  Single Blazer Only
                </p>
              </div>
              <span className={`text-xs font-mono font-bold mt-2 ${selectedPackage === "1-piece" ? "text-berber-gold" : "text-berber-black"}`}>
                ৳{blazerPrice.toLocaleString()}
              </span>
            </button>

            {/* 2-Piece: Blazer + Waistcoat */}
            {(hasMatchingSet || hasWaistcoatOnly) && (
              <button
                type="button"
                onClick={() => setSelectedPackage("2-piece")}
                className={`relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  selectedPackage === "2-piece"
                    ? "border-berber-black bg-berber-black text-white shadow-md"
                    : "border-berber-border bg-white text-berber-text hover:border-berber-gold"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">2-Piece Set</span>
                    {selectedPackage === "2-piece" && <Check className="w-3.5 h-3.5 text-berber-gold" />}
                  </div>
                  <p className={`text-[11px] font-medium leading-tight ${selectedPackage === "2-piece" ? "text-neutral-300" : "text-berber-text-muted"}`}>
                    Blazer + Waistcoat
                  </p>
                </div>
                <span className={`text-xs font-mono font-bold mt-2 ${selectedPackage === "2-piece" ? "text-berber-gold" : "text-berber-black"}`}>
                  ৳{(blazerPrice + waistcoatPrice).toLocaleString()}
                </span>
              </button>
            )}

            {/* 3-Piece: Complete Suit */}
            {hasMatchingSet && (
              <button
                type="button"
                onClick={() => setSelectedPackage("3-piece")}
                className={`relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  selectedPackage === "3-piece"
                    ? "border-berber-gold bg-berber-black text-white shadow-md ring-1 ring-berber-gold"
                    : "border-berber-gold/50 bg-berber-gold/5 text-berber-text hover:border-berber-gold"
                }`}
              >
                <div className="absolute -top-2 right-2 bg-berber-gold text-white text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full tracking-wider">
                  Complete Suit
                </div>
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-berber-gold">3-Piece</span>
                    {selectedPackage === "3-piece" && <Check className="w-3.5 h-3.5 text-berber-gold" />}
                  </div>
                  <p className={`text-[11px] font-medium leading-tight ${selectedPackage === "3-piece" ? "text-neutral-300" : "text-berber-text-muted"}`}>
                    Blazer + Waistcoat + Trouser
                  </p>
                </div>
                <span className={`text-xs font-mono font-bold mt-2 ${selectedPackage === "3-piece" ? "text-berber-gold" : "text-berber-black"}`}>
                  ৳{(blazerPrice + waistcoatPrice + trouserPrice).toLocaleString()}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. COLOR SELECTOR
          ───────────────────────────────────────────────────────────── */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-berber-black">{attr2Label}</h3>
            <span className="text-xs text-berber-text-muted">{selectedColor}</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {colors.map((color) => {
              const hasStock = blazerVariants.some((v: any) => v.color === color && v.stock > 0)
              const variant = blazerVariants.find((v: any) => v.color === color)
              const isActive = selectedColor === color

              const hexMap: Record<string, string> = {
                Black: "#000000",
                White: "#FFFFFF",
                Navy: "#1e3a8a",
                Olive: "#4d7c0f",
                Beige: "#f5f5dc",
              }
              const colorHex = variant?.colorHex || hexMap[color] || "#cccccc"

              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  disabled={!hasStock}
                  title={color}
                  className={`relative w-10 h-10 rounded-full border transition-all duration-300 flex items-center justify-center
                    ${isActive ? "scale-110 shadow-sm ring-2 ring-berber-gold ring-offset-2" : "border-transparent hover:scale-110 hover:shadow-sm"}
                    ${!hasStock ? "opacity-30 cursor-not-allowed" : ""}`}
                  style={{
                    backgroundColor: colorHex,
                    border: isActive ? "2px solid #C9A84C" : colorHex === "#FFFFFF" ? "1px solid #E8E8E4" : "none",
                  }}
                >
                  {!hasStock && (
                    <div className="absolute inset-0 w-full h-full border-t border-berber-error transform rotate-45 pointer-events-none" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. INDIVIDUAL GARMENT SIZES (Blazer, Waistcoat, Trouser)
          ───────────────────────────────────────────────────────────── */}
      <div className="space-y-5 bg-berber-muted/40 p-4 rounded-2xl border border-berber-border">
        {/* A. BLAZER SIZE */}
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-berber-black flex items-center gap-1.5">
              <span>🧥</span> Blazer Size (Chest)
            </h3>
            <div className="flex items-center gap-3">
              <SizeQuiz onSelect={(size) => handleBlazerSizeChange(size)} />
              {categoryId && <SizeGuideModal categoryId={categoryId} sizeChartImage={sizeChartImage} />}
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {blazerSizes.map((size) => {
              const specificVariant = blazerVariants.find(
                (v: any) => v.size === size && (v.color === selectedColor || !v.color)
              ) || blazerVariants.find((v: any) => v.size === size)
              const hasStock = specificVariant && specificVariant.stock > 0
              const isActive = selectedBlazerSize === size

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleBlazerSizeChange(size)}
                  disabled={!hasStock}
                  className={`relative flex flex-col items-center justify-center border transition-all duration-200 h-12 rounded-lg font-mono
                    ${
                      isActive
                        ? "border-berber-black bg-berber-black text-white font-bold shadow-sm"
                        : "border-berber-border bg-white text-berber-black hover:border-berber-gold"
                    }
                    ${!hasStock ? "opacity-40 cursor-not-allowed bg-berber-muted line-through" : ""}`}
                >
                  <span className="text-xs font-semibold">{size}</span>
                  {hasStock && specificVariant.stock <= 5 && (
                    <span className={`text-[9px] ${isActive ? "text-amber-300" : "text-berber-error"}`}>
                      {specificVariant.stock} left
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* B. WAISTCOAT SIZE (Shown for 2-Piece and 3-Piece) */}
        {(selectedPackage === "2-piece" || selectedPackage === "3-piece") && waistcoatSizes.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-berber-border/70 animate-in fade-in duration-300">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-berber-black flex items-center gap-1.5">
                <span>🦺</span> Waistcoat Size
              </h3>
              <span className="text-[11px] text-berber-text-muted">Matches Blazer Fit</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {waistcoatSizes.map((size) => {
                const specificVariant = waistcoatVariants.find(
                  (v: any) => v.size === size && (v.color === selectedColor || !v.color)
                ) || waistcoatVariants.find((v: any) => v.size === size)
                const hasStock = specificVariant && specificVariant.stock > 0
                const isActive = selectedWaistcoatSize === size

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedWaistcoatSize(size)}
                    disabled={!hasStock}
                    className={`relative flex flex-col items-center justify-center border transition-all duration-200 h-12 rounded-lg font-mono
                      ${
                        isActive
                          ? "border-berber-gold bg-berber-black text-white font-bold ring-1 ring-berber-gold"
                          : "border-berber-border bg-white text-berber-black hover:border-berber-gold"
                      }
                      ${!hasStock ? "opacity-40 cursor-not-allowed bg-berber-muted line-through" : ""}`}
                  >
                    <span className="text-xs font-semibold">{size}</span>
                    {hasStock && specificVariant.stock <= 5 && (
                      <span className={`text-[9px] ${isActive ? "text-amber-300" : "text-berber-error"}`}>
                        {specificVariant.stock} left
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* C. TROUSER SIZE (Shown for 3-Piece) */}
        {selectedPackage === "3-piece" && trouserSizes.length > 0 && (
          <div className="space-y-2.5 pt-3 border-t border-berber-border/70 animate-in fade-in duration-300">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-berber-black flex items-center gap-1.5">
                <span>👖</span> Trouser Waist Size (Inches)
              </h3>
              <span className="text-[11px] text-berber-text-muted">Standard 30–40"</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {trouserSizes.map((size) => {
                const specificVariant = trouserVariants.find(
                  (v: any) => v.size === size && (v.color === selectedColor || !v.color)
                ) || trouserVariants.find((v: any) => v.size === size)
                const hasStock = specificVariant && specificVariant.stock > 0
                const isActive = selectedTrouserSize === size

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedTrouserSize(size)}
                    disabled={!hasStock}
                    className={`relative flex flex-col items-center justify-center border transition-all duration-200 h-12 rounded-lg font-mono
                      ${
                        isActive
                          ? "border-berber-gold bg-berber-black text-white font-bold ring-1 ring-berber-gold"
                          : "border-berber-border bg-white text-berber-black hover:border-berber-gold"
                      }
                      ${!hasStock ? "opacity-40 cursor-not-allowed bg-berber-muted line-through" : ""}`}
                  >
                    <span className="text-xs font-semibold">{size}</span>
                    {hasStock && specificVariant.stock <= 5 && (
                      <span className={`text-[9px] ${isActive ? "text-amber-300" : "text-berber-error"}`}>
                        {specificVariant.stock} left
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. ACTION BUTTONS & DELIVERY ESTIMATES
          ───────────────────────────────────────────────────────────── */}
      <div className="pt-2 space-y-3">
        {/* Out of Stock or Low stock warning */}
        {isOutOfStock ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-berber-error/10 border border-berber-error/30 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-berber-error shrink-0 animate-pulse" />
            <p className="text-xs font-medium text-berber-error">{outOfStockReason || "Selected combination is currently out of stock."}</p>
          </div>
        ) : (
          (blazerStock <= 5 || (selectedPackage !== "1-piece" && waistcoatStock <= 5) || (selectedPackage === "3-piece" && trouserStock <= 5)) && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <p className="text-xs font-medium text-amber-800">
                Limited stock remaining in your selected sizes — order soon to secure your piece.
              </p>
            </div>
          )
        )}

        {/* Add to bag / Buy now */}
        {!isOutOfStock ? (
          <div className="space-y-2">
            <button
              id="add-to-bag-btn"
              type="button"
              onClick={handleAddToCart}
              disabled={!activeBlazerVariant}
              className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 bg-berber-black text-white hover:bg-berber-gold hover:shadow-lg hover:shadow-berber-gold/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
            >
              {!activeBlazerVariant ? "Select a size" : `Add ${selectedPackage === "3-piece" ? "3-Piece Suit" : selectedPackage === "2-piece" ? "2-Piece Set" : "Blazer"} to Bag`}
            </button>
            {activeBlazerVariant && (
              <button
                id="buy-now-btn"
                type="button"
                onClick={handleBuyNow}
                className="w-full py-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 bg-transparent border-2 border-berber-black text-berber-black hover:bg-berber-black hover:text-white rounded-xl"
              >
                Instant Checkout — ৳{packageTotalPrice.toLocaleString()}
              </button>
            )}
          </div>
        ) : (
          <NotifyMeForm variantId={activeBlazerVariant?.id || ""} />
        )}

        {/* Delivery estimate */}
        {!isOutOfStock && (
          <div className="flex items-center justify-between pt-1 pb-1 text-xs text-berber-text-muted border-t border-berber-border/60">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-berber-gold shrink-0" />
              <span>
                Ships {dispatchDay} (Order {shipsToday ? "now" : "by 3 PM"})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-berber-gold shrink-0" />
              <span>Arrives in {arrivalDays}</span>
            </div>
          </div>
        )}

        {/* Compare */}
        <button
          type="button"
          onClick={() => {
            toggleCompare({
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: Number(product.price),
              image: product.images?.[0]?.url,
            })
            toast.success(comparing ? "Removed from compare" : "Added to compare", {
              action: { label: "View compare", onClick: () => (window.location.href = "/compare") },
            })
          }}
          className={`w-full py-2.5 text-xs font-bold uppercase tracking-widest border transition-all duration-300 flex items-center justify-center gap-2 rounded-xl ${
            comparing
              ? "border-berber-gold text-berber-gold bg-berber-gold/5"
              : "border-berber-border text-berber-text-muted hover:border-berber-black hover:text-berber-black"
          }`}
        >
          <Columns2 className="w-4 h-4" />
          {comparing ? "In Comparison" : "Compare"}
        </button>
      </div>
    </div>
  )
}
