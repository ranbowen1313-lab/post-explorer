import { useState } from 'react'
import { suggestions } from '../data'
import type { Decision, Suggestion, SuggestionKind } from '../types'

const KIND_LABEL: Record<SuggestionKind, string> = {
  REWRITE: '改稿',
  CONFIRM: '需确认',
}

const KIND_CLASS: Record<SuggestionKind, string> = {
  REWRITE: 'rewrite',
  CONFIRM: 'confirm',
}

interface Props {
  decisions: Record<string, Decision>
  acceptedTexts: Record<string, string>
  onAccept: (id: string, text: string) => void
  onIgnore: (id: string) => void
  onUndo: (id: string) => void
}

export default function SuggestionList({
  decisions,
  acceptedTexts,
  onAccept,
  onIgnore,
  onUndo,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftText, setDraftText] = useState('')

  const pendingCount = suggestions.filter((s) => !decisions[s.id]).length

  function startEdit(s: Suggestion) {
    setEditingId(s.id)
    setDraftText(acceptedTexts[s.id] ?? s.defaultText)
  }

  function confirmEdit() {
    if (editingId) onAccept(editingId, draftText.trim())
    setEditingId(null)
  }

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">改稿建议</span>
        <span className="side-label">{pendingCount} 条待处理 / 共 {suggestions.length} 条</span>
      </div>
      <div className="card-body">
        {suggestions.map((s) => {
          const d = decisions[s.id]
          const editing = editingId === s.id
          return (
            <div key={s.id} className={`suggestion${d ? ' suggestion-done' : ''}`}>
              <div className="sug-head">
                <span className={`kind ${KIND_CLASS[s.kind]}`}>{KIND_LABEL[s.kind]}</span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.target}</span>
              </div>
              <div className="sug-text">{s.text}</div>

              {editing ? (
                <div className="edit-box">
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    rows={3}
                    placeholder="编辑要写入修改稿的内容"
                  />
                  <div className="edit-actions">
                    <button className="btn primary" onClick={confirmEdit}>确认采纳</button>
                    <button className="btn" onClick={() => setEditingId(null)}>取消</button>
                  </div>
                </div>
              ) : (
                <div className="sug-actions">
                  <button
                    className={`btn primary${d === 'accepted' ? ' btn-accepted' : ''}`}
                    onClick={() => startEdit(s)}
                  >
                    {d === 'accepted' ? '已采纳' : s.kind === 'CONFIRM' ? '确认并补充' : '采纳'}
                  </button>
                  <button
                    className={`btn${d === 'ignored' ? ' btn-ignored' : ''}`}
                    onClick={() => onIgnore(s.id)}
                  >
                    {d === 'ignored' ? '已忽略' : '忽略'}
                  </button>
                  {d && (
                    <button className="btn btn-undo" onClick={() => onUndo(s.id)}>撤销</button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
