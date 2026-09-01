import React from 'react';

/**
 * Isole tout le code PWA (installation, service worker) du reste de l'app.
 *
 * Ces composants touchent des API navigateur d'âge très variable
 * (beforeinstallprompt, matchMedia, service worker). Sans cette barrière, une
 * seule API manquante sur un appareil ancien fait remonter l'exception jusqu'à
 * la racine : React démonte tout et l'utilisateur voit une page blanche à la
 * place de son chronomètre. Un incident de confort ne doit jamais coûter
 * l'application entière.
 */
class PWABoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Visible en console pour le diagnostic, sans jamais interrompre l'app.
    console.warn('Fonctionnalités PWA désactivées :', error);
  }

  render() {
    // En cas d'échec, l'app perd l'invitation à installer — rien d'autre.
    return this.state.failed ? null : this.props.children;
  }
}

export default PWABoundary;
