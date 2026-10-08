import { useEffect, useRef, useState } from 'react'
import { api, ApiError, downloadAnalysisExport, type AnalysisItem, type JobItem, type ResumeItem, type SuggestionItem } from '../api'

const STATUS_LABEL: Record<string, string> = {
  MATCHED: '已体现',
  NOT_MATCHED: '未体现',
  NEED_CONFIRM: '需确认',
}

const STATUS_CLASS: Record<string, string> = {
  MATCHED: 'matched',
  NOT_MATCHED: 'missing',
  NEED_CONFIRM: 'confirm',
}

function firstLine(s: string) {
  const line = (s || '').split('\n')[0] || ''
  return line.replace(/^#\s*/, '')
}

function renderHighlighted(content: string, highlight?: string) {
  if (!highlight || !content) return content
  const idx = content.indexOf(highlight)
  if (idx < 0) return content
  return (
    <>
      {content.slice(0, idx)}
      <mark className="draft-mark">{highlight}</mark>
      {content.slice(idx + highlight.length)}
    </>
  )
}

export default function AnalysisView() {
  const [resumes, setResumes] = useState<ResumeItem[]>([])
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resumeId, setResumeId] = useState<number | ''>('')
  const [jobId, setJobId] = useState<number | ''>('')
  const [resumeTouched, setResumeTouched] = useState(false)
  const [jobTouched, setJobTouched] = useState(false)

  const [analyses, setAnalyses] = useState<AnalysisItem[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const pollTimer = useRef<number | null>(null)

  const [editingSugId, setEditingSugId] = useState<number | null>(null)
  const [sugInput, setSugInput] = useState('')
  const [highlightMap, setHighlightMap] = useState<Record<number, string>>({})
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null)
  const [savedMap, setSavedMap] = useState<Record<number, boolean>>({})
  const [savingMap, setSavingMap] = useState<Record<number, boolean>>({})
  const [confirmSave, setConfirmSave] = useState<AnalysisItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([api.resumes.list(), api.jobs.list()])
      .then(([rs, js]) => {
        setResumes(rs)
        setJobs(js)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : '加载失败'))
      .finally(() => setLoading(false))
    api.analyses.list()
      .then((list) => setAnalyses(list))
      .catch(() => {})
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current)
    }
  }, [])

  const selectedResume = resumes.find((r) => r.id === resumeId)
  const selectedJob = jobs.find((j) => j.id === jobId)

  function startAnalysis() {
    if (!selectedResume || !selectedJob) return
    setAnalyzing(true)
    setError('')
    api.analyses.create(selectedResume.id, selectedJob.id)
      .then((created) => pollAnalysis(created.id))
      .catch((e) => {
        setError(e instanceof ApiError ? e.message : '发起分析失败')
        setAnalyzing(false)
      })
  }

  function pollAnalysis(id: number) {
    const timer = window.setInterval(() => {
      api.analyses.get(id)
        .then((a) => {
          if (a.status === 'SUCCESS' || a.status === 'FAILED') {
            window.clearInterval(timer)
            if (a.status === 'SUCCESS') {
              setAnalyses((prev) => [...prev, a])
              setExpandedId(a.id)
            }
            setAnalyzing(false)
          }
        })
        .catch((e) => {
          window.clearInterval(timer)
          setError(e instanceof ApiError ? e.message : '查询分析失败')
          setAnalyzing(false)
        })
    }, 2000)
    pollTimer.current = timer
  }

  function toggleExpand(id: number) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function updateAnalysis(analysisId: number, updater: (a: AnalysisItem) => AnalysisItem) {
    setAnalyses((prev) => prev.map((a) => (a.id === analysisId ? updater(a) : a)))
  }

  function startEdit(analysisId: number, s: SuggestionItem) {
    setEditingSugId(s.id)
    setSugInput(s.kind === 'REWRITE' ? (s.suggestedPassage || '') : '')
    // 打开输入框时，高亮修改稿中这条建议针对的原文
    const original = s.originalPassage
    if (original) {
      setHighlightMap((prev) => ({ ...prev, [analysisId]: original }))
    }
  }

  function confirmAccept(analysisId: number, s: SuggestionItem) {
    api.suggestions.accept(s.id, sugInput || undefined)
      .then((res) => {
        updateAnalysis(analysisId, (a) => ({
          ...a,
          draftContent: res.draftContent,
          suggestions: a.suggestions.map((x) => (x.id === s.id ? { ...x, decision: 'ACCEPTED' } : x)),
        }))
        if (sugInput) {
          setHighlightMap((prev) => ({ ...prev, [analysisId]: sugInput }))
        }
        setEditingSugId(null)
        setSugInput('')
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : '操作失败'))
  }

  function cancelAccept() {
    setEditingSugId(null)
    setSugInput('')
  }

  function handleIgnore(analysisId: number, s: SuggestionItem) {
    api.suggestions.ignore(s.id)
      .then(() => updateAnalysis(analysisId, (a) => ({
        ...a,
        suggestions: a.suggestions.map((x) => (x.id === s.id ? { ...x, decision: 'IGNORED' } : x)),
      })))
      .catch((e) => setError(e instanceof ApiError ? e.message : '操作失败'))
  }

  function handleReset(analysisId: number, s: SuggestionItem) {
    api.suggestions.reset(s.id)
      .then((res) => {
        updateAnalysis(analysisId, (a) => ({
          ...a,
          draftContent: res.draftContent,
          suggestions: a.suggestions.map((x) => (x.id === s.id ? { ...x, decision: 'PENDING' } : x)),
        }))
        setHighlightMap((prev) => {
          const next = { ...prev }
          delete next[analysisId]
          return next
        })
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : '撤回失败'))
  }

  function editDraft(analysisId: number, content: string) {
    updateAnalysis(analysisId, (a) => ({ ...a, draftContent: content }))
  }

  function handleSave(a: AnalysisItem) {
    const pending = a.suggestions.filter((s) => s.decision === 'PENDING').length
    if (pending > 0) {
      setConfirmSave(a)
      return
    }
    doSave(a)
  }

  function doSave(a: AnalysisItem) {
    setSavingMap((prev) => ({ ...prev, [a.id]: true }))
    api.analyses.updateDraft(a.id, a.draftContent)
      .then(() => {
        setSavedMap((prev) => ({ ...prev, [a.id]: true }))
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : '保存失败'))
      .finally(() => setSavingMap((prev) => ({ ...prev, [a.id]: false })))
  }

  function handleExport(a: AnalysisItem) {
    downloadAnalysisExport(a.id)
      .catch((e) => setError(e instanceof ApiError ? e.message : '导出失败'))
  }

  function handleDelete(analysisId: number) {
    setConfirmDelete(analysisId)
  }

  function doDelete(analysisId: number) {
    api.analyses.remove(analysisId)
      .then(() => {
        setAnalyses((prev) => prev.filter((x) => x.id !== analysisId))
        if (expandedId === analysisId) setExpandedId(null)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : '删除失败'))
  }

  return (
    <div className="analysis-page">
      <div className="card">
        <div className="card-head">
          <span className="card-title">发起匹配分析</span>
          <span className="side-label">选择你的简历与岗位</span>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="empty">加载中…</div>
          ) : (
            <>
              <div className="select-row">
                <label className="field">
                  <span>选择简历</span>
                  <select
                    value={resumeId}
                    onFocus={() => setResumeTouched(true)}
                    onChange={(e) => setResumeId(e.target.value ? Number(e.target.value) : '')}
                  >
                    {resumes.length === 0 ? (
                      <option value="" disabled>（暂无简历）</option>
                    ) : (
                      <>
                        <option value="">请选择简历</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>{r.title}</option>
                        ))}
                      </>
                    )}
                  </select>
                </label>
                <label className="field">
                  <span>选择岗位</span>
                  <select
                    value={jobId}
                    onFocus={() => setJobTouched(true)}
                    onChange={(e) => setJobId(e.target.value ? Number(e.target.value) : '')}
                  >
                    {jobs.length === 0 ? (
                      <option value="" disabled>（暂无岗位）</option>
                    ) : (
                      <>
                        <option value="">请选择岗位</option>
                        {jobs.map((j) => (
                          <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                      </>
                    )}
                  </select>
                </label>
                <button
                  className="btn primary analyze-btn"
                  disabled={!selectedResume || !selectedJob || analyzing}
                  onClick={startAnalysis}
                >
                  {analyzing ? '分析中…' : '发起分析'}
                </button>
              </div>
              <div className="api-key-row">
                <span className="api-key-label">
                  未配置 API Key 时，请在右上角「设置 API Key」处配置。
                </span>
              </div>
              {resumeTouched && resumes.length === 0 && (
                <div className="hint-text">你还没有简历，请先到「简历」页创建一份。</div>
              )}
              {jobTouched && jobs.length === 0 && (
                <div className="hint-text">你还没有岗位，请先到「岗位」页创建一个。</div>
              )}
            </>
          )}
          {error && <div className="login-error">{error}</div>}
        </div>
      </div>

      {analyzing && (
        <div className="card">
          <div className="card-body">
            <div className="empty">分析中，请稍候…（模型生成可能需要几秒到几十秒）</div>
          </div>
        </div>
      )}

      {analyses.map((a) => (
        <div className="analysis-box" key={a.id}>
          <div className="box-head" onClick={() => toggleExpand(a.id)}>
            <span className="box-title">分析 #{a.id}</span>
            <span className="box-meta">{firstLine(a.resumeSnapshot)} × {firstLine(a.jobSnapshot)}</span>
            <span className="box-time">{a.completedAt ? new Date(a.completedAt).toLocaleString() : ''}</span>
            <span className="box-toggle">{expandedId === a.id ? '收起 ▲' : '展开 ▼'}</span>
            <button className="btn box-delete" onClick={(e) => { e.stopPropagation(); handleDelete(a.id) }}>删除</button>
          </div>
          {expandedId === a.id && (
            <div className="result-layout">
              <aside>
                <div className="card">
                  <div className="card-head">
                    <span className="card-title">当前简历</span>
                    <span className="side-label">快照 · 不可变</span>
                  </div>
                  <div className="card-body">
                    <pre className="preview-text">{a.resumeSnapshot}</pre>
                  </div>
                </div>
              </aside>

              <main>
                <div className="card">
                  <div className="card-head"><span className="card-title">目标岗位</span></div>
                  <div className="card-body">
                    <pre className="preview-text">{a.jobSnapshot}</pre>
                  </div>
                </div>

                <div className="card">
                  <div className="card-head">
                    <span className="card-title">匹配分析结果</span>
                    <span className="side-label">{new Date(a.completedAt!).toLocaleString()}</span>
                  </div>
                  <div className="card-body">
                    {(() => {
                      const total = a.requirements.length
                      const matched = a.requirements.filter((r) => r.matchStatus === 'MATCHED').length
                      const missing = a.requirements.filter((r) => r.matchStatus === 'NOT_MATCHED').length
                      const confirm = a.requirements.filter((r) => r.matchStatus === 'NEED_CONFIRM').length
                      const score = total > 0 ? Math.round((matched / total) * 100) : 0
                      return (
                        <>
                          <div className="overview">
                            <div className="score">
                              <div className="row"><span>综合匹配度</span><b>{score}%</b></div>
                              <div className="bar"><i style={{ width: `${score}%` }} /></div>
                            </div>
                            <div className="stat-group">
                              <div className="stat matched"><div className="num">{matched}</div><div className="lbl">已体现</div></div>
                              <div className="stat missing"><div className="num">{missing}</div><div className="lbl">未体现</div></div>
                              <div className="stat confirm"><div className="num">{confirm}</div><div className="lbl">需确认</div></div>
                            </div>
                          </div>
                          <div className="legend">
                            <span className="legend-item"><span className="dot-status matched" />已体现：简历中有该要求的证据</span>
                            <span className="legend-item"><span className="dot-status missing" />未体现：当前简历找不到该要求的证据</span>
                            <span className="legend-item"><span className="dot-status confirm" />需确认：有相关线索，但责任/范围/结果不明确</span>
                          </div>
                          <table className="req-table">
                            <thead>
                              <tr>
                                <th style={{ width: '34%' }}>岗位要求</th>
                                <th style={{ width: '40%' }}>简历证据</th>
                                <th style={{ width: '26%' }}>匹配状态</th>
                              </tr>
                            </thead>
                            <tbody>
                              {a.requirements.map((r) => (
                                <tr key={r.id}>
                                  <td className="req-text">{r.jobRequirementQuote}</td>
                                  <td className="evi">{r.resumeEvidenceQuote || '简历中未提及'}</td>
                                  <td>
                                    <span className={`badge ${STATUS_CLASS[r.matchStatus]}`}>
                                      <span className="dot" />
                                      {STATUS_LABEL[r.matchStatus] ?? r.matchStatus}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {a.suggestions.length > 0 && (
                  <div className="card">
                    <div className="card-head">
                      <span className="card-title">改稿建议</span>
                      <span className="side-label">{a.suggestions.length} 条</span>
                    </div>
                    <div className="card-body">
                      {a.suggestions.map((s) => {
                        const req = a.requirements.find((r) => r.id === s.requirementId)
                        return (
                          <div key={s.id} className="suggestion">
                            <div className="sug-head">
                              <span className={`kind ${s.kind === 'REWRITE' ? 'rewrite' : 'confirm'}`}>
                                {s.kind === 'REWRITE' ? '改稿' : '需确认'}
                              </span>
                              {req && (
                                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                                  针对「{req.jobRequirementQuote}」
                                </span>
                              )}
                            </div>
                            {s.kind === 'REWRITE' ? (
                              <div className="sug-text">
                                {s.originalPassage && <div className="sug-original">原文：{s.originalPassage}</div>}
                                {s.suggestedPassage && <div className="sug-suggested">建议：{s.suggestedPassage}</div>}
                              </div>
                            ) : (
                              <div className="sug-text">{s.confirmationQuestion}</div>
                            )}
                            {editingSugId === s.id ? (
                              <div className="sug-edit">
                                <textarea
                                  className="sug-edit-input"
                                  value={sugInput}
                                  onChange={(e) => setSugInput(e.target.value)}
                                  rows={3}
                                  placeholder={s.kind === 'REWRITE' ? '修改内容' : (s.confirmationQuestion || '补充信息')}
                                />
                                <div className="sug-actions">
                                  <button className="btn primary" onClick={() => confirmAccept(a.id, s)}>
                                    {s.kind === 'REWRITE' ? '确认采纳' : '确认补充'}
                                  </button>
                                  <button className="btn" onClick={cancelAccept}>取消</button>
                                </div>
                              </div>
                            ) : (
                              <div className="sug-actions">
                                <button
                                  className={`btn primary${s.decision === 'ACCEPTED' ? ' btn-accepted' : ''}`}
                                  onClick={() => startEdit(a.id, s)}
                                  disabled={s.decision === 'IGNORED'}
                                >
                                  {s.kind === 'REWRITE'
                                    ? (s.decision === 'ACCEPTED' ? '已采纳' : '采纳')
                                    : (s.decision === 'ACCEPTED' ? '已补充' : '补充')}
                                </button>
                                <button
                                  className={`btn${s.decision === 'IGNORED' ? ' btn-ignored' : ''}`}
                                  onClick={() => handleIgnore(a.id, s)}
                                  disabled={s.decision === 'ACCEPTED'}
                                >
                                  {s.decision === 'IGNORED' ? '已忽略' : '忽略'}
                                </button>
                                {s.decision === 'ACCEPTED' && (
                                  <button className="btn" onClick={() => handleReset(a.id, s)}>撤回</button>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </main>

              <aside>
                <div className="card">
                  <div className="card-head">
                    <span className="card-title">修改稿</span>
                    <span className="side-label">{savedMap[a.id] ? '已保存' : '本分析独立草稿'}</span>
                  </div>
                  <div className="card-body">
                    {editingDraftId === a.id ? (
                      <div>
                        <textarea
                          className="draft-editor"
                          value={a.draftContent}
                          onChange={(e) => editDraft(a.id, e.target.value)}
                          rows={16}
                          placeholder="修改稿内容"
                        />
                        <div className="draft-actions">
                          <button className="btn primary" onClick={() => setEditingDraftId(null)}>完成</button>
                        </div>
                      </div>
                    ) : (
                      <div className="draft-preview" onClick={() => setEditingDraftId(a.id)} title="点击编辑修改稿">
                        {renderHighlighted(a.draftContent, highlightMap[a.id])}
                      </div>
                    )}
                    <div className="draft-actions">
                      <button className="btn primary" onClick={() => handleSave(a)} disabled={savingMap[a.id]}>
                        {savingMap[a.id] ? '保存中…' : savedMap[a.id] ? '重新保存' : '保存'}
                      </button>
                      {savedMap[a.id] && (
                        <button className="btn" onClick={() => handleExport(a)}>导出 Markdown</button>
                      )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      ))}

      {confirmSave && (() => {
        const pending = confirmSave.suggestions.filter((s) => s.decision === 'PENDING').length
        return (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-title">确认保存</div>
              <div className="modal-body">
                该分析还有 {pending} 条建议未采纳或补充，确定保存修改稿吗？
              </div>
              <div className="modal-actions">
                <button className="btn primary" onClick={() => { doSave(confirmSave); setConfirmSave(null) }}>继续保存</button>
                <button className="btn" onClick={() => setConfirmSave(null)}>取消</button>
              </div>
            </div>
          </div>
        )
      })()}

      {confirmDelete !== null && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">确认删除</div>
            <div className="modal-body">确定删除分析 #{confirmDelete}？此操作不可恢复。</div>
            <div className="modal-actions">
              <button className="btn danger" onClick={() => { doDelete(confirmDelete); setConfirmDelete(null) }}>删除</button>
              <button className="btn" onClick={() => setConfirmDelete(null)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
