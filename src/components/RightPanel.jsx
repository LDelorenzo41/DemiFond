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
 * Calcule le RPE (Rating of Perceived Exertion) en fonction du % de VMA
 * @param {number} vmaPercent - Pourcentage de VMA
 * @returns {object} { rpe, description }
 */
const calculateRPE = (vmaPercent) => {
  if (vmaPercent < 50) {
    return { rpe: '1-2', description: 'Récupération active' };
  } else if (vmaPercent >= 50 && vmaPercent < 60) {
    return { rpe: '2-3', description: 'Très facile' };
  } else if (vmaPercent >= 60 && vmaPercent < 70) {
    return { rpe: '3-4', description: 'Endurance tranquille' };
  } else if (vmaPercent >= 70 && vmaPercent < 80) {
    return { rpe: '5-6', description: 'Allure active' };
  } else if (vmaPercent >= 80 && vmaPercent < 88) {
    return { rpe: '6-7', description: 'Seuil, soutenu' };
  } else if (vmaPercent >= 88 && vmaPercent < 100) {
    return { rpe: '8-9', description: 'Très dur, effort intense' };
  } else if (vmaPercent >= 100 && vmaPercent <= 110) {
    return { rpe: '10', description: 'Maximal / Sprint' };
  } else {
    return { rpe: '10+', description: 'Au-delà du maximum' };
  }
};

/**
 * Composant : Graphique d'évolution de la vitesse
 * Utilise des courbes de Bézier pour un rendu lisse et professionnel
 */
const SpeedChart = ({ lapData, targetSpeed }) => {
  const chartWidth = 100; // Pourcentages
  const chartHeight = 100;
  const padding = { top: 10, right: 10, bottom: 15, left: 15 };

  if (!lapData || lapData.length === 0) return null;

  const speeds = lapData.map(lap => lap.speed);
  const maxSpeed = Math.max(...speeds, targetSpeed + 0.5);
  const minSpeed = Math.min(...speeds, targetSpeed - 0.5);
  const speedRange = maxSpeed - minSpeed || 1;

  // Calculer les points du graphique
  const points = lapData.map((lap, index) => {
    const x = padding.left + ((chartWidth - padding.left - padding.right) * index) / (lapData.length - 1 || 1);
    const y = chartHeight - padding.bottom - ((lap.speed - minSpeed) / speedRange) * (chartHeight - padding.top - padding.bottom);
    return { x, y, lap };
  });

  // Créer une courbe de Bézier lisse (catmull-rom to bezier)
  const createSmoothPath = (points) => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      if (points.length === 2) {
        // Si seulement 2 points, ligne droite
        path += ` L ${next.x} ${next.y}`;
      } else {
        // Courbe de Bézier cubique pour un rendu lisse
        const prev = points[i - 1] || current;
        const afterNext = points[i + 2] || next;

        // Points de contrôle pour une courbe lisse
        const cp1x = current.x + (next.x - prev.x) / 6;
        const cp1y = current.y + (next.y - prev.y) / 6;
        const cp2x = next.x - (afterNext.x - current.x) / 6;
        const cp2y = next.y - (afterNext.y - current.y) / 6;

        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
      }
    }

    return path;
  };

  // Ligne de la vitesse cible
  const targetY = chartHeight - padding.bottom - ((targetSpeed - minSpeed) / speedRange) * (chartHeight - padding.top - padding.bottom);

  // Grille horizontale (3 lignes)
  const gridLines = [0, 0.5, 1].map(ratio => {
    const y = chartHeight - padding.bottom - ratio * (chartHeight - padding.top - padding.bottom);
    const speed = minSpeed + ratio * speedRange;
    return { y, speed };
  });

  return (
    <svg className="speed-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
      <defs>
        {/* Gradient pour la zone sous la courbe */}
        <linearGradient id="speedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.05" />
        </linearGradient>

        {/* Ombre portée pour la courbe */}
        <filter id="shadow">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.2"/>
        </filter>
      </defs>

      {/* Grille horizontale */}
      {gridLines.map((line, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={line.y}
            x2={chartWidth - padding.right}
            y2={line.y}
            className="chart-grid-line"
          />
          <text
            x={padding.left - 2}
            y={line.y}
            className="chart-label"
            textAnchor="end"
            dominantBaseline="middle"
          >
            {line.speed.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Ligne de vitesse cible */}
      <line
        x1={padding.left}
        y1={targetY}
        x2={chartWidth - padding.right}
        y2={targetY}
        className="chart-target-line"
      />
      <text
        x={chartWidth - padding.right + 1}
        y={targetY}
        className="chart-target-label"
        dominantBaseline="middle"
      >
        Cible
      </text>

      {/* Zone sous la courbe */}
      {points.length > 1 && (
        <path
          d={`${createSmoothPath(points)} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${points[0].x} ${chartHeight - padding.bottom} Z`}
          fill="url(#speedGradient)"
          className="chart-area"
        />
      )}

      {/* Courbe principale */}
      <path
        d={createSmoothPath(points)}
        fill="none"
        className="chart-line"
        filter="url(#shadow)"
      />

      {/* Points de données */}
      {points.map((point, index) => (
        <g key={index} className="chart-point-group">
          {/* Cercle de fond blanc pour contraste */}
          <circle
            cx={point.x}
            cy={point.y}
            r="1.5"
            fill="white"
            className="chart-point-bg"
          />
          {/* Point coloré selon la performance */}
          <circle
            cx={point.x}
            cy={point.y}
            r="1.2"
            className={`chart-point chart-point-${point.lap.color}`}
          >
            <title>Tour {point.lap.lapNumber}: {point.lap.speed.toFixed(2)} km/h</title>
          </circle>
        </g>
      ))}

      {/* Labels de l'axe X (numéros de tours) */}
      {points.map((point, index) => {
        // Afficher tous les tours si moins de 10, sinon tous les 2
        const showLabel = lapData.length <= 10 || index % 2 === 0 || index === lapData.length - 1;
        if (!showLabel) return null;

        return (
          <text
            key={index}
            x={point.x}
            y={chartHeight - 2}
            className="chart-x-label"
            textAnchor="middle"
          >
            {point.lap.lapNumber}
          </text>
        );
      })}

      {/* Label de l'axe Y */}
      <text
        x={1}
        y={5}
        className="chart-axis-label"
      >
        km/h
      </text>

      {/* Label de l'axe X */}
      <text
        x={chartWidth - 2}
        y={chartHeight - 2}
        className="chart-axis-label"
        textAnchor="end"
      >
        Tours
      </text>
    </svg>
  );
};

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

  // Calculer le RPE
  const rpeInfo = calculateRPE(vmaPercent);

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
    const speedDiffAbs = Math.abs(speedDiff);

    // Calculer le % de VMA réellement mobilisé
    const actualVmaPercent = (actualSpeed / vma) * 100;
    const vmaPercentDiff = actualVmaPercent - vmaPercent;

    // Déterminer l'appréciation basée sur l'écart de vitesse
    let appreciation = '';
    let color = '';
    
    if (speedDiffAbs <= 0.2) {
      appreciation = 'Excellent ! Objectif parfaitement atteint';
      color = 'blue';
    } else if (speedDiffAbs <= 0.5) {
      appreciation = 'Très bien ! Objectif quasiment atteint';
      color = 'green';
    } else if (speedDiffAbs <= 1.5) {
      appreciation = 'Bien, mais il y a une marge de progression';
      color = 'yellow';
    } else {
      appreciation = speedDiff > 0
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
        <p className="rpe-info">
          <strong>% de VMA: {vmaPercent}%</strong> - RPE {rpeInfo.rpe}: {rpeInfo.description}
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

      {/* Graphique d'évolution de la vitesse */}
      {lapData && lapData.length > 0 && (
        <div className="speed-chart-container">
          <h3>📈 Évolution de la vitesse</h3>
          <SpeedChart lapData={lapData} targetSpeed={targetSpeed} />
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