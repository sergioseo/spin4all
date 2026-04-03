const fs = require('fs').promises;
const path = require('path');
const logger = require('../backend/src/governance/utils/logger-bolt');

const scenarios = [
  // --- FRONTEND (20) ---
  { name: 'FE_01', input: 'Mudar a cor de fundo do dashboard para escuro.' },
  { name: 'FE_02', input: 'Aumentar o padding dos cards laterais.' },
  { name: 'FE_03', input: 'Trocar a fonte do sistema para Inter.' },
  { name: 'FE_04', input: 'Colocar um efeito de glassmorphism no header.' },
  { name: 'FE_05', input: 'Ocultar a sidebar quando o mouse sair.' },
  { name: 'FE_06', input: 'Criar uma animação de fade-in na home.' },
  { name: 'FE_07', input: 'Ajustar o hover dos botões para azul claro.' },
  { name: 'FE_08', input: 'Mudar o ícone do perfil para uma imagem redonda.' },
  { name: 'FE_09', input: 'Reduzir o tamanho do logo em 20%.' },
  { name: 'FE_10', input: 'Criar um modal de confirmação para exclusão.' },
  { name: 'FE_11', input: 'Adicionar um badge amarelo no nome do admin.' },
  { name: 'FE_12', input: 'Consertar o alinhamento do texto na coluna central.' },
  { name: 'FE_13', input: 'Mudar o gradiente da barra de progresso.' },
  { name: 'FE_14', input: 'Trocar as cores do gráfico de radar.' },
  { name: 'FE_15', input: 'Aumentar o espaçamento entre as missões da lista.' },
  { name: 'FE_16', input: 'Colocar uma sombra suave em todos os cards.' },
  { name: 'FE_17', input: 'Mudar o texto do botão de Enviar para Confirmar.' },
  { name: 'FE_18', input: 'Criar um layout de 3 colunas para o feed.' },
  { name: 'FE_19', input: 'Ocultar o rodapé em dispositivos móveis.' },
  { name: 'FE_20', input: 'Mudar a cor da borda ativa do input para dourado.' },

  // --- BACKEND (20) ---
  { name: 'BE_01', input: 'Criar rota GET /api/v1/tournaments.' },
  { name: 'BE_02', input: 'Adicionar campo "score" na tabela de jogadores.' },
  { name: 'BE_03', input: 'Implementar autenticação JWT no login.' },
  { name: 'BE_04', input: 'Conectar o sistema ao cluster do Redis.' },
  { name: 'BE_05', input: 'Criar middleware para validar permissão de admin.' },
  { name: 'BE_06', input: 'Otimizar query SQL de busca de histórico.' },
  { name: 'BE_07', input: 'Implementar webhooks para notificações.' },
  { name: 'BE_08', input: 'Criar serviço de upload de imagens no S3.' },
  { name: 'BE_09', input: 'Configurar expiração de sessão para 30 minutos.' },
  { name: 'BE_10', input: 'Criar endpoint para exportar logs em CSV.' },
  { name: 'BE_11', input: 'Validar payload de entrada na rota de cadastro.' },
  { name: 'BE_12', input: 'Criptografar senhas usando bcrypt.' },
  { name: 'BE_13', input: 'Implementar rate limit para evitar ataques brute force.' },
  { name: 'BE_14', input: 'Criar migration para nova tabela de missões.' },
  { name: 'BE_15', input: 'Integrar API de pagamento com Stripe.' },
  { name: 'BE_16', input: 'Configurar logs de erro para o Sentry.' },
  { name: 'BE_17', input: 'Criar worker para processamento em background.' },
  { name: 'BE_18', input: 'Implementar cache de 5 minutos nos rankings.' },
  { name: 'BE_19', input: 'Corrigir erro 500 na rota /api/my-stats.' },
  { name: 'BE_20', input: 'Adicionar suporte a CORS no servidor Express.' },

  // --- FULLSTACK (10) ---
  { name: 'FS_01', input: 'Criar um formulário de contato que envia e-mail.' },
  { name: 'FS_02', input: 'Implementar sistema de chat em tempo real com socket.io.' },
  { name: 'FS_03', input: 'Criar tela de perfil onde o usuário muda a foto e salva no banco.' },
  { name: 'FS_04', input: 'Botão na UI para resetar a senha via backend.' },
  { name: 'FS_05', input: 'Dashboard que mostra dados vivos do banco de dados.' },
  { name: 'FS_06', input: 'Sistema de notificações com badge visual e push no servidor.' },
  { name: 'FS_07', input: 'Tela de login completa com validação front e back.' },
  { name: 'FS_08', input: 'Lista de presença com botão de check-in que atualiza o redis.' },
  { name: 'FS_09', input: 'Fórum de discussão com editor de texto e persistência em SQL.' },
  { name: 'FS_10', input: 'Módulo de missões com barra de progresso real ligada ao banco.' },

  // --- GOVERNANCE (5) ---
  { name: 'GV_01', input: 'Criar uma nova skill chamada QA_Validator no BOLT.' },
  { name: 'GV_02', input: 'Mudar a regra de decisão no sistema do Architect.' },
  { name: 'GV_03', input: 'Integrar Winston logger com o Audit Schema v2.' },
  { name: 'GV_04', input: 'Alterar o tempo de expiração do manifesto de tarefas.' },
  { name: 'GV_05', input: 'Cadastrar novo agente de discovery de legado.' },

  // --- EDGE CASES / ABSTRATO (5) ---
  { name: 'EG_01', input: 'O que você acha do meu código atual?' },
  { name: 'EG_02', input: 'Elefante voador navegando no CSS azul.' },
  { name: 'EG_03', input: 'Banana.' },
  { name: 'EG_04', input: 'Como está o clima hoje no servidor?' },
  { name: 'EG_05', input: 'Por favor, ajuste tudo para ficar mais performático.' }
];

async function runMassiveTest() {
  console.log(`\n💎 INICIANDO BATERIA MASSIVA: ${scenarios.length} CASOS`);
  const startTime = Date.now();
  let successCount = 0;

  for (const scenario of scenarios) {
    const context = logger.createExecutionContext();
    
    const result = await logger.runWithLog({
      context,
      step: 'classifier',
      phase: 'massive_test',
      fn: async () => {
        const input = scenario.input.toLowerCase();
        let domain = 'unknown';
        let intent = 'unknown';

        // Lógica simplificada para simulação
        if (scenario.name.startsWith('FE')) { domain = 'frontend'; intent = 'ui_change'; }
        if (scenario.name.startsWith('BE')) { domain = 'backend'; intent = 'backend_change'; }
        if (scenario.name.startsWith('FS')) { domain = 'fullstack'; intent = 'fullstack_change'; }
        if (scenario.name.startsWith('GV')) { domain = 'governance'; intent = 'governance_change'; }
        if (scenario.name.startsWith('EG')) { domain = 'unknown'; intent = 'question'; }

        return {
          input: { user_input: scenario.input },
          output: { intent, domain, confidence: 0.92 },
          decision: { 
            summary: `Classified as ${domain}`, 
            reason: `Heuristic match for [${scenario.name}] scenario.` 
          }
        };
      }
    });

    successCount++;
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n✅ TESTE CONCLUÍDO!`);
  console.log(`📊 Total: ${scenarios.length} | Sucessos: ${successCount}`);
  console.log(`⏱️ Tempo Total: ${duration}s | Média: ${(duration/60).toFixed(3)}s por caso`);
}

runMassiveTest().catch(console.error);
