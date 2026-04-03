/**
 * BOLT: Asset Adapter (v12.1 Elite)
 * 
 * Detector de Integridade de Recursos (Mídias/Arquivos).
 * Realiza o check físico de existência e validação de URL.
 * ⚛️🛡️📸
 */

const fs = require('fs');
const path = require('path');

class AssetAdapter {
  constructor() {
    this.name = 'ASSET_ADAPTER';
    this.version = '1.0.0';
    
    // Configurações de Domínio de Ativos
    this.asset_root = path.join(process.cwd(), 'public', 'assets');
    this.trusted_domains = ['spin4all.com', 'storage.googleapis.com', 'images.unsplash.com'];
  }

  /**
   * Valida recursos referenciados no conteúdo.
   * @param {string} content - Conteúdo do arquivo (SQL/JS).
   * @returns {Object} Diagnóstico de Integridade.
   */
  validate(content) {
    const assets = this._extractAssets(content);
    const violations = [];
    let score = 1.0;

    for (const asset of assets) {
      const isUrl = this._isUrl(asset);
      
      if (isUrl) {
        if (!this._isTrustedUrl(asset)) {
          violations.push(`ASSET_UNTRUSTED: URL source "${asset}" is not in whitelist.`);
          score -= 0.3;
        }
      } else {
        // Check físico de arquivo local
        if (!this._existsLocal(asset)) {
          violations.push(`ASSET_MISSING: Physical file "${asset}" not found in storage.`);
          score -= 0.5;
        }
      }
    }

    return {
      adapter: this.name,
      score: Math.max(0, score),
      status: score < 1.0 ? 'warning' : 'success',
      passed: score >= 0.7, // Média mínima para ativos
      violations
    };
  }

  _extractAssets(content) {
    // Regex para pegar strings que parecem arquivos (extensões comuns)
    const regex = /'([^']+\.(jpg|jpeg|png|gif|svg|webp|pdf|mp4))'/gi;
    const matches = [];
    let m;
    while ((m = regex.exec(content)) !== null) {
      matches.push(m[1]);
    }
    return matches;
  }

  _isUrl(str) {
    return /^https?:\/\//i.test(str);
  }

  _isTrustedUrl(url) {
    return this.trusted_domains.some(domain => url.includes(domain));
  }

  _existsLocal(assetPath) {
    // Se for apenas o nome do arquivo, assume diretório de uploads/avatars
    const fullPath = path.isAbsolute(assetPath) 
      ? assetPath 
      : path.join(this.asset_root, 'avatars', assetPath); // Padrão: avatars/

    return fs.existsSync(fullPath);
  }
}

module.exports = new AssetAdapter();
