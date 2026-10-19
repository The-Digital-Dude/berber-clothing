import FraudCheckerClient from "./FraudCheckerClient"

export const dynamic = "force-dynamic"

export default function FraudCheckerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fraud Checker</h1>
        <p className="text-sm text-zinc-500">
          Type any customer number to see delivery history across Steadfast, Pathao, RedX, CarryBee and Paperfly, plus your own store orders.
        </p>
      </div>
      <FraudCheckerClient />
    </div>
  )
}
