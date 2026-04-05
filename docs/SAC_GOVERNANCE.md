# SPIN4ALL - Governance: SAC (Admin Control)

O **Spin4All Admin Control (SAC)** é a ferramenta oficial e obrigatória para todas as operações de infraestrutura, manutenção e governança técnica executadas via terminal.

## ⚖️ A Regra de Ouro (SAC-First)
Nenhum script temporário ou comando manual isolado deve ser executado para tarefas recorrentes ou críticas. Toda lógica deve ser modularizada dentro do arquivo `scripts/sac.js`.

## 🛡️ Protocolo de Segurança e Risco
1.  **Atomicidade**: Toda operação de banco DEVE usar transações (`BEGIN/COMMIT/ROLLBACK`).
2.  **Snapshot Obrigatório**: Antes de qualquer deleção ou alteração em massa, o SAC deve gerar um snapshot do estado atual em `backup/sac_snapshots/`.
3.  **Dry-Run por Padrão**: Comandos destrutivos devem exigir a flag `--confirm` para execução real.

## 🚀 Evolução da Ferramenta
- **Modularização**: Novos casos de uso (thumbnails, auditoria de arquivos, reset de senhas) devem ser adicionados como blocos de função no SAC.
- **Auditoria**: O SAC é o repositório da verdade para o estado de integridade do portal.

## ⚠️ Gerenciamento de Riscos
Sempre que o SAC for acionado, o assistente IA deve:
1.  Identificar o comando e seu objetivo.
2.  Listar os riscos de integridade (ex: chaves estrangeiras, perda de dados).
3.  Confirmar que o checkpoint de rollback está pronto.

---
**Data de Ativação**: 05 de Abril de 2026
**Status**: Operacional (v1.0)
