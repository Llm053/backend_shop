const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stock_management',
  port: 3306
};

async function createSimpleAdmin() {
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
      console.log('👤 Username:', existingUsers[0].username);
      
      // Tester le mot de passe
      const isValid = await bcrypt.compare('admin123', existingUsers[0].password);
      console.log(`🔑 Mot de passe "admin123" valide: ${isValid}`);
      
      if (!isValid) {
        // Mettre à jour le mot de passe
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.execute(
          'UPDATE users SET password = ? WHERE email = ?',
          [hashedPassword, 'admin@example.com']
        );
        console.log('✅ Mot de passe mis à jour');
      }
    } else {
      // Créer l'admin
      console.log('👤 Création de l\'utilisateur admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await connection.execute(
        'INSERT INTO users (username, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
        ['admin', 'admin@example.com', hashedPassword, 'admin', '221 77 123 45 67']
      );
      console.log('✅ Admin créé');
    }

    console.log('\n🎉 Admin prêt !');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Mot de passe: admin123');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createSimpleAdmin();
