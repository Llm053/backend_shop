const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Utiliser un chemin relatif depuis la racine du projet
    const uploadPath = path.resolve(__dirname, '..', 'client', 'public', 'uploads', 'products');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
      console.log('📁 Dossier créé:', uploadPath);
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Générer un nom de fichier unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + extension);
  }
});

// Filtrer les types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG ou WebP.'), false);
  }
};

// Configuration multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Route pour uploader une image de produit
router.post('/product-image', authenticateToken, (req, res) => {
  upload.single('image')(req, res, (err) => {
    try {
      if (err) {
        console.error('Erreur multer:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'Erreur lors de l\'upload'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier fourni'
        });
      }

      // Retourner le chemin relatif pour la base de données
      const imagePath = `/uploads/products/${req.file.filename}`;

      console.log('✅ Image uploadée:', imagePath);

      res.json({
        success: true,
        message: 'Image uploadée avec succès',
        data: {
          imagePath: imagePath,
          originalName: req.file.originalname,
          size: req.file.size,
          filename: req.file.filename
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload de l\'image'
      });
    }
  });
});

// Route pour supprimer une image de produit
router.delete('/product-image/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../client/public/uploads/products', filename);

    // Vérifier que le fichier existe
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({
        success: true,
        message: 'Image supprimée avec succès'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Fichier non trouvé'
      });
    }

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'image'
    });
  }
});

module.exports = router;
