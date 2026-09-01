import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' et non 'autoUpdate' : en 'autoUpdate' le plugin active
      // skipWaiting + clientsClaim, si bien qu'un nouveau service worker prend le
      // contrôle d'une page déjà chargée et purge le précache sous ses pieds.
      // Surtout, brancher virtual:pwa-register en 'autoUpdate' déclenche un
      // window.location.reload() automatique à chaque déploiement — ce qui
      // remettrait à zéro le chronomètre d'une séance en cours (tout l'état est
      // en mémoire). En 'prompt', le rechargement n'a lieu que sur clic explicite.
      registerType: 'prompt',

      // Le manifeste est maintenu à la main dans public/manifest.json et référencé
      // par index.html. On désactive la génération du plugin : sinon il injecte un
      // second <link rel="manifest"> vers /manifest.webmanifest, que les
      // navigateurs ignorent (seul le premier lien compte) mais qui diverge du vrai.
      manifest: false,

      // manifest.json n'est pas capté par globPatterns (qui ignore le .json) :
      // on l'ajoute ici pour qu'il reste disponible hors ligne, avec une révision
      // calculée sur son contenu — contrairement à additionalManifestEntries, qui
      // le figerait définitivement dans le cache.
      includeAssets: ['manifest.json'],

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Toute navigation hors ligne retombe sur index.html (SPA sans routeur).
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,

        // Les deux drapeaux sont indépendants et ce couple est volontaire :
        //
        // clientsClaim  : à la PREMIÈRE visite, le service worker prend aussitôt
        //   le contrôle de l'onglet déjà ouvert. Sans lui, l'onglet resterait non
        //   contrôlé jusqu'au rechargement suivant — un enseignant qui charge
        //   l'app au collège puis part au stade sans recharger se retrouverait
        //   sans hors-ligne.
        // skipWaiting  : laissé à false. Une nouvelle version reste donc en
        //   attente au lieu de s'activer sous une page vivante (ce qui purgerait
        //   le précache utilisé par la page affichée). Elle ne s'active que sur
        //   clic explicite, via le message SKIP_WAITING envoyé par ReloadPrompt.
        clientsClaim: true,
        skipWaiting: false,

        // Rendu explicite : au-delà de cette taille, Workbox exclut un fichier du
        // précache avec un simple avertissement, sans faire échouer le build —
        // l'app cesserait alors de fonctionner hors ligne en silence.
        // `npm run build` vérifie ensuite le précache (voir scripts/check-precache.mjs).
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },

      // Permet de vérifier l'installabilité et le hors-ligne dès `npm run dev`.
      // Sans effet sur le build : le plugin force enabled=false hors mode `serve`.
      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
        suppressWarnings: true,
      },
    }),
  ],
})
