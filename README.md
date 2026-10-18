# ThunderTruck

🇫🇷 [Français](#français) · 🇬🇧 [English](#english)

---

## Français

### Le jeu

**ThunderTruck** est un jeu d'action en p5.js : tu conduis un camion blindé sur une autoroute qui défile. Tu ne peux pas accélérer ni tourner : tu choisis seulement **sur quelle voie te placer**, **où pointer la tourelle** et **quelle arme dépenser**. Il faut livrer le chargement : si le cargo ou la cabine sont détruits, la partie est perdue.

C'est une **réécriture** inspirée d'*Asphalt* (Ubi Soft, Amstrad CPC, 1987). Ce n'est pas un portage : le programme d'origine n'est pas utilisé. Les mécaniques sont inspirées du jeu, pas ses images.

### Comment jouer

- Le camion reste au centre, c'est la route qui défile. Tu déplaces le camion **en haut / en bas** sur la route.
- La **tourelle** est indépendante du camion et vise séparément.
- **Trois armes** aux munitions limitées : mitrailleuse (MG), lance-flammes (sur les côtés de la cabine, pour les ennemis qui te collent) et mines (larguées derrière).
- Des **caisses** apparaissent sur la route : munitions, réparation, vie.
- Un schéma du camion en haut à gauche clignote quand une pièce est touchée : **cargo**, **cabine**, **pneus**.
- Les ennemis arrivent par vagues : motos, voitures, side-cars. Les débuts de partie sont volontairement calmes (un ennemi à la fois, au ralenti) pour apprendre.

#### Commandes

| Action | Clavier / souris | Tactile |
|---|---|---|
| Monter / descendre | `↑` `↓` ou `Z` `S` | bande à gauche de l'écran |
| Viser la tourelle | souris | joystick à droite |
| Tirer | `Espace` | bouton de tir |
| Changer d'arme | `X`, ou `1` `2` `3` | bouton d'arme |
| Recommencer | `R` | — |

`Espace` lance aussi la partie depuis l'écran de titre.

### Lancer le jeu

Le jeu charge des images et des fichiers JSON : il faut donc le servir par un petit serveur local. Ouvrir `index.html` en double-cliquant (adresse `file://`) laisse l'écran vide.

```bash
cd ThunderTruck
python3 -m http.server 8765
```

Puis ouvre <http://127.0.0.1:8765/> dans ton navigateur. Une connexion internet est nécessaire : la bibliothèque [p5.js](https://p5js.org/) est chargée depuis un CDN. Après une mise à jour des images, fais un rechargement forcé (`Cmd+Maj+R` sur Mac, `Ctrl+Maj+R` ailleurs).

### Structure du projet

- `index.html` : page de lancement.
- `sketch.js` : tout le jeu.
- `assets/` : sprites et loader (atlas `road_atlas`, décor `road_extras`, `loader.png`).

### Inspirations et style

- Le jeu *Asphalt* (Ubi Soft, 1987, Amstrad CPC) pour les mécaniques : camion fixe au centre, tourelle séparée, munitions rares, schéma de dégâts par pièce.
- Le style visuel imite l'Amstrad CPC : couleurs matérielles (composantes 0 / 128 / 255, 16 couleurs au maximum), sans transparence ni lissage, avec tramage et gros pixels.
- Les chiffres qui viennent de la machine d'origine sont documentés avec leur adresse mémoire ; tout le reste est un choix propre à ThunderTruck.

### Crédits

Idée et direction : Olivier Bordereau. Code et graphismes réalisés avec des assistants IA (Grok Bot et ses agents). *Asphalt* appartient à ses ayants droit. L'image disque d'origine n'est pas incluse dans ce dépôt.

---

## English

### The game

**ThunderTruck** is an action game built with p5.js: you drive an armoured truck along a scrolling highway. You can't accelerate or steer. You only choose **which lane to sit in**, **where to aim the turret** and **which weapon to spend**. You must deliver the cargo: if the cargo or the cab is destroyed, the run is over.

It is a **rewrite** inspired by *Asphalt* (Ubi Soft, Amstrad CPC, 1987), not a port: the original program is not used. The mechanics are inspired by the original, its bitmaps are not.

### How to play

- The truck stays in the middle and the road scrolls. You move the truck **up and down** on the road.
- The **turret** is independent of the truck and aims separately.
- **Three weapons** with limited ammo: machine gun (MG), flamethrowers (on the sides of the cab, for enemies hugging you) and mines (dropped behind).
- **Crates** appear on the road: ammo, repair, extra life.
- A truck diagram in the top-left corner flashes when a part is hit: **cargo**, **cab**, **tires**.
- Enemies come in waves: bikes, cars and sidecars. The start of a run is deliberately gentle (one enemy at a time, at half speed) so you can learn.

#### Controls

| Action | Keyboard / mouse | Touch |
|---|---|---|
| Move up / down | `↑` `↓` or `Z` `S` | strip on the left of the screen |
| Aim turret | mouse | joystick on the right |
| Fire | `Space` | fire button |
| Switch weapon | `X`, or `1` `2` `3` | weapon button |
| Restart | `R` | — |

`Space` also starts the game from the title screen.

### Running the game

The game loads images and JSON files, so it must be served by a small local web server. Opening `index.html` by double-clicking it (a `file://` address) leaves the screen blank.

```bash
cd ThunderTruck
python3 -m http.server 8765
```

Then open <http://127.0.0.1:8765/> in your browser. An internet connection is required: the [p5.js](https://p5js.org/) library is loaded from a CDN. After updating the images, do a hard refresh (`Cmd+Shift+R` on Mac, `Ctrl+Shift+R` elsewhere).

### Project layout

- `index.html`: the launch page.
- `sketch.js`: the whole game.
- `assets/`: sprites and loader (`road_atlas` atlas, `road_extras` scenery, `loader.png`).

### Inspirations and style

- *Asphalt* (Ubi Soft, 1987, Amstrad CPC) for the mechanics: fixed centred truck, separate turret, scarce ammo, per-part damage diagram.
- The visual style imitates the Amstrad CPC: hardware colours (components 0 / 128 / 255, 16 colours at most), no transparency or smoothing, with dithering and chunky pixels.
- Numbers that come from the original machine are documented with their memory address; everything else is a ThunderTruck design choice.

### Credits

Idea and direction: Olivier Bordereau. Code and art made with AI assistants (Grok Bot and its agents). *Asphalt* belongs to its rights holders. The original disk image is not included in this repository.
