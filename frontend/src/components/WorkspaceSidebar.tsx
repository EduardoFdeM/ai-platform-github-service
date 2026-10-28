import React from 'react'
import { Activity, BarChart3, Bot, ChevronLeft, ChevronRight, FileText, FolderGit2, LogOut, Menu, Radio, RefreshCw, ShieldCheck } from 'lucide-react'
import type { PlatformUser } from '../platformSession'
import type { TabId } from './Header'

interface WorkspaceSidebarProps {
  activeTab: TabId
  onSelectTab: (tab: TabId) => void
  collapsed: boolean
  onToggle: () => void
  user: PlatformUser
  projectName?: string
  onLogout: () => void
}

const navigation: { id: TabId; label: string; icon: React.ElementType; comingSoon?: boolean }[] = [
  { id: 'overview', label: 'Visão geral', icon: FolderGit2 },
  { id: 'auth', label: 'Conectividade e autenticação', icon: ShieldCheck },
  { id: 'webhooks', label: 'Monitor de webhooks', icon: Radio },
  { id: 'sync', label: 'Indexação e contribuintes', icon: RefreshCw },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'ai', label: 'Inteligência Git', icon: Bot },
  { id: 'devops', label: 'DevOps e documentação', icon: FileText, comingSoon: true },
]

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ activeTab, onSelectTab, collapsed, onToggle, user, projectName, onLogout }) => (
  <aside className={`module-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
    <div className="sidebar-top">
      <div className="sidebar-brand-row">
        <div className="module-brand">
          <div className="module-logo-icon">M2</div>
          <div className="module-logo-text"><span className="module-brand-name">GitHub Sync</span><span className="module-brand-sub">MÓDULO 2</span></div>
        </div>
        <button type="button" className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} title={collapsed ? 'Expandir menu' : 'Recolher menu'}>
          <span className="desktop-toggle-icon">{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</span>
          <Menu className="mobile-toggle-icon" size={18} />
        </button>
      </div>

      <div className="workspace-selector is-static" title={projectName || 'Nenhum projeto selecionado'}>
        <span className="workspace-badge">M2</span><span className="workspace-name">{projectName || 'Selecione um projeto'}</span>
      </div>

      <nav className="sidebar-navigation" aria-label="Navegação do Módulo 2">
        <span className="nav-group-title">NAVEGAÇÃO</span>
        {navigation.map(({ id, label, icon: Icon, comingSoon }) => (
          <button
            type="button"
            key={id}
            className={`nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => onSelectTab(id)}
            title={collapsed ? label : undefined}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon size={17} /><span className="nav-item-label">{label}</span>{comingSoon && <span className="nav-status-badge">em breve</span>}
          </button>
        ))}
      </nav>
    </div>

    <div className="sidebar-footer">
      <div className="system-status-indicator" title="Interface do módulo disponível"><Activity size={14} /><span>Interface disponível</span></div>
      <div className="user-profile-strip" title={`${user.display_name} · ${user.email}`}>
        <div className="user-avatar-circle">{user.display_name?.slice(0, 2).toUpperCase() || 'M2'}</div>
        <div className="user-meta"><span className="user-meta-name">{user.display_name}</span><span className="user-meta-role">{user.email}</span></div>
        <button type="button" className="sidebar-logout" onClick={onLogout} aria-label="Sair da plataforma" title="Sair da plataforma"><LogOut size={16} /></button>
      </div>
    </div>
  </aside>
)
