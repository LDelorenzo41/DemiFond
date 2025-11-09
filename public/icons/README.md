# Icônes PWA

Placez ici les icônes suivantes pour votre PWA :

- `icon-192.png` : 192x192 pixels
- `icon-512.png` : 512x512 pixels

## Génération rapide

Vous pouvez générer ces icônes à partir d'une image source en utilisant :

1. **En ligne** : https://www.pwabuilder.com/imageGenerator
   - Uploadez une image carrée (au moins 512x512)
   - Téléchargez le pack d'icônes généré

2. **Avec ImageMagick** :
   ```bash
   # Depuis une image source (logo.png)
   convert logo.png -resize 192x192 icon-192.png
   convert logo.png -resize 512x512 icon-512.png
   ```

## Recommandations

- Utilisez un design simple et reconnaissable
- Privilégiez les couleurs vives pour la visibilité
- Testez le rendu sur fond clair et foncé
- Le logo devrait être centré avec un peu de padding
