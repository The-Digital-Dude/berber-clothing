import prisma from "@/lib/prisma"
import { renderContentPage } from "@/components/store/ContentPage"
import { Mail, Phone } from "lucide-react"

export default async function ContactPage() {
  const [{ title, content }, settings] = await Promise.all([
    renderContentPage("contact", "Contact Us"),
    prisma.setting.findMany({ where: { key: { in: ["support_email", "support_phone"] } } }),
  ])

  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const supportEmail = settingsMap.support_email || "support@berber.clothing"
  const supportPhone = settingsMap.support_phone || "+880 1700 000000"

  return (
    <div className="container mx-auto px-4 py-16 md:py-24 max-w-3xl animate-in fade-in duration-500">
      <h1 className="text-4xl md:text-5xl font-heading font-bold text-berber-black mb-10">{title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <a href={`mailto:${supportEmail}`} className="flex items-center gap-4 p-6 border border-berber-border rounded-2xl hover:border-berber-gold transition-colors">
          <div className="w-12 h-12 rounded-full bg-berber-gold/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-berber-gold" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-berber-text-muted font-bold">Email</p>
            <p className="font-medium">{supportEmail}</p>
          </div>
        </a>
        <a href={`tel:${supportPhone.replace(/\s/g, "")}`} className="flex items-center gap-4 p-6 border border-berber-border rounded-2xl hover:border-berber-gold transition-colors">
          <div className="w-12 h-12 rounded-full bg-berber-gold/10 flex items-center justify-center">
            <Phone className="w-5 h-5 text-berber-gold" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-berber-text-muted font-bold">Phone</p>
            <p className="font-medium">{supportPhone}</p>
          </div>
        </a>
      </div>

      {content && (
        <div
          className="prose prose-sm md:prose-base text-berber-text max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  )
}
