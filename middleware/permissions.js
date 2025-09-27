// Middleware pour gérer les permissions selon les rôles

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé pour votre rôle'
      });
    }

    next();
  };
};

// Permissions spécifiques
const requireAdmin = requireRole(['admin']);
const requireAdminOrEmployee = requireRole(['admin', 'employee']);
const requireDelivery = requireRole(['delivery']);

// Vérifier si l'utilisateur peut gérer les ventes
const canManageSales = (req, res, next) => {
  const allowedRoles = ['admin', 'employee'];
  return requireRole(allowedRoles)(req, res, next);
};

// Vérifier si l'utilisateur peut gérer les commandes
const canManageOrders = (req, res, next) => {
  const allowedRoles = ['admin', 'employee'];
  return requireRole(allowedRoles)(req, res, next);
};

// Vérifier si l'utilisateur peut gérer les produits (admin seulement)
const canManageProducts = (req, res, next) => {
  const allowedRoles = ['admin'];
  return requireRole(allowedRoles)(req, res, next);
};

// Vérifier si l'utilisateur peut gérer les utilisateurs (admin seulement)
const canManageUsers = (req, res, next) => {
  const allowedRoles = ['admin'];
  return requireRole(allowedRoles)(req, res, next);
};

// Vérifier si l'utilisateur peut voir les statistiques
const canViewStats = (req, res, next) => {
  const allowedRoles = ['admin', 'employee'];
  return requireRole(allowedRoles)(req, res, next);
};

// Permissions pour les livreurs
const canManageDeliveries = (req, res, next) => {
  const allowedRoles = ['admin', 'delivery'];
  return requireRole(allowedRoles)(req, res, next);
};

module.exports = {
  requireRole,
  requireAdmin,
  requireAdminOrEmployee,
  requireDelivery,
  canManageSales,
  canManageOrders,
  canManageProducts,
  canManageUsers,
  canViewStats,
  canManageDeliveries
};
