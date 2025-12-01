import React, { useState } from 'react';

/**
 * Modal pour saisir les informations avant l'export PDF
 */
const ExportModal = ({ isOpen, onClose, onExport }) => {
  const [runnerName, setRunnerName] = useState('');
  const [observerName, setObserverName] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!runnerName.trim() || !observerName.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setIsExporting(true);
    
    try {
      await onExport({
        runnerName: runnerName.trim(),
        observerName: observerName.trim(),
        date: new Date().toLocaleString('fr-FR')
      });
      
      // Réinitialiser et fermer
      setRunnerName('');
      setObserverName('');
      onClose();
    } catch (error) {
      alert('Erreur lors de l\'export PDF : ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    setRunnerName('');
    setObserverName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="export-modal-overlay">
      <div className="export-modal">
        <h2>📄 Export PDF</h2>
        <p className="export-modal-description">
          Veuillez renseigner les informations suivantes avant de générer le rapport PDF.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="export-modal-field">
            <label htmlFor="runner-name">Nom du coureur *</label>
            <input
              type="text"
              id="runner-name"
              value={runnerName}
              onChange={(e) => setRunnerName(e.target.value)}
              placeholder="Ex: Jean Dupont"
              autoFocus
              disabled={isExporting}
            />
          </div>

          <div className="export-modal-field">
            <label htmlFor="observer-name">Nom de l'observateur *</label>
            <input
              type="text"
              id="observer-name"
              value={observerName}
              onChange={(e) => setObserverName(e.target.value)}
              placeholder="Ex: Marie Martin"
              disabled={isExporting}
            />
          </div>

          <div className="export-modal-actions">
            <button 
              type="button" 
              onClick={handleCancel} 
              className="export-modal-btn export-modal-btn-cancel"
              disabled={isExporting}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              className="export-modal-btn export-modal-btn-submit"
              disabled={isExporting}
            >
              {isExporting ? 'Génération en cours...' : '📄 Générer le PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportModal;
