"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import {
  PlusCircle, Trash2, X, Upload, Link as LinkIcon, Loader2,
  Package, Tag, Image as ImageIcon, Search, ChevronDown, Layers, FileText,
  Save, ArrowLeft, Eye, EyeOff, Star, StarOff
} from "lucide-react"
import { toast } from "sonner"

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullish(),
  categoryId: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  comparePrice: z.preprocess(
    (v) => (v === "" || v === undefined || v === null || Number(v) === 0 ? null : v),
    z.coerce.number().positive().nullable()
  ),
  tags: z.string().nullish(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().nullish(),
  seoDescription: z.string().nullish(),
  seoKeywords: z.string().nullish(),
  videoUrl: z.string().nullish(),
  sizeChartImage: z.string().nullish(),
  variants: z.array(z.object({
    size: z.string().min(1),
    color: z.string().min(1),
    colorHex: z.string().nullish(),
    sku: z.string().nullish(),
    stock: z.coerce.number().min(0),
    price: z.coerce.number().nullish(),
    comparePrice: z.preprocess(
      (v) => (v === "" || v === undefined || v === null || Number(v) === 0 ? null : v),
      z.coerce.number().positive().nullable()
    ),
  }))
})

// ─── Field helpers ────────────────────────────────────────────────────────────
function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">{label}</label>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inputCls = "w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-gray-300"
const textareaCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-gray-300 resize-none"

// ─── Set Builder ──────────────────────────────────────────────────────────────
function SetBuilder({ productId }: { productId: string }) {
  const [companions, setCompanions] = useState<{ id: string; name: string; price: number; image?: string }[]>([])
  const [discountPct, setDiscountPct] = useState<string>("")
  const [search, setSearch] = useState("")
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; price: number; image?: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/products/bundle/${productId}`)
      .then(r => r.json())
      .then(d => {
        if (d.bundle) {
          setDiscountPct(d.bundle.discountPct ? String(d.bundle.discountPct) : "")
          setCompanions(d.bundle.items.map((item: any) => ({
            id: item.product.id, name: item.product.name,
            price: Number(item.product.price), image: item.product.images?.[0]?.url,
          })))
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [productId])

  useEffect(() => {
    if (!search.trim()) { setSuggestions([]); return }
    const t = setTimeout(() => {
      fetch(`/api/admin/products?search=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then((d: any[]) => {
          const ids = new Set([productId, ...companions.map(c => c.id)])
          setSuggestions(d.filter(p => !ids.has(p.id)).slice(0, 6).map(p => ({
            id: p.id, name: p.name, price: Number(p.price), image: p.images?.[0]?.url,
          })))
        })
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [search, companions, productId])

  const addCompanion = (p: { id: string; name: string; price: number; image?: string }) => {
    setCompanions(prev => [...prev, p]); setSearch(""); setSuggestions([])
  }
  const removeCompanion = (id: string) => setCompanions(prev => prev.filter(c => c.id !== id))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/products/bundle/${productId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountPct: discountPct ? Number(discountPct) : null, companionProductIds: companions.map(c => c.id) }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Set bundle saved")
    } catch { toast.error("Failed to save set") }
    finally { setSaving(false) }
  }

  if (!loaded) return <p className="text-xs text-gray-400 py-2">Loading…</p>

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 leading-relaxed">
        Add companion pieces (Pant, Koti, etc.) customers can optionally add when buying this product. Each piece keeps its own price and stock.
      </p>

      {/* Companion list */}
      <div className="space-y-2">
        {companions.map(c => (
          <div key={c.id} className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
            {c.image && <img src={c.image} alt={c.name} className="w-9 h-9 object-cover rounded-md shrink-0" />}
            <span className="text-sm font-medium flex-1 text-gray-800">{c.name}</span>
            <span className="text-xs text-gray-500 font-mono">৳{c.price.toLocaleString()}</span>
            <button type="button" onClick={() => removeCompanion(c.id)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {companions.length === 0 && (
          <div className="border-2 border-dashed border-gray-200 rounded-lg px-4 py-6 text-center">
            <Layers className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
            <p className="text-xs text-gray-400">No companion pieces yet</p>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search product to add as a piece…"
          className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {suggestions.map(s => (
              <button type="button" key={s.id} onClick={() => addCompanion(s)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-indigo-50 text-left">
                {s.image && <img src={s.image} alt={s.name} className="w-8 h-8 object-cover rounded-md shrink-0" />}
                <span className="flex-1 text-sm text-gray-800">{s.name}</span>
                <span className="text-xs text-gray-400 font-mono">৳{s.price.toLocaleString()}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Discount */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
        <label className="text-xs font-semibold text-gray-600 whitespace-nowrap">Bundle discount</label>
        <div className="flex items-center gap-1 flex-1">
          <input type="number" min="0" max="100" step="0.5" value={discountPct}
            onChange={e => setDiscountPct(e.target.value)} placeholder="0"
            className="w-20 h-8 rounded-md border border-gray-200 bg-white px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <span className="text-sm text-gray-500">%</span>
        </div>
        <span className="text-xs text-gray-400">off set total</span>
      </div>

      <button type="button" onClick={save} disabled={saving}
        className="w-full h-9 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save Set Bundle
      </button>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function ProductForm({ initialData, categories }: { initialData?: any; categories: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"general" | "media" | "seo" | "set">("general")
  const [images, setImages] = useState<{ url: string; alt: string }[]>(
    initialData?.images?.map((img: any) => ({ url: img.url, alt: img.alt || "" })) || []
  )
  const [newImageUrl, setNewImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadingChartImage, setUploadingChartImage] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [dragImageIdx, setDragImageIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only image files are allowed"); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImages(prev => [...prev, { url: data.url, alt: file.name.replace(/\.[^.]+$/, "") }])
      toast.success("Image uploaded")
    } catch (e: any) { toast.error(e.message || "Upload failed") }
    finally { setUploading(false) }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    Array.from(e.dataTransfer.files).forEach(uploadFile)
  }, [uploadFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(uploadFile)
    e.target.value = ""
  }, [uploadFile])

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      name: "", slug: "", description: "", categoryId: "", price: 0,
      tags: "", isActive: true, isFeatured: false,
      variants: [{ size: "M", color: "Black", sku: "", stock: 0 }]
    }
  })

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control, name: "variants" })

  const watchName = watch("name")
  const [slugEdited, setSlugEdited] = useState(false)
  useEffect(() => {
    if (!initialData && !slugEdited)
      setValue("slug", (watchName || "").toLowerCase().replace(/[\s_]+/g, "-").replace(/[^\w-]+/g, ""), { shouldValidate: true })
  }, [watchName, initialData, slugEdited, setValue])

  const isActive = watch("isActive")
  const isFeatured = watch("isFeatured")

  const onInvalid = (errs: any) => {
    const fieldLabels: Record<string, string> = {
      name: "Product Name", slug: "Slug", categoryId: "Category",
      price: "Price", variants: "Variants",
    }
    const missing = Object.keys(errs)
      .filter(k => fieldLabels[k])
      .map(k => fieldLabels[k])
    const hasGeneral = errs.name || errs.slug || errs.variants
    const hasSidebar = errs.categoryId || errs.price
    if (hasGeneral) setActiveTab("general")
    else if (hasSidebar) {} // errors visible in sidebar
    const msg = missing.length ? `Required: ${missing.join(", ")}` : "Please fix validation errors"
    toast.error(msg)
  }

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const payload = { ...data, tags: data.tags || null, images }
      const url = initialData ? `/api/admin/products/${initialData.id}` : "/api/admin/products"
      const res = await fetch(url, { method: initialData ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Failed to save") }
      toast.success(initialData ? "Product updated" : "Product created")
      router.push("/admin/products"); router.refresh()
    } catch (error: any) { toast.error(error.message || "Something went wrong") }
    finally { setLoading(false) }
  }

  const generalHasError = !!(errors.name || errors.slug || errors.variants)
  const tabs = [
    { id: "general", label: "General", icon: Package, hasError: generalHasError },
    { id: "media", label: "Media", icon: ImageIcon, hasError: false },
    { id: "seo", label: "SEO", icon: FileText, hasError: false },
    ...(initialData?.id ? [{ id: "set", label: "Set Builder", icon: Layers, hasError: false }] : []),
  ] as const

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="min-h-screen bg-gray-50" noValidate>
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">{initialData ? watch("name") || "Edit Product" : "New Product"}</h1>
            <p className="text-xs text-gray-400">{initialData ? `ID: ${initialData.id.slice(0, 8)}…` : "Fill in the details below"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { setValue("isActive", !isActive) }}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-lg border text-xs font-medium transition-colors ${isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-500"}`}>
            {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {isActive ? "Active" : "Inactive"}
          </button>
          <button type="button" onClick={() => { setValue("isFeatured", !isFeatured) }}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-lg border text-xs font-medium transition-colors ${isFeatured ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 bg-white text-gray-500"}`}>
            {isFeatured ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
            Featured
          </button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-4 h-9 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Tab nav */}
            <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1">
              {tabs.map(({ id, label, icon: Icon, hasError }) => (
                <button key={id} type="button" onClick={() => setActiveTab(id as any)}
                  className={`relative flex items-center gap-1.5 flex-1 justify-center px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${activeTab === id ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                  {hasError && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />}
                </button>
              ))}
            </div>

            {/* General tab */}
            {activeTab === "general" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                <Field label="Product Name" error={errors.name?.message as string}>
                  <input {...register("name")} className={inputCls} placeholder="e.g. Classic Wool Blazer" />
                </Field>
                <Field label="Slug" hint="Used in the product URL — auto-generated from name">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 shrink-0">/shop/</span>
                    <input {...register("slug")} onChange={e => { setSlugEdited(true); setValue("slug", e.target.value, { shouldValidate: true }) }}
                      className={`${inputCls} ${errors.slug ? "border-red-400 ring-1 ring-red-400" : ""}`} placeholder="classic-wool-blazer" />
                  </div>
                </Field>
                <Field label="Description">
                  <textarea {...register("description")} rows={4} className={textareaCls} placeholder="Describe the product — fabric, fit, occasion…" />
                </Field>
                <Field label="Tags" hint="Comma-separated for filtering and search">
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                    <input {...register("tags")} className={`${inputCls} pl-8`} placeholder="blazer, formal, wool" />
                  </div>
                </Field>

                {/* Variants */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Variants</label>
                    <button type="button" onClick={() => appendVariant({ size: "", color: "", sku: "", stock: 0 })}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                      <PlusCircle className="w-3.5 h-3.5" /> Add variant
                    </button>
                  </div>

                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_1fr_36px_1fr_80px_80px_80px_36px] gap-0 bg-gray-50 border-b border-gray-200">
                      {["Size", "Color", "Hex", "SKU", "Stock", "Price", "Was", ""].map((h, i) => (
                        <div key={i} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</div>
                      ))}
                    </div>

                    {variantFields.map((field, index) => (
                      <div key={field.id}
                        className="grid grid-cols-[1fr_1fr_36px_1fr_80px_80px_80px_36px] gap-0 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                        <div className="p-1.5">
                          <input {...register(`variants.${index}.size`)} placeholder="M"
                            className="w-full h-8 rounded-md border border-gray-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <div className="p-1.5">
                          <input {...register(`variants.${index}.color`)} placeholder="Black"
                            className="w-full h-8 rounded-md border border-gray-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <div className="p-1.5">
                          <input type="color" {...register(`variants.${index}.colorHex`)}
                            className="w-8 h-8 rounded-md border border-gray-200 cursor-pointer p-0.5" />
                        </div>
                        <div className="p-1.5">
                          <input {...register(`variants.${index}.sku`)} placeholder="Auto"
                            className="w-full h-8 rounded-md border border-gray-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <div className="p-1.5">
                          <input type="number" {...register(`variants.${index}.stock`)} placeholder="0"
                            className="w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <div className="p-1.5">
                          <input type="number" step="0.01" {...register(`variants.${index}.price`)} placeholder="—"
                            className="w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <div className="p-1.5">
                          <input type="number" step="0.01" {...register(`variants.${index}.comparePrice`)} placeholder="—"
                            className="w-full h-8 rounded-md border border-gray-200 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                        </div>
                        <div className="p-1.5 flex items-center justify-center">
                          <button type="button" onClick={() => removeVariant(index)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {variantFields.length === 0 && (
                      <div className="py-8 text-center text-xs text-gray-400">No variants yet — click "Add variant"</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Media tab */}
            {activeTab === "media" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                {/* Drop zone */}
                <div onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                      <p className="text-sm font-medium">Uploading…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-1">
                        <Upload className="w-5 h-5 text-indigo-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">Drop images here or click to browse</p>
                      <p className="text-xs text-gray-400">JPG, PNG, WEBP, AVIF · Max 5MB each</p>
                    </div>
                  )}
                </div>

                {/* Image grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {images.map((img, i) => (
                      <div key={i} draggable
                        onDragStart={() => setDragImageIdx(i)} onDragEnter={() => setDragOverIdx(i)}
                        onDragOver={e => e.preventDefault()}
                        onDragEnd={() => {
                          if (dragImageIdx !== null && dragOverIdx !== null && dragImageIdx !== dragOverIdx) {
                            const r = [...images]; const [m] = r.splice(dragImageIdx, 1); r.splice(dragOverIdx, 0, m); setImages(r)
                          }
                          setDragImageIdx(null); setDragOverIdx(null)
                        }}
                        className={`relative group rounded-xl overflow-hidden border aspect-square cursor-grab active:cursor-grabbing transition-all ${dragImageIdx === i ? "opacity-40 scale-95" : dragOverIdx === i ? "ring-2 ring-indigo-400 ring-offset-1" : "hover:shadow-md"}`}>
                        <img src={img.url} alt={img.alt || `Image ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
                        <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                          className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                          <X className="w-3 h-3" />
                        </button>
                        {i === 0 && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent pt-4 pb-1.5 px-2">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Cover</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* URL fallback */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                    <input type="url" value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
                      placeholder="Or paste an image URL"
                      className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <button type="button" onClick={() => { if (!newImageUrl.trim()) return; setImages([...images, { url: newImageUrl.trim(), alt: "" }]); setNewImageUrl("") }}
                    className="px-4 h-10 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap">
                    Add URL
                  </button>
                </div>
                <p className="text-xs text-gray-400">First image is the cover photo. Drag to reorder.</p>
              </div>
            )}

            {/* SEO tab */}
            {activeTab === "seo" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
                <Field label="Meta Title" hint="Defaults to product name if left blank">
                  <input {...register("seoTitle")} className={inputCls} placeholder="Product name for search engines" />
                </Field>
                <Field label="Meta Description" hint="Shown below the link in search results">
                  <textarea {...register("seoDescription")} rows={3} className={textareaCls} placeholder="A short description for search engines…" />
                </Field>
                <Field label="Meta Keywords">
                  <input {...register("seoKeywords")} className={inputCls} placeholder="blazer, formal, wool, bangladesh" />
                </Field>
                <Field label="Product Video" hint="YouTube link or direct MP4 URL">
                  <input {...register("videoUrl")} className={inputCls} placeholder="https://youtube.com/watch?v=..." />
                </Field>
                <Field label="Size Chart Image" hint="Shown in the Size Guide modal — overrides the category chart">
                  {watch("sizeChartImage") && (
                    <div className="relative w-40 h-24 rounded-xl overflow-hidden border border-gray-200 mb-2 group">
                      <img src={watch("sizeChartImage")} alt="Size chart" className="w-full h-full object-contain bg-gray-50" />
                      <button type="button" onClick={() => setValue("sizeChartImage", "")}
                        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <label className={`flex items-center gap-2 h-10 px-4 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 cursor-pointer hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors w-fit ${uploadingChartImage ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploadingChartImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploadingChartImage ? "Uploading…" : "Upload chart image"}
                    <input type="file" accept="image/*" disabled={uploadingChartImage} className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return
                        setUploadingChartImage(true)
                        try {
                          const fd = new FormData(); fd.append("file", file)
                          const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
                          const data = await res.json()
                          if (!res.ok) throw new Error(data.error)
                          setValue("sizeChartImage", data.url)
                        } catch (err: any) { toast.error(err.message || "Upload failed") }
                        finally { setUploadingChartImage(false); e.target.value = "" }
                      }} />
                  </label>
                </Field>
              </div>
            )}

            {/* Set Builder tab */}
            {activeTab === "set" && initialData?.id && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <SetBuilder productId={initialData.id} />
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Pricing */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Pricing</h3>
              <Field label="Regular Price (৳)" error={errors.price?.message as string}>
                <input type="number" step="0.01" {...register("price")} className={`${inputCls} font-mono ${errors.price ? "border-red-400 ring-1 ring-red-400" : ""}`} placeholder="0" />
              </Field>
              <Field label="Compare-at Price (৳)" hint="Strike-through price shown before sale">
                <input type="number" step="0.01" {...register("comparePrice")} className={`${inputCls} font-mono`} placeholder="0" />
              </Field>
            </div>

            {/* Category */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Organisation</h3>
              <Field label="Category" error={errors.categoryId?.message as string}>
                <div className="relative">
                  <select {...register("categoryId")} className={`${inputCls} appearance-none pr-8 ${errors.categoryId ? "border-red-400 ring-1 ring-red-400" : ""}`}>
                    <option value="">Select category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </Field>
            </div>

            {/* Status cards */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Visibility</h3>
              <button type="button" onClick={() => setValue("isActive", !isActive)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-medium ${isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-50 text-gray-500"}`}>
                <div className="flex items-center gap-2">
                  {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {isActive ? "Visible to customers" : "Hidden from store"}
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${isActive ? "bg-emerald-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${isActive ? "left-4" : "left-0.5"}`} />
                </div>
              </button>
              <button type="button" onClick={() => setValue("isFeatured", !isFeatured)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-medium ${isFeatured ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 bg-gray-50 text-gray-500"}`}>
                <div className="flex items-center gap-2">
                  {isFeatured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                  {isFeatured ? "Featured product" : "Not featured"}
                </div>
                <div className={`w-8 h-4 rounded-full transition-colors relative ${isFeatured ? "bg-amber-400" : "bg-gray-300"}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${isFeatured ? "left-4" : "left-0.5"}`} />
                </div>
              </button>
            </div>

            {/* Summary */}
            <div className="bg-indigo-600 rounded-2xl p-5 text-white space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">Summary</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="opacity-70">Variants</span>
                  <span className="font-bold">{variantFields.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Images</span>
                  <span className="font-bold">{images.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Total stock</span>
                  <span className="font-bold">{variantFields.reduce((acc, _, i) => acc + (Number(watch(`variants.${i}.stock`)) || 0), 0)}</span>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-10 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {loading ? "Saving…" : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
