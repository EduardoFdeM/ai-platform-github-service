// Contratos espelham as respostas reais do Django em apps/github_sync/views.py.

export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  database: 'up' | 'down'
}

export interface ConnectivityStatus {
  status: 'up' | 'down'
  latency_ms: number
  github_status?: number
  detail?: string
}

export interface HandshakeResult {
  valid: boolean
  login?: string
  name?: string | null
  avatar_url?: string
  scopes?: string[]
  required_scopes?: string[]
  missing_scopes?: string[]
  excess_scopes?: string[]
  least_privilege?: boolean
  detail?: string
}

export interface Repository {
  id: number
  github_id: number
  owner: string
  name: string
  full_name: string
  default_branch: string
  initial_sync_status?: 'completed' | 'failed'
  initial_sync_detail?: string
  webhook_secret_version?: number
  webhook_secret_rotated_at?: string | null
  webhook_secret_expires_at?: string | null
}

export interface CommitFile {
  path: string
  change_type: 'added' | 'modified' | 'removed'
}

export interface Commit {
  sha: string
  repository: string
  branch: string | null
  author: string | null
  message: string
  authored_at: string
  url: string
  forced_push: boolean
  files: CommitFile[]
}

export interface Branch {
  id: number
  repository: string
  name: string
  deleted_at: string | null
}

export interface PullRequest {
  id: number
  repository: string
  number: number
  title: string
  state: string
  author: string | null
  opened_at: string
  closed_at: string | null
  merged_at: string | null
  updated_at: string
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface FlowMetrics {
  total_commits: number
  commits_by_author: { author__login: string | null; commits: number }[]
}

export type DeliveryStatus = 'pending' | 'processing' | 'processed' | 'failed'

export interface Delivery {
  delivery_id: string
  event: string
  status: DeliveryStatus
  attempts: number
  error: string
  received_at: string
  processed_at: string | null
  ref: string
  commits_count: number
}

export interface WebhookResponse {
  status?: 'accepted' | 'ignored'
  delivery_id?: string
  reason?: string
  detail?: string
}

export interface RepositoryIntelligence {
  repository: { id: number; name: string }
  period_days: number
  generated_at: string
  analysis_mode: string
  total_commits: number
  average_clarity_score: number | null
  clarity_distribution: Record<string, number>
  frequency: {
    by_weekday: Record<string, number>
    by_hour: Record<string, number>
    by_author: Record<string, number>
  }
  indicators: {
    top_author: string | null
    author_concentration_percent: number
    off_hours_percent: number
    burst_days: string[]
  }
  bottlenecks: { code: string; severity: 'info' | 'warning' | 'critical'; evidence: string }[]
  recommendations: string[]
  recent_commit_quality: {
    sha: string
    message: string
    author: string | null
    authored_at: string
    score: number
    label: 'clara' | 'adequada' | 'vaga'
    suggestions: string[]
  }[]
}

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, body: unknown) {
    super(`HTTP ${status}`)
    this.status = status
    this.body = body
  }
}

// During local development Vite runs on a different port from Django. The API
// proxy covers fetch calls, but a browser navigation to /docs would otherwise
// remain on Vite and return 404. Point documentation links to Django directly.
export const apiOrigin = import.meta.env.VITE_API_TARGET || (
  import.meta.env.DEV
    ? 'http://localhost:8000'
    : (typeof window === 'undefined' ? '' : window.location.origin)
)

export const apiDocumentation = {
  swagger: `${apiOrigin}/docs/`,
  schema: `${apiOrigin}/api/schema/`,
}

async function request<T>(path: string, init?: RequestInit): Promise<{ status: number; data: T }> {
  // Os cookies de localhost são compartilhados entre portas: se houver sessão do
  // Django admin aberta, o DRF passaria a exigir CSRF. A SPA só usa endpoints
  // públicos, então omitimos credenciais.
  const response = await fetch(path, { credentials: 'omit', ...init })
  const text = await response.text()
  const data = text ? (JSON.parse(text) as T) : (undefined as T)
  return { status: response.status, data }
}

async function getJson<T>(path: string): Promise<T> {
  const { status, data } = await request<T>(path)
  if (status >= 400) throw new ApiError(status, data)
  return data
}

export const api = {
  health: () => request<HealthStatus>('/api/v1/health'),
  connectivity: () => request<ConnectivityStatus>('/api/v1/health/github-connectivity'),

  handshake: (token: string) =>
    request<HandshakeResult>('/api/v1/github/handshake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }),

  repositories: () => getJson<Repository[]>('/api/v1/repositories'),

  commits: (repositoryId: number) =>
    getJson<Paginated<Commit>>(`/api/v1/commits?repository_id=${repositoryId}&page_size=20`),

  branches: (repositoryId: number) =>
    getJson<Paginated<Branch>>(`/api/v1/branches?repository_id=${repositoryId}`),

  pullRequests: (repositoryId: number) =>
    getJson<Paginated<PullRequest>>(`/api/v1/pull-requests?repository_id=${repositoryId}`),

  flow: (repositoryId: number) => getJson<FlowMetrics>(`/api/v1/metrics/flow?repository_id=${repositoryId}`),

  insights: (repositoryId: number, days = 30) =>
    getJson<RepositoryIntelligence>(`/api/v1/repositories/${repositoryId}/insights?days=${days}`),

  deliveries: (repositoryId: number) =>
    getJson<Delivery[]>(`/api/v1/webhooks/deliveries?repository_id=${repositoryId}`),

  sendWebhook: (body: string, headers: Record<string, string>) =>
    request<WebhookResponse>('/webhooks/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body,
    }),

  syncRepository: (repositoryId: number, token?: string) =>
    request<{ status: string; repository: string; commits_synced: number }>(
      `/api/v1/repositories/${repositoryId}/sync`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }
    ),

  createRepository: (params: { url?: string; owner?: string; name?: string; token?: string; webhook_secret: string }) =>
    request<Repository>('/api/v1/repositories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),
}


