/**
 * BOLT: Setup Industrial Folders (v7.3 Elite)
 * 
 * Cria a infraestrutura física de diretórios necessária para a Sandbox
 * e o Sistema de Promoção Atômica.
 * 
 * Operação: Idempotente
 */

const fs = require('fs');
const path = require('path');

const BASE_SANDBOX = path.join(process.cwd(), 'scripts', 'bolt');

const FOLDERS = [
  'draft',    // Área de escrita inicial das missões
  'staging',  // Área de validação/audit pré-promoção
  'releases', // Histórico imutável de releases (v1, v2...)
  'backups',  // Snapshots de segurança
  'locks'     // Controle de concorrência via arquivo (se adjunto ao Advisory Lock)
];

console.log('\n🏗️  BOLT: Iniciando setup de infraestrutura física...');

try {
  // 1. Criar Raiz
  if (!fs.existsSync(BASE_SANDBOX)) {
    console.log(`   📂 Criando raiz da sandbox: ${BASE_SANDBOX}`);
    fs.mkdirSync(BASE_SANDBOX, { recursive: true });
  }

  // 2. Criar Subpastas
  FOLDERS.forEach(folder => {
    const target = path.join(BASE_SANDBOX, folder);
    if (!fs.existsSync(target)) {
      console.log(`   📂 Criando pasta: /${folder}`);
      fs.mkdirSync(target, { recursive: true });
    } else {
      console.log(`   ✅ Pasta /${folder} já existe (idempotente).`);
    }
  });

  // 3. Criar arquivo de instrução/README na raiz da sandbox
  const readmePath = path.join(BASE_SANDBOX, 'README.md');
  const readmeContent = `# 🛡️ BOLT Sandbox Root
Esta pasta é gerida pelo Protocolo BOLT (Fase 7). 
Não mova ou delete arquivos manualmente sem autorização da Governança.

- **/draft**: Workspace temporário de escrita.
- **/staging**: Área de verificação de integridade (SHA-256).
- **/releases**: Repositório imutável das últimas 5 versões estáveis.
- **/current**: Junção (Windows) / Symlink (Linux) para a release ativa.
`;
  fs.writeFileSync(readmePath, readmeContent);

  console.log('\n✨ Infraestrutura BOLT pronta para operação industrial.\n');

} catch (err) {
  console.error(`\n❌ Erro fatal no setup de diretórios: ${err.message}`);
  process.exit(1);
}
