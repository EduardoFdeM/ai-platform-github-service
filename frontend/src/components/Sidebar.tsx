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
  return (
    <aside className="nexus-sidebar">
      <div className="sidebar-top">
        {/* Identificação do módulo. */}
        <div className="nexus-brand">
          <div className="nexus-logo-icon">M2</div>
          <div className="nexus-logo-text">
            <span className="nexus-brand-name">GitHub Sync</span>
            <span className="nexus-brand-sub">MÓDULO 2</span>
          </div>
        </div>

        {/* Seletor de Contexto / Workspace */}
        <div className="workspace-selector" title="Alternar Organização ou Curso">
          <span className="workspace-badge">UF</span>
          <span className="workspace-name">UFTech + Arquitetura</span>
          <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
        </div>

        {/* Seção VISÃO GERAL */}
        <div className="nav-group">
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
        </div>

        {/* Seção MÓDULOS */}
        <div className="nav-group">
          <span className="nav-group-title">MÓDULOS</span>
          <div className="nav-item">
            <Compass size={15} />
            <span>1. Descoberta</span>
          </div>

          {/* ITEM ATIVO: MÓDULO 2 GITHUB */}
          <div className="nav-item active">
            <GitBranch size={15} />
            <span>2. Integração GitHub</span>
          </div>

          <div className="nav-item">
            <ShieldCheck size={15} />
            <span>3. Qualidade</span>
          </div>
          <div className="nav-item">
            <Activity size={15} />
            <span>4. Observabilidade</span>
          </div>
          <div className="nav-item">
            <Brain size={15} />
            <span>5. Insights acadêmicos</span>
          </div>
        </div>

        {/* Seção ADMINISTRAÇÃO */}
        <div className="nav-group">
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
        </div>
      </div>

      {/* Rodapé da Sidebar */}
      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="status-dot-green" />
          <span>Todos os sistemas operacionais</span>
        </div>

        <div className="user-profile-strip">
          <div className="user-avatar-circle">MC</div>
          <div className="user-meta">
            <span className="user-meta-name">Perfil de demonstração</span>
            <span className="user-meta-role">Contexto acadêmico</span>
          </div>
          <span className="badge badge-info" title="Perfil de demonstração">Demo</span>
        </div>
      </div>
    </aside>
  )
}
