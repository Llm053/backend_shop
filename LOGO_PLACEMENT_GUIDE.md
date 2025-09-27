# Guide de Placement du Logo Smart ML

## 📍 Emplacements du Logo Smart ML

### 1. 🌐 **Interface Publique** (`http://localhost:3000/`)
**Fichier :** `client/src/components/DeveloperFooter.js`
**Ligne :** 15-17
```jsx
<div className="developer-logo">
  <FiCode className="logo-icon" />
  <span className="logo-text">SMART ML</span>
</div>
```
**Pour ajouter une image :**
- Placez le logo dans : `client/public/assets/smart-ml-logo.png`
- Remplacez `<FiCode className="logo-icon" />` par :
  ```jsx
  <img src="/assets/smart-ml-logo.png" alt="Smart ML" className="logo-image" />
  ```

### 2. 📱 **Toutes les Interfaces**
**CSS :** `client/src/components/DeveloperFooter.css`
**Ligne :** 25-35
```css
.logo-icon {
  font-size: 2rem;
  color: #3b82f6;
  padding: 0.5rem;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 12px;
}
```
**Pour une image :**
```css
.logo-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 8px;
}
```

## 📂 Structure des Dossiers

```
client/
├── public/
│   ├── assets/                    ← Créer ce dossier
│   │   ├── smart-ml-logo.png     ← Logo Smart ML (40x40px)
│   │   └── smart-ml-logo-white.png ← Version blanche
│   └── uploads/
│       └── products/              ← Images des produits
│           ├── laptop-dell.jpg
│           ├── souris-logitech.jpg
│           └── clavier-rgb.jpg
```

## 🎨 Spécifications Logo

### **Logo Smart ML :**
- **Taille :** 40x40px (carré)
- **Format :** PNG avec transparence
- **Versions :** 
  - Normale : `smart-ml-logo.png`
  - Blanche : `smart-ml-logo-white.png` (pour fonds sombres)

### **Images Produits :**
- **Taille :** 400x300px (ratio 4:3)
- **Format :** JPG, PNG, WebP
- **Poids :** Max 1MB par image
- **Nommage :** `nom-produit.jpg` (sans espaces)

## 🔧 Instructions d'Installation

1. **Créer le dossier assets :**
   ```bash
   mkdir -p client/public/assets
   ```

2. **Placer le logo Smart ML :**
   - Copier `smart-ml-logo.png` dans `client/public/assets/`

3. **Modifier DeveloperFooter.js :**
   - Remplacer l'icône par l'image
   - Ajuster les styles CSS si nécessaire

4. **Ajouter des images produits :**
   - Placer les images dans `client/public/uploads/products/`
   - Utiliser le formulaire admin pour associer les images

## ✨ Résultat Final

Le logo Smart ML apparaîtra dans le footer de toutes les interfaces :
- Interface publique (`/`)
- Interface admin (`/login`)
- Interface livreurs (`/delivery/login`)
- Page de suivi (`/order`)
