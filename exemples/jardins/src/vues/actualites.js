import { actualites, publier } from "../donnees.js";
import { estBureau } from "../session.js";
import { esc, dateLongue } from "../outils.js";

export async function rendre(conteneur) {
  const bureau = estBureau();
  const zone = document.createElement("div");
  conteneur.append(zone);

  function dessiner() {
    const articles = [...actualites()].sort((a, b) => b.date.localeCompare(a.date));
    zone.innerHTML = `
      <h1>Actualités du bureau</h1>
      ${bureau ? `
        <section class="carte">
          <h2>Publier une nouvelle</h2>
          <form id="form-actu">
            <label for="titre">Titre</label>
            <input id="titre" name="titre" required>
            <label for="texte">Texte</label>
            <textarea id="texte" name="texte" required></textarea>
            <p><button type="submit">Publier</button></p>
          </form>
        </section>` : ""}
      ${articles
        .map(
          (a) => `<article class="carte">
            <h2>${esc(a.titre)}</h2>
            <p><small>${esc(dateLongue(a.date))}</small></p>
            <p>${esc(a.texte)}</p>
            ${bureau ? `<div class="actions"><button class="discret" data-action="modifier" data-actu="${a.id}">Modifier</button></div>` : ""}
          </article>`
        )
        .join("")}`;
    const formulaire = zone.querySelector("#form-actu");
    if (formulaire) {
      formulaire.addEventListener("submit", (e) => {
        e.preventDefault();
        const champs = new FormData(e.target);
        publier({ titre: champs.get("titre").trim(), texte: champs.get("texte").trim() });
        dessiner();
      });
    }
  }

  dessiner();
}
