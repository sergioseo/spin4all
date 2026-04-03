/**
 * BOLT: CSS Adapter (v9.8 Elite)
 * 
 * Especialista em auditoria de design e sintaxe CSS.
 * ⚛️🎨🛡️
 */

const path = require('path');
const fs = require('fs');

class CSSAdapter {
  constructor() {
    this.name = 'CSS_ELITE_ADAPTER';
    this.version = '1.0.0';
    
    // Configurações de Pesos (Integrado ao Health Score)
    this.weights = {
      syntax: 0.5,
      style: 0.3,
      security: 0.2
    };

    // Design Tokens Obrigatórios (Elite Style)
    this.eliteTokens = ['backdrop-filter', 'rgba', 'cubic-bezier', 'blur'];
  }

  /**
   * Executa a auditoria completa do arquivo CSS.
   * @param {string} content - Conteúdo do rascunho.
   * @returns {Object} Diagnóstico de saúde.
   */
  async validate(content) {
    const diagnosis = {
      syntax_score: 1.0,
      style_score: 1.0,
      security_score: 1.0,
      violations: [],
      auto_fixes: []
    };

    // 1. Validação de Sintaxe (Braces Matching)
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      if (openBraces > closeBraces) {
        diagnosis.syntax_score = 0.5; // Reduzido por inconsistência
        diagnosis.violations.push(`Unmatched '{' (Open: ${openBraces}, Closed: ${closeBraces})`);
        
        // AUTO-FIX: Tentar fechar as chaves automaticamente se for trivial
        if (openBraces - closeBraces <= 2) {
          diagnosis.auto_fixes.push({
            type: 'syntax',
            action: 'close_missing_braces',
            confidence: 0.95,
            content: content + '\n' + '}'.repeat(openBraces - closeBraces)
          });
        }
      } else {
        diagnosis.syntax_score = 0.0; // Erro fatal
        diagnosis.violations.push('FATAL: Unexpected closing brace "}" outside of block.');
      }
    }

    // 2. Validação de Style (Elite Compliance)
    let foundTokens = 0;
    this.eliteTokens.forEach(token => {
      if (content.includes(token)) foundTokens++;
    });

    const complianceRatio = foundTokens / this.eliteTokens.length;
    if (complianceRatio < 0.75) {
      diagnosis.style_score = complianceRatio;
      diagnosis.violations.push(`Low Elite Compliance (Found ${foundTokens}/${this.eliteTokens.length} mandatory tokens)`);
    }

    // 3. Validação de Segurança (Sandbox Purity)
    // Bloquear caminhos absolutos baseados na estrutura Windows do usuário
    if (content.match(/c:\\Users\\/gi)) {
      diagnosis.security_score = 0.0;
      diagnosis.violations.push('SECURITY FATAL: Absolute Windows path found in CSS.');
    }

    return diagnosis;
  }
}

module.exports = new CSSAdapter();
