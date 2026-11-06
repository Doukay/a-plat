import { attente, inscrireAttente } from "../donnees.js";
import { esc, dateCourte, TAILLES } from "../outils.js";

export async function rendre(conteneur) {
  function liste() {
    const gens = [...attente()].sort((a, b) => a.depuis.localeCompare(b.depuis));
    if (gens.length === 0) return "<p>Personne n'attend de parcelle pour le moment.</p>";
    return `<table>
      <thead><tr><th>Rang</th><th>Prénom</th><th>Taille souhaitée</th><th>Inscrit le</th></tr></thead>
      <tbody>${gens
        .map((g, i) => `<tr><td>${i + 1}</td><td>${esc(g.prenom)}</td><td>${esc(TAILLES[g.taille])}</td><td>${esc(dateCourte(g.depuis))}</td></tr>`)
        .join("")}</tbody></table>`;
  }

  conteneur.innerHTML = `
    <h1>Liste d'attente</h1>
    <p>Les parcelles se libèrent rarement. Les personnes inscrites sont classées par date d'inscription.</p>
    <div id="liste">${liste()}</div>
    <section class="carte">
      <h2>Je m'inscris</h2>
      <form id="form-attente">
        <label for="prenom">Prénom</label>
        <input id="prenom" name="prenom" required>
        <label for="courriel">Courriel</label>
        <input id="courriel" name="courriel" type="email" required>
        <label for="taille">Taille de parcelle souhaitée</label>
        <select id="taille" name="taille">
          ${Object.entries(TAILLES).map(([cle, texte]) => `<option value="${cle}">${esc(texte)}</option>`).join("")}
        </select>
        <p><button type="submit">Je m'inscris</button></p>
      </form>
      <div id="retour" role="status"></div>
    </section>`;

  conteneur.querySelector("#form-attente").addEventListener("submit", (e) => {
    e.preventDefault();
    const champs = new FormData(e.target);
    const rang = inscrireAttente({
      prenom: champs.get("prenom").trim(),
      courriel: champs.get("courriel").trim(),
      taille: champs.get("taille")
    });
    e.target.reset();
    const retour = conteneur.querySelector("#retour");
    retour.className = "message";
    retour.textContent = `Inscription enregistrée : vous êtes en position ${rang}.`;
    conteneur.querySelector("#liste").innerHTML = liste();
  });
}
