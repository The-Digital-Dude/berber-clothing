"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface Props {
  value: string
  onChange: (url: string) => void
  bucket?: string
}

export default function ImagePicker({ value, onChange, bucket }: Props) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
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
      if (bucket) fd.append("bucket", bucket)
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onChange(data.url)
      toast.success("Image uploaded")
    } catch (e: any) {
      toast.error(e.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function handleFiles(files: FileList | null) {
    if (files?.[0]) upload(files[0])
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
            <Image src={value} alt="Preview" fill className="object-cover" />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground w-5 h-5 flex items-center justify-center shadow"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 w-full h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground text-center">
                Drop image here or click to browse<br />
                <span className="text-[10px]">JPG, PNG, WEBP up to 5MB</span>
              </p>
            </>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
          Replace image
        </Button>
      )}
    </div>
  )
}
