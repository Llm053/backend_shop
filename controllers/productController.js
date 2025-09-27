const { validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Obtenir tous les produits
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll();
    
    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits'
    });
  }
};

// Obtenir un produit par ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du produit'
    });
  }
};

// Créer un nouveau produit
const createProduct = async (req, res) => {
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

    const { name, description, price, quantity, category_id, image_path } = req.body;
    
    // Vérifier si la catégorie existe (si fournie)
    if (category_id) {
      const categoryExists = await Category.exists(category_id);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }
    }
    
    const productId = await Product.create({
      name,
      description,
      price,
      quantity: quantity || 0,
      category_id,
      image_path
    });
    
    // Récupérer le produit créé
    const product = await Product.findById(productId);
    
    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: { product }
    });
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du produit'
    });
  }
};

// Mettre à jour un produit
const updateProduct = async (req, res) => {
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
    const { name, description, price, quantity, category_id, image_path } = req.body;
    
    // Vérifier si le produit existe
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }
    
    // Vérifier si la catégorie existe (si fournie)
    if (category_id) {
      const categoryExists = await Category.exists(category_id);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Catégorie non trouvée'
        });
      }
    }
    
    await Product.update(id, {
      name,
      description,
      price,
      quantity,
      category_id,
      image_path
    });
    
    // Récupérer le produit mis à jour
    const updatedProduct = await Product.findById(id);
    
    res.json({
      success: true,
      message: 'Produit mis à jour avec succès',
      data: { product: updatedProduct }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du produit'
    });
  }
};

// Supprimer un produit
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le produit existe
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Produit non trouvé'
      });
    }
    
    await Product.delete(id);
    
    res.json({
      success: true,
      message: 'Produit supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du produit'
    });
  }
};

// Rechercher des produits
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }
    
    const products = await Product.search(q);
    
    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de produits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de produits'
    });
  }
};

// Obtenir les produits par catégorie
const getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const products = await Product.findByCategory(categoryId);
    
    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits par catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits par catégorie'
    });
  }
};

// Obtenir les produits avec stock faible
const getLowStockProducts = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    const products = await Product.findLowStock(parseInt(threshold));
    
    res.json({
      success: true,
      data: { products }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits en stock faible:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des produits en stock faible'
    });
  }
};

// Obtenir les statistiques des produits
const getProductStats = async (req, res) => {
  try {
    const stats = await Product.getStats();
    
    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
  getLowStockProducts,
  getProductStats
};
