import React, { useState, useEffect, useRef } from 'react';
import { formatTime } from '../utils/calculations';

/**
 * Composant : Chronomètre de récupération entre répétitions/séries
 */
const RecoveryTimer = ({
  duration,
  type,
  nextSeries,
  nextRep,
  totalSeries,
  repsPerSeries,
  onComplete,
  onSkip
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [hasWarned, setHasWarned] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Créer un AudioContext pour le bip
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioRef.current = audioContext;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }

        // Bip d'alerte à 15 secondes
        if (prev === 15 && !hasWarned) {
          playBeep();
          setHasWarned(true);
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [duration, onComplete, hasWarned]);

  const playBeep = () => {
    try {
      const audioContext = audioRef.current;
      if (!audioContext) return;

      // Créer un oscillateur pour le bip
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configuration du son
      oscillator.frequency.value = 800; // Fréquence en Hz
      oscillator.type = 'sine';

      // Volume et durée
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      // Jouer le son
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Erreur lors de la lecture du bip:', error);
    }
  };

  const progressPercent = ((duration - timeRemaining) / duration) * 100;

  return (
    <div className="recovery-overlay">
      <div className="recovery-modal">
        <div className="recovery-header">
          <h3>
            {type === 'series' ? '🔄 Récupération entre séries' : '⏸️ Récupération entre répétitions'}
          </h3>
          <button className="btn-close-recovery" onClick={onSkip} title="Ignorer la récupération">
            ✕
          </button>
        </div>

        <div className="recovery-body">
          <div className="recovery-timer-display">
            <span className="recovery-time">{formatTime(timeRemaining)}</span>
          </div>

          <div className="recovery-progress-bar">
            <div 
              className="recovery-progress-fill" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="recovery-next-info">
            <p>
              <strong>Prochaine course :</strong><br />
              Série {nextSeries}/{totalSeries} - Répétition {nextRep}/{repsPerSeries}
            </p>
          </div>

          {timeRemaining <= 15 && timeRemaining > 0 && (
            <div className="recovery-warning">
              ⚠️ Préparez-vous pour le départ !
            </div>
          )}

          {timeRemaining === 0 && (
            <div className="recovery-ready">
              ✓ Prêt à démarrer
            </div>
          )}
        </div>

        <div className="recovery-footer">
          <button className="btn-skip-recovery" onClick={onSkip}>
            Ignorer et démarrer maintenant
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoveryTimer;