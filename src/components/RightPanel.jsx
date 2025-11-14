import React, { useState, useMemo, useEffect } from 'react';
import {
  calculateTargetSpeed,
  calculateLapTime,
  formatTime,
  generateSimplePaceTable,
  calculateTotalDistance,
  calculateLaps,
  calculateMarkers,
  calculateDistanceFromLaps
} from '../utils/calculations';

/**
 * Composant : Panneau droit - Tableau d'allure et bilan
 */
const RightPanel = ({ 
  trackLength, 
  markerDistance, 
  vma, 
  vmaPercent, 
  duration, 
  isHalfLap, 
  lapData, 
  seriesConfig,
  currentSeries,
  currentRep,
  performanceHistory,
  onValidatePerformance,
  isSeriesComplete,
  isRunning
}) => {
  const [notes, setNotes] = useState('');
  const [actualLaps, setActualLaps] = useState('');
  const [actualMarkers, setActualMarkers] = useState('');

  const targetSpeed = calculateTargetSpeed(vma, vmaPercent);
  const lapTime = calculateLapTime(trackLength, targetSpeed, false); // Toujours par tour complet pour le tableau

  // Calculs de l'objectif
  const expectedDistance = calculateTotalDistance(targetSpeed, duration);
  const { fullLaps: expectedLaps, remainingMeters } = calculateLaps(expectedDistance, trackLength);
  const expectedMarkers = calculateMarkers(remainingMeters, markerDistance);

  // Générer le tableau d'allures simplifié (temps par tour)
  // Limité à objectif + 1 tour
  const paceTable = useMemo(() => {
    const maxLaps = Math.max(expectedLaps + 1, 3); // Minimum 3 tours pour avoir quelque chose à afficher
    return generateSimplePaceTable(lapTime, maxLaps);
  }, [lapTime, expectedLaps]);

  // Réinitialiser les inputs de performance quand lapData est vide (nouveau départ ou RAZ) ET qu'on n'est PAS en mode série
  useEffect(() => {
    if ((!lapData || lapData.length === 0) && !seriesConfig) {
      setActualLaps('');
      setActualMarkers('');
    }
  }, [lapData, seriesConfig]);

  // Calculer le bilan si on a saisi des données
  const assessment = useMemo(() => {
    const laps = parseInt(actualLaps) || 0;
    const markers = parseInt(actualMarkers) || 0;

    if (laps === 0 && markers === 0) return null;

    const actualDistance = calculateDistanceFromLaps(laps, markers, trackLength, markerDistance);
    const distanceDiff = actualDistance - expectedDistance;
    const percentDiff = (distanceDiff / expectedDistance) * 100;

    // Calculer la vitesse réelle (distance en m, durée en minutes)
    const actualSpeed = (actualDistance / 1000) / duration * 60; // km/h
    const speedDiff = actualSpeed - targetSpeed;

    // Calculer le % de VMA réellement mobilisé
    const actualVmaPercent = (actualSpeed / vma) * 100;
    const vmaPercentDiff = actualVmaPercent - vmaPercent;

    // Déterminer l'appréciation
    let appreciation = '';
    let color = '';
    if (percentDiff >= -2 && percentDiff <= 2) {
      appreciation = 'Excellent ! Objectif parfaitement atteint';
      color = 'blue';
    } else if (percentDiff >= -5 && percentDiff <= 5) {
      appreciation = 'Très bien ! Objectif quasiment atteint';
      color = 'green';
    } else if (percentDiff >= -10 && percentDiff <= 10) {
      appreciation = 'Bien, mais il y a une marge de progression';
      color = 'yellow';
    } else {
      appreciation = distanceDiff > 0
        ? 'Attention : allure trop élevée pour l\'objectif'
        : 'Attention : objectif non atteint, allure à revoir';
      color = 'red';
    }

    return {
      actualDistance,
      expectedDistance,
      distanceDiff,
      percentDiff,
      actualSpeed,
      targetSpeed,
      speedDiff,
      actualVmaPercent,
      vmaPercentDiff,
      appreciation,
      color
    };
  }, [actualLaps, actualMarkers, expectedDistance, trackLength, markerDistance, duration, targetSpeed, vma, vmaPercent]);

  // Handler pour valider la performance et passer à la suivante
  const handleValidateAndNext = () => {
    if (!assessment) {
      alert('Veuillez d\'abord saisir la performance réelle (tours et repères)');
      return;
    }

    // Enregistrer et incrémenter
    onValidatePerformance(assessment);

    // Réinitialiser les inputs pour la course suivante
    setActualLaps('');
    setActualMarkers('');
  };

  // Calculer les statistiques si on a des données
  // En mode série, les statistiques sont cumulatives
  const stats = useMemo(() => {
    if (!lapData || lapData.length === 0) return null;

    const speeds = lapData.map(lap => lap.speed);
    const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const maxSpeed = Math.max(...speeds);
    const minSpeed = Math.min(...speeds);

    const colorCounts = lapData.reduce((acc, lap) => {
      acc[lap.color] = (acc[lap.color] || 0) + 1;
      return acc;
    }, {});

    return {
      avgSpeed,
      maxSpeed,
      minSpeed,
      totalLaps: lapData.length,
      colorCounts
    };
  }, [lapData]);

  // Calculer les statistiques cumulatives des performances en mode série
  const cumulativePerformanceStats = useMemo(() => {
    if (!seriesConfig || !performanceHistory || performanceHistory.length === 0) return null;

    const totalRuns = performanceHistory.length;
    const avgActualSpeed = performanceHistory.reduce((sum, p) => sum + p.actualSpeed, 0) / totalRuns;
    const avgVmaPercent = performanceHistory.reduce((sum, p) => sum + p.actualVmaPercent, 0) / totalRuns;
    const totalDistance = performanceHistory.reduce((sum, p) => sum + p.actualDistance, 0);
    
    // Compter les appréciations par couleur
    const colorDistribution = performanceHistory.reduce((acc, p) => {
      acc[p.color] = (acc[p.color] || 0) + 1;
      return acc;
    }, {});

    return {
      totalRuns,
      avgActualSpeed,
      avgVmaPercent,
      totalDistance,
      colorDistribution
    };
  }, [performanceHistory, seriesConfig]);

  const exportData = () => {
    const data = {
      configuration: {
        trackLength,
        markerDistance,
        vma,
        vmaPercent,
        targetSpeed: targetSpeed.toFixed(1),
        duration,
        isHalfLap
      },
      expected: {
        distance: expectedDistance,
        laps: expectedLaps,
        markers: expectedMarkers
      },
      actual: assessment ? {
        laps: parseInt(actualLaps),
        markers: parseInt(actualMarkers),
        distance: assessment.actualDistance,
        appreciation: assessment.appreciation
      } : null,
      paceTable,
      lapData,
      stats,
      notes
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `running-pace-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`right-panel panel ${isRunning ? 'panel-dimmed' : ''}`}>
      <h2>📋 Tableau d'allure</h2>

      <div className="pace-info">
        <p>
          <strong>Temps par tour:</strong> {formatTime(lapTime)}
        </p>
        <p>
          <strong>Vitesse cible:</strong> {targetSpeed.toFixed(1)} km/h
        </p>
        <p>
          <strong>Objectif:</strong> {expectedLaps} tours + {expectedMarkers} repères
        </p>
      </div>

      {/* Tableau des allures simplifié */}
      <div className="pace-table-container">
        <table className="pace-table">
          <thead>
            <tr>
              <th>Tour</th>
              <th>Temps tour</th>
              <th>Temps cumulé</th>
            </tr>
          </thead>
          <tbody>
            {paceTable.map((row) => (
              <tr key={row.lap}>
                <td>{row.lap}</td>
                <td>{formatTime(row.lapTime)}</td>
                <td>{formatTime(row.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulaire de saisie de la performance réelle */}
      <div className="performance-form">
        <h3>📝 Saisie de la performance réelle</h3>
        {seriesConfig && (
          <p className="current-run-info">
            Série {currentSeries}/{seriesConfig.totalSeries} - 
            Répétition {currentRep}/{seriesConfig.repsPerSeries}
          </p>
        )}
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="actual-laps">Nombre de tours</label>
            <input
              type="number"
              id="actual-laps"
              value={actualLaps}
              onChange={(e) => setActualLaps(e.target.value)}
              min="0"
              placeholder="0"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="actual-markers">Nombre de repères</label>
            <input
              type="number"
              id="actual-markers"
              value={actualMarkers}
              onChange={(e) => setActualMarkers(e.target.value)}
              min="0"
              placeholder="0"
              className="form-input"
            />
          </div>
        </div>

        {/* Bouton pour valider et passer à la course suivante (mode série uniquement) */}
        {seriesConfig && !isSeriesComplete && (
          <button
            className="btn-validate-next"
            onClick={handleValidateAndNext}
            disabled={!assessment}
            title={!assessment ? "Veuillez d'abord saisir la performance" : "Enregistrer et passer à la course suivante"}
          >
            ✓ Valider et passer à la suivante
          </button>
        )}

        {/* Message de fin si toutes les séries sont terminées */}
        {seriesConfig && isSeriesComplete && assessment && (
          <button
            className="btn-validate-final"
            onClick={handleValidateAndNext}
            title="Enregistrer la dernière performance"
          >
            ✓ Enregistrer la dernière performance
          </button>
        )}
      </div>

      {/* Bilan comparatif */}
      {assessment && (
        <div className={`assessment-box ${assessment.color}`}>
          <h3>📊 Bilan de cette course</h3>
          <div className="assessment-content">
            <div className="assessment-row">
              <span className="label">Distance attendue:</span>
              <span className="value">{Math.round(assessment.expectedDistance)} m</span>
            </div>
            <div className="assessment-row">
              <span className="label">Distance réalisée:</span>
              <span className="value">{Math.round(assessment.actualDistance)} m</span>
            </div>
            <div className="assessment-row">
              <span className="label">Écart distance:</span>
              <span className="value">
                {assessment.distanceDiff > 0 ? '+' : ''}
                {Math.round(assessment.distanceDiff)} m ({assessment.percentDiff.toFixed(1)}%)
              </span>
            </div>
            <div className="assessment-row">
              <span className="label">Vitesse réelle:</span>
              <span className="value">
                {assessment.actualSpeed.toFixed(2)} km/h
                ({assessment.speedDiff > 0 ? '+' : ''}{assessment.speedDiff.toFixed(2)} km/h)
              </span>
            </div>
            <div className="assessment-row">
              <span className="label">% VMA mobilisé:</span>
              <span className="value">
                {assessment.actualVmaPercent.toFixed(1)}%
                ({assessment.vmaPercentDiff > 0 ? '+' : ''}{assessment.vmaPercentDiff.toFixed(1)}%)
              </span>
            </div>
            <div className="assessment-appreciation">
              {assessment.appreciation}
            </div>
          </div>
        </div>
      )}

      {/* Statistiques en temps réel */}
      {stats && (
        <div className="stats-box">
          <h3>📊 Statistiques des passages {seriesConfig && '(cumulatives)'}</h3>
          <div className="stats-content">
            <div className="stat-item">
              <span className="stat-label">Passages:</span>
              <span className="stat-value">{stats.totalLaps}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Vitesse moy.:</span>
              <span className="stat-value">{stats.avgSpeed.toFixed(1)} km/h</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Min / Max:</span>
              <span className="stat-value">
                {stats.minSpeed.toFixed(1)} / {stats.maxSpeed.toFixed(1)} km/h
              </span>
            </div>

            <div className="color-distribution">
              <h4>Répartition:</h4>
              <div className="color-bars">
                {Object.entries(stats.colorCounts).map(([color, count]) => (
                  <div key={color} className="color-bar-item">
                    <span className={`color-dot ${color}`}></span>
                    <span className="color-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques cumulatives des performances (mode série) */}
      {cumulativePerformanceStats && (
        <div className="cumulative-performance-box">
          <h3>📈 Bilan cumulatif des performances réelles</h3>
          <div className="cumulative-performance-content">
            <div className="stat-item">
              <span className="stat-label">Courses effectuées:</span>
              <span className="stat-value">{cumulativePerformanceStats.totalRuns}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Vitesse moyenne:</span>
              <span className="stat-value">{cumulativePerformanceStats.avgActualSpeed.toFixed(2)} km/h</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">% VMA moyen:</span>
              <span className="stat-value">{cumulativePerformanceStats.avgVmaPercent.toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Distance totale:</span>
              <span className="stat-value">{Math.round(cumulativePerformanceStats.totalDistance)} m</span>
            </div>

            <div className="color-distribution">
              <h4>Répartition des performances:</h4>
              <div className="color-bars">
                {Object.entries(cumulativePerformanceStats.colorDistribution).map(([color, count]) => (
                  <div key={color} className="color-bar-item">
                    <span className={`color-dot ${color}`}></span>
                    <span className="color-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Détail de chaque performance */}
          <div className="performance-history-details">
            <h4>Détail par course:</h4>
            <div className="performance-history-list">
              {performanceHistory.map((perf, index) => (
                <div key={index} className={`performance-history-item ${perf.color}`}>
                  <div className="performance-history-header">
                    <strong>S{perf.series} - R{perf.rep}</strong>
                  </div>
                  <div className="performance-history-body">
                    <span>{Math.round(perf.actualDistance)} m</span>
                    <span>{perf.actualSpeed.toFixed(1)} km/h</span>
                    <span>{perf.actualVmaPercent.toFixed(1)}% VMA</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Zone de notes - Temporairement masquée */}
      {/* <div className="notes-section">
        <h3>📝 Notes personnelles</h3>
        <textarea
          className="notes-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Conditions météo, ressenti, observations..."
          rows={4}
        />
      </div> */}

      {/* Bouton d'export - Temporairement masqué */}
      {/* <button className="btn-export" onClick={exportData}>
        💾 Exporter les données
      </button> */}
    </div>
  );
};

export default RightPanel;
