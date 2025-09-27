const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function debugAuth() {
  try {
    console.log('🔗 Test direct de l\'authentification...');

    // Test 1: Vérifier la connexion à la base de données
    console.log('\n1️⃣ Test de connexion à la base de données...');
    const user = await User.findByEmail('admin@example.com');
    
    if (!user) {
      console.log('❌ Utilisateur admin@example.com non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Username: ${user.username}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Password hash: ${user.password.substring(0, 20)}...`);

    // Test 2: Vérifier le mot de passe
    console.log('\n2️⃣ Test de vérification du mot de passe...');
    const isPasswordValid = await User.verifyPassword('password', user.password);
    console.log(`✅ Mot de passe "password" valide: ${isPasswordValid}`);

    if (!isPasswordValid) {
      // Test avec d'autres mots de passe
      const passwords = ['admin123', 'admin', '123456', 'password123'];
      for (const pwd of passwords) {
        const isValid = await User.verifyPassword(pwd, user.password);
        if (isValid) {
          console.log(`✅ Mot de passe valide trouvé: "${pwd}"`);
          break;
        }
      }
    }

    // Test 3: Créer un nouvel utilisateur avec le même mot de passe
    console.log('\n3️⃣ Création d\'un nouvel utilisateur de test...');
    try {
      await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
        role: 'admin',
        phone: '221 77 000 00 00'
      });
      console.log('✅ Nouvel utilisateur créé avec succès');
      
      // Tester l'authentification du nouvel utilisateur
      const newUser = await User.findByEmail('test@example.com');
      const newUserAuth = await User.verifyPassword('password', newUser.password);
      console.log(`✅ Authentification nouvel utilisateur: ${newUserAuth}`);
      
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('⚠️ Utilisateur test@example.com existe déjà');
      } else {
        console.log('❌ Erreur création utilisateur:', error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

debugAuth();
