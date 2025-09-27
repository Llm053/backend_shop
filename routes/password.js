const express = require('express');
const { body } = require('express-validator');
const { requestPasswordReset, resetPassword, changePassword, verifyResetToken } = require('../controllers/passwordController');
const auth = require('../middleware/auth');

const router = express.Router();

// Demander la réinitialisation de mot de passe (public)
router.post('/request-reset', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Adresse email invalide')
], requestPasswordReset);

// Vérifier la validité d'un token de réinitialisation (public)
router.get('/verify-token/:token', verifyResetToken);

// Réinitialiser le mot de passe avec token (public)
router.post('/reset', [
  body('token')
    .notEmpty()
    .withMessage('Token requis'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
], resetPassword);

// Changer le mot de passe (utilisateur connecté)
router.post('/change', auth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mot de passe actuel requis'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
], changePassword);

module.exports = router;
