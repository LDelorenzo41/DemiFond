import { useCallback, useEffect, useState } from 'react';

const BANNER_DISMISSED_KEY = 'demifond.installBannerDismissed';

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
 * Vrai sur iPhone/iPad, y compris les iPad récents qui se déclarent « MacIntel ».
 */
const detectIOS = () => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIPhoneOrIPod = /iPhone|iPod/.test(ua);
  const isIPadOS =
    /iPad/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Exclut les navigateurs non-WebKit qui ne proposent pas « Sur l'écran d'accueil ».
  const isWebKit = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return (isIPhoneOrIPod || isIPadOS) && isWebKit;
};

/**
 * Gère l'installation de la PWA.
 *
 * - Chrome/Edge (desktop et Android) : capture `beforeinstallprompt` et expose
 *   `promptInstall()` pour ouvrir la boîte de dialogue native.
 * - iOS/Safari : aucun prompt programmable n'existe, on expose `isIOS` pour
 *   afficher des instructions manuelles.
 * - Navigateurs sans support (Firefox…) : tout reste à false, rien ne s'affiche.
 */
export default function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(detectStandalone);
  const [isIOS] = useState(detectIOS);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return window.localStorage.getItem(BANNER_DISMISSED_KEY) === '1';
    } catch {
      // Safari en navigation privée peut lever sur localStorage.
      return false;
    }
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      // Empêche la mini-infobar de Chrome pour déclencher le prompt nous-mêmes.
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
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
    window.addEventListener('appinstalled', handleAppInstalled);
    displayModeQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      displayModeQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    // L'événement n'est utilisable qu'une seule fois : Chrome en réémettra un
    // nouveau si l'utilisateur a refusé et redevient éligible.
    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(BANNER_DISMISSED_KEY, '1');
    } catch {
      // Sans stockage, le bandeau réapparaîtra au prochain chargement : acceptable.
    }
  }, []);

  const canInstall = Boolean(deferredPrompt) && !isInstalled;
  const canShowIOSHint = isIOS && !isInstalled;

  return {
    /** Prompt natif disponible (Chrome/Edge, desktop et Android). */
    canInstall,
    /** iOS : pas de prompt natif, on peut afficher les instructions manuelles. */
    canShowIOSHint,
    /** Bandeau visible : une installation est possible et l'invitation n'a pas été refusée. */
    showBanner: (canInstall || canShowIOSHint) && !dismissed,
    isInstalled,
    isIOS,
    promptInstall,
    dismissBanner,
  };
}
