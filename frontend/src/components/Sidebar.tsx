import React from 'react'
import {
  LayoutDashboard,
  FolderGit2,
  Layers,
  Compass,
  GitBranch,
  ShieldCheck,
  Activity,
  Brain,
  Users,
  Settings,
  FileText,
  ChevronDown,
} from 'lucide-react'

interface SidebarProps {
  activeModule?: string
}

export const Sidebar: React.FC<SidebarProps> = () => {
  // O shell completo da plataforma pertence à integração entre os grupos.
  // Mantemos a estrutura pronta, mas escondida por padrão enquanto os demais
  // módulos não publicarem rotas/contratos navegáveis.
  const showPlatformShell = import.meta.env.VITE_SHOW_PLATFORM_SHELL === 'true'

  return (
    <aside className="module-sidebar">
      <div className="sidebar-top">
        {/* Identificação do módulo. */}
        <div className="module-brand">
          <div className="module-logo-icon">M2</div>
          <div className="module-logo-text">
            <span className="module-brand-name">GitHub Sync</span>
            <span className="module-brand-sub">MÓDULO 2</span>
          </div>
        </div>

        {/* Seletor de Contexto / Workspace */}
        <div className="workspace-selector" title="Contexto acadêmico do módulo">
          <span className="workspace-badge">M2</span>
          <span className="workspace-name">Plataforma acadêmica</span>
          {showPlatformShell && <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />}
        </div>

        {/* Seção VISÃO GERAL */}
        {showPlatformShell && <div className="nav-group">
          <span className="nav-group-title">VISÃO GERAL</span>
          <div className="nav-item">
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </div>
          <div className="nav-item">
            <FolderGit2 size={15} />
            <span>Projetos</span>
            <span className="nav-item-badge">12</span>
          </div>
          <div className="nav-item">
            <Layers size={15} />
            <span>Catálogo de serviços</span>
          </div>
        </div>}

        {/* Seção MÓDULOS */}
        <div className="nav-group">
          <span className="nav-group-title">MÓDULOS</span>
          {showPlatformShell && <div className="nav-item">
            <Compass size={15} />
            <span>1. Autenticação & Backlog</span>
          </div>}

          {/* ITEM ATIVO: MÓDULO 2 GITHUB */}
          <div className="nav-item active">
            <GitBranch size={15} />
            <span>2. Integração GitHub</span>
          </div>

          {showPlatformShell && <>
            <div className="nav-item">
              <ShieldCheck size={15} />
              <span>3. Artefatos</span>
            </div>
            <div className="nav-item">
              <Activity size={15} />
              <span>4. Code Review</span>
            </div>
            <div className="nav-item">
              <Brain size={15} />
              <span>5–8. Serviços da plataforma</span>
            </div>
          </>}
        </div>

        {/* Seção ADMINISTRAÇÃO */}
        {showPlatformShell && <div className="nav-group">
          <span className="nav-group-title">ADMINISTRAÇÃO</span>
          <div className="nav-item">
            <Users size={15} />
            <span>Equipe e acesso</span>
          </div>
          <div className="nav-item">
            <Settings size={15} />
            <span>Configurações</span>
          </div>
          <div className="nav-item">
            <FileText size={15} />
            <span>Auditoria</span>
          </div>
        </div>}
      </div>

      {/* Rodapé da Sidebar */}
      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="status-dot-green" />
          <span>Interface do módulo disponível</span>
        </div>

        <div className="user-profile-strip">
          <div className="user-avatar-circle">M2</div>
          <div className="user-meta">
            <span className="user-meta-name">Sessão local do módulo</span>
            <span className="user-meta-role">Login integrado em breve</span>
          </div>
          <span className="badge badge-info" title="Autenticação será fornecida pelo módulo responsável">Em breve</span>
        </div>
      </div>
    </aside>
  )
}
