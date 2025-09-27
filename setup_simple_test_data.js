const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stock_management',
  port: 3306
};

async function setupSimpleTestData() {
  let connection;
  
  try {
    console.log('🔗 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion réussie');

    // Nettoyer et créer un admin simple
    console.log('\n👤 Création de l\'utilisateur admin...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('DELETE FROM users');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(
      'INSERT INTO users (username, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      ['admin', 'admin@example.com', hashedPassword, 'admin', '221 77 123 45 67']
    );
    console.log('✅ Admin créé: admin@example.com / admin123');

    // Créer quelques catégories
    console.log('\n📂 Création des catégories...');
    await connection.execute('DELETE FROM categories');
    
    const categories = [
      { name: 'Électronique', description: 'Appareils électroniques' },
      { name: 'Vêtements', description: 'Habits et accessoires' },
      { name: 'Alimentation', description: 'Produits alimentaires' }
    ];

    for (const category of categories) {
      await connection.execute(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [category.name, category.description]
      );
    }
    console.log(`✅ ${categories.length} catégories créées`);

    // Créer quelques produits
    console.log('\n📦 Création des produits...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('DELETE FROM products');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    // Récupérer les IDs des catégories
    const [categoriesResult] = await connection.execute('SELECT id FROM categories ORDER BY id');
    const categoryIds = categoriesResult.map(cat => cat.id);
    
    const products = [
      { name: 'Smartphone', description: 'Smartphone Android', price: 150000, quantity: 10, category_id: categoryIds[0] },
      { name: 'T-shirt', description: 'T-shirt en coton', price: 5000, quantity: 50, category_id: categoryIds[1] },
      { name: 'Riz', description: 'Riz parfumé', price: 2500, quantity: 100, category_id: categoryIds[2] }
    ];

    for (const product of products) {
      await connection.execute(
        'INSERT INTO products (name, description, price, stock_quantity, category_id) VALUES (?, ?, ?, ?, ?)',
        [product.name, product.description, product.price, product.quantity, product.category_id]
      );
    }
    console.log(`✅ ${products.length} produits créés`);

    // Créer quelques ventes d'exemple
    console.log('\n🛒 Création des ventes d\'exemple...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('DELETE FROM sale_items');
    await connection.execute('DELETE FROM sales');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    const sales = [
      {
        customer_name: 'Moussa Diallo',
        customer_phone: '221 77 123 45 67',
        customer_email: 'moussa@example.com',
        total_amount: 155000,
        notes: 'Vente en magasin',
        items: [
          { product_id: 1, quantity: 1, price: 150000 },
          { product_id: 2, quantity: 1, price: 5000 }
        ]
      },
      {
        customer_name: 'Fatou Sarr',
        customer_phone: '221 77 987 65 43',
        customer_email: 'fatou@example.com',
        total_amount: 17500,
        notes: 'Vente par téléphone',
        items: [
          { product_id: 2, quantity: 3, price: 5000 },
          { product_id: 3, quantity: 1, price: 2500 }
        ]
      }
    ];

    for (const sale of sales) {
      const [saleResult] = await connection.execute(
        'INSERT INTO sales (customer_name, customer_phone, customer_email, total_amount, notes, user_id) VALUES (?, ?, ?, ?, ?, ?)',
        [sale.customer_name, sale.customer_phone, sale.customer_email, sale.total_amount, sale.notes, 1]
      );
      
      const saleId = saleResult.insertId;
      
      for (const item of sale.items) {
        await connection.execute(
          'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
          [saleId, item.product_id, item.quantity, item.price, item.quantity * item.price]
        );
        
        // Créer un mouvement de stock
        await connection.execute(
          'INSERT INTO stock_movements (product_id, type, quantity, reason, user_id) VALUES (?, ?, ?, ?, ?)',
          [item.product_id, 'out', item.quantity, `Vente - ${sale.customer_name}`, 1]
        );
        
        // Mettre à jour le stock
        await connection.execute(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }
    console.log(`✅ ${sales.length} ventes créées`);

    console.log('\n🎉 Données de test créées avec succès !');
    console.log('\n📋 Résumé:');
    console.log('👤 Admin: admin@example.com / admin123');
    console.log(`📂 Catégories: ${categories.length}`);
    console.log(`📦 Produits: ${products.length}`);
    console.log(`🛒 Ventes: ${sales.length}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupSimpleTestData();
