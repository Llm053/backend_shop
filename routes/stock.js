const express = require('express');
const { body, query } = require('express-validator');
const { 
  getAllMovements, 
  getMovementById, 
  createMovement, 
  getMovementsByProduct,
  getRecentMovements,
  getMovementsByType,
  getMovementsByDateRange,
  getMovementStats,
  getDailyStats
} = require('../controllers/stockController');
const { authenticateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Validation pour la création de mouvement
const createMovementValidation = [
  body('product_id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du produit doit être un nombre entier positif'),
  body('type')
    .isIn(['in', 'out'])
    .withMessage('Le type doit être "in" ou "out"'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('La quantité doit être un nombre entier positif'),
  body('reason')
    .optional()
    .isLength({ max: 255 })
    .withMessage('La raison ne peut pas dépasser 255 caractères')
    .trim()
];

// Validation pour les paramètres de requête
const limitValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être un nombre entier entre 1 et 100')
];

const thresholdValidation = [
  query('threshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le seuil doit être un nombre entier positif')
];

const daysValidation = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Le nombre de jours doit être entre 1 et 365')
];

const dateRangeValidation = [
  query('startDate')
    .isISO8601()
    .withMessage('La date de début doit être au format ISO 8601'),
  query('endDate')
    .isISO8601()
    .withMessage('La date de fin doit être au format ISO 8601')
];

// Routes
router.get('/', authenticateToken, requireAuth, getAllMovements);
router.get('/stats', authenticateToken, requireAuth, getMovementStats);
router.get('/daily-stats', authenticateToken, requireAuth, daysValidation, getDailyStats);
router.get('/recent', authenticateToken, requireAuth, limitValidation, getRecentMovements);
router.get('/type/:type', authenticateToken, requireAuth, getMovementsByType);
router.get('/date-range', authenticateToken, requireAuth, dateRangeValidation, getMovementsByDateRange);
router.get('/product/:productId', authenticateToken, requireAuth, getMovementsByProduct);
router.get('/:id', authenticateToken, requireAuth, getMovementById);
router.post('/', authenticateToken, requireAuth, createMovementValidation, createMovement);

module.exports = router;
