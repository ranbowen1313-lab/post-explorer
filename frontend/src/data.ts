// 演示用 mock 数据（M1 静态版；M2/M3 接入后端后由接口返回）
import type { Analysis, Job, RecommendJob, Requirement, Resume, Revision, Suggestion } from './types'

export const resume: Resume = {
  name: '张三',
  target: 'Java 后端开发',
  meta: '3 年经验 · 本科 · 2024-10 更新',
  skills: ['Java', 'Spring Boot', 'MySQL', 'Linux', 'Git', 'Docker'],
  summary: '3 年 Java 后端开发经验，专注高并发订单系统与数据库优化，具备良好的工程规范与团队协作能力。',
  experiences: [
    { title: '某电商 · 后端开发工程师', period: '2021 - 至今 · 订单中心' },
    { title: '某外包 · Java 开发', period: '2020 - 2021 · 内部系统' },
  ],
}

export const job: Job = {
  title: 'Java 后端开发工程师',
  company: '某互联网公司',
  requirementCount: 5,
  years: '3-5 年',
  location: '深圳',
}

export const recommendJobs: RecommendJob[] = [
  { title: '后端开发工程师（Java）', company: '某电商公司', location: '深圳', matchRate: 82 },
  { title: 'Java 高级开发工程师', company: '某金融科技', location: '上海', matchRate: 76 },
  { title: '全栈开发工程师（Java/React）', company: '某企业服务', location: '深圳', matchRate: 64 },
  { title: '初级后端工程师', company: '某互联网', location: '北京', matchRate: 58 },
]

const requirements: Requirement[] = [
  {
    requirement: '熟练掌握 Java，有 Spring Boot 开发经验',
    evidence: '「订单中心」微服务，基于 Spring Boot 2.x 开发，处理日均 10w+ 订单',
    source: '项目经历',
    status: 'MATCHED',
  },
  {
    requirement: '熟悉 MySQL 数据库设计与性能调优',
    evidence: 'MySQL 索引优化、慢查询分析，主导库表分库分表改造',
    source: '技能',
    status: 'MATCHED',
  },
  {
    requirement: '熟悉 Redis 缓存',
    evidence: '简历中未提及 Redis 相关经历',
    status: 'NOT_MATCHED',
  },
  {
    requirement: '了解微服务架构（Spring Cloud）',
    evidence: '「参与过分布式系统的搭建」——表述模糊，未明确技术栈',
    source: '项目经历',
    status: 'NEED_CONFIRM',
  },
  {
    requirement: '良好的团队协作与沟通能力',
    evidence: '带领 3 人小组完成跨部门协作项目',
    source: '工作经历',
    status: 'MATCHED',
  },
]

export const analysis: Analysis = {
  score: 70,
  matched: 3,
  missing: 1,
  confirm: 1,
  snapshotAt: '2024-10-07 10:30',
  requirements,
}

export const suggestions: Suggestion[] = [
  {
    id: 'redis',
    kind: 'REWRITE',
    target: '针对「Redis 缓存」未体现',
    text: '简历中未提及 Redis 缓存，建议在技能中补充相关经历。',
    defaultText: '使用 Redis 实现热点数据缓存与分布式锁',
  },
  {
    id: 'spring-cloud-confirm',
    kind: 'CONFIRM',
    target: '针对「Spring Cloud」表述模糊',
    text: '「分布式系统」表述模糊，请确认是否参与过 Spring Cloud 微服务项目。',
    defaultText: '参与过 Spring Cloud 微服务项目（使用 Nacos、Gateway、OpenFeign）',
  },
  {
    id: 'spring-cloud-rewrite',
    kind: 'REWRITE',
    target: '措辞优化',
    text: '将「分布式系统」具体化为 Spring Cloud 微服务技术栈，可提升关键词匹配。',
    defaultText: 'Spring Cloud 微服务',
  },
]

export const revision: Revision = {
  version: 'v1',
  saved: false,
  skills: ['Java', 'Spring Boot', 'MySQL', 'Linux'],
  skillsNew: 'Redis（热点缓存、分布式锁）',
  experienceBefore: '分布式系统',
  experienceAfter: '分布式系统',
}
