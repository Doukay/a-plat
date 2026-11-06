import { outils, outil, reservations, reserver, membre } from "../donnees.js";
import { courant } from "../session.js";
import { esc, dateLongue, aujourdhui, CRENEAUX } from "../outils.js";

export async function rendre(conteneur) {
  const moi = courant();
  const jour = aujourdhui();

  function liste() {
    const a_venir = [...reservations()]
      .filter((r) => r.date >= jour)
      .sort((a, b) => a.date.localeCompare(b.date) || a.creneau.localeCompare(b.creneau));
    if (a_venir.length === 0) return "<p>Aucune réservation à venir.</p>";
    return `<table>
      <thead><tr><th>Date</th><th>Créneau</th><th>Outil</th><th>Réservé par</th></tr></thead>
      <tbody>${a_venir
        .map(
          (r) => `<tr><td>${esc(dateLongue(r.date))}</td><td>${esc(CRENEAUX[r.creneau])}</td>
            <td>${esc(outil(r.outilId).nom)}</td><td>${esc(membre(r.membreId).prenom)}</td></tr>`
        )
        .join("")}</tbody></table>`;
  }

  conteneur.innerHTML = `
    <h1>Cabane à outils</h1>
    <p>Réservez un outil pour une demi-journée. Deux réservations en cours au plus par personne.</p>
    <section class="carte">
      <h2>Réserver</h2>
      <form id="form-reservation">
        <label for="outil">Outil</label>
        <select id="outil" name="outil">
          ${outils().map((o) => `<option value="${o.id}">${esc(o.nom)} : ${esc(o.note)}</option>`).join("")}
        </select>
        <label for="date">Date</label>
        <input id="date" name="date" type="date" min="${jour}" required>
        <label for="creneau">Créneau</label>
        <select id="creneau" name="creneau">
          ${Object.entries(CRENEAUX).map(([cle, texte]) => `<option value="${cle}">${esc(texte)}</option>`).join("")}
        </select>
        <p><button type="submit">Réserver</button></p>
      </form>
      <div id="retour" role="status"></div>
    </section>
    <h2>Réservations à venir</h2>
    <div id="liste">${liste()}</div>`;

  const retour = conteneur.querySelector("#retour");
  conteneur.querySelector("#form-reservation").addEventListener("submit", (e) => {
    e.preventDefault();
    const champs = new FormData(e.target);
    const resultat = reserver(
      { outilId: champs.get("outil"), date: champs.get("date"), creneau: champs.get("creneau"), membreId: moi.id },
      jour
    );
    retour.className = resultat.ok ? "message" : "message erreur";
    retour.textContent = resultat.ok ? "Réservation enregistrée." : resultat.raison;
    conteneur.querySelector("#liste").innerHTML = liste();
  });
}
