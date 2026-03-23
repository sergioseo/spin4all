# ADR 001: Arquitetura Medallion (Segregação de Dados)

## Status
Aceito

## Contexto
O projeto Spin4all inicialmente possuía uma estrutura de dados "flat", onde a ingestão e o consumo ocorriam nas mesmas tabelas. Isso dificultava a auditoria, impossibilitava o re-processamento de dados originais e criava riscos de integridade para a IA.

## Decisão
Adotamos o padrão Medallion (Data Lakehouse) com as seguintes camadas:
- **RAW**: Dados imutáveis em formato original. Ingestão obrigatória via `DataIngestor`.
- **TRUSTED**: Dados limpos, validados e estruturados pelo `ETLEngine`.
- **REFINED**: Agregações e visões otimizadas para consumo direto pelo Frontend e IA.

## Consequências
- **Positivas**: Total auditabilidade, capacidade de mudar a lógica de negócio sem perder dados históricos, desacoplamento entre ingestão e processamento.
- **Negativas**: Introdução de latência mínima devido ao processo de ETL assíncrono.
