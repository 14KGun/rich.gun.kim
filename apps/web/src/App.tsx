import { useEffect, useState } from 'react'
import type { HealthResponse } from '@rich/schemas'
import { fetchHealth } from './api/health.ts'

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  return (
    <main>
      <h1>rich.gun.kim</h1>
      <p>API: {error ? `오류 (${error})` : (health?.status ?? '확인 중…')}</p>
    </main>
  )
}

export default App
