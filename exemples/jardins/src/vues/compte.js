import { parcelles, reservations, outil, tours, membre } from "../donnees.js";
import { courant } from "../session.js";
import { CONFIG } from "../config.js";
import { esc, dateLongue, dateCourte, aujourdhui, CRENEAUX } from "../outils.js";

export async function rendre(conteneur) {
  const moi = courant();
  const jour = aujourdhui();
  const mesParcelles = parcelles().filter((p) => p.titulaire === moi.id);
  const mesTours = tours().filter((t) => t.membres.includes(moi.id) && t.debut >= jour);
  const mesReservations = reservations().filter((r) => r.membreId === moi.id && r.date >= jour);
  const cotisation = membre(moi.id).cotisation;

  conteneur.innerHTML = `
    <h1>Mon compte</h1>
    <p>${esc(moi.prenom)}${moi.fonction ? `, ${esc(moi.fonction)} de l'association` : ""}. Rôle : ${esc(moi.role)}.</p>
    <section class="carte">
      <h2>Mes parcelles</h2>
      ${
        mesParcelles.length
          ? `<ul>${mesParcelles
              .map((p) => `<li><a href="#/parcelles/${esc(p.id)}">${esc(p.id.toUpperCase())}</a> · ${esc(p.secteur)}, ${p.surface} m²</li>`)
              .join("")}</ul>`
          : "<p>Vous n'avez pas encore de parcelle. <a href=\"#/attente\">Voir la liste d'attente</a>.</p>"
      }
    </section>
    <section class="carte">
      <h2>Mes tours d'arrosage</h2>
      ${
        mesTours.length
          ? `<ul>${mesTours.map((t) => `<li>Semaine du ${esc(dateCourte(t.debut))}</li>`).join("")}</ul>`
          : "<p>Aucun tour d'arrosage ne vous est attribué.</p>"
      }
    </section>
    <section class="carte">
      <h2>Mes réservations d'outils</h2>
      ${
        mesReservations.length
          ? `<ul>${mesReservations
              .map((r) => `<li>${esc(outil(r.outilId).nom)}, ${esc(dateLongue(r.date))}, ${esc(CRENEAUX[r.creneau])}</li>`)
              .join("")}</ul>`
          : "<p>Aucune réservation en cours.</p>"
      }
    </section>
    <section class="carte">
      <h2>Cotisation ${CONFIG.saison}</h2>
      <p>${cotisation === "payee" ? "Réglée, merci." : `À régler : ${CONFIG.cotisation} €, auprès du trésorier à la permanence du samedi.`}</p>
    </section>`;
}
