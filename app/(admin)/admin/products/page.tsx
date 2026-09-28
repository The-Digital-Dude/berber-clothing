import { Button } from "@/components/ui/button"
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Download, Upload, Package } from "lucide-react"
import Link from "next/link"
import prisma from "@/lib/prisma"
import ProductsFilters from "./ProductsFilters"
import AdminPagination from "@/components/admin/AdminPagination"
import ProductsTable from "./ProductsTable"
import { serialize } from "@/lib/utils"

const PAGE_SIZE = 20

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const search = params.search || ""
  const status = params.status || ""
  const page = Math.max(1, parseInt(params.page || "1"))
  const skip = (page - 1) * PAGE_SIZE

  const where: any = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { tags: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status === "active" ? { isActive: true } : status === "inactive" ? { isActive: false } : {}),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
        images: { take: 1, orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }).catch(() => []),
    prisma.product.count({ where }).catch(() => 0),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const serializedProducts = serialize(products)

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Products</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
              {total} total
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage clothing catalog, stock variants, active states and SEO settings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/products/import">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs"
            >
              <Upload className="h-3.5 w-3.5 text-zinc-500" />
              <span>Import CSV</span>
            </Button>
          </Link>
          <a href="/api/admin/products/export">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs gap-1.5 bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-zinc-500" />
              <span>Export CSV</span>
            </Button>
          </a>
          <Link href="/admin/products/new">
            <Button
              size="sm"
              className="h-9 px-3.5 text-xs gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-sm shadow-amber-500/20"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Table Card Container */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden">
        <ProductsFilters currentSearch={search} currentStatus={status} />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50 border-zinc-200/80">
                <TableHead className="text-xs font-bold text-zinc-700 pl-4">Product</TableHead>
                <TableHead className="text-xs font-bold text-zinc-700">Category</TableHead>
                <TableHead className="text-xs font-bold text-zinc-700">Price</TableHead>
                <TableHead className="text-xs font-bold text-zinc-700">Stock & Variants</TableHead>
                <TableHead className="text-xs font-bold text-zinc-700">Status</TableHead>
                <TableHead className="text-right text-xs font-bold text-zinc-700 pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <ProductsTable products={serializedProducts as any} />
          </Table>
        </div>
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/40">
          <AdminPagination page={page} totalPages={totalPages} basePath="/admin/products" />
        </div>
      </div>
    </div>
  )
}
