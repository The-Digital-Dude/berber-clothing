import { requireAdmin } from "@/lib/adminAuth"
import { redirect } from "next/navigation"
import CustomerImportClient from "./CustomerImportClient"

export default async function CustomerImportPage() {
  const { error } = await requireAdmin()
  if (error) redirect("/admin/login")
  return <CustomerImportClient />
}
