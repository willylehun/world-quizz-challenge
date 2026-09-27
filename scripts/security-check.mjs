import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const untracked = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const files = [...new Set([...tracked, ...untracked])];
const failures = [];
const forbiddenNames = files.filter((file) =>
  /(^|\/)(\.env($|\.)|\.dev\.vars($|\.)|\.secrets?($|\.)|.*\.(pem|key|p12|pfx|keystore)$)/i.test(file)
  && !/(^|\/)(\.env\.example|\.dev\.vars\.example)$/.test(file),
);
if (forbiddenNames.length) failures.push(`Fichiers sensibles suivis par Git : ${forbiddenNames.join(", ")}`);

const patterns = [
  new RegExp(["AKIA", "[0-9A-Z]{16}"].join("")),
  new RegExp(["gh", "[pousr]_[A-Za-z0-9_]{20,}"].join("")),
  new RegExp(["-----BEGIN ", "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"].join("")),
  new RegExp(["sk_live_", "[A-Za-z0-9]{20,}"].join("")),
  new RegExp(["AIza", "[0-9A-Za-z_-]{30,}"].join("")),
];
const textFiles = files.filter((file) => !/(^|\/)(pnpm-lock\.yaml|package-lock\.json)$/.test(file)
  && !/\.(png|ico|woff2?|zip|pdf)$/i.test(file) && file !== "scripts/security-check.mjs");
for (const file of textFiles) {
  let content;
  try { content = readFileSync(file, "utf8"); } catch { continue; }
  if (patterns.some((pattern) => pattern.test(content))) failures.push(`Motif de secret à vérifier : ${file}`);
}

const headers = readFileSync("public/_headers", "utf8");
for (const directive of ["Content-Security-Policy:", "frame-ancestors 'none'", "X-Content-Type-Options: nosniff", "Permissions-Policy:", "Referrer-Policy:"]) {
  if (!headers.includes(directive)) failures.push(`En-tête de sécurité manquant : ${directive}`);
}
const frameworkHeaders = readFileSync("next.config.ts", "utf8");
for (const directive of ["Content-Security-Policy", "frame-ancestors 'none'", "X-Content-Type-Options", "Permissions-Policy", "Referrer-Policy"]) {
  if (!frameworkHeaders.includes(directive)) failures.push(`En-tête framework manquant : ${directive}`);
}
const viteConfig = readFileSync("vite.config.ts", "utf8");
if (!/assets\s*:\s*{[\s\S]*?binding\s*:\s*["']ASSETS["'][\s\S]*?run_worker_first\s*:\s*true/.test(viteConfig)) {
  failures.push("Le Worker doit précéder les ressources statiques pour appliquer les en-têtes de sécurité.");
}

for (const workflow of files.filter((name) => /^\.github\/workflows\/.*\.ya?ml$/.test(name))) {
  const content = readFileSync(workflow, "utf8");
  if (/^\s*pull_request_target\s*:/m.test(content)) failures.push(`Déclencheur privilégié interdit : ${workflow}`);
  for (const line of content.split("\n").filter((value) => /^\s*uses\s*:/.test(value))) {
    if (!/@[0-9a-f]{40}(?:\s|#|$)/i.test(line)) failures.push(`Action non épinglée à un SHA : ${workflow}`);
  }
}

for (const file of files.filter((name) => /\.(html|css|js|mjs|ts|tsx)$/.test(name))) {
  const content = readFileSync(file, "utf8");
  if (/(?:src|href)\s*=\s*["']http:\/\//i.test(content)) failures.push(`Ressource HTTP non sécurisée : ${file}`);
  if (/access-control-allow-origin["']?\s*[:=]\s*["']\*/i.test(content)) failures.push(`CORS ouvert détecté : ${file}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Contrôles de sécurité réussis sur ${files.length} fichiers du dépôt.`);
