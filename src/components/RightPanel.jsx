import React, { useState, useMemo, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
const RightPanel = ({ trackLength, markerDistance, vma, vmaPercent, duration, isHalfLap, lapData }) => {
  const [notes, setNotes] = useState('');
  const [actualLaps, setActualLaps] = useState('');
  const [actualMarkers, setActualMarkers] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const chartRef = useRef(null);

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
      appreciation,
      color
    };
  }, [actualLaps, actualMarkers, expectedDistance, trackLength, markerDistance]);

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

  /**
   * Fonction pour générer le PDF
   */
  const generatePDF = async (exportInfo) => {
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
      [`Mode : ${isHalfLap ? 'Demi-tour' : 'Tour complet'}`, `Temps par tour : ${formatTime(lapTime)}`]
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
    if (lapData && lapData.length > 0 && chartRef.current) {
      try {
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

        // Capturer le graphique SVG
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#ffffff',
          scale: 2
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 10;
      } catch (error) {
        console.error('Erreur capture graphique:', error);
      }
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

      lapData.forEach((lap, index) => {
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

        pdf.text(`${lap.lapNumber}`, colX.tour, yPos);
        pdf.text(formatTime(lap.lapTime), colX.temps, yPos);
        pdf.text(`${lap.speed.toFixed(2)} km/h`, colX.vitesse, yPos);
        pdf.text(`${lap.speedDiff > 0 ? '+' : ''}${lap.speedDiff.toFixed(2)} km/h`, colX.ecart, yPos);
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
  };

  const handleExportClick = () => {
    setIsExportModalOpen(true);
  };

  const handleExportConfirm = async (exportInfo) => {
    await generatePDF(exportInfo);
  };

  return (
    <div className="right-panel panel">
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
      </div>

      {/* Bilan comparatif */}
      {assessment && (
        <div className={`assessment-box ${assessment.color}`}>
          <h3>📊 Bilan</h3>
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
            <div className="assessment-appreciation">
              {assessment.appreciation}
            </div>
          </div>
        </div>
      )}

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

      {/* Graphique d'évolution de la vitesse */}
      {lapData && lapData.length > 0 && (
        <div className="speed-chart-container" ref={chartRef}>
          <h3>📈 Évolution de la vitesse</h3>
          <SpeedChart lapData={lapData} targetSpeed={targetSpeed} />
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
