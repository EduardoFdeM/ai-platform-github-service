import React, { useState } from 'react'
import {
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Download,
  Lock,
  Check,
  X,
  Layers,
} from 'lucide-react'
import { api, type HandshakeResult } from '../../api'

interface AuthTabProps {
  onHandshakeSuccess?: (res: HandshakeResult) => void
}

export const AuthTab: React.FC<AuthTabProps> = ({ onHandshakeSuccess }) => {
  const [tokenType, setTokenType] = useState<'pat' | 'app'>('pat')
  const [token, setToken] = useState('ghp_LiveMockedVaultToken_7K9Q')
  const [showToken, setShowToken] = useState(false)
  const [customBaseUrl, setCustomBaseUrl] = useState('https://github.enterprise.local/api/v3')
  const [env, setEnv] = useState('Produção local')
  const [loading, setLoading] = useState(false)
  const [handshakeResult, setHandshakeResult] = useState<HandshakeResult | null>({
    valid: true,
    login: 'EduardoFdeM',
    name: 'Eduardo Ferreira de Mattos',
    scopes: ['repo:status', 'read:org'],
  })
  const [error, setError] = useState<string | null>(null)

  const handleTestHandshake = async () => {
    if (!token.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { status, data } = await api.handshake(token.trim())
      if (status === 200 && data.valid) {
        setHandshakeResult(data)
        if (onHandshakeSuccess) onHandshakeSuccess(data)
      } else {
        setError(data.detail || `Falha na autenticação (HTTP ${status})`)
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar à API do GitHub')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="view-container">
      {/* Sub-header da Tela 08 */}
      <div className="section-intro-bar">
        <div>
          <h2 className="section-intro-title">Conectividade e autenticação</h2>
          <p className="section-intro-desc">
            Gerencie credenciais, valide permissões mínimas e acompanhe a trilha de acesso ao repositório ativo.
          </p>
        </div>
        <div className="badge badge-success" style={{ fontSize: 11, padding: '4px 10px' }}>
          ● Autenticação saudável
        </div>
      </div>

      {/* Banner: Postura de acesso dentro da política */}
      <div
        style={{
          backgroundColor: '#0D1322',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
              Postura de acesso dentro da política
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>
              Handshake concluído para {handshakeResult?.login || 'usuário autenticado'}, segredo protegido e nenhum escopo administrativo detectado.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 11 }}>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: 10 }}>MÉTODO</span>
            <strong style={{ color: '#FFFFFF' }}>PAT gerenciado</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: 10 }}>PRÓXIMA ROTAÇÃO</span>
            <strong style={{ color: '#FBBF24' }}>em 17 dias</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: 10 }}>POLÍTICA</span>
            <strong style={{ color: '#34D399' }}>Conforme</strong>
          </div>
        </div>
      </div>

      {/* Grid Principal (2 Colunas) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        {/* Coluna Esquerda: Gestão de Credenciais e PAT */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div className="nexus-card-title">
              <KeyRound size={15} style={{ color: '#60A5FA' }} />
              <span>Gestão de Credenciais e PAT</span>
            </div>
            <span className="badge badge-success" style={{ fontSize: 10 }}>
              <Lock size={10} style={{ marginRight: 3 }} />
              Criptografado via AES-256-GCM
            </span>
          </div>

          <p className="nexus-card-subtitle" style={{ marginTop: -8 }}>
            Configure a credencial usada nas chamadas autenticadas à API do GitHub. O segredo nunca é exibido após o salvamento.
          </p>

          {/* Abas PAT vs GitHub App */}
          <div style={{ display: 'flex', gap: 6, backgroundColor: '#0A0F1D', padding: 4, borderRadius: 6 }}>
            <button
              onClick={() => setTokenType('pat')}
              style={{
                flex: 1,
                padding: '6px 10px',
                border: 'none',
                borderRadius: 4,
                backgroundColor: tokenType === 'pat' ? '#1E293B' : 'transparent',
                color: tokenType === 'pat' ? '#FFFFFF' : 'var(--text-tertiary)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <KeyRound size={12} />
              <span>Personal Access Token (PAT)</span>
            </button>
            <button
              onClick={() => setTokenType('app')}
              style={{
                flex: 1,
                padding: '6px 10px',
                border: 'none',
                borderRadius: 4,
                backgroundColor: tokenType === 'app' ? '#1E293B' : 'transparent',
                color: tokenType === 'app' ? '#FFFFFF' : 'var(--text-tertiary)',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Layers size={12} />
              <span>GitHub App Installation Token</span>
            </button>
          </div>

          {/* Campo de Token */}
          <div>
            <label className="form-label">PERSONAL ACCESS TOKEN (PAT) OU INSTALLATION TOKEN</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showToken ? 'text' : 'password'}
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)', paddingRight: 36 }}
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  cursor: 'pointer',
                }}
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="form-help">
              Armazenado em cofre isolado. A credencial será validada sem ser registrada em logs ou telemetria.
            </p>
          </div>

          {/* Custom Base URL & Ambiente */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label">CUSTOM BASE URL</label>
              <input
                type="text"
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)' }}
                value={customBaseUrl}
                onChange={(e) => setCustomBaseUrl(e.target.value)}
              />
              <span className="form-help">GitHub Enterprise Server local + certificado TLS verificado</span>
            </div>

            <div>
              <label className="form-label">AMBIENTE</label>
              <select
                className="form-input"
                value={env}
                onChange={(e) => setEnv(e.target.value)}
                style={{ cursor: 'pointer' }}
              >
                <option value="Produção local">Produção local</option>
                <option value="Staging">Staging</option>
                <option value="Desenvolvimento">Desenvolvimento</option>
              </select>
            </div>
          </div>

          {/* Status TLS e Última Rotação */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#0A0F1D',
              padding: '10px 12px',
              borderRadius: 6,
              fontSize: 11.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} style={{ color: '#10B981' }} />
              <span style={{ color: 'var(--text-main)' }}>TLS e cadeia de confiança</span>
              <span className="badge badge-success">válido</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-tertiary)' }}>
              <span>Última rotação</span>
              <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>30 set • 09:12</strong>
            </div>
          </div>

          {/* Alerta de Rotação Obrigatória */}
          <div
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 6,
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 11,
              color: '#FDE68A',
            }}
          >
            <span>Rotação automática obrigatória a cada 90 dias.</span>
            <strong style={{ color: '#FBBF24' }}>vence em 19 out 2026</strong>
          </div>

          {/* Metadados e Botão de Ação */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 18, fontSize: 10.5, color: 'var(--text-tertiary)' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-dim)' }}>ORIGEM</span>
                <span style={{ color: 'var(--text-main)' }}>Cofre Nexus • Produção</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-dim)' }}>RESPONSÁVEL</span>
                <span style={{ color: 'var(--text-main)' }}>Marina Costa</span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-dim)' }}>USO MAIS RECENTE</span>
                <span style={{ color: 'var(--text-main)' }}>02 out • 14:31 BRT</span>
              </div>
            </div>

            <button
              onClick={handleTestHandshake}
              disabled={loading || !token.trim()}
              className="btn-nexus btn-nexus-primary"
            >
              <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Validando...' : 'Testar Handshake e Salvar'}</span>
            </button>
          </div>

          {error && (
            <div style={{ color: '#EF4444', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={13} /> {error}
            </div>
          )}
        </div>

        {/* Coluna Direita: Inspeção de Permissões */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div className="nexus-card-title">
              <ShieldCheck size={15} style={{ color: '#34D399' }} />
              <span>Inspeção de Permissões</span>
            </div>
            <span className="badge badge-success">● Conforme</span>
          </div>

          <p className="nexus-card-subtitle" style={{ marginTop: -8 }}>
            Escopos efetivos devolvidos pelo GitHub na última validação autenticada.
          </p>

          {/* Box de Scopes Retornados */}
          <div className="code-box-dark">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 10.5 }}>
              <span style={{ color: '#93C5FD', fontWeight: 600 }}>X-OAuth-Scopes</span>
              <span style={{ color: 'var(--text-tertiary)' }}>HEAD /user • 14:31:52 BRT</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <span className="badge badge-info">[x] repo:status</span>
              <span className="badge badge-info">[x] read:org</span>
            </div>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 10.5 }}>
              x-oauth-scopes: repo:status, read:org
            </div>
          </div>

          {/* Least Privilege Box */}
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 6,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34D399', fontWeight: 600, fontSize: 11.5 }}>
              <CheckCircle2 size={13} />
              <span>Least Privilege atendido</span>
            </div>
            <p style={{ fontSize: 11, color: '#A7F3D0', lineHeight: 1.4 }}>
              A credencial possui somente leitura organizacional e escrita limitada a status de commits.
            </p>
          </div>

          {/* Checklist de Permissões */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={14} style={{ color: '#10B981' }} />
                <span>Publicar status de commit</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>repo:status</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={14} style={{ color: '#10B981' }} />
                <span>Ler metadados da organização</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#38BDF8' }}>read:org</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)' }}>
                <X size={14} style={{ color: 'var(--text-dim)' }} />
                <span>Conteúdo do repositório</span>
              </div>
              <span style={{ color: 'var(--text-dim)' }}>não concedido</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)' }}>
                <X size={14} style={{ color: 'var(--text-dim)' }} />
                <span>Administração e webhooks</span>
              </div>
              <span style={{ color: 'var(--text-dim)' }}>não concedido</span>
            </div>
          </div>

          {/* Footer com Fingerprint */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-default)',
              paddingTop: 12,
              marginTop: 6,
            }}
          >
            <div>
              <span style={{ color: 'var(--text-dim)', fontSize: 10, display: 'block' }}>FINGERPRINT</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                pat_8f3s••••c92e
              </span>
            </div>
            <button onClick={handleTestHandshake} className="btn-nexus btn-nexus-secondary btn-nexus-sm">
              <RotateCw size={11} />
              <span>Reinspecionar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Auditoria de Acesso (Tabela Inferior) */}
      <div className="nexus-card">
        <div className="nexus-card-header">
          <div>
            <div className="nexus-card-title">Auditoria de Acesso</div>
            <div className="nexus-card-subtitle">
              Histórico imutável de rotação de credenciais e validações de conectividade.
            </div>
          </div>
          <button className="btn-nexus btn-nexus-secondary btn-nexus-sm">
            <Download size={12} />
            <span>Exportar CSV</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="nexus-table">
            <thead>
              <tr>
                <th>DATA/HORA</th>
                <th>USUÁRIO RESPONSÁVEL</th>
                <th>STATUS DA VALIDAÇÃO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>02 out 2026 • 14:31:52</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10.5, display: 'block' }}>há 4 min</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="user-avatar-circle" style={{ width: 22, height: 22, fontSize: 9.5 }}>MC</div>
                    <div>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Marina Costa</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5, display: 'block' }}>Engenharia de plataforma</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-success">● Sucesso</span>
                    <span style={{ color: 'var(--text-muted)' }}>Handshake e escopos validados</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>30 set 2026 • 09:12:08</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10.5, display: 'block' }}>há 2 dias</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="user-avatar-circle" style={{ width: 22, height: 22, fontSize: 9.5 }}>MC</div>
                    <div>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Marina Costa</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5, display: 'block' }}>Engenharia de plataforma</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-success">● Sucesso</span>
                    <span style={{ color: 'var(--text-muted)' }}>PAT rotacionado e ativado</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>16 set 2026 • 18:05:41</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10.5, display: 'block' }}>há 16 dias</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="user-avatar-circle" style={{ width: 22, height: 22, fontSize: 9.5 }}>GA</div>
                    <div>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>GitHub Actions</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5, display: 'block' }}>Automação de segurança</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-warning">● Alerta</span>
                    <span style={{ color: '#FBBF24' }}>read:org aguardando revalidação</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>01 set 2026 • 11:44:19</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10.5, display: 'block' }}>há 31 dias</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="user-avatar-circle" style={{ width: 22, height: 22, fontSize: 9.5 }}>RL</div>
                    <div>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Rafael Lima</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5, display: 'block' }}>Maintainer</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-danger">● Falha</span>
                    <span style={{ color: '#F87171' }}>Token expirado durante handshake</span>
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>18 ago 2026 • 16:22:03</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10.5, display: 'block' }}>há 45 dias</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="user-avatar-circle" style={{ width: 22, height: 22, fontSize: 9.5 }}>BN</div>
                    <div>
                      <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>Bruna Nunes</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5, display: 'block' }}>SRE</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-success">● Sucesso</span>
                    <span style={{ color: 'var(--text-muted)' }}>Base URL Enterprise atualizada</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
