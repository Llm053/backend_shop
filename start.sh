#!/bin/bash

# Script de démarrage pour l'application de gestion de stock
# Auteur: Moussa Abdoulaye Niambele

echo "🚀 Démarrage de l'application de gestion de stock..."
echo "=================================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit 1
fi

# Vérifier si MySQL est installé
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL n'est pas installé. Veuillez l'installer depuis https://dev.mysql.com/downloads/"
    exit 1
fi

echo "✅ Node.js et MySQL sont installés"

# Installer les dépendances du backend
echo "📦 Installation des dépendances du backend..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances du backend"
    exit 1
fi

# Installer les dépendances du frontend
echo "📦 Installation des dépendances du frontend..."
cd client
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances du frontend"
    exit 1
fi

cd ..

# Vérifier si le fichier .env existe
if [ ! -f ".env" ]; then
    echo "⚙️ Création du fichier de configuration..."
    cp config.env .env
    echo "📝 Veuillez modifier le fichier .env avec vos paramètres de base de données"
fi

# Vérifier si la base de données existe
echo "🗄️ Vérification de la base de données..."
mysql -u root -p -e "USE stock_management;" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "📊 Création de la base de données..."
    mysql -u root -p < db.sql
    
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors de la création de la base de données"
        echo "💡 Assurez-vous que MySQL est démarré et que vous avez les bonnes permissions"
        exit 1
    fi
    
    echo "✅ Base de données créée avec succès"
else
    echo "✅ Base de données existe déjà"
fi

echo ""
echo "🎉 Installation terminée avec succès !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Modifiez le fichier .env avec vos paramètres de base de données"
echo "2. Démarrez le backend : npm run dev"
echo "3. Démarrez le frontend : cd client && npm start"
echo "4. Ou utilisez : npm run dev-all pour démarrer les deux"
echo ""
echo "🌐 Accès à l'application :"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:5000/api"
echo ""
echo "👤 Compte par défaut :"
echo "- Email: admin@stock.com"
echo "- Mot de passe: admin123"
echo ""
echo "🚀 Bon développement !"
