import React, { useState, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import {
  formatTime,
  calculateTargetSpeed,
  calculateLapTime,
  calculateObservedSpeed,
  getSpeedColor
} from '../utils/calculations';

/**
 * Composant : Panneau central - Gestion de la course en direct
 */
const CenterPanel = ({
  duration,
  vma,
  vmaPercent,
  trackLength,
  onLapData
}) => {
  const [isHalfLap, setIsHalfLap] = useState(false);
  const [lapHistory, setLapHistory] = useState([]);
  const [lastLapTime, setLastLapTime] = useState(0);
  const [currentColor, setCurrentColor] = useState('gray');

  const totalDurationSeconds = duration * 60;
  const { elapsedTime, remainingTime, isRunning, isPaused, start, pause, resume, reset } = useTimer(totalDurationSeconds);

  const targetSpeed = calculateTargetSpeed(vma, vmaPercent);
  const observationDistance = isHalfLap ? trackLength / 2 : trackLength;

  // Réinitialisation quand les paramètres changent
  useEffect(() => {
    if (!isRunning) {
      setLapHistory([]);
      setLastLapTime(0);
      setCurrentColor('gray');
    }
  }, [duration, vma, vmaPercent, trackLength, isHalfLap, isRunning]);

  const handleStartStop = () => {
    if (!isRunning) {
      start();
      setLapHistory([]);
      setLastLapTime(0);
    } else {
      reset();
    }
  };

  const handlePauseResume = () => {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  };

  const handleLapClick = () => {
    if (!isRunning || isPaused) return;

    const lapTime = elapsedTime - lastLapTime;
    const observedSpeed = calculateObservedSpeed(observationDistance, lapTime);
    const color = getSpeedColor(observedSpeed, targetSpeed);

    const lapData = {
      lapNumber: lapHistory.length + 1,
      time: lapTime,
      speed: observedSpeed,
      color: color,
      timestamp: elapsedTime
    };

    setLapHistory([...lapHistory, lapData]);
    setLastLapTime(elapsedTime);
    setCurrentColor(color);

    // Transmettre les données au parent
    if (onLapData) {
      onLapData(lapData);
    }

    // Vibration haptique si disponible
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleUndoLap = () => {
    if (lapHistory.length === 0) return;

    // Retirer le dernier passage
    const newHistory = lapHistory.slice(0, -1);
    setLapHistory(newHistory);

    // Réajuster lastLapTime
    if (newHistory.length > 0) {
      const previousLap = newHistory[newHistory.length - 1];
      setLastLapTime(previousLap.timestamp);
      setCurrentColor(previousLap.color);
    } else {
      setLastLapTime(0);
      setCurrentColor('gray');
    }

    // Vibration haptique différente pour l'annulation
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const getColorClass = (color) => {
    const colorMap = {
      blue: 'btn-blue',
      green: 'btn-green',
      yellow: 'btn-yellow',
      red: 'btn-red',
      gray: 'btn-gray'
    };
    return colorMap[color] || 'btn-gray';
  };

  return (
    <div className="center-panel panel">
      <h2>🏁 Course en direct</h2>

      {/* Chronomètres */}
      <div className="timer-section">
        <div className="timer-display">
          <div className="timer-box">
            <span className="timer-label">Temps écoulé</span>
            <span className="timer-value">{formatTime(elapsedTime)}</span>
          </div>
          <div className="timer-box">
            <span className="timer-label">Temps restant</span>
            <span className="timer-value countdown">{formatTime(remainingTime)}</span>
          </div>
        </div>
      </div>

      {/* Mode d'observation */}
      <div className="observation-mode">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isHalfLap}
            onChange={(e) => setIsHalfLap(e.target.checked)}
            disabled={isRunning}
          />
          <span>Observer par demi-tour</span>
        </label>
      </div>

      {/* Boutons de contrôle */}
      <div className="control-buttons">
        <button
          className={`btn-control ${isRunning ? 'btn-stop' : 'btn-start'}`}
          onClick={handleStartStop}
        >
          {isRunning ? '⏹️ Arrêter' : '▶️ Démarrer'}
        </button>

        {isRunning && (
          <button
            className="btn-control btn-pause"
            onClick={handlePauseResume}
          >
            {isPaused ? '▶️ Reprendre' : '⏸️ Pause'}
          </button>
        )}
      </div>

      {/* Gros bouton INFO VITESSE */}
      <div className="speed-button-container">
        <button
          className={`speed-button ${getColorClass(currentColor)}`}
          onClick={handleLapClick}
          disabled={!isRunning || isPaused}
        >
          <span className="speed-button-text">
            {isRunning && !isPaused ? 'APPUYER AU PASSAGE' : 'INFO VITESSE'}
          </span>
          {lapHistory.length > 0 && (
            <span className="speed-button-info">
              Dernier: {lapHistory[lapHistory.length - 1].speed.toFixed(1)} km/h
            </span>
          )}
        </button>

        {/* Bouton d'annulation */}
        {isRunning && lapHistory.length > 0 && (
          <button
            className="btn-undo"
            onClick={handleUndoLap}
            title="Annuler le dernier passage"
          >
            ↶ Annuler dernier passage
          </button>
        )}
      </div>

      {/* Historique des passages */}
      {lapHistory.length > 0 && (
        <div className="lap-history">
          <h3>Historique</h3>
          <div className="lap-list">
            {lapHistory.slice(-5).reverse().map((lap, index) => (
              <div key={index} className={`lap-item ${lap.color}`}>
                <span className="lap-number">#{lap.lapNumber}</span>
                <span className="lap-time">{formatTime(lap.time)}</span>
                <span className="lap-speed">{lap.speed.toFixed(1)} km/h</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CenterPanel;
