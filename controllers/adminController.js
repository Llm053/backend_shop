const { pool } = require('../config/database');

// Obtenir le premier administrateur
const getFirstAdmin = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, phone FROM users WHERE role = "admin" ORDER BY id ASC LIMIT 1'
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun administrateur trouvé'
      });
    }
    
    res.json({
      success: true,
      data: { admin: users[0] }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'administrateur'
    });
  }
};

module.exports = {
  getFirstAdmin
};
