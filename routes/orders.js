const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { sendNewOrderNotification, sendOrderValidationEmail, sendInvoiceEmail } = require('../services/emailService');

// Route publique pour créer une commande en ligne (sans authentification)
router.post('/create', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { customer_name, customer_phone, customer_email, customer_address, customer_city, items, notes, total_amount } = req.body;
    
    // Validation des champs requis
    if (!customer_name || !customer_phone || !items || !total_amount) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants (nom, téléphone, articles, montant)'
      });
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un article est requis'
      });
    }
    
    // Vérifier la disponibilité du stock pour tous les produits
    for (const item of items) {
      const [product] = await connection.query(
        'SELECT stock_quantity, name FROM products WHERE id = ?',
        [item.product_id]
      );
      
      if (!product.length) {
        throw new Error(`Produit avec l'ID ${item.product_id} non trouvé`);
      }
      
      if (product[0].stock_quantity < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product[0].name}. Stock disponible: ${product[0].stock_quantity}`);
      }
    }
    
    // Extraire les informations d'adresse depuis les notes
    const addressInfo = notes || '';
    const [address, city] = addressInfo.includes('Adresse:') 
      ? addressInfo.split('Adresse:')[1].split(',').map(s => s.trim())
      : [addressInfo, 'Non spécifiée'];

    // Créer la commande dans la table orders
    const [orderResult] = await connection.query(`
      INSERT INTO orders (
        customer_name, 
        customer_phone, 
        customer_email, 
        customer_address,
        customer_city,
        total_amount, 
        notes,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customer_name, 
      customer_phone, 
      customer_email || null, 
      customer_address || null,
      customer_city || 'Non spécifiée',
      total_amount, 
      notes || null,
      'pending'
    ]);
    
    const orderId = orderResult.insertId;
    
    // Générer et mettre à jour le numéro de commande
    await connection.query(`
      UPDATE orders 
      SET numero_commande = CONCAT('CMD-', DATE_FORMAT(created_at, '%Y%m%d'), '-', LPAD(id, 3, '0'))
      WHERE id = ? AND numero_commande IS NULL
    `, [orderId]);
    
    // Créer les items de commande avec le nom du produit
    for (const item of items) {
      // Récupérer le nom du produit
      const [product] = await connection.query(
        'SELECT name FROM products WHERE id = ?',
        [item.product_id]
      );
      
      await connection.query(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, product[0].name, item.quantity, item.unit_price, item.total_price]);
    }
    
    await connection.commit();
    
    // Envoyer email de notification aux admins/employés
    try {
      // Récupérer les emails des admins et employés
      const [adminUsers] = await connection.execute(`
        SELECT email FROM users 
        WHERE role IN ('admin', 'employee') 
        AND email IS NOT NULL 
        AND email != ''
      `);
      
      if (adminUsers.length > 0) {
        const adminEmails = adminUsers.map(user => user.email);
        const orderDataForEmail = {
          numero_commande,
          customer_name,
          customer_phone,
          customer_email,
          customer_address,
          customer_city,
          total_amount,
          notes,
          items: items.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            total_price: item.total_price
          }))
        };
        
        // Envoi asynchrone de l'email (ne pas bloquer la réponse)
        sendNewOrderNotification(orderDataForEmail, adminEmails)
          .catch(err => console.error('Erreur envoi email nouvelle commande:', err));
      }
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi d\'email:', emailError);
      // Ne pas faire échouer la commande si l'email échoue
    }
    
    res.status(201).json({
      success: true,
      message: 'Commande enregistrée avec succès',
      data: { 
        order_id: orderId,
        status: 'pending',
        message: 'Votre commande sera traitée sous 24h. Vous serez contacté pour la livraison.'
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la création de la commande:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur lors de la création de la commande'
    });
  } finally {
    connection.release();
  }
});

// Route pour vérifier le statut d'une commande (publique)
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [orders] = await pool.query(`
      SELECT 
        o.id,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.customer_address,
        o.customer_city,
        o.total_amount,
        o.status,
        o.created_at,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = ?
      GROUP BY o.id
    `, [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: { order: orders[0] }
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification du statut'
    });
  }
});

// Routes d'administration (avec authentification)

// Obtenir toutes les commandes (pour les admins)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT 
        o.*,
        COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    
    // S'assurer que tous les numéros de commande sont générés
    for (let order of orders) {
      if (!order.numero_commande) {
        await pool.query(`
          UPDATE orders 
          SET numero_commande = CONCAT('CMD-', DATE_FORMAT(created_at, '%Y%m%d'), '-', LPAD(id, 3, '0'))
          WHERE id = ?
        `, [order.id]);
        order.numero_commande = `CMD-${new Date(order.created_at).toISOString().slice(0,10).replace(/-/g,'')}-${String(order.id).padStart(3, '0')}`;
      }
    }
    
    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des commandes'
    });
  }
});

// Obtenir une commande avec ses items
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer la commande
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }
    
    // Récupérer les items
    const [items] = await pool.query(`
      SELECT oi.*, p.description
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);
    
    const order = {
      ...orders[0],
      items
    };
    
    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la commande:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de la commande'
    });
  }
});

// Valider une commande (la transférer vers les ventes)
router.put('/:id/validate', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Récupérer la commande
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? AND status = "pending"', [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée ou déjà traitée'
      });
    }
    
    const order = orders[0];
    
    // Récupérer les items de la commande
    const [orderItems] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    
    // Vérifier le stock avant validation
    for (const item of orderItems) {
      const [product] = await connection.query(
        'SELECT stock_quantity FROM products WHERE id = ?',
        [item.product_id]
      );
      
      if (!product.length || product[0].stock_quantity < item.quantity) {
        throw new Error(`Stock insuffisant pour ${item.product_name}`);
      }
    }
    
    // Créer la vente dans la table sales
    const [saleResult] = await connection.query(`
      INSERT INTO sales (
        customer_name, 
        customer_phone, 
        customer_email, 
        total_amount, 
        notes, 
        user_id,
        sale_type,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      order.customer_name,
      order.customer_phone,
      order.customer_email,
      order.total_amount,
      `Commande en ligne - ${order.customer_city}`,
      req.user.id,
      'online',
      'completed'
    ]);
    
    const saleId = saleResult.insertId;
    
    // Transférer les items et déduire le stock
    for (const item of orderItems) {
      // Créer l'item de vente
      await connection.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [saleId, item.product_id, item.quantity, item.unit_price]
      );
      
      // Créer un mouvement de stock
      await connection.query(
        'INSERT INTO stock_movements (product_id, type, quantity, reason, user_id) VALUES (?, ?, ?, ?, ?)',
        [item.product_id, 'out', item.quantity, `Vente en ligne - ${order.customer_name}`, req.user.id]
      );
      
      // Déduire le stock
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }
    
    // Marquer la commande comme validée
    await connection.query(
      'UPDATE orders SET status = "validated", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: 'Commande validée et transférée vers les ventes',
      data: { sale_id: saleId }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erreur lors de la validation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur serveur lors de la validation'
    });
  } finally {
    connection.release();
  }
});

// Annuler une commande
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.query(
      'UPDATE orders SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = "pending"',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée ou déjà traitée'
      });
    }
    
    res.json({
      success: true,
      message: 'Commande annulée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'annulation'
    });
  }
});

// Route pour chercher une commande par numéro (publique)
router.get('/track/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    // Chercher par numéro de commande
    const [orders] = await pool.query(`
      SELECT * FROM orders WHERE numero_commande = ?
    `, [orderNumber]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }
    
    const order = orders[0];
    
    // Récupérer les articles de la commande
    const [items] = await pool.query(`
      SELECT oi.*, p.name as product_name 
      FROM order_items oi 
      LEFT JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `, [order.id]);
    
    order.items = items;
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Erreur lors du suivi:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour changer le statut d'une commande (admin)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validation du statut
    const validStatuses = ['pending', 'validated', 'cancelled', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    // Mettre à jour le statut
    await pool.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    // Récupérer la commande mise à jour avec les items
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    const order = orders[0];

    // Envoyer email si le statut est "validated"
    if (status === 'validated' && order.customer_email) {
      try {
        // Récupérer les items de la commande
        const [items] = await pool.query(`
          SELECT product_name, quantity, unit_price, total_price 
          FROM order_items 
          WHERE order_id = ?
        `, [id]);

        const orderDataForEmail = {
          numero_commande: order.numero_commande,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_email: order.customer_email,
          customer_address: order.customer_address,
          customer_city: order.customer_city,
          total_amount: order.total_amount,
          notes: order.notes,
          items: items
        };

        // Envoi asynchrone de l'email de validation
        sendOrderValidationEmail(orderDataForEmail)
          .catch(err => console.error('Erreur envoi email validation:', err));
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi d\'email de validation:', emailError);
      }
    }

    res.json({
      success: true,
      message: `Statut de la commande mis à jour vers "${status}"`,
      data: order
    });

  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du changement de statut'
    });
  }
});

module.exports = router;
