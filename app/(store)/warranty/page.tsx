export const metadata = {
  title: "Warranty Policy — Berber",
  description: "Our product warranty and returns policy.",
}

export default function WarrantyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 prose prose-sm">
      <h1>Warranty & Returns</h1>

      <h2>Quality Guarantee</h2>
      <p>
        Every Berber product is crafted with care. If your item has a manufacturing defect, we'll replace it
        free of charge within <strong>30 days</strong> of delivery.
      </p>

      <h2>Returns</h2>
      <p>
        We accept returns within <strong>7 days</strong> of delivery for unused, unwashed items in their original
        packaging. To start a return, email us at <a href="mailto:support@berber.clothing">support@berber.clothing</a>{" "}
        with your order number and photos of the item.
      </p>

      <h2>Exchanges</h2>
      <p>
        Size exchanges are accepted within 7 days, subject to availability. Return shipping is the customer's
        responsibility; we cover the cost of sending the exchanged item back.
      </p>

      <h2>Exclusions</h2>
      <ul>
        <li>Sale items are final sale and cannot be returned or exchanged.</li>
        <li>Customised or personalised items are non-returnable.</li>
        <li>Damage caused by misuse, washing at incorrect temperature, or normal wear is not covered.</li>
      </ul>

      <h2>How to Contact Us</h2>
      <p>
        Email: <a href="mailto:support@berber.clothing">support@berber.clothing</a><br />
        We aim to respond within 24 hours on business days.
      </p>
    </div>
  )
}
