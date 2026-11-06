// Point d'entrée : menu, identité de la personne connectée, déconnexion, puis démarrage du routeur.
import { routes, accessible, afficher, demarrer } from "./routes.js";
import { courant, deconnecter } from "./session.js";
import { esc } from "./outils.js";

function dessinerEntete(chemin) {
  const menu = document.getElementById("menu");
  menu.innerHTML = routes
    .filter((r) => r.menu && accessible(r))
    .map((r) => `<a href="#${r.chemin}"${r.chemin === chemin ? ' aria-current="page"' : ""}>${esc(r.titre)}</a>`)
    .join("");
  const moi = courant();
  document.getElementById("identite").innerHTML = moi
    ? `${esc(moi.prenom)} (${moi.role})`
    : '<a href="#/connexion">Connexion</a>';
  document.getElementById("deconnexion").hidden = !moi;
}

document.addEventListener("vue-affichee", (e) => dessinerEntete(e.detail.chemin));

document.getElementById("deconnexion").addEventListener("click", () => {
  deconnecter();
  if (location.hash === "#/" || location.hash === "") afficher();
  else location.hash = "#/";
});

dessinerEntete("/");
demarrer();
