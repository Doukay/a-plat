import { parcelles, attente, actualites, tours } from "../donnees.js";
import { courant } from "../session.js";
import { esc, dateCourte, dateLongue, aujourdhui } from "../outils.js";

export async function rendre(conteneur) {
  const moi = courant();
  const libres = parcelles().filter((p) => !p.titulaire).length;
  const nouvelles = [...actualites()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 2);

  let arrosage = "";
  if (moi) {
    const prochain = tours()
      .filter((t) => t.debut >= aujourdhui() && t.membres.includes(moi.id))
      .sort((a, b) => a.debut.localeCompare(b.debut))[0];
    arrosage = prochain
      ? `<section class="carte"><h2>Votre prochain arrosage</h2>
           <p>Semaine du ${esc(dateCourte(prochain.debut))}. Un rappel vous sera envoyé par courriel la veille de votre tour.</p></section>`
      : `<section class="carte"><h2>Votre prochain arrosage</h2><p>Aucun tour ne vous est attribué pour le moment.</p></section>`;
  }

  conteneur.innerHTML = `
    <h1>Les Jardins de la Grelinette</h1>
    <p>Bienvenue sur le site de l'association. Ici, on retrouve les parcelles, le tour d'arrosage,
       la cabane à outils et les nouvelles du bureau.</p>
    ${moi ? "" : `<p class="message">Pour réserver un outil ou voir le tour d'arrosage, <a href="#/connexion">connectez-vous</a>.</p>`}
    ${arrosage}
    <section class="carte">
      <h2>Les parcelles</h2>
      <p>${libres} parcelle(s) libre(s) sur ${parcelles().length}. <a href="#/parcelles">Voir les parcelles</a></p>
      <p>${attente().length} personne(s) attendent une parcelle. <a href="#/attente">Voir la liste d'attente</a></p>
    </section>
    <section class="carte">
      <h2>Dernières nouvelles du bureau</h2>
      ${nouvelles
        .map((a) => `<article><h3>${esc(a.titre)}</h3><p><small>${esc(dateLongue(a.date))}</small></p><p>${esc(a.texte)}</p></article>`)
        .join("")}
      <p><a href="#/actualites">Toutes les actualités</a></p>
    </section>`;
}
