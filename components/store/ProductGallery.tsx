"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react"

export default function ProductGallery({ images }: { images: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex]?.url || "/placeholder.jpg"

  const nextImage = () => setActiveIndex((i) => (i + 1) % (images.length || 1))
  const prevImage = () => setActiveIndex((i) => (i - 1 + (images.length || 1)) % (images.length || 1))

  return (
    <div className="flex flex-col md:flex-row-reverse gap-4 md:gap-6 sticky top-20">
      
      {/* Main Image */}
      <div className="w-full flex-1 relative bg-berber-muted overflow-hidden group">
        <div className="aspect-[3/4] md:aspect-[4/5] w-full">
          <Image
            src={activeImage}
            alt="Product Image"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 cursor-zoom-in"
            priority
          />
        </div>

        {/* Mobile Arrows */}
        {images.length > 1 && (
          <>
            <button onClick={prevImage} className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <ChevronLeft className="w-5 h-5 text-berber-black" />
            </button>
            <button onClick={nextImage} className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <ChevronRight className="w-5 h-5 text-berber-black" />
            </button>
          </>
        )}

        <button className="hidden md:flex absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-sm text-berber-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-berber-gold hover:text-white shadow-sm">
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="flex md:flex-col gap-3 overflow-x-auto md:w-20 lg:w-24 shrink-0 pb-2 md:pb-0 hide-scrollbar snap-x">
        {images.map((img, idx) => (
          <button 
            key={img.id} 
            onClick={() => setActiveIndex(idx)}
            className={`relative aspect-[3/4] w-20 md:w-full overflow-hidden transition-all snap-center rounded-sm ${activeIndex === idx ? "ring-1 ring-berber-black ring-offset-2 opacity-100" : "opacity-60 hover:opacity-100"}`}
          >
            <Image src={img.url} alt={img.alt || "Thumbnail"} fill sizes="96px" className="object-cover" />
          </button>
        ))}
        {images.length === 0 && (
          <div className="aspect-[3/4] w-20 md:w-full bg-berber-muted rounded-sm" />
        )}
      </div>

    </div>
  )
}
