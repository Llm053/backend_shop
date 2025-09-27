const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Créer un nouvel utilisateur
  static async create(userData) {
    const { username, email, password, role = 'employee', phone } = userData;
    
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, phone]
    );
    
    return result.insertId;
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    const [users] = await pool.query(
      'SELECT id, username, email, role, phone, created_at FROM users WHERE id = ?',
      [id]
    );
    return users[0] || null;
  }

  // Trouver un utilisateur par nom d'utilisateur
  static async findByUsername(username) {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return users[0] || null;
  }

  // Obtenir tous les utilisateurs
  static async findAll() {
    const [users] = await pool.query(
      'SELECT id, username, email, role, phone, created_at FROM users ORDER BY created_at DESC'
    );
    return users;
  }

  // Mettre à jour un utilisateur
  static async update(id, userData) {
    const { username, email, role, phone } = userData;
    
    await pool.query(
      'UPDATE users SET username = ?, email = ?, role = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [username, email, role, phone, id]
    );
    
    return true;
  }

  // Supprimer un utilisateur
  static async delete(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }

  // Vérifier le mot de passe
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Changer le mot de passe
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, id]
    );
    
    return true;
  }
}

module.exports = User;
