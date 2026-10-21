import { API_PREFIX } from '@rich/constants'
import { healthResponseSchema, type HealthResponse } from '@rich/schemas'

export async function fetchHealth(fetcher: typeof fetch = fetch): Promise<HealthResponse> {
  const res = await fetcher(`/${API_PREFIX}/health`)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return healthResponseSchema.parse(await res.json())
}
