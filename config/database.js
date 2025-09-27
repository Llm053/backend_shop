const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

// Configuration de la connexion à la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'sql8.freesqldatabase.com',
  user: process.env.DB_USER || 'sql8800065',
  password: process.env.DB_PASSWORD || 'Q1cwNJ81eu',
  database: process.env.DB_NAME || 'sql8800065',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: process.env.DB_PORT || 3306
};

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Créer une promesse pour les requêtes
const promisePool = pool.promise();

// Test de connexion
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Connexion à la base de données MySQL réussie');
    connection.release();
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    process.exit(1);
  }
};

// Exporter le pool et la fonction de test
module.exports = {
  pool: promisePool,
  testConnection
};
