import { connecter } from "../session.js";

export async function rendre(conteneur) {
  conteneur.innerHTML = `
    <h1>Connexion</h1>
    <p>Votre prénom et le code personnel remis par le bureau.</p>
    <form id="form-connexion">
      <label for="prenom">Prénom</label>
      <input id="prenom" name="prenom" autocomplete="username" required>
      <label for="code">Code personnel</label>
      <input id="code" name="code" type="password" autocomplete="current-password" required>
      <p><button type="submit">Se connecter</button></p>
    </form>
    <p><a href="#/code-oublie">Code oublié ?</a></p>`;

  conteneur.querySelector("#form-connexion").addEventListener("submit", (e) => {
    e.preventDefault();
    const champs = new FormData(e.target);
    const membre = connecter(champs.get("prenom"), champs.get("code"));
    if (membre) {
      location.hash = "#/";
    }
  });
}
