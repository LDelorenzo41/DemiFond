import React, { useState } from 'react';

/**
 * Composant : Bandeau supérieur - Données fixes
 */
const TopBanner = ({
  trackLength,
  setTrackLength,
  vma,
  setVma,
  markerDistance,
  setMarkerDistance
}) => {
  // Générer les options de longueur de piste (50 à 400m par pas de 5m) + option personnalisée
  const trackLengthOptions = Array.from({ length: 71 }, (_, i) => 50 + i * 5); // 50 à 400m par pas de 5m
  
  // État pour gérer l'option personnalisée
  const [isCustomTrackLength, setIsCustomTrackLength] = useState(false);
  const [customTrackLength, setCustomTrackLength] = useState('');

  // Générer les options de VMA (8 à 20 km/h par pas de 0.25)
  const vmaOptions = Array.from({ length: 49 }, (_, i) => 8 + i * 0.25); // 8 à 20 km/h par pas de 0.25

  // Générer les options de distance entre repères (5 à 50m par pas de 5m)
  const markerDistanceOptions = Array.from({ length: 10 }, (_, i) => 5 + i * 5); // 5 à 50m par pas de 5m

  const handleTrackLengthChange = (e) => {
    const value = e.target.value;
    
    if (value === 'custom') {
      setIsCustomTrackLength(true);
      setCustomTrackLength('');
    } else {
      setIsCustomTrackLength(false);
      setTrackLength(Number(value));
    }
  };

  const handleCustomTrackLengthChange = (e) => {
    const value = e.target.value;
    setCustomTrackLength(value);
    
    const numValue = parseInt(value);
    if (numValue >= 10 && numValue <= 1000) {
      setTrackLength(numValue);
    }
  };

  return (
    <div className="top-banner">
      <div className="banner-content">
        {/* Longueur de piste */}
        <div className="selector-group">
          <label htmlFor="track-length">
            <span className="label-icon">🏃</span>
            Longueur de piste
          </label>
          {!isCustomTrackLength ? (
            <select
              id="track-length"
              value={trackLength}
              onChange={handleTrackLengthChange}
            >
              {trackLengthOptions.map(length => (
                <option key={length} value={length}>{length} m</option>
              ))}
              <option value="custom">Personnalisée...</option>
            </select>
          ) : (
            <div className="custom-input-group">
              <input
                type="number"
                value={customTrackLength}
                onChange={handleCustomTrackLengthChange}
                placeholder="Entrez la longueur"
                min="10"
                max="1000"
                className="custom-input"
              />
              <button 
                className="btn-back-to-select"
                onClick={() => {
                  setIsCustomTrackLength(false);
                  setTrackLength(200);
                }}
                title="Retour aux valeurs prédéfinies"
              >
                ↶
              </button>
            </div>
          )}
        </div>

        {/* VMA */}
        <div className="selector-group">
          <label htmlFor="vma">
            <span className="label-icon">⚡</span>
            VMA
          </label>
          <select
            id="vma"
            value={vma}
            onChange={(e) => setVma(Number(e.target.value))}
          >
            {vmaOptions.map(speed => (
              <option key={speed} value={speed}>{speed.toFixed(2)} km/h</option>
            ))}
          </select>
        </div>

        {/* Distance entre repères */}
        <div className="selector-group">
          <label htmlFor="marker-distance">
            <span className="label-icon">📍</span>
            Distance entre repères
          </label>
          <select
            id="marker-distance"
            value={markerDistance}
            onChange={(e) => setMarkerDistance(Number(e.target.value))}
          >
            {markerDistanceOptions.map(distance => (
              <option key={distance} value={distance}>{distance} m</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TopBanner;
