import { API_PORT } from '@rich/constants'
import { healthResponseSchema, type HealthResponse } from '@rich/schemas'

const API_URL = import.meta.env.VITE_API_URL ?? `http://localhost:${API_PORT}`

export async function fetchHealth(fetcher: typeof fetch = fetch): Promise<HealthResponse> {
  const res = await fetcher(`${API_URL}/health`)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return healthResponseSchema.parse(await res.json())
}
