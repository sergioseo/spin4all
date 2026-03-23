const pool = require('../../config/db');

/**
 * ProcessMonitor
 * Utility to log and track the progress of long-running background processes.
 */
class ProcessMonitor {
    /**
     * Start a new process log entry
     * @returns {Promise<number>} - The log ID
     */
    static async start(processName, stepName = 'Initializing') {
        const res = await pool.query(
            `INSERT INTO governance.process_logs (process_name, step_name, status, progress)
             VALUES ($1, $2, 'WORKING', 0)
             RETURNING id`,
            [processName, stepName]
        );
        return res.rows[0].id;
    }

    /**
     * Update progress of an existing process
     */
    static async update(id, stepName, progress, metadata = null) {
        await pool.query(
            `UPDATE governance.process_logs 
             SET step_name = $1, progress = $2, metadata = $3, dt_updated = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [stepName, progress, metadata ? JSON.stringify(metadata) : null, id]
        );
    }

    /**
     * Mark a process as finished (Success or Fail)
     */
    static async finish(id, status, metadata = null) {
        await pool.query(
            `UPDATE governance.process_logs 
             SET status = $1, progress = 100, metadata = $2, dt_updated = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [status, metadata ? JSON.stringify(metadata) : null, id]
        );
    }
}

module.exports = ProcessMonitor;
