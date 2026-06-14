// Erzeugt die App-Icons (Favicon, Apple-Touch-Icon, PWA) aus einer Quell-PNG.
// Aufruf:  node scripts/generate-icons.mjs <pfad-zur-quelle.png>
// Benötigt sharp (bei Bedarf: npm install sharp --no-save). Ausgabe -> public/.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

const src = process.argv[2];
if (!src) {
  console.error("Quelle fehlt:  node scripts/generate-icons.mjs <quelle.png>");
  process.exit(1);
}

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
mkdirSync(publicDir, { recursive: true });

const targets = [
  ["favicon-16.png", 16],
  ["favicon-32.png", 32],
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];

for (const [name, size] of targets) {
  await sharp(src).resize(size, size, { fit: "cover" }).png().toFile(join(publicDir, name));
  console.log(`✓ ${name} (${size}x${size})`);
}
console.log("Fertig.");
