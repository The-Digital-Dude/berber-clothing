"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Printer, AlertTriangle, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { CustomerRisk } from "@/lib/customerRisk"

const RISK_BADGE_CLASS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-red-100 text-red-800 border-red-200",
}

export default function OrderDetailsClient({
  initialOrder,
  customerRisk,
}: {
  initialOrder: any
  customerRisk?: CustomerRisk | null
}) {
  const router = useRouter()
  const [order, setOrder] = useState(initialOrder)
  const [loading, setLoading] = useState(false)
  const [deliveryData, setDeliveryData] = useState({
    courier: order.delivery?.courier || "PATHAO",
    consignmentId: order.delivery?.consignmentId || "",
    trackingCode: order.delivery?.trackingCode || "",
  })

  const updateStatus = async (status: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        const updated = await res.json()
        setOrder({ ...order, status: updated.status })
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentStatus = async (paymentStatus: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus })
      })
      if (res.ok) {
        const updated = await res.json()
        setOrder({ ...order, paymentStatus: updated.paymentStatus })
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const saveDelivery = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deliveryData)
      })
      if (res.ok) {
        toast.success("Delivery information saved")
        router.refresh()
      } else {
        toast.error("Failed to save delivery info")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <a href={`/order/${order.id}/invoice`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" /> View / Print Invoice
          </Button>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">Size: {item.size} | Color: {item.color}</p>
                    </div>
                    <div className="text-right">
                      <p>৳{item.price.toString()} x {item.quantity}</p>
                      <p className="font-bold">৳{(item.price * item.quantity).toString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t space-y-2 text-right">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span> <span>৳{order.subtotal.toString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping:</span> <span>৳{order.shippingCharge.toString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount:</span> <span>-৳{order.discount.toString()}</span></div>
                <div className="flex justify-between font-bold text-lg"><span>Total:</span> <span>৳{order.total.toString()}</span></div>
                {Number(order.depositAmount) > 0 && (
                  <div className={`flex justify-between text-sm ${order.depositPaid ? "text-green-700" : "text-orange-700"}`}>
                    <span>{order.depositPaid ? "Advance paid (bKash)" : "Advance payment pending"}:</span>
                    <span>৳{order.depositAmount.toString()}</span>
                  </div>
                )}
                {order.depositPaid && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Due on delivery (cash):</span>
                    <span>৳{(Number(order.total) - Number(order.depositAmount)).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Delivery Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Courier</label>
                  <select 
                    value={deliveryData.courier} 
                    onChange={e => setDeliveryData({...deliveryData, courier: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="PATHAO">Pathao</option>
                    <option value="STEADFAST">Steadfast</option>
                    <option value="SELF">Self Delivery</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Consignment ID</label>
                  <input 
                    type="text" 
                    value={deliveryData.consignmentId} 
                    onChange={e => setDeliveryData({...deliveryData, consignmentId: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium">Tracking Code</label>
                  <input 
                    type="text" 
                    value={deliveryData.trackingCode} 
                    onChange={e => setDeliveryData({...deliveryData, trackingCode: e.target.value})}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <Button onClick={saveDelivery} disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save Delivery Info"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer & Shipping</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-semibold">{order.shippingName}</p>
                <p>{order.shippingPhone}</p>
                <p className="mt-2">{order.shippingAddress}</p>
                <p>{order.shippingArea}, {order.shippingDistrict}</p>
                <p>{order.shippingDivision}</p>
              </div>
              {order.note && (
                <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                  <strong>Note: </strong> {order.note}
                </div>
              )}
              {customerRisk && customerRisk.riskLevel !== "NEW" && (
                <div className={`mt-4 p-3 rounded-md border text-xs space-y-1 ${RISK_BADGE_CLASS[customerRisk.riskLevel]}`}>
                  <div className="flex items-center gap-2 font-bold">
                    {customerRisk.riskLevel === "HIGH" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    {customerRisk.riskLevel} risk customer
                  </div>
                  <p>
                    {customerRisk.delivered} delivered / {customerRisk.returnedOrCancelled} returned or cancelled
                    {" "}({Math.round((customerRisk.successRate ?? 0) * 100)}% success rate, {customerRisk.totalOrders} total orders)
                  </p>
                  {customerRisk.riskLevel === "HIGH" && (
                    <p className="font-medium">Consider requiring an advance payment before confirming.</p>
                  )}
                </div>
              )}
              {customerRisk && customerRisk.riskLevel === "NEW" && customerRisk.totalOrders <= 1 && (
                <div className="mt-4 p-3 rounded-md border bg-muted text-xs text-muted-foreground">
                  First order from this phone number — no delivery history yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Status Management</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order Status</label>
                <select 
                  value={order.status} 
                  onChange={(e) => updateStatus(e.target.value)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PACKED">Packed</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="RETURNED">Returned</option>
                </select>
              </div>
              
              <div className="space-y-2 pt-2 border-t">
                <label className="text-sm font-medium">Payment Status</label>
                <div className="flex justify-between items-center bg-muted p-2 rounded">
                  <span className="font-medium">{order.paymentMethod}</span>
                  <Badge variant="outline">{order.paymentStatus}</Badge>
                </div>
                <select 
                  value={order.paymentStatus} 
                  onChange={(e) => updatePaymentStatus(e.target.value)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partial (deposit only)</option>
                  <option value="PAID">Paid</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {order.statusLogs.map((log: any, i: number) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-indigo-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-4 rounded border border-slate-200 shadow">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-900 text-sm">{log.status}</div>
                        <time className="text-xs font-medium text-slate-500">{new Date(log.createdAt).toLocaleDateString()}</time>
                      </div>
                      <div className="text-slate-500 text-xs">{log.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
