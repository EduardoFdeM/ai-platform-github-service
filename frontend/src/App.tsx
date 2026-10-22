import { useCallback, useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header, type TabId } from './components/Header'
import { ConnectRepoModal } from './components/ConnectRepoModal'
import { OverviewTab } from './components/tabs/OverviewTab'
import { AuthTab } from './components/tabs/AuthTab'
import { WebhooksTab } from './components/tabs/WebhooksTab'
import { SyncTab } from './components/tabs/SyncTab'
import { IntelligenceTab } from './components/tabs/IntelligenceTab'
import { DevOpsTab } from './components/tabs/DevOpsTab'
import { DevelopmentTab } from './components/tabs/DevelopmentTab'
import LegacyDashboard from './components/legacy/LegacyDashboard'
import { LandingPage } from './components/LandingPage'
import { buildWorkspaceUrl, parseWorkspaceState } from './workspaceState'
import {
  api,
  type Branch,
  type Commit,
  type ConnectivityStatus,
  type Delivery,
  type FlowMetrics,
  type PullRequest,
  type Repository,
} from './api'

export default function App() {
  // As telas de ideação permanecem no histórico do código, mas o /app nunca as
  // ativa: somente dados reais ou estados explícitos de desenvolvimento aparecem.
  const showIdeationPreviews = false
  // A landing é a porta de entrada institucional. O workspace ativo fica em
  // /app; a versão entregue anteriormente continua disponível em /legacy.
  const [viewMode, setViewMode] = useState<'landing' | 'workspace' | 'legacy'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/legacy')) return 'legacy'
      if (
        window.location.pathname.startsWith('/app')
      ) return 'workspace'
      return 'landing'
    }
    return 'legacy'
  })

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'overview'
    return parseWorkspaceState(window.location.search).tab
  })
  const [connectModalOpen, setConnectModalOpen] = useState(false)

  // Estados Globais de Repositórios e Backend
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [commits, setCommits] = useState<Commit[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [flow, setFlow] = useState<FlowMetrics | null>(null)
  const [connectivity, setConnectivity] = useState<ConnectivityStatus | null>(null)
  const [repoDataLoading, setRepoDataLoading] = useState(false)
  const [repoDataError, setRepoDataError] = useState<string | null>(null)
  const [repositoryTokens, setRepositoryTokens] = useState<Record<number, string>>({})

  // Status de Sincronização
  const [syncing, setSyncing] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)

  // Sincroniza a rota ao usar os botões voltar/avançar do navegador
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/legacy')) {
        setViewMode('legacy')
        return
      }
      const isWorkspace = window.location.pathname.startsWith('/app')
      setViewMode(isWorkspace ? 'workspace' : 'landing')
    }
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [])

  const handleSwitchToLegacy = () => {
    window.history.pushState(null, '', '/legacy')
    setViewMode('legacy')
  }

  const handleSwitchToWorkspace = () => {
    window.history.pushState(null, '', '/app')
    setViewMode('workspace')
  }

  // Carregar dados iniciais da API Django
  const loadRepoCommitsAndDeliveries = useCallback(async (repoId: number) => {
    setRepoDataLoading(true)
    setRepoDataError(null)
    try {
      const [commitsRes, branchesRes, pullRequestsRes, delivRes, flowRes] = await Promise.all([
        api.commits(repoId),
        api.branches(repoId),
        api.pullRequests(repoId),
        api.deliveries(repoId),
        api.flow(repoId),
      ])
      setCommits(commitsRes.results)
      setBranches(branchesRes.results)
      setPullRequests(pullRequestsRes.results)
      setDeliveries(delivRes)
      setFlow(flowRes)
    } catch (err) {
      console.error('Erro ao carregar dados do repositório:', err)
      setCommits([])
      setBranches([])
      setPullRequests([])
      setDeliveries([])
      setFlow(null)
      setRepoDataError('Não foi possível carregar os dados indexados deste repositório.')
    } finally {
      setRepoDataLoading(false)
    }
  }, [])

  const loadInitialData = useCallback(async () => {
    try {
      const [cRes, repos] = await Promise.all([
        api.connectivity().catch(() => ({ status: 500, data: null as any })),
        api.repositories().catch(() => []),
      ])

      if (cRes.status === 200) setConnectivity(cRes.data)
      setRepositories(repos)

      const requestedRepoId = parseWorkspaceState(window.location.search).repositoryId
      const active = repos.find((repository) => repository.id === requestedRepoId) || repos[0] || null
      if (active) {
        setSelectedRepo(active)
        await loadRepoCommitsAndDeliveries(active.id)
      }
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err)
    }
  }, [loadRepoCommitsAndDeliveries])

  useEffect(() => {
    // oxlint-disable-next-line react(set-state-in-effect) -- carrega a API ao montar o workspace.
    void loadInitialData()
  }, [loadInitialData])

  const handleRefreshRepositoryData = useCallback(() => {
    if (selectedRepo) void loadRepoCommitsAndDeliveries(selectedRepo.id)
  }, [loadRepoCommitsAndDeliveries, selectedRepo])

  useEffect(() => {
    if (viewMode !== 'workspace') return
    window.history.replaceState(null, '', buildWorkspaceUrl(activeTab, selectedRepo?.id))
  }, [activeTab, selectedRepo, viewMode])

  // Disparo manual de sincronização real via GitHub API
  const handleSyncNow = async () => {
    if (!selectedRepo) {
      setSyncFeedback('Conecte ou selecione um repositório antes de sincronizar.')
      setConnectModalOpen(true)
      return
    }
    setSyncing(true)
    setSyncFeedback('Sincronizando com a API do GitHub...')
    try {
      const { status, data } = await api.syncRepository(selectedRepo.id, repositoryTokens[selectedRepo.id])
      if (status === 200) {
        setSyncFeedback(`Sincronização concluída: ${data.commits_synced} commits processados; branches e PRs reconciliados.`)
        await loadRepoCommitsAndDeliveries(selectedRepo.id)
      } else {
        setSyncFeedback(`Erro: HTTP ${status}`)
      }
    } catch (err: any) {
      setSyncFeedback(`Erro: ${err.message}`)
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncFeedback(null), 4000)
    }
  }

  // Novo repositório conectado via modal
  const handleRepoConnected = async (newRepo: Repository, token?: string) => {
    setRepositories((prev) => {
      const existing = prev.filter((r) => r.id !== newRepo.id)
      return [newRepo, ...existing]
    })
    setSelectedRepo(newRepo)
    if (token) setRepositoryTokens((current) => ({ ...current, [newRepo.id]: token }))
    await loadRepoCommitsAndDeliveries(newRepo.id)
    if (newRepo.initial_sync_status === 'failed') {
      setSyncFeedback(newRepo.initial_sync_detail || 'Repositório conectado, mas a sincronização inicial falhou.')
      setTimeout(() => setSyncFeedback(null), 6000)
    }
  }

  // Se o usuário estiver no modo clássico para gravação ou na porta 5174 / rota /legacy:
  if (viewMode === 'legacy') {
    return <LegacyDashboard onSwitchToWorkspace={handleSwitchToWorkspace} />
  }

  if (viewMode === 'landing') {
    return <LandingPage onEnterWorkspace={handleSwitchToWorkspace} />
  }

  return (
    <div className="nexus-layout">
      {/* Sidebar lateral do Módulo 2 (fixa e acompanha a viewport). */}
      <Sidebar />

      {/* Área de Conteúdo Principal */}
      <main className="nexus-main">
        {/* Topbar com navegação por abas, seletores e alternância de versão */}
        <Header
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          repositories={repositories}
          selectedRepo={selectedRepo}
          onSelectRepo={(r) => {
            setSelectedRepo(r)
            loadRepoCommitsAndDeliveries(r.id)
          }}
          onOpenConnectModal={() => setConnectModalOpen(true)}
          onSyncNow={handleSyncNow}
          syncing={syncing}
          connectivity={connectivity}
          onSwitchToLegacy={handleSwitchToLegacy}
        />

        {/* Feedback flutuante de sincronização */}
        {syncFeedback && (
          <div
            style={{
              position: 'fixed',
              bottom: 24,
              right: 28,
              backgroundColor: '#1E293B',
              border: '1px solid #3B82F6',
              color: '#93C5FD',
              padding: '10px 16px',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              fontSize: 12,
              fontWeight: 500,
              zIndex: 100,
            }}
          >
            {syncFeedback}
          </div>
        )}

        {/* Visualização de Conteúdo por Aba Selecionada */}
        {activeTab === 'overview' && (
          <OverviewTab
            selectedRepo={selectedRepo}
            commits={commits}
            connectivity={connectivity}
            flow={flow}
            onSyncNow={handleSyncNow}
            syncing={syncing}
          />
        )}

        {activeTab === 'auth' && (
          <AuthTab
            onTokenValidated={(token) => {
              if (selectedRepo) setRepositoryTokens((current) => ({ ...current, [selectedRepo.id]: token }))
            }}
          />
        )}

        {activeTab === 'webhooks' && (
          <WebhooksTab
            repository={selectedRepo}
            deliveries={deliveries}
            onRefreshData={handleRefreshRepositoryData}
          />
        )}

        {activeTab === 'sync' && (
          <SyncTab
            repository={selectedRepo}
            commits={commits}
            branches={branches}
            pullRequests={pullRequests}
            flow={flow}
            onSyncNow={handleSyncNow}
            syncing={syncing}
            loading={repoDataLoading}
            error={repoDataError}
          />
        )}

        {activeTab === 'analytics' && <IntelligenceTab repository={selectedRepo} variant="analytics" />}

        {activeTab === 'ai' && <IntelligenceTab repository={selectedRepo} variant="ai" />}

        {activeTab === 'devops' && showIdeationPreviews && <DevOpsTab />}

        {activeTab === 'devops' && !showIdeationPreviews && (
          <DevelopmentTab
            title="DevOps e documentação"
            status="Em desenvolvimento"
            description="A documentação real já está acessível; estados de release, deploy e cobertura só aparecerão quando vierem de uma fonte verificável."
            available={[
              'Swagger UI e schema OpenAPI gerados pelo backend',
              'Contrato OpenAPI validado sem erros ou avisos no CI',
              'Workflow de CI e arquivos de deployment versionados no repositório',
            ]}
            pending={[
              'Expor status real de build, cobertura, release e deploy antes de recriar os cards da POC',
            ]}
            showDocumentation
          />
        )}
      </main>

      {/* Modal para Conectar Repositório via Link do GitHub */}
      <ConnectRepoModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onSuccess={handleRepoConnected}
      />
    </div>
  )
}
