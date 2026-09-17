"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Minus, Plus, Trash2, Tag, ChevronRight } from "lucide-react"
import { useCartStore } from "@/store/useCartStore"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"

export default function CartDrawer({ itemCount: propItemCount, freeShippingThreshold = null }: { itemCount?: number, freeShippingThreshold?: number | null }) {
  const { items, removeItem, updateQuantity } = useCartStore()
  const [isOpen, setIsOpen] = useState(false)
  const [coupon, setCoupon] = useState("")
  const [useLoyalty, setUseLoyalty] = useState(false)

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const itemCount = propItemCount ?? items.reduce((acc, item) => acc + item.quantity, 0)
  const loyaltyPoints = 0 // Fetched at checkout when user is authenticated
  const loyaltyValue = useLoyalty ? Math.min(loyaltyPoints * 0.1, subtotal * 0.2) : 0
  const finalTotal = subtotal - loyaltyValue

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={
        <Button variant="ghost" size="icon-sm" className="relative text-berber-black hover:text-berber-gold">
          <ShoppingBag className="w-5 h-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-berber-gold text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      } />
      
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 border-l border-berber-border bg-berber-surface">
        <SheetHeader className="p-6 border-b border-berber-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading text-2xl">Your Bag</SheetTitle>
            <span className="text-xs uppercase tracking-widest text-berber-text-muted font-bold">{items.length} items</span>
          </div>
          {/* Free Shipping Progress */}
          {freeShippingThreshold && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-berber-text-muted">
                {subtotal >= freeShippingThreshold ? "You've unlocked free shipping!" : `Add ৳${freeShippingThreshold - subtotal} more for free shipping`}
              </p>
              <div className="w-full h-1 bg-berber-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-berber-gold transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-berber-muted flex items-center justify-center text-berber-border">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-heading text-xl">Your bag is empty.</p>
              <p className="text-sm text-berber-text-muted">Looks like you haven't added anything yet.</p>
              <button 
                onClick={() => setIsOpen(false)}
                className="mt-4 border-b border-berber-black font-medium uppercase tracking-widest text-xs pb-1 hover:text-berber-gold hover:border-berber-gold transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-4">
                  <Link href={`/shop/${item.productSlug}`} className="relative h-32 w-24 shrink-0 overflow-hidden bg-berber-muted rounded-sm block">
                    <Image src={item.image || "/placeholder.jpg"} alt={item.name} fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link href={`/shop/${item.productSlug}`} className="font-medium text-sm line-clamp-2 hover:text-berber-gold transition-colors">
                          {item.name}
                        </Link>
                        <button onClick={() => removeItem(item.variantId)} className="text-berber-text-muted hover:text-berber-error transition-colors mt-0.5">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-berber-text-muted mt-1 uppercase tracking-wider">{item.size} / {item.color}</p>
                    </div>
                    
                    <div className="flex justify-between items-end mt-2">
                      <div className="flex items-center border border-berber-border rounded-full overflow-hidden">
                        <button 
                          className="px-3 py-1.5 text-berber-text-muted hover:text-berber-black transition-colors"
                          onClick={() => updateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                        <button 
                          className="px-3 py-1.5 text-berber-text-muted hover:text-berber-black transition-colors"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-mono font-medium">৳{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-berber-border bg-berber-muted/30 p-6 space-y-6">
            
            {/* Promo & Loyalty */}
            <div className="space-y-3">
              <div className="flex items-center border border-berber-border rounded-lg bg-white overflow-hidden p-1 shadow-sm">
                <Tag className="w-4 h-4 text-berber-text-muted ml-2" />
                <input 
                  type="text" 
                  placeholder="Promo Code" 
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  className="flex-1 bg-transparent px-3 text-sm focus:outline-none placeholder:text-berber-border"
                />
                <button className="bg-berber-black text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-md hover:bg-berber-gold transition-colors">
                  Apply
                </button>
              </div>
              
              <div className="flex items-center justify-between border border-berber-border rounded-lg bg-white p-3 shadow-sm">
                <div>
                  <p className="text-sm font-bold flex items-center gap-1">Berber <span className="text-berber-gold">Club</span></p>
                  <p className="text-xs text-berber-text-muted">Use {loyaltyPoints} points for ৳{loyaltyValue.toLocaleString()} off</p>
                </div>
                <Switch checked={useLoyalty} onCheckedChange={setUseLoyalty} />
              </div>
            </div>
            
            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-berber-text-muted">
                <span>Subtotal</span>
                <span className="font-mono">৳{subtotal.toLocaleString()}</span>
              </div>
              {useLoyalty && (
                <div className="flex justify-between text-berber-success">
                  <span>Loyalty Points</span>
                  <span className="font-mono">-৳{loyaltyValue.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-berber-border">
                <span>Total</span>
                <span className="font-mono">৳{finalTotal.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link href="/checkout" onClick={() => setIsOpen(false)} className="block">
                <button className="w-full py-4 bg-berber-black text-white font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-berber-gold hover:shadow-lg hover:shadow-berber-gold/20 transition-all duration-300 rounded-lg">
                  Secure Checkout <ChevronRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/cart" onClick={() => setIsOpen(false)} className="block text-center text-xs text-berber-text-muted hover:text-berber-black underline underline-offset-4 transition-colors">
                View Full Cart
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
