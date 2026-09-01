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

> ⚠️ **Le drag & drop ignore `netlify.toml`**, qui se trouve à la racine du dépôt
> et non dans `dist/`. Vous perdez donc la redirection SPA, les en-têtes de cache
> et le `Content-Type` du manifeste. À réserver à un test rapide : pour la
> production, utilisez la méthode 1 (Git) ou la méthode 2 (CLI).

---

## Configuration PWA

L'application fonctionne hors ligne dès le premier chargement terminé, grâce à :
- un Service Worker Workbox généré par `vite-plugin-pwa` (précache complet :
  bundle, styles, icônes, manifeste et les chunks utilisés par l'export PDF) ;
- `public/manifest.json`, **source de vérité unique** du manifeste, référencé par
  l'unique `<link rel="manifest">` d'`index.html`. La génération de manifeste par
  le plugin est volontairement désactivée (`manifest: false`) pour qu'il ne
  puisse pas en injecter un second, que les navigateurs ignoreraient ;
- les redirections et en-têtes de `netlify.toml`.

### Points à ne pas casser

- **Ne jamais ajouter un second `<link rel="manifest">`** : seul le premier est lu.
- **`id` et `start_url` doivent rester `"/"`** : ils constituent l'identité de
  l'application. Les modifier ferait apparaître une installation en double chez
  les utilisateurs qui ont déjà installé DemiFond.
- **Ne pas repasser en `registerType: 'autoUpdate'`** : combiné à
  `virtual:pwa-register`, il déclenche un `window.location.reload()` à chaque
  déploiement — ce qui remettrait à zéro le chronomètre d'une séance en cours.
- **La règle SPA `/*` doit rester la dernière** de `netlify.toml`, et non forcée :
  sinon elle prendrait le pas sur les fichiers statiques.

`npm run build` exécute `scripts/check-precache.mjs`, qui échoue si le précache
est incomplet, si une icône déclarée est absente, ou s'il y a plusieurs balises
de manifeste.

---

## Variables d'environnement (si nécessaire)

Si vous devez ajouter des variables d'environnement :
1. Allez dans **Site settings** → **Environment variables**
2. Ajoutez vos variables (elles seront préfixées par `VITE_` dans le code)

---

## Vérifications après déploiement

### ✅ Checklist
- [ ] L'application se charge correctement
- [ ] **DevTools > Application > Manifest** : aucune erreur, les 4 icônes
      s'affichent dans l'aperçu, `id` et `start_url` valent `/`
- [ ] **DevTools > Application > Service Workers** : le Service Worker est
      `activated` et contrôle la page
- [ ] Chrome propose l'installation (icône dans la barre d'adresse) et le
      bandeau « Installez DemiFond… » apparaît dans la page
- [ ] Après installation, le bandeau ne s'affiche plus
- [ ] Sur iPhone/iPad, le bandeau affiche « Comment faire ? » et déplie les
      3 étapes
- [ ] L'application fonctionne offline (mode avion), **export PDF compris**
- [ ] Un asset inexistant renvoie bien un 404 et non la page d'accueil :
      `curl -I https://<site>/assets/inexistant.js` → `404`
- [ ] `curl -I https://<site>/assets/index-*.js` → `200` (la règle 404 ne doit
      pas casser les vrais assets)
- [ ] `curl -sI https://<site>/manifest.json | grep -i content-type`
      → `application/manifest+json`
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
