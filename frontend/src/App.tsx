import { useCallback, useEffect, useState } from 'react'
import { WorkspaceSidebar } from './components/WorkspaceSidebar'
import { WorkspaceHeader } from './components/WorkspaceHeader'
import type { TabId } from './components/Header'
import { ConnectRepoModal } from './components/ConnectRepoModal'
import { OverviewTab } from './components/tabs/OverviewTab'
import { AuthTab } from './components/tabs/AuthTab'
import { WebhooksTab } from './components/tabs/WebhooksTab'
import { SyncTab } from './components/tabs/SyncTab'
import { IntelligenceTab } from './components/tabs/IntelligenceTab'
import { DevelopmentTab } from './components/tabs/DevelopmentTab'
import { LandingPage } from './components/LandingPage'
import { PlatformAccess } from './components/PlatformAccess'
import { CreateProjectModal } from './components/CreateProjectModal'
import { buildWorkspaceUrl, parseWorkspaceState } from './workspaceState'
import {
  clearPlatformSession,
  isSessionExpired,
  readPlatformSession,
  savePlatformSession,
  type PlatformSession,
} from './platformSession'
import {
  api,
  ApiError,
  type Branch,
  type Commit,
  type ConnectivityStatus,
  type Delivery,
  type FlowMetrics,
  type PullRequest,
  type PlatformProject,
  type Repository,
} from './api'

export default function App() {
  // A landing é a porta de entrada institucional e /app é o único workspace.
  const [viewMode, setViewMode] = useState<'landing' | 'workspace'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/legacy')) {
        window.history.replaceState(null, '', '/app')
        return 'workspace'
      }
      if (
        window.location.pathname.startsWith('/app')
      ) return 'workspace'
      return 'landing'
    }
    return 'landing'
  })

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'overview'
    return parseWorkspaceState(window.location.search).tab
  })
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false)
  const [platformSession, setPlatformSession] = useState<PlatformSession | null>(() => readPlatformSession())
  const [sessionChecking, setSessionChecking] = useState(false)
  const [accessNotice, setAccessNotice] = useState<string | null>(null)
  const [platformContextLoading, setPlatformContextLoading] = useState(false)
  const [platformContextError, setPlatformContextError] = useState<string | null>(null)
  const [platformContextReload, setPlatformContextReload] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches)
  const [projects, setProjects] = useState<PlatformProject[]>([])
  const [selectedProject, setSelectedProject] = useState<PlatformProject | null>(null)

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
      if (window.location.pathname.startsWith('/legacy')) window.history.replaceState(null, '', '/app')
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

  const handleSwitchToWorkspace = () => {
    window.history.pushState(null, '', '/app')
    setViewMode('workspace')
  }

  const handleLogout = useCallback((reason: 'expired' | 'manual' = 'expired') => {
    api.setAccessToken(null)
    clearPlatformSession()
    setPlatformSession(null)
    setProjects([])
    setSelectedProject(null)
    setRepositories([])
    setSelectedRepo(null)
    setCommits([])
    setBranches([])
    setPullRequests([])
    setDeliveries([])
    setFlow(null)
    setRepositoryTokens({})
    setPlatformContextError(null)
    setSessionChecking(false)
    setAccessNotice(reason === 'manual' ? 'Sessão encerrada com segurança.' : 'Sua sessão expirou. Entre novamente para continuar.')
  }, [])

  const handleAuthenticated = useCallback((session: PlatformSession, rememberOnDevice: boolean) => {
    api.setAccessToken(session.accessToken)
    savePlatformSession(session, rememberOnDevice)
    setPlatformSession(session)
    setSessionChecking(false)
    setAccessNotice(null)
  }, [])

  useEffect(() => {
    if (!platformSession) {
      api.setAccessToken(null)
      return
    }

    api.setAccessToken(platformSession.accessToken)
    if (isSessionExpired(platformSession)) {
      handleLogout('expired')
      return
    }

    const expired = () => handleLogout('expired')
    const timeout = window.setTimeout(expired, Math.max(0, platformSession.expiresAt - Date.now()))
    window.addEventListener('platform-session-expired', expired)
    return () => {
      window.clearTimeout(timeout)
      window.removeEventListener('platform-session-expired', expired)
    }
  }, [handleLogout, platformSession])

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

  const loadProjectRepositories = useCallback(async (project: PlatformProject) => {
    setRepoDataError(null)
    try {
      const [cRes, repos] = await Promise.all([
        api.connectivity().catch(() => ({ status: 500, data: null as any })),
        api.repositories(project.id),
      ])

      if (cRes.status === 200) setConnectivity(cRes.data)
      setRepositories(repos)

      const routeState = parseWorkspaceState(window.location.search)
      const requestedRepoId = routeState.projectId === project.id ? routeState.repositoryId : null
      const active = repos.find((repository) => repository.id === requestedRepoId) || repos[0] || null
      setSelectedRepo(active)
      if (active) {
        await loadRepoCommitsAndDeliveries(active.id)
      } else {
        setCommits([])
        setBranches([])
        setPullRequests([])
        setDeliveries([])
        setFlow(null)
      }
    } catch (err) {
      console.error('Erro ao carregar repositórios do projeto:', err)
      setRepositories([])
      setSelectedRepo(null)
      if (err instanceof ApiError && err.status === 403) {
        setRepoDataError('Seu acesso a este projeto ou aos repositórios foi recusado. Atualize os projetos ou entre novamente.')
      } else {
        setRepoDataError('Não foi possível carregar os repositórios deste projeto. Tente novamente.')
      }
    }
  }, [loadRepoCommitsAndDeliveries])

  useEffect(() => {
    if (!platformSession) return
    let cancelled = false
    const loadPlatformContext = async () => {
      setPlatformContextLoading(true)
      setPlatformContextError(null)
      try {
        const page = await api.platformProjects()
        if (cancelled) return
        setProjects(page.items)
        const requestedProjectId = parseWorkspaceState(window.location.search).projectId
        const activeProject = page.items.find((project) => project.id === requestedProjectId) || page.items[0] || null
        setSelectedProject(activeProject)
      } catch (error) {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 401) {
          handleLogout('expired')
          return
        }
        setPlatformContextError('O serviço de projetos do Módulo 1 ainda está iniciando ou indisponível. Sua sessão continua válida; tente carregar os projetos novamente.')
      } finally {
        if (!cancelled) setPlatformContextLoading(false)
      }
    }
    void loadPlatformContext()
    return () => { cancelled = true }
    // A sessão só deve ser revalidada quando o token mudar, não após atualizar os dados do usuário.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [handleLogout, platformContextReload, platformSession?.accessToken])

  useEffect(() => {
    if (selectedProject) void loadProjectRepositories(selectedProject)
  }, [loadProjectRepositories, selectedProject])

  const handleRefreshRepositoryData = useCallback(() => {
    if (selectedRepo) void loadRepoCommitsAndDeliveries(selectedRepo.id)
  }, [loadRepoCommitsAndDeliveries, selectedRepo])

  useEffect(() => {
    if (viewMode !== 'workspace' || sessionChecking || !platformSession) return
    window.history.replaceState(null, '', buildWorkspaceUrl(activeTab, selectedProject?.id, selectedRepo?.id))
  }, [activeTab, platformSession, selectedProject, selectedRepo, sessionChecking, viewMode])

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

  if (viewMode === 'landing') {
    return <LandingPage onEnterWorkspace={handleSwitchToWorkspace} />
  }

  if (sessionChecking) {
    return (
      <main className="platform-access-page">
        <div className="platform-session-loading" role="status">Validando sua sessão…</div>
      </main>
    )
  }

  if (!platformSession) {
    return <PlatformAccess notice={accessNotice} onAuthenticated={handleAuthenticated} onBack={() => {
      window.history.pushState(null, '', '/')
      setViewMode('landing')
    }} />
  }

  return (
    <div className={`module-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <WorkspaceSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab)
          if (window.matchMedia('(max-width: 760px)').matches) setSidebarCollapsed(true)
        }}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((current) => !current)}
        user={platformSession.user}
        projectName={selectedProject?.name}
        onLogout={() => handleLogout('manual')}
      />

      {/* Área de Conteúdo Principal */}
      <main className="module-main">
        <WorkspaceHeader
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          repositories={repositories}
          projects={projects}
          selectedProject={selectedProject}
          selectedRepo={selectedRepo}
          onSelectProject={(project) => {
            setSelectedProject(project)
            setSelectedRepo(null)
          }}
          onSelectRepo={(r) => {
            setSelectedRepo(r)
            loadRepoCommitsAndDeliveries(r.id)
          }}
          onOpenConnectModal={() => setConnectModalOpen(true)}
          onOpenCreateProject={() => setCreateProjectModalOpen(true)}
          onSyncNow={handleSyncNow}
          syncing={syncing}
          connectivity={connectivity}
        />

        {platformContextLoading && projects.length === 0 && (
          <section className="platform-context-notice" role="status">
            <span className="context-loading-dot" />
            <div><strong>Carregando seus projetos em segundo plano</strong><p>Você já pode navegar pelo módulo enquanto o serviço compartilhado inicia.</p></div>
          </section>
        )}

        {platformContextError && (
          <section className="platform-context-notice is-warning" role="alert">
            <div><strong>Projetos temporariamente indisponíveis</strong><p>{platformContextError}</p></div>
            <button type="button" className="btn-module btn-module-secondary" onClick={() => setPlatformContextReload((value) => value + 1)}>Tentar novamente</button>
          </section>
        )}

        {!platformContextLoading && !platformContextError && !selectedProject && (
          <section className="project-empty-state">
            <div className="project-empty-icon">M1</div>
            <h2>Crie seu primeiro projeto</h2>
            <p>Os repositórios do GitHub precisam estar associados a um projeto oficial da plataforma.</p>
            <button type="button" className="btn-module btn-module-primary" onClick={() => setCreateProjectModalOpen(true)}>
              Criar projeto
            </button>
          </section>
        )}

        {selectedProject && repoDataError && !selectedRepo && (
          <section className="platform-context-notice is-warning" role="alert">
            <div><strong>Repositórios indisponíveis</strong><p>{repoDataError}</p></div>
            <button type="button" className="btn-module btn-module-secondary" onClick={() => void loadProjectRepositories(selectedProject)}>Tentar novamente</button>
          </section>
        )}

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
        {selectedProject && activeTab === 'overview' && (
          <OverviewTab
            selectedRepo={selectedRepo}
            commits={commits}
            connectivity={connectivity}
            flow={flow}
            onSyncNow={handleSyncNow}
            syncing={syncing}
          />
        )}

        {selectedProject && activeTab === 'auth' && (
          <AuthTab
            onTokenValidated={(token) => {
              if (selectedRepo) setRepositoryTokens((current) => ({ ...current, [selectedRepo.id]: token }))
            }}
          />
        )}

        {selectedProject && activeTab === 'webhooks' && (
          <WebhooksTab
            repository={selectedRepo}
            deliveries={deliveries}
            onRefreshData={handleRefreshRepositoryData}
          />
        )}

        {selectedProject && activeTab === 'sync' && (
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

        {selectedProject && activeTab === 'analytics' && <IntelligenceTab repository={selectedRepo} variant="analytics" />}

        {selectedProject && activeTab === 'ai' && <IntelligenceTab repository={selectedRepo} variant="ai" />}

        {selectedProject && activeTab === 'devops' && (
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
        projectId={selectedProject?.id || null}
        onClose={() => setConnectModalOpen(false)}
        onSuccess={handleRepoConnected}
      />
      <CreateProjectModal
        isOpen={createProjectModalOpen}
        onClose={() => setCreateProjectModalOpen(false)}
        onSuccess={(project) => {
          setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)])
          setSelectedProject(project)
        }}
      />
    </div>
  )
}
