# Icônes PWA

Ces icônes sont référencées par `public/manifest.json` et par `index.html`.
Elles doivent exister aux tailles exactement déclarées : Chrome refuse une icône
absente, et Netlify renverrait alors `index.html` en HTTP 200 à sa place, ce qui
rend la panne invisible dans les journaux.

| Fichier | Taille | `purpose` | Usage |
|---|---|---|---|
| `icon-192.png` | 192×192 | `any` | icône standard |
| `icon-512.png` | 512×512 | `any` | splash screen, magasins |
| `icon-maskable-192.png` | 192×192 | `maskable` | Android (masque adaptatif) |
| `icon-maskable-512.png` | 512×512 | `maskable` | Android (masque adaptatif) |
| `../apple-touch-icon.png` | 180×180 | — | iOS (ignore le manifeste) |

## Contraintes à respecter

- **Maskable** : Android rogne jusqu'à 10 % de chaque bord. Le contenu utile doit
  tenir dans les 80 % centraux, sur un fond **opaque** — sinon le logo est amputé.
  Les variantes `icon-maskable-*` respectent cette zone de sécurité ; les
  variantes `any` sont le logo pleine page.
- **iOS** : `apple-touch-icon.png` ne doit **pas** avoir de canal alpha. Safari
  aplatit la transparence en **noir**, ce qui donnerait des coins noirs.

## Régénération

La source est `design/logo-512.png` — le master pleine qualité, volontairement hors de `public/` pour n'être ni déployé ni précaché.

```bash
npm i --no-save sharp
node -e "
const sharp = require('sharp');
const SRC = 'design/logo-512.png';
(async () => {
  for (const size of [192, 512]) {
    await sharp(SRC).resize(size, size)
      .png({ compressionLevel: 9, palette: true })
      .toFile('public/icons/icon-' + size + '.png');
  }
  for (const size of [192, 512]) {
    const inner = Math.round(size * 0.8);
    const pad = Math.round((size - inner) / 2);
    const logo = await sharp(SRC).resize(inner, inner).toBuffer();
    await sharp({ create: { width: size, height: size, channels: 4,
                            background: { r: 255, g: 255, b: 255, alpha: 1 } } })
      .composite([{ input: logo, top: pad, left: pad }])
      .png({ compressionLevel: 9, palette: true })
      .toFile('public/icons/icon-maskable-' + size + '.png');
  }
  await sharp(SRC).resize(180, 180).flatten({ background: '#ffffff' })
    .png({ compressionLevel: 9, palette: true })
    .toFile('public/apple-touch-icon.png');
})();
"
```
