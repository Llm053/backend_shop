const express = require('express');
const { getGeneralStats, getRevenueStats, exportStatistics, getStockStats } = require('../controllers/statisticsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Obtenir les statistiques générales
router.get('/general', getGeneralStats);

// Obtenir les statistiques de revenus
router.get('/revenue', getRevenueStats);

// Obtenir les statistiques de stock
router.get('/stock', getStockStats);

// Exporter les statistiques
router.get('/export', exportStatistics);

module.exports = router;
