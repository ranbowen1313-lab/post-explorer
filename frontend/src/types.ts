// 简历与岗位匹配助手 · 前端数据类型定义

/** 匹配三态：已体现 / 未体现 / 需要补充确认 */
export type MatchStatus = 'MATCHED' | 'NOT_MATCHED' | 'NEED_CONFIRM'

/** 建议类型：改稿（重写）/ 需确认 */
export type SuggestionKind = 'REWRITE' | 'CONFIRM'

/** 工作经历 */
export interface Experience {
  title: string
  period: string
}

/** 简历（原稿） */
export interface Resume {
  name: string
  target: string
  meta: string
  skills: string[]
  summary: string
  experiences: Experience[]
}

/** 目标岗位 */
export interface Job {
  title: string
  company: string
  requirementCount: number
  years: string
  location: string
}

/** 推荐匹配岗位 */
export interface RecommendJob {
  title: string
  company: string
  location: string
  matchRate: number
}

/** 岗位要求 - 简历证据对照 */
export interface Requirement {
  requirement: string
  evidence: string
  source?: string
  status: MatchStatus
}

/** 匹配分析结果 */
export interface Analysis {
  score: number
  matched: number
  missing: number
  confirm: number
  snapshotAt: string
  requirements: Requirement[]
}

/** 建议处理决定 */
export type Decision = 'accepted' | 'ignored'

/** 改稿建议 */
export interface Suggestion {
  id: string
  kind: SuggestionKind
  target: string
  text: string          // 建议说明（卡片展示）
  defaultText: string   // 输入框默认正文（真正写入修改稿的内容）
}

/** 修改稿 */
export interface Revision {
  version: string
  saved: boolean
  skills: string[]
  skillsNew: string
  experienceBefore: string
  experienceAfter: string
}
