const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stock_management',
  port: 3306
};

async function fixAdminAuth() {
  let connection;
  
  try {
    console.log('🔗 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion réussie');

    // Vérifier les utilisateurs existants
    console.log('\n👥 Utilisateurs existants:');
    const [users] = await connection.execute('SELECT id, username, email, role FROM users');
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }

    users.forEach(user => {
      console.log(`   - ID: ${user.id}, Email: ${user.email}, Username: ${user.username}, Role: ${user.role}`);
    });

    // Supprimer l'ancien admin et en créer un nouveau
    console.log('\n🔄 Réinitialisation de l\'admin...');
    await connection.execute('DELETE FROM users WHERE email = ?', ['admin@example.com']);
    
    const hashedPassword = await bcrypt.hash('password', 10);
    
    await connection.execute(
      'INSERT INTO users (username, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['admin', 'admin@example.com', hashedPassword, 'admin', '221 77 123 45 67']
    );

    console.log('✅ Nouvel utilisateur admin créé');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Mot de passe: password');

    // Vérifier que le mot de passe fonctionne
    console.log('\n🔐 Test du mot de passe...');
    const [newAdmin] = await connection.execute(
      'SELECT password FROM users WHERE email = ?',
      ['admin@example.com']
    );

    if (newAdmin.length > 0) {
      const isValid = await bcrypt.compare('password', newAdmin[0].password);
      console.log(`✅ Mot de passe valide: ${isValid}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixAdminAuth();
