"use client"
import { useState, useRef } from "react"

export default function CustomerImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/admin/customers/import", { method: "POST", body: fd })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    setFile(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Import Customers from CSV</h1>

      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-3">
            Upload a CSV with columns: <code className="bg-gray-100 px-1 rounded">email</code>,{" "}
            <code className="bg-gray-100 px-1 rounded">name</code> (optional),{" "}
            <code className="bg-gray-100 px-1 rounded">phone</code> (optional). Existing emails are skipped.
          </p>
          <a
            href="data:text/csv;charset=utf-8,email,name,phone%0Aexample@email.com,John Doe,01700000000"
            download="customers_template.csv"
            className="text-sm underline text-blue-600"
          >
            Download template CSV
          </a>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded file:border file:text-sm file:bg-gray-50"
        />

        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="w-full py-2 bg-black text-white rounded-lg text-sm disabled:opacity-40"
        >
          {loading ? "Importing…" : "Import"}
        </button>
      </div>

      {result && (
        <div className="mt-4 bg-white border rounded-xl p-4 space-y-2">
          <p className="font-medium">Import complete</p>
          <p className="text-sm text-green-700">✓ {result.imported} imported</p>
          <p className="text-sm text-gray-500">— {result.skipped} skipped (already exist)</p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-red-600">Errors:</p>
              <ul className="text-xs text-red-500 list-disc list-inside">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
