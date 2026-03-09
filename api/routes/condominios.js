const express = require('express');
const { query } = require('../database');
const router = express.Router();

// GET /api/condominios - Lista todos
router.get('/', async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT id, subdomain, nome, cidade, estado, status, data_criacao FROM condominios ORDER BY data_criacao DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/condominios/:id - Detalhes
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT * FROM condominios WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Condominio nao encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/condominios - Cria novo
router.post('/', async (req, res) => {
  try {
    const {
      subdomain, nome, endereco, cidade, estado, cep,
      admin_nome, admin_email, admin_telefone,
      sip_domain, ramal_base = 1000
    } = req.body;
    
    const [result] = await query(
      `INSERT INTO condominios 
       (subdomain, nome, endereco, cidade, estado, cep, 
        admin_nome, admin_email, admin_telefone,
        sip_domain, ramal_base)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [subdomain, nome, endereco, cidade, estado, cep,
       admin_nome, admin_email, admin_telefone,
       sip_domain || `${subdomain}.interfone.local`, ramal_base]
    );
    
    // Cria config padrao
    await query(
      'INSERT INTO configuracoes (condominio_id) VALUES (?)',
      [result.insertId]
    );
    
    res.status(201).json({
      id: result.insertId,
      subdomain,
      nome,
      message: 'Condominio criado com sucesso'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Subdomain ja existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/condominios/:id - Atualiza
router.put('/:id', async (req, res) => {
  try {
    const { nome, admin_nome, admin_email, status } = req.body;
    
    await query(
      'UPDATE condominios SET nome = ?, admin_nome = ?, admin_email = ?, status = ? WHERE id = ?',
      [nome, admin_nome, admin_email, status, req.params.id]
    );
    
    res.json({ message: 'Condominio atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/condominios/:id - Remove
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM condominios WHERE id = ?', [req.params.id]);
    res.json({ message: 'Condominio removido' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
