const { validationResult } = require('express-validator');
const Category = require('../models/Category');

// Obtenir toutes les catégories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
};

// Obtenir une catégorie par ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: { category }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie'
    });
  }
};

// Créer une nouvelle catégorie
const createCategory = async (req, res) => {
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

    const { name, description } = req.body;
    
    const categoryId = await Category.create({ name, description });
    
    // Récupérer la catégorie créée
    const category = await Category.findById(categoryId);
    
    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: { category }
    });
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie'
    });
  }
};

// Mettre à jour une catégorie
const updateCategory = async (req, res) => {
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

    const { id } = req.params;
    const { name, description } = req.body;
    
    // Vérifier si la catégorie existe
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    await Category.update(id, { name, description });
    
    // Récupérer la catégorie mise à jour
    const updatedCategory = await Category.findById(id);
    
    res.json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      data: { category: updatedCategory }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la catégorie'
    });
  }
};

// Supprimer une catégorie
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si la catégorie existe
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }
    
    await Category.delete(id);
    
    res.json({
      success: true,
      message: 'Catégorie supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    
    if (error.message.includes('produits')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie'
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};
