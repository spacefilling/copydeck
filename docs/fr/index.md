---
title: 'Mettre à jour les variables de texte d''Illustrator depuis XML, CSV et TXT'
description: 'Script gratuit pour Adobe Illustrator : comparez les variables de texte avec un copy deck XML, CSV ou TXT et mettez-les à jour sans perdre la mise en forme.'
lang: fr
ref: home
order: 3
permalink: /fr/
image: /assets/social-preview.png
faq:
  - q: 'Comment mettre à jour les variables de texte d''Illustrator depuis un fichier CSV ou XML ?'
    a: 'Lancez Copydeck, choisissez le fichier de données et ouvrez l''onglet « Variables et comparaison ». Chaque variable dont le texte diffère du fichier est marquée « À mettre à jour ». Mettez-les à jour une par une ou toutes ensemble ; seuls les mots modifiés sont remplacés.'
  - q: 'Copydeck fonctionne-t-il avec le panneau Variables et les jeux de données d''Illustrator ?'
    a: 'Oui. Copydeck lit et écrit les mêmes variables que celles du panneau Variables et charge la bibliothèque de variables XML enregistrée par Illustrator. Il ajoute une comparaison claire et des mises à jour plus sûres.'
  - q: 'Une variable peut-elle être liée à plusieurs objets texte ?'
    a: 'Oui. Le premier objet utilise le lien d''Illustrator, les autres sont liés par Copydeck grâce à la ligne « VAR:nom » dans les notes de l''objet. Tous sont mis à jour ensemble.'
  - q: 'La mise à jour supprime-t-elle le gras, les couleurs ou les retours à la ligne manuels ?'
    a: 'Non. Copydeck ne remplace que les mots qui diffèrent : la mise en forme du reste du texte est conservée. Avec « Ignorer espaces et retours » activé, vos retours à la ligne manuels restent en place.'
  - q: 'Quel format CSV Copydeck lit-il ?'
    a: 'Le même que la fusion de données d''Illustrator. La première ligne contient les noms des variables, chaque ligne suivante est un jeu de données. Les colonnes commençant par @, # ou % sont des variables image, visibilité et graphe. Les séparateurs (virgule, point-virgule, tabulation) et les encodages (UTF-8, UTF-16, Windows-1252) sont détectés automatiquement.'
  - q: 'Avec quelles versions d''Illustrator fonctionne-t-il ?'
    a: 'Copydeck est un script ExtendScript (.jsx) qui fonctionne avec Illustrator pour Windows et macOS prenant en charge les scripts. Il a été écrit pour Illustrator 2025 ; les retours sur d''autres versions sont les bienvenus sur GitHub.'
  - q: 'Copydeck est-il gratuit ?'
    a: 'Oui. Copydeck est gratuit et open source, sous licence GNU GPL v3. Vous pouvez l''utiliser pour tout travail, même rémunéré ; les versions modifiées ne peuvent être diffusées que sous la même licence, avec leur code source.'
---

# Copydeck pour Adobe Illustrator

<p class="lead">Gardez votre illustration Illustrator synchronisée avec son copy deck. Comparez les variables de texte avec un fichier XML, CSV ou TXT, voyez exactement ce qui a changé et mettez à jour les textes sans perdre la mise en forme.</p>

{% include download.html %}

![Copydeck : comparer et mettre à jour les variables de texte d'Adobe Illustrator depuis un fichier de données]({{ '/assets/social-preview.png' | relative_url }})

## Qu'est-ce que Copydeck ?

Le *copy deck* est le document qui rassemble tous les textes d'un emballage, d'une étiquette ou d'une campagne : nom du produit, ingrédients, tableau nutritionnel, allergènes, mentions légales, allégations. Copydeck relie ce document, enregistré en XML, CSV ou TXT, à votre illustration Illustrator grâce aux **variables d'Illustrator**, et vous indique quels textes du plan de travail ne sont plus à jour.

Le panneau Variables et la fusion de données d'Illustrator importent les données, mais ils ne montrent pas ce qui a changé, ils lient chaque variable à un seul objet et, en appliquant un jeu de données, ils réécrivent tout le texte et sa mise en forme. Copydeck utilise les mêmes variables d'Illustrator et y ajoute une méthode de travail claire et sûre.

## Fonctions

- **Vue de comparaison** : l'état de chaque variable (à mettre à jour, à jour, non liée, nouvelle dans le fichier, absente du fichier), le texte du document, celui du fichier et la partie exacte qui va changer.
- **Mises à jour qui respectent la mise en forme** : seuls les mots différents sont remplacés. Le gras, les couleurs, les styles de caractère et, si vous le souhaitez, les espaces et retours manuels sont conservés.
- **Ignorer ce qui ne compte pas** : les différences d'espaces et de retours (et, en option, de casse) ne comptent pas comme des modifications. La mise en forme ne compte jamais.
- **Mettre à jour une, plusieurs ou toutes les variables**, avec annulation de la dernière mise à jour.
- **Mémoire de la source** : le fichier de données lié et, pour chaque variable, le fichier et le jeu de données de la dernière mise à jour sont enregistrés dans le fichier `.ai`.
- **Outils de liaison** : listes d'objets texte et de variables avec recherche, choix sur le plan de travail, liaison de la sélection, création d'une variable à partir d'un texte.
- **Association automatique** : propose de lier les objets dont le texte correspond déjà à la valeur d'une variable ; les cas douteux sont listés mais pas présélectionnés.
- **Une variable sur plusieurs objets**, et des liens conservés même après copier-coller dans un autre document.
- **XML, CSV et TXT** dans les formats utilisés par Illustrator et par VariableImporter.
- **Interface en français, anglais, italien, allemand et espagnol.**

## Pour qui ?

- **Les graphistes packaging et étiquettes** qui mettent à jour ingrédients, valeurs nutritionnelles, allergènes, poids nets et mentions légales sur de nombreuses références.
- **Les agences et studios** qui reçoivent le copy deck du client et doivent vérifier chaque texte dans l'illustration.
- **Catalogues, tarifs et graphiques pilotés par les données** réalisés avec la fusion de données d'Illustrator.
- **Les emballages multilingues**, avec un jeu de données par langue ou par marché.

## Comment ça marche

1. Ouvrez votre fichier `.ai` et lancez **Copydeck** (Fichier > Scripts > Copydeck).
2. Cliquez sur **Choisir le fichier de données…** et sélectionnez votre XML, CSV ou TXT. Le lien est enregistré dans le fichier `.ai`.
3. Vérifiez les lignes **● À mettre à jour** : en dessous, vous voyez le texte actuel, le nouveau texte et ce qui va changer.
4. Cliquez sur **Mettre à jour celle-ci** ou **Mettre à jour toutes les variables à mettre à jour**, puis enregistrez le fichier `.ai`.

Les nouvelles variables se lient avec **Association automatique…**, en choisissant l'objet sur le plan de travail ou depuis l'onglet **Objets texte**. Toutes les options sont décrites dans le [manuel]({{ '/fr/manuel/' | relative_url }}).

## Copydeck et le panneau Variables d'Illustrator

| | Panneau Variables d'Illustrator | Copydeck |
| --- | --- | --- |
| Voir quels textes diffèrent des données | Non | Oui, avec la modification exacte |
| Mettre à jour une seule variable | Seulement en changeant de jeu de données | Oui |
| Conserver la mise en forme des mots inchangés | Non | Oui |
| Ignorer les différences d'espaces et de retours | Non | Oui |
| Une variable sur plusieurs objets | Non | Oui |
| Mémoriser le fichier source et l'historique | Non | Oui, dans le fichier `.ai` |
| Conserver les liens en copiant l'illustration dans un autre fichier | Non | Oui, grâce aux notes de l'objet |

## Fichiers de données

**XML** : la bibliothèque de variables qu'Illustrator enregistre depuis le panneau Variables. `<p>` devient un paragraphe, `<br/>` un retour à la ligne forcé, `<b>` et `<i>` du gras et de l'italique.

**CSV et TXT** : la première ligne contient les noms des variables, chaque ligne suivante est un jeu de données.

```csv
product_name,net_weight,ingredients,@photo,#show_badge
Tomato soup,500 g,"Tomatoes 85%, water, olive oil, salt",/images/tomato.jpg,TRUE
Pea soup,400 g,"Peas 70%, water, CELERY, salt",/images/pea.jpg,FALSE
```

Des fichiers d'exemple se trouvent dans le [dossier examples sur GitHub]({{ site.repository_url }}/tree/main/examples).

## Installation

Téléchargez `Copydeck.jsx` et copiez-le dans le dossier Scripts d'Illustrator (`Presets/<langue>/Scripts`), puis redémarrez Illustrator. Vous pouvez aussi le lancer une fois avec **Fichier > Scripts > Autre script…**. Le [manuel]({{ '/fr/manuel/' | relative_url }}) explique comment lui attribuer un raccourci clavier.

{% include faq.html %}
