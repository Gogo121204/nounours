

# Nounours & Licornes 🐻🦄

https://gogo121204.github.io/nounours/

## Mettre le jeu en ligne (GitHub Pages, gratuit, ~3 min)

1. Sur github.com (compte `ghumeau04`), crée un nouveau dépôt **public**, par exemple `nounours`.
2. Clique sur **Add file → Upload files** et glisse **tout le contenu** du dossier (le fichier `index.html` et le dossier `js/`). Valide avec **Commit changes**.
3. Va dans **Settings → Pages**. Dans « Branch », choisis `main` puis `/ (root)` et clique sur **Save**.
4. Après 1 à 2 minutes, le jeu est disponible à l'adresse : `https://ghumeau04.github.io/nounours/`

## Jouer

1. Les deux joueurs ouvrent le lien dans Chrome, Edge ou Firefox.
2. Le premier tape son prénom, choisit son nounours et clique sur **Créer une partie**. Un code de 4 lettres s'affiche.
3. Le second tape son prénom, entre le code, puis clique sur **Rejoindre**.

La progression, la boutique et la collection sont sauvegardées dans le navigateur de chacun. La progression des niveaux qui fait foi est celle de la personne qui crée la partie : c'est donc mieux que ce soit toujours la même.

## Commandes

| Action | Touches |
|---|---|
| Se déplacer | Flèches ou Q / D |
| Sauter | ↑, Z ou Espace |
| Actionner un levier | ↓ ou S |
| Émotes | 1 ❤️ · 2 Attends-moi ! · 3 Vite !! · 4 😈 · 5 🤪 · 6 😡 · 7 😞 |
| Musique on/off | M |
| Retour à la carte | Échap |

## Si la connexion ne passe pas

Le jeu relie les deux PC directement (WebRTC, via PeerJS). Ça marche sur la plupart des box. Sur certains réseaux très verrouillés (réseau d'école ou d'entreprise, partage de connexion 4G), ça peut bloquer. Dans ce cas, réessayez depuis une box à la maison.

## Tester seul sur un PC

Ouvre deux onglets :
- `…/index.html?net=bc&auto=host&code=TEST&role=pink`
- `…/index.html?net=bc&auto=join&code=TEST`
