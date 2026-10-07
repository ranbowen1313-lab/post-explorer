import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'

type ConnState = 'connecting' | 'online' | 'offline'

const CONN_TEXT: Record<ConnState, string> = {
  connecting: '连接中…',
  online: '服务已连接',
  offline: '服务未连接',
}

const TABS = [
  { key: 'resume', label: '简历' },
  { key: 'job', label: '岗位' },
  { key: 'analysis', label: '匹配分析' },
]

interface Props {
  view: string
  onViewChange: (v: string) => void
}

export default function TopBar({ view, onViewChange }: Props) {
  const { user, logout } = useAuth()
  const [conn, setConn] = useState<ConnState>('connecting')

  function check() {
    setConn('connecting')
    api.ping()
      .then(() => setConn('online'))
      .catch(() => setConn('offline'))
  }

  useEffect(() => {
    check()
  }, [])

  return (
    <header className="topbar">
      <div className="logo">
        <span className="logo-mark">简</span>
        <span>简历与岗位匹配助手</span>
      </div>
      <nav className="nav">
        {TABS.map((t) => (
          <a
            key={t.key}
            href="#"
            className={t.key === view ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault()
              onViewChange(t.key)
            }}
          >
            {t.label}
          </a>
        ))}
      </nav>
      <div className="spacer" />
      <div className="user">
        <span className={`conn conn-${conn}`} onClick={check} title="点击重新检测后端连接">
          <span className="conn-dot" />
          {CONN_TEXT[conn]}
        </span>
        <span>{user?.name || user?.email}</span>
        <span className="avatar">{user?.name?.[0] || '?'}</span>
        <button className="logout-btn" onClick={logout}>退出</button>
      </div>
    </header>
  )
}
