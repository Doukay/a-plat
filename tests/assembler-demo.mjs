#!/usr/bin/env node
// Assemble la démo (Prêtoutil, un projet inventé) dans un dossier vide : le modèle de page,
// puis les écrans de tests/fixtures/demo. Affiche le chemin de index.html, à ouvrir d'un double-clic.
// Usage : node tests/assembler-demo.mjs <dossier de destination>
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { copierLeModeleEtLaFixture } from "./assembler.mjs";

const argument = process.argv[2];
if (!argument) {
  console.error("Il manque le dossier de destination. Usage : node tests/assembler-demo.mjs <dossier>");
  process.exit(2);
}

const destination = resolve(argument);
if (existsSync(destination)) {
  if (!statSync(destination).isDirectory()) {
    console.error(`« ${argument} » existe et n'est pas un dossier : choisissez un dossier vide ou qui n'existe pas encore.`);
    process.exit(1);
  }
  if (readdirSync(destination).length > 0) {
    console.error(`Le dossier « ${argument} » n'est pas vide : rien n'a été copié. Choisissez un dossier vide ou qui n'existe pas encore.`);
    process.exit(1);
  }
} else {
  mkdirSync(destination, { recursive: true });
}

copierLeModeleEtLaFixture(destination, "demo");
console.log(join(destination, "index.html"));
