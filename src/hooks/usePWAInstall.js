import { useCallback, useEffect, useRef, useState } from 'react';

const BANNER_DISMISSED_KEY = 'demifond.installBannerDismissedAt';

// Un refus met le bandeau en sourdine, il ne le supprime pas définitivement :
// un appui accidentel sur la croix ne doit pas rendre l'app à jamais
// non installable depuis l'interface.
const DISMISS_DAYS = 30;

/**
 * Vrai quand l'app tourne déjà en mode installé (Android/desktop ou iOS).
 */
const detectStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true // iOS
  );
};

/**
 * Détecte iOS et le navigateur utilisé.
 *
 * Tous les navigateurs iOS savent « Ajouter à l'écran d'accueil » depuis
 * iOS 16.4 : on ne doit donc pas les exclure, seulement adapter le libellé,
 * car le bouton Partager ne se trouve pas au même endroit selon l'application.
 */
const detectIOS = () => {
  if (typeof window === 'undefined') return { isIOS: false, iosBrowser: 'Safari' };

  const ua = window.navigator.userAgent;
  const isIPhoneOrIPod = /iPhone|iPod/.test(ua);
  // Les iPad récents se déclarent « MacIntel » : le tactile les distingue d'un Mac.
  const isIPadOS =
    /iPad/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const iosBrowser = /CriOS/.test(ua)
    ? 'Chrome'
    : /EdgiOS/.test(ua)
      ? 'Edge'
      : /FxiOS/.test(ua)
        ? 'Firefox'
        : 'Safari';

  return { isIOS: isIPhoneOrIPod || isIPadOS, iosBrowser };
};

const readDismissedAt = () => {
  try {
    const value = Number(window.localStorage.getItem(BANNER_DISMISSED_KEY));
    return Number.isFinite(value) && value > 0
      ? Date.now() - value < DISMISS_DAYS * 24 * 60 * 60 * 1000
      : false;
  } catch {
    // Safari en navigation privée peut lever sur localStorage.
    return false;
  }
};

/**
 * Gère l'installation de la PWA.
 *
 * - Chrome/Edge (desktop et Android) : récupère l'événement `beforeinstallprompt`
 *   et expose `promptInstall()` pour ouvrir la boîte de dialogue native.
 * - iOS : aucun prompt programmable n'existe, on expose `canShowIOSHint` pour
 *   afficher les instructions manuelles.
 * - Navigateurs sans support : tout reste à false, rien ne s'affiche.
 */
export default function usePWAInstall() {
  // L'événement est d'abord capté par le script inline d'index.html : Chrome peut
  // l'émettre avant même que ce bundle ne s'exécute, et il serait alors perdu.
  const [deferredPrompt, setDeferredPrompt] = useState(
    () => (typeof window === 'undefined' ? null : window.__pwaInstallEvent || null)
  );
  const [isInstalled, setIsInstalled] = useState(detectStandalone);
  const [{ isIOS, iosBrowser }] = useState(detectIOS);
  const [dismissed, setDismissed] = useState(readDismissedAt);
  const promptingRef = useRef(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      // Empêche la mini-infobar de Chrome pour déclencher le prompt nous-mêmes.
      event.preventDefault();
      window.__pwaInstallEvent = event;
      setDeferredPrompt(event);
    };

    // Émis par le script inline quand il a capté l'événement avant React.
    const handleAvailable = () => setDeferredPrompt(window.__pwaInstallEvent || null);

    const handleAppInstalled = () => {
      window.__pwaInstallEvent = null;
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    // Le passage en mode installé peut aussi se produire sans événement
    // `appinstalled` (ouverture depuis l'icône de l'écran d'accueil).
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (event) => {
      if (event.matches) setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-available', handleAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);
    displayModeQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-available', handleAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    // Sur écran tactile, un double appui rapide rappellerait prompt() sur un
    // événement déjà consommé, ce qui lève.
    if (!deferredPrompt || promptingRef.current) return false;
    promptingRef.current = true;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      return outcome === 'accepted';
    } catch {
      return false;
    } finally {
      // L'événement n'est utilisable qu'une fois : Chrome en réémettra un
      // nouveau si l'utilisateur a refusé et redevient éligible.
      window.__pwaInstallEvent = null;
      setDeferredPrompt(null);
      promptingRef.current = false;
    }
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(BANNER_DISMISSED_KEY, String(Date.now()));
    } catch {
      // Sans stockage, le bandeau réapparaîtra au prochain chargement : acceptable.
    }
  }, []);

  // Permet de rouvrir le bandeau depuis le pied de page après un refus.
  const reopenBanner = useCallback(() => {
    setDismissed(false);
    try {
      window.localStorage.removeItem(BANNER_DISMISSED_KEY);
    } catch {
      // Sans stockage, l'état en mémoire suffit pour cette session.
    }
  }, []);

  const canInstall = Boolean(deferredPrompt) && !isInstalled;
  const canShowIOSHint = isIOS && !isInstalled;

  return {
    /** Prompt natif disponible (Chrome/Edge, desktop et Android). */
    canInstall,
    /** iOS : pas de prompt natif, on affiche les instructions manuelles. */
    canShowIOSHint,
    /** Nom du navigateur iOS, pour situer le bouton Partager. */
    iosBrowser,
    /** Bandeau visible : installation possible et invitation non mise en sourdine. */
    showBanner: (canInstall || canShowIOSHint) && !dismissed,
    /** Une installation reste possible : sert au lien permanent du pied de page. */
    canOfferInstall: canInstall || canShowIOSHint,
    isInstalled,
    isIOS,
    promptInstall,
    dismissBanner,
    reopenBanner,
  };
}
