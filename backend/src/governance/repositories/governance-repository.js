/**
 * BOLT Governance Repository (Fase 6 - Elite Persistence v1.0)
 * 
 * Responsável por persistir e recuperar Manifestos e Estados de Execução.
 * 
 * Tabelas gerenciadas:
 *  - bolt_manifests: Planos e resultados finais de deliberação (v2.16).
 *  - bolt_executions: Estado de execução em tempo real, step-a-step.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class GovernanceRepository {

  // ──────────────────────────────────────────────
  // DDL: Inicialização das Tabelas e Índices
  // ──────────────────────────────────────────────

  static async initialize() {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS bolt_manifests (
          execution_id    UUID PRIMARY KEY,
          contract_version TEXT NOT NULL,
          status          TEXT NOT NULL,
          tags            TEXT[],
          manifest        JSONB NOT NULL,
          created_at      TIMESTAMP DEFAULT NOW(),
          updated_at      TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS bolt_executions (
          execution_id    UUID REFERENCES bolt_manifests(execution_id) ON DELETE CASCADE,
          current_step    INTEGER DEFAULT 0,
          status          TEXT NOT NULL DEFAULT 'pending',
          logs            JSONB DEFAULT '[]'::jsonb,
          checkpoints     JSONB DEFAULT '[]'::jsonb,
          lock_acquired_at TIMESTAMP,
          lock_expires_at TIMESTAMP,
          started_at      TIMESTAMP DEFAULT NOW(),
          updated_at      TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (execution_id)
        );

        -- Índices de Performance
        CREATE INDEX IF NOT EXISTS idx_bolt_status ON bolt_manifests(status);
        CREATE INDEX IF NOT EXISTS idx_bolt_created_at ON bolt_manifests(created_at);
        CREATE INDEX IF NOT EXISTS idx_bolt_tags ON bolt_manifests USING GIN (tags);
        CREATE INDEX IF NOT EXISTS idx_bolt_exec_status ON bolt_executions(status);
      `);
      console.log('[BOLT:REPO] Tables and indexes initialized successfully.');
    } finally {
      client.release();
    }
  }

  // ──────────────────────────────────────────────
  // bolt_manifests: CRUD
  // ──────────────────────────────────────────────

  /**
   * Persiste um Manifesto Final (v2.16) no banco.
   * @param {string} id - UUID / execution_id
   * @param {object} manifest - O Master Manifest completo
   * @param {string[]} tags - Tags de contexto para busca (ex: ['auth', 'database'])
   */
  static async saveManifest(id, manifest, tags = []) {
    const { status, decision_metrics } = manifest;
    const version = 'v2.16';
    await pool.query(
      `INSERT INTO bolt_manifests (execution_id, contract_version, status, tags, manifest)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (execution_id) DO UPDATE SET
         status = EXCLUDED.status,
         manifest = EXCLUDED.manifest,
         updated_at = NOW()`,
      [id, version, status, tags, JSON.stringify(manifest)]
    );
    console.log(`[BOLT:REPO] Manifesto persistido: ${id} | Status: ${status} | Confidence: ${decision_metrics?.confidence}`);
  }

  static async getManifest(id) {
    const { rows } = await pool.query('SELECT * FROM bolt_manifests WHERE execution_id = $1', [id]);
    return rows[0] || null;
  }

  static async filterByStatus(status) {
    const { rows } = await pool.query('SELECT * FROM bolt_manifests WHERE status = $1 ORDER BY created_at DESC', [status]);
    return rows;
  }

  static async filterByTag(tag) {
    const { rows } = await pool.query('SELECT * FROM bolt_manifests WHERE $1 = ANY(tags) ORDER BY created_at DESC', [tag]);
    return rows;
  }

  static async getHistory(limit = 20) {
    const { rows } = await pool.query('SELECT * FROM bolt_manifests ORDER BY created_at DESC LIMIT $1', [limit]);
    return rows;
  }

  // ──────────────────────────────────────────────
  // bolt_executions: Runtime State
  // ──────────────────────────────────────────────

  static async createExecution(id) {
    await pool.query(
      `INSERT INTO bolt_executions (execution_id, status) VALUES ($1, 'pending')
       ON CONFLICT (execution_id) DO NOTHING`,
      [id]
    );
  }

  static async updateExecutionStep(id, step, status, logEntry, checkpoint = null) {
    const client = await pool.connect();
    try {
      await client.query(`
        UPDATE bolt_executions SET
          current_step = $2,
          status       = $3,
          logs         = logs || $4::jsonb,
          checkpoints  = CASE WHEN $5::jsonb IS NOT NULL THEN checkpoints || $5::jsonb ELSE checkpoints END,
          updated_at   = NOW()
        WHERE execution_id = $1
      `, [id, step, status, JSON.stringify([logEntry]), checkpoint ? JSON.stringify([checkpoint]) : null]);
    } finally {
      client.release();
    }
  }

  static async completeExecution(id, finalStatus) {
    await pool.query(
      `UPDATE bolt_executions SET status = $2, updated_at = NOW() WHERE execution_id = $1`,
      [id, finalStatus]
    );
  }

  // ──────────────────────────────────────────────
  // Distributed Lock com Heartbeat Renewal
  // ──────────────────────────────────────────────

  /**
   * Adquire um lock exclusivo por execution_id.
   * @param {string} id - execution_id
   * @param {number} ttlSeconds - Duração inicial do lock (default 30s).
   * @returns {boolean} - true se lock adquirido, false se já travado.
   */
  static async acquireLock(id, ttlSeconds = 30) {
    const result = await pool.query(`
      UPDATE bolt_executions SET
        lock_acquired_at = NOW(),
        lock_expires_at  = NOW() + INTERVAL '${ttlSeconds} seconds',
        updated_at       = NOW()
      WHERE execution_id = $1
        AND (lock_expires_at IS NULL OR lock_expires_at < NOW())
      RETURNING execution_id
    `, [id]);
    return result.rowCount > 0;
  }

  /** Renova o lock em 30s adicionais (Heartbeat Renewal). */
  static async renewLock(id, extensionSeconds = 30) {
    await pool.query(`
      UPDATE bolt_executions
      SET lock_expires_at = NOW() + INTERVAL '${extensionSeconds} seconds',
          updated_at = NOW()
      WHERE execution_id = $1
    `, [id]);
  }

  /** Libera o lock ao finalizar a execução. */
  static async releaseLock(id) {
    await pool.query(`
      UPDATE bolt_executions
      SET lock_acquired_at = NULL, lock_expires_at = NULL, updated_at = NOW()
      WHERE execution_id = $1
    `, [id]);
  }
}

module.exports = GovernanceRepository;
