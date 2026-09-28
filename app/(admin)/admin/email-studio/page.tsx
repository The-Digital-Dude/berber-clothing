import EmailStudioClient from "./EmailStudioClient"

export default function EmailStudioPage() {
  return (
    <div className="mx-auto max-w-6xl w-full">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Email Studio</h1>
      <p className="text-muted-foreground text-sm mb-6">Preview every transactional email template and send yourself a test copy.</p>
      <EmailStudioClient />
    </div>
  )
}
