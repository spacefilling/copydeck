---
title: 'Illustrator-Textvariablen aus XML, CSV und TXT aktualisieren'
description: 'Kostenloses Skript für Adobe Illustrator: Textvariablen mit einem Copy Deck als XML, CSV oder TXT vergleichen und ohne Formatverlust aktualisieren.'
lang: de
ref: home
order: 4
permalink: /de/
image: /assets/social-preview.png
faq:
  - q: 'Wie aktualisiere ich Textvariablen in Illustrator aus einer CSV- oder XML-Datei?'
    a: 'Starten Sie Copydeck, wählen Sie die Datendatei und öffnen Sie das Register „Variablen und Vergleich“. Jede Variable, deren Text von der Datei abweicht, ist als „Zu aktualisieren“ markiert. Aktualisieren Sie sie einzeln oder alle zusammen; nur die geänderten Wörter werden ersetzt.'
  - q: 'Funktioniert Copydeck mit dem Variablen-Bedienfeld und den Datensätzen von Illustrator?'
    a: 'Ja. Copydeck liest und schreibt dieselben Variablen wie das Variablen-Bedienfeld und lädt die von Illustrator gespeicherte XML-Variablenbibliothek. Dazu kommen ein klarer Vergleich und sicherere Aktualisierungen.'
  - q: 'Kann eine Variable mit mehreren Textobjekten verknüpft werden?'
    a: 'Ja. Das erste Objekt nutzt die Illustrator-Verknüpfung, die übrigen verknüpft Copydeck über die Zeile „VAR:name“ in der Notiz des Objekts. Alle werden zusammen aktualisiert.'
  - q: 'Entfernt das Aktualisieren Fettschrift, Farben oder manuelle Zeilenumbrüche?'
    a: 'Nein. Copydeck ersetzt nur die abweichenden Wörter, die Formatierung des übrigen Textes bleibt erhalten. Mit „Leerzeichen und Umbrüche ignorieren“ bleiben auch Ihre manuellen Umbrüche an ihrer Stelle.'
  - q: 'Welches CSV-Format liest Copydeck?'
    a: 'Dasselbe wie die Datenzusammenführung von Illustrator. Die erste Zeile enthält die Variablennamen, jede weitere Zeile ist ein Datensatz. Spalten, die mit @, # oder % beginnen, sind Bild-, Sichtbarkeits- und Diagrammvariablen. Trennzeichen (Komma, Semikolon, Tabulator) und Kodierungen (UTF-8, UTF-16, Windows-1252) werden automatisch erkannt.'
  - q: 'Mit welchen Illustrator-Versionen funktioniert es?'
    a: 'Copydeck ist ein ExtendScript-Skript (.jsx) und läuft mit Illustrator für Windows und macOS mit Skriptunterstützung. Es wurde für Illustrator 2025 geschrieben; Rückmeldungen zu anderen Versionen sind auf GitHub willkommen.'
  - q: 'Ist Copydeck kostenlos?'
    a: 'Ja. Copydeck ist kostenlos und Open Source unter der GNU GPL v3. Sie können es für jede Arbeit nutzen, auch bezahlte; veränderte Versionen dürfen nur unter derselben Lizenz und mit Quellcode weitergegeben werden.'
---

# Copydeck für Adobe Illustrator

<p class="lead">Halten Sie Ihr Illustrator-Bildmaterial mit dem Copy Deck synchron. Vergleichen Sie Textvariablen mit einer XML-, CSV- oder TXT-Datei, sehen Sie genau, was sich geändert hat, und aktualisieren Sie die Texte, ohne die Formatierung zu verlieren.</p>

{% include download.html %}

![Copydeck: Textvariablen in Adobe Illustrator aus einer Datendatei vergleichen und aktualisieren]({{ '/assets/social-preview.png' | relative_url }})

## Was ist Copydeck?

Das *Copy Deck* ist das Dokument mit allen Texten einer Verpackung, eines Etiketts oder einer Kampagne: Produktname, Zutaten, Nährwerttabelle, Allergene, Pflichtangaben, Claims. Copydeck verbindet dieses Dokument, gespeichert als XML, CSV oder TXT, über **Illustrator-Variablen** mit Ihrem Bildmaterial und zeigt, welche Texte auf der Zeichenfläche nicht mehr aktuell sind.

Das Variablen-Bedienfeld und die Datenzusammenführung von Illustrator importieren die Daten, zeigen aber nicht, was sich geändert hat, verknüpfen jede Variable nur mit einem Objekt und schreiben beim Anwenden eines Datensatzes den gesamten Text samt Formatierung neu. Copydeck verwendet dieselben Illustrator-Variablen und ergänzt sie um einen klaren, sicheren Arbeitsablauf.

## Funktionen

- **Vergleichsansicht**: Status jeder Variable (zu aktualisieren, aktuell, nicht verknüpft, neu in der Datei, nicht in der Datei), der Text im Dokument, der Text in der Datei und genau der Teil, der sich ändern wird.
- **Aktualisierungen, die die Formatierung erhalten**: nur die abweichenden Wörter werden ersetzt. Fett, Farben, Zeichenformate und auf Wunsch manuelle Leerzeichen und Umbrüche bleiben erhalten.
- **Ignorieren, was nicht zählt**: Unterschiede bei Leerzeichen und Umbrüchen (und optional bei Groß-/Kleinschreibung) gelten nicht als Änderungen. Formatierung zählt nie.
- **Eine, mehrere oder alle Variablen aktualisieren**, mit Rückgängig für die letzte Aktualisierung.
- **Merkt sich die Quelle**: die verknüpfte Datendatei und für jede Variable Datei und Datensatz der letzten Aktualisierung werden in der `.ai`-Datei gespeichert.
- **Werkzeuge zum Verknüpfen**: durchsuchbare Listen von Textobjekten und Variablen, Auswahl auf der Zeichenfläche, Verknüpfen der aktuellen Auswahl, neue Variable aus einem Text.
- **Automatisch zuordnen**: schlägt Verknüpfungen für Objekte vor, deren Text bereits dem Wert einer Variable entspricht; zweifelhafte Fälle werden aufgelistet, aber nicht vorausgewählt.
- **Eine Variable auf mehreren Objekten**, und Verknüpfungen, die auch beim Kopieren in ein anderes Dokument erhalten bleiben.
- **XML, CSV und TXT** in den Formaten von Illustrator und VariableImporter.
- **Oberfläche auf Deutsch, Englisch, Italienisch, Französisch und Spanisch.**

## Für wen?

- **Verpackungs- und Etikettendesigner**, die Zutaten, Nährwerte, Allergene, Füllmengen und Pflichtangaben über viele Artikel hinweg aktualisieren.
- **Agenturen und Studios**, die das Copy Deck vom Kunden erhalten und jeden Text im Bildmaterial prüfen müssen.
- **Kataloge, Preislisten und datengesteuerte Grafiken**, die mit der Datenzusammenführung von Illustrator entstehen.
- **Mehrsprachige Verpackungen**, mit einem Datensatz pro Sprache oder Markt.

## So funktioniert es

1. Öffnen Sie Ihre `.ai`-Datei und starten Sie **Copydeck** (Datei > Skripten > Copydeck).
2. Klicken Sie auf **Datendatei wählen…** und wählen Sie Ihre XML-, CSV- oder TXT-Datei. Die Verknüpfung wird in der `.ai`-Datei gespeichert.
3. Prüfen Sie die Zeilen **● Zu aktualisieren**: darunter sehen Sie den aktuellen Text, den neuen Text und was sich ändern wird.
4. Klicken Sie auf **Diese aktualisieren** oder **Alle zu aktualisierenden Variablen aktualisieren** und speichern Sie die `.ai`-Datei.

Neue Variablen verknüpfen Sie mit **Automatisch zuordnen…**, durch Auswahl auf der Zeichenfläche oder im Register **Textobjekte**. Alle Optionen stehen im [Handbuch]({{ '/de/handbuch/' | relative_url }}).

## Copydeck und das Variablen-Bedienfeld von Illustrator

| | Variablen-Bedienfeld von Illustrator | Copydeck |
| --- | --- | --- |
| Sehen, welche Texte von den Daten abweichen | Nein | Ja, mit der genauen Änderung |
| Eine einzelne Variable aktualisieren | Nur durch Wechsel des Datensatzes | Ja |
| Formatierung unveränderter Wörter erhalten | Nein | Ja |
| Unterschiede bei Leerzeichen und Umbrüchen ignorieren | Nein | Ja |
| Eine Variable auf mehreren Objekten | Nein | Ja |
| Quelldatei und Verlauf merken | Nein | Ja, in der `.ai`-Datei |
| Verknüpfungen beim Kopieren in eine andere Datei erhalten | Nein | Ja, über die Notiz des Objekts |

## Datendateien

**XML**: die Variablenbibliothek, die Illustrator aus dem Variablen-Bedienfeld speichert. `<p>` wird zu einem Absatz, `<br/>` zu einem erzwungenen Zeilenumbruch, `<b>` und `<i>` zu fett und kursiv.

**CSV und TXT**: die erste Zeile enthält die Variablennamen, jede weitere Zeile ist ein Datensatz.

```csv
product_name,net_weight,ingredients,@photo,#show_badge
Tomato soup,500 g,"Tomatoes 85%, water, olive oil, salt",/images/tomato.jpg,TRUE
Pea soup,400 g,"Peas 70%, water, CELERY, salt",/images/pea.jpg,FALSE
```

Beispieldateien finden Sie im [Ordner examples auf GitHub]({{ site.repository_url }}/tree/main/examples).

## Installation

Laden Sie `Copydeck.jsx` herunter, kopieren Sie es in den Skripten-Ordner von Illustrator (`Presets/<Sprache>/Scripts`) und starten Sie Illustrator neu. Sie können es auch einmalig über **Datei > Skripten > Anderes Skript…** starten. Das [Handbuch]({{ '/de/handbuch/' | relative_url }}) erklärt, wie Sie einen Tastaturbefehl zuweisen.

{% include faq.html %}
