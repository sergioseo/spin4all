# 🗺️ Guia de Setup: BOLT → Notion

Este guia cobre o processo completo de configurar o Notion como plataforma de documentação do protocolo BOLT e integrar com o script de exportação automática.

> [!NOTE]
> **Pré-requisito**: Ter uma conta Notion (plano Free funciona para começar). O script de exportação está em `scripts/export-to-notion.js`.

---

## 📋 Parte 1 — Estrutura do Workspace no Notion

Crie a seguinte hierarquia de páginas **manualmente** no Notion antes de rodar o script:

```
📚 BOLT — Governança Industrial        ← página-pai raiz (copie o ID desta)
│
├── 🗺️ Roadmap Geral
│   ├── ✅ Fase 1 — Context Scanner
│   ├── ✅ Fase 2 — Architect & PO
│   ├── ✅ Fase 3 — Deliberation Loop
│   ├── ✅ Fase 4 — Contract Finalizer
│   ├── ✅ Fase 5 — Constraint Resolution Layer
│   ├── ✅ Fase 6 — Orquestração & Persistência
│   └── 🔄 Fase 7 — Sandbox & Promoção Transacional
│
├── 📁 Planos de Implementação          ← exportar aqui com --all
│   (páginas criadas automaticamente pelo script)
│
├── 📁 Arquitetura & Protocolos
│   (páginas criadas automaticamente pelo script)
│
└── 📋 Audit Log de Manifestos          ← database do Notion (criação manual)
```

---

## 🔑 Parte 2 — Configurar a Integration do Notion

### Passo 1: Criar a Integration

1. Acesse: [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Clique em **"+ New integration"**
3. Nome: `BOLT Exporter`
4. Workspace: selecione seu workspace
5. Capabilities: marque **"Read content"**, **"Update content"** e **"Insert content"**
6. Clique em **"Submit"**
7. Copie o **"Internal Integration Token"** → este é seu `NOTION_API_KEY`

```
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Passo 2: Compartilhar a página-pai com a Integration

1. Abra a página **"📚 BOLT — Governança Industrial"** no Notion
2. Clique em **"..."** (três pontos) no canto superior direito
3. Clique em **"Add connections"**
4. Busque por **"BOLT Exporter"** e adicione

> [!IMPORTANT]
> Sem compartilhar, o script receberá erro `object_not_found`. A Integration só enxerga páginas que foram explicitamente compartilhadas com ela.

### Passo 3: Obter o ID da página-pai

Na URL da página do Notion:
```
https://www.notion.so/BOLT-Governanca-Industrial-abc123def456...
                                                  ^^^^^^^^^^^^^^
                                                  Este é o PAGE_ID
```

O ID tem 32 caracteres hexadecimais. Anote-o — você vai precisar.

---

## 📦 Parte 3 — Instalar Dependências

No terminal, dentro da pasta raiz do projeto:

```bash
# Instalar as dependências do script
npm install @notionhq/client @tryfabric/martian

# Verificar instalação
node -e "require('@notionhq/client'); require('@tryfabric/martian'); console.log('✅ OK')"
```

---

## ⚙️ Parte 4 — Configurar Variáveis de Ambiente

Adicione ao seu arquivo `.env` na raiz do projeto:

```env
# Notion Integration
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_PARENT_ID=abc123def456789...  # ID da página-pai do BOLT no Notion
```

> [!WARNING]
> Certifique-se que `.env` está no `.gitignore`. **Nunca commite o `NOTION_API_KEY`.**

---

## 🚀 Parte 5 — Exportar os Documentos

### Exportar todos os docs BOLT de uma vez:

```bash
node scripts/export-to-notion.js --all
```

### Exportar um documento específico:

```bash
# Criar nova página
node scripts/export-to-notion.js \
  --file docs/bolt_implementation_plan_fase7_sandbox_promocao.md \
  --parent <NOTION_PARENT_ID>

# Atualizar página existente (use o page-id devolvido na criação)
node scripts/export-to-notion.js \
  --file docs/bolt_implementation_plan_fase7_sandbox_promocao.md \
  --page-id <PAGE_ID_DA_PAGINA_NO_NOTION>
```

### Saída esperada:

```
🚀 BOLT → Notion: Exportação em lote

🔄 Processando: bolt_implementation_plan_fase7_sandbox_promocao.md
   Título: 🚀 Fase 7 — Sandbox & Promoção Transacional
   Convertendo Markdown → 35740 chars...
   ✔ 312 blocos gerados.

📄 Criando página: "🚀 Fase 7 — Sandbox & Promoção Transacional"
   ✅ Página criada: https://www.notion.so/Fase-7-abc123...
   📦 Enviando 312 blocos em 4 chunk(s)...
   ✔ Chunk 1/4 enviado.
   ✔ Chunk 2/4 enviado.
   ✔ Chunk 3/4 enviado.
   ✔ Chunk 4/4 enviado.

✅ Exportação concluída!

📋 IDs das páginas criadas (cole no BOLT_DOCS_MAP para updates futuros):
   bolt_implementation_plan_fase7_sandbox_promocao.md: abc123def456...
   bolt_papeis_camada_deliberacao.md: ghi789jkl012...
```

---

## 🗺️ Parte 6 — Mapa de Documentos para Atualização

Após a primeira exportação, o script retorna os IDs das páginas criadas. Guarde esses IDs no arquivo `scripts/notion-pages.json` para facilitar atualizações futuras:

```json
{
  "docs/bolt_implementation_plan_fase7_sandbox_promocao.md": "abc123def456...",
  "docs/bolt_implementation_plan_fase6_orquestracao_execucao": "ghi789jkl012...",
  "docs/bolt_papeis_camada_deliberacao.md": "mno345pqr678...",
  "docs/bolt_roadmap_resolucao_restricoes.md": "stu901vwx234...",
  "docs/bolt_estrutura_protocolo": "yza567bcd890..."
}
```

> Com esses IDs salvos, atualizar uma página é simples:
> ```bash
> node scripts/export-to-notion.js --file docs/bolt_implementation_plan_fase7_sandbox_promocao.md --page-id abc123def456...
> ```

---

## ⚠️ Limitações Conhecidas

| Elemento | Suporte | Observação |
| :--- | :---: | :--- |
| Headings (H1, H2, H3) | ✅ | Convertidos corretamente |
| Listas e sublistas | ✅ | Convertidas corretamente |
| Blocos de código | ✅ | Com syntax highlighting |
| Tabelas | ✅ | Convertidas, mas sem mesclagem de células |
| GitHub Alerts (`> [!NOTE]`) | ⚠️ | Viram `callout` simples, sem ícone colorido |
| Mermaid diagrams | ❌ | Renderizado como bloco de código simples |
| Imagens inline | ⚠️ | URLs funcionam; imagens locais precisam de upload separado |
| Links internos entre páginas | ❌ | Links entre docs `.md` não são convertidos para links do Notion |

---

## 🔮 Evoluções Futuras

### 1. Integração automática com o BOLT

Quando a Fase 7 estiver implementada, o `DeliberationController` pode chamar o exporter automaticamente quando um manifesto for `CONVERGED`:

```javascript
// deliberation-controller.js (futura integração)
async _persistManifest(result) {
  await GovernanceRepository.saveManifest(...);

  // Sync automático para o Notion
  if (process.env.NOTION_API_KEY && result.status === 'converged') {
    await NotionSync.pushManifest(result);
  }
}
```

### 2. Exportação via MCP

Quando MCP for integrado ao BOLT, o exporter pode usar o servidor MCP do Notion em vez da API direta — padronizando todos os conectores externos.

### 3. Bidirectionalidade

Webhooks do Notion podem notificar o BOLT quando uma página é editada, permitindo sync reverso (Notion → arquivos `.md`). Isso só faz sentido se o Notion for promovido a SSoT no futuro.