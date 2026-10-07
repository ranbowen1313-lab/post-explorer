import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, type ResumeItem } from '../api'

export default function ResumePage() {
  const [items, setItems] = useState<ResumeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setItems(await api.resumes.list())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setCreating(true)
    setError('')
    try {
      await api.resumes.create(title.trim(), content.trim())
      setTitle('')
      setContent('')
      await load()
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  async function onRemove(id: number) {
    if (!window.confirm('确定删除该简历？')) return
    try {
      await api.resumes.remove(id)
      await load()
    } catch (e3) {
      setError(e3 instanceof ApiError ? e3.message : '删除失败')
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">我的简历</span>
        <span className="side-label">{items.length} 份</span>
      </div>
      <div className="card-body">
        <form className="create-form" onSubmit={onCreate}>
          <input className="create-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="简历标题（如：Java 后端简历）" />
          <textarea className="create-area" value={content} onChange={(e) => setContent(e.target.value)} placeholder="粘贴简历正文…" rows={5} />
          <button className="btn primary" type="submit" disabled={creating}>
            {creating ? '创建中…' : '创建简历'}
          </button>
        </form>

        {error && <div className="login-error">{error}</div>}

        {loading ? (
          <div className="empty">加载中…</div>
        ) : items.length === 0 ? (
          <div className="empty">暂无简历，先创建一份吧</div>
        ) : (
          <ul className="item-list">
            {items.map((r) => (
              <li key={r.id} className="item-row">
                <div className="item-main">
                  <div className="item-title">{r.title}</div>
                  <div className="item-meta">更新于 {new Date(r.updatedAt).toLocaleString()}</div>
                </div>
                <button className="btn" onClick={() => onRemove(r.id)}>删除</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
