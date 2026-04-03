/**
 * BOLT: SQL Adapter (v9.8 Elite)
 * 
 * Especialista em auditoria de segurança e integridade de banco de dados.
 * ⚛️💾🔐
 */

class SQLAdapter {
  constructor() {
    this.name = 'SQL_ELITE_ADAPTER';
    this.version = '1.0.0';
    
    // Pesos do Health Score (Foco total em Segurança)
    this.weights = {
      syntax: 0.3,
      security: 0.6,
      style: 0.1
    };

    // Blacklist de Comandos Destrutivos (Security Enforcement)
    this.destructive = ['DROP ', 'TRUNCATE ', 'DELETE ', 'UPDATE '];
  }

  /**
   * Executa a auditoria completa do arquivo SQL.
   * @param {string} content - Conteúdo do rascunho SQL.
   * @returns {Object} Diagnóstico de saúde.
   */
  async validate(content) {
    const diagnosis = {
      syntax_score: 1.0,
      security_score: 1.0,
      style_score: 1.0,
      violations: [],
      auto_fixes: []
    };

    const sql = content.toUpperCase();

    // 1. Validação de Segurança Mandatória (WHERE Clause Enforcement)
    if (sql.includes('DELETE ') || sql.includes('UPDATE ')) {
      if (!sql.includes(' WHERE ')) {
        diagnosis.security_score = 0.0;
        diagnosis.violations.push('SECURITY_FATAL: DELETE or UPDATE command without WHERE clause detected!');
      }
    }

    // 2. Bloqueio de DDL não autorizado
    if (sql.includes('DROP ') || sql.includes('TRUNCATE ')) {
      diagnosis.security_score = 0.0;
      diagnosis.violations.push('SECURITY_FATAL: DDL commands (DROP/TRUNCATE) are forbidden via standard pipeline.');
    }

    // 3. Validação de Sintaxe Básica (Ponto e Vírgula)
    if (!content.trim().endsWith(';')) {
        diagnosis.syntax_score = 0.8;
        diagnosis.violations.push('SYNTAX_WARNING: SQL command should end with a semicolon (;)');
        
        // AUTO-FIX: Adicionar ponto e vírgula se faltar
        diagnosis.auto_fixes.push({
            type: 'syntax',
            action: 'add_semicolon',
            confidence: 0.99,
            content: content.trim() + ';'
        });
    }

    return diagnosis;
  }
}

module.exports = new SQLAdapter();
