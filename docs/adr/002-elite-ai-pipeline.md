# ADR 002: Elite AI Pipeline (4-Stage Analysis)

## Status
Aceito

## Contexto
A análise de partidas via IA era monolítica e difícil de depurar. Erros em cálculos de métricas se misturavam com erros de prompts, gerando inconsistências nos vereditos dos mentores.

## Decisão
Refatoramos o motor de análise para um pipeline modular de 4 estágios:
1. **Cleaner**: Sanitização de dados brutos.
2. **Metrics**: Cálculos determinísticos puros.
3. **Aggregator**: Classificação de cenários e flags de performance.
4. **AI Orchestrator**: Geração de narrativa via LLM com cache semântico.

## Consequências
- **Positivas**: Facilidade de teste unitário por estágio, redução drástica no custo de tokens (via cache), precisão cirúrgica nas métricas.
- **Negativas**: Maior complexidade de arquivos no diretório `services/analysis/`.
