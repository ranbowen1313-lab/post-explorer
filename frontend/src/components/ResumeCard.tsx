import { resume } from '../data'

export default function ResumeCard() {
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">当前简历</span>
        <span className="side-label">原稿 · 不可变</span>
      </div>
      <div className="card-body">
        <div className="doc-name">{resume.name} · {resume.target}</div>
        <div className="doc-meta">{resume.meta}</div>
        <span className="tag">已创建</span>

        <div className="section-label">技能</div>
        <div className="skill-list">
          {resume.skills.map((s) => (
            <span key={s} className="skill-pill">{s}</span>
          ))}
        </div>

        <div className="section-label">自我评价</div>
        <div className="brief">{resume.summary}</div>

        <div className="section-label">工作经历</div>
        {resume.experiences.map((e) => (
          <div key={e.title} className="exp-item">
            <div className="t">{e.title}</div>
            <div className="d">{e.period}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
