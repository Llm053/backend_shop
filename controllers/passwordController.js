const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { pool } = require('../config/database');
const PasswordReset = require('../models/PasswordReset');
const { sendPasswordResetEmail, sendPasswordChangeConfirmation } = require('../services/emailService');

// Demander la réinitialisation de mot de passe
const requestPasswordReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Vérifier si l'utilisateur existe
    const [users] = await pool.execute(
      'SELECT id, username, email FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun compte trouvé avec cette adresse email'
      });
    }

    const user = users[0];

    // Créer le token de réinitialisation
    const resetToken = await PasswordReset.createResetToken(user.id, user.email);

    // Envoyer l'email de réinitialisation
    const emailResult = await sendPasswordResetEmail(user.email, resetToken, user.username);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de réinitialisation'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email de réinitialisation envoyé avec succès'
    });

  } catch (error) {
    console.error('Erreur demande réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la demande de réinitialisation'
    });
  }
};

// Réinitialiser le mot de passe avec le token
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Vérifier la validité du token
    const tokenData = await PasswordReset.verifyToken(token);
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, tokenData.user_id]
    );

    // Supprimer le token utilisé
    await PasswordReset.deleteToken(token);

    // Envoyer email de confirmation
    await sendPasswordChangeConfirmation(tokenData.email, tokenData.username);

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la réinitialisation'
    });
  }
};

// Changer le mot de passe (utilisateur connecté)
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Récupérer l'utilisateur actuel
    const [users] = await pool.execute(
      'SELECT id, password, username, email FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const user = users[0];

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    // Envoyer email de confirmation
    await sendPasswordChangeConfirmation(user.email, user.username);

    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du changement de mot de passe'
    });
  }
};

// Vérifier la validité d'un token (pour le frontend)
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const tokenData = await PasswordReset.verifyToken(token);
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token valide',
      data: {
        email: tokenData.email,
        username: tokenData.username
      }
    });

  } catch (error) {
    console.error('Erreur vérification token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification du token'
    });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
  changePassword,
  verifyResetToken
};
