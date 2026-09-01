import React, { useState, useRef } from 'react';
import TopBanner from './components/TopBanner';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
import InstallPrompt from './components/InstallPrompt';
import ReloadPrompt from './components/ReloadPrompt';
import PWABoundary from './components/PWABoundary';
import usePWAInstall from './hooks/usePWAInstall';
import './App.css';

/**
 * Composant principal de l'application PWA de suivi d'allure
 */
function App() {
  // États pour les paramètres du bandeau supérieur
  const [trackLength, setTrackLength] = useState(200); // 200m par défaut
  const [vma, setVma] = useState(12); // 12 km/h par défaut
  const [markerDistance, setMarkerDistance] = useState(10); // 10m par défaut

  // États pour les paramètres de l'exercice
  const [duration, setDuration] = useState(3); // 3 minutes par défaut
  const [vmaPercent, setVmaPercent] = useState(80); // 80% par défaut

  // État pour le mode d'observation (tour ou demi-tour)
  const [isHalfLap, setIsHalfLap] = useState(false);

  // État pour les données de passage
  const [lapData, setLapData] = useState([]);

  // États pour les séries
  const [seriesConfig, setSeriesConfig] = useState(null); // { totalSeries: 3, repsPerSeries: 5, recoveryBetweenReps: 60, recoveryBetweenSeries: 180 }
  const [currentSeries, setCurrentSeries] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);

  // État pour les bilans de performance cumulatifs (en mode série)
  const [performanceHistory, setPerformanceHistory] = useState([]);

  // État pour savoir si une course est en cours
  const [isRunning, setIsRunning] = useState(false);

  // État pour le chronomètre de récupération
  const [isRecoveryActive, setIsRecoveryActive] = useState(false);
  const [recoveryType, setRecoveryType] = useState(''); // 'rep' ou 'series'
  const [nextSeries, setNextSeries] = useState(1);
  const [nextRep, setNextRep] = useState(1);

  // Ref pour accéder aux fonctions de CenterPanel
  const centerPanelRef = useRef();

  // Installation de la PWA (bandeau d'invitation + instructions iOS)
  const {
    canInstall,
    canShowIOSHint,
    canOfferInstall,
    iosBrowser,
    showBanner,
    promptInstall,
    dismissBanner,
    reopenBanner,
  } = usePWAInstall();

  const handleLapData = (data) => {
    setLapData(prev => [...prev, data]);
  };

  const handleResetLapData = (newData) => {
    setLapData(newData);
  };

  // Créer des séries
  const handleCreateSeries = (totalSeries, repsPerSeries, recoveryBetweenReps, recoveryBetweenSeries) => {
    setSeriesConfig({ 
      totalSeries, 
      repsPerSeries, 
      recoveryBetweenReps, 
      recoveryBetweenSeries 
    });
    setCurrentSeries(1);
    setCurrentRep(1);
    setPerformanceHistory([]);
  };

  // Annuler les séries
  const handleCancelSeries = () => {
    setSeriesConfig(null);
    setCurrentSeries(1);
    setCurrentRep(1);
    setPerformanceHistory([]);
    setIsRecoveryActive(false);
  };

  // Enregistrer une performance et passer à la suivante
  const handleValidatePerformance = (assessment) => {
    if (!seriesConfig || !assessment) return;

    // Enregistrer le bilan avec les compteurs ACTUELS
    const performanceData = {
      series: currentSeries,
      rep: currentRep,
      ...assessment
    };
    setPerformanceHistory(prev => [...prev, performanceData]);

    const { totalSeries, repsPerSeries, recoveryBetweenReps, recoveryBetweenSeries } = seriesConfig;

    // Déterminer la prochaine série/répétition
    let willChangeSeries = false;
    let newSeries = currentSeries;
    let newRep = currentRep;

    if (currentRep < repsPerSeries) {
      // Passer à la répétition suivante
      newRep = currentRep + 1;
    } else if (currentSeries < totalSeries) {
      // Passer à la série suivante
      newSeries = currentSeries + 1;
      newRep = 1;
      willChangeSeries = true;
    } else {
      // Toutes les séries sont terminées
      alert('🎉 Toutes les séries sont terminées ! Félicitations !');
      return;
    }

    // Déterminer le type de récupération et la durée
    const recoveryDuration = willChangeSeries ? recoveryBetweenSeries : recoveryBetweenReps;
    const recType = willChangeSeries ? 'series' : 'rep';

    // Réinitialiser le chronomètre pour la course suivante
    if (centerPanelRef.current && centerPanelRef.current.resetForNextRun) {
      centerPanelRef.current.resetForNextRun();
    }

    // Lancer le chronomètre de récupération
    setNextSeries(newSeries);
    setNextRep(newRep);
    setRecoveryType(recType);
    setIsRecoveryActive(true);

    // Les compteurs seront incrémentés après la récupération
  };

  // Terminer la récupération et passer à la course suivante
  const handleRecoveryComplete = () => {
    setIsRecoveryActive(false);
    setCurrentSeries(nextSeries);
    setCurrentRep(nextRep);
  };

  // Ignorer la récupération
  const handleSkipRecovery = () => {
    setIsRecoveryActive(false);
    setCurrentSeries(nextSeries);
    setCurrentRep(nextRep);
  };

  // Vérifier si toutes les courses sont terminées
  const isSeriesComplete = () => {
    if (!seriesConfig) return false;
    return currentSeries === seriesConfig.totalSeries && currentRep === seriesConfig.repsPerSeries;
  };

  // Fonction pour réinitialiser tout (bouton RAZ)
  const handleResetAll = () => {
    // Si des séries sont en cours, demander confirmation
    if (seriesConfig) {
      const confirmed = window.confirm(
        'Vous avez des séries en cours. Voulez-vous vraiment tout réinitialiser ? Cela annulera également le paramétrage des séries.'
      );
      if (!confirmed) return;
    }

    // Réinitialiser les paramètres du bandeau
    setTrackLength(200);
    setVma(12);
    setMarkerDistance(10);

    // Réinitialiser les paramètres de l'exercice
    setDuration(3);
    setVmaPercent(80);

    // Réinitialiser le mode d'observation
    setIsHalfLap(false);

    // Réinitialiser les données de course
    setLapData([]);

    // Réinitialiser les séries
    setSeriesConfig(null);
    setCurrentSeries(1);
    setCurrentRep(1);
    setPerformanceHistory([]);
    setIsRecoveryActive(false);

    // Appeler la fonction de reset du CenterPanel
    if (centerPanelRef.current && centerPanelRef.current.resetHistory) {
      centerPanelRef.current.resetHistory();
    }
  };

  return (
    <div className="app">
      <TopBanner
        trackLength={trackLength}
        setTrackLength={setTrackLength}
        vma={vma}
        setVma={setVma}
        markerDistance={markerDistance}
        setMarkerDistance={setMarkerDistance}
      />

      <div className="main-content">
        <LeftPanel
          duration={duration}
          setDuration={setDuration}
          vmaPercent={vmaPercent}
          setVmaPercent={setVmaPercent}
          trackLength={trackLength}
          vma={vma}
          markerDistance={markerDistance}
          onResetAll={handleResetAll}
          onCreateSeries={handleCreateSeries}
          seriesConfig={seriesConfig}
          onCancelSeries={handleCancelSeries}
          isRunning={isRunning}
        />

        <CenterPanel
          ref={centerPanelRef}
          duration={duration}
          vma={vma}
          vmaPercent={vmaPercent}
          trackLength={trackLength}
          isHalfLap={isHalfLap}
          setIsHalfLap={setIsHalfLap}
          onLapData={handleLapData}
          onResetLapData={handleResetLapData}
          seriesConfig={seriesConfig}
          currentSeries={currentSeries}
          currentRep={currentRep}
          onRunningChange={setIsRunning}
          isRecoveryActive={isRecoveryActive}
          recoveryType={recoveryType}
          recoveryDuration={seriesConfig ? (recoveryType === 'series' ? seriesConfig.recoveryBetweenSeries : seriesConfig.recoveryBetweenReps) : 0}
          nextSeries={nextSeries}
          nextRep={nextRep}
          onRecoveryComplete={handleRecoveryComplete}
          onSkipRecovery={handleSkipRecovery}
        />

        <RightPanel
          trackLength={trackLength}
          markerDistance={markerDistance}
          vma={vma}
          vmaPercent={vmaPercent}
          duration={duration}
          isHalfLap={isHalfLap}
          lapData={lapData}
          seriesConfig={seriesConfig}
          currentSeries={currentSeries}
          currentRep={currentRep}
          performanceHistory={performanceHistory}
          onValidatePerformance={handleValidatePerformance}
          isSeriesComplete={isSeriesComplete()}
          isRunning={isRunning}
        />
      </div>

            {/* Footer avec copyright et liens */}
      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-copyright">© 2025 LD Teach & Tech</p>
          <div className="footer-apps">
            <p className="footer-title">Mes autres applications</p>
            <div className="footer-links">
              <a 
                href="https://profassist.net" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                ProfAssist
              </a>
              <span className="footer-separator">•</span>
              <a 
                href="https://epsegal.netlify.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                EPS Égalité
              </a>
              {canOfferInstall && (
                <>
                  <span className="footer-separator">•</span>
                  <button
                    type="button"
                    className="footer-link footer-link-button"
                    onClick={reopenBanner}
                  >
                    Installer l'application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Pile fixe en bas d'écran : le message de service worker et le bandeau
          d'installation s'empilent au lieu de se recouvrir, quelle que soit la
          hauteur de l'un ou de l'autre. */}
      <div className="pwa-stack">
        <PWABoundary>
          <ReloadPrompt
            isRunning={isRunning}
            hasSessionData={
              isRunning || isRecoveryActive || lapData.length > 0 || Boolean(seriesConfig)
            }
          />

          {/* Jamais pendant une course : on n'interrompt pas un chronométrage. */}
          {showBanner && !isRunning && (
            <InstallPrompt
              canInstall={canInstall}
              showIOSHint={canShowIOSHint}
              iosBrowser={iosBrowser}
              onInstall={promptInstall}
              onDismiss={dismissBanner}
            />
          )}
        </PWABoundary>
      </div>
    </div>
  );
}

export default App;
