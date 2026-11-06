import { parcelles, membres, membre, attente, attribuer, liberer, basculerCotisation } from "../donnees.js";
import { CONFIG } from "../config.js";
import { esc } from "../outils.js";

export async function rendre(conteneur) {
  const zone = document.createElement("div");
  conteneur.append(zone);
  let message = "";

  function dessiner() {
    const lignesParcelles = parcelles()
      .map(
        (p) => `<tr>
          <td>${esc(p.id.toUpperCase())}</td><td>${esc(p.secteur)}, ${p.surface} m²</td>
          <td>${p.titulaire ? esc(membre(p.titulaire).prenom) : "<strong>Libre</strong>"}</td>
          <td><div class="actions">
            <select aria-label="Attribuer ${esc(p.id.toUpperCase())} à" data-choix="${p.id}">
              ${membres().map((m) => `<option value="${m.id}"${m.id === p.titulaire ? " selected" : ""}>${esc(m.prenom)}</option>`).join("")}
            </select>
            <button data-action="attribuer" data-parcelle="${p.id}">Attribuer</button>
            <button class="discret" data-action="liberer" data-parcelle="${p.id}"${p.titulaire ? "" : " disabled"}>Libérer</button>
          </div></td></tr>`
      )
      .join("");
    const lignesCotisations = membres()
      .map(
        (m) => `<tr><td>${esc(m.prenom)}</td><td>${m.cotisation === "payee" ? "Réglée" : `À régler (${CONFIG.cotisation} €)`}</td>
          <td><button class="discret" data-action="cotisation" data-membre="${m.id}">${m.cotisation === "payee" ? "Marquer à régler" : "Marquer réglée"}</button></td></tr>`
      )
      .join("");
    zone.innerHTML = `
      <h1>Espace du bureau</h1>
      ${message ? `<p class="message" role="status">${esc(message)}</p>` : ""}
      <p>${attente().length} personne(s) sur la liste d'attente. <a href="#/attente">Voir la liste</a></p>
      <h2>Parcelles</h2>
      <table><thead><tr><th>Parcelle</th><th>Lieu</th><th>Titulaire</th><th></th></tr></thead><tbody>${lignesParcelles}</tbody></table>
      <h2>Cotisations ${CONFIG.saison}</h2>
      <table><thead><tr><th>Membre</th><th>Situation</th><th></th></tr></thead><tbody>${lignesCotisations}</tbody></table>`;
  }

  zone.addEventListener("click", (e) => {
    const bouton = e.target.closest("[data-action]");
    if (!bouton) return;
    const { action, parcelle, membre: idMembre } = bouton.dataset;
    if (action === "attribuer") {
      const choix = zone.querySelector(`[data-choix="${parcelle}"]`).value;
      attribuer(parcelle, choix);
      message = `Parcelle ${parcelle.toUpperCase()} attribuée à ${membre(choix).prenom}.`;
    } else if (action === "liberer") {
      liberer(parcelle);
      message = `Parcelle ${parcelle.toUpperCase()} libérée.`;
    } else if (action === "cotisation") {
      basculerCotisation(idMembre);
      message = "Cotisation mise à jour.";
    }
    dessiner();
  });

  dessiner();
}
