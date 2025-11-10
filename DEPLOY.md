# 🚀 Guide de déploiement sur Netlify

## Méthode 1 : Déploiement via l'interface Netlify (Recommandé)

### Étape 1 : Préparer le dépôt
1. Assurez-vous que tous les changements sont committés et pushés sur GitHub
2. Le dépôt doit contenir :
   - `package.json` avec les scripts de build
   - `netlify.toml` pour la configuration
   - `.nvmrc` pour spécifier Node 18

### Étape 2 : Connecter à Netlify
1. Allez sur https://app.netlify.com/
2. Cliquez sur **"Add new site"** → **"Import an existing project"**
3. Choisissez **GitHub** comme provider
4. Sélectionnez le repository **LDelorenzo41/DemiFond**

### Étape 3 : Configuration du build
Les paramètres seront automatiquement détectés depuis `netlify.toml` :
- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Node version** : 18 (depuis `.nvmrc`)

### Étape 4 : Déployer
1. Cliquez sur **"Deploy site"**
2. Attendez que le build se termine (2-3 minutes)
3. Votre site sera accessible à l'URL fournie (ex: `https://random-name-123456.netlify.app`)

### Étape 5 : Configuration du nom de domaine (optionnel)
1. Dans les paramètres du site, allez à **"Domain settings"**
2. Cliquez sur **"Options"** → **"Edit site name"**
3. Choisissez un nom personnalisé (ex: `running-pace-tracker`)

---

## Méthode 2 : Déploiement via Netlify CLI

### Installation
```bash
npm install -g netlify-cli
```

### Authentification
```bash
netlify login
```

### Déploiement initial
```bash
# Build local
npm run build

# Déploiement en preview
netlify deploy

# Déploiement en production
netlify deploy --prod
```

---

## Méthode 3 : Déploiement par drag & drop

### Étape 1 : Build local
```bash
npm install
npm run build
```

### Étape 2 : Déployer
1. Allez sur https://app.netlify.com/drop
2. Glissez-déposez le dossier **`dist/`**
3. Le site sera déployé instantanément

---

## Configuration PWA

L'application est configurée comme PWA et fonctionnera automatiquement offline après le premier chargement grâce à :
- Service Worker généré par `vite-plugin-pwa`
- Manifest.json avec icônes
- Headers de cache dans `netlify.toml`

---

## Variables d'environnement (si nécessaire)

Si vous devez ajouter des variables d'environnement :
1. Allez dans **Site settings** → **Environment variables**
2. Ajoutez vos variables (elles seront préfixées par `VITE_` dans le code)

---

## Vérifications après déploiement

### ✅ Checklist
- [ ] L'application se charge correctement
- [ ] Le Service Worker s'installe (vérifier dans DevTools > Application)
- [ ] L'application fonctionne offline (mode avion)
- [ ] Le manifest est détecté (Chrome affiche "Installer l'app")
- [ ] Les calculs fonctionnent correctement
- [ ] La barre de progression s'anime
- [ ] Le mode responsive fonctionne sur mobile

### 🔧 Debug
Si quelque chose ne fonctionne pas :
1. Consultez les logs de build dans Netlify
2. Vérifiez la console du navigateur (F12)
3. Testez en local avec `npm run preview` avant de déployer

---

## Déploiement continu (CD)

Netlify détecte automatiquement les nouveaux commits sur la branche `main` :
1. Pushez sur `main`
2. Le build démarre automatiquement
3. Le site est mis à jour en 2-3 minutes

---

## Support HTTPS

Netlify fournit automatiquement un certificat SSL/TLS gratuit via Let's Encrypt.
Votre site sera accessible en HTTPS immédiatement.

---

## Performance

L'application est optimisée pour :
- Score Lighthouse > 90
- Chargement initial < 2s
- Time to Interactive < 3s
- PWA complète avec cache offline

---

## Ressources

- Documentation Netlify : https://docs.netlify.com/
- Vite PWA Plugin : https://vite-pwa-org.netlify.app/
- Guide PWA : https://web.dev/progressive-web-apps/

---

Bon déploiement ! 🚀
