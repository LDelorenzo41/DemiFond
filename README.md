# 🏃 Running Pace Tracker - PWA

Application web progressive (PWA) pour le suivi d'allure de course à pied, conçue pour être utilisable hors connexion et optimisée pour tablettes et smartphones.

## ✨ Fonctionnalités

### Interface en 3 zones

1. **Bandeau supérieur** (sticky)
   - 🏃 Longueur de piste : 50m à 400m (par pas de 50m)
   - ⚡ VMA du coureur : 8 à 20 km/h (par pas de 0,5 km/h)
   - 📍 Distance entre repères : 5m à 50m (par pas de 5m)

2. **Panneau gauche - Paramètres**
   - ⏱️ Temps de course : 1 à 15 minutes (par pas de 30s)
   - 📊 % de VMA : 60% à 120%
   - Résumé automatique (distance, tours, repères)
   - Légende des couleurs d'allure

3. **Panneau central - Course en direct**
   - ⏰ Chronomètre + compte à rebours
   - Choix tour/demi-tour
   - Bouton tactile "INFO VITESSE" avec retour couleur :
     - 🔵 Bleu : écart ≤ 0,1 km/h (objectif atteint)
     - 🟢 Vert : écart ≤ 0,5 km/h (objectif presque atteint)
     - 🟡 Jaune : écart ≤ 1 km/h (allure à travailler)
     - 🔴 Rouge : écart > 1 km/h (objectif inadapté)
   - Historique des 5 derniers passages

4. **Panneau droit - Analyse**
   - 📋 Tableau d'allure automatique
   - 📊 Statistiques temps réel
   - 📝 Zone de notes personnelles
   - 💾 Export des données (JSON)

### Capacités PWA

- ✅ Fonctionne 100% hors ligne après le premier chargement
- ✅ Installable sur l'écran d'accueil (mobile/tablette)
- ✅ Service Worker avec cache automatique
- ✅ Mise à jour automatique de l'application
- ✅ Optimisée pour les performances

## 🚀 Installation et lancement

### Prérequis

- Node.js 18+ et npm

### Installation

```bash
# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build de production
npm run build

# Preview du build de production
npm run preview
```

### Déploiement

L'application peut être déployée sur :
- **Vercel** : `vercel --prod`
- **Netlify** : Glisser-déposer le dossier `dist/`
- **GitHub Pages** : Via GitHub Actions
- Tout hébergeur de fichiers statiques

## 📱 Utilisation sur le terrain

### Installation sur smartphone/tablette

1. Ouvrez l'application dans votre navigateur
2. Appuyez sur le bouton "Installer" ou "Ajouter à l'écran d'accueil"
3. L'application est maintenant disponible comme une app native
4. Utilisable sans connexion internet !

### Mode d'emploi rapide

1. **Configuration initiale** (bandeau supérieur)
   - Définissez la longueur de votre piste
   - Entrez la VMA du coureur
   - Choisissez la distance entre repères

2. **Paramétrage de l'exercice** (panneau gauche)
   - Sélectionnez le temps de course souhaité
   - Définissez le % de VMA à travailler
   - Vérifiez le résumé (distance, tours)

3. **Suivi en direct** (panneau central)
   - Choisissez "tour" ou "demi-tour"
   - Appuyez sur "Démarrer"
   - Tapez sur le gros bouton à chaque passage
   - La couleur vous indique la précision de l'allure

4. **Analyse** (panneau droit)
   - Consultez le tableau d'allure de référence
   - Suivez les statistiques en temps réel
   - Ajoutez des notes (météo, ressenti...)
   - Exportez vos données

## 🎨 Personnalisation

### Couleurs

Modifiez les variables CSS dans `src/index.css` :

```css
:root {
  --color-primary: #1e40af;
  --color-secondary: #3b82f6;
  /* ... */
}
```

### Icônes PWA

Remplacez les icônes dans `public/icons/` :
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Générateur recommandé : https://www.pwabuilder.com/imageGenerator

## 📐 Architecture technique

### Structure du projet

```
DemiFond/
├── public/
│   ├── icons/              # Icônes PWA
│   ├── robots.txt
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── TopBanner.jsx   # Sélecteurs principaux
│   │   ├── LeftPanel.jsx   # Paramètres exercice
│   │   ├── CenterPanel.jsx # Course en direct
│   │   └── RightPanel.jsx  # Tableau et stats
│   ├── hooks/
│   │   └── useTimer.js     # Hook chronomètre
│   ├── utils/
│   │   └── calculations.js # Logique de calcul
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js          # Config Vite + PWA
└── package.json
```

### Technologies utilisées

- **React 18** : Framework UI
- **Vite 5** : Build tool ultra-rapide
- **vite-plugin-pwa** : Génération automatique du Service Worker
- **Workbox** : Stratégies de cache avancées
- **CSS moderne** : Variables CSS, Grid, Flexbox
- **Responsive Design** : Mobile-first avec breakpoints tablette/desktop

## 🔧 Développement

### Scripts disponibles

```bash
npm run dev      # Dev server avec HMR
npm run build    # Build de production
npm run preview  # Preview du build
```

### Logique de calcul

Toutes les formules sont dans `src/utils/calculations.js` :

- `calculateTargetSpeed(vma, vmaPercent)` - Vitesse cible
- `calculateTotalDistance(speed, duration)` - Distance totale
- `calculateLaps(distance, trackLength)` - Nombre de tours
- `calculateLapTime(trackLength, speed)` - Temps par tour
- `getSpeedColor(observed, target)` - Couleur selon écart
- `generatePaceTable(...)` - Tableau d'allure complet

## 📊 Améliorations UX pour extérieur

### Optimisations implémentées

1. **Visibilité haute luminosité**
   - Contrastes élevés
   - Textes larges et lisibles
   - Mode haute luminosité automatique

2. **Interactions tactiles**
   - Boutons larges (min 48px)
   - Feedback haptique (vibration)
   - Zone de toucher généreuse

3. **Performance**
   - Chargement instantané (cache)
   - Pas de dépendances externes
   - Mise à jour UI fluide (100ms)

4. **Ergonomie mobile**
   - Une main suffisante
   - Scroll minimal
   - Actions principales accessibles

## 🐛 Dépannage

### L'app ne s'installe pas

- Vérifiez que vous utilisez HTTPS (ou localhost)
- Assurez-vous que le manifest.json est accessible
- Consultez la console du navigateur (F12)

### Le mode hors ligne ne fonctionne pas

- Actualisez la page après le premier chargement
- Vérifiez que le Service Worker est enregistré (DevTools > Application > Service Workers)
- Videz le cache et rechargez

### Les calculs semblent incorrects

- Vérifiez les unités (km/h, minutes, mètres)
- Consultez `src/utils/calculations.js` pour la logique
- Ouvrez un issue GitHub avec un exemple

## 📄 Licence

MIT - Libre d'utilisation et modification

## 🤝 Contribution

Les contributions sont bienvenues !

1. Fork le projet
2. Créez une branche (`git checkout -b feature/amelioration`)
3. Commit vos changements
4. Push vers la branche
5. Ouvrez une Pull Request

## 📞 Support

Pour toute question ou problème :
- Ouvrez une issue sur GitHub
- Consultez la documentation Vite PWA : https://vite-pwa-org.netlify.app/

---

Développé avec ❤️ pour les entraîneurs et coureurs
