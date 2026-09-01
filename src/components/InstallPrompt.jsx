import React, { useState } from 'react';

/**
 * Bandeau d'installation, affiché uniquement quand l'app n'est pas déjà installée.
 *
 * Rendu comme frère de `.top-banner` (et non dans `.banner-content`, dont la
 * grille est figée à 3 colonnes en paysage iPad) : la mise en page existante
 * n'est donc pas touchée. Le bandeau disparaît définitivement une fois
 * l'application installée ou l'invitation refusée.
 */
const InstallPrompt = ({ canInstall, showIOSHint, onInstall, onDismiss }) => {
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  if (!canInstall && !showIOSHint) return null;

  const handleInstall = async () => {
    if (canInstall) {
      await onInstall();
    } else {
      setShowIOSSteps((visible) => !visible);
    }
  };

  return (
    <div className="install-banner" role="region" aria-label="Installer l'application">
      <div className="install-banner-content">
        <span className="install-banner-icon" aria-hidden="true">📲</span>

        <p className="install-banner-text">
          Installez DemiFond sur votre appareil pour l'ouvrir en un geste et
          l'utiliser <strong>sans connexion</strong>.
        </p>

        <div className="install-banner-actions">
          <button
            type="button"
            className="btn-install"
            onClick={handleInstall}
            aria-expanded={canInstall ? undefined : showIOSSteps}
          >
            {canInstall ? 'Installer' : 'Comment faire ?'}
          </button>
          <button
            type="button"
            className="btn-install-dismiss"
            onClick={onDismiss}
            aria-label="Masquer l'invitation à installer"
            title="Masquer"
          >
            ✕
          </button>
        </div>
      </div>

      {showIOSSteps && (
        <ol className="install-ios-steps">
          <li>
            Touchez le bouton <strong>Partager</strong>
            <span aria-hidden="true"> ⬆️ </span>
            dans la barre de Safari.
          </li>
          <li>
            Choisissez <strong>« Sur l'écran d'accueil »</strong>.
          </li>
          <li>
            Confirmez avec <strong>« Ajouter »</strong>.
          </li>
        </ol>
      )}
    </div>
  );
};

export default InstallPrompt;
