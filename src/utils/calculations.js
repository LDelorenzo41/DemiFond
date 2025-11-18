/**
 * Fonctions de calcul pour l'application de suivi d'allure de course
 */

/**
 * Calcule la vitesse cible en km/h
 * @param {number} vma - VMA en km/h
 * @param {number} vmaPercent - Pourcentage de VMA
 * @returns {number} Vitesse cible en km/h
 */
export const calculateTargetSpeed = (vma, vmaPercent) => {
  return (vma * vmaPercent) / 100;
};

/**
 * Calcule la distance totale à parcourir
 * @param {number} speed - Vitesse en km/h
 * @param {number} duration - Durée en minutes
 * @returns {number} Distance en mètres
 */
export const calculateTotalDistance = (speed, duration) => {
  return (speed * 1000 * duration) / 60;
};

/**
 * Calcule le nombre de tours complets et les mètres restants
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
 * Calcule le nombre de repères à partir des mètres restants
 * @param {number} remainingMeters - Mètres restants
 * @param {number} markerDistance - Distance entre repères
 * @returns {number} Nombre de repères
 */
export const calculateMarkers = (remainingMeters, markerDistance) => {
  return Math.round(remainingMeters / markerDistance);
};

/**
 * Calcule le temps pour parcourir un tour (ou demi-tour)
 * @param {number} trackLength - Longueur de piste en mètres
 * @param {number} targetSpeed - Vitesse cible en km/h
 * @param {boolean} isHalfLap - Si vrai, calcule pour un demi-tour
 * @returns {number} Temps en secondes
 */
export const calculateLapTime = (trackLength, targetSpeed, isHalfLap = false) => {
  const distance = isHalfLap ? trackLength / 2 : trackLength;
  const speedInMetersPerSecond = (targetSpeed * 1000) / 3600;
  return distance / speedInMetersPerSecond;
};

/**
 * Calcule la vitesse observée en km/h
 * @param {number} distance - Distance parcourue en mètres
 * @param {number} time - Temps écoulé en secondes
 * @returns {number} Vitesse en km/h
 */
export const calculateObservedSpeed = (distance, time) => {
  if (time === 0) return 0;
  const speedInMetersPerSecond = distance / time;
  return (speedInMetersPerSecond * 3600) / 1000;
};

/**
 * Détermine la couleur selon l'écart de vitesse par rapport à la cible
 * @param {number} observedSpeed - Vitesse observée en km/h
 * @param {number} targetSpeed - Vitesse cible en km/h
 * @returns {string} Couleur ('blue', 'green', 'yellow', 'red')
 */
export const getSpeedColor = (observedSpeed, targetSpeed) => {
  const speedDiff = Math.abs(observedSpeed - targetSpeed);

  if (speedDiff <= 0.2) {
    return 'blue'; // Excellent : ±0 à ±0,2 km/h
  } else if (speedDiff <= 0.5) {
    return 'green'; // Très bien : ±0,21 à ±0,5 km/h
  } else if (speedDiff <= 1.5) {
    return 'yellow'; // Bien : ±0,51 à ±1,5 km/h
  } else {
    return 'red'; // Attention : plus de ±1,5 km/h
  }
};

/**
 * Formate un temps en secondes au format mm:ss.d
 * @param {number} seconds - Temps en secondes
 * @returns {string} Temps formaté
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const decisecs = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, '0')}.${decisecs}`;
};

/**
 * Génère un tableau d'allure simplifié (temps par tour)
 * @param {number} lapTime - Temps pour un tour en secondes
 * @param {number} maxLaps - Nombre maximum de tours
 * @returns {Array} Tableau d'allure
 */
export const generateSimplePaceTable = (lapTime, maxLaps = 20) => {
  const table = [];
  for (let i = 1; i <= maxLaps; i++) {
    table.push({
      lap: i,
      lapTime: lapTime,
      time: lapTime * i
    });
  }
  return table;
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
