import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError, type JobItem } from '../api'

export default function JobPage() {
  const [items, setItems] = useState<JobItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      setItems(await api.jobs.list())
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
    if (!title.trim()) {
      setError('请填写岗位名称')
      return
    }
    if (!description.trim()) {
      setError('请填写岗位描述')
      return
    }
    setCreating(true)
    setError('')
    try {
      await api.jobs.create(title.trim(), description.trim())
      setTitle('')
      setDescription('')
      await load()
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  async function onRemove(id: number) {
    if (!window.confirm('确定删除该岗位？')) return
    try {
      await api.jobs.remove(id)
      await load()
    } catch (e3) {
      setError(e3 instanceof ApiError ? e3.message : '删除失败')
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">我的岗位</span>
        <span className="side-label">{items.length} 个</span>
      </div>
      <div className="card-body">
        <form className="create-form" onSubmit={onCreate}>
          <input className="create-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="岗位名称（如：Java 后端开发工程师）" />
          <textarea className="create-area" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="粘贴岗位描述…" rows={5} />
          <button className="btn primary" type="submit" disabled={creating}>
            {creating ? '创建中…' : '创建岗位'}
          </button>
        </form>

        {error && <div className="login-error">{error}</div>}

        {loading ? (
          <div className="empty">加载中…</div>
        ) : items.length === 0 ? (
          <div className="empty">暂无岗位，先创建一个吧</div>
        ) : (
          <ul className="item-list">
            {items.map((j) => (
              <li key={j.id} className="item-row">
                <div className="item-main">
                  <div className="item-title">{j.title}</div>
                  <div className="item-meta">更新于 {new Date(j.updatedAt).toLocaleString()}</div>
                </div>
                <button className="btn" onClick={() => onRemove(j.id)}>删除</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
