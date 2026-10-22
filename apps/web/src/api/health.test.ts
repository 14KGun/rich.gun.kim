import { describe, expect, it, vi } from 'vitest'
import { fetchHealth } from './health.ts'

describe('fetchHealth', () => {
  it('/health 응답을 공유 스키마로 검증해 반환한다', async () => {
    const body = { status: 'ok', uptime: 1, timestamp: new Date().toISOString() }
    const fetcher = vi.fn(async () => Response.json(body))

    await expect(fetchHealth(fetcher)).resolves.toEqual(body)
    expect(fetcher).toHaveBeenCalledWith('http://localhost:3000/health')
  })

  it('스키마에 맞지 않는 응답이면 실패한다', async () => {
    const fetcher = vi.fn(async () => Response.json({ status: 'down' }))

    await expect(fetchHealth(fetcher)).rejects.toThrow()
  })
})
