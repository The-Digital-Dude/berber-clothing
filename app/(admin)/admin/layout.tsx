import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminTopbar from "@/components/admin/AdminTopbar"
import AdminShell from "@/components/admin/AdminShell"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <AdminShell email={session.user.email ?? ""}>
      <AdminTopbar email={session.user.email ?? ""} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-5 lg:p-7 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </AdminShell>
  )
}
