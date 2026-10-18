import { useEffect, useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Header, type TabId } from './components/Header'
import { ConnectRepoModal } from './components/ConnectRepoModal'
import { OverviewTab } from './components/tabs/OverviewTab'
import { AuthTab } from './components/tabs/AuthTab'
import { WebhooksTab } from './components/tabs/WebhooksTab'
import { SyncTab } from './components/tabs/SyncTab'
import { AnalyticsTab } from './components/tabs/AnalyticsTab'
import { AiTab } from './components/tabs/AiTab'
import { DevOpsTab } from './components/tabs/DevOpsTab'
import LegacyDashboard from './components/legacy/LegacyDashboard'
import {
  api,
  type Commit,
  type ConnectivityStatus,
  type Delivery,
  type FlowMetrics,
  type Repository,
} from './api'

export default function App() {
  // Modo de exibição: 'legacy' (dashboard clássico MVP por padrão) ou 'nexus' (novo design)
  const [viewMode, setViewMode] = useState<'nexus' | 'legacy'>(() => {
    if (typeof window !== 'undefined') {
      const isNexus =
        window.location.pathname.startsWith('/nexus') ||
        window.location.search.includes('nexus=true') ||
        window.location.hash === '#nexus'
      return isNexus ? 'nexus' : 'legacy'
    }
    return 'legacy'
  })

  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [connectModalOpen, setConnectModalOpen] = useState(false)

  // Estados Globais de Repositórios e Backend
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [commits, setCommits] = useState<Commit[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [flow, setFlow] = useState<FlowMetrics | null>(null)
  const [connectivity, setConnectivity] = useState<ConnectivityStatus | null>(null)

  // Status de Sincronização
  const [syncing, setSyncing] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)

  // Sincroniza a rota ao usar os botões voltar/avançar do navegador
  useEffect(() => {
    const handlePopState = () => {
      const isNexus =
        window.location.pathname.startsWith('/nexus') ||
        window.location.search.includes('nexus=true') ||
        window.location.hash === '#nexus'
      setViewMode(isNexus ? 'nexus' : 'legacy')
    }
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [])

  const handleSwitchToLegacy = () => {
    window.history.pushState(null, '', '/')
    setViewMode('legacy')
  }

  const handleSwitchToNexus = () => {
    window.history.pushState(null, '', '/nexus')
    setViewMode('nexus')
  }

  // Carregar dados iniciais da API Django
  const loadInitialData = async () => {
    try {
      const [cRes, repos] = await Promise.all([
        api.connectivity().catch(() => ({ status: 500, data: null as any })),
        api.repositories().catch(() => []),
      ])

      if (cRes.status === 200) setConnectivity(cRes.data)
      setRepositories(repos)

      const active = repos[0] || null
      if (active) {
        setSelectedRepo(active)
        await loadRepoCommitsAndDeliveries(active.id)
      }
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err)
    }
  }

  const loadRepoCommitsAndDeliveries = async (repoId: number) => {
    try {
      const [commitsRes, delivRes, flowRes] = await Promise.all([
        api.commits(repoId).catch(() => ({ count: 0, next: null, previous: null, results: [] })),
        api.deliveries(repoId).catch(() => []),
        api.flow(repoId).catch(() => null),
      ])
      setCommits(commitsRes.results)
      setDeliveries(delivRes)
      setFlow(flowRes)
    } catch (err) {
      console.error('Erro ao carregar dados do repositório:', err)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Disparo manual de sincronização real via GitHub API
  const handleSyncNow = async () => {
    if (!selectedRepo) return
    setSyncing(true)
    setSyncFeedback('Sincronizando com a API do GitHub...')
    try {
      const { status, data } = await api.syncRepository(selectedRepo.id)
      if (status === 200) {
        setSyncFeedback(`Sincronização concluída! ${data.commits_synced} commits atualizados.`)
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
  const handleRepoConnected = async (newRepo: Repository) => {
    setRepositories((prev) => {
      const existing = prev.filter((r) => r.id !== newRepo.id)
      return [newRepo, ...existing]
    })
    setSelectedRepo(newRepo)
    await loadRepoCommitsAndDeliveries(newRepo.id)
  }

  // Se o usuário estiver no modo clássico para gravação ou na porta 5174 / rota /legacy:
  if (viewMode === 'legacy') {
    return <LegacyDashboard onSwitchToNexus={handleSwitchToNexus} />
  }

  return (
    <div className="nexus-layout">
      {/* Sidebar Lateral Nexus Dark (Fixa e acompanha a viewport) */}
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

        {activeTab === 'auth' && <AuthTab />}

        {activeTab === 'webhooks' && (
          <WebhooksTab
            repository={selectedRepo}
            deliveries={deliveries}
            onRefreshData={() => {
              if (selectedRepo) loadRepoCommitsAndDeliveries(selectedRepo.id)
            }}
          />
        )}

        {activeTab === 'sync' && (
          <SyncTab
            repository={selectedRepo}
            commits={commits}
            flow={flow}
            onSyncNow={handleSyncNow}
            syncing={syncing}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            repository={selectedRepo}
            commits={commits}
            flow={flow}
          />
        )}

        {activeTab === 'ai' && <AiTab />}

        {activeTab === 'devops' && <DevOpsTab />}
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
