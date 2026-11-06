// Données de l'association (inventées pour l'essai) et petites opérations dessus.
// L'état est gardé dans le navigateur de chaque visiteur (localStorage).
import { CONFIG } from "./config.js";

const CLE = "jardins.etat.v1";

const GRAINE = {
  membres: [
    { id: "m1", prenom: "Aubépine", code: "aubepine-essai", role: "bureau", fonction: "présidente", cotisation: "payee" },
    { id: "m2", prenom: "Romarin", code: "romarin-essai", role: "bureau", fonction: "trésorier", cotisation: "payee" },
    { id: "m3", prenom: "Pervenche", code: "pervenche-essai", role: "membre", cotisation: "payee" },
    { id: "m4", prenom: "Capucine", code: "capucine-essai", role: "membre", cotisation: "due" },
    { id: "m5", prenom: "Alisier", code: "alisier-essai", role: "membre", cotisation: "payee" },
    { id: "m6", prenom: "Mirabelle", code: "mirabelle-essai", role: "membre", cotisation: "due" },
    { id: "m7", prenom: "Fenouil", code: "fenouil-essai", role: "membre", cotisation: "due" },
    { id: "m8", prenom: "Cerfeuil", code: "cerfeuil-essai", role: "membre", cotisation: "payee" }
  ],
  parcelles: [
    { id: "p1", secteur: "Les Terrasses", surface: 40, exposition: "plein sud", pointEau: true, titulaire: "m3", depuis: 2019 },
    { id: "p2", secteur: "Les Terrasses", surface: 30, exposition: "plein sud", pointEau: true, titulaire: "m4", depuis: 2021 },
    { id: "p3", secteur: "Les Terrasses", surface: 30, exposition: "sud-est", pointEau: false, titulaire: "m5", depuis: 2020 },
    { id: "p4", secteur: "Les Terrasses", surface: 25, exposition: "sud-est", pointEau: false, titulaire: "m6", depuis: 2023 },
    { id: "p5", secteur: "Les Terrasses", surface: 25, exposition: "est", pointEau: true, titulaire: null, depuis: null },
    { id: "p6", secteur: "Le Bas-Clos", surface: 50, exposition: "sud", pointEau: true, titulaire: "m1", depuis: 2018 },
    { id: "p7", secteur: "Le Bas-Clos", surface: 35, exposition: "sud", pointEau: true, titulaire: "m2", depuis: 2018 },
    { id: "p8", secteur: "Le Bas-Clos", surface: 35, exposition: "ouest", pointEau: false, titulaire: "m8", depuis: 2022 },
    { id: "p9", secteur: "Le Bas-Clos", surface: 20, exposition: "ouest", pointEau: false, titulaire: null, depuis: null },
    { id: "p10", secteur: "Le Verger", surface: 45, exposition: "mi-ombre", pointEau: true, titulaire: "m3", depuis: 2022 },
    { id: "p11", secteur: "Le Verger", surface: 45, exposition: "mi-ombre", pointEau: true, titulaire: "m5", depuis: 2024 },
    { id: "p12", secteur: "Le Bas-Clos", surface: 30, exposition: "sud", pointEau: true, titulaire: null, depuis: null }
  ],
  outils: [
    { id: "o1", nom: "Grelinette", note: "Une seule, à reposer propre." },
    { id: "o2", nom: "Broyeur de végétaux", note: "Casque obligatoire." },
    { id: "o3", nom: "Brouette", note: "Deux brouettes, réservation pour le gros chantier." },
    { id: "o4", nom: "Taille-haie", note: "Batterie à recharger après usage." },
    { id: "o5", nom: "Tondeuse", note: "Pour les allées communes seulement." }
  ],
  reservations: [
    { id: "r1", outilId: "o2", date: "2027-03-20", creneau: "matin", membreId: "m3" },
    { id: "r2", outilId: "o5", date: "2027-03-27", creneau: "apres-midi", membreId: "m6" },
    { id: "r3", outilId: "o2", date: "2027-03-20", creneau: "apres-midi", membreId: "m4" }
  ],
  tours: [
    { id: "t1", debut: "2027-04-05", membres: ["m3", "m5"], fait: [] },
    { id: "t2", debut: "2027-04-12", membres: ["m4", "m6"], fait: [] },
    { id: "t3", debut: "2027-04-19", membres: ["m1", "m8"], fait: [] },
    { id: "t4", debut: "2027-04-26", membres: ["m2", "m3"], fait: [] },
    { id: "t5", debut: "2027-05-03", membres: ["m5", "m4"], fait: [] },
    { id: "t6", debut: "2027-05-10", membres: ["m6", "m1"], fait: [] },
    { id: "t7", debut: "2027-05-17", membres: [], fait: [] },
    { id: "t8", debut: "2027-05-24", membres: ["m8", "m2"], fait: [] }
  ],
  attente: [
    { id: "w1", prenom: "Ancolie", courriel: "ancolie@exemple.invalid", taille: "moyenne", depuis: "2026-09-14" },
    { id: "w2", prenom: "Bourrache", courriel: "bourrache@exemple.invalid", taille: "petite", depuis: "2026-09-28" },
    { id: "w3", prenom: "Chicorée", courriel: "chicoree@exemple.invalid", taille: "grande", depuis: "2026-10-09" }
  ],
  actualites: [
    { id: "a1", titre: "Compte rendu de l'assemblée générale", date: "2026-10-19", texte: "Le compte rendu de l'assemblée du 17 octobre est dans le dossier de la cabane. Merci à toutes et à tous d'être venus." },
    { id: "a2", titre: "Journée de rangement de la cabane", date: "2026-10-24", texte: "Rendez-vous samedi 7 novembre à 9 h pour trier les outils. Apportez des gants." },
    { id: "a3", titre: "Coupure de l'eau pour l'hiver", date: "2026-11-02", texte: "L'eau est coupée à partir de ce lundi. Videz vos arrosoirs et rentrez les tuyaux." }
  ]
};

function charger() {
  const brut = localStorage.getItem(CLE);
  if (brut === null) return structuredClone(GRAINE);
  return JSON.parse(brut);
}

const etat = charger();

export function sauver() {
  localStorage.setItem(CLE, JSON.stringify(etat));
}

let compteur = Date.now();
const nouvelId = (prefixe) => `${prefixe}${(compteur++).toString(36)}`;

export const membres = () => etat.membres;
export const membre = (id) => etat.membres.find((m) => m.id === id);
export const parcelles = () => etat.parcelles;
export const parcelle = (id) => etat.parcelles.find((p) => p.id === id);
export const outils = () => etat.outils;
export const outil = (id) => etat.outils.find((o) => o.id === id);
export const reservations = () => etat.reservations;
export const tours = () => etat.tours;
export const attente = () => etat.attente;
export const actualites = () => etat.actualites;

export function attribuer(parcelleId, membreId) {
  parcelle(parcelleId).titulaire = membreId;
  parcelle(parcelleId).depuis = new Date().getFullYear();
  sauver();
}

export function liberer(parcelleId) {
  parcelle(parcelleId).titulaire = null;
  parcelle(parcelleId).depuis = null;
  sauver();
}

export function reservationsEnCours(membreId, jour) {
  return etat.reservations.filter((r) => r.membreId === membreId && r.date >= jour);
}

export function reserver({ outilId, date, creneau, membreId }, jour) {
  if (date < jour) return { ok: false, raison: "Cette date est passée." };
  if (etat.reservations.some((r) => r.outilId === outilId && r.date === date && r.creneau === creneau)) {
    return { ok: false, raison: "Ce créneau est déjà pris." };
  }
  if (reservationsEnCours(membreId, jour).length >= CONFIG.reservationsMax) {
    return { ok: false, raison: `Vous avez déjà ${CONFIG.reservationsMax} réservations en cours.` };
  }
  etat.reservations.push({ id: nouvelId("r"), outilId, date, creneau, membreId });
  sauver();
  return { ok: true };
}

export function marquerFait(tourId, membreId) {
  const tour = etat.tours.find((t) => t.id === tourId);
  if (tour && tour.membres.includes(membreId) && !tour.fait.includes(membreId)) tour.fait.push(membreId);
  sauver();
}

export function inscrireAttente({ prenom, courriel, taille }) {
  etat.attente.push({ id: nouvelId("w"), prenom, courriel, taille, depuis: new Date().toISOString().slice(0, 10) });
  sauver();
  return etat.attente.length;
}

export function publier({ titre, texte }) {
  etat.actualites.push({ id: nouvelId("a"), titre, texte, date: new Date().toISOString().slice(0, 10) });
  sauver();
}

export function basculerCotisation(membreId) {
  const m = membre(membreId);
  m.cotisation = m.cotisation === "payee" ? "due" : "payee";
  sauver();
}
