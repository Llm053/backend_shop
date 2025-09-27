const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: './config.env' });

// Importer les routes existantes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const stockRoutes = require('./routes/stock');
const salesRoutes = require('./routes/sales');
const statisticsRoutes = require('./routes/statistics');
const publicRoutes = require('./routes/public');
const loyalCustomersRoutes = require('./routes/loyalCustomers');
const ordersRoutes = require('./routes/orders');
const deliveryRoutes = require('./routes/delivery');
const companyRoutes = require('./routes/company');
const uploadRoutes = require('./routes/upload');
const usersRoutes = require('./routes/users');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes existantes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/loyal-customers', loyalCustomersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API de gestion de stock fonctionnelle!',
    version: '2.0.0',
    features: [
      'Gestion des utilisateurs',
      'Gestion des produits',
      'Gestion du stock',
      'Interface moderne',
      'Boutique publique',
      'Module de vente',
      'Export de données'
    ]
  });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Erreur interne du serveur' 
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route non trouvée' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
  console.log(`✅ Test: http://localhost:${PORT}/api/test`);
  console.log(`🎯 Frontend: http://localhost:3000`);
});