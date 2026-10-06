import { useEffect, useState } from 'react'

type Ping = { status: string; service: string; time: number }

export default function App() {
  const [ping, setPing] = useState<Ping | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function check() {
    setError(null)
    setPing(null)
    try {
      const res = await fetch('/api/ping')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setPing(await res.json())
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    check()
  }, [])

  return (
    <div className="app">
      <header>
        <h1>简历与岗位匹配助手</h1>
        <p className="muted">项目骨架已就绪 · M1</p>
      </header>
      <main>
        <section className="card">
          <h2>后端连通性</h2>
          {error && <p className="error">后端不可达：{error}</p>}
          {ping && (
            <p className="ok">
              服务「{ping.service}」状态 {ping.status}
              （{new Date(ping.time).toLocaleTimeString()}）
            </p>
          )}
          <button onClick={check}>重新检测</button>
        </section>
      </main>
    </div>
  )
}
