import type { TabId } from './components/Header'


export const WORKSPACE_TABS: TabId[] = ['overview', 'auth', 'webhooks', 'sync', 'analytics', 'ai', 'devops']


export function parseWorkspaceState(search: string): { tab: TabId; repositoryId: number | null } {
  const params = new URLSearchParams(search)
  const requestedTab = params.get('tab') as TabId | null
  const repositoryId = Number(params.get('repo'))
  return {
    tab: requestedTab && WORKSPACE_TABS.includes(requestedTab) ? requestedTab : 'overview',
    repositoryId: Number.isSafeInteger(repositoryId) && repositoryId > 0 ? repositoryId : null,
  }
}


export function buildWorkspaceUrl(tab: TabId, repositoryId?: number | null): string {
  const params = new URLSearchParams({ tab })
  if (repositoryId) params.set('repo', String(repositoryId))
  return `/app?${params.toString()}`
}
