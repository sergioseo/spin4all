#!/usr/bin/env node

/**
 * BOLT → Notion Exporter (v1.0)
 *
 * Exporta documentações Markdown do BOLT para o Notion automaticamente.
 *
 * Uso:
 *   node export-to-notion.js --file <caminho-do-arquivo.md> --parent <page-id-do-notion>
 *   node export-to-notion.js --all                          (exporta todos os docs BOLT)
 *   node export-to-notion.js --update --page-id <id>        (atualiza página existente)
 *
 * Variáveis de ambiente necessárias:
 *   NOTION_API_KEY     – Token de integração do Notion
 *   NOTION_PARENT_ID   – ID da página-pai padrão (usado com --all)
 *
 * Dependências:
 *   npm install @notionhq/client @tryfabric/martian
 */

const { Client } = require('@notionhq/client');
const { markdownToBlocks } = require('@tryfabric/martian');
require('dotenv').config();
const fs = require('fs');
const path = require('path');


// ──────────────────────────────────────────────
// Configuração
// ──────────────────────────────────────────────

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_PARENT_ID = process.env.NOTION_PARENT_ID;

if (!NOTION_API_KEY) {
  console.error('❌ NOTION_API_KEY não definida. Configure no .env ou export NOTION_API_KEY=...');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

// ──────────────────────────────────────────────
// Mapa de documentos BOLT para exportação automática (--all)
// Edite esta lista para adicionar/remover documentos
// ──────────────────────────────────────────────

const BOLT_DOCS_MAP = [
  {
    file: 'docs/README.md',
    title: 'Índice Mestre de Documentação',
    icon: '📚',
  },
  {
    file: 'docs/BOLT_PLAN_Fase7_Sandbox_Promocao.md',
    title: 'BOLT: Fase 7 — Sandbox & Promoção',
    icon: '🚀',
  },
  {
    file: 'docs/BOLT_PLAN_Fase7.1_Versao_Elite_7.3.md',
    title: 'BOLT: Fase 7.1 — Versão Elite 7.3 (Industrial)',
    icon: '🛰️',
  },
  {
    file: 'docs/BOLT_WALKTHROUGH_Fase7_Sandbox_Promocao.md',
    title: 'BOLT: Fase 7 — Walkthrough (Industrial)',
    icon: '🦾',
  },
  {
    file: 'docs/BOLT_PLAN_Fase6_Orquestracao_Execucao.md',
    title: 'BOLT: Fase 6 — Orquestração & Persistência',
    icon: '⚙️',
  },
  {
    file: 'docs/BOLT_WALKTHROUGH_Fase5.md',
    title: 'BOLT: Fase 5 — Walkthrough (v2.16)',
    icon: '✅',
  },
  {
    file: 'docs/BOLT_Roadmap_Resolucao_Restricoes.md',
    title: 'BOLT: Roadmap — Resolução de Restrições',
    icon: '🗺️',
  },
  {
    file: 'docs/BOLT_Papeis_Camada_Deliberacao.md',
    title: 'BOLT: Papéis da Camada de Deliberação',
    icon: '🧠',
  },
  {
    file: 'docs/TICO_PLAN_Arquitetura_Missões.md',
    title: 'TICO: Arquitetura de Missões (v3.1)',
    icon: '🛰️',
  },
  {
    file: 'docs/TICO_Infraestrutura_Estruturada.md',
    title: 'TICO: Infraestrutura Estruturada',
    icon: '🧱',
  },
  {
    file: 'docs/AUDIT_BOLT_Auditoria_Massiva.md',
    title: 'AUDIT: BOLT Auditoria Massiva',
    icon: '📋',
  },
];


// ──────────────────────────────────────────────
// Utilitários
// ──────────────────────────────────────────────

/**
 * Remove links de arquivos locais ou relativos que o Notion rejeita.
 * - file:///...
 * - ./arquivo.md
 * Mantém o texto original dentro de um negrito para destaque visual.
 */
function sanitizeMarkdown(markdown) {
  // 1. Remove links file:///
  let sanitized = markdown.replace(/\[([^\]]+)\]\(file:\/\/\/[^)]+\)/gu, '**$1**');
  // 2. Remove links relativos para arquivos .md (comuns no README)
  sanitized = sanitized.replace(/\[([^\]]+)\]\(\.\/[^)]+\)/gu, '$1');
  return sanitized;
}

/**
 * Converte Markdown em blocos do Notion.
 * O @tryfabric/martian é o parser mais completo disponível.
 */
function convertMarkdownToBlocks(markdown) {
  const sanitized = sanitizeMarkdown(markdown);
  let blocks = markdownToBlocks(sanitized);
  
  // O Notion tem um limite estrito de 100 linhas (children) por tabela.
  // Vamos validar e truncar se necessário para evitar erro 400.
  blocks = blocks.map(block => {
    if (block.type === 'table' && block.table.children && block.table.children.length > 100) {
      console.warn(`   ⚠️ Tabela muito grande detectada (${block.table.children.length} linhas). Truncando para 100.`);
      block.table.children = block.table.children.slice(0, 100);
    }
    return block;
  });

  return blocks;
}

/**
 * Chunka um array em pedaços de tamanho `size`.
 * Necessário porque a API do Notion aceita no máximo 100 blocos por request.
 */
function chunkArray(array, size = 100) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Extrai o título do arquivo Markdown (primeiro heading H1).
 * Fallback para o nome do arquivo se não houver H1.
 */
function extractTitle(markdown, filepath) {
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  return path.basename(filepath, path.extname(filepath));
}

// ──────────────────────────────────────────────
// Operações do Notion
// ──────────────────────────────────────────────

/**
 * Cria uma nova página no Notion com o conteúdo do markdown.
 */
async function createNotionPage(parentId, title, icon, blocks) {
  console.log(`\n📄 Criando página: "${title}"`);

  // 1. Cria a página (inicialmente vazia)
  const page = await notion.pages.create({
    parent: { page_id: parentId },
    icon: { type: 'emoji', emoji: icon || '📝' },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: title } }],
      },
    },
  });

  console.log(`   ✅ Página criada: ${page.url}`);

  // 2. Adiciona o conteúdo em chunks (limite de 100 blocos por request)
  const chunks = chunkArray(blocks, 100);
  console.log(`   📦 Enviando ${blocks.length} blocos em ${chunks.length} chunk(s)...`);

  for (let i = 0; i < chunks.length; i++) {
    await notion.blocks.children.append({
      block_id: page.id,
      children: chunks[i],
    });
    console.log(`   ✔ Chunk ${i + 1}/${chunks.length} enviado.`);

    // Pequena pausa para respeitar o rate limit da API (3 req/s)
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  return page;
}

/**
 * Busca uma subpágina pelo título exato sob um parentId.
 * Serve para evitar duplicação no modo --all.
 */
async function findPageByTitle(parentId, title) {
  const normTitle = title.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim(); // Remove emojis para comparação robusta
  console.log(`   🔍 Buscando página existente (norm: "${normTitle}")...`);
  try {
    const response = await notion.blocks.children.list({ block_id: parentId });
    for (const block of response.results) {
      if (block.type === 'child_page') {
        const notionTitle = block.child_page.title;
        const normNotion = notionTitle.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
        
        if (normNotion === normTitle) {
          return block.id;
        }
      }
    }
  } catch (err) {
    console.error(`   ⚠️ Erro ao buscar subpáginas: ${err.message}`);
  }
  return null;
}

/**
 * Atualiza uma página existente no Notion.
 * Estratégia: limpa o conteúdo atual e reescreve.
 */
async function updateNotionPage(pageId, title, icon, blocks) {
  console.log(`\n♻️  Atualizando página: "${title}" (${pageId})`);

  // 1. Busca todos os blocos existentes para deletar (máximo 100)
  const existingBlocks = await notion.blocks.children.list({ block_id: pageId });
  if (existingBlocks.results.length > 0) {
    console.log(`   🗑️  Removendo ${existingBlocks.results.length} blocos existentes...`);
    for (const block of existingBlocks.results) {
      await notion.blocks.delete({ block_id: block.id });
      await new Promise(r => setTimeout(r, 200)); // um pouco mais lento para estabilidade
    }
  }

  // 2. Atualiza o título e ícone da página
  await notion.pages.update({
    page_id: pageId,
    icon: { type: 'emoji', emoji: icon || '📝' },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: title } }],
      },
    },
  });

  // 3. Adiciona o novo conteúdo em chunks
  const chunks = chunkArray(blocks, 100);
  console.log(`   📦 Enviando ${blocks.length} blocos em ${chunks.length} chunk(s)...`);

  for (let i = 0; i < chunks.length; i++) {
    await notion.blocks.children.append({
      block_id: pageId,
      children: chunks[i],
    });
    console.log(`   ✔ Chunk ${i + 1}/${chunks.length} enviado.`);
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 600)); // Delay maior para rate limit
    }
  }

  console.log(`   ✅ Página atualizada com sucesso.`);
}

// ──────────────────────────────────────────────
// Operação principal: exportar um arquivo
// ──────────────────────────────────────────────

async function exportFile({ filePath, parentId, title, icon, pageId }) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    return null;
  }

  const markdown = fs.readFileSync(filePath, 'utf8');
  const resolvedTitle = title || extractTitle(markdown, filePath);
  const resolvedIcon = icon || '📄';

  console.log(`\n🔄 Processando: ${path.basename(filePath)}`);
  console.log(`   Título: ${resolvedTitle}`);
  console.log(`   Convertendo Markdown → ${markdown.length} chars...`);

  let blocks;
  try {
    blocks = convertMarkdownToBlocks(markdown);
    console.log(`   ✔ ${blocks.length} blocos gerados.`);
  } catch (err) {
    console.error(`   ❌ Erro na conversão do Markdown: ${err.message}`);
    return null;
  }

  try {
    if (pageId) {
      // Atualizar página existente
      await updateNotionPage(pageId, resolvedTitle, resolvedIcon, blocks);
    } else {
      // Criar nova página
      const pid = parentId || NOTION_PARENT_ID;
      if (!pid) {
        console.error('❌ --parent ou NOTION_PARENT_ID é necessário para criar uma nova página.');
        return null;
      }
      const page = await createNotionPage(pid, resolvedTitle, resolvedIcon, blocks);
      return page.id;
    }
  } catch (err) {
    console.error(`   ❌ Erro na API do Notion: ${err.message}`);
    if (err.body) console.error('   Detalhes:', JSON.stringify(err.body, null, 2));
    return null;
  }
}

// ──────────────────────────────────────────────
// CLI — Parsing de argumentos
// ──────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const get = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : null;
  };
  const has = (flag) => args.includes(flag);

  // ── Modo: exportar todos os docs BOLT
  if (has('--all')) {
    console.log('\n🚀 BOLT → Notion: Exportação em lote\n');
    const parentId = get('--parent') || NOTION_PARENT_ID;
    if (!parentId) {
      console.error('❌ Use --parent <page-id> ou defina NOTION_PARENT_ID para exportação em lote.');
      process.exit(1);
    }

    const results = [];
    for (const doc of BOLT_DOCS_MAP) {
      // Tentar encontrar pág existente pelo título antes de criar
      const existingId = await findPageByTitle(parentId, doc.title);
      
      const pageId = await exportFile({
        filePath: doc.file,
        parentId,
        pageId: existingId, // se existir, vai atualizar em vez de criar
        title: doc.title,
        icon: doc.icon,
      });
      results.push({ file: doc.file, pageId });
      await new Promise(r => setTimeout(r, 800)); // pausa maior entre documentos
    }

    console.log('\n\n✅ Exportação concluída!\n');
    console.log('📋 IDs das páginas criadas (cole no BOLT_DOCS_MAP para updates futuros):');
    for (const r of results) {
      if (r.pageId) console.log(`   ${path.basename(r.file)}: ${r.pageId}`);
    }
    return;
  }

  // ── Modo: exportar arquivo único
  const filePath = get('--file');
  if (filePath) {
    const parentId = get('--parent');
    const pageId = get('--page-id');
    const title = get('--title');
    const icon = get('--icon');

    const resultPageId = await exportFile({ filePath, parentId, pageId, title, icon });
    if (resultPageId) {
      console.log(`\n✅ Pronto! Page ID para updates futuros: ${resultPageId}`);
      console.log(`   Use: node export-to-notion.js --file ${filePath} --page-id ${resultPageId}`);
    }
    return;
  }

  // ── Sem argumentos válidos
  console.log(`
BOLT → Notion Exporter v1.0

Uso:
  node export-to-notion.js --file <caminho> [--parent <id>] [--title "Título"] [--icon 🚀]
  node export-to-notion.js --file <caminho> --page-id <id>   (atualizar página existente)
  node export-to-notion.js --all [--parent <id>]              (todos os docs BOLT)

Variáveis de ambiente:
  NOTION_API_KEY    Token de integração (obrigatório)
  NOTION_PARENT_ID  ID da página-pai padrão (opcional se usar --parent)

Exemplos:
  export NOTION_API_KEY=secret_xxx
  node export-to-notion.js --file docs/bolt_implementation_plan_fase7_sandbox_promocao.md --parent abc123
  node export-to-notion.js --all --parent abc123
  `);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
