import { tours, membre, marquerFait } from "../donnees.js";
import { courant } from "../session.js";
import { esc, dateCourte } from "../outils.js";

export async function rendre(conteneur) {
  const moi = courant();
  const zone = document.createElement("div");
  conteneur.append(zone);

  function dessiner() {
    const lignes = [...tours()]
      .sort((a, b) => a.debut.localeCompare(b.debut))
      .map((t) => {
        const binome = t.membres
          .map((id) => `${esc(membre(id).prenom)}${t.fait.includes(id) ? " (fait)" : ""}`)
          .join(" et ");
        const aMoi = t.membres.includes(moi.id);
        const actions = aMoi
          ? `<div class="actions">
               ${t.fait.includes(moi.id) ? "" : `<button data-action="fait" data-tour="${t.id}">Marquer comme fait</button>`}
               <button class="discret" data-action="echanger" data-tour="${t.id}">Proposer un échange</button>
             </div>`
          : "";
        return `<tr><td>Semaine du ${esc(dateCourte(t.debut))}</td><td>${binome}</td><td>${actions}</td></tr>`;
      })
      .join("");
    zone.innerHTML = `
      <h1>Tour d'arrosage</h1>
      <p>Chaque semaine, un binôme arrose les cultures du potager commun.</p>
      <table>
        <thead><tr><th>Semaine</th><th>Binôme</th><th></th></tr></thead>
        <tbody>${lignes}</tbody>
      </table>`;
  }

  zone.addEventListener("click", (e) => {
    const bouton = e.target.closest("[data-action]");
    if (!bouton) return;
    if (bouton.dataset.action === "fait") {
      marquerFait(bouton.dataset.tour, moi.id);
      dessiner();
    }
  });

  dessiner();
}
