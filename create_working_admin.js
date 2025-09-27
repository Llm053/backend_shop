const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stock_management',
  port: 3306
};

async function createWorkingAdmin() {
  let connection;
  
  try {
    console.log('🔗 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion réussie');

    // Supprimer tous les utilisateurs existants
    console.log('\n🧹 Nettoyage des utilisateurs existants...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('DELETE FROM users');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Utilisateurs supprimés');

    // Créer un utilisateur admin avec mot de passe simple
    console.log('\n👤 Création de l\'utilisateur admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(
      'INSERT INTO users (username, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['admin', 'admin@example.com', hashedPassword, 'admin', '221 77 123 45 67']
    );
    
    console.log('✅ Utilisateur admin créé');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Mot de passe: admin123');

    // Vérifier la création
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@example.com']);
    if (users.length > 0) {
      console.log('✅ Utilisateur vérifié dans la base de données');
      
      // Tester le mot de passe
      const isValid = await bcrypt.compare('admin123', users[0].password);
      console.log(`✅ Mot de passe valide: ${isValid}`);
    }

    console.log('\n🎉 Admin fonctionnel créé !');
    console.log('Vous pouvez maintenant vous connecter avec:');
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

createWorkingAdmin();
