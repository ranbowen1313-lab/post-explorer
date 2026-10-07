interface AcceptedItem {
  id: string
  text: string
}

interface Props {
  version: number
  saved: boolean
  acceptedItems: AcceptedItem[]
  onSave: () => void
}

export default function RevisionCard({ version, saved, acceptedItems, onSave }: Props) {
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">修改稿</span>
        <span className="ver">v{version}{saved ? '' : ' 草稿'}</span>
      </div>
      <div className="editor-bar">
        <span>当前版本</span>
        <span className="ver">v{version}</span>
        <span style={{ color: saved ? 'var(--green)' : 'var(--text-3)' }}>
          {saved ? '· 已保存' : '· 未保存'}
        </span>
      </div>
      <div className="draft">
        <p><strong>技能</strong></p>
        <p>Java、Spring Boot、MySQL、Linux</p>
        <p><strong>项目经历</strong></p>
        <p>参与<span className="hl">分布式系统</span>的搭建，负责订单中心模块……</p>
        {acceptedItems.length > 0 && (
          <>
            <p><strong>本次采纳的补充</strong></p>
            {acceptedItems.map((item) => (
              <p key={item.id} className="hl-new">· {item.text}</p>
            ))}
          </>
        )}
      </div>
      <div className="export-area">
        <button className="btn primary" style={{ flex: 1 }} onClick={onSave} disabled={saved}>
          {saved ? '已保存' : '保存修改稿'}
        </button>
        <button className="btn" style={{ flex: 1 }}>预览导出 Markdown</button>
      </div>
      <div className="hint">
        {saved
          ? `已保存为版本 v${version}`
          : `已采纳 ${acceptedItems.length} 条 · 保存后生成版本 v${version + 1}`}
      </div>
    </div>
  )
}
