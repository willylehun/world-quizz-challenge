import { existsSync, readFileSync } from "node:fs";

const failures = [];
const required = [
  "android/settings.gradle",
  "android/build.gradle",
  "android/app/build.gradle",
  "android/app/src/main/AndroidManifest.xml",
  "android/app/src/main/res/values/strings.xml",
  "android/assetlinks.template.json",
];

for (const file of required) if (!existsSync(file)) failures.push(`Fichier Android manquant : ${file}`);

const build = readFileSync("android/app/build.gradle", "utf8");
const rootBuild = readFileSync("android/build.gradle", "utf8");
const manifest = readFileSync("android/app/src/main/AndroidManifest.xml", "utf8");
const strings = readFileSync("android/app/src/main/res/values/strings.xml", "utf8");
const assetlinks = readFileSync("android/assetlinks.template.json", "utf8");

for (const expected of ["compileSdk 36", "targetSdk 36", 'applicationId "com.byw.worldquizzchallenge"']) {
  if (!build.includes(expected)) failures.push(`Configuration Android absente : ${expected}`);
}
if (!rootBuild.includes('version "8.13.2"')) failures.push("Android Gradle Plugin 8.13.2 attendu.");
if (!build.includes('androidbrowserhelper:2.5.0')) failures.push("Android Browser Helper 2.5.0 attendu.");
if (!manifest.includes('android:usesCleartextTraffic="false"')) failures.push("Le trafic HTTP doit être interdit.");
if (!manifest.includes('android:autoVerify="true"')) failures.push("La vérification des liens Android doit être active.");
if (!strings.includes("https://world-quizz-challenge.wbuan15.chatgpt.site/game.html")) failures.push("URL HTTPS WQC invalide.");
if (!assetlinks.includes("REPLACE_WITH_PLAY_APP_SIGNING_SHA256")) failures.push("Le modèle Digital Asset Links doit attendre le certificat Play.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Configuration Android WQC valide (API 36, TWA HTTPS, association Play en attente). ");
