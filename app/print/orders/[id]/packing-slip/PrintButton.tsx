"use client"

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        position: "fixed", bottom: 20, right: 20,
        padding: "10px 20px", background: "#000", color: "#fff",
        border: "none", cursor: "pointer", fontSize: 13, fontWeight: "bold",
      }}
    >
      Print
    </button>
  )
}
