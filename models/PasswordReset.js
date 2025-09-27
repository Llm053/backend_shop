const { pool } = require('../config/database');
const crypto = require('crypto');

class PasswordReset {
  // Créer un token de réinitialisation
  static async createResetToken(userId, email) {
    try {
      // Supprimer les anciens tokens pour cet utilisateur
      await pool.execute(
        'DELETE FROM password_resets WHERE user_id = ?',
        [userId]
      );

      // Générer un token unique
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

      // Insérer le nouveau token
      await pool.execute(
        'INSERT INTO password_resets (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
        [userId, email, token, expiresAt]
      );

      return token;
    } catch (error) {
      console.error('Erreur création token réinitialisation:', error);
      throw error;
    }
  }

  // Vérifier la validité d'un token
  static async verifyToken(token) {
    try {
      const [rows] = await pool.execute(
        'SELECT pr.*, u.id, u.username, u.email FROM password_resets pr JOIN users u ON pr.user_id = u.id WHERE pr.token = ? AND pr.expires_at > NOW()',
        [token]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0];
    } catch (error) {
      console.error('Erreur vérification token:', error);
      throw error;
    }
  }

  // Supprimer un token après utilisation
  static async deleteToken(token) {
    try {
      await pool.execute(
        'DELETE FROM password_resets WHERE token = ?',
        [token]
      );
    } catch (error) {
      console.error('Erreur suppression token:', error);
      throw error;
    }
  }

  // Nettoyer les tokens expirés
  static async cleanExpiredTokens() {
    try {
      const result = await pool.execute(
        'DELETE FROM password_resets WHERE expires_at < NOW()'
      );
      console.log(`🧹 ${result[0].affectedRows} tokens expirés supprimés`);
      return result[0].affectedRows;
    } catch (error) {
      console.error('Erreur nettoyage tokens:', error);
      throw error;
    }
  }
}

module.exports = PasswordReset;
