import { useEffect } from 'react'

/**
 * Inject (or update) a JSON-LD block in the document head. Used for the
 * `Product` structured data on product pages so search engines can show rich
 * results (price, availability, brand).
 */
export function useJsonLd(id: string, data: Record<string, unknown> | null) {
  const serialized = data ? JSON.stringify(data) : null

  useEffect(() => {
    if (!serialized) return
    let script = document.getElementById(id) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = id
      document.head.appendChild(script)
    }
    script.textContent = serialized
    return () => {
      document.getElementById(id)?.remove()
    }
  }, [id, serialized])
}
