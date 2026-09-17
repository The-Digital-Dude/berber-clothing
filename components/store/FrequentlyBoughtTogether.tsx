"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/useCart"
import { ShoppingBag, Plus } from "lucide-react"

interface FBTProduct {
  id: string
  name: string
  slug: string
  price: number
  images: { url: string; alt?: string }[]
  variants: { id: string; size: string; color: string; stock: number }[]
}

interface Props {
  primary: FBTProduct
  suggestions: FBTProduct[]
}

export default function FrequentlyBoughtTogether({ primary, suggestions }: Props) {
  const { addItem } = useCart()

  if (suggestions.length === 0) return null

  const all = [primary, ...suggestions]
  const totalPrice = all.reduce((sum, p) => sum + p.price, 0)

  function addAll() {
    all.forEach((p) => {
      const variant = p.variants.find((v) => v.stock > 0)
      if (variant) addItem({ productId: p.id, variantId: variant.id, name: p.name, price: p.price, size: variant.size, color: variant.color, image: p.images[0]?.url ?? "" })
    })
  }

  return (
    <div className="mt-16 border border-berber-border rounded-2xl p-6">
      <h2 className="text-lg font-heading font-bold mb-6">Frequently Bought Together</h2>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        {all.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3">
            {i > 0 && <Plus className="w-4 h-4 text-muted-foreground shrink-0" />}
            <Link href={`/shop/${p.slug}`} className="group flex items-center gap-2">
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-berber-border shrink-0">
                {p.images[0] ? (
                  <Image src={p.images[0].url} alt={p.name} width={56} height={56} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium group-hover:text-berber-gold transition-colors line-clamp-1 max-w-[120px]">{p.name}</p>
                <p className="text-xs text-muted-foreground">৳{p.price.toLocaleString()}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total: <span className="font-bold text-berber-text">৳{totalPrice.toLocaleString()}</span></p>
        </div>
        <Button onClick={addAll} className="gap-2">
          <ShoppingBag className="w-4 h-4" /> Add All to Cart
        </Button>
      </div>
    </div>
  )
}
