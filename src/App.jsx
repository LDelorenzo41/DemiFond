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

  // Ref pour accéder aux fonctions de CenterPanel
  const centerPanelRef = useRef();

  const handleLapData = (data) => {
    setLapData(prev => [...prev, data]);
  };

  const handleResetLapData = (newData) => {
    setLapData(newData);
  };

  // Fonction pour réinitialiser tout (bouton RAZ)
  const handleResetAll = () => {
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
        />

        <RightPanel
          trackLength={trackLength}
          markerDistance={markerDistance}
          vma={vma}
          vmaPercent={vmaPercent}
          duration={duration}
          isHalfLap={isHalfLap}
          lapData={lapData}
        />
      </div>
    </div>
  );
}

export default App;
