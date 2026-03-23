CREATE TABLE IF NOT EXISTS governance.process_logs (
    id SERIAL PRIMARY KEY,
    process_name TEXT NOT NULL,
    step_name TEXT,
    status TEXT NOT NULL, -- 'WORKING', 'SUCCESS', 'FAIL'
    progress INTEGER DEFAULT 0,
    metadata JSONB,
    dt_started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dt_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_process_name ON governance.process_logs(process_name);
CREATE INDEX IF NOT EXISTS idx_dt_updated ON governance.process_logs(dt_updated);
