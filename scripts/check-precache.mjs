/**
 * Garde-fou de build.
 *
 * Workbox exclut silencieusement du précache tout fichier dépassant
 * `maximumFileSizeToCacheInBytes` : le build reste vert et l'application cesse
 * de fonctionner hors ligne en production, sans le moindre signal. Ce script
 * relit le service worker produit et échoue si le précache n'est pas complet.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SW = join(DIST, 'sw.js');

const fail = (message) => {
  console.error(`\n❌ Vérification du précache échouée : ${message}\n`);
  process.exit(1);
};

if (!existsSync(SW)) fail(`${SW} est introuvable.`);

const sw = readFileSync(SW, 'utf8');
const urls = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);

if (urls.length === 0) fail('aucune entrée de précache dans le service worker.');

// Sans ces trois entrées, l'application ne démarre pas hors ligne.
const required = [
  { label: 'index.html', test: (u) => u === 'index.html' },
  { label: 'le bundle JS principal', test: (u) => /^assets\/index-.*\.js$/.test(u) },
  { label: 'la feuille de styles', test: (u) => /^assets\/index-.*\.css$/.test(u) },
  { label: 'le manifeste', test: (u) => u === 'manifest.json' },
];

for (const { label, test } of required) {
  if (!urls.some(test)) fail(`${label} est absent du précache.`);
}

// Une entrée de précache pointant vers un fichier absent ferait échouer
// l'installation du service worker, donc tout le mode hors ligne.
for (const url of urls) {
  if (!existsSync(join(DIST, url))) fail(`le précache référence ${url}, qui n'existe pas dans ${DIST}/.`);
}

// Les icônes déclarées dans le manifeste doivent exister : sinon Netlify sert
// index.html à leur place en HTTP 200 et l'échec devient invisible.
const manifest = JSON.parse(readFileSync(join(DIST, 'manifest.json'), 'utf8'));
for (const icon of manifest.icons ?? []) {
  const path = join(DIST, icon.src.replace(/^\//, ''));
  if (!existsSync(path)) fail(`le manifeste déclare l'icône ${icon.src}, qui n'existe pas.`);
}

// Un seul <link rel="manifest"> : les navigateurs ignorent les suivants.
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const links = html.match(/<link[^>]+rel="manifest"[^>]*>/g) ?? [];
if (links.length !== 1) fail(`${links.length} balise(s) <link rel="manifest"> dans index.html, il en faut exactement une.`);

const total = urls.reduce((sum, u) => sum + readFileSync(join(DIST, u)).length, 0);
console.log(
  `✅ Précache complet : ${urls.length} entrées, ${(total / 1024).toFixed(0)} Kio, ` +
    `${(manifest.icons ?? []).length} icônes vérifiées.`
);
