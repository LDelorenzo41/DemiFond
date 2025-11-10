/**
 * Calculs pour l'application de suivi d'allure
 */

/**
 * Calcule la vitesse cible en km/h
 * @param {number} vma - VMA du coureur en km/h
 * @param {number} vmaPercent - Pourcentage de VMA (60-120)
 * @returns {number} Vitesse cible en km/h
 */
export const calculateTargetSpeed = (vma, vmaPercent) => {
  return (vma * vmaPercent) / 100;
};

/**
 * Calcule la distance totale à parcourir
 * @param {number} targetSpeed - Vitesse cible en km/h
 * @param {number} duration - Durée en minutes
 * @returns {number} Distance en mètres
 */
export const calculateTotalDistance = (targetSpeed, duration) => {
  return (targetSpeed * 1000 * duration) / 60;
};

/**
 * Calcule le nombre de tours complets
 * @param {number} totalDistance - Distance totale en mètres
 * @param {number} trackLength - Longueur de piste en mètres
 * @returns {object} { fullLaps, remainingMeters }
 */
export const calculateLaps = (totalDistance, trackLength) => {
  const fullLaps = Math.floor(totalDistance / trackLength);
  const remainingMeters = totalDistance % trackLength;
  return { fullLaps, remainingMeters };
};

/**
 * Calcule le nombre de repères correspondant à la distance restante
 * @param {number} remainingMeters - Mètres restants après les tours complets
 * @param {number} markerDistance - Distance entre repères en mètres
 * @returns {number} Nombre de repères
 */
export const calculateMarkers = (remainingMeters, markerDistance) => {
  return Math.round(remainingMeters / markerDistance);
};

/**
 * Calcule le temps cible par tour (ou demi-tour)
 * @param {number} trackLength - Longueur du tour en mètres
 * @param {number} targetSpeed - Vitesse cible en km/h
 * @param {boolean} isHalfLap - Si true, calcule pour un demi-tour
 * @returns {number} Temps en secondes
 */
export const calculateLapTime = (trackLength, targetSpeed, isHalfLap = false) => {
  const distance = isHalfLap ? trackLength / 2 : trackLength;
  // Vitesse en m/s = (km/h * 1000) / 3600
  const speedMs = (targetSpeed * 1000) / 3600;
  return distance / speedMs;
};

/**
 * Détermine la couleur selon l'écart de vitesse
 * @param {number} observedSpeed - Vitesse observée en km/h
 * @param {number} targetSpeed - Vitesse cible en km/h
 * @returns {string} Couleur ('blue', 'green', 'yellow', 'red')
 */
export const getSpeedColor = (observedSpeed, targetSpeed) => {
  const diff = Math.abs(observedSpeed - targetSpeed);

  if (diff <= 0.1) return 'blue';
  if (diff <= 0.5) return 'green';
  if (diff <= 1.0) return 'yellow';
  return 'red';
};

/**
 * Génère le tableau d'allures
 * @param {number} trackLength - Longueur de piste en mètres
 * @param {number} markerDistance - Distance entre repères
 * @param {number} lapTime - Temps par tour en secondes
 * @param {boolean} isHalfLap - Si on observe par demi-tour
 * @returns {Array} Tableau des allures
 */
export const generatePaceTable = (trackLength, markerDistance, lapTime, isHalfLap) => {
  const table = [];
  const observationDistance = isHalfLap ? trackLength / 2 : trackLength;
  const numMarkers = Math.floor(observationDistance / markerDistance);

  // Pour chaque repère
  for (let i = 0; i <= numMarkers; i++) {
    const distance = i * markerDistance;
    const cumulativeDistance = isHalfLap ? distance : distance;

    // Temps théorique pour atteindre ce repère
    const timeAtMarker = (distance / observationDistance) * lapTime;

    // Vitesse correspondante si on atteint ce repère au temps du tour
    const speedAtMarker = (observationDistance / lapTime) * 3.6; // conversion en km/h

    table.push({
      marker: i,
      distance: cumulativeDistance,
      time: timeAtMarker,
      speed: speedAtMarker
    });
  }

  return table;
};

/**
 * Formate un temps en secondes au format MM:SS
 * @param {number} seconds - Temps en secondes
 * @returns {string} Temps formaté
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calcule la vitesse observée basée sur le temps écoulé
 * @param {number} distance - Distance parcourue en mètres
 * @param {number} timeElapsed - Temps écoulé en secondes
 * @returns {number} Vitesse en km/h
 */
export const calculateObservedSpeed = (distance, timeElapsed) => {
  if (timeElapsed === 0) return 0;
  // distance en mètres, temps en secondes
  // vitesse = (distance / temps) * 3.6 pour convertir en km/h
  const speedMs = distance / timeElapsed;
  return speedMs * 3.6;
};

/**
 * Calcule la distance totale à partir du nombre de tours et de repères
 * @param {number} laps - Nombre de tours complets
 * @param {number} markers - Nombre de repères
 * @param {number} trackLength - Longueur de piste en mètres
 * @param {number} markerDistance - Distance entre repères en mètres
 * @returns {number} Distance totale en mètres
 */
export const calculateDistanceFromLaps = (laps, markers, trackLength, markerDistance) => {
  return (laps * trackLength) + (markers * markerDistance);
};

/**
 * Génère un tableau d'allure simplifié (temps par tour uniquement)
 * @param {number} lapTime - Temps par tour en secondes
 * @param {number} maxLaps - Nombre maximum de tours à afficher
 * @returns {Array} Tableau simplifié des temps par tour
 */
export const generateSimplePaceTable = (lapTime, maxLaps = 20) => {
  const table = [];

  for (let i = 1; i <= maxLaps; i++) {
    table.push({
      lap: i,
      time: lapTime * i,
      lapTime: lapTime
    });
  }

  return table;
};
