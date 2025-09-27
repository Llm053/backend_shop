# 📦 Application de Gestion de Stock

Une application complète de gestion de stock moderne avec Node.js, Express, MySQL et React.

## 🚀 Fonctionnalités

### Backend (Node.js + Express + MySQL)
- ✅ Authentification JWT avec rôles (admin/employé)
- ✅ Gestion complète des utilisateurs
- ✅ CRUD des catégories de produits
- ✅ CRUD des produits avec gestion du stock
- ✅ Mouvements de stock (entrées/sorties)
- ✅ Historique complet des opérations
- ✅ API REST sécurisée avec validation

### Frontend (React.js + Bootstrap)
- ✅ Interface moderne et responsive
- ✅ Dashboard avec statistiques en temps réel
- ✅ Gestion des catégories avec modales
- ✅ Gestion des produits avec recherche
- ✅ Gestion du stock avec onglets
- ✅ Gestion des utilisateurs (admin)
- ✅ Profil utilisateur avec changement de mot de passe
- ✅ Animations et interactions dynamiques
- ✅ Notifications toast
- ✅ Tables interactives avec tri et recherche

## 🛠️ Technologies Utilisées

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de données
- **JWT** - Authentification
- **bcryptjs** - Hachage des mots de passe
- **express-validator** - Validation des données

### Frontend
- **React.js** - Framework UI
- **React Router** - Navigation
- **Bootstrap 5** - Framework CSS
- **React Bootstrap** - Composants Bootstrap pour React
- **Axios** - Client HTTP
- **React Toastify** - Notifications

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- MySQL (version 5.7 ou supérieure)
- npm ou yarn

## 🔧 Installation

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd stock-management-app
```

### 2. Installer les dépendances du backend
```bash
npm install
```

### 3. Installer les dépendances du frontend
```bash
cd client
npm install
cd ..
```

### 4. Configuration de la base de données

1. Créer une base de données MySQL :
```sql
CREATE DATABASE stock_management;
```

2. Importer le fichier SQL :
```bash
mysql -u root -p stock_management < db.sql
```

### 5. Configuration des variables d'environnement

Copier le fichier de configuration :
```bash
cp config.env .env
```

Modifier les variables dans `.env` :
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=stock_management

JWT_SECRET=votre_clé_secrète_jwt
JWT_EXPIRE=7d

PORT=5000
NODE_ENV=development
```

## 🚀 Démarrage

### Démarrage du backend
```bash
npm run dev
```

### Démarrage du frontend (dans un autre terminal)
```bash
cd client
npm start
```

### Démarrage des deux en même temps
```bash
npm run dev-all
```

## 🌐 Accès à l'application

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:5000/api

## 👤 Compte par défaut

- **Email** : admin@stock.com
- **Mot de passe** : admin123
- **Rôle** : Administrateur

## 📊 Structure du projet

```
stock-management-app/
├── client/                 # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── contexts/       # Contextes React
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services API
│   │   └── ...
│   └── package.json
├── config/                 # Configuration
├── controllers/            # Contrôleurs backend
├── middleware/             # Middlewares
├── models/                 # Modèles de données
├── routes/                 # Routes API
├── db.sql                  # Script de base de données
├── server.js               # Point d'entrée du serveur
└── package.json
```

## 🔐 Sécurité

- Authentification JWT
- Hachage des mots de passe avec bcrypt
- Validation des données côté serveur
- Protection des routes sensibles
- Gestion des rôles utilisateur

## 📱 Responsive Design

L'application est entièrement responsive et s'adapte à tous les écrans :
- Desktop
- Tablette
- Mobile

## 🎨 Interface Utilisateur

- Design moderne avec Bootstrap 5
- Animations CSS fluides
- Icônes et badges informatifs
- Modales pour les formulaires
- Notifications toast
- Tables interactives

## 🔄 Fonctionnalités Dynamiques

- Recherche en temps réel
- Filtrage des données
- Pagination
- Animations au survol
- Transitions fluides
- États de chargement

## 📈 Statistiques

Le dashboard affiche :
- Nombre total de produits
- Quantité totale en stock
- Prix moyen des produits
- Nombre de produits en stock faible
- Mouvements d'entrée/sortie
- Historique des opérations récentes

## 🛡️ Gestion des Erreurs

- Validation côté client et serveur
- Messages d'erreur explicites
- Gestion des erreurs réseau
- Fallbacks pour les données manquantes

## 🚀 Déploiement

### Backend
1. Configurer les variables d'environnement de production
2. Installer les dépendances : `npm install --production`
3. Démarrer avec : `npm start`

### Frontend
1. Construire l'application : `npm run build`
2. Servir les fichiers statiques depuis le dossier `build/`

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

**Moussa Abdoulaye Niambele**
- Email: [votre-email@example.com]
- GitHub: [votre-github]

## 🙏 Remerciements

- Bootstrap pour le framework CSS
- React pour le framework JavaScript
- Express.js pour le backend
- MySQL pour la base de données
- Tous les contributeurs open source

---

**🎉 Profitez de votre application de gestion de stock !**
