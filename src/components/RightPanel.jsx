import React, { useState, useMemo } from 'react';
import {
  calculateTargetSpeed,
  calculateLapTime,
  formatTime,
  generatePaceTable
} from '../utils/calculations';

/**
 * Composant : Panneau droit - Tableau d'allure et bilan
 */
const RightPanel = ({ trackLength, markerDistance, vma, vmaPercent, isHalfLap, lapData }) => {
  const [notes, setNotes] = useState('');

  const targetSpeed = calculateTargetSpeed(vma, vmaPercent);
  const lapTime = calculateLapTime(trackLength, targetSpeed, isHalfLap);
  const observationDistance = isHalfLap ? trackLength / 2 : trackLength;

  // Générer le tableau d'allures
  const paceTable = useMemo(() => {
    return generatePaceTable(trackLength, markerDistance, lapTime, isHalfLap);
  }, [trackLength, markerDistance, lapTime, isHalfLap]);

  // Calculer les statistiques si on a des données
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

  const exportData = () => {
    const data = {
      configuration: {
        trackLength,
        markerDistance,
        vma,
        vmaPercent,
        targetSpeed: targetSpeed.toFixed(1),
        isHalfLap
      },
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
    <div className="right-panel panel">
      <h2>📋 Tableau d'allure</h2>

      <div className="pace-info">
        <p>
          <strong>Temps par {isHalfLap ? 'demi-tour' : 'tour'}:</strong>{' '}
          {formatTime(lapTime)}
        </p>
        <p>
          <strong>Vitesse cible:</strong> {targetSpeed.toFixed(1)} km/h
        </p>
      </div>

      {/* Tableau des allures */}
      <div className="pace-table-container">
        <table className="pace-table">
          <thead>
            <tr>
              <th>Repère</th>
              <th>Distance (m)</th>
              <th>Temps</th>
            </tr>
          </thead>
          <tbody>
            {paceTable.map((row, index) => (
              <tr key={index}>
                <td>{row.marker}</td>
                <td>{row.distance.toFixed(0)}</td>
                <td>{formatTime(row.time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Statistiques en temps réel */}
      {stats && (
        <div className="stats-box">
          <h3>📊 Statistiques</h3>
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

      {/* Zone de notes */}
      <div className="notes-section">
        <h3>📝 Notes personnelles</h3>
        <textarea
          className="notes-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Conditions météo, ressenti, observations..."
          rows={4}
        />
      </div>

      {/* Bouton d'export */}
      <button className="btn-export" onClick={exportData}>
        💾 Exporter les données
      </button>
    </div>
  );
};

export default RightPanel;
