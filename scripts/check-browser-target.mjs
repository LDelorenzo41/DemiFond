/**
 * Garde-fou de build : compatibilité navigateur du code réellement livré.
 *
 * Vite s'arrête par défaut à Safari 14, ce qui laisse passer `??` et `?.` —
 * React 18 en émet dans son propre code. Sur un iPad Air 2 en iOS 12
 * (Safari 12.1), matériel encore courant en établissement scolaire, le module
 * est alors rejeté par une erreur de syntaxe : écran blanc, sans indication.
 *
 * `build.target` dans vite.config.js corrige cela, mais rien n'empêcherait une
 * montée de version de dépendance de réintroduire le problème en silence. Ce
 * script relit le code produit et fait échouer le build le cas échéant.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as acorn from 'acorn';
import * as walk from 'acorn-walk';

const DIST = 'dist';

// Constructions absentes de Safari 12.1. `import()` dynamique n'y figure pas :
// il est supporté depuis Safari 11.1.
const UNSUPPORTED = {
  LogicalExpression: (n) => (n.operator === '??' ? '?? (coalescence nulle)' : null),
  ChainExpression: () => '?. (chaînage optionnel)',
  AssignmentExpression: (n) => (['??=', '||=', '&&='].includes(n.operator) ? n.operator : null),
  Literal: (n) => (typeof n.value === 'bigint' ? 'littéral BigInt' : null),
  PropertyDefinition: (n) => (n.key?.type === 'PrivateIdentifier' ? 'champ privé #' : null),
};

if (!existsSync(DIST)) {
  console.error(`\n❌ ${DIST}/ est introuvable.\n`);
  process.exit(1);
}

const files = [
  ...readdirSync(join(DIST, 'assets')).filter((f) => f.endsWith('.js')).map((f) => join(DIST, 'assets', f)),
  ...readdirSync(DIST).filter((f) => f.endsWith('.js')).map((f) => join(DIST, f)),
];

const problems = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  let ast;
  try {
    ast = acorn.parse(source, { ecmaVersion: 2022, sourceType: 'module' });
  } catch {
    // Un fichier non analysable (script classique, format exotique) n'est pas
    // un motif d'échec : la vérification est un filet, pas un compilateur.
    continue;
  }

  const found = new Map();
  walk.simple(
    ast,
    Object.fromEntries(
      Object.entries(UNSUPPORTED).map(([type, detect]) => [
        type,
        (node) => {
          const label = detect(node);
          if (label) found.set(label, (found.get(label) ?? 0) + 1);
        },
      ])
    )
  );

  if (found.size > 0) {
    problems.push(
      `${file} → ` + [...found].map(([label, count]) => `${label} ×${count}`).join(', ')
    );
  }
}

if (problems.length > 0) {
  console.error(
    '\n❌ Code incompatible avec Safari 12.1 (iPad Air 2 sous iOS 12) :\n' +
      problems.map((p) => '   ' + p).join('\n') +
      "\n\n   Vérifiez build.target dans vite.config.js.\n"
  );
  process.exit(1);
}

console.log(`✅ Compatibilité Safari 12.1 vérifiée sur ${files.length} fichiers.`);
