const pool = require('./backend/src/config/db');

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'raw' AND table_name = 'tb_perfil_atualizacoes'
        `);
        console.log('--- COLUNAS DE raw.tb_perfil_atualizacoes ---');
        res.rows.forEach(row => console.log(`- ${row.column_name}`));
        console.log('---------------------------------------------');
    } catch (err) {
        console.error('Erro ao ler colunas:', err.message);
    } finally {
        process.exit();
    }
}

checkSchema();
