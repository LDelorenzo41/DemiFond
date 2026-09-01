import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 h

/**
 * Deux messages liés au service worker :
 *
 * - « prête hors ligne » : signal indispensable avant de quitter le Wi-Fi de
 *   l'établissement pour le stade.
 * - « nouvelle version » : mise à jour appliquée UNIQUEMENT sur clic. Le bouton
 *   est désactivé tant qu'un chronomètre tourne, car la mise à jour recharge la
 *   page et l'état de la séance n'est conservé qu'en mémoire.
 */
const ReloadPrompt = ({ isRunning = false }) => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Sans cela, le navigateur ne revérifie le service worker que lors d'une
      // navigation — ce qui n'arrive jamais dans une SPA sans routeur.
      if (registration) {
        setInterval(() => {
          // Hors ligne, update() rejette : on l'absorbe pour ne pas polluer la console.
          registration.update().catch(() => {});
        }, UPDATE_CHECK_INTERVAL);
      }
    },
  });

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
              onClick={() => updateServiceWorker(true)}
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
