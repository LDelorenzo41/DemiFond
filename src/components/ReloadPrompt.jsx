import React, { useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 h

/**
 * Deux messages liés au service worker :
 *
 * - « prête hors ligne » : signal indispensable avant de quitter le Wi-Fi de
 *   l'établissement pour le stade.
 * - « nouvelle version » : mise à jour appliquée UNIQUEMENT sur clic. Le bouton
 *   est désactivé tant qu'un chronomètre tourne, et une confirmation est demandée
 *   dès qu'il y a une séance à perdre : la mise à jour recharge la page et rien
 *   n'est persisté.
 *
 * Rien n'est affiché pendant une course : le bouton de passage occupe le bas de
 * l'écran et une frappe destinée à enregistrer un tour ne doit pas atterrir sur
 * « OK ». Les états sont conservés par le hook, le message revient à l'arrêt.
 */
const ReloadPrompt = ({ isRunning = false, hasSessionData = false }) => {
  const intervalRef = useRef(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Sans cela, le navigateur ne revérifie le service worker que lors d'une
      // navigation — ce qui n'arrive jamais dans une SPA sans routeur.
      // Le garde rend l'appel idempotent sous StrictMode (double montage en dev).
      if (!registration || intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        // Hors ligne, update() rejette : on l'absorbe pour ne pas polluer la console.
        registration.update().catch(() => {});
      }, UPDATE_CHECK_INTERVAL);
    },
  });

  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  // « Prête hors ligne » est une information, pas une action : elle se referme
  // seule. « Nouvelle version » attend au contraire une décision.
  useEffect(() => {
    if (!offlineReady) return undefined;
    const timeout = setTimeout(() => setOfflineReady(false), 6000);
    return () => clearTimeout(timeout);
  }, [offlineReady, setOfflineReady]);

  // Après les hooks, jamais avant : l'ordre des hooks doit rester stable.
  if (isRunning) return null;

  if (!offlineReady && !needRefresh) return null;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="pwa-toast" role="status" aria-live="polite">
      {needRefresh ? (
        <>
          <span className="pwa-toast-text">
            Une nouvelle version de DemiFond est disponible.
          </span>
          <div className="pwa-toast-actions">
            <button
              type="button"
              className="btn-pwa-toast btn-pwa-toast-primary"
              disabled={isRunning}
              title={
                isRunning
                  ? 'Chronomètre en cours : la mise à jour rechargerait la page'
                  : undefined
              }
              onClick={() => {
                if (
                  !hasSessionData ||
                  window.confirm(
                    'La mise à jour recharge la page et efface la séance en cours '
                      + '(chronomètre, tours, séries, bilans). Continuer ?'
                  )
                ) {
                  updateServiceWorker(true);
                }
              }}
            >
              Mettre à jour
            </button>
            <button type="button" className="btn-pwa-toast" onClick={close}>
              Plus tard
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="pwa-toast-text">
            ✅ DemiFond est prête : vous pouvez l'utiliser sans connexion.
          </span>
          <div className="pwa-toast-actions">
            <button type="button" className="btn-pwa-toast" onClick={close}>
              OK
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReloadPrompt;
