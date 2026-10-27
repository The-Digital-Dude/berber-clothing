import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { trackAddToCart } from '@/lib/analytics'

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  productSlug: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  quantity: number;
  setGroupId?: string;  // shared UUID for items added together as a set
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string, setGroupId?: string) => void;
  updateQuantity: (variantId: string, quantity: number, setGroupId?: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => {
        fetch("/api/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "add_to_cart", productId: item.productId }),
        }).catch(() => {})
        trackAddToCart({ id: item.productId, name: item.name, price: item.price, quantity: item.quantity })
        return set((state) => {
          // A variant in a suit set is a different cart line from the same
          // variant bought as a standalone blazer or in another set.
          const existing = state.items.find(
            (i) => i.variantId === item.variantId && i.setGroupId === item.setGroupId
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.variantId === item.variantId && i.setGroupId === item.setGroupId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        })
      },
      removeItem: (variantId, setGroupId) =>
        set((state) => ({
          // Suit packages are atomic: removing one component removes the
          // complete package so trousers/waistcoats can never become singles.
          items: setGroupId
            ? state.items.filter((i) => i.setGroupId !== setGroupId)
            : state.items.filter((i) => !(i.variantId === variantId && !i.setGroupId)),
        })),
      updateQuantity: (variantId, quantity, setGroupId) =>
        set((state) => ({
          items: state.items.map((i) =>
            setGroupId
              ? (i.setGroupId === setGroupId ? { ...i, quantity } : i)
              : (i.variantId === variantId && !i.setGroupId ? { ...i, quantity } : i)
          ),
        })),
      clearCart: () => set({ items: [] }),
    }),
    { name: 'clothing-cart-storage' }
  )
)
