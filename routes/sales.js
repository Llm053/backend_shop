const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Créer une vente
router.post('/', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { customer_name, customer_phone, customer_email, items, notes, total_amount, customer_id, sale_type } = req.body;
    
    // Vérifier que les champs requis sont présents
    if (!customer_name || !items || !total_amount) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants'
      });
    }
    
    // Vérifier que tous les produits ont suffisamment de stock
    for (const item of items) {
      const [product] = await connection.query(
        'SELECT stock_quantity FROM products WHERE id = ?',
        [item.product_id]
      );
      
      if (!product.length) {
        throw new Error(`Produit avec l'ID ${item.product_id} non trouvé`);
      }
      
      if (product[0].stock_quantity < item.quantity) {
        throw new Error(`Stock insuffisant pour le produit ${item.product_id}. Stock disponible: ${product[0].stock_quantity}`);
      }
    }
    
    // Créer la vente (les ventes admin sont automatiquement 'completed', les ventes online sont 'pending')
    const saleStatus = sale_type === 'online' ? 'pending' : 'completed';
    const saleType = sale_type || 'in_store';
    
    const [venteResult] = await connection.query(
      'INSERT INTO sales (customer_name, customer_phone, customer_email, total_amount, notes, user_id, sale_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_name, customer_phone || null, customer_email || null, total_amount, notes || null, req.user.id, saleType, saleStatus]
    );
    
    const venteId = venteResult.insertId;
    
    // Générer et mettre à jour le numéro de vente
    await connection.query(`
      UPDATE sales 
      SET numero_vente = CONCAT('VTE-', DATE_FORMAT(created_at, '%Y%m%d'), '-', LPAD(id, 3, '0'))
      WHERE id = ? AND numero_vente IS NULL
    `, [venteId]);
    
    // Créer les items de vente et mettre à jour le stock
    for (const item of items) {
      // Insérer l'item de vente
      await connection.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [venteId, item.product_id, item.quantity, item.unit_price]
      );
      
      // Créer un mouvement de sortie de stock
      await connection.query(
        'INSERT INTO stock_movements (product_id, type, quantity, reason, user_id) VALUES (?, ?, ?, ?, ?)',
        [item.product_id, 'out', item.quantity, `Vente - ${customer_name}`, req.user.id]
      );
      
      // Mettre à jour le stock du produit
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }
    
    // Mettre à jour les statistiques du client fidèle si c'est un client fidèle
    if (customer_id) {
      const loyaltyPoints = Math.floor(total_amount / 1000); // 1 point par 1000 FCFA
      await connection.query(`
        UPDATE loyal_customers 
        SET 
          total_purchases = total_purchases + 1,
          total_amount = total_amount + ?,
          loyalty_points = loyalty_points + ?,
          last_purchase = CURDATE(),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [total_amount, loyaltyPoints, customer_id]);
    }
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Vente enregistrée avec succès',
      data: { vente_id: venteId }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la création de la vente:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'enregistrement de la vente'
    });
  } finally {
    connection.release();
  }
});

// Récupérer toutes les ventes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [ventes] = await pool.query(`
      SELECT v.*, u.username as created_by_name
      FROM sales v
      LEFT JOIN users u ON v.user_id = u.id
      ORDER BY v.created_at DESC
    `);
    
    // S'assurer que tous les numéros de vente sont générés
    for (let vente of ventes) {
      if (!vente.numero_vente) {
        await pool.query(`
          UPDATE sales 
          SET numero_vente = CONCAT('VTE-', DATE_FORMAT(created_at, '%Y%m%d'), '-', LPAD(id, 3, '0'))
          WHERE id = ?
        `, [vente.id]);
        vente.numero_vente = `VTE-${new Date(vente.created_at).toISOString().slice(0,10).replace(/-/g,'')}-${String(vente.id).padStart(3, '0')}`;
      }
    }
    
    res.json({
      success: true,
      data: { ventes }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des ventes'
    });
  }
});

// Récupérer une vente avec ses items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [vente] = await pool.query(`
      SELECT v.*, u.username as created_by_name
      FROM sales v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.id = ?
    `, [req.params.id]);
    
    if (!vente.length) {
      return res.status(404).json({
        success: false,
        message: 'Vente non trouvée'
      });
    }
    
    const [items] = await pool.query(`
      SELECT vi.*, p.name as product_name
      FROM sale_items vi
      JOIN products p ON vi.product_id = p.id
      WHERE vi.sale_id = ?
    `, [req.params.id]);
    
    res.json({
      success: true,
      data: {
        ...vente[0],
        items
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la vente:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la vente'
    });
  }
});

// Mettre à jour le statut d'une vente
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }
    
    const [result] = await pool.query(
      'UPDATE sales SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vente non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: `Vente ${status === 'completed' ? 'validée' : status === 'cancelled' ? 'annulée' : 'mise à jour'} avec succès`
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du statut'
    });
  }
});

// Annuler une vente
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Récupérer la vente
    const [vente] = await connection.query(
      'SELECT * FROM sales WHERE id = ? AND status = "completed"',
      [req.params.id]
    );
    
    if (!vente.length) {
      throw new Error('Vente non trouvée ou déjà annulée');
    }
    
    // Récupérer les items de la vente
    const [items] = await connection.query(
      'SELECT * FROM sale_items WHERE sale_id = ?',
      [req.params.id]
    );
    
    // Remettre les quantités en stock
    for (const item of items) {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
      
      // Créer un mouvement d'entrée pour annuler la sortie
      await connection.query(
        'INSERT INTO stock_movements (product_id, type, quantity, reason, user_id) VALUES (?, ?, ?, ?, ?)',
        [item.product_id, 'in', item.quantity, `Annulation vente #${req.params.id}`, req.user.id]
      );
    }
    
    // Marquer la vente comme annulée
    await connection.query(
      'UPDATE sales SET status = "cancelled" WHERE id = ?',
      [req.params.id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Vente annulée avec succès'
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de l\'annulation de la vente:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'annulation de la vente'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
