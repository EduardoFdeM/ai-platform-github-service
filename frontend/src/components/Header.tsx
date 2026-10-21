import React from 'react'
import {
  GitBranch,
  RefreshCw,
  Plus,
  SlidersHorizontal,
  FolderGit2,
  Lock,
  Radio,
  BarChart3,
  Bot,
  Rocket,
} from 'lucide-react'
import type { ConnectivityStatus, Repository } from '../api'

export type TabId = 'overview' | 'auth' | 'webhooks' | 'sync' | 'analytics' | 'ai' | 'devops'

interface HeaderProps {
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  repositories: Repository[]
  selectedRepo: Repository | null
  onSelectRepo: (repo: Repository) => void
  onOpenConnectModal: () => void
  onSyncNow: () => void
  syncing: boolean
  connectivity: ConnectivityStatus | null
  onSwitchToLegacy?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  repositories,
  selectedRepo,
  onSelectRepo,
  onOpenConnectModal,
  onSyncNow,
  syncing,
  connectivity,
  onSwitchToLegacy,
}) => {
  // Analytics avançado, IA e DevOps vieram da ideação/Figma. Permanecem
  // implementados para demonstração, mas ficam fora da navegação padrão até
  // que as respectivas USs e contratos de backend sejam aceitos.
  const showIdeationTabs = import.meta.env.VITE_SHOW_IDEATION_TABS === 'true'

  // Breadcrumb e Título baseados na tela ativa
  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'overview':
        return {
          breadcrumb: 'Integrações',
          title: 'Integração e Sincronização com GitHub',
        }
      case 'auth':
        return {
          breadcrumb: 'Integrações',
          title: 'Conectividade e Autenticação GitHub',
        }
      case 'webhooks':
        return {
          breadcrumb: 'Integrações',
          title: 'Monitor de Webhooks e Eventos Git em Tempo Real',
        }
      case 'sync':
        return {
          breadcrumb: 'Integrações',
          title: 'Indexação e Sincronização do Repositório',
        }
      case 'analytics':
        return {
          breadcrumb: 'Analytics',
          title: 'Analytics de Fluxo e Diagnóstico de Gargalos',
        }
      case 'ai':
        return {
          breadcrumb: 'Inteligência assistiva',
          title: 'Central de Inteligência Artificial e Assistente Git',
        }
      case 'devops':
        return {
          breadcrumb: 'Release engineering',
          title: 'DevOps, Qualidade e Governança da Release',
        }
    }
  }

  const { breadcrumb, title } = getHeaderMeta()

  return (
    <header className="nexus-header">
      {/* Linha Superior com Título e Ações */}
      <div className="header-row-primary">
        <div className="header-title-box">
          <div className="header-breadcrumb">
            MÓDULO 2 <span>/</span> {breadcrumb}
          </div>
          <h1 className="header-h1">{title}</h1>
        </div>

        <div className="header-controls">
          {/* Seletor de Repositório Conectado */}
          <div className="select-chip" title="Selecionar Repositório">
            <FolderGit2 size={13} style={{ color: '#60A5FA' }} />
            <span>repo:</span>
            <select
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'var(--font-mono)',
              }}
              value={selectedRepo?.id || ''}
              onChange={(e) => {
                const found = repositories.find((r) => r.id === Number(e.target.value))
                if (found) onSelectRepo(found)
              }}
            >
              {repositories.length === 0 && <option value="">Nenhum repo conectado</option>}
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id} style={{ background: '#0D1322' }}>
                  {repo.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Branch */}
          <div className="select-chip" title="Branch Principal">
            <GitBranch size={13} style={{ color: 'var(--text-tertiary)' }} />
            <span>branch:</span>
            <strong>{selectedRepo?.default_branch || 'main'}</strong>
          </div>

          {/* Badge de Conectividade GitHub */}
          <div
            className={`status-pill ${
              connectivity?.status === 'up' ? 'status-pill-success' : 'status-pill-danger'
            }`}
            title={`Latência: ${connectivity?.latency_ms ?? '--'}ms`}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: connectivity?.status === 'up' ? '#10B981' : '#EF4444',
                boxShadow: connectivity?.status === 'up' ? '0 0 6px #10B981' : 'none',
              }}
            />
            <span>{connectivity?.status === 'up' ? 'GitHub conectado' : 'GitHub desconectado'}</span>
          </div>

          {/* Botão Conectar Repositório (abre modal via Link GitHub) */}
          <button
            onClick={onOpenConnectModal}
            className="btn-nexus btn-nexus-secondary"
            title="Conectar novo repositório colando a URL do GitHub"
          >
            <Plus size={13} />
            <span>+ Conectar Repo</span>
          </button>

          {/* Botão Configurar */}
          <button
            onClick={() => onSelectTab('auth')}
            className="btn-nexus btn-nexus-secondary"
            title="Configurações e Credenciais"
          >
            <SlidersHorizontal size={13} />
            <span>Configurar</span>
          </button>

          {/* Botão Sincronizar Agora */}
          <button
            onClick={onSyncNow}
            disabled={syncing || !selectedRepo}
            className="btn-nexus btn-nexus-primary"
            title="Sincronizar commits diretamente da API do GitHub"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar agora'}</span>
          </button>

          {onSwitchToLegacy && (
            <button
              onClick={onSwitchToLegacy}
              className="btn-nexus btn-nexus-secondary"
              style={{
                borderColor: '#3B82F6',
                color: '#93C5FD',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
              }}
              title="Abrir versão anterior do dashboard para demonstração e gravação"
            >
              <span>🎥 Versão Anterior (Demo)</span>
            </button>
          )}
        </div>
      </div>

      {/* Navegação pelas áreas previstas nas POCs. IA e DevOps permanecem como prévias até haver contrato de backend. */}
      <nav className="nexus-tabs-bar" aria-label="Navegação do Módulo 2">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => onSelectTab('overview')}
        >
          <FolderGit2 size={13} />
          <span>Visão Geral</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'auth' ? 'active' : ''}`}
          onClick={() => onSelectTab('auth')}
        >
          <Lock size={13} />
          <span>Conectividade & Autenticação</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'webhooks' ? 'active' : ''}`}
          onClick={() => onSelectTab('webhooks')}
        >
          <Radio size={13} />
          <span>Monitor de Webhooks</span>
        </button>

        <button
          className={`tab-btn ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={() => onSelectTab('sync')}
        >
          <RefreshCw size={13} />
          <span>Indexação & Contribuintes</span>
        </button>

        {showIdeationTabs && (
          <>
            <button
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => onSelectTab('analytics')}
              title="Ideação: métricas avançadas ainda não têm contrato próprio"
            >
              <BarChart3 size={13} />
              <span>Analytics · ideação</span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
              onClick={() => onSelectTab('ai')}
              title="Ideação: backend de IA ainda não está disponível neste módulo"
            >
              <Bot size={13} />
              <span>Assistente IA · ideação</span>
            </button>

            <button
              className={`tab-btn ${activeTab === 'devops' ? 'active' : ''}`}
              onClick={() => onSelectTab('devops')}
              title="Ideação: não há consulta de release/deploy neste módulo"
            >
              <Rocket size={13} />
              <span>DevOps & Release · ideação</span>
            </button>
          </>
        )}
      </nav>
    </header>
  )
}
