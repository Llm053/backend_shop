const { pool } = require('../config/database');

class Product {
  // Créer un nouveau produit
  static async create(productData) {
    const { name, description, price, quantity, category_id, image_path } = productData;
    
    const [result] = await pool.query(
      'INSERT INTO products (name, description, image_path, price, stock_quantity, category_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, image_path || null, price, quantity, category_id]
    );
    
    return result.insertId;
  }

  // Obtenir tous les produits avec leurs catégories
  static async findAll() {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC
    `);
    
    // Mapper stock_quantity vers quantity pour la compatibilité frontend
    return products.map(product => ({
      ...product,
      quantity: product.stock_quantity
    }));
  }

  // Trouver un produit par ID
  static async findById(id) {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = ?
    `, [id]);
    
    if (products[0]) {
      return {
        ...products[0],
        quantity: products[0].stock_quantity
      };
    }
    return null;
  }

  // Mettre à jour un produit
  static async update(id, productData) {
    const { name, description, price, quantity, category_id, image_path } = productData;
    
    await pool.query(
      'UPDATE products SET name = ?, description = ?, image_path = ?, price = ?, stock_quantity = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, image_path || null, price, quantity, category_id, id]
    );
    
    return true;
  }

  // Supprimer un produit
  static async delete(id) {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return true;
  }

  // Mettre à jour la quantité d'un produit
  static async updateQuantity(id, newQuantity) {
    await pool.query(
      'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newQuantity, id]
    );
    
    return true;
  }

  // Obtenir les produits par catégorie
  static async findByCategory(categoryId) {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.category_id = ?
      ORDER BY p.name
    `, [categoryId]);
    
    return products.map(product => ({
      ...product,
      quantity: product.stock_quantity
    }));
  }

  // Rechercher des produits
  static async search(searchTerm) {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.name LIKE ? OR p.description LIKE ?
      ORDER BY p.name
    `, [`%${searchTerm}%`, `%${searchTerm}%`]);
    
    return products.map(product => ({
      ...product,
      quantity: product.stock_quantity
    }));
  }

  // Obtenir les produits avec stock faible
  static async findLowStock(threshold = 10) {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.stock_quantity <= ?
      ORDER BY p.stock_quantity ASC
    `, [threshold]);
    
    return products.map(product => ({
      ...product,
      quantity: product.stock_quantity
    }));
  }

  // Vérifier si un produit existe
  static async exists(id) {
    const [products] = await pool.query(
      'SELECT id FROM products WHERE id = ?',
      [id]
    );
    return products.length > 0;
  }

  // Obtenir les statistiques des produits
  static async getStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(stock_quantity) as total_quantity,
        AVG(price) as average_price,
        COUNT(CASE WHEN stock_quantity <= 10 THEN 1 END) as low_stock_count
      FROM products
    `);
    return stats[0];
  }
}

module.exports = Product;
