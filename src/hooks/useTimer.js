import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook personnalisé pour gérer le chronomètre
 * @param {number} totalDuration - Durée totale en secondes
 * @returns {object} État et fonctions du chronomètre
 */
export const useTimer = (totalDuration) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(0);

  // Nettoyage de l'intervalle
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Mise à jour du temps écoulé
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - startTimeRef.current - pausedTimeRef.current) / 1000;
        setElapsedTime(elapsed);

        // Arrêt automatique à la fin
        if (elapsed >= totalDuration) {
          stop();
        }
      }, 100); // Mise à jour toutes les 100ms pour plus de précision

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isRunning, isPaused, totalDuration]);

  const start = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now();
      pausedTimeRef.current = 0;
      setElapsedTime(0);
      setIsRunning(true);
      setIsPaused(false);
    }
  }, [isRunning]);

  const pause = useCallback(() => {
    if (isRunning && !isPaused) {
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isRunning, isPaused]);

  const resume = useCallback(() => {
    if (isRunning && isPaused) {
      const pauseDuration = Date.now() - (startTimeRef.current + pausedTimeRef.current + elapsedTime * 1000);
      pausedTimeRef.current += pauseDuration;
      setIsPaused(false);
    }
  }, [isRunning, isPaused, elapsedTime]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setElapsedTime(0);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
  }, [stop]);

  const remainingTime = totalDuration - elapsedTime;

  return {
    elapsedTime,
    remainingTime: remainingTime > 0 ? remainingTime : 0,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    stop,
    reset
  };
};
