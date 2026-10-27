export type SuitGarment = "blazer" | "trouser" | "waistcoat"

export type SuitPolicyLine = {
  categorySlug?: string | null
  productSlug?: string | null
  quantity: number
  setGroupId?: string | null
}

export function getSuitGarment(
  categorySlug?: string | null,
  productSlug?: string | null
): SuitGarment | null {
  const value = `${categorySlug || ""} ${productSlug || ""}`.toLowerCase()
  if (value.includes("waistcoat") || value.includes("waistcoats")) return "waistcoat"
  if (value.includes("trouser") || value.includes("trousers")) return "trouser"
  if (value.includes("blazer") || value.includes("blazers")) return "blazer"
  return null
}

export function validateSuitPurchase(lines: SuitPolicyLine[]): string | null {
  const groups = new Map<string, SuitPolicyLine[]>()

  for (const line of lines) {
    const garment = getSuitGarment(line.categorySlug, line.productSlug)
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      return "Suit item quantities must be positive whole numbers."
    }

    if (line.setGroupId) {
      const group = groups.get(line.setGroupId) || []
      group.push(line)
      groups.set(line.setGroupId, group)
    } else if (garment) {
      if (garment !== "blazer") {
        return "Trousers and waistcoats are only available as part of a suit package."
      }
    }
  }

  for (const group of groups.values()) {
    const garments = group.map((line) => getSuitGarment(line.categorySlug, line.productSlug))
    if (garments.every((garment) => garment === null)) continue
    const quantities = new Set(group.map((line) => line.quantity))
    const hasBlazer = garments.filter((garment) => garment === "blazer").length === 1
    const hasTrouser = garments.filter((garment) => garment === "trouser").length === 1
    const waistcoatCount = garments.filter((garment) => garment === "waistcoat").length
    const validPieces = group.length === 2 || group.length === 3

    if (!validPieces || !hasBlazer || !hasTrouser || waistcoatCount !== group.length - 2 || quantities.size !== 1) {
      return "A suit package must be either Blazer + Trouser or Blazer + Trouser + Waistcoat."
    }
  }

  return null
}

export function isValidFixedSuitBundle(
  items: Array<{ quantity: number; product: { category?: { slug?: string | null } | null; slug?: string | null } }>
): boolean {
  if (items.length !== 2 && items.length !== 3) return false
  if (items.some((item) => !getSuitGarment(item.product.category?.slug, item.product.slug))) return false
  const lines = items.map((item) => ({
    categorySlug: item.product.category?.slug,
    productSlug: item.product.slug,
    quantity: item.quantity,
    setGroupId: "bundle",
  }))
  return validateSuitPurchase(lines) === null
}
