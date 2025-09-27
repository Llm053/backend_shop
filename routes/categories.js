const express = require('express');
const { body } = require('express-validator');
const { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Validation pour la création de catégorie
const createCategoryValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de la catégorie doit contenir entre 2 et 100 caractères')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères')
    .trim()
];

// Validation pour la mise à jour de catégorie
const updateCategoryValidation = [
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de la catégorie doit contenir entre 2 et 100 caractères')
    .trim(),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères')
    .trim()
];

// Routes
router.get('/', authenticateToken, requireAuth, getAllCategories);
router.get('/:id', authenticateToken, requireAuth, getCategoryById);
router.post('/', authenticateToken, requireAuth, createCategoryValidation, createCategory);
router.put('/:id', authenticateToken, requireAuth, updateCategoryValidation, updateCategory);
router.delete('/:id', authenticateToken, requireAuth, deleteCategory);

module.exports = router;
