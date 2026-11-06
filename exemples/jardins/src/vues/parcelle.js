import { parcelle, membre } from "../donnees.js";
import { esc } from "../outils.js";

export async function rendre(conteneur, { id }) {
  const p = parcelle(id);
  if (!p) {
    conteneur.innerHTML = `
      <h1>Parcelle introuvable</h1>
      <p>Cette parcelle n'existe pas. <a href="#/parcelles">Retour à la liste des parcelles</a></p>`;
    return;
  }
  const titulaire = p.titulaire ? membre(p.titulaire) : null;
  conteneur.innerHTML = `
    <p><a href="#/parcelles">← Toutes les parcelles</a></p>
    <h1>Parcelle ${esc(p.id.toUpperCase())}</h1>
    <table>
      <tr><th>Secteur</th><td>${esc(p.secteur)}</td></tr>
      <tr><th>Surface</th><td>${p.surface} m²</td></tr>
      <tr><th>Exposition</th><td>${esc(p.exposition)}</td></tr>
      <tr><th>Point d'eau</th><td>${p.pointEau ? "à moins de 10 mètres" : "à partager avec la parcelle voisine"}</td></tr>
      <tr><th>Titulaire</th><td>${titulaire ? `${esc(titulaire.prenom)}, depuis ${p.depuis}` : "<strong>Libre</strong>"}</td></tr>
    </table>
    ${p.titulaire ? "" : `<p class="message">Cette parcelle est libre. <a href="#/attente">Inscrivez-vous sur la liste d'attente</a>.</p>`}
    <p><a href="#/parcelles/${esc(p.id)}/historique">Voir l'historique de cette parcelle</a></p>`;
}
