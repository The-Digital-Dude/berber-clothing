import { Metadata } from "next"
import AppointmentBookingClient from "./AppointmentBookingClient"

export const metadata: Metadata = {
  title: "Book Flagship Atelier Fitting | Berber Bespoke Tailoring",
  description:
    "Schedule your private 1-on-1 bespoke suit fitting and master measurement session at Berber Flagship Atelier, Banani. Experience artisan tailoring and curated European fabrics.",
}

export default function BookAppointmentPage() {
  return (
    <div className="w-full min-h-screen bg-berber-bg text-berber-text">
      <AppointmentBookingClient />
    </div>
  )
}
