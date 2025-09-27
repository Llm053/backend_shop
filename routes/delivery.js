const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { sendInvoiceEmail } = require('../services/emailService');
const router = express.Router();

// Middleware d'authentification pour livreurs
const authenticateDelivery = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token d\'accès requis' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.deliveryUser = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

// Connexion livreur
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email et mot de passe requis' 
      });
    }

    // Vérifier si l'utilisateur existe
    const [users] = await pool.query(
      'SELECT * FROM delivery_users WHERE email = ? AND status = "active"',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        deliveryUserId: user.id,
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion livreur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la connexion' 
    });
  }
});

// Réinitialisation mot de passe
router.post('/password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email requis' 
      });
    }

    // Vérifier si l'utilisateur existe
    const [users] = await pool.query(
      'SELECT * FROM delivery_users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aucun compte trouvé avec cet email' 
      });
    }

    // TODO: Implémenter l'envoi d'email avec nodemailer
    // Pour l'instant, on simule l'envoi
    console.log(`Email de réinitialisation envoyé à: ${email}`);

    res.json({
      success: true,
      message: 'Email de réinitialisation envoyé'
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Obtenir les commandes pour livraison (Bamako uniquement)
router.get('/orders', authenticateDelivery, async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT o.*, o.numero_commande as order_number
      FROM orders o 
      WHERE o.customer_city = 'Bamako' 
      ORDER BY o.created_at DESC
    `);

    // Récupérer les articles pour chaque commande
    for (let order of orders) {
      const [items] = await pool.query(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }

    res.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Confirmer une livraison
router.put('/orders/:id/deliver', authenticateDelivery, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount_received } = req.body;

    if (!amount_received) {
      return res.status(400).json({ 
        success: false, 
        message: 'Montant récupéré requis' 
      });
    }

    // Récupérer la commande
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Commande non trouvée' 
      });
    }

    const order = orders[0];

    // Vérifier le montant
    if (parseFloat(amount_received) !== parseFloat(order.total_amount)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le montant ne correspond pas au total de la commande' 
      });
    }

    // Marquer comme livrée
    await pool.query(
      'UPDATE orders SET status = "delivered", delivery_date = NOW() WHERE id = ?',
      [id]
    );

    // Envoyer email de facture si le client a un email
    if (order.customer_email) {
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

        // Envoi asynchrone de l'email de facture
        sendInvoiceEmail(orderDataForEmail)
          .then(result => {
            if (result.success) {
              console.log('✅ Email de facture envoyé avec succès');
            } else {
              console.log('⚠️ Erreur envoi email facture:', result.error);
            }
          })
          .catch(err => console.error('Erreur envoi email facture:', err));
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi d\'email de facture:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Livraison confirmée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la confirmation de livraison:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Obtenir le profil du livreur
router.get('/profile', authenticateDelivery, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, phone, created_at FROM delivery_users WHERE id = ?',
      [req.deliveryUser.deliveryUserId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// Mettre à jour le profil du livreur
router.put('/profile', authenticateDelivery, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.deliveryUser.deliveryUserId;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom est requis' 
      });
    }

    await pool.query(
      'UPDATE delivery_users SET name = ?, phone = ?, updated_at = NOW() WHERE id = ?',
      [name, phone || null, userId]
    );

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

module.exports = router;
