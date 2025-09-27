const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Obtenir les paramètres de l'entreprise (route publique)
router.get('/settings', async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM company_settings ORDER BY id DESC LIMIT 1');
    
    if (settings.length === 0) {
      // Retourner les valeurs par défaut si aucune donnée
      return res.json({
        success: true,
        data: {
          name: 'STOCK SHOP MALI',
          phone: '+223 70 XX XX XX',
          email: 'contact@stockshop.ml',
          address: 'Bamako, Mali',
          website: 'www.stockshop.ml',
          description: 'Votre partenaire de confiance pour tous vos besoins en électronique et accessoires',
          primary_color: '#3b82f6',
          secondary_color: '#10b981',
          accent_color: '#f59e0b',
          dark_mode: false
        }
      });
    }

    res.json({
      success: true,
      data: settings[0]
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Mettre à jour les paramètres de l'entreprise (admin uniquement)
router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      website,
      description,
      logo_url,
      primary_color,
      secondary_color,
      accent_color,
      dark_mode
    } = req.body;

    // Validation des champs requis
    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nom, téléphone et email sont requis'
      });
    }

    // Vérifier si des paramètres existent déjà
    const [existing] = await pool.query('SELECT id FROM company_settings LIMIT 1');

    if (existing.length === 0) {
      // Créer de nouveaux paramètres
      await pool.query(`
        INSERT INTO company_settings (
          name, phone, email, address, website, description, logo_url,
          primary_color, secondary_color, accent_color, dark_mode
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name, phone, email, address || null, website || null, description || null, logo_url || null,
        primary_color || '#3b82f6', secondary_color || '#10b981', accent_color || '#f59e0b', dark_mode || false
      ]);
    } else {
      // Mettre à jour les paramètres existants
      await pool.query(`
        UPDATE company_settings SET
          name = ?, phone = ?, email = ?, address = ?, website = ?, description = ?, logo_url = ?,
          primary_color = ?, secondary_color = ?, accent_color = ?, dark_mode = ?,
          updated_at = NOW()
        WHERE id = ?
      `, [
        name, phone, email, address || null, website || null, description || null, logo_url || null,
        primary_color || '#3b82f6', secondary_color || '#10b981', accent_color || '#f59e0b', dark_mode || false,
        existing[0].id
      ]);
    }

    // Récupérer les paramètres mis à jour
    const [updated] = await pool.query('SELECT * FROM company_settings ORDER BY id DESC LIMIT 1');

    res.json({
      success: true,
      message: 'Paramètres de l\'entreprise mis à jour avec succès',
      data: updated[0]
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour'
    });
  }
});

// Obtenir uniquement les informations publiques (pour les interfaces publiques)
router.get('/public-info', async (req, res) => {
  try {
    const [settings] = await pool.query(`
      SELECT name, phone, email, address, website, description 
      FROM company_settings 
      ORDER BY id DESC LIMIT 1
    `);
    
    if (settings.length === 0) {
      return res.json({
        success: true,
        data: {
          name: 'STOCK SHOP MALI',
          phone: '+223 70 XX XX XX',
          email: 'contact@stockshop.ml',
          address: 'Bamako, Mali',
          website: 'www.stockshop.ml',
          description: 'Votre partenaire de confiance pour tous vos besoins en électronique et accessoires'
        }
      });
    }

    res.json({
      success: true,
      data: settings[0]
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des infos publiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
