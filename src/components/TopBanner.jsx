import React from 'react';

/**
 * Composant : Bandeau supérieur avec les 3 sélecteurs principaux
 * - Longueur de piste
 * - VMA du coureur
 * - Distance entre repères
 */
const TopBanner = ({ trackLength, setTrackLength, vma, setVma, markerDistance, setMarkerDistance }) => {
  // Options pour les sélecteurs
  const trackLengthOptions = Array.from({ length: 8 }, (_, i) => 50 + i * 50); // 50 à 400m
  const vmaOptions = Array.from({ length: 25 }, (_, i) => 8 + i * 0.5); // 8 à 20 km/h
  const markerDistanceOptions = Array.from({ length: 10 }, (_, i) => 5 + i * 5); // 5 à 50m

  return (
    <div className="top-banner">
      <div className="banner-content">
        <div className="selector-group">
          <label htmlFor="track-length">
            <span className="label-icon">🏃</span>
            <span>Longueur piste</span>
          </label>
          <select
            id="track-length"
            value={trackLength}
            onChange={(e) => setTrackLength(Number(e.target.value))}
          >
            {trackLengthOptions.map(length => (
              <option key={length} value={length}>{length} m</option>
            ))}
          </select>
        </div>

        <div className="selector-group">
          <label htmlFor="vma">
            <span className="label-icon">⚡</span>
            <span>VMA coureur</span>
          </label>
          <select
            id="vma"
            value={vma}
            onChange={(e) => setVma(Number(e.target.value))}
          >
            {vmaOptions.map(speed => (
              <option key={speed} value={speed}>{speed.toFixed(1)} km/h</option>
            ))}
          </select>
        </div>

        <div className="selector-group">
          <label htmlFor="marker-distance">
            <span className="label-icon">📍</span>
            <span>Distance repères</span>
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
