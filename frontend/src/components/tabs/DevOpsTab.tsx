import React, { useState } from 'react'
import {
  Rocket,
  CheckCircle2,
  FileCode,
  Download,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Play,
} from 'lucide-react'

export const DevOpsTab: React.FC = () => {
  const [copiedChangelog, setCopiedChangelog] = useState(false)

  const copyChangelog = () => {
    const text = `## [1.0.0] - 2026-10-02
Primeira release estável do módulo de integração e governança GitHub.

### Adicionado
- [US-021] Processar commits do GitHub de forma idempotente (8f3a91c)
- [US-024] Validar assinatura e rastrear webhooks recebidos (c4b7d2e)
- [US-028] Expor consulta de commits na API acadêmica (1ab08de)

### Corrigido e protegido
- Retry duplicado no consumidor de eventos (32ca6b1)
- Proteção contra force push na branch main (5de91f2)`
    navigator.clipboard.writeText(text)
    setCopiedChangelog(true)
    setTimeout(() => setCopiedChangelog(false), 2000)
  }

  return (
    <div className="view-container">
      {/* Sub-header da Tela 13 */}
      <div className="section-intro-bar">
        <div>
          <h2 className="section-intro-title">Prontidão da release</h2>
          <p className="section-intro-desc">
            Visão consolidada da esteira, qualidade, documentação e controles de publicação da versão candidata.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-success">● Release aprovada • 3/3 quality gates</span>
          <button className="btn-nexus btn-nexus-primary">
            <Rocket size={13} />
            <span>Publicar release</span>
          </button>
        </div>
      </div>

      {/* 5 KPIs de Prontidão da Release */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">RELEASE CANDIDATA</span>
            <CheckCircle2 size={13} style={{ color: '#10B981' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
            Pronta para deploy
          </div>
          <div className="kpi-sub">Todos os gates atendidos</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">ESTEIRA CI/CD</span>
            <span className="badge badge-success">3/3</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
            Jobs concluídos
          </div>
          <div className="kpi-sub">build, test, audit</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">QUALITY GATE</span>
            <span className="badge badge-success">A</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#34D399', marginTop: 4 }}>
            Aprovado SonarQube
          </div>
          <div className="kpi-sub">0 bugs críticos</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">COBERTURA</span>
            <span className="badge badge-success">&gt; 80%</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
            86,8%
          </div>
          <div className="kpi-sub">mínimo PO: 80%</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">CODE FREEZE</span>
            <Lock size={12} style={{ color: '#F59E0B' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FBBF24', marginTop: 4 }}>
            Ativo
          </div>
          <div className="kpi-sub">branch main protegida</div>
        </div>
      </div>

      {/* Grid: Status da Esteira CI/CD + Cobertura de Código */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        {/* Coluna Esquerda: Status da Esteira CI/CD */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div>
              <div className="nexus-card-title">
                Status da Esteira CI/CD
                <span className="badge badge-success" style={{ marginLeft: 6 }}>
                  ● Concluída com sucesso
                </span>
              </div>
              <div className="nexus-card-subtitle">
                GitHub Actions • workflow release.yml disparado por push na branch protegida.
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              run #1042 • 8f3a91c • 3m 07s
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {/* Job 1: Testes unitários */}
            <div
              style={{
                backgroundColor: '#0A0F1D',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 12, color: '#FFFFFF' }}>Testes unitários</strong>
                <span className="badge badge-success">402 passaram</span>
              </div>
              <div className="code-box-dark" style={{ padding: 6, fontSize: 10 }}>
                pytest -q --cov=src
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                0 falhas • 4 ignorados • cobertura em 8 pacotes
              </span>
              <span style={{ fontSize: 10, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={11} /> Concluído às 14:28 • 1m 42s
              </span>
            </div>

            {/* Job 2: SAST SonarQube */}
            <div
              style={{
                backgroundColor: '#0A0F1D',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 12, color: '#FFFFFF' }}>SAST • SonarQube</strong>
                <span className="badge badge-success">Aprovado</span>
              </div>
              <div className="code-box-dark" style={{ padding: 6, fontSize: 10 }}>
                sonar-scanner -Dsonar...
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                0 bugs críticos • 0 hotspots • dívida 1h12
              </span>
              <span style={{ fontSize: 10, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={11} /> Concluído às 14:28 • 54s
              </span>
            </div>

            {/* Job 3: Dependências pip-audit */}
            <div
              style={{
                backgroundColor: '#0A0F1D',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 12, color: '#FFFFFF' }}>Dependências • pip-audit</strong>
                <span className="badge badge-success">Sem CVEs</span>
              </div>
              <div className="code-box-dark" style={{ padding: 6, fontSize: 10 }}>
                pip-audit -r reqs.txt --strict
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                73 dependências • banco OSV atualizado
              </span>
              <span style={{ fontSize: 10, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={11} /> Concluído às 14:28 • 18s
              </span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Cobertura de Código */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div>
              <div className="nexus-card-title">Cobertura de Código</div>
              <div className="nexus-card-subtitle">Relatório combinado do pytest-cov.</div>
            </div>
            <span className="badge badge-success">● Aprovado</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {/* Donut Chart / Indicador Visual Circular */}
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: 'conic-gradient(#10B981 0% 86.8%, #162035 86.8% 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: '50%',
                  backgroundColor: '#0D1322',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>86,8%</span>
                <span style={{ fontSize: 8.5, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  COBERTURA TOTAL
                </span>
              </div>
            </div>

            <div style={{ width: '100%', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>MÍNIMO EXIGIDO PELO PO:</span>
                <strong style={{ color: '#FFFFFF' }}>80,0%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Variação na release:</span>
                <strong style={{ color: '#10B981' }}>+2,4 p.p.</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Linhas cobertas:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>4.146 / 4.776</span>
              </div>
            </div>

            <div
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 4,
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: 10.5,
                color: '#34D399',
                textAlign: 'center',
              }}
            >
              ✓ 6,8 p.p. acima do gate definido pelo PO.
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Documentação OpenAPI + Release Code Freeze */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
        {/* Documentação de API Integrada */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div>
              <div className="nexus-card-title">Documentação de API Integrada</div>
              <div className="nexus-card-subtitle">Swagger UI publicado a partir da especificação OpenAPI 3.0.</div>
            </div>
            <span className="badge badge-info">OpenAPI 3.0</span>
          </div>

          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#93C5FD' }}>Swagger UI /docs</span>
              <span className="badge badge-success">● HTTP 200</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-success" style={{ fontFamily: 'var(--font-mono)' }}>GET</span>
                <code style={{ color: '#FFFFFF' }}>/commits</code>
                <span style={{ color: 'var(--text-tertiary)' }}>Lista commits com filtros e paginação</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)' }}>POST</span>
                <code style={{ color: '#FFFFFF' }}>/webhooks/github</code>
                <span style={{ color: 'var(--text-tertiary)' }}>Recebe e valida eventos do GitHub</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button className="btn-nexus btn-nexus-secondary btn-nexus-sm">
              <Download size={11} />
              <span>Baixar openapi.json</span>
            </button>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="btn-nexus btn-nexus-primary btn-nexus-sm"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={11} />
              <span>Abrir Swagger UI</span>
            </a>
          </div>
        </div>

        {/* Release e Code Freeze */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div>
              <div className="nexus-card-title">Release e Code Freeze</div>
              <div className="nexus-card-subtitle">Janela de publicação protegida para a versão candidata.</div>
            </div>
            <span className="badge badge-warning">
              <Lock size={10} style={{ marginRight: 3 }} /> Code freeze ativo
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>TAG ATIVA</span>
              <strong style={{ color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>v1.0.0</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>BRANCH DE PUBLICAÇÃO</span>
              <span className="badge badge-info">main (Protegida)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>POLÍTICA</span>
              <span style={{ color: '#FBBF24' }}>Edições diretas bloqueadas</span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', borderTop: '1px solid var(--border-default)', paddingTop: 6 }}>
              Freeze desde 02 out • 14:30 BRT — Exige PR + 2 aprovações + gates verdes.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-nexus btn-nexus-secondary btn-nexus-sm" style={{ flex: 1 }}>
              <span>Comparar tag</span>
            </button>
            <button className="btn-nexus btn-nexus-secondary btn-nexus-sm" style={{ flex: 1 }}>
              <span>Ver proteção</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seção CHANGELOG.md e Rastreabilidade */}
      <div className="nexus-card">
        <div className="nexus-card-header">
          <div>
            <div className="nexus-card-title">
              <FileCode size={15} style={{ color: '#60A5FA' }} />
              <span>CHANGELOG.md</span>
              <span className="badge badge-info" style={{ marginLeft: 6 }}>✦ gerado automaticamente</span>
            </div>
            <div className="nexus-card-subtitle">
              Notas rastreáveis a partir das User Stories, pull requests e Conventional Commits da versão.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={copyChangelog} className="btn-nexus btn-nexus-secondary btn-nexus-sm">
              {copiedChangelog ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedChangelog ? 'Copiado!' : 'Copiar Markdown'}</span>
            </button>
            <button className="btn-nexus btn-nexus-secondary btn-nexus-sm">
              <ExternalLink size={11} />
              <span>Abrir no GitHub</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
          {/* Conteúdo Renderizado do Changelog */}
          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>## [1.0.0] — 2026-10-02</h3>
              <span className="badge badge-success">3 User Stories entregues</span>
            </div>
            <p style={{ color: 'var(--text-tertiary)' }}>
              Primeira release estável do módulo de integração e governança GitHub.
            </p>

            <strong style={{ color: '#93C5FD', fontSize: 12 }}>### Adicionado</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong style={{ color: '#38BDF8' }}>US-021</strong> Processar commits do GitHub de forma idempotente
                </span>
                <span className="hash-badge">8f3a91c</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong style={{ color: '#38BDF8' }}>US-024</strong> Validar assinatura e rastrear webhooks recebidos
                </span>
                <span className="hash-badge">c4b7d2e</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong style={{ color: '#38BDF8' }}>US-028</strong> Expor consulta de commits na API acadêmica
                </span>
                <span className="hash-badge">1ab08de</span>
              </div>
            </div>

            <strong style={{ color: '#34D399', fontSize: 12, marginTop: 6 }}>### Corrigido e protegido</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Retry duplicado no consumidor de eventos</span>
                <span className="hash-badge">32ca6b1</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Proteção contra force push na branch main</span>
                <span className="hash-badge">5de91f2</span>
              </div>
            </div>
          </div>

          {/* Rastreabilidade da Versão */}
          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 11.5,
            }}
          >
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', display: 'block', marginBottom: 10 }}>
                Rastreabilidade da versão
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pull requests mesclados:</span>
                  <span style={{ color: '#93C5FD' }}>#284 • #287 • #291</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Commits incluídos:</span>
                  <strong style={{ color: '#FFFFFF' }}>12</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Autor da release:</span>
                  <span>Marina Costa</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Artefato:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>sha256:9ac7...e412</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12, fontSize: 11 }}>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={12} /> Tag assinada
                </span>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={12} /> Imagem de container publicada
                </span>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={12} /> Rollback validado
                </span>
              </div>
            </div>

            <button className="btn-nexus btn-nexus-primary" style={{ width: '100%' }}>
              <Play size={12} />
              <span>Iniciar publicação</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
