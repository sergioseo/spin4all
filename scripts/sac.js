/**
 * SPIN4ALL - Admin Control (SAC) v1.0
 * CLI modular para operações de governança e saneamento.
 * Protocolo BOLT: Segurança, Rastreabilidade e Rollback.
 */

require('dotenv').config({ path: './backend/.env' });
const fs = require('fs');
const path = require('path');
const pool = require('../backend/src/config/db');

// Configs
const SNAPSHOT_DIR = path.join(__dirname, '../backup/sac_snapshots');

// --- LOGGER ---
const log = (msg, type = 'INFO') => {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${type}] ${msg}`;
    console.log(formatted);
    // TODO: Append to file logs/sac.log
};

// --- INITIALIZATION ---
const init = () => {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
        fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
        log(`Diretório de snapshots criado: ${SNAPSHOT_DIR}`);
    }
};

// --- COMMANDS ---

/**
 * DB:AUDIT - Lista estado atual de usuários e dependências
 */
const dbAudit = async () => {
    log('Iniciando auditoria de banco de dados...');
    try {
        const users = await pool.query('SELECT id_usuario, dsc_email, flg_admin FROM trusted.tb_usuarios ORDER BY id_usuario');
        const profiles = await pool.query('SELECT count(*) FROM trusted.tb_membros_perfil');
        
        console.log('\n--- RELATÓRIO DE AUDITORIA ---');
        console.table(users.rows);
        log(`Total de Perfis Ativos: ${profiles.rows[0].count}`);
        
        // Verificar orfãos (Perfis sem Usuários)
        const orphans = await pool.query('SELECT p.id_usuario FROM trusted.tb_membros_perfil p LEFT JOIN trusted.tb_usuarios u ON p.id_usuario = u.id_usuario WHERE u.id_usuario IS NULL');
        if (orphans.rowCount > 0) {
            log(`⚠️ ALERTA: Encontrados ${orphans.rowCount} perfis órfãos!`, 'WARNING');
        } else {
            log('Integridade Refencial: OK');
        }
        
    } catch (err) {
        log(`Erro na auditoria: ${err.message}`, 'ERROR');
    }
};

/**
 * DB:PURGE - Limpeza de fakes com SNAPSHOT e ROLLBACK capability
 */
const dbPurge = async (confirm = false) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'sjwseo@gmail.com';
    log(`Iniciando purga de registros (Blindando: ${adminEmail})...`);
    
    if (!confirm) {
        log('--- MODO DRY-RUN ATIVADO (Nenhuma alteração real) ---', 'WARNING');
    }

    const client = await pool.connect();
    try {
        // 1. Snapshot de Segurança
        const snapshotId = `snapshot_${Date.now()}.json`;
        const snapshotPath = path.join(SNAPSHOT_DIR, snapshotId);
        
        log(`Gerando snapshot de segurança: ${snapshotId}...`);
        const fullState = await client.query('SELECT * FROM trusted.tb_usuarios');
        fs.writeFileSync(snapshotPath, JSON.stringify(fullState.rows, null, 2));
        log(`Snapshot salvo com sucesso.`);

        // 2. Transação
        await client.query('BEGIN');

        // Identificar Admin
        const adminRes = await client.query('SELECT id_usuario FROM trusted.tb_usuarios WHERE dsc_email = $1', [adminEmail]);
        if (adminRes.rows.length === 0) throw new Error('Admin base não encontrado.');
        const adminId = adminRes.rows[0].id_usuario;

        // Tabelas Dependes (Mapeadas via Discovery)
        const tables = [
            'raw.tb_checkins_raw', 'raw.tb_perfil_atualizacoes', 'trusted.tb_recuperacao_senha',
            'trusted.tb_usuarios_badges', 'trusted.tb_diagnostico_historico', 'trusted.tb_missoes_usuario',
            'trusted.tb_historico_maestria', 'trusted.tb_checkins', 'trusted.tb_analista_torneio_partidas',
            'trusted.tb_analise_cache', 'trusted.tb_membros_evolucao', 'trusted.tb_membros_perfil',
            'trusted.tb_torneios_resultados', 'trusted.tb_usuarios_metas_historico', 'trusted.tb_torneios_inscritos'
        ];

        let totalDeleted = 0;
        for (const table of tables) {
            const res = await client.query(`DELETE FROM ${table} WHERE id_usuario != $1`, [adminId]);
            totalDeleted += res.rowCount;
            log(`   - ${table}: ${res.rowCount} removidos.`);
        }

        // Partidas (FK dupla)
        const resPartidas = await client.query('DELETE FROM trusted.tb_torneios_partidas WHERE id_jogador1 != $1 OR id_jogador2 != $1', [adminId]);
        totalDeleted += resPartidas.rowCount;

        const resUsers = await client.query('DELETE FROM trusted.tb_usuarios WHERE id_usuario != $1', [adminId]);
        totalDeleted += resUsers.rowCount;

        if (confirm) {
            await client.query('COMMIT');
            log(`PURGA CONCLUÍDA: ${totalDeleted} registros eliminados com sucesso.`, 'SUCCESS');
        } else {
            await client.query('ROLLBACK');
            log('Dry-run finalizado. ROLLBACK automático executado conforme protocolo.', 'INFO');
            log('Para executar real, use: node scripts/sac.js db:purge --confirm', 'TIP');
        }

    } catch (err) {
        await client.query('ROLLBACK');
        log(`FALHA NA OPERAÇÃO: ${err.message}`, 'ERROR');
        log('ROLLBACK executado. Nada foi alterado.', 'INFO');
    } finally {
        client.release();
    }
};

/**
 * SYS:CLEANUP - Remove arquivos temporários de desenvolvimento
 */
const sysCleanup = () => {
    log('Iniciando saneamento de arquivos temporários...');
    const tempFiles = [
        'tmp_purge_script.js',
        'discover_constraints.js',
        'audit_users.js'
    ];

    tempFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            log(`Arquivo removido: ${file}`, 'SUCCESS');
        } else {
            log(`Arquivo não encontrado (já limpo): ${file}`, 'INFO');
        }
    });
};

// --- CLI ROUTING ---
const main = async () => {
    init();
    const command = process.argv[2];
    const args = process.argv.slice(3);

    switch (command) {
        case 'db:audit':
            await dbAudit();
            break;
        case 'db:purge':
            const isConfirm = args.includes('--confirm');
            await dbPurge(isConfirm);
            break;
        case 'sys:cleanup':
            sysCleanup();
            break;
        case 'help':
        default:
            console.log('\n--- SPIN4ALL ADMIN CONTROL (SAC) ---');
            console.log('Comandos:');
            console.log('  db:audit             - Auditoria de integridade e usuários');
            console.log('  db:purge [--confirm] - Remove usuários fakes (Snapshot automático)');
            console.log('  sys:cleanup          - Remove arquivos temporários da raiz');
            break;
    }
    process.exit(0);
};

main();
