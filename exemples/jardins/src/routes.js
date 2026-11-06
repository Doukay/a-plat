// Adresses du site (après le #) et chargement de la vue qui leur correspond.
import { courant } from "./session.js";

export const routes = [
  { chemin: "/", vue: "accueil", titre: "Accueil", menu: true },
  { chemin: "/connexion", vue: "connexion", titre: "Connexion" },
  { chemin: "/parcelles", vue: "parcelles", titre: "Parcelles", menu: true },
  { chemin: "/parcelles/:id", vue: "parcelle", titre: "Une parcelle" },
  { chemin: "/arrosage", vue: "arrosage", titre: "Arrosage", menu: true, acces: "membre" },
  { chemin: "/cabane", vue: "cabane", titre: "Cabane à outils", menu: true, acces: "membre" },
  { chemin: "/attente", vue: "attente", titre: "Liste d'attente", menu: true },
  { chemin: "/actualites", vue: "actualites", titre: "Actualités", menu: true },
  { chemin: "/compte", vue: "compte", titre: "Mon compte", menu: true, acces: "membre" },
  { chemin: "/bureau", vue: "bureau", titre: "Espace du bureau", menu: true, acces: "bureau" }
];

function motif(chemin) {
  const noms = [];
  const source = chemin.replace(/:([a-z]+)/g, (_, nom) => {
    noms.push(nom);
    return "([^/]+)";
  });
  return { regex: new RegExp(`^${source}$`), noms };
}

export function trouver(chemin) {
  for (const route of routes) {
    const { regex, noms } = motif(route.chemin);
    const m = regex.exec(chemin);
    if (m) return { route, params: Object.fromEntries(noms.map((nom, i) => [nom, decodeURIComponent(m[i + 1])])) };
  }
  return null;
}

export function accessible(route) {
  if (!route.acces) return true;
  const moi = courant();
  if (route.acces === "bureau") return moi?.role === "bureau";
  return Boolean(moi);
}

export async function afficher() {
  const conteneur = document.getElementById("vue");
  const chemin = location.hash.replace(/^#/, "") || "/";
  const trouve = trouver(chemin);
  if (!trouve) {
    location.hash = "#/";
    return;
  }
  const { route, params } = trouve;
  if (!accessible(route)) {
    location.hash = courant() ? "#/" : "#/connexion";
    return;
  }
  const module = await import(`./vues/${route.vue}.js`);
  document.title = `${route.titre} · Les Jardins de la Grelinette`;
  conteneur.replaceChildren();
  await module.rendre(conteneur, params);
  document.dispatchEvent(new CustomEvent("vue-affichee", { detail: { route, chemin } }));
}

export function demarrer() {
  window.addEventListener("hashchange", afficher);
  afficher();
}
