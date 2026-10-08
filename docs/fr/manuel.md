---
title: 'Manuel – installer et utiliser Copydeck dans Adobe Illustrator'
description: 'Manuel de Copydeck : installation, lien vers XML, CSV ou TXT, comparaison et mise à jour des variables de texte, liaisons, copie de l''illustration.'
lang: fr
ref: manual
order: 3
permalink: /fr/manuel/
---

# Manuel de Copydeck

Copydeck lie un fichier `.ai` au fichier de données des variables (XML, CSV ou TXT), montre ce qui a changé et met à jour les textes. L'interface est disponible en français, anglais, italien et allemand : utilisez le menu en haut à droite de la fenêtre.


## 1. Installation

Copiez `Copydeck.jsx` dans le dossier Scripts d'Illustrator :

| Système | Dossier |
| --- | --- |
| Windows | `C:\Program Files\Adobe\Adobe Illustrator <version>\Presets\fr_FR\Scripts\` |
| macOS | `/Applications/Adobe Illustrator <version>/Presets.localized/fr_FR/Scripts/` |

Le dossier de langue dépend de votre Illustrator (`fr_FR`, `en_US`…). Redémarrez Illustrator : le script apparaît dans **Fichier > Scripts > Copydeck**. Sans l'installer, utilisez **Fichier > Scripts > Autre script…** et choisissez le fichier.

### Raccourci clavier

Un raccourci est conseillé, surtout pour la méthode *Choisir sur le plan de travail*.

1. **Fenêtre > Actions**. Créez un nouvel ensemble, puis une nouvelle action.
2. Comme **Touche de fonction**, choisissez une touche libre, par exemple Ctrl+Maj+F12. N'utilisez pas F5–F9 : Illustrator les utilise déjà (F5 = Formes) et elles l'emportent.
3. Cliquez sur **Enregistrer**, puis dans le menu du panneau Actions choisissez **Insérer une commande de menu…**, cliquez sur **Fichier > Scripts > Copydeck** et validez. Arrêtez l'enregistrement.
4. Vérifiez que l'action contient l'étape Copydeck : si elle manque, la touche ne fait rien.

Si après un redémarrage d'Illustrator la touche ne fonctionne plus, l'étape du script a disparu de l'action (cela arrive) : refaites le point 3.

## 2. Premier lancement sur un fichier

- Ouvrez le fichier `.ai` et lancez le script.
- Cliquez sur **Choisir le fichier de données…** et choisissez le fichier des variables.
- Le lien vers le fichier de données est enregistré dans le fichier `.ai` : les fois suivantes, il se recharge tout seul. Si le fichier de données est déplacé, le script le signale et il suffit de le choisir à nouveau.
- Si le fichier contient plusieurs jeux de données, choisissez le bon dans **Jeu de données**.
- À chaque ouverture, le script enregistre automatiquement dans les notes des objets les liens qui n'en ont pas encore (voir la [section 6](#liens)). La barre d'état indique combien il en a enregistré.

### Fichiers de données pris en charge

**XML** – le format « bibliothèque de variables » d'Illustrator (*panneau Variables > Enregistrer la bibliothèque de variables*). `<p>` = paragraphe, `<br/>` = retour à la ligne forcé, `<b>` et `<i>` = gras et italique (si la police possède ces styles).

**CSV ou TXT délimité par tabulations** – comme pour Illustrator et VariableImporter :

| Élément | Signification |
| --- | --- |
| première ligne | noms des variables |
| autres lignes | un jeu de données par ligne |
| `@nom` | variable image (affichée, gérée par Illustrator) |
| `#nom` | variable de visibilité (affichée, gérée par Illustrator) |
| `%nom` | variable de graphe (affichée, gérée par Illustrator) |
| retour à la ligne dans une cellule, ou `\\` | nouveau paragraphe |

Le séparateur (virgule, point-virgule ou tabulation) et l'encodage (UTF-8, UTF-16 « Texte Unicode » d'Excel, Windows-1252) sont détectés automatiquement.

## 3. Lire la comparaison

Onglet **Variables et comparaison**. Chaque ligne est une variable :

| État | Signification |
| --- | --- |
| ● À mettre à jour | le texte du document diffère du fichier |
| ≈ Espaces/retours seulement | seuls des espaces ou des retours diffèrent |
| ≈ Casse seulement | seules les majuscules/minuscules diffèrent |
| ○ Non liée | la variable existe mais aucun objet ne l'utilise |
| + Nouvelle dans le fichier | uniquement dans le fichier : créez-la et liez-la |
| ! Absente du fichier | dans le document mais pas dans le fichier |
| ✓ À jour | identique au fichier |

### Comment il compare

- Seulement le texte. Le gras, l'italique, le soulignement, les couleurs et toute autre mise en forme ne comptent jamais.
- **Ignorer espaces et retours** (activée par défaut) : les lignes « ≈ Espaces/retours seulement » ne sont pas à mettre à jour et *Mettre à jour toutes* les ignore.
- **Ignorer la casse** (désactivée par défaut) : de même pour les lignes « ≈ Casse seulement ».
- Une ligne « ≈ » peut quand même être alignée sur le fichier, une à la fois, avec **Rendre identique au fichier**.

### Utiliser la liste

- **Afficher** filtre par état (aussi *Différences ignorées*) ; **Rechercher** cherche dans le nom et le texte. Plusieurs mots = tous doivent être présents.
- Cliquez sur une ligne : en bas, vous voyez le texte actuel, celui du fichier et la ligne **Va changer** avec la partie qui sera modifiée.
- La colonne **Dernière mise à jour depuis** indique depuis quel fichier et quand la variable a été mise à jour pour la dernière fois.
- Double-clic sur une ligne : Illustrator va à l'objet et le sélectionne.

## 4. Mettre à jour

| Pour mettre à jour | Faites ceci |
| --- | --- |
| une variable | sélectionnez la ligne > **Mettre à jour celle-ci** |
| plusieurs variables | Ctrl/Cmd+clic ou Maj+clic sur les lignes > **Mettre à jour les lignes sélectionnées** |
| toutes les variables | **Mettre à jour toutes les variables à mettre à jour** (seulement les « ● À mettre à jour ») |
| revenir en arrière | **Annuler la dernière mise à jour** |

### Comment il met à jour

- Seuls les mots différents changent : le gras et les styles du reste du texte restent tels quels.
- Avec *Ignorer espaces et retours* activée, vos retours à la ligne et espaces manuels restent en place. Exemple : document « FARINE⏎de blé (71 %) », fichier « FARINE de blé (70 %) » → devient « FARINE⏎de blé (70 %) ».
- **Rendre identique au fichier** et les valeurs avec `<b>`/`<i>` dans le XML copient en revanche exactement le texte du fichier, retours compris.
- Si une variable est liée à plusieurs objets, tous sont mis à jour.
- Les objets verrouillés, ou sur des calques verrouillés ou masqués, sont mis à jour quand même.

**Important :** les modifications sont déjà dans le document. Enregistrez le fichier `.ai`.

## 5. Lier une variable à un texte

### Automatique : Association automatique…

Disponible dans l'onglet Variables et dans l'onglet Objets texte. Propose dans une liste :

- **Lier** – objets non liés dont le texte correspond à la valeur d'une variable du fichier.
- **Copie en plus** – objets ayant le même texte qu'une variable déjà liée ailleurs.
- **Rétablir** – objets liés seulement par leurs notes (par exemple après les avoir collés depuis un autre fichier) : les lie aussi dans le panneau Variables d'Illustrator.

Seules les lignes sûres sont présélectionnées. Les lignes douteuses (même valeur pour plusieurs variables, valeurs très courtes, copies en plus) sont listées mais pas sélectionnées : la colonne **Remarque** explique pourquoi. Vérifiez, ajoutez ou retirez des lignes avec Ctrl/Cmd+clic, puis cliquez sur **Lier la sélection**. Double-cliquez sur une ligne pour voir l'objet.

### À la main

La fenêtre bloque Illustrator tant qu'elle est ouverte. Il y a trois façons :

**A) Choisir sur le plan de travail** (la plus pratique) : sélectionnez la variable > **Choisir sur le plan de travail…** > la fenêtre se ferme > cliquez sur le texte dans le plan de travail > relancez le script avec le raccourci. Le lien se termine tout seul et la fenêtre se rouvre au même endroit.

**B) Sélectionner avant d'ouvrir** : sélectionnez le texte dans Illustrator > lancez le script > choisissez la variable > **Lier aux objets sélectionnés**.

**C) Depuis la liste** (onglet **Objets texte**) : les objets texte à gauche, les variables à droite, chacun avec sa propre recherche.

1. Cherchez et choisissez l'objet (double-clic pour le voir).
2. Cherchez et choisissez la variable.
3. Cliquez sur **Lier l'objet et la variable**.

L'étoile ★ signale les paires probables (texte de l'objet identique à la valeur de la variable dans le fichier) ; les lignes avec ★ passent en tête. La liste des objets affiche au maximum 200 lignes : s'il y en a plus, tapez dans la recherche pour affiner.

### Autres actions

- **Délier** – supprime le lien (et la ligne dans les notes).
- **Créer la variable** – pour les lignes « Nouvelle dans le fichier ».
- **Nouvelle variable à partir de ce texte…** – dans l'onglet Objets texte.
- **Supprimer la variable** – la retire du document (le texte reste).

## 6. Comment les liens sont enregistrés {#liens}

Un objet peut être lié de deux façons, et le script lit les deux :

- **Lien d'Illustrator** – celui du panneau Variables. Une variable n'en a qu'un ; il ne suit pas l'objet si vous le copiez dans un autre fichier.
- **La ligne `VAR:nomvariable` dans les notes de l'objet** (panneau Options d'objet / Attributs) – écrite par le script, elle voyage avec l'objet quand vous le copiez. Ne la supprimez pas et ne la modifiez pas à la main.

Si un objet a les deux et qu'ils indiquent des variables différentes, c'est le lien d'Illustrator qui l'emporte.

La ligne est écrite dans les notes :

- quand vous liez un objet avec le script ;
- à chaque ouverture du script, pour les liens qui ne l'ont pas encore (créés dans le panneau Variables ou avec des versions précédentes) ;
- pour une même variable sur plusieurs objets : le premier utilise le lien d'Illustrator, les autres seulement la ligne dans les notes.

### Copier l'illustration

**Dans le même fichier** : la copie reste liée à la même variable et est mise à jour avec l'original. Si une copie ne doit plus suivre la variable, sélectionnez-la et cliquez sur **Délier**.

**Dans un autre fichier** :

1. Dans le fichier de départ, ouvrez le script (il enregistre les notes manquantes), fermez-le et enregistrez le fichier `.ai`.
2. Copiez et collez l'illustration dans le nouveau fichier.
3. Dans le nouveau fichier, ouvrez le script : les objets sont déjà liés. Choisissez le fichier de données et cliquez sur **Association automatique…** : les lignes *Rétablir* recréent aussi les liens dans le panneau Variables.

### Options

Dans l'onglet Objets texte, en bas à droite :

- **Lier aussi dans le panneau Variables** – si désactivée, les nouveaux liens sont seulement dans les notes. Le script fonctionne de la même façon, mais le panneau Variables d'Illustrator ne les voit pas.
- **Mémoriser dans les notes (pour copier)** – si désactivée, le script n'écrit plus de notes, ni pour les nouveaux liens ni à l'ouverture ; celles déjà écrites restent.

## 7. À savoir

| Quoi | Où c'est enregistré |
| --- | --- |
| lien vers le fichier de données, historique | dans le fichier `.ai` (métadonnées XMP) |
| liens des objets | panneau Variables et notes des objets |
| options et langue | préférences d'Illustrator sur cet ordinateur |

- Dans le panneau Variables d'Illustrator, le jeu de données peut apparaître comme « modifié » : c'est normal, le script écrit directement dans les textes.
- Si Illustrator reste occupé un moment après la fermeture du script, après de nombreux liens, essayez de fermer le panneau Variables avant d'utiliser le script. Si cela ne suffit pas, désactivez *Lier aussi dans le panneau Variables*.
- En cas d'erreur, notez le message et le numéro de ligne et [ouvrez un ticket sur GitHub]({{ site.repository_url }}/issues).
