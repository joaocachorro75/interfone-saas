const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../database');
const router = express.Router();

// POST /api/ramais/gerar - Gera ramais automaticamente
router.post('/gerar', async (req, res) => {
  try {
    const { condominio_id, torre_id, andares, aptos_por_andar, torre_codigo } = req.body;
    
    // Pega o ultimo ramal usado
    const [lastRamal] = await query(
      'SELECT MAX(ramal_numero) as max_ramal FROM apartamentos WHERE condominio_id = ?',
      [condominio_id]
    );
    
    let proximoRamal = lastRamal[0].max_ramal || 1000;
    if (proximoRamal < 1000) proximoRamal = 1000;
    
    const apartamentos = [];
    
    for (let andar = 1; andar <= andares; andar++) {
      for (let apto = 1; apto <= aptos_por_andar; apto++) {
        proximoRamal++;
        const numeroApto = `${torre_codigo || 'T1'}${andar}0${apto}`.slice(-4);
        const senhaRamal = Math.random().toString(36).substring(2, 8);
        
        const [result] = await query(
          `INSERT INTO apartamentos 
           (condominio_id, torre_id, numero, andar, ramal_numero, ramal_senha)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [condominio_id, torre_id, numeroApto, andar, proximoRamal, senhaRamal]
        );
        
        apartamentos.push({
          id: result.insertId,
          numero: numeroApto,
          ramal: proximoRamal,
          senha: senhaRamal
        });
      }
    }
    
    res.json({
      criados: apartamentos.length,
      apartamentos
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ramais/condominio/:condo_id - Lista ramais
router.get('/condominio/:condo_id', async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT a.*, t.nome as torre_nome 
       FROM apartamentos a 
       LEFT JOIN torres t ON a.torre_id = t.id
       WHERE a.condominio_id = ?
       ORDER BY a.ramal_numero`,
      [req.params.condo_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ramais - Cria ramal manual
router.post('/', async (req, res) => {
  try {
    const { condominio_id, torre_id, numero, morador_nome, morador_telefone } = req.body;
    
    // Gera ramal automatico
    const [last] = await query(
      'SELECT MAX(ramal_numero) as max FROM apartamentos WHERE condominio_id = ?',
      [condominio_id]
    );
    const ramal = (last[0].max || 1000) + 1;
    const senha = Math.random().toString(36).substring(2, 8);
    
    const [result] = await query(
      `INSERT INTO apartamentos 
       (condominio_id, torre_id, numero, morador_nome, morador_telefone, 
        ramal_numero, ramal_senha)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [condominio_id, torre_id, numero, morador_nome, morador_telefone, ramal, senha]
    );
    
    res.status(201).json({
      id: result.insertId,
      ramal,
      senha,
      numero
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/ramais/:id - Atualiza
router.put('/:id', async (req, res) => {
  try {
    const { morador_nome, morador_email, morador_telefone, ramal_ativo } = req.body;
    
    await query(
      `UPDATE apartamentos SET 
       morador_nome = ?, morador_email = ?, morador_telefone = ?, ramal_ativo = ?
       WHERE id = ?`,
      [morador_nome, morador_email, morador_telefone, ramal_ativo, req.params.id]
    );
    
    res.json({ message: 'Ramal atualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ramais/:id/config-sip - Config para Zoiper
router.get('/:id/config-sip', async (req, res) => {
  try {
    const [rows] = await query(
      `SELECT a.ramal_numero, a.ramal_senha, c.sip_domain, c.sip_port
       FROM apartamentos a
       JOIN condominios c ON a.condominio_id = c.id
       WHERE a.id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ramal nao encontrado' });
    }
    
    const r = rows[0];
    res.json({
      display_name: `Apto ${r.ramal_numero}`,
      user_name: r.ramal_numero,
      password: r.ramal_senha,
      domain: r.sip_domain,
      port: r.sip_port,
      transport: 'UDP',
      // Config Zoiper direta
      zoiper_url: `zoiper://${r.ramal_numero}:${r.ramal_senha}@${r.sip_domain}:${r.sip_port}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
