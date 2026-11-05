// Relais d'un écran d'À plat. Chaque écran le charge avec <script src="../a-plat/relais.js">.
//
// Il sert à une seule chose : parler à la page d'À plat quand l'écran est affiché dedans,
// car la page n'a pas le droit de lire dans un cadre ouvert d'un double-clic.
// Ouvert seul, hors de la page, l'écran n'est qu'un fichier HTML ordinaire : ce script
// ne fait alors rien du tout.
//
// Messages, tous marqués { aPlat: 1 } :
//   écran -> page : pret (avec la hauteur), element (avec le nom, et où il est : haut et bas),
//                   lien (avec l'adresse touchée)
//   page -> écran : mode ("corriger" ou "essayer"), choisi (actif : true ou false), qui entoure
//                   ou n'entoure plus le dernier élément touché
(function () {
  "use strict";

  if (window.parent === window) return;

  var LONGUEUR_DU_TEXTE = 40;
  var SELECTEUR_DES_ELEMENTS = "a, button, input, select, textarea, label, h1, h2, h3, h4, img";
  var TYPES_DE_BOUTON = ["button", "submit", "reset", "image"];

  // Tant que la page n'a rien dit, on corrige : rien ne mène nulle part par accident.
  var mode = "corriger";

  // ------------------------------------------------------------ nom d'un élément

  // Le texte d'un élément, sur une ligne, raccourci s'il est long.
  function raccourcir(valeur) {
    var propre = String(valeur || "").replace(/\s+/g, " ").trim();
    if (propre.length > LONGUEUR_DU_TEXTE) propre = propre.slice(0, LONGUEUR_DU_TEXTE - 1).trim() + "…";
    return propre;
  }

  // Le texte d'un libellé, sans le texte des champs qu'il contient (les choix d'une liste).
  function texteDuLibelle(libelle) {
    var copie = libelle.cloneNode(true);
    var champs = copie.querySelectorAll("input, select, textarea, button");
    for (var i = 0; i < champs.length; i++) champs[i].parentNode.removeChild(champs[i]);
    return raccourcir(copie.textContent);
  }

  // Ce qui nomme un champ pour la personne : son libellé, sinon son texte d'aide.
  function libelleDuChamp(champ) {
    var direct = raccourcir(champ.getAttribute("aria-label"));
    if (direct) return direct;
    var libelles = champ.labels || [];
    for (var i = 0; i < libelles.length; i++) {
      var texte = texteDuLibelle(libelles[i]);
      if (texte) return texte;
    }
    return raccourcir(champ.getAttribute("placeholder"));
  }

  function avecTexte(role, texte) {
    return texte ? role + " « " + texte + " »" : role;
  }

  // Le nom court d'un élément, tel qu'il sera écrit dans une correction :
  // data-nom s'il existe, sinon son rôle en français et son texte.
  function nomElement(element) {
    if (!element || element.nodeType !== 1) return "Élément";
    var voulu = raccourcir(element.getAttribute("data-nom"));
    if (voulu) return voulu;

    var balise = element.tagName.toLowerCase();
    var type = String(element.getAttribute("type") || "").toLowerCase();

    if (balise === "button" || (balise === "input" && TYPES_DE_BOUTON.indexOf(type) !== -1)) {
      var intitule = balise === "button" ? element.textContent : element.getAttribute("value");
      return avecTexte("Bouton", raccourcir(intitule) || raccourcir(element.getAttribute("aria-label")) || raccourcir(element.getAttribute("title")));
    }
    if (balise === "a") {
      return avecTexte("Lien", raccourcir(element.textContent) || raccourcir(element.getAttribute("aria-label")) || raccourcir(element.getAttribute("title")));
    }
    if (/^h[1-4]$/.test(balise)) return avecTexte("Titre", raccourcir(element.textContent));
    if (balise === "label") {
      var dit = texteDuLibelle(element);
      return dit ? "Champ « " + dit + " »" : "Élément";
    }
    if (balise === "input" || balise === "select" || balise === "textarea") {
      var libelle = libelleDuChamp(element);
      return libelle ? "Champ « " + libelle + " »" : "Élément";
    }
    if (balise === "img") {
      var alternatif = raccourcir(element.getAttribute("alt"));
      return alternatif ? "Image « " + alternatif + " »" : "Élément";
    }
    return "Élément";
  }

  // L'élément que la personne a voulu toucher : celui qui porte data-nom, sinon le plus
  // proche élément « parlant », sinon celui qui a reçu le toucher.
  function elementVise(depart) {
    var element = depart && depart.nodeType === 1 ? depart : depart && depart.parentElement;
    if (!element) return null;
    return element.closest("[data-nom]") || element.closest(SELECTEUR_DES_ELEMENTS) || element;
  }

  // ------------------------------------------------------------ messages

  function code() {
    return document.documentElement.dataset.ecran || "";
  }

  function envoyer(message) {
    message.aPlat = 1;
    message.code = code();
    try {
      window.parent.postMessage(message, "*");
    } catch (erreur) {
      // la page n'écoute pas : l'écran reste un écran ordinaire
    }
  }

  function annoncerLaHauteur() {
    envoyer({ type: "pret", hauteur: Math.ceil(document.documentElement.scrollHeight) });
  }

  // ------------------------------------------------------------ l'élément choisi

  // Le dernier élément touché en mode « Corriger », et celui qui est entouré en ce moment
  // avec ce qu'il avait avant (son propre style n'est pas perdu).
  var dernier = null;
  var entoure = null;
  var avant = null;

  function retirerLEntourage() {
    if (!entoure) return;
    var restes = avant || {};
    ["outline", "outline-offset"].forEach(function (propriete) {
      var ancien = restes[propriete];
      if (ancien && ancien.valeur) entoure.style.setProperty(propriete, ancien.valeur, ancien.priorite);
      else entoure.style.removeProperty(propriete);
    });
    if (entoure.getAttribute("style") === "") entoure.removeAttribute("style");
    entoure = null;
    avant = null;
  }

  function entourerLeDernier() {
    retirerLEntourage();
    if (!dernier || !dernier.style) return;
    entoure = dernier;
    avant = {};
    ["outline", "outline-offset"].forEach(function (propriete) {
      avant[propriete] = { valeur: entoure.style.getPropertyValue(propriete), priorite: entoure.style.getPropertyPriority(propriete) };
    });
    entoure.style.setProperty("outline", "3px solid #2150c9", "important");
    entoure.style.setProperty("outline-offset", "2px", "important");
  }

  window.addEventListener("message", function (evenement) {
    var donnee = evenement.data;
    if (evenement.source !== window.parent || !donnee || typeof donnee !== "object") return;
    if (donnee.aPlat !== 1) return;
    if (donnee.type === "choisi") {
      if (donnee.actif === true) entourerLeDernier();
      else if (donnee.actif === false) retirerLEntourage();
      return;
    }
    if (donnee.type !== "mode") return;
    if (donnee.mode !== "corriger" && donnee.mode !== "essayer") return;
    mode = donnee.mode;
    document.documentElement.setAttribute("data-a-plat-mode", mode);
  });

  // ------------------------------------------------------------ touchers

  // En capture, pour passer avant les scripts de l'écran.
  document.addEventListener("click", function (evenement) {
    var cible = evenement.target;
    if (!cible || typeof cible.closest !== "function") return;

    if (mode === "corriger") {
      // Rien ne s'ouvre, rien ne s'envoie : on dit seulement quel élément a été touché.
      evenement.preventDefault();
      evenement.stopImmediatePropagation();
      var vise = elementVise(cible);
      dernier = vise;
      var message = { type: "element", nom: nomElement(vise) };
      // Où il est dans le cadre, pour que la page le garde en vue pendant la saisie.
      if (vise && typeof vise.getBoundingClientRect === "function") {
        var boite = vise.getBoundingClientRect();
        message.haut = Math.round(boite.top);
        message.bas = Math.round(boite.bottom);
      }
      envoyer(message);
      return;
    }

    // Essayer le parcours : un lien ne quitte pas le cadre, la page ouvre l'écran voulu.
    var lien = cible.closest("a[href]");
    if (!lien) return;
    var adresse = lien.getAttribute("href");
    if (adresse.charAt(0) === "#" && adresse.length > 1) return; // une ancre dans l'écran lui-même
    evenement.preventDefault();
    if (adresse) envoyer({ type: "lien", vers: adresse });
  }, true);

  document.addEventListener("submit", function (evenement) {
    evenement.preventDefault();
    if (mode === "corriger") return;
    var action = evenement.target && typeof evenement.target.getAttribute === "function" ? evenement.target.getAttribute("action") : "";
    if (action) envoyer({ type: "lien", vers: action });
  }, true);

  window.APlatRelais = { nomElement: nomElement };

  // Une première fois tout de suite, une seconde quand les images sont arrivées.
  annoncerLaHauteur();
  if (document.readyState !== "complete") window.addEventListener("load", annoncerLaHauteur);
})();
