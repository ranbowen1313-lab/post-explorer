import { job, recommendJobs } from '../data'

function rateClass(rate: number): string {
  if (rate >= 80) return 'high'
  if (rate < 60) return 'low'
  return ''
}

export default function JobOverview() {
  return (
    <div className="top-cards">
      <div className="card">
        <div className="card-head">
          <span className="card-title">目标岗位</span>
          <span className="side-label">岗位描述</span>
        </div>
        <div className="card-body">
          <div className="doc-name">{job.title}</div>
          <div className="doc-meta">{job.company}</div>
          <div className="kv"><span>要求数</span><span>{job.requirementCount}</span></div>
          <div className="kv"><span>工作年限</span><span>{job.years}</span></div>
          <div className="kv"><span>工作地点</span><span>{job.location}</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">推荐匹配岗位</span>
          <span className="side-label">按匹配度排序</span>
        </div>
        <div className="card-body" style={{ padding: '10px 16px 12px' }}>
          {recommendJobs.map((j) => {
            const cls = rateClass(j.matchRate)
            return (
              <div key={j.title} className="job-item">
                <div className="top">
                  <span className="job-name">{j.title}</span>
                  <span className={`job-pct ${cls}`}>{j.matchRate}%</span>
                </div>
                <div className="job-company">{j.company} · {j.location}</div>
                <div className={`job-bar ${cls}`}>
                  <i style={{ width: `${j.matchRate}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
