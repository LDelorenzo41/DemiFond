import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

/**
 * Dernier rempart : si le rendu échoue, on délègue au diagnostic défini dans
 * index.html plutôt que de laisser une page blanche. Sur un appareil en mode
 * installé, il n'y a ni barre d'adresse ni console pour comprendre la panne.
 */
class RootBoundary extends React.Component {
  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    if (typeof window.__demifondShowDiagnostic === 'function') {
      window.__demifondShowDiagnostic(error)
    }
  }

  render() {
    return this.state && this.state.failed ? null : this.props.children
  }
}

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <RootBoundary>
        <App />
      </RootBoundary>
    </React.StrictMode>,
  )
} catch (error) {
  // Échec avant même le premier rendu (DOM introuvable, API manquante…).
  if (typeof window.__demifondShowDiagnostic === 'function') {
    window.__demifondShowDiagnostic(error)
  } else {
    throw error
  }
}
