import type { Metadata } from "next"
import GiftCardStore from "./GiftCardStore"

export const metadata: Metadata = {
  title: "Gift Cards — Berber",
  description: "Give the gift of style. Berber gift cards are delivered instantly by email and never expire within a year.",
}

export default function GiftCardsPage() {
  return <GiftCardStore />
}
