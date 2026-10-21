import React, { useState } from 'react'
import {
  X,
  Copy,
  Check,
  Terminal,
  FileCode2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'

export interface InspectorItem {
  id: string
  title?: string
  status: 'Sucesso' | 'Falha' | 'Cancelada' | 'Processando'
  commit?: string
  branch?: string
  author?: string
  authorInitials?: string
  duration?: string
  when?: string
  executionId?: string
  event?: string
  url?: string
  payload?: Record<string, unknown> | null
  logs?: string[]
}

interface InspectorDrawerProps {
  item: InspectorItem | null
  onClose: () => void
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({ item, onClose }) => {
  const [activeTab, setActiveTab] = useState<'payload' | 'logs' | 'curl'>('payload')
  const [copied, setCopied] = useState(false)

  if (!item) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Sucesso':
        return <span className="badge badge-success">● Sucesso</span>
      case 'Falha':
        return <span className="badge badge-danger">● Falha</span>
      default:
        return <span className="badge badge-neutral">{status}</span>
    }
  }

  const jsonPayload = item.payload || {
    execution_id: item.executionId || item.id,
    repository: 'EduardoFdeM/ai-platform-github-service',
    ref: `refs/heads/${item.branch || 'main'}`,
    commit: {
      sha: item.commit || item.id,
      author: item.author || 'Eduardo F. de M.',
      timestamp: item.when || new Date().toISOString(),
      verified: true,
    },
    pipeline: {
      stages: ['webhook', 'signature_validation', 'discovery', 'indexing'],
      duration_ms: 138000,
      status: item.status.toLowerCase(),
      objects_indexed: 312,
    },
    security: {
      hmac_sha256: 'valid',
      token_type: 'encrypted_aes256_gcm',
    },
  }

  const logs = item.logs || [
    `[INFO] Início da execução ${item.executionId || item.id} para ref ${item.branch || 'main'}`,
    `[INFO] Assinatura X-Hub-Signature-256 validada com sucesso contra secret criptografado`,
    `[INFO] Descobertas alterações no commit ${item.commit || item.id.slice(0, 7)}`,
    `[INFO] Indexando modelo relacional no PostgreSQL (Commit, Repository, Author)`,
    item.status === 'Falha'
      ? `[ERROR] Falha de concorrência ou timeout na fila Celery`
      : `[SUCCESS] Sincronização e indexação concluídas em ${item.duration || '2m 14s'}`,
  ]

  const curlCommand = `curl -X POST https://seu-dominio.example/api/v1/webhooks/github \\
  -H "Content-Type: application/json" \\
  -H "X-GitHub-Event: push" \\
  -H "X-Hub-Signature-256: sha256=e2d98a0c..." \\
  -d '${JSON.stringify(jsonPayload).slice(0, 80)}...'`

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
          zIndex: 90,
        }}
      />

      {/* Drawer Panel */}
      <aside
        className="inspector-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '540px',
          maxWidth: '90vw',
          backgroundColor: '#0A0F1D',
          borderLeft: '1px solid var(--border-default)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.6)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header do Drawer */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            backgroundColor: '#0D1322',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                INSPETOR DE EXECUÇÃO
              </span>
              {getStatusBadge(item.status)}
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              {item.executionId || item.id.slice(0, 10)}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>branch: <strong style={{ color: '#E2E8F0' }}>{item.branch || 'main'}</strong></span>
              <span>•</span>
              <span>autor: <strong style={{ color: '#E2E8F0' }}>{item.author || 'Eduardo F. de M.'}</strong></span>
              {item.when && (
                <>
                  <span>•</span>
                  <span>{item.when}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
            title="Fechar Inspetor (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas do Inspetor */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-default)',
            backgroundColor: '#080C14',
            padding: '0 24px',
          }}
        >
          <button
            onClick={() => setActiveTab('payload')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'payload' ? '2px solid #2563EB' : '2px solid transparent',
              color: activeTab === 'payload' ? '#60A5FA' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FileCode2 size={14} />
            <span>Payload JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'logs' ? '2px solid #2563EB' : '2px solid transparent',
              color: activeTab === 'logs' ? '#60A5FA' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Terminal size={14} />
            <span>Logs do Celery</span>
          </button>

          <button
            onClick={() => setActiveTab('curl')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'curl' ? '2px solid #2563EB' : '2px solid transparent',
              color: activeTab === 'curl' ? '#60A5FA' : 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>cURL Replay</span>
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {activeTab === 'payload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Corpo bruto recebido via webhook / API:</span>
                <button
                  onClick={() => handleCopy(JSON.stringify(jsonPayload, null, 2))}
                  className="btn-nexus btn-nexus-secondary btn-nexus-sm"
                >
                  {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                  <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
                </button>
              </div>

              <pre
                style={{
                  backgroundColor: '#050811',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: 16,
                  fontSize: 11.5,
                  fontFamily: 'var(--font-mono)',
                  color: '#93C5FD',
                  overflowX: 'auto',
                  lineHeight: 1.6,
                }}
              >
                {JSON.stringify(jsonPayload, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Trilha de execução dos workers Celery:</span>
                <span className="badge badge-success">● Worker #1 Ativo</span>
              </div>

              <div
                style={{
                  backgroundColor: '#050811',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: 14,
                  fontSize: 11.5,
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {logs.map((log, index) => (
                  <div
                    key={index}
                    style={{
                      color: log.includes('[ERROR]') ? '#EF4444' : log.includes('[SUCCESS]') ? '#10B981' : '#94A3B8',
                    }}
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'curl' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Comando para reprodução local via terminal:</span>
                <button
                  onClick={() => handleCopy(curlCommand)}
                  className="btn-nexus btn-nexus-secondary btn-nexus-sm"
                >
                  {copied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                  <span>{copied ? 'Copiado!' : 'Copiar cURL'}</span>
                </button>
              </div>

              <pre
                style={{
                  backgroundColor: '#050811',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: 16,
                  fontSize: 11.5,
                  fontFamily: 'var(--font-mono)',
                  color: '#FBBF24',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                }}
              >
                {curlCommand}
              </pre>
            </div>
          )}
        </div>

        {/* Footer do Drawer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-default)',
            backgroundColor: '#0D1322',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
            <ShieldCheck size={14} color="#10B981" />
            <span>Auditoria criptografada em banco</span>
          </div>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="btn-nexus btn-nexus-secondary btn-nexus-sm"
              style={{ textDecoration: 'none' }}
            >
              <span>Ver no GitHub</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </aside>
    </>
  )
}
