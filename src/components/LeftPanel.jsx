import React, { useState } from 'react';
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
  markerDistance,
  onResetAll,
  onCreateSeries,
  seriesConfig,
  onCancelSeries
}) => {
  // État pour la modale de création de séries
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [totalSeries, setTotalSeries] = useState(3);
  const [repsPerSeries, setRepsPerSeries] = useState(5);

  // Options pour les sélecteurs
  const durationOptions = [0.5, ...Array.from({ length: 60 }, (_, i) => 1 + i * 0.5)]; // 30s à 30 min
  const vmaPercentOptions = Array.from({ length: 61 }, (_, i) => 60 + i); // 60% à 120%

  // Calculs pour le résumé
  const targetSpeed = calculateTargetSpeed(vma, vmaPercent);
  const totalDistance = calculateTotalDistance(targetSpeed, duration);
  const { fullLaps, remainingMeters } = calculateLaps(totalDistance, trackLength);
  const markers = calculateMarkers(remainingMeters, markerDistance);

  const handleOpenSeriesModal = () => {
    setShowSeriesModal(true);
  };

  const handleCloseSeriesModal = () => {
    setShowSeriesModal(false);
  };

  const handleValidateSeries = () => {
    if (totalSeries > 0 && repsPerSeries > 0) {
      onCreateSeries(totalSeries, repsPerSeries);
      setShowSeriesModal(false);
    } else {
      alert('Veuillez entrer des valeurs valides (minimum 1)');
    }
  };

  const handleCancelSeriesConfig = () => {
    if (window.confirm('Voulez-vous annuler la configuration des séries ?')) {
      onCancelSeries();
    }
  };

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

        {/* Bouton RAZ */}
        <button
          className="btn-reset"
          onClick={onResetAll}
          title="Réinitialiser tous les paramètres et données"
        >
          🔄 RAZ (Remise à zéro)
        </button>

        {/* Bouton Créer des séries */}
        {!seriesConfig ? (
          <button
            className="btn-series"
            onClick={handleOpenSeriesModal}
            title="Configurer des séries de courses"
          >
            📋 Créer des séries
          </button>
        ) : (
          <div className="series-info">
            <p className="series-config">
              <strong>Séries configurées :</strong><br />
              {seriesConfig.totalSeries} série{seriesConfig.totalSeries > 1 ? 's' : ''} × {seriesConfig.repsPerSeries} répétition{seriesConfig.repsPerSeries > 1 ? 's' : ''}
            </p>
            <button
              className="btn-cancel-series"
              onClick={handleCancelSeriesConfig}
              title="Annuler la configuration des séries"
            >
              ❌ Annuler les séries
            </button>
          </div>
        )}
      </div>

      {/* Modale de création de séries */}
      {showSeriesModal && (
        <div className="modal-overlay" onClick={handleCloseSeriesModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📋 Créer des séries</h3>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="total-series">Nombre de séries :</label>
                <input
                  type="number"
                  id="total-series"
                  value={totalSeries}
                  onChange={(e) => setTotalSeries(parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="reps-per-series">Répétitions par série :</label>
                <input
                  type="number"
                  id="reps-per-series"
                  value={repsPerSeries}
                  onChange={(e) => setRepsPerSeries(parseInt(e.target.value) || 1)}
                  min="1"
                  max="20"
                  className="form-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={handleCloseSeriesModal}>
                Annuler
              </button>
              <button className="btn-modal-validate" onClick={handleValidateSeries}>
                Valider
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
