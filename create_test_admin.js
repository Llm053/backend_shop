const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'stock_management',
  port: process.env.DB_PORT || 3306
};

async function createTestAdmin() {
  let connection;
  
  try {
    console.log('🔗 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion réussie');

    // Vérifier si l'admin existe déjà
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['admin@example.com']
    );

    if (existingUsers.length > 0) {
      console.log('⚠️ Utilisateur admin existe déjà');
      console.log('📧 Email:', existingUsers[0].email);
      console.log('👤 Nom d\'utilisateur:', existingUsers[0].username);
      console.log('🔑 Rôle:', existingUsers[0].role);
      return;
    }

    // Créer l'utilisateur admin
    const hashedPassword = await bcrypt.hash('password', 10);
    
    await connection.execute(
      'INSERT INTO users (username, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['admin', 'admin@example.com', hashedPassword, 'admin', '221 77 123 45 67']
    );

    console.log('✅ Utilisateur admin créé avec succès !');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Mot de passe: password');
    console.log('👤 Nom d\'utilisateur: admin');
    console.log('🔐 Rôle: admin');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTestAdmin();
