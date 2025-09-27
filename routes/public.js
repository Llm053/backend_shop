const express = require('express');
const { getAllCategories } = require('../controllers/categoryController');
const { getAllProducts } = require('../controllers/productController');
const { getFirstAdmin } = require('../controllers/adminController');

const router = express.Router();

// Routes publiques pour la boutique (sans authentification)

// Obtenir toutes les catégories (public)
router.get('/categories', getAllCategories);

// Obtenir tous les produits (public)
router.get('/products', getAllProducts);

// Obtenir le premier administrateur (public)
router.get('/admin', getFirstAdmin);

module.exports = router;
