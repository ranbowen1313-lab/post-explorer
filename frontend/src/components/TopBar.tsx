import { useEffect, useState } from 'react'
import { api, ApiError } from '../api'
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
  const [showKey, setShowKey] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [keyConfigured, setKeyConfigured] = useState(false)
  const [savingKey, setSavingKey] = useState(false)
  const [testingKey, setTestingKey] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null)

  function check() {
    setConn('connecting')
    api.ping()
      .then(() => setConn('online'))
      .catch(() => setConn('offline'))
  }

  useEffect(() => {
    check()
    api.getApiKeyStatus()
      .then((r) => setKeyConfigured(r.configured))
      .catch(() => {})
  }, [])

  function saveKey() {
    if (!keyInput.trim()) return
    setSavingKey(true)
    setTestResult(null)
    // 保存前自动向大模型发简单请求验证
    api.testApiKey(keyInput.trim())
      .then((r) => {
        if (!r.ok) {
          setTestResult(r)
          return
        }
        return api.setApiKey(keyInput.trim()).then(() => {
          setKeyConfigured(true)
          setShowKey(false)
          setKeyInput('')
          setTestResult(null)
        })
      })
      .catch((e) => setTestResult({ ok: false, error: e instanceof ApiError ? e.message : '验证失败' }))
      .finally(() => setSavingKey(false))
  }

  function testKey() {
    if (!keyInput.trim()) return
    setTestingKey(true)
    setTestResult(null)
    api.testApiKey(keyInput.trim())
      .then((r) => setTestResult(r))
      .catch((e) => setTestResult({ ok: false, error: e instanceof ApiError ? e.message : '测试失败' }))
      .finally(() => setTestingKey(false))
  }

  return (
    <>
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
          <button className="logout-btn" onClick={() => setShowKey(true)}>
            {keyConfigured ? 'API Key ✓' : '设置 API Key'}
          </button>
          <span className={`conn conn-${conn}`} onClick={check} title="点击重新检测后端连接">
            <span className="conn-dot" />
            {CONN_TEXT[conn]}
          </span>
          <span>{user?.name || user?.email}</span>
          <span className="avatar">{user?.name?.[0] || '?'}</span>
          <button className="logout-btn" onClick={logout}>退出</button>
        </div>
      </header>

      {showKey && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">设置 DeepSeek API Key</div>
            <div className="modal-body">
              <div className="modal-hint">你的 API Key 仅当前会话有效，不持久化存储；每次重新登录需重新配置。</div>
              <input
                type="password"
                className="key-input"
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setTestResult(null) }}
                placeholder="粘贴你的 API Key（sk-...）"
              />
              <div className="key-test-row">
                <button className="btn" onClick={testKey} disabled={testingKey || !keyInput.trim()}>
                  {testingKey ? '测试中…' : '测试连接'}
                </button>
                {testResult && (
                  <span className={testResult.ok ? 'key-test-ok' : 'key-test-fail'}>
                    {testResult.ok ? '✓ 连接成功' : `✗ ${testResult.error}`}
                  </span>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn primary" onClick={saveKey} disabled={savingKey}>
                {savingKey ? '保存中…' : '保存'}
              </button>
              <button className="btn" onClick={() => setShowKey(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
