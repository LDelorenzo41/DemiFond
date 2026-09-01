# 🏃 Running Pace Tracker - PWA

Application web progressive (PWA) pour le suivi d'allure de course à pied, conçue pour être utilisable hors connexion et optimisée pour tablettes et smartphones.

## ✨ Fonctionnalités

### Interface en 3 zones

1. **Bandeau supérieur** (sticky)
   - 🏃 Longueur de piste : 50m à 500m (par pas de 5m)
   - ⚡ VMA du coureur : 8 à 20 km/h (par pas de 0,25 km/h)
   - 📍 Distance entre repères : 5m à 50m (par pas de 5m)

2. **Panneau gauche - Paramètres**
   - ⏱️ Temps de course : 30 secondes à 15 minutes (par pas de 30s)
   - 📊 % de VMA : 60% à 120%
   - Résumé automatique (distance, tours, repères)
   - Légende des couleurs d'allure

3. **Panneau central - Course en direct**
   - ⏰ Chronomètre + compte à rebours
   - 📊 Barre de progression dynamique avec guidage visuel
   - Choix tour/demi-tour
   - Bouton tactile "INFO VITESSE" avec retour couleur :
     - 🔵 Bleu : écart ≤ 0,1 km/h (objectif atteint)
     - 🟢 Vert : écart ≤ 0,5 km/h (objectif presque atteint)
     - 🟡 Jaune : écart ≤ 1 km/h (allure à travailler)
     - 🔴 Rouge : écart > 1 km/h (objectif inadapté)
   - Bouton d'annulation du dernier passage
   - Historique des 5 derniers passages

4. **Panneau droit - Analyse**
   - 📋 Tableau d'allure simplifié (limité à objectif + 1 tour)
   - 📊 Statistiques temps réel
   - 💾 Bilan comparatif avec vitesse réelle

### Capacités PWA

- ✅ Fonctionne 100% hors ligne après le premier chargement
- ✅ Installable sur l'écran d'accueil (mobile/tablette/ordinateur)
- ✅ Bandeau d'installation intégré, avec instructions dédiées pour iOS
- ✅ Service Worker Workbox : tout est précaché (bundle, styles, icônes, export PDF)
- ✅ Mise à jour proposée à l'utilisateur, jamais imposée : aucun rechargement
  intempestif ne peut interrompre un chronomètre en cours
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

#### Déploiement sur Netlify (Recommandé)

1. **Via l'interface Netlify**
   - Connectez votre repo GitHub à https://app.netlify.com/
   - La configuration est automatique grâce à `netlify.toml`
   - Le site sera déployé et mis à jour automatiquement à chaque push

2. **Via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```

3. **Via drag & drop**
   ```bash
   npm run build
   # Puis glissez-déposez le dossier dist/ sur https://app.netlify.com/drop
   ```

📖 **Guide complet** : Voir [DEPLOY.md](./DEPLOY.md)

#### Autres plateformes
- **Vercel** : Support PWA complet
- **GitHub Pages** : Via GitHub Actions
- **Tout hébergeur de fichiers statiques** avec support HTTPS

## 📱 Utilisation sur le terrain

### Installation sur smartphone/tablette

**Android / Chrome / Edge / ordinateur**

1. Ouvrez l'application dans votre navigateur.
2. Un bandeau « Installez DemiFond… » apparaît sous les sélecteurs : appuyez sur
   **Installer**. (Le bouton d'installation de la barre d'adresse fonctionne aussi.)
3. L'application est disponible comme une app native.

**iPhone / iPad (Safari)**

iOS ne permet à aucun site de déclencher l'installation lui-même. Le bandeau
affiche donc **Comment faire ?**, qui déplie la marche à suivre :

1. Touchez le bouton **Partager** dans la barre de Safari.
2. Choisissez **« Sur l'écran d'accueil »**.
3. Confirmez avec **« Ajouter »**.

### Utilisation hors connexion

Chargez l'application **une fois** en étant connecté. Le message
« ✅ DemiFond est prête : vous pouvez l'utiliser sans connexion » confirme que
tout est en cache — y compris l'export PDF. Vous pouvez alors couper le réseau :
lancement, chronomètre, séries, tableau d'allure et export PDF restent
opérationnels.

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

Les icônes vivent dans `public/icons/` et sont déclarées dans
`public/manifest.json`. Elles ont des contraintes précises (zone de sécurité
Android, absence de transparence pour iOS) et un script de régénération : voir
**[docs/ICONS.md](docs/ICONS.md)**.

⚠️ Toute icône déclarée dans le manifeste doit exister : `npm run build` échoue
sinon (`scripts/check-precache.mjs`).

## 🧭 Compatibilité navigateurs

L'application vise explicitement les **iPad Air 2**, encore courants en
établissement, y compris ceux restés sous **iOS 12** (Safari 12.1).

C'est plus ancien que ce que Vite cible par défaut (Safari 14) : sans réglage,
React 18 émet `??` et `?.`, que Safari 12 ne sait pas analyser. Le module entier
est alors rejeté et l'écran reste **blanc**, sans message. D'où, dans
`vite.config.js` :

```js
build: {
  target: ['es2019', 'safari12'],
  cssTarget: ['safari12'],
}
```

`npm run build` échoue si du code incompatible réapparaît
(`scripts/check-browser-target.mjs`) — une montée de version de dépendance ne
peut donc pas recasser ces iPad en silence.

`Promise.allSettled` (Safari 13) est comblé par un court polyfill dans
`index.html`, car le helper de préchargement de Vite s'en sert.

En cas de panne au démarrage, l'application n'affiche jamais une page blanche :
un écran de diagnostic indique la cause et propose de vider les caches.

## 📐 Architecture technique

### Structure du projet

```
DemiFond/
├── design/
│   └── logo-512.png        # Master du logo (hors publicDir : non déployé)
├── docs/
│   └── ICONS.md            # Contraintes et régénération des icônes
├── public/
│   ├── icons/              # Icônes PWA (any + maskable, 192 et 512)
│   ├── apple-touch-icon.png# Icône iOS (180×180, sans transparence)
│   ├── manifest.json       # Manifeste : SOURCE DE VÉRITÉ UNIQUE
│   ├── robots.txt
│   └── vite.svg
├── scripts/
│   ├── check-precache.mjs  # Garde-fou build : précache et icônes complets
│   └── check-browser-target.mjs # Garde-fou build : compatibilité Safari 12.1
├── src/
│   ├── components/
│   │   ├── TopBanner.jsx   # Sélecteurs principaux
│   │   ├── LeftPanel.jsx   # Paramètres exercice
│   │   ├── CenterPanel.jsx # Course en direct
│   │   ├── RightPanel.jsx  # Tableau et stats
│   │   ├── InstallPrompt.jsx # Bandeau d'installation (+ aide iOS)
│   │   └── ReloadPrompt.jsx  # « Prête hors ligne » / « Nouvelle version »
│   ├── hooks/
│   │   ├── useTimer.js     # Hook chronomètre
│   │   └── usePWAInstall.js# Capture de beforeinstallprompt
│   ├── utils/
│   │   └── calculations.js # Logique de calcul
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html              # Un SEUL <link rel="manifest">
├── netlify.toml            # Redirections et en-têtes
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

- Vérifiez que vous utilisez HTTPS (ou localhost) : c'est une condition absolue.
- Ouvrez **DevTools > Application > Manifest** : aucune erreur ne doit s'afficher
  et les icônes doivent apparaître dans l'aperçu.
- Vérifiez qu'`index.html` ne contient **qu'un seul** `<link rel="manifest">` :
  les navigateurs ignorent silencieusement tous les suivants. `npm run build`
  échoue s'il y en a plusieurs.
- Sur iPhone/iPad, l'installation est forcément manuelle (Partager > Sur l'écran
  d'accueil) : aucun site ne peut la déclencher.
- Si l'app est déjà installée, le bandeau ne s'affiche plus — c'est voulu.

### Le mode hors ligne ne fonctionne pas

- Chargez la page **une fois** en ligne et attendez le message
  « DemiFond est prête ».
- Vérifiez que le Service Worker est enregistré et **activé**
  (DevTools > Application > Service Workers).
- DevTools > Application > Cache Storage doit contenir `index.html`, le bundle
  `assets/index-*.js` et la feuille `assets/index-*.css`.
- En développement, le Service Worker est **désactivé par défaut**. Pour tester
  l'installabilité ou le hors-ligne pendant `dev` : `VITE_PWA_DEV=true npm run dev`.
  La recette de référence reste `npm run build && npm run preview`, qui sert le
  Service Worker réellement déployé.

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
