#!/usr/bin/env node

/**
 * BOLT → Notion Setup Hierarchy (v1.0)
 *
 * Cria automaticamente a estrutura de páginas e subpáginas do BOLT no Notion.
 *
 * Uso:
 *   node scripts/notion-setup-structure.js --parent <PAGE_ID_DA_RAIZ>
 *
 * Dependências:
 *   npm install @notionhq/client dot-env
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

const NOTION_API_KEY = process.env.NOTION_API_KEY;
if (!NOTION_API_KEY) {
  console.error('❌ NOTION_API_KEY não encontrada no .env');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

async function createPage(parentId, title, icon) {
  const page = await notion.pages.create({
    parent: { page_id: parentId },
    icon: { type: 'emoji', emoji: icon },
    properties: {
      title: {
        title: [{ type: 'text', text: { content: title } }],
      },
    },
  });
  console.log(`✅ Criada: ${title} (${page.id})`);
  return page.id;
}

async function main() {
  const args = process.argv.slice(2);
  const parentId = args.indexOf('--parent') !== -1 ? args[args.indexOf('--parent') + 1] : process.env.NOTION_PARENT_ID;

  if (!parentId) {
    console.error('❌ Parent ID não fornecido. Use --parent <PAGE_ID> ou configure NOTION_PARENT_ID no .env');
    process.exit(1);
  }

  console.log('\n🏗️  Iniciando criação da estrutura BOLT no Notion...\n');

  try {
    // 1. Roadmap Geral
    const roadmapId = await createPage(parentId, '🗺️ Roadmap Geral', '🗺️');
    const fases = [
      '✅ Fase 1 — Context Scanner',
      '✅ Fase 2 — Architect & PO',
      '✅ Fase 3 — Deliberation Loop',
      '✅ Fase 4 — Contract Finalizer',
      '✅ Fase 5 — Constraint Resolution Layer',
      '✅ Fase 6 — Orquestração & Persistência',
      '🔄 Fase 7 — Sandbox & Promoção Transacional',
    ];
    for (const fase of fases) {
      await createPage(roadmapId, fase, fase.startsWith('✅') ? '✅' : '🔄');
    }

    // 2. Planos de Implementação
    await createPage(parentId, '📁 Planos de Implementação', '📁');

    // 3. Arquitetura & Protocolos
    await createPage(parentId, '📁 Arquitetura & Protocolos', '📁');

    // 4. Audit Log de Manifestos (Database)
    // Nota: Criar databases via API é mais complexo em terms de Schema.
    // O script por ora cria a página para ser a base.
    await createPage(parentId, '📋 Audit Log de Manifestos', '📋');

    console.log('\n🚀 Estrutura criada com sucesso no Notion!');
    console.log('Agora use o script export-to-notion.js para enviar os documentos.\n');

  } catch (err) {
    console.error('❌ Erro durante o setup:', err.message);
    if (err.body) console.error('Detalhes:', JSON.stringify(err.body, null, 2));
  }
}

main();
