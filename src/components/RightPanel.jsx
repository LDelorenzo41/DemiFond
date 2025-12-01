import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import ExportModal from './ExportModal';
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

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

  /**
   * Fonction pour dessiner le graphique directement dans le PDF avec jsPDF
   */
  const drawChartInPDF = (pdf, lapData, targetSpeed, startX, startY, width, height) => {
    if (!lapData || lapData.length === 0) return;

    const speeds = lapData.map(lap => lap.speed || 0);
    const maxSpeed = Math.max(...speeds, targetSpeed + 0.5);
    const minSpeed = Math.min(...speeds, targetSpeed - 0.5);
    const speedRange = maxSpeed - minSpeed || 1;

    const padding = { top: 5, right: 10, bottom: 10, left: 15 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Fond du graphique
    pdf.setFillColor(255, 255, 255);
    pdf.rect(startX, startY, width, height, 'F');
    
    // Bordure
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.rect(startX, startY, width, height, 'S');

    // Grille horizontale
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.2);
    for (let i = 0; i <= 4; i++) {
      const ratio = i / 4;
      const y = startY + padding.top + chartHeight * (1 - ratio);
      pdf.line(startX + padding.left, y, startX + width - padding.right, y);
      
      // Labels de vitesse
      const speed = minSpeed + ratio * speedRange;
      pdf.setFontSize(7);
      pdf.setTextColor(107, 114, 128);
      pdf.text(speed.toFixed(1), startX + padding.left - 3, y + 1, { align: 'right' });
    }

    // Calculer les points
    const points = lapData.map((lap, index) => {
      const x = startX + padding.left + (chartWidth * index) / (lapData.length - 1 || 1);
      const speed = lap.speed || 0;
      const normalizedSpeed = (speed - minSpeed) / speedRange;
      const y = startY + padding.top + chartHeight * (1 - normalizedSpeed);
      return { x, y, lap };
    });

    // Ligne de vitesse cible
    const targetNormalized = (targetSpeed - minSpeed) / speedRange;
    const targetY = startY + padding.top + chartHeight * (1 - targetNormalized);
    
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(0.5);
    pdf.setLineDash([2, 2]);
    pdf.line(startX + padding.left, targetY, startX + width - padding.right, targetY);
    pdf.setLineDash([]);
    
    pdf.setFontSize(7);
    pdf.setTextColor(245, 158, 11);
    pdf.text('Cible', startX + width - padding.right + 2, targetY + 1);

    // Dessiner la courbe (lignes entre les points)
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(1);
    for (let i = 0; i < points.length - 1; i++) {
      pdf.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
    }

    // Dessiner les points
    points.forEach((point) => {
      const colorMap = {
        blue: [59, 130, 246],
        green: [34, 197, 94],
        yellow: [234, 179, 8],
        red: [239, 68, 68]
      };
      
      const color = colorMap[point.lap.color] || [107, 114, 128];
      
      // Point blanc de fond
      pdf.setFillColor(255, 255, 255);
      pdf.circle(point.x, point.y, 1.5, 'F');
      
      // Point coloré
      pdf.setFillColor(...color);
      pdf.circle(point.x, point.y, 1.2, 'F');
    });

    // Labels de l'axe X (tours)
    pdf.setFontSize(7);
    pdf.setTextColor(107, 114, 128);
    points.forEach((point, index) => {
      const showLabel = lapData.length <= 10 || index % 2 === 0 || index === lapData.length - 1;
      if (showLabel && point.lap.lapNumber) {
        pdf.text(point.lap.lapNumber.toString(), point.x, startY + height - 2, { align: 'center' });
      }
    });

    // Labels des axes
    pdf.setFontSize(8);
    pdf.setTextColor(156, 163, 175);
    pdf.text('km/h', startX + 2, startY + padding.top - 2);
    pdf.text('Tours', startX + width - 15, startY + height - 2);
  };

  /**
   * Fonction pour générer le PDF
   */
  const generatePDF = async (exportInfo) => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // Couleurs
      const primaryColor = [59, 130, 246]; // bleu
      const textColor = [31, 41, 55]; // gris foncé
      const lightGray = [229, 231, 235];

      // === EN-TÊTE ===
      pdf.setFillColor(...primaryColor);
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RAPPORT DE SUIVI D\'ALLURE', pageWidth / 2, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Date : ${exportInfo.date}`, pageWidth / 2, 25, { align: 'center' });

      yPos = 45;

      // === INFORMATIONS ===
      pdf.setTextColor(...textColor);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Coureur : ${exportInfo.runnerName}`, margin, yPos);
      yPos += 7;
      pdf.text(`Observateur : ${exportInfo.observerName}`, margin, yPos);
      yPos += 12;

      // === CONFIGURATION ===
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('CONFIGURATION', margin, yPos);
      yPos += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textColor);
      
      const config = [
        [`Longueur de piste : ${trackLength} m`, `VMA : ${vma} km/h`],
        [`Distance repères : ${markerDistance} m`, `% VMA : ${vmaPercent}%`],
        [`Durée de l'exercice : ${duration} min`, `Vitesse cible : ${targetSpeed.toFixed(1)} km/h`],
        [`Mode : ${isHalfLap ? 'Demi-tour' : 'Tour complet'}`, `Temps par tour : ${formatTime(lapTime)}`],
        [`RPE estimé : ${rpeInfo.rpe}`, `Intensité : ${rpeInfo.description}`]
      ];

      config.forEach(([left, right]) => {
        pdf.text(left, margin, yPos);
        pdf.text(right, pageWidth / 2 + 5, yPos);
        yPos += 6;
      });

      yPos += 5;

      // === OBJECTIF ===
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('OBJECTIF', margin, yPos);
      yPos += 7;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textColor);
      pdf.text(`${expectedLaps} tours + ${expectedMarkers} repères (${Math.round(expectedDistance)} m)`, margin, yPos);
      yPos += 10;

      // === STATISTIQUES ===
      if (stats) {
        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...primaryColor);
        pdf.text('STATISTIQUES', margin, yPos);
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...textColor);
        
        pdf.text(`Nombre de passages : ${stats.totalLaps}`, margin, yPos);
        yPos += 6;
        pdf.text(`Vitesse moyenne : ${stats.avgSpeed.toFixed(1)} km/h`, margin, yPos);
        yPos += 6;
        pdf.text(`Vitesse min / max : ${stats.minSpeed.toFixed(1)} / ${stats.maxSpeed.toFixed(1)} km/h`, margin, yPos);
        yPos += 6;

        // Répartition des couleurs
        const colorLabels = {
          blue: 'Excellent (Bleu)',
          green: 'Très bien (Vert)',
          yellow: 'Correct (Jaune)',
          red: 'À améliorer (Rouge)'
        };
        
        pdf.text('Répartition des performances :', margin, yPos);
        yPos += 6;
        Object.entries(stats.colorCounts).forEach(([color, count]) => {
          pdf.text(`  • ${colorLabels[color]} : ${count}`, margin + 5, yPos);
          yPos += 5;
        });

        yPos += 5;
      }

      // === GRAPHIQUE ===
      if (lapData && lapData.length > 0) {
        // Vérifier si on a assez de place, sinon nouvelle page
        if (yPos > pageHeight - 80) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...primaryColor);
        pdf.text('ÉVOLUTION DE LA VITESSE', margin, yPos);
        yPos += 7;

        // Dessiner le graphique directement avec jsPDF
        const chartWidth = pageWidth - 2 * margin;
        const chartHeight = 60;
        drawChartInPDF(pdf, lapData, targetSpeed, margin, yPos, chartWidth, chartHeight);
        yPos += chartHeight + 10;
      }

      // === HISTORIQUE DES PASSAGES ===
      if (lapData && lapData.length > 0) {
        // Nouvelle page si nécessaire
        if (yPos > pageHeight - 60) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFontSize(13);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...primaryColor);
        pdf.text('HISTORIQUE DES PASSAGES', margin, yPos);
        yPos += 7;

        // En-tête du tableau
        pdf.setFillColor(...lightGray);
        pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 8, 'F');
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...textColor);
        
        const colX = {
          tour: margin + 3,
          temps: margin + 20,
          vitesse: margin + 50,
          ecart: margin + 80,
          eval: margin + 110
        };

        pdf.text('Tour', colX.tour, yPos);
        pdf.text('Temps', colX.temps, yPos);
        pdf.text('Vitesse', colX.vitesse, yPos);
        pdf.text('Écart', colX.ecart, yPos);
        pdf.text('Évaluation', colX.eval, yPos);
        yPos += 8;

        // Données
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);

        lapData.forEach((lap) => {
          // Nouvelle page si nécessaire
          if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = margin;
          }

          const evalLabels = {
            blue: 'Excellent',
            green: 'Très bien',
            yellow: 'Correct',
            red: 'À améliorer'
          };

          const speed = lap.speed || 0;
          const speedDiff = speed - targetSpeed;

          pdf.text(`${lap.lapNumber || '-'}`, colX.tour, yPos);
          pdf.text(formatTime(lap.time || 0), colX.temps, yPos);
          pdf.text(`${speed.toFixed(2)} km/h`, colX.vitesse, yPos);
          pdf.text(`${speedDiff > 0 ? '+' : ''}${speedDiff.toFixed(2)} km/h`, colX.ecart, yPos);
          pdf.text(evalLabels[lap.color] || '-', colX.eval, yPos);
          
          yPos += 6;
        });
      }

      // === PIED DE PAGE ===
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} / ${totalPages} - Généré par DemiFond Tracker`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Sauvegarder
      const filename = `rapport-allure-${exportInfo.runnerName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      throw error;
    }
  };

  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  const handleExportConfirm = async (exportInfo) => {
    await generatePDF(exportInfo);
  };

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

      {/* Bouton d'export PDF */}
      {lapData && lapData.length > 0 && (
        <div className="export-section">       
          <button 
            className="btn-export-pdf" 
            onClick={handleExportClick}
          >
            📄 Exporter en PDF
          </button>
        </div>
      )}

      {/* Modal d'export */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExportConfirm}
      />
    </div>
  );
};

export default RightPanel;

