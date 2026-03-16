
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configurações do Banco (Tenta localhost e o host do .env)
const config = {
  user: process.env.DB_USER,
  host: 'localhost', // Tenta local primeiro
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
};

async function fixAdmin() {
  let pool = new Pool(config);
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.log('Tentando host do .env...');
    config.host = process.env.DB_HOST;
    pool = new Pool(config);
  }

  try {
    const email = 'sjwseo@gmail.com';
    const tempPass = 'admin123';
    const hash = await bcrypt.hash(tempPass, 10);

    console.log(`Verificando usuário: ${email}`);
    
    // 1. Verificar se usuário existe
    const userRes = await pool.query('SELECT id_usuario FROM trusted.tb_usuarios WHERE dsc_email = $1', [email]);
    
    if (userRes.rows.length > 0) {
      console.log('Usuário encontrado. Atualizando senha e status de admin...');
      await pool.query(
        'UPDATE trusted.tb_usuarios SET dsc_senha_hash = $1, flg_admin = true, vlr_status_conta = $2 WHERE dsc_email = $3',
        [hash, 'ativo', email]
      );
      console.log('✅ Usuário ATUALIZADO com sucesso!');
    } else {
      console.log('Usuário não encontrado. Criando novo registro administrativo...');
      const newRes = await pool.query(
        'INSERT INTO trusted.tb_usuarios (dsc_email, dsc_senha_hash, flg_admin, vlr_status_conta) VALUES ($1, $2, true, $3) RETURNING id_usuario',
        [email, hash, 'ativo']
      );
      const newId = newRes.rows[0].id_usuario;
      
      // Criar perfil básico para evitar erro de JOIN no /api/me
      await pool.query(
        'INSERT INTO trusted.tb_membros_perfil (id_usuario, dsc_nome_completo, dsc_nivel_tecnico) VALUES ($1, $2, $3)',
        [newId, 'Admin Sergio', 'Avançado']
      );
      console.log('✅ Novo usuário ADMIN CRIADO com sucesso!');
    }
    
    console.log('\n--- RESULTADO ---');
    console.log(`E-mail: ${email}`);
    console.log(`Senha Temporária: ${tempPass}`);
    console.log('------------------');
    console.log('AVISO: Após rodar este script, tente logar com as credenciais acima.');

  } catch (err) {
    console.error('❌ ERRO AO EXECUTAR SCRIPT:', err.message);
  } finally {
    await pool.end();
  }
}

fixAdmin();
