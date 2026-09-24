// Client-side capture of Meta's _fbc (click ID) cookie, mirroring the logic
// in Meta's official Conversions API Parameter Builder library
// (facebook/capi-param-builder). Meta's pixel script only sets _fbc when
// fbclid is present at the moment fbevents.js itself loads — if an ad
// blocker prevents that script from loading at all (common), _fbc never
// gets set and server-side Conversions API events lose click attribution.
// This runs independently of the pixel script, from our own first-party
// code, so coverage doesn't depend on the pixel script surviving blockers.

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeCookie(name: string, value: string, ttlMs: number) {
  const expires = new Date(Date.now() + ttlMs).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; domain=.${window.location.hostname}; path=/; SameSite=Lax`
}

/**
 * Ensures _fbc is set whenever a `fbclid` click ID is present in the URL,
 * independent of whether Meta's own pixel script managed to load.
 * Format matches Meta's spec: fb.<subdomainIndex>.<creationTimeMs>.<fbclid>
 * Safe to call on every page view — a no-op if there's nothing to do.
 */
export function captureFbc() {
  if (typeof window === "undefined") return

  try {
    const params = new URLSearchParams(window.location.search)
    const fbclid = params.get("fbclid")
    const existing = readCookie("_fbc")

    if (fbclid) {
      // Only mint a new cookie if we don't already have one carrying this
      // exact click ID — avoids overwriting a still-valid earlier click's
      // attribution window on every subsequent page view.
      if (!existing || !existing.includes(fbclid)) {
        writeCookie("_fbc", `fb.1.${Date.now()}.${fbclid}`, NINETY_DAYS_MS)
      } else {
        // Refresh the rolling 90-day expiry on the existing value.
        writeCookie("_fbc", existing, NINETY_DAYS_MS)
      }
    } else if (existing) {
      // No new click this visit — just keep the existing attribution alive.
      writeCookie("_fbc", existing, NINETY_DAYS_MS)
    }
  } catch {
    // Never let tracking cookie logic break the page.
  }
}
