const { validationResult } = require('express-validator');
const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');

// Obtenir tous les mouvements de stock
const getAllMovements = async (req, res) => {
  try {
    const movements = await StockMovement.findAll();
    
    res.json({
      success: true,
      data: { movements }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des mouvements'
    });
  }
};

// Obtenir un mouvement par ID
const getMovementById = async (req, res) => {
  try {
    const { id } = req.params;
    const movement = await StockMovement.findById(id);
    
    if (!movement) {
      return res.status(404).json({
        success: false,
        message: 'Mouvement non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: { movement }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du mouvement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du mouvement'
    });
  }
};

// Créer un nouveau mouvement de stock
const createMovement = async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { product_id, type, quantity, reason } = req.body;
    const user_id = req.user.id;
    
    // Vérifier si le produit existe
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }
    
    // Vérifier la quantité pour les sorties
    if (type === 'out' && product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Stock insuffisant. Quantité disponible: ' + product.quantity
      });
    }
    
    // Créer le mouvement
    const movementId = await StockMovement.create({
      product_id,
      type,
      quantity,
      reason,
      user_id
    });
    
    // Mettre à jour la quantité du produit
    let newQuantity;
    if (type === 'in') {
      newQuantity = product.quantity + quantity;
    } else {
      newQuantity = product.quantity - quantity;
    }
    
    await Product.updateQuantity(product_id, newQuantity);
    
    // Récupérer le mouvement créé
    const movement = await StockMovement.findById(movementId);
    
    res.status(201).json({
      success: true,
      message: `Mouvement de stock ${type === 'in' ? 'd\'entrée' : 'de sortie'} enregistré avec succès`,
      data: { movement }
    });
  } catch (error) {
    console.error('Erreur lors de la création du mouvement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du mouvement'
    });
  }
};

// Obtenir les mouvements d'un produit
const getMovementsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const movements = await StockMovement.findByProduct(productId);
    
    res.json({
      success: true,
      data: { movements }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des mouvements du produit'
    });
  }
};

// Obtenir les mouvements récents
const getRecentMovements = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const movements = await StockMovement.findRecent(parseInt(limit));
    
    res.json({
      success: true,
      data: { movements }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements récents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des mouvements récents'
    });
  }
};

// Obtenir les mouvements par type
const getMovementsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['in', 'out'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type de mouvement invalide. Utilisez "in" ou "out"'
      });
    }
    
    const movements = await StockMovement.findByType(type);
    
    res.json({
      success: true,
      data: { movements }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements par type:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des mouvements par type'
    });
  }
};

// Obtenir les mouvements par période
const getMovementsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Dates de début et de fin requises'
      });
    }
    
    const movements = await StockMovement.findByDateRange(startDate, endDate);
    
    res.json({
      success: true,
      data: { movements }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements par période:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des mouvements par période'
    });
  }
};

// Obtenir les statistiques des mouvements
const getMovementStats = async (req, res) => {
  try {
    const stats = await StockMovement.getStats();
    
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des mouvements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques des mouvements'
    });
  }
};

// Obtenir les statistiques quotidiennes
const getDailyStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await StockMovement.getDailyStats(parseInt(days));
    
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques quotidiennes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques quotidiennes'
    });
  }
};

module.exports = {
  getAllMovements,
  getMovementById,
  createMovement,
  getMovementsByProduct,
  getRecentMovements,
  getMovementsByType,
  getMovementsByDateRange,
  getMovementStats,
  getDailyStats
};
