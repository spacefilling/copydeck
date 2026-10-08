---
title: 'Handbuch – Copydeck in Adobe Illustrator installieren und verwenden'
description: 'Copydeck-Handbuch: Installation, Verknüpfung mit XML, CSV oder TXT, Vergleich und Aktualisierung von Textvariablen, Verknüpfungen, Kopieren.'
lang: de
ref: manual
order: 4
permalink: /de/handbuch/
---

# Copydeck-Handbuch

Copydeck verknüpft eine `.ai`-Datei mit der Datendatei der Variablen (XML, CSV oder TXT), zeigt, was sich geändert hat, und aktualisiert die Texte. Die Oberfläche gibt es auf Deutsch, Englisch, Italienisch und Französisch: über das Menü oben rechts im Fenster.


## 1. Installation

Kopieren Sie `Copydeck.jsx` in den Skripten-Ordner von Illustrator:

| System | Ordner |
| --- | --- |
| Windows | `C:\Program Files\Adobe\Adobe Illustrator <Version>\Presets\de_DE\Scripts\` |
| macOS | `/Applications/Adobe Illustrator <Version>/Presets.localized/de_DE/Scripts/` |

Der Sprachordner hängt von Ihrem Illustrator ab (`de_DE`, `en_US`…). Starten Sie Illustrator neu: das Skript erscheint unter **Datei > Skripten > Copydeck**. Ohne Installation: **Datei > Skripten > Anderes Skript…** und die Datei wählen.

### Tastaturbefehl

Ein Tastaturbefehl wird empfohlen, vor allem für *Auf der Zeichenfläche wählen*.

1. **Fenster > Aktionen**. Einen neuen Satz und dann eine neue Aktion anlegen.
2. Als **Funktionstaste** eine freie Taste wählen, z. B. Strg+Umschalt+F12. Nicht F5–F9 verwenden: Illustrator nutzt sie bereits (F5 = Pinsel) und hat Vorrang.
3. **Aufzeichnen** klicken, dann im Menü des Aktionen-Bedienfelds **Menübefehl einfügen…** wählen, **Datei > Skripten > Copydeck** anklicken und bestätigen. Aufzeichnung beenden.
4. Prüfen, dass die Aktion den Schritt Copydeck enthält: fehlt er, bewirkt die Taste nichts.

Funktioniert die Taste nach einem Neustart von Illustrator nicht mehr, ist der Skriptschritt aus der Aktion verloren gegangen (kommt vor): Schritt 3 wiederholen.

## 2. Erster Start mit einer Datei

- Die `.ai`-Datei öffnen und das Skript starten.
- **Datendatei wählen…** klicken und die Variablendatei wählen.
- Die Verknüpfung zur Datendatei wird in der `.ai`-Datei gespeichert: beim nächsten Mal wird sie automatisch geladen. Wird die Datendatei verschoben, meldet das Skript es, und Sie wählen sie einfach erneut.
- Enthält die Datei mehrere Datensätze, wählen Sie unter **Datensatz** den richtigen.
- Bei jedem Öffnen speichert das Skript in den Notizen der Objekte die Verknüpfungen, die noch keine haben (siehe [Abschnitt 6](#verknuepfungen)). Die Statusleiste zeigt, wie viele es gespeichert hat.

### Unterstützte Datendateien

**XML** – das Format „Variablenbibliothek" von Illustrator (*Variablen-Bedienfeld > Variablenbibliothek speichern*). `<p>` = Absatz, `<br/>` = erzwungener Zeilenumbruch, `<b>` und `<i>` = fett und kursiv (wenn die Schrift diese Schnitte hat).

**CSV oder tabulatorgetrennte TXT** – wie bei Illustrator und VariableImporter:

| Element | Bedeutung |
| --- | --- |
| erste Zeile | Variablennamen |
| weitere Zeilen | ein Datensatz pro Zeile |
| `@name` | Bildvariable (angezeigt, von Illustrator verwaltet) |
| `#name` | Sichtbarkeitsvariable (angezeigt, von Illustrator verwaltet) |
| `%name` | Diagrammvariable (angezeigt, von Illustrator verwaltet) |
| Zeilenumbruch in einer Zelle oder `\\` | neuer Absatz |

Trennzeichen (Komma, Semikolon oder Tabulator) und Kodierung (UTF-8, UTF-16 „Unicode-Text" aus Excel, Windows-1252) werden automatisch erkannt.

## 3. Den Vergleich lesen

Register **Variablen und Vergleich**. Jede Zeile ist eine Variable:

| Status | Bedeutung |
| --- | --- |
| ● Zu aktualisieren | der Text im Dokument weicht von der Datei ab |
| ≈ Nur Leerzeichen/Umbrüche | nur Leerzeichen oder Umbrüche unterscheiden sich |
| ≈ Nur Groß-/Kleinschreibung | nur die Groß-/Kleinschreibung unterscheidet sich |
| ○ Nicht verknüpft | die Variable existiert, aber kein Objekt nutzt sie |
| + Neu in der Datei | nur in der Datendatei: anlegen und verknüpfen |
| ! Nicht in der Datei | im Dokument, aber nicht in der Datendatei |
| ✓ Aktuell | stimmt mit der Datei überein |

### Wie verglichen wird

- Nur der Text. Fett, Kursiv, Unterstreichung, Farben und andere Formatierungen zählen nie.
- **Leerzeichen und Umbrüche ignorieren** (standardmäßig an): Zeilen „≈ Nur Leerzeichen/Umbrüche" sind nicht zu aktualisieren, *Alle … aktualisieren* überspringt sie.
- **Groß-/Kleinschreibung ignorieren** (standardmäßig aus): dasselbe für Zeilen „≈ Nur Groß-/Kleinschreibung".
- Eine „≈"-Zeile lässt sich trotzdem einzeln mit **An Datei angleichen** an die Datei anpassen.

### Die Liste verwenden

- **Anzeigen** filtert nach Status (auch *Ignorierte Unterschiede*); **Suchen** durchsucht Namen und Text. Mehrere Wörter = alle müssen vorkommen.
- Klick auf eine Zeile: unten sehen Sie den aktuellen Text, den Text der Datei und die Zeile **Wird geändert** mit dem Teil, der geändert wird.
- Die Spalte **Zuletzt aktualisiert aus** zeigt, aus welcher Datei und wann die Variable zuletzt mit dem Skript aktualisiert wurde.
- Doppelklick auf eine Zeile: Illustrator springt zum Objekt und wählt es aus.

## 4. Aktualisieren

| Aktualisieren | So geht's |
| --- | --- |
| eine Variable | Zeile auswählen > **Diese aktualisieren** |
| mehrere Variablen | Strg/Cmd+Klick oder Umschalt+Klick auf die Zeilen > **Ausgewählte Zeilen aktualisieren** |
| alle Variablen | **Alle zu aktualisierenden Variablen aktualisieren** (nur die „● Zu aktualisieren") |
| zurück | **Letzte Aktualisierung rückgängig** |

### Wie aktualisiert wird

- Nur die abweichenden Wörter werden geändert: Fett und Formate des übrigen Textes bleiben erhalten.
- Mit *Leerzeichen und Umbrüche ignorieren* bleiben Ihre manuellen Umbrüche und Leerzeichen erhalten. Beispiel: im Dokument „WEIZEN⏎mehl (71 %)", in der Datei „WEIZEN mehl (70 %)" → wird zu „WEIZEN⏎mehl (70 %)".
- **An Datei angleichen** und Werte mit `<b>`/`<i>` im XML übernehmen dagegen den Text der Datei exakt, einschließlich Umbrüchen.
- Ist eine Variable mit mehreren Objekten verknüpft, werden alle aktualisiert.
- Gesperrte Objekte oder Objekte auf gesperrten oder ausgeblendeten Ebenen werden trotzdem aktualisiert.

**Wichtig:** die Änderungen sind bereits im Dokument. Speichern Sie die `.ai`-Datei.

## 5. Eine Variable mit einem Text verknüpfen

### Automatisch: Automatisch zuordnen…

Im Register Variablen und im Register Textobjekte verfügbar. Schlägt in einer Liste vor:

- **Verknüpfen** – nicht verknüpfte Objekte, deren Text dem Wert einer Variable in der Datei entspricht.
- **Zusätzliche Kopie** – Objekte mit demselben Text wie eine bereits anderswo verknüpfte Variable.
- **Wiederherstellen** – nur über die Notiz verknüpfte Objekte (z. B. nach dem Einfügen aus einer anderen Datei): werden auch im Variablen-Bedienfeld wieder verknüpft.

Nur die sicheren Zeilen sind vorausgewählt. Zweifelhafte Zeilen (gleicher Wert für mehrere Variablen, sehr kurze Werte, zusätzliche Kopien) stehen in der Liste, sind aber nicht ausgewählt: die Spalte **Hinweis** erklärt warum. Prüfen, Zeilen mit Strg/Cmd+Klick hinzufügen oder entfernen, dann **Auswahl verknüpfen** klicken. Doppelklick auf eine Zeile zeigt das Objekt.

### Von Hand

Das Fenster blockiert Illustrator, solange es geöffnet ist. Es gibt drei Wege:

**A) Auf der Zeichenfläche wählen** (am bequemsten): Variable auswählen > **Auf der Zeichenfläche wählen…** > das Fenster schließt sich > Text auf der Zeichenfläche anklicken > Skript mit dem Tastaturbefehl erneut starten. Die Verknüpfung wird automatisch abgeschlossen und das Fenster öffnet sich an derselben Stelle.

**B) Vor dem Öffnen auswählen**: Text in Illustrator auswählen > Skript starten > Variable wählen > **Mit ausgewählten Objekten verknüpfen**.

**C) Aus der Liste** (Register **Textobjekte**): links die Textobjekte, rechts die Variablen, jeweils mit eigenem Suchfeld.

1. Objekt suchen und wählen (Doppelklick zeigt es an).
2. Variable suchen und wählen.
3. **Objekt und Variable verknüpfen** klicken.

Der Stern ★ markiert wahrscheinliche Paare (Objekttext gleich dem Wert der Variable in der Datei); Zeilen mit ★ stehen oben. Die Objektliste zeigt höchstens 200 Zeilen: sind es mehr, zum Eingrenzen in das Suchfeld tippen.

### Weitere Aktionen

- **Verknüpfung lösen** – entfernt die Verknüpfung (auch die Zeile in der Notiz).
- **Variable anlegen** – für Zeilen „Neu in der Datei".
- **Neue Variable aus diesem Text…** – im Register Textobjekte.
- **Variable löschen** – entfernt sie aus dem Dokument (der Text bleibt).

## 6. Wie Verknüpfungen gespeichert werden {#verknuepfungen}

Ein Objekt kann auf zwei Arten verknüpft sein, und das Skript liest beide:

- **Illustrator-Verknüpfung** – die aus dem Variablen-Bedienfeld. Eine Variable hat nur eine; sie folgt dem Objekt nicht, wenn Sie es in eine andere Datei kopieren.
- **Die Zeile `VAR:variablenname` in der Notiz des Objekts** (Attribute-Bedienfeld) – vom Skript geschrieben, wandert sie beim Kopieren mit dem Objekt mit. Nicht löschen und nicht von Hand ändern.

Hat ein Objekt beides und nennen sie verschiedene Variablen, gilt die Illustrator-Verknüpfung.

Die Zeile wird in die Notiz geschrieben:

- wenn Sie ein Objekt mit dem Skript verknüpfen;
- bei jedem Öffnen des Skripts für Verknüpfungen, die sie noch nicht haben (aus dem Variablen-Bedienfeld oder älteren Versionen);
- für dieselbe Variable auf mehreren Objekten: das erste nutzt die Illustrator-Verknüpfung, die anderen nur die Zeile in der Notiz.

### Bildmaterial kopieren

**In derselben Datei**: die Kopie bleibt mit derselben Variable verknüpft und wird zusammen mit dem Original aktualisiert. Soll eine Kopie der Variable nicht mehr folgen, wählen Sie sie aus und klicken Sie auf **Verknüpfung lösen**.

**In eine andere Datei**:

1. In der Ausgangsdatei das Skript öffnen (es speichert die fehlenden Notizen), schließen und die `.ai`-Datei speichern.
2. Das Bildmaterial kopieren und in die neue Datei einfügen.
3. In der neuen Datei das Skript öffnen: die Objekte sind bereits verknüpft. Datendatei wählen und **Automatisch zuordnen…** klicken: die Zeilen *Wiederherstellen* legen die Verknüpfungen auch im Variablen-Bedienfeld wieder an.

### Optionen

Im Register Textobjekte, unten rechts:

- **Auch im Variablen-Bedienfeld verknüpfen** – wenn aus, stehen neue Verknüpfungen nur in den Notizen. Das Skript funktioniert genauso, aber das Variablen-Bedienfeld von Illustrator sieht sie nicht.
- **In Notizen speichern (zum Kopieren)** – wenn aus, schreibt das Skript keine Notizen mehr, weder für neue Verknüpfungen noch beim Öffnen; bereits geschriebene bleiben.

## 7. Gut zu wissen

| Was | Wo es gespeichert wird |
| --- | --- |
| Verknüpfung zur Datendatei, Verlauf | in der `.ai`-Datei (XMP-Metadaten) |
| Verknüpfungen der Objekte | Variablen-Bedienfeld und Notizen der Objekte |
| Optionen und Sprache | Illustrator-Voreinstellungen auf diesem Computer |

- Im Variablen-Bedienfeld von Illustrator kann der Datensatz als „geändert" erscheinen: das ist normal, das Skript schreibt direkt in die Texte.
- Bleibt Illustrator nach dem Schließen des Skripts eine Weile beschäftigt (nach vielen Verknüpfungen), schließen Sie das Variablen-Bedienfeld vor der Arbeit mit dem Skript. Reicht das nicht, deaktivieren Sie *Auch im Variablen-Bedienfeld verknüpfen*.
- Bei einem Fehler die Meldung und die Zeilennummer notieren und [auf GitHub ein Issue eröffnen]({{ site.repository_url }}/issues).
