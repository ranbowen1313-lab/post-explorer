import { useEffect, useRef, useState } from 'react'
import { api, ApiError, type AnalysisItem, type JobItem, type ResumeItem } from '../api'

const STATUS_LABEL: Record<string, string> = {
  MATCHED: '已体现',
  NOT_MATCHED: '未体现',
  NEED_CONFIRM: '需补充确认',
}

const STATUS_CLASS: Record<string, string> = {
  MATCHED: 'matched',
  NOT_MATCHED: 'missing',
  NEED_CONFIRM: 'confirm',
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
  const [analysis, setAnalysis] = useState<AnalysisItem | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const pollTimer = useRef<number | null>(null)
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [savingKey, setSavingKey] = useState(false)

  useEffect(() => {
    Promise.all([api.resumes.list(), api.jobs.list()])
      .then(([rs, js]) => {
        setResumes(rs)
        setJobs(js)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : '加载失败'))
      .finally(() => setLoading(false))
    api.getApiKeyStatus()
      .then((r) => setApiKeyConfigured(r.configured))
      .catch(() => {})
    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current)
    }
  }, [])

  const selectedResume = resumes.find((r) => r.id === resumeId)
  const selectedJob = jobs.find((j) => j.id === jobId)

  function saveKey() {
    if (!apiKeyInput.trim()) return
    setSavingKey(true)
    setError('')
    api.setApiKey(apiKeyInput.trim())
      .then(() => {
        setApiKeyConfigured(true)
        setShowKeyInput(false)
        setApiKeyInput('')
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : '保存失败'))
      .finally(() => setSavingKey(false))
  }

  function startAnalysis() {
    if (!selectedResume || !selectedJob) return
    setAnalyzing(true)
    setError('')
    setAnalysis(null)
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
            setAnalysis(a)
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

  function retry() {
    if (!analysis) return
    setAnalyzing(true)
    setError('')
    const id = analysis.id
    api.analyses.retry(id)
      .then(() => pollAnalysis(id))
      .catch((e) => {
        setError(e instanceof ApiError ? e.message : '重试失败')
        setAnalyzing(false)
      })
  }

  const total = analysis?.requirements.length ?? 0
  const matched = analysis?.requirements.filter((r) => r.matchStatus === 'MATCHED').length ?? 0
  const missing = analysis?.requirements.filter((r) => r.matchStatus === 'NOT_MATCHED').length ?? 0
  const confirm = analysis?.requirements.filter((r) => r.matchStatus === 'NEED_CONFIRM').length ?? 0
  const score = total > 0 ? Math.round((matched / total) * 100) : 0

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
                    onChange={(e) => {
                      setResumeId(e.target.value ? Number(e.target.value) : '')
                      setAnalysis(null)
                    }}
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
                    onChange={(e) => {
                      setJobId(e.target.value ? Number(e.target.value) : '')
                      setAnalysis(null)
                    }}
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
                  DeepSeek API Key：
                  <span className={apiKeyConfigured ? 'api-key-ok' : 'api-key-no'}>
                    {apiKeyConfigured ? '已配置' : '未配置'}
                  </span>
                </span>
                {!showKeyInput && (
                  <button className="btn" onClick={() => setShowKeyInput(true)}>
                    {apiKeyConfigured ? '重新设置' : '设置 Key'}
                  </button>
                )}
              </div>
              {showKeyInput && (
                <div className="api-key-input">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="粘贴你的 DeepSeek API Key（sk-...）"
                  />
                  <button className="btn primary" onClick={saveKey} disabled={savingKey}>保存</button>
                  <button className="btn" onClick={() => setShowKeyInput(false)}>取消</button>
                </div>
              )}
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

      {analysis && analysis.status === 'FAILED' && (
        <div className="card">
          <div className="card-head"><span className="card-title">分析失败</span></div>
          <div className="card-body">
            <div className="login-error">{analysis.errorMessage}</div>
            <button className="btn primary" onClick={retry}>重试</button>
          </div>
        </div>
      )}

      {analysis && analysis.status === 'SUCCESS' && selectedResume && selectedJob && (
        <div className="result-layout">
          <aside>
            <div className="card">
              <div className="card-head">
                <span className="card-title">当前简历</span>
                <span className="side-label">原稿 · 不可变</span>
              </div>
              <div className="card-body">
                <div className="doc-name">{selectedResume.title}</div>
                <div className="doc-meta">更新于 {new Date(selectedResume.updatedAt).toLocaleString()}</div>
                <pre className="preview-text" style={{ marginTop: 10 }}>{selectedResume.content}</pre>
              </div>
            </div>
          </aside>

          <main>
            <div className="card">
              <div className="card-head">
                <span className="card-title">目标岗位</span>
                <span className="side-label">岗位描述</span>
              </div>
              <div className="card-body">
                <div className="doc-name">{selectedJob.title}</div>
                <pre className="preview-text" style={{ marginTop: 8 }}>{selectedJob.description}</pre>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <span className="card-title">匹配分析结果</span>
                <span className="side-label">快照 · {new Date(analysis.completedAt!).toLocaleString()}</span>
              </div>
              <div className="card-body">
                <div className="overview">
                  <div className="score">
                    <div className="row"><span>综合匹配度</span><b>{score}%</b></div>
                    <div className="bar"><i style={{ width: `${score}%` }} /></div>
                  </div>
                  <div className="stat-group">
                    <div className="stat matched"><div className="num">{matched}</div><div className="lbl">已体现</div></div>
                    <div className="stat missing"><div className="num">{missing}</div><div className="lbl">未体现</div></div>
                    <div className="stat confirm"><div className="num">{confirm}</div><div className="lbl">需补充确认</div></div>
                  </div>
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
                    {analysis.requirements.map((r) => (
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
              </div>
            </div>

            {analysis.suggestions.length > 0 && (
              <div className="card">
                <div className="card-head">
                  <span className="card-title">改稿建议</span>
                  <span className="side-label">{analysis.suggestions.length} 条</span>
                </div>
                <div className="card-body">
                  {analysis.suggestions.map((s) => {
                    const req = analysis.requirements.find((r) => r.id === s.requirementId)
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
                            {s.originalPassage && (
                              <div className="sug-original">原文：{s.originalPassage}</div>
                            )}
                            {s.suggestedPassage && (
                              <div className="sug-suggested">建议：{s.suggestedPassage}</div>
                            )}
                          </div>
                        ) : (
                          <div className="sug-text">{s.confirmationQuestion}</div>
                        )}
                        <div className="sug-actions">
                          <button className="btn primary">采纳</button>
                          <button className="btn">忽略</button>
                        </div>
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
                <span className="side-label">草稿</span>
              </div>
              <div className="card-body">
                <div className="empty">
                  修改稿将在 M4 实现<br />（采纳建议 → 编辑 → 保存版本 → 导出）
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
