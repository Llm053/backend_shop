const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { canManageUsers } = require('../middleware/permissions');

const router = express.Router();

// Middleware pour vérifier les permissions admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }
  next();
};

// Obtenir tous les utilisateurs (admin seulement)
router.get('/', authenticateToken, canManageUsers, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT id, username as name, email, phone, role, created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
});

// Obtenir un utilisateur par ID
router.get('/:id', authenticateToken, canManageUsers, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await pool.query(`
      SELECT id, username as name, email, phone, role, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: { user: users[0] }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
});

// Créer un nouvel utilisateur (admin seulement)
router.post('/', authenticateToken, canManageUsers, async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Validation des données
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email, mot de passe et rôle sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Valider le rôle
    const validRoles = ['admin', 'employee', 'delivery'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const [result] = await pool.query(`
      INSERT INTO users (username, email, password, role, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [name, email, hashedPassword, role, phone || null]);

    // Récupérer l'utilisateur créé
    const [newUser] = await pool.query(`
      SELECT id, username as name, email, phone, role, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: { user: newUser[0] }
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    console.error('Données reçues:', { name, email, role, phone });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
});

// Mettre à jour un utilisateur (admin seulement)
router.put('/:id', authenticateToken, canManageUsers, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, phone } = req.body;

    // Vérifier si l'utilisateur existe
    const [existingUsers] = await pool.query(
      'SELECT id, email FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email && email !== existingUsers[0].email) {
      const [emailCheck] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (emailCheck.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
    }

    // Valider le rôle
    if (role) {
      const validRoles = ['admin', 'employee', 'delivery'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Rôle invalide'
        });
      }
    }

    // Préparer les données de mise à jour
    let updateQuery = `
      UPDATE users 
      SET username = ?, email = ?, role = ?, phone = ?, updated_at = NOW()
    `;
    let updateParams = [name, email, role, phone || null];

    // Ajouter le mot de passe s'il est fourni
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      updateParams.push(hashedPassword);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await pool.query(updateQuery, updateParams);

    // Récupérer l'utilisateur mis à jour
    const [updatedUser] = await pool.query(`
      SELECT id, username as name, email, phone, role, created_at, updated_at 
      FROM users 
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: { user: updatedUser[0] }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'utilisateur'
    });
  }
});

// Supprimer un utilisateur (admin seulement)
router.delete('/:id', authenticateToken, canManageUsers, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur existe
    const [existingUsers] = await pool.query(
      'SELECT id, email FROM users WHERE id = ?',
      [id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suppression de son propre compte
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Supprimer l'utilisateur
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
});

// Obtenir les statistiques des utilisateurs
router.get('/stats/overview', authenticateToken, canManageUsers, async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'employee' THEN 1 END) as employee_count,
        COUNT(CASE WHEN role = 'delivery' THEN 1 END) as delivery_count
      FROM users
    `);

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
});

module.exports = router;