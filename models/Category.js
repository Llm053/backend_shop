const { pool } = require('../config/database');

class Category {
  // Créer une nouvelle catégorie
  static async create(categoryData) {
    const { name, description } = categoryData;
    
    const [result] = await pool.execute(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );
    
    return result.insertId;
  }

  // Obtenir toutes les catégories
  static async findAll() {
    const [categories] = await pool.execute(
      'SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id ORDER BY c.name'
    );
    return categories;
  }

  // Trouver une catégorie par ID
  static async findById(id) {
    const [categories] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    return categories[0] || null;
  }

  // Mettre à jour une catégorie
  static async update(id, categoryData) {
    const { name, description } = categoryData;
    
    await pool.execute(
      'UPDATE categories SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, id]
    );
    
    return true;
  }

  // Supprimer une catégorie
  static async delete(id) {
    // Vérifier s'il y a des produits dans cette catégorie
    const [products] = await pool.execute(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );
    
    if (products[0].count > 0) {
      throw new Error('Impossible de supprimer une catégorie qui contient des produits');
    }
    
    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  }

  // Vérifier si une catégorie existe
  static async exists(id) {
    const [categories] = await pool.execute(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );
    return categories.length > 0;
  }
}

module.exports = Category;
