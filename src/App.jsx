import React, { useState, useRef } from 'react';
import TopBanner from './components/TopBanner';
import LeftPanel from './components/LeftPanel';
import CenterPanel from './components/CenterPanel';
import RightPanel from './components/RightPanel';
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
  const [seriesConfig, setSeriesConfig] = useState(null); // { totalSeries: 3, repsPerSeries: 5 }
  const [currentSeries, setCurrentSeries] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);

  // État pour les bilans de performance cumulatifs (en mode série)
  const [performanceHistory, setPerformanceHistory] = useState([]);

  // Ref pour accéder aux fonctions de CenterPanel
  const centerPanelRef = useRef();

  const handleLapData = (data) => {
    setLapData(prev => [...prev, data]);
  };

  const handleResetLapData = (newData) => {
    setLapData(newData);
  };

  // Créer des séries
  const handleCreateSeries = (totalSeries, repsPerSeries) => {
    setSeriesConfig({ totalSeries, repsPerSeries });
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

    const { totalSeries, repsPerSeries } = seriesConfig;

    // Incrémenter la répétition
    if (currentRep < repsPerSeries) {
      setCurrentRep(prev => prev + 1);
    } else if (currentSeries < totalSeries) {
      // Passer à la série suivante
      setCurrentSeries(prev => prev + 1);
      setCurrentRep(1);
    } else {
      // Toutes les séries sont terminées
      alert('🎉 Toutes les séries sont terminées ! Félicitations !');
      return;
    }

    // Réinitialiser le chronomètre pour la course suivante
    if (centerPanelRef.current && centerPanelRef.current.resetForNextRun) {
      centerPanelRef.current.resetForNextRun();
    }
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
        />
      </div>

      {/* Footer avec copyright */}
      <footer className="app-footer">
        <p>© 2025 LD Teach & Tech</p>
      </footer>
    </div>
  );
}

export default App;