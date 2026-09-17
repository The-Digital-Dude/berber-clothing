export const metadata = {
  title: "About Us — Berber",
  description: "The story behind Berber — handcrafted clothing from Bangladesh.",
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 prose prose-sm">
      <h1>About Berber</h1>

      <p className="lead">
        Berber is a Dhaka-based clothing brand rooted in craft, culture, and quiet confidence.
      </p>

      <h2>Our Story</h2>
      <p>
        Founded with the belief that everyday clothing should feel extraordinary, Berber began as a small
        atelier in Old Dhaka. Inspired by the textures and patterns of the Maghreb and the textile heritage
        of Bengal, we create pieces that blend the two worlds effortlessly.
      </p>

      <h2>Our Craft</h2>
      <p>
        Every stitch matters. We work with a small team of local artisans who bring decades of experience to
        each garment. Fabrics are sourced responsibly, and production is kept small-batch to maintain quality
        and reduce waste.
      </p>

      <h2>Our Values</h2>
      <ul>
        <li><strong>Authenticity</strong> — we make what we love to wear.</li>
        <li><strong>Longevity</strong> — built to last, not to trend.</li>
        <li><strong>Local first</strong> — employing Bangladeshi makers at fair wages.</li>
      </ul>

      <h2>Get in Touch</h2>
      <p>
        We'd love to hear from you. Visit our <a href="/contact">contact page</a> or email us at{" "}
        <a href="mailto:hello@berber.clothing">hello@berber.clothing</a>.
      </p>
    </div>
  )
}
