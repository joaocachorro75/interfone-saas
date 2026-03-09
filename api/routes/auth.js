const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-test';

// POST /api/auth/login - Login de admin
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    const [users] = await query(
      'SELECT * FROM admins WHERE email = ? AND ativo = 1',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const user = users[0];
    const valid = await bcrypt.compare(senha, user.senha);
    
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, tipo: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: { id: user.id, nome: user.nome, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login-condominio - Login de morador/porteiro
router.post('/login-condominio', async (req, res) => {
  try {
    const { subdomain, email, senha } = req.body;
    
    const [users] = await query(
      `SELECT u.*, c.id as condo_id, c.nome as condo_nome 
       FROM usuarios u 
       JOIN condominios c ON u.condominio_id = c.id
       WHERE c.subdomain = ? AND u.email = ? AND u.ativo = 1`,
      [subdomain, email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const user = users[0];
    const valid = await bcrypt.compare(senha, user.senha);
    
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    const token = jwt.sign(
      { id: user.id, condo_id: user.condo_id, tipo: user.tipo },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        ramal: user.ramal_numero,
        condominio: user.condo_nome
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
