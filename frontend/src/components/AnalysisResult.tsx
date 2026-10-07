import { analysis } from '../data'
import type { MatchStatus } from '../types'

const STATUS_LABEL: Record<MatchStatus, string> = {
  MATCHED: '已体现',
  NOT_MATCHED: '未体现',
  NEED_CONFIRM: '需补充确认',
}

const STATUS_CLASS: Record<MatchStatus, string> = {
  MATCHED: 'matched',
  NOT_MATCHED: 'missing',
  NEED_CONFIRM: 'confirm',
}

export default function AnalysisResult() {
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">匹配分析结果</span>
        <span className="side-label">分析快照 · {analysis.snapshotAt}</span>
      </div>

      <div className="overview">
        <div className="score">
          <div className="row">
            <span>综合匹配度</span>
            <b>{analysis.score}%</b>
          </div>
          <div className="bar">
            <i style={{ width: `${analysis.score}%` }} />
          </div>
        </div>
        <div className="stat-group">
          <div className="stat matched">
            <div className="num">{analysis.matched}</div>
            <div className="lbl">已体现</div>
          </div>
          <div className="stat missing">
            <div className="num">{analysis.missing}</div>
            <div className="lbl">未体现</div>
          </div>
          <div className="stat confirm">
            <div className="num">{analysis.confirm}</div>
            <div className="lbl">需补充确认</div>
          </div>
        </div>
      </div>

      <table className="req-table">
        <thead>
          <tr>
            <th style={{ width: '32%' }}>岗位要求</th>
            <th style={{ width: '42%' }}>简历证据</th>
            <th style={{ width: '26%' }}>匹配状态</th>
          </tr>
        </thead>
        <tbody>
          {analysis.requirements.map((r) => (
            <tr key={r.requirement}>
              <td className="req-text">{r.requirement}</td>
              <td className="evi">
                {r.source && <span className="src">{r.source}：</span>}
                {r.evidence}
              </td>
              <td>
                <span className={`badge ${STATUS_CLASS[r.status]}`}>
                  <span className="dot" />
                  {STATUS_LABEL[r.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
