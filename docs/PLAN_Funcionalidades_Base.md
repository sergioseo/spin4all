# 🚀 Documento de Funcionalidades: Spin4all Ecosystem

Este documento consolida todas as capacidades técnicas e de interface desenvolvidas até o momento para o projeto Spin4all.

---

## 🔐 1. Núcleo & Autenticação
*   **Sistema de Login Seguro**: Autenticação baseada em JWT com expiração de 8h.
*   **Onboarding Simples**: Fluxo de registro completo ou via **Google Login**.
*   **Perfil Biomecânico**: Coleta de dados como peso, altura, lateralidade e empunhadura para personalização técnica.
*   **Segurança**: Hashing de senhas com `bcryptjs` e proteção de rotas via middleware de autenticação.

## 📊 2. Dashboard Inteligente (Home)
*   **Header Premium**: Layout Split (30/70) integrando perfil do usuário e banners de patrocinadores.
*   **Seu Momento no Jogo**: Visão centralizada com:
    *   **Frequência**: Gauge circular com regra de qualificação para torneios (Trava de 50%).
    *   **Calendário**: Grid de 14 dias para visualização rápida de check-ins.
    *   **Status de Perfil**: Classificação técnica automática (Iniciante, Avançado, etc).
*   **Comunidade em Movimento**: Feed de destaques com Torneios, Ranking Geral e Loja.

## 🧠 3. Motor de Análise AI (Spin Engine)
*   **Veredito do Diretor Técnico**: Narrativa customizada gerada por IA baseada no desempenho real.
*   **Oscilação Competitiva**: Análise de vitórias/derrotas para identificar inconsistências no jogo.
*   **Dicas de Especialista**: Recomendações personalizadas focadas no perfil técnico do jogador.
*   **Próximos Passos**: Sugestões acionáveis para o próximo treino.
*   **Estratégia de Tokens**: Sistema de cache para evitar gastos desnecessários de LLM em refreshes.

## 🎮 4. Gamificação & Evolução
*   **Sistema de Missões**: Missões dinâmicas (Técnicas, Físicas e Táticas) que recompensam com XP.
*   **Mural de Conquistas (Badges)**: Sistema de medalhas (ex: Mestre do Diagnóstico) que brilha conforme desbloqueado.
*   **Radar de Skills**: Gráfico técnico comparativo para Forehand, Backhand, Saque, etc.
*   **Níveis de Maestria**: Sistema de XP que eleva o nível do usuário no ecossistema.

## 📋 5. Gestão de Presença (Tablet Mode)
*   **Check-in Rápido**: Interface dedicada para tablets na recepção do clube.
*   **Controle Admin**: Ativação/desativação de presença e override manual da trava de torneios.
*   **Lista de Chamada**: Visualização em tempo real de quem treinou no dia com fotos de perfil.

## 🏁 6. Rankings & Performance
*   **Ranking Geral**: Ordenação global por pontos de performance.
*   **Vanguarda (Evolução)**: Destaque para quem teve o maior crescimento técnico no período.
*   **Ranking de Fogo (Frequência)**: Reconhecimento para os jogadores mais constantes na mesa.

---

## 🛠️ 7. Infraestrutura & Dados
*   **Arquitetura de Dados**: Camadas separadas entre `RAW` (dados brutos de auditoria) e `TRUSTED` (dados validados).
*   **Migrações Automáticas**: Servidor sincroniza a estrutura do banco de dados (PostgreSQL) a cada inicialização.
*   **Logging Global**: Middleware para rastreamento de todas as requisições e erros de servidor.
