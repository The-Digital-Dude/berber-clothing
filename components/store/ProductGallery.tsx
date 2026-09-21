"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, ZoomIn, Play, X } from "lucide-react"

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/)
  return m ? m[1] : null
}

function Lightbox({ images, startIndex, onClose }: { images: any[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex)

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    document.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
    }
  }, [onClose, prev, next])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X className="w-7 h-7" />
      </button>

      {/* Counter */}
      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-xs tracking-widest">
        {idx + 1} / {images.length}
      </span>

      {/* Image */}
      <div
        className="relative w-full h-full max-w-4xl max-h-[90vh] mx-auto px-16"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[idx]?.url}
          alt={images[idx]?.alt || "Product"}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>

      {/* Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/25 text-white rounded-full transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i) }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductGallery({ images, videoUrl }: { images: any[]; videoUrl?: string | null }) {
  // -1 = video slot
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const showVideo = activeIndex === -1 && !!videoUrl
  const activeImage = images[activeIndex]?.url || "/placeholder.jpg"

  const nextImage = () => setActiveIndex((i) => (i + 1) % (images.length || 1))
  const prevImage = () => setActiveIndex((i) => (i - 1 + (images.length || 1)) % (images.length || 1))

  const openLightbox = () => { if (!showVideo && images.length > 0) setLightboxOpen(true) }

  return (
    <>
    {lightboxOpen && (
      <Lightbox images={images} startIndex={activeIndex} onClose={() => setLightboxOpen(false)} />
    )}
    <div className="flex flex-col md:flex-row-reverse gap-4 md:gap-6 sticky top-20">

      {/* Main Image / Video */}
      <div className="w-full flex-1 relative bg-berber-muted overflow-hidden group">
        <div className="aspect-[3/4] md:aspect-[4/5] w-full">
          {showVideo && videoUrl ? (
            getYouTubeId(videoUrl) ? (
              <iframe
                src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}?autoplay=1`}
                allow="autoplay; fullscreen"
                className="w-full h-full"
                title="Product video"
              />
            ) : (
              <video src={videoUrl} controls autoPlay className="w-full h-full object-cover" />
            )
          ) : (
            <button onClick={openLightbox} className="absolute inset-0 w-full h-full cursor-zoom-in">
              <Image
                src={activeImage}
                alt="Product Image"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                priority
              />
            </button>
          )}
        </div>

        {/* Mobile Arrows */}
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); prevImage() }} className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <ChevronLeft className="w-5 h-5 text-berber-black" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); nextImage() }} className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <ChevronRight className="w-5 h-5 text-berber-black" />
            </button>
          </>
        )}

        <button
          onClick={openLightbox}
          className="hidden md:flex absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-sm text-berber-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-berber-gold hover:text-white shadow-sm"
          aria-label="Zoom image"
        >
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
        {videoUrl && (
          <button
            onClick={() => setActiveIndex(-1)}
            className={`relative aspect-[3/4] w-20 md:w-full overflow-hidden transition-all snap-center rounded-sm bg-berber-black flex items-center justify-center ${activeIndex === -1 ? "ring-1 ring-berber-gold ring-offset-2" : "opacity-70 hover:opacity-100"}`}
          >
            <Play className="w-6 h-6 text-white fill-white" />
          </button>
        )}
        {images.length === 0 && !videoUrl && (
          <div className="aspect-[3/4] w-20 md:w-full bg-berber-muted rounded-sm" />
        )}
      </div>

    </div>
    </>
  )
}
