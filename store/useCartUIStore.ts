import { create } from "zustand"

interface CartUIState {
  isOpen: boolean
  open: () => void
  close: () => void
  setOpen: (open: boolean) => void
}

// Separate from useCartStore (which persists cart contents) since the drawer's
// open/closed state is per-session UI, not data to persist across reloads.
export const useCartUIStore = create<CartUIState>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setOpen: (open) => set({ isOpen: open }),
}))
