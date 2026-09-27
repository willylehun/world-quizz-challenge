import { readFileSync } from "node:fs";

const failures = [];
const listing = readFileSync("play-store/listing-fr.md", "utf8");
const section = (title, next) => {
  const start = listing.indexOf(`## ${title}`);
  const end = next ? listing.indexOf(`## ${next}`, start + 3) : listing.length;
  return start >= 0 ? listing.slice(start + title.length + 3, end < 0 ? listing.length : end).trim() : "";
};
const name = section("Nom de l’application", "Description courte");
const shortDescription = section("Description courte", "Description complète");
const fullDescription = section("Description complète", "Catégorie proposée");

if (!name || name.length > 30) failures.push(`Nom Play invalide : ${name.length}/30 caractères.`);
if (!shortDescription || shortDescription.length > 80) failures.push(`Description courte invalide : ${shortDescription.length}/80 caractères.`);
if (!fullDescription || fullDescription.length > 4000) failures.push(`Description complète invalide : ${fullDescription.length}/4000 caractères.`);

function pngSize(path) {
  const data = readFileSync(path);
  if (data.toString("ascii", 1, 4) !== "PNG") throw new Error(`${path} n’est pas un PNG.`);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

const icon = pngSize("play-store/assets/icon-512.png");
const feature = pngSize("play-store/assets/feature-graphic-1024x500.png");
if (icon.width !== 512 || icon.height !== 512) failures.push("L’icône Play doit mesurer 512 × 512 px.");
if (feature.width !== 1024 || feature.height !== 500) failures.push("La bannière Play doit mesurer 1024 × 500 px.");

for (const file of ["play-store/data-safety-draft.md", "play-store/app-content-draft.md", "play-store/release-checklist.md", "play-store/release-notes-fr.txt"]) {
  if (!readFileSync(file, "utf8").trim()) failures.push(`Document Play vide : ${file}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Dossier Play valide : nom ${name.length}/30, courte ${shortDescription.length}/80, complète ${fullDescription.length}/4000.`);
