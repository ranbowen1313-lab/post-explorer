// 前端 API 客户端：统一 fetch 封装、token 管理、错误处理

// ---- 后端 DTO 类型 ----
export interface User {
  id: number
  email: string
  name: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ResumeItem {
  id: number
  title: string
  content: string
  draftContent: string
  createdAt: string
  updatedAt: string
}

export interface JobItem {
  id: number
  title: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface RequirementItem {
  id: number
  seq: number
  jobRequirementQuote: string
  resumeEvidenceQuote: string | null
  matchStatus: string
  reason: string
}

export interface SuggestionItem {
  id: number
  requirementId: number
  kind: string
  originalPassage: string | null
  suggestedPassage: string | null
  rewriteReason: string | null
  confirmationQuestion: string | null
  decision: string
}

export interface AnalysisItem {
  id: number
  status: string
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
  resumeId: number
  jobId: number
  resumeSnapshot: string
  jobSnapshot: string
  draftContent: string
  requirements: RequirementItem[]
  suggestions: SuggestionItem[]
}

export interface RevisionItem {
  id: number
  resumeId: number
  versionNo: number
  content: string
  savedAt: string
}

export interface PingResult {
  status: string
  service: string
  time: number
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// ---- token 管理 ----
const TOKEN_KEY = 'resume_match_token'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // localStorage 不可用（隐私模式 / sandbox iframe），忽略
  }
}

// ---- 请求封装 ----
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(path, { ...init, headers })
  } catch {
    throw new ApiError(0, '网络请求失败，后端可能未启动')
  }

  if (res.status === 401 || res.status === 403) {
    setToken(null)
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const data = await res.json()
      if (data?.error) message = data.error
    } catch {
      // 非 JSON 响应，保留默认 message
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) {
    return undefined as T
  }
  return res.json() as Promise<T>
}

// ---- API ----
export const api = {
  ping: () => request<PingResult>('/api/ping'),

  register: (email: string, password: string, name: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>('/api/auth/me'),

  setApiKey: (apiKey: string) =>
    request<void>('/api/auth/api-key', {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
    }),

  getApiKeyStatus: () => request<{ configured: boolean }>('/api/auth/api-key'),

  testApiKey: (apiKey: string) =>
    request<{ ok: boolean; error?: string }>('/api/auth/api-key/test', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    }),

  resumes: {
    list: () => request<ResumeItem[]>('/api/resumes'),
    create: (title: string, content: string) =>
      request<ResumeItem>('/api/resumes', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      }),
    get: (id: number) => request<ResumeItem>(`/api/resumes/${id}`),
    remove: (id: number) => request<void>(`/api/resumes/${id}`, { method: 'DELETE' }),
    updateDraft: (id: number, content: string) =>
      request<ResumeItem>(`/api/resumes/${id}/draft`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),
    saveRevision: (id: number, content: string) =>
      request<RevisionItem>(`/api/resumes/${id}/revisions`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    listRevisions: (id: number) => request<RevisionItem[]>(`/api/resumes/${id}/revisions`),
    format: (raw: string) =>
      request<{ formatted: string }>('/api/resumes/format', {
        method: 'POST',
        body: JSON.stringify({ raw }),
      }),
  },

  jobs: {
    list: () => request<JobItem[]>('/api/jobs'),
    create: (title: string, description: string) =>
      request<JobItem>('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      }),
    get: (id: number) => request<JobItem>(`/api/jobs/${id}`),
    remove: (id: number) => request<void>(`/api/jobs/${id}`, { method: 'DELETE' }),
  },

  analyses: {
    create: (resumeId: number, jobId: number) =>
      request<AnalysisItem>(`/api/resumes/${resumeId}/analyses`, {
        method: 'POST',
        body: JSON.stringify({ jobId }),
      }),
    get: (id: number) => request<AnalysisItem>(`/api/analyses/${id}`),
    list: () => request<AnalysisItem[]>('/api/analyses'),
    remove: (id: number) => request<void>(`/api/analyses/${id}`, { method: 'DELETE' }),
    listByResume: (resumeId: number) => request<AnalysisItem[]>(`/api/resumes/${resumeId}/analyses`),
    retry: (id: number) => request<AnalysisItem>(`/api/analyses/${id}/retry`, { method: 'POST' }),
    updateDraft: (id: number, content: string) =>
      request<AnalysisItem>(`/api/analyses/${id}/draft`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),
  },

  suggestions: {
    accept: (id: number, replacementText?: string) =>
      request<{ decision: string; draftContent: string }>(`/api/suggestions/${id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ replacementText: replacementText ?? null }),
      }),
    ignore: (id: number) => request<{ decision: string }>(`/api/suggestions/${id}/ignore`, { method: 'POST' }),
    reset: (id: number) =>
      request<{ decision: string; draftContent: string }>(`/api/suggestions/${id}/reset`, { method: 'POST' }),
  },
}

export async function downloadExport(id: number) {
  const token = getToken()
  const res = await fetch(`/api/resumes/${id}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    throw new ApiError(res.status, '导出失败')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'resume.md'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function downloadAnalysisExport(id: number) {
  const token = getToken()
  const res = await fetch(`/api/analyses/${id}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    throw new ApiError(res.status, '导出失败')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'resume.md'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
