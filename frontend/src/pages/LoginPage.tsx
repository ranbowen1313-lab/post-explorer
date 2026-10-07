import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth'
import { ApiError } from '../api'

export default function LoginPage() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function switchMode(m: 'login' | 'register') {
    setMode(m)
    setError('')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '操作失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-mark">简</span>
          <span>简历与岗位匹配助手</span>
        </div>
        <div className="login-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>登录</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>注册</button>
        </div>
        <form onSubmit={onSubmit}>
          {mode === 'register' && (
            <label className="field">
              <span>姓名</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的姓名（可选）" />
            </label>
          )}
          <label className="field">
            <span>邮箱</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>
          <label className="field">
            <span>密码</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? '至少 6 位' : '请输入密码'} required />
          </label>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn primary login-submit" disabled={submitting}>
            {submitting ? '提交中…' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>
      </div>
    </div>
  )
}
