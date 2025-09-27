const express = require('express');
const { body, query } = require('express-validator');
const { 
  getAllProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  getLowStockProducts,
  getProductStats
} = require('../controllers/productController');
const { authenticateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Validation pour la création de produit
const createProductValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom du produit doit contenir entre 2 et 100 caractères')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères')
    .trim(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('La quantité doit être un nombre entier positif'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la catégorie doit être un nombre entier positif')
];

// Validation pour la mise à jour de produit
const updateProductValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom du produit doit contenir entre 2 et 100 caractères')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La description ne peut pas dépasser 1000 caractères')
    .trim(),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Le prix doit être un nombre positif'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('La quantité doit être un nombre entier positif'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de la catégorie doit être un nombre entier positif')
];

// Validation pour la recherche
const searchValidation = [
  query('q')
    .isLength({ min: 1 })
    .withMessage('Le terme de recherche est requis')
    .trim()
];

// Validation pour le seuil de stock faible
const lowStockValidation = [
  query('threshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le seuil doit être un nombre entier positif')
];

// Routes
router.get('/', authenticateToken, requireAuth, getAllProducts);
router.get('/stats', authenticateToken, requireAuth, getProductStats);
router.get('/search', authenticateToken, requireAuth, searchValidation, searchProducts);
router.get('/low-stock', authenticateToken, requireAuth, lowStockValidation, getLowStockProducts);
router.get('/category/:categoryId', authenticateToken, requireAuth, getProductsByCategory);
router.get('/:id', authenticateToken, requireAuth, getProductById);
router.post('/', authenticateToken, requireAuth, createProductValidation, createProduct);
router.put('/:id', authenticateToken, requireAuth, updateProductValidation, updateProduct);
router.delete('/:id', authenticateToken, requireAuth, deleteProduct);

module.exports = router;
