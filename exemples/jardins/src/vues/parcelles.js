import { parcelles, membre } from "../donnees.js";
import { esc } from "../outils.js";

export async function rendre(conteneur) {
  const secteurs = [...new Set(parcelles().map((p) => p.secteur))];

  conteneur.innerHTML = `
    <h1>Les parcelles</h1>
    <div class="filtres">
      <div>
        <label for="f-secteur">Secteur</label>
        <select id="f-secteur">
          <option value="">Tous</option>
          ${secteurs.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("")}
        </select>
      </div>
      <div>
        <label for="f-etat">État</label>
        <select id="f-etat">
          <option value="">Toutes</option>
          <option value="libre">Libres</option>
          <option value="attribuee">Attribuées</option>
        </select>
      </div>
    </div>
    <table>
      <thead><tr><th>Parcelle</th><th>Secteur</th><th>Surface</th><th>Titulaire</th><th></th></tr></thead>
      <tbody id="lignes"></tbody>
    </table>
    <p>Une parcelle vous intéresse ? <a href="#/attente">Inscrivez-vous sur la liste d'attente</a>.</p>`;

  const lignes = conteneur.querySelector("#lignes");
  const secteur = conteneur.querySelector("#f-secteur");
  const etat = conteneur.querySelector("#f-etat");

  function dessiner() {
    const gardees = parcelles().filter(
      (p) =>
        (!secteur.value || p.secteur === secteur.value) &&
        (!etat.value || (etat.value === "libre" ? !p.titulaire : Boolean(p.titulaire)))
    );
    lignes.innerHTML = gardees
      .map(
        (p) => `<tr>
          <td>${esc(p.id.toUpperCase())}</td><td>${esc(p.secteur)}</td><td>${p.surface} m²</td>
          <td>${p.titulaire ? esc(membre(p.titulaire).prenom) : "<strong>Libre</strong>"}</td>
          <td><a href="#/parcelles/${esc(p.id)}">Voir</a></td></tr>`
      )
      .join("");
  }

  secteur.addEventListener("change", dessiner);
  etat.addEventListener("change", dessiner);
  dessiner();
}
