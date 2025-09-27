const { pool } = require('../config/database');

class StockMovement {
  // Créer un nouveau mouvement de stock
  static async create(movementData) {
    const { product_id, type, quantity, reason, user_id } = movementData;
    
    const [result] = await pool.query(
      'INSERT INTO stock_movements (product_id, type, quantity, reason, user_id) VALUES (?, ?, ?, ?, ?)',
      [product_id, type, quantity, reason, user_id]
    );
    
    return result.insertId;
  }

  // Obtenir tous les mouvements avec détails
  static async findAll() {
    const [movements] = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        u.username as user_name,
        c.name as category_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY sm.created_at DESC
    `);
    return movements;
  }

  // Trouver un mouvement par ID
  static async findById(id) {
    const [movements] = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        u.username as user_name,
        c.name as category_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE sm.id = ?
    `, [id]);
    return movements[0] || null;
  }

  // Obtenir les mouvements d'un produit
  static async findByProduct(productId) {
    const [movements] = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        u.username as user_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE sm.product_id = ?
      ORDER BY sm.created_at DESC
    `, [productId]);
    return movements;
  }

  // Obtenir les mouvements d'un utilisateur
  static async findByUser(userId) {
    const [movements] = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        c.name as category_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE sm.user_id = ?
      ORDER BY sm.created_at DESC
    `, [userId]);
    return movements;
  }

  // Obtenir les mouvements par type
  static async findByType(type) {
    const [movements] = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        u.username as user_name,
        c.name as category_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE sm.type = ?
      ORDER BY sm.created_at DESC
    `, [type]);
    return movements;
  }

  // Obtenir les mouvements récents
  static async findRecent(limit = 10) {
    const [movements] = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        u.username as user_name,
        c.name as category_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY sm.created_at DESC
      LIMIT ?
    `, [limit]);
    return movements;
  }

  // Obtenir les mouvements par période
  static async findByDateRange(startDate, endDate) {
    const [movements] = await pool.query(`
      SELECT 
        sm.*,
        p.name as product_name,
        u.username as user_name,
        c.name as category_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE DATE(sm.created_at) BETWEEN ? AND ?
      ORDER BY sm.created_at DESC
    `, [startDate, endDate]);
    return movements;
  }

  // Obtenir les statistiques des mouvements
  static async getStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_movements,
        COUNT(CASE WHEN type = 'in' THEN 1 END) as total_ins,
        COUNT(CASE WHEN type = 'out' THEN 1 END) as total_outs,
        SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) as total_quantity_in,
        SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as total_quantity_out
      FROM stock_movements
    `);
    return stats[0];
  }

  // Obtenir les statistiques par jour
  static async getDailyStats(days = 7) {
    const [stats] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as movements_count,
        COUNT(CASE WHEN type = 'in' THEN 1 END) as ins_count,
        COUNT(CASE WHEN type = 'out' THEN 1 END) as outs_count,
        SUM(CASE WHEN type = 'in' THEN quantity ELSE 0 END) as quantity_in,
        SUM(CASE WHEN type = 'out' THEN quantity ELSE 0 END) as quantity_out
      FROM stock_movements
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [days]);
    return stats;
  }
}

module.exports = StockMovement;
