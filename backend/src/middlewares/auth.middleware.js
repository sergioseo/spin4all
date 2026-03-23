const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Token não fornecido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
};

const isAdmin = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT flg_admin FROM trusted.tb_usuarios WHERE id_usuario = $1', [req.user.id]);
    if (result.rows.length > 0 && result.rows[0].flg_admin) {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Acesso negado. Apenas administradores.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao verificar privilégios.' });
  }
};

module.exports = {
  authenticateToken,
  isAdmin,
};
