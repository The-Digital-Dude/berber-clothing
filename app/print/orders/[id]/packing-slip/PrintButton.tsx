"use client"

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        padding: "10px 22px",
        background: "#09090b",
        color: "#ffffff",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "9999px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: 600,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4)",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        zIndex: 9999,
        transition: "transform 0.15s ease, background 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      Print 3×3 Labels
    </button>
  )
}
