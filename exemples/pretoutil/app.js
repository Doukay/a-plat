// Prêtoutil : données d'exemple et fonctions partagées par toutes les pages.
// Les noms et les données sont inventés. La session, les prêts, les profils et les outils ajoutés
// sont gardés dans le navigateur (localStorage), il n'y a pas de serveur.

const VOISINS = [
  { id: 1, prenom: "Camille", email: "camille@exemple.test", rue: "rue des Lilas", role: "voisin" },
  { id: 2, prenom: "Basile", email: "basile@exemple.test", rue: "allée des Noyers", role: "voisin" },
  { id: 3, prenom: "Odile", email: "odile@exemple.test", rue: "rue des Lilas", role: "voisin" },
  { id: 4, prenom: "Lucien", email: "lucien@exemple.test", rue: "impasse du Verger", role: "voisin" },
  { id: 5, prenom: "Nadège", email: "nadege@exemple.test", rue: "allée des Noyers", role: "voisin" },
  { id: 6, prenom: "Ysolde", email: "ysolde@exemple.test", rue: "rue des Tilleuls", role: "referent" }
];

const OUTILS = [
  { id: 1, nom: "Perceuse sans fil", categorie: "Bricolage", proprietaire: 1, etat: "Très bon état", description: "Deux batteries et un jeu de forets pour le bois et le métal." },
  { id: 2, nom: "Échelle double 3 m", categorie: "Bricolage", proprietaire: 1, etat: "Bon état", description: "Aluminium, pieds antidérapants. Se range à plat." },
  { id: 3, nom: "Tondeuse électrique", categorie: "Jardin", proprietaire: 3, etat: "Bon état", description: "Câble de 25 m fourni. Bac de ramassage assez petit." },
  { id: 4, nom: "Taille-haie", categorie: "Jardin", proprietaire: 4, etat: "Usé mais fiable", description: "Lame de 60 cm. À nettoyer après usage." },
  { id: 5, nom: "Ponceuse orbitale", categorie: "Bricolage", proprietaire: 4, etat: "Bon état", description: "Livrée avec une boîte de papiers de verre neufs." },
  { id: 6, nom: "Appareil à raclette", categorie: "Cuisine", proprietaire: 5, etat: "Très bon état", description: "Huit poêlons. Idéal pour les repas de rue." },
  { id: 7, nom: "Nettoyeur haute pression", categorie: "Jardin", proprietaire: 3, etat: "Bon état", description: "Tuyau de 6 m. Brancher sur un robinet extérieur." },
  { id: 8, nom: "Scie sauteuse", categorie: "Bricolage", proprietaire: 6, etat: "Bon état", description: "Avec trois lames. Pas de coupe sur pierre." }
];

const STATUTS = {
  demandee: "Demande en attente",
  acceptee: "Acceptée",
  "en-cours": "En cours",
  rendue: "Rendu"
};

const PRETS_DEPART = [
  { id: 1, outil: 3, emprunteur: 1, debut: "2026-11-02", fin: "2026-11-12", statut: "en-cours" },
  { id: 2, outil: 8, emprunteur: 5, debut: "2026-11-03", fin: "2026-11-09", statut: "en-cours" },
  { id: 3, outil: 1, emprunteur: 4, debut: "2026-11-14", fin: "2026-11-16", statut: "demandee" },
  { id: 4, outil: 5, emprunteur: 1, debut: "2026-10-20", fin: "2026-10-22", statut: "rendue" },
  { id: 5, outil: 2, emprunteur: 3, debut: "2026-10-25", fin: "2026-10-26", statut: "rendue" }
];

// ---------- Mémoire du navigateur ----------

function lire(cle, defaut) {
  try {
    const brut = localStorage.getItem("pretoutil." + cle);
    return brut === null ? defaut : JSON.parse(brut);
  } catch (e) {
    return defaut;
  }
}

function ecrire(cle, valeur) {
  localStorage.setItem("pretoutil." + cle, JSON.stringify(valeur));
}

function lirePrets() {
  const prets = lire("prets", null);
  if (prets) return prets;
  ecrire("prets", PRETS_DEPART);
  return PRETS_DEPART;
}

function ecrirePrets(prets) {
  ecrire("prets", prets);
}

function prochainId(liste) {
  return liste.reduce((max, element) => Math.max(max, element.id), 0) + 1;
}

// ---------- Voisins et session ----------

function voisins() {
  const profils = lire("profils", {});
  return VOISINS.map((v) => Object.assign({}, v, profils[v.id] || {}));
}

function voisin(id) {
  return voisins().find((v) => v.id === id);
}

function utilisateur() {
  const id = lire("session", null);
  return id ? voisin(id) || null : null;
}

function ouvrirSession(id) {
  ecrire("session", id);
}

function fermerSession() {
  localStorage.removeItem("pretoutil.session");
}

function exigerConnexion() {
  const moi = utilisateur();
  if (!moi) {
    const page = location.pathname.split("/").pop();
    location.href = "connexion.html?retour=" + encodeURIComponent(page);
  }
  return moi;
}

// ---------- Outils et prêts ----------

function pretEnCours(idOutil) {
  return lirePrets().find((p) => p.outil === idOutil && p.statut === "en-cours");
}

function prolonger(idPret) {
  const pret = lirePrets().find((p) => p.id === idPret);
  const nouvelle = new Date(pret.fin);
  nouvelle.setDate(nouvelle.getDate() + 3);
  console.log("Nouvelle date de retour du prêt " + idPret + " : " + nouvelle.toISOString().slice(0, 10));
  return nouvelle;
}

function jours(debut, fin) {
  return Math.round((new Date(fin) - new Date(debut)) / 86400000);
}

function dateFrancaise(iso) {
  const [a, m, j] = iso.split("-");
  return j + "/" + m + "/" + a;
}

function aujourdhui() {
  return new Date().toISOString().slice(0, 10);
}

function echapper(texte) {
  return String(texte).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// ---------- Haut et bas de page ----------

const MENU = [
  { page: "accueil", href: "index.html", texte: "Accueil" },
  { page: "voisins", href: "quartier.html", texte: "Voisins" },
  { page: "prets", href: "mes-prets.html", texte: "Mes prêts" },
  { page: "ajouter", href: "ajouter.html", texte: "Proposer un outil" },
  { page: "profil", href: "profil.html", texte: "Mon profil" }
];

function habiller(pageCourante) {
  const moi = utilisateur();
  const session = moi
    ? "Connecté : " + echapper(moi.prenom) + ' (<a href="#" id="deconnexion">Se déconnecter</a>)'
    : '<a href="connexion.html">Se connecter</a>';
  const liens = MENU.map(
    (m) => '<a href="' + m.href + '"' + (m.page === pageCourante ? ' class="courante"' : "") + ">" + m.texte + "</a>"
  ).join("");
  document.getElementById("haut").innerHTML =
    '<span class="session">' + session + "</span>" +
    '<div class="marque">' + REGLAGES.nomAppli + ' <span class="petit" style="color:#cfd9e6">quartier ' + REGLAGES.quartier + "</span></div>" +
    "<nav>" + liens + "</nav>";
  document.getElementById("bas").innerHTML =
    '<a href="regles.html">Règles du prêt</a> · <a href="mailto:referent@exemple.test">Écrire au référent</a> · ' +
    REGLAGES.nomAppli + ", entre voisins du quartier " + REGLAGES.quartier + ".";
  const sortir = document.getElementById("deconnexion");
  if (sortir) {
    sortir.addEventListener("click", (e) => {
      e.preventDefault();
      fermerSession();
      location.href = "index.html";
    });
  }
}

// ---------- Boutons qui changent de page ----------
// Un bouton porte data-aller="nom" ; la table ci-dessous dit où il mène.

const ROUTES = {
  demande: (bouton) => "demande.html?outil=" + bouton.dataset.outil,
  fiche: (bouton) => "outil.html?id=" + bouton.dataset.outil,
  prets: () => "mes-prets.html"
};

document.addEventListener("click", (e) => {
  const bouton = e.target.closest("[data-aller]");
  if (!bouton || bouton.disabled) return;
  location.href = ROUTES[bouton.dataset.aller](bouton);
});
