"use client"

import { useState, useRef, useCallback } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { PlusCircle, Trash2, ImagePlus, X, Upload, Link as LinkIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  comparePrice: z.coerce.number().optional().nullable(),
  tags: z.string().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  variants: z.array(z.object({
    size: z.string().min(1),
    color: z.string().min(1),
    colorHex: z.string().optional(),
    sku: z.string().min(1),
    stock: z.coerce.number().min(0),
    price: z.coerce.number().optional().nullable()
  }))
})

export default function ProductForm({ initialData, categories }: { initialData?: any, categories: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<{ url: string; alt: string }[]>(
    initialData?.images?.map((img: any) => ({ url: img.url, alt: img.alt || "" })) || []
  )
  const [newImageUrl, setNewImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [dragImageIdx, setDragImageIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setImages(prev => [...prev, { url: data.url, alt: file.name.replace(/\.[^.]+$/, "") }])
      toast.success("Image uploaded")
    } catch (e: any) {
      toast.error(e.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    files.forEach(uploadFile)
  }, [uploadFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(uploadFile)
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

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: "variants"
  })

  // Auto-generate slug from name if empty
  const watchName = watch("name")
  if (!initialData && watchName && !watch("slug")) {
    setValue("slug", watchName.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^\w-]+/g, ''))
  }

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        tags: data.tags || null,
        images
      }

      const url = initialData ? `/api/admin/products/${initialData.id}` : "/api/admin/products"
      const method = initialData ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to save product")
      }
      toast.success(initialData ? "Product updated" : "Product created")
      router.push("/admin/products")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{initialData ? "Edit Product" : "Add Product"}</h2>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Product"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input {...register("name")} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <input {...register("slug")} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea {...register("description")} rows={4} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Variants (Size & Color)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {variantFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-7 gap-2 items-end">
                  <div className="col-span-1 space-y-1">
                    <label className="text-xs">Size</label>
                    <input {...register(`variants.${index}.size`)} className="w-full rounded border px-2 py-1 text-sm" placeholder="M" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-xs">Color</label>
                    <input {...register(`variants.${index}.color`)} className="w-full rounded border px-2 py-1 text-sm" placeholder="Red" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-xs">Hex</label>
                    <input type="color" {...register(`variants.${index}.colorHex`)} className="w-full h-7 cursor-pointer rounded border p-0" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs">SKU</label>
                    <input {...register(`variants.${index}.sku`)} className="w-full rounded border px-2 py-1 text-sm" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <label className="text-xs">Stock</label>
                    <input type="number" {...register(`variants.${index}.stock`)} className="w-full rounded border px-2 py-1 text-sm" />
                  </div>
                  <div className="col-span-1">
                    <Button type="button" variant="destructive" size="sm" className="w-full h-8" onClick={() => removeVariant(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => appendVariant({ size: "", color: "", sku: "", stock: 0 })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Pricing & Category</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <select {...register("categoryId")} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Price</label>
                <input type="number" step="0.01" {...register("price")} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Compare Price</label>
                <input type="number" step="0.01" {...register("comparePrice")} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <input {...register("tags")} className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="summer, casual" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" {...register("isActive")} />
                <label htmlFor="isActive" className="text-sm font-medium cursor-pointer">Active</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isFeatured" {...register("isFeatured")} />
                <label htmlFor="isFeatured" className="text-sm font-medium cursor-pointer">Featured</label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Product Images</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              {/* Drag & Drop Upload Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="w-8 h-8" />
                    <p className="text-sm font-medium">Drop images here or click to browse</p>
                    <p className="text-xs">JPG, PNG, WEBP, AVIF · Max 5MB each</p>
                  </div>
                )}
              </div>

              {/* Image previews — drag to reorder */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={() => setDragImageIdx(i)}
                      onDragEnter={() => setDragOverIdx(i)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={() => {
                        if (dragImageIdx !== null && dragOverIdx !== null && dragImageIdx !== dragOverIdx) {
                          const reordered = [...images]
                          const [moved] = reordered.splice(dragImageIdx, 1)
                          reordered.splice(dragOverIdx, 0, moved)
                          setImages(reordered)
                        }
                        setDragImageIdx(null)
                        setDragOverIdx(null)
                      }}
                      className={`relative group rounded overflow-hidden border bg-muted aspect-square cursor-grab active:cursor-grabbing transition-opacity ${
                        dragImageIdx === i ? "opacity-40" : dragOverIdx === i ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <img src={img.url} alt={img.alt || `Image ${i + 1}`} className="w-full h-full object-cover pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* URL fallback */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Or paste an image URL"
                    className="w-full h-9 pl-8 pr-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newImageUrl.trim()) return
                    setImages([...images, { url: newImageUrl.trim(), alt: "" }])
                    setNewImageUrl("")
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-input rounded-md hover:bg-muted transition-colors whitespace-nowrap"
                >
                  <ImagePlus className="w-4 h-4" /> Add URL
                </button>
              </div>
              <p className="text-xs text-muted-foreground">First image = cover photo. Drag images to reorder.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
