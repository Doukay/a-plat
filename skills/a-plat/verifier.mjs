#!/usr/bin/env node
// Contrôle d'un dossier de maquettes, sans rien afficher à l'écran.
// Usage : node verifier.mjs <dossier>
// Code de sortie : 0 tout va bien, 1 au moins une erreur, 2 le dossier, plan.js ou logique.js manque.
// Ne demande que Node (18 ou plus), aucune bibliothèque.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const CHEMIN_DE_LA_LOGIQUE = fileURLToPath(new URL("./modele/a-plat/logique.js", import.meta.url));

const DELAI_DU_PLAN_EN_MS = 2000;
const ELEMENTS_VIDES = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
// Ces balises peuvent rester ouvertes en HTML : leur fermeture n'est pas une erreur.
const FERMETURE_FACULTATIVE = new Set(["p", "li", "dt", "dd", "tr", "td", "th", "thead", "tbody", "tfoot", "colgroup", "option", "optgroup", "rt", "rp", "head", "body", "html"]);
// L'adresse seule (preconnect) ou avec un chemin ; fonts.googleapis.com.autre.test n'en fait pas partie.
const POLICES_EN_LIGNE = /^https:\/\/fonts\.(googleapis|gstatic)\.com(?=[/?#]|$)/i;

function pluriel(nombre, singulier, plurielDuMot) {
  return `${nombre} ${nombre > 1 ? plurielDuMot : singulier}`;
}

// ---------------------------------------------------------------- logique.js

// logique.js est lu comme du texte et exécuté dans node:vm avec un objet module : le
// "type" du package.json le plus proche (module ou commonjs) ne change donc rien.
// Renvoie { validerPlan, fichierSur }, ou lève une erreur dont le message est déjà en français.
function chargerLaLogique() {
  let texte;
  try {
    texte = readFileSync(CHEMIN_DE_LA_LOGIQUE, "utf8");
  } catch (erreur) {
    throw new Error(`Le fichier modele/a-plat/logique.js ne peut pas être lu : ${erreur.message}`);
  }
  const module = { exports: {} };
  try {
    vm.runInNewContext(texte, { module }, { filename: "logique.js", timeout: DELAI_DU_PLAN_EN_MS });
  } catch (erreur) {
    throw new Error(`Le fichier modele/a-plat/logique.js ne peut pas être exécuté : ${erreur && erreur.message ? erreur.message : erreur}`);
  }
  if (typeof module.exports.validerPlan !== "function" || typeof module.exports.fichierSur !== "function") {
    throw new Error("Le fichier modele/a-plat/logique.js n'offre pas validerPlan et fichierSur : il est abîmé ou ce n'est pas le bon fichier.");
  }
  return module.exports;
}

// ---------------------------------------------------------------- plan.js

class ErreurDePlan extends Error {}

// plan.js tourne dans un contexte vide : un window vide, sans require ni process.
// Le contexte et son window sont créés à l'intérieur du contexte, pour qu'aucun objet
// de Node n'y soit atteignable par accident. Ce n'est pas une barrière contre un
// fichier malveillant : plan.js est écrit par Claude dans le dossier de la personne.
function lirePlan(chemin) {
  let texte;
  try {
    texte = readFileSync(chemin, "utf8");
  } catch (erreur) {
    throw new ErreurDePlan(`plan.js ne peut pas être lu : ${erreur.message}`);
  }
  const contexte = vm.createContext(Object.create(null));
  vm.runInContext("this.window = {};", contexte);
  try {
    vm.runInContext(texte, contexte, { filename: "plan.js", timeout: DELAI_DU_PLAN_EN_MS });
  } catch (erreur) {
    if (erreur && erreur.code === "ERR_SCRIPT_EXECUTION_TIMEOUT") {
      throw new ErreurDePlan(`plan.js ne se termine pas : il a été arrêté après ${DELAI_DU_PLAN_EN_MS / 1000} secondes (une boucle sans fin ?).`);
    }
    if (erreur && erreur.name === "SyntaxError") {
      throw new ErreurDePlan(`plan.js a une erreur de syntaxe : ${erreur.message}`);
    }
    const detail = erreur && erreur.message ? erreur.message : String(erreur);
    throw new ErreurDePlan(`plan.js s'arrête sur une erreur (il n'a accès ni à require ni à process) : ${detail}`);
  }
  let plan;
  try {
    plan = vm.runInContext("window.A_PLAT", contexte, { timeout: DELAI_DU_PLAN_EN_MS });
  } catch (erreur) {
    plan = undefined;
  }
  if (plan === undefined || plan === null) {
    throw new ErreurDePlan("plan.js ne définit pas window.A_PLAT.");
  }
  return plan;
}

// ---------------------------------------------------------------- HTML

function lireAttributs(texte) {
  const attributs = {};
  const motif = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = motif.exec(texte)) !== null) {
    attributs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attributs;
}

// Lit le HTML d'un écran : renvoie ses balises ouvrantes (avec leurs attributs), son
// texte visible, le contenu de ses <style> et ses erreurs de fermeture. Les commentaires,
// <script> et <style> sont sautés pour le texte. Une pile suit les balises ouvertes ; pas de bibliothèque.
function analyserHtml(html) {
  const balises = [];
  const erreurs = [];
  const pile = [];
  const morceauxDeTexte = [];
  const styles = [];
  const bas = html.toLowerCase();
  const motifBalise = /<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/y;
  const ligneDe = (position) => html.slice(0, position).split("\n").length;
  const erreur = (position, message) => erreurs.push(`ligne ${ligneDe(position)} : ${message}`);

  let i = 0;
  while (i < html.length) {
    const debut = html.indexOf("<", i);
    if (debut === -1) {
      morceauxDeTexte.push(html.slice(i));
      break;
    }
    morceauxDeTexte.push(html.slice(i, debut));

    if (html.startsWith("<!--", debut)) {
      const fin = html.indexOf("-->", debut + 4);
      if (fin === -1) {
        erreur(debut, "le commentaire <!-- n'est jamais fermé.");
        break;
      }
      i = fin + 3;
      continue;
    }
    if (html.startsWith("<!", debut)) {
      const fin = html.indexOf(">", debut);
      if (fin === -1) break;
      i = fin + 1;
      continue;
    }

    motifBalise.lastIndex = debut;
    const m = motifBalise.exec(html);
    if (!m) {
      if (/^<\/?[a-zA-Z]/.test(html.slice(debut, debut + 3))) {
        erreur(debut, "une balise est mal formée (un > ou un guillemet manque).");
      }
      morceauxDeTexte.push("<");
      i = debut + 1;
      continue;
    }
    i = debut + m[0].length;
    const nom = m[2].toLowerCase();

    if (m[1] === "/") {
      if (ELEMENTS_VIDES.has(nom)) continue;
      const rang = pile.map((b) => b.nom).lastIndexOf(nom);
      if (rang === -1) {
        erreur(debut, `la balise fermante </${nom}> n'a pas de balise ouvrante.`);
        continue;
      }
      while (pile.length > rang + 1) {
        const ouverte = pile.pop();
        if (!FERMETURE_FACULTATIVE.has(ouverte.nom)) {
          erreur(ouverte.position, `la balise <${ouverte.nom}> n'est pas fermée.`);
        }
      }
      pile.pop();
      continue;
    }

    balises.push({ nom, attributs: lireAttributs(m[3]) });
    if (nom === "script" || nom === "style") {
      const fermeture = bas.indexOf(`</${nom}`, i);
      if (fermeture === -1) {
        erreur(debut, `la balise <${nom}> n'est jamais fermée.`);
        break;
      }
      if (nom === "style") styles.push(html.slice(i, fermeture));
      const finDeFermeture = html.indexOf(">", fermeture);
      i = finDeFermeture === -1 ? html.length : finDeFermeture + 1;
      continue;
    }
    if (ELEMENTS_VIDES.has(nom) || m[3].trimEnd().endsWith("/")) continue;
    pile.push({ nom, position: debut });
  }

  for (const ouverte of pile) {
    if (!FERMETURE_FACULTATIVE.has(ouverte.nom)) {
      erreur(ouverte.position, `la balise <${ouverte.nom}> n'est pas fermée.`);
    }
  }
  return { balises, texte: morceauxDeTexte.join(""), styles, erreurs };
}

// ---------------------------------------------------------------- contrôle

const VIENT_D_INTERNET = /^\s*(https?:)?\/\//i;
const LIEN_AVEC_PROTOCOLE = /^\s*[a-z][a-z0-9+.-]*:/i;
const APPEL_DE_RELAIS = /(^|\/)relais\.js([?#].*)?$/i;
const TEXTE_ENTRE_CROCHETS = /\[[^\[\]\n]*\S[^\[\]\n]*\]/g;

// Les attributs qui font charger quelque chose, sur n'importe quelle balise (img, iframe, video,
// audio, source, embed, object, form, input, track, svg…). href est à part : sur <a> et <area>,
// c'est un lien qu'on touche, pas un chargement ; sur <link>, une police peut être permise.
const ATTRIBUTS_QUI_CHARGENT = ["src", "poster", "data", "action", "formaction", "background", "manifest"];
const ATTRIBUTS_LISTES = ["srcset", "imagesrcset"];
const LIENS_A_TOUCHER = new Set(["a", "area"]);

// Les adresses qu'une feuille de style fait charger : url(…), et les textes entre guillemets
// qui commencent par une adresse (@import "…", image-set("…")). Les commentaires sont retirés.
function adressesDuStyle(css) {
  const sansCommentaire = css.replace(/\/\*[\s\S]*?\*\//g, " ");
  const adresses = [];
  for (const m of sansCommentaire.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/gi)) {
    adresses.push((m[1] ?? m[2] ?? m[3] ?? "").trim());
  }
  for (const m of sansCommentaire.matchAll(/(["'])\s*((?:https?:)?\/\/[^\s"'\/][^"']*)\1/gi)) {
    adresses.push(m[2].trim());
  }
  return adresses;
}

// Liste ce que le HTML ferait venir d'Internet : [{ adresse, ou, police }]. police vaut vrai
// là où une police en ligne peut être permise (un <link>, une feuille de style).
function chargementsDInternet(analyse) {
  const trouves = [];
  const noter = (adresse, ou, police = false) => {
    if (VIENT_D_INTERNET.test(adresse)) trouves.push({ adresse: adresse.trim(), ou, police });
  };
  for (const balise of analyse.balises) {
    const a = balise.attributs;
    for (const nom of ATTRIBUTS_QUI_CHARGENT) {
      if (typeof a[nom] === "string") noter(a[nom], `${nom} de <${balise.nom}>`);
    }
    for (const nom of ATTRIBUTS_LISTES) {
      if (typeof a[nom] !== "string") continue;
      for (const candidat of a[nom].split(",")) noter(candidat.trim().split(/\s+/)[0] ?? "", `${nom} de <${balise.nom}>`);
    }
    if (!LIENS_A_TOUCHER.has(balise.nom)) {
      for (const nom of ["href", "xlink:href"]) {
        if (typeof a[nom] === "string") noter(a[nom], `${nom} de <${balise.nom}>`, balise.nom === "link");
      }
    }
    if (typeof a.style === "string") {
      for (const adresse of adressesDuStyle(a.style)) noter(adresse, `style de <${balise.nom}>`, true);
    }
  }
  for (const css of analyse.styles) {
    for (const adresse of adressesDuStyle(css)) noter(adresse, "<style>", true);
  }
  return trouves;
}

// Contrôle un fichier HTML : un écran (ecrans/) ou l'existant redessiné d'un écran (actuel/).
//   chemin : le nom du fichier tel qu'on l'écrit dans les messages (« ecrans/A1.html »)
//   dossierDesLiens : le dossier d'où partent ses liens relatifs
//   estActuel : un existant n'a pas à dire son code (data-ecran) et ses crochets ne sont pas des
//               textes à remplir ; le reste (fermeture, relais.js, Internet, liens) se contrôle de même.
function controlerEcran({ chemin, code, html, dossierDesLiens, policeEnLigne, estActuel = false }) {
  const erreurs = [];
  const infos = [];
  const analyse = analyserHtml(html);
  for (const e of analyse.erreurs) erreurs.push(`${chemin}, ${e}`);

  if (!estActuel) {
    const baliseHtml = analyse.balises.find((b) => b.nom === "html");
    const dit = baliseHtml ? baliseHtml.attributs["data-ecran"] : undefined;
    if (dit === undefined) {
      erreurs.push(`${chemin} : la balise <html> n'a pas de data-ecran (attendu : data-ecran="${code}").`);
    } else if (dit !== code) {
      erreurs.push(`${chemin} : data-ecran vaut « ${dit} » mais le plan donne le code « ${code} » à cet écran.`);
    }
  }

  const appelleLeRelais = analyse.balises.some((b) => b.nom === "script" && APPEL_DE_RELAIS.test(b.attributs.src ?? ""));
  if (!appelleLeRelais) {
    erreurs.push(`${chemin} : le script relais.js n'est pas appelé (ajouter <script src="../a-plat/relais.js"></script> avant </body>).`);
  }

  for (const { adresse, ou, police } of chargementsDInternet(analyse)) {
    if (police && policeEnLigne && POLICES_EN_LIGNE.test(adresse)) continue;
    if (ou === "src de <script>") {
      erreurs.push(`${chemin} : le script « ${adresse} » vient d'Internet. Un écran ne charge rien depuis Internet.`);
    } else if (police) {
      erreurs.push(`${chemin} : la ressource « ${adresse} » (${ou}) vient d'Internet. Seule une police peut en venir, et seulement si reglages.policeEnLigne vaut true.`);
    } else {
      erreurs.push(`${chemin} : la ressource « ${adresse} » (${ou}) vient d'Internet. Un écran ne charge rien depuis Internet.`);
    }
  }

  const liensVus = new Set();
  for (const balise of analyse.balises) {
    if (balise.nom !== "a" || typeof balise.attributs.href !== "string") continue;
    const lien = balise.attributs.href.trim();
    if (lien.startsWith("#") || lien.startsWith("//") || LIEN_AVEC_PROTOCOLE.test(lien)) continue;
    const cible = lien.replace(/[?#].*$/, "");
    if (cible === "" || liensVus.has(lien)) continue;
    liensVus.add(lien);
    let decode = cible;
    try {
      decode = decodeURIComponent(cible);
    } catch (erreur) {
      // Un % mal formé : on garde le texte tel quel.
    }
    if (!existsSync(resolve(dossierDesLiens, decode))) {
      erreurs.push(`${chemin} : le lien « ${lien} » mène à un fichier absent.`);
    }
  }

  const crochets = estActuel ? [] : analyse.texte.match(TEXTE_ENTRE_CROCHETS) ?? [];
  if (crochets.length > 0) {
    infos.push(`${chemin} : ${pluriel(crochets.length, "texte entre crochets", "textes entre crochets")} : ${crochets.join(", ")}`);
  }
  return { erreurs, infos };
}

// Vrai si le chemin (relatif au dossier des maquettes) reste dans ce dossier.
function resteDansLeDossier(dossier, relatif) {
  const complet = resolve(dossier, relatif);
  const base = resolve(dossier);
  return complet === base || complet.startsWith(base + sep);
}

function estUnDossier(chemin) {
  try {
    return statSync(chemin).isDirectory();
  } catch (erreur) {
    return false;
  }
}

function estUnFichier(chemin) {
  try {
    return statSync(chemin).isFile();
  } catch (erreur) {
    return false;
  }
}

function controler(argument) {
  if (!argument) {
    return { code: 2, lignes: ["Il manque le dossier des maquettes. Usage : node verifier.mjs <dossier>"] };
  }
  let validerPlan;
  let fichierSur;
  try {
    ({ validerPlan, fichierSur } = chargerLaLogique());
  } catch (erreur) {
    return { code: 2, lignes: [erreur.message, "Le contrôle n'a pas pu démarrer : réinstaller le plugin À plat."] };
  }
  const dossier = resolve(argument);
  if (!estUnDossier(dossier)) {
    return { code: 2, lignes: [`Le dossier « ${argument} » n'existe pas.`] };
  }
  const cheminDuPlan = join(dossier, "plan.js");
  if (!estUnFichier(cheminDuPlan)) {
    return { code: 2, lignes: [`Le dossier « ${argument} » ne contient pas de plan.js.`] };
  }

  let plan;
  try {
    plan = lirePlan(cheminDuPlan);
  } catch (erreur) {
    if (erreur instanceof ErreurDePlan) {
      return { code: 1, lignes: [erreur.message, "Contrôle échoué : plan.js doit être corrigé avant tout autre contrôle."] };
    }
    throw erreur;
  }

  const erreurs = [...validerPlan(plan)];
  const infos = [];
  const dossierDesEcrans = join(dossier, "ecrans");
  // Un fichier qui sortirait de son dossier n'est jamais lu : validerPlan l'a déjà signalé.
  const ecrans = (Array.isArray(plan.ecrans) ? plan.ecrans : [])
    .filter((e) => e && typeof e === "object" && fichierSur(e.fichier));
  const policeEnLigne = plan.reglages && plan.reglages.policeEnLigne === true;

  const fichiersDuPlan = new Set(ecrans.map((e) => e.fichier));
  let fichiersPresents = [];
  // Claude ne crée aucun dossier vide : ecrans/ n'est exigé que si le plan liste des écrans.
  if (estUnDossier(dossierDesEcrans)) {
    fichiersPresents = readdirSync(dossierDesEcrans).filter((nom) => /\.html$/i.test(nom)).sort();
  } else if (Array.isArray(plan.ecrans) && plan.ecrans.length > 0) {
    erreurs.push("Le dossier ecrans est absent, alors que le plan liste des écrans.");
  }
  for (const nom of fichiersPresents) {
    if (!fichiersDuPlan.has(nom)) {
      erreurs.push(`Le fichier ecrans/${nom} n'est dans aucun écran du plan : l'ajouter au plan ou le supprimer.`);
    }
  }

  let controles = 0;
  for (const ecran of ecrans) {
    const cheminDeLEcran = join(dossierDesEcrans, ecran.fichier);
    if (!estUnFichier(cheminDeLEcran)) {
      erreurs.push(`L'écran ${ecran.code} du plan n'a pas de fichier : ecrans/${ecran.fichier} est absent.`);
    } else {
      controles++;
      const resultat = controlerEcran({
        chemin: `ecrans/${ecran.fichier}`,
        code: ecran.code,
        html: readFileSync(cheminDeLEcran, "utf8"),
        dossierDesLiens: dossierDesEcrans,
        policeEnLigne
      });
      erreurs.push(...resultat.erreurs);
      infos.push(...resultat.infos);
    }
    const actuel = ecran.actuel;
    if (actuel && typeof actuel === "object" && fichierSur(actuel.fichier)) {
      // Comme la page : un existant se cherche dans actuel/, que le plan écrive ce préfixe ou non.
      const relatif = actuel.fichier.indexOf("actuel/") === 0 ? actuel.fichier : `actuel/${actuel.fichier}`;
      if (!estUnFichier(join(dossier, relatif))) {
        erreurs.push(`L'écran ${ecran.code} cite la capture ${relatif}, qui est absente.`);
      } else if (/\.html?$/i.test(relatif)) {
        // Un existant redessiné est une page comme un écran : même contrôle, sans le code ni les crochets.
        if (!resteDansLeDossier(dossier, relatif)) {
          erreurs.push(`L'écran ${ecran.code} cite l'existant ${relatif}, qui est hors du dossier des maquettes : il n'est pas lu.`);
        } else {
          const cheminDeLActuel = join(dossier, relatif);
          const resultat = controlerEcran({
            chemin: relatif,
            code: ecran.code,
            html: readFileSync(cheminDeLActuel, "utf8"),
            dossierDesLiens: dirname(cheminDeLActuel),
            policeEnLigne,
            estActuel: true
          });
          erreurs.push(...resultat.erreurs);
        }
      }
    }
  }

  if (erreurs.length > 0) {
    return { code: 1, lignes: [...erreurs, ...infos, `Contrôle échoué : ${pluriel(erreurs.length, "erreur", "erreurs")} à corriger.`] };
  }
  return { code: 0, lignes: [...infos, `Contrôle réussi : ${pluriel(controles, "écran vérifié", "écrans vérifiés")}.`] };
}

const resultat = controler(process.argv[2]);
console.log(resultat.lignes.join("\n"));
process.exitCode = resultat.code;
