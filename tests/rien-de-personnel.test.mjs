// Le dépôt ne connaît ni son auteur, ni son ordinateur, ni l'installation de quelqu'un : le contrôle voit les fuites, et le dépôt n'en a aucune.
// Les essais se font dans des dépôts jetables, avec des mots inventés : aucun vrai mot privé ici.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { trouverFuites, lireMotsPrives } from '../outils/rien-de-personnel.mjs';

const DEPOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const estDepotGit = fs.existsSync(path.join(DEPOT, '.git'));

function depotEssai() {
  const r = fs.mkdtempSync(path.join(os.tmpdir(), 'a-plat-perso-'));
  const git = (...a) => execFileSync('git', ['-c', 'user.name=essai', '-c', 'user.email=essai@exemple.fr', ...a], { cwd: r, stdio: 'pipe' });
  git('init', '-q');
  return { r, git, ecrire: (f, t) => fs.writeFileSync(path.join(r, f), t), fin: () => fs.rmSync(r, { recursive: true, force: true }) };
}

test('ce dépôt ne contient rien de personnel, ni dans ses fichiers ni dans son histoire', { skip: !estDepotGit }, () => {
  assert.deepEqual(trouverFuites(DEPOT, lireMotsPrives(DEPOT)), []);
});

test('un chemin, une adresse privée ou un fichier de suivi cité dans un fichier suivi sont signalés', () => {
  const d = depotEssai();
  try {
    d.ecrire('a.md', 'Voir C:\\Dev\\projet\n');
    d.ecrire('b.js', 'const s = "192.168.1.20";\n');
    d.ecrire('c.md', 'Le serveur machine.ts.net.\n');
    d.ecrire('d.md', 'Ma fiche SUIVI.md.\n');
    d.ecrire('e.md', 'Dans /home/moi/projet.\n');
    d.ecrire('propre.js', "fetch('/users/1'); // version 100.2.3, GitHub\n");
    d.git('add', '-A');
    const f = trouverFuites(d.r).join('\n');
    for (const nom of ['a.md', 'b.js', 'c.md', 'd.md', 'e.md']) assert.match(f, new RegExp(`${nom.replace('.', '\\.')}:1`));
    assert.ok(!f.includes('propre.js'), f);
  } finally { d.fin(); }
});

test('un fichier qui n’est pas suivi par git n’est pas lu', () => {
  const d = depotEssai();
  try {
    d.ecrire('a.md', 'Voir C:\\Users\\moi\n');
    assert.deepEqual(trouverFuites(d.r), []);
  } finally { d.fin(); }
});

test('un mot privé est trouvé jusque dans l’historique, sans être répété dans le résultat', () => {
  const d = depotEssai();
  try {
    d.ecrire('a.md', 'signé Durandal\n');
    d.git('add', '-A');
    d.git('commit', '-qm', 'depart');
    assert.equal(trouverFuites(d.r, []).length, 0, 'sans la liste, ce mot n’est pas connu');
    d.ecrire('a.md', 'signé\n');
    d.git('add', '-A');
    d.git('commit', '-qm', 'retire');
    const f = trouverFuites(d.r, ['durandal']);
    assert.ok(f.some((x) => x.includes('historique')), f.join('\n'));
    assert.ok(!f.join('\n').toLowerCase().includes('durandal'));
  } finally { d.fin(); }
});

test('un mot privé dans un nom de fichier est signalé sans être répété', () => {
  const d = depotEssai();
  try {
    d.ecrire('notes-durandal.md', 'x\n');
    d.git('add', '-A');
    const f = trouverFuites(d.r, ['durandal']);
    assert.ok(f.some((x) => x.startsWith('nom de fichier privé')), f.join('\n'));
    assert.ok(!f.join('\n').toLowerCase().includes('durandal'));
  } finally { d.fin(); }
});

test('un mot entier (=mot) ne trouve pas le mot pris dans un autre', () => {
  const d = depotEssai();
  try {
    d.ecrire('propre.md', 'durandalesque, pré-durandal, durandal-bis\n');
    d.git('add', '-A');
    d.git('commit', '-qm', 'depart');
    assert.deepEqual(trouverFuites(d.r, ['=durandal']), []);
    d.ecrire('a.md', 'signé durandal.\n');
    d.git('add', '-A');
    d.git('commit', '-qm', 'ajout');
    d.ecrire('a.md', 'signé.\n');
    d.git('add', '-A');
    d.git('commit', '-qm', 'retire');
    const f = trouverFuites(d.r, ['=durandal']);
    assert.ok(f.some((x) => x.includes('historique')), f.join('\n'));
    assert.ok(!f.some((x) => x.includes('propre.md')), f.join('\n'));
  } finally { d.fin(); }
});

test('la signature d’un commit est contrôlée', () => {
  const d = depotEssai();
  try {
    d.ecrire('a.md', 'x\n');
    d.git('add', '-A');
    d.git('commit', '-qm', 'depart');
    assert.ok(trouverFuites(d.r, ['essai@exemple.fr']).some((x) => x.includes('signature')));
  } finally { d.fin(); }
});

test('la liste des mots privés saute les commentaires et les lignes vides', () => {
  const r = fs.mkdtempSync(path.join(os.tmpdir(), 'a-plat-liste-'));
  try {
    assert.deepEqual(lireMotsPrives(r), [], 'sans fichier, la liste est vide');
    fs.mkdirSync(path.join(r, '.claude'));
    fs.writeFileSync(path.join(r, '.claude', 'mots-interdits.txt'), '# commentaire\r\n\r\n  durandal  \n=joyeuse\n');
    assert.deepEqual(lireMotsPrives(r), ['durandal', '=joyeuse']);
  } finally { fs.rmSync(r, { recursive: true, force: true }); }
});
