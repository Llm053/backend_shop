const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Middleware d'authentification pour toutes les routes
router.use(authenticateToken);

// Rechercher des clients fidèles (DOIT être avant les routes avec paramètres)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }
    
    const searchTerm = `%${q}%`;
    const [customers] = await pool.query(`
      SELECT * FROM loyal_customers 
      WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
      ORDER BY loyalty_points DESC
    `, [searchTerm, searchTerm, searchTerm]);
    
    res.json({
      success: true,
      data: { customers }
    });
  } catch (error) {
    console.error('Erreur lors de la recherche des clients fidèles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la recherche des clients fidèles'
    });
  }
});

// Obtenir tous les clients fidèles
router.get('/', async (req, res) => {
  try {
    const [customers] = await pool.query(`
      SELECT * FROM loyal_customers 
      ORDER BY loyalty_points DESC, last_purchase DESC
    `);
    
    res.json({
      success: true,
      data: { customers }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des clients fidèles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des clients fidèles'
    });
  }
});

// Obtenir un client fidèle par ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [customers] = await pool.query(
      'SELECT * FROM loyal_customers WHERE id = ?',
      [id]
    );
    
    if (customers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client fidèle non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: { customer: customers[0] }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du client fidèle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération du client fidèle'
    });
  }
});

// Créer un nouveau client fidèle
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    
    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et le téléphone sont requis'
      });
    }
    
    const [result] = await pool.query(`
      INSERT INTO loyal_customers (name, phone, email, address) 
      VALUES (?, ?, ?, ?)
    `, [name, phone, email || null, address || null]);
    
    res.status(201).json({
      success: true,
      message: 'Client fidèle créé avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Erreur lors de la création du client fidèle:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Un client avec ce téléphone ou cet email existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du client fidèle'
    });
  }
});

// Mettre à jour un client fidèle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;
    
    // Vérifier si le client existe
    const [existingCustomers] = await pool.query(
      'SELECT id FROM loyal_customers WHERE id = ?',
      [id]
    );
    
    if (existingCustomers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client fidèle non trouvé'
      });
    }
    
    await pool.query(`
      UPDATE loyal_customers 
      SET name = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, phone, email || null, address || null, id]);
    
    res.json({
      success: true,
      message: 'Client fidèle mis à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client fidèle:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Un client avec ce téléphone ou cet email existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du client fidèle'
    });
  }
});

// Supprimer un client fidèle
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      'DELETE FROM loyal_customers WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client fidèle non trouvé'
      });
    }
    
    res.json({
      success: true,
      message: 'Client fidèle supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du client fidèle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du client fidèle'
    });
  }
});

// Mettre à jour les statistiques d'un client après un achat
router.put('/:id/purchase', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, points } = req.body;
    
    await pool.query(`
      UPDATE loyal_customers 
      SET 
        total_purchases = total_purchases + 1,
        total_amount = total_amount + ?,
        loyalty_points = loyalty_points + ?,
        last_purchase = CURDATE(),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [amount || 0, points || Math.floor(amount / 1000), id]);
    
    res.json({
      success: true,
      message: 'Statistiques du client mises à jour'
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour des statistiques'
    });
  }
});

module.exports = router;