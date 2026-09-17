import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Size Guide — Berber Clothing",
  description: "Find your perfect fit with Berber's comprehensive size guide for men's and women's formalwear.",
}

export default function SizeGuidePage() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero */}
      <div className="bg-berber-black text-white py-20 px-4 text-center">
        <p className="text-berber-gold font-bold tracking-[0.2em] text-xs uppercase mb-4">Fit Guide</p>
        <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">Size Guide</h1>
        <p className="text-gray-300 max-w-xl mx-auto">
          Our garments are cut for a tailored fit. Use the measurements below to find your perfect size.
        </p>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl space-y-16">

        {/* How to measure */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-berber-gold pb-2 border-b border-berber-border">How to Take Your Measurements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-berber-text-muted">
            {[
              { name: "Chest", desc: "Measure around the fullest part of your chest, keeping the tape parallel to the ground." },
              { name: "Waist", desc: "Measure around your natural waist, just above the hip bone." },
              { name: "Hips", desc: "Stand with feet together and measure around the fullest part of your hips." },
              { name: "Inseam", desc: "Measure from your crotch to the bottom of your ankle on the inside of your leg." },
              { name: "Shoulder Width", desc: "Measure from the tip of one shoulder to the other across the back." },
              { name: "Sleeve Length", desc: "Measure from the centre back of your neck over the shoulder to the wrist." },
            ].map((m) => (
              <div key={m.name} className="flex gap-3 p-4 bg-berber-muted rounded-xl">
                <span className="font-bold text-berber-black shrink-0">{m.name}:</span>
                <span>{m.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Men's Suits & Blazers */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-berber-gold pb-2 border-b border-berber-border">Men's Suits & Blazers (inches)</h2>
          <div className="overflow-x-auto rounded-xl border border-berber-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-berber-muted">
                <tr>
                  {["Size", "Chest", "Waist", "Shoulder", "Sleeve"].map((h) => (
                    <th key={h} className="px-4 py-3 font-bold text-berber-black text-xs uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["S", "36–37", "30–31", "17", "24.5"],
                  ["M", "38–39", "32–33", "17.5", "25"],
                  ["L", "40–41", "34–35", "18", "25.5"],
                  ["XL", "42–43", "36–37", "18.5", "26"],
                  ["2XL", "44–45", "38–39", "19", "26.5"],
                  ["3XL", "46–47", "40–41", "19.5", "27"],
                ].map(([size, ...vals]) => (
                  <tr key={size} className="border-t border-berber-border even:bg-berber-muted/30">
                    <td className="px-4 py-3 font-bold text-berber-black">{size}</td>
                    {vals.map((v, i) => <td key={i} className="px-4 py-3 text-berber-text-muted">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Men's Shirts */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-berber-gold pb-2 border-b border-berber-border">Men's Dress Shirts (inches)</h2>
          <div className="overflow-x-auto rounded-xl border border-berber-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-berber-muted">
                <tr>
                  {["Size", "Collar", "Chest", "Waist", "Sleeve"].map((h) => (
                    <th key={h} className="px-4 py-3 font-bold text-berber-black text-xs uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["S", "14.5", "36–37", "30–31", "32–33"],
                  ["M", "15.5", "38–39", "32–33", "33–34"],
                  ["L", "16.5", "40–41", "34–35", "34–35"],
                  ["XL", "17.5", "42–43", "36–37", "35–36"],
                  ["2XL", "18.5", "44–45", "38–39", "36–37"],
                ].map(([size, ...vals]) => (
                  <tr key={size} className="border-t border-berber-border even:bg-berber-muted/30">
                    <td className="px-4 py-3 font-bold text-berber-black">{size}</td>
                    {vals.map((v, i) => <td key={i} className="px-4 py-3 text-berber-text-muted">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Men's Trousers */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-berber-gold pb-2 border-b border-berber-border">Men's Trousers (inches)</h2>
          <div className="overflow-x-auto rounded-xl border border-berber-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-berber-muted">
                <tr>
                  {["Waist", "Hip", "Inseam (Regular)", "Inseam (Tall)"].map((h) => (
                    <th key={h} className="px-4 py-3 font-bold text-berber-black text-xs uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["28–30", "36–38", "30", "32"],
                  ["30–32", "38–40", "30", "32"],
                  ["32–34", "40–42", "30", "32"],
                  ["34–36", "42–44", "30", "32"],
                  ["36–38", "44–46", "30", "32"],
                  ["38–40", "46–48", "30", "32"],
                ].map((row, i) => (
                  <tr key={i} className="border-t border-berber-border even:bg-berber-muted/30">
                    {row.map((v, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? "font-bold text-berber-black" : "text-berber-text-muted"}`}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Women's Formal */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-berber-gold pb-2 border-b border-berber-border">Women's Formalwear (inches)</h2>
          <div className="overflow-x-auto rounded-xl border border-berber-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-berber-muted">
                <tr>
                  {["Size", "Bust", "Waist", "Hip", "Fits UK"].map((h) => (
                    <th key={h} className="px-4 py-3 font-bold text-berber-black text-xs uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["XS", "32–33", "24–25", "34–35", "6"],
                  ["S", "34–35", "26–27", "36–37", "8"],
                  ["M", "36–37", "28–29", "38–39", "10–12"],
                  ["L", "38–39", "30–31", "40–41", "14"],
                  ["XL", "40–41", "32–33", "42–43", "16"],
                  ["2XL", "42–43", "34–35", "44–45", "18"],
                ].map(([size, ...vals]) => (
                  <tr key={size} className="border-t border-berber-border even:bg-berber-muted/30">
                    <td className="px-4 py-3 font-bold text-berber-black">{size}</td>
                    {vals.map((v, i) => <td key={i} className="px-4 py-3 text-berber-text-muted">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sherwanis / Ethnic */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-berber-gold pb-2 border-b border-berber-border">Sherwanis & Panjabis (inches)</h2>
          <div className="overflow-x-auto rounded-xl border border-berber-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-berber-muted">
                <tr>
                  {["Size", "Chest", "Waist", "Length", "Sleeve"].map((h) => (
                    <th key={h} className="px-4 py-3 font-bold text-berber-black text-xs uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["S", "36–37", "30–31", "44", "24"],
                  ["M", "38–39", "32–33", "45", "24.5"],
                  ["L", "40–41", "34–35", "45.5", "25"],
                  ["XL", "42–43", "36–37", "46", "25.5"],
                  ["2XL", "44–45", "38–39", "46.5", "26"],
                  ["3XL", "46–47", "40–41", "47", "26.5"],
                ].map(([size, ...vals]) => (
                  <tr key={size} className="border-t border-berber-border even:bg-berber-muted/30">
                    <td className="px-4 py-3 font-bold text-berber-black">{size}</td>
                    {vals.map((v, i) => <td key={i} className="px-4 py-3 text-berber-text-muted">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fit note */}
        <div className="bg-berber-muted rounded-2xl p-6 text-sm text-berber-text-muted space-y-2">
          <p className="font-bold text-berber-black">Not sure between sizes?</p>
          <p>Berber garments are designed for a modern tailored fit — if you're between sizes, we recommend sizing up for a relaxed formal look or staying true to size for a sharp fitted silhouette.</p>
          <p>Custom and made-to-measure options are available for select pieces. <a href="/contact" className="underline hover:text-berber-gold transition-colors">Contact us</a> for details.</p>
        </div>

      </div>
    </div>
  )
}
