import React from 'react';
import {
  calculateTargetSpeed,
  calculateTotalDistance,
  calculateLaps,
  calculateMarkers
} from '../utils/calculations';

/**
 * Composant : Panneau gauche - Paramètres de l'exercice
 */
const LeftPanel = ({
  duration,
  setDuration,
  vmaPercent,
  setVmaPercent,
  trackLength,
  vma,
  markerDistance
}) => {
  // Options pour les sélecteurs
  const durationOptions = [0.5, ...Array.from({ length: 29 }, (_, i) => 1 + i * 0.5)]; // 30s à 15 min
  const vmaPercentOptions = Array.from({ length: 61 }, (_, i) => 60 + i); // 60% à 120%

  // Calculs pour le résumé
  const targetSpeed = calculateTargetSpeed(vma, vmaPercent);
  const totalDistance = calculateTotalDistance(targetSpeed, duration);
  const { fullLaps, remainingMeters } = calculateLaps(totalDistance, trackLength);
  const markers = calculateMarkers(remainingMeters, markerDistance);

  return (
    <div className="left-panel panel">
      <h2>⚙️ Paramètres de l'exercice</h2>

      <div className="param-section">
        <label htmlFor="duration">
          <span className="label-text">Temps de course</span>
        </label>
        <select
          id="duration"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="param-select"
        >
          {durationOptions.map(time => (
            <option key={time} value={time}>
              {time >= 1 ? `${time.toFixed(1)} min` : `${time * 60} sec`}
            </option>
          ))}
        </select>
      </div>

      <div className="param-section">
        <label htmlFor="vma-percent">
          <span className="label-text">% de VMA</span>
        </label>
        <select
          id="vma-percent"
          value={vmaPercent}
          onChange={(e) => setVmaPercent(Number(e.target.value))}
          className="param-select"
        >
          {vmaPercentOptions.map(percent => (
            <option key={percent} value={percent}>{percent}%</option>
          ))}
        </select>
      </div>

      <div className="summary-box">
        <h3>📊 Résumé</h3>
        <div className="summary-content">
          <p>
            <strong>{Math.round(totalDistance)} mètres</strong> à{' '}
            <strong>{targetSpeed.toFixed(1)} km/h</strong>
          </p>
          <p className="summary-detail">
            soit <strong>{fullLaps} tours</strong>
            {markers > 0 && (
              <> et <strong>{markers} repère{markers > 1 ? 's' : ''}</strong></>
            )}
          </p>
        </div>
      </div>

      <div className="legend-box">
        <h3>🎨 Légende</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color blue"></span>
            <span>Objectif atteint</span>
          </div>
          <div className="legend-item">
            <span className="legend-color green"></span>
            <span>Objectif presque atteint</span>
          </div>
          <div className="legend-item">
            <span className="legend-color yellow"></span>
            <span>Allure à travailler</span>
          </div>
          <div className="legend-item">
            <span className="legend-color red"></span>
            <span>Objectif inadapté</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
