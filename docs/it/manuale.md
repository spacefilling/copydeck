---
title: 'Manuale – installare e usare Copydeck in Adobe Illustrator'
description: 'Manuale di Copydeck: installazione, collegamento a XML, CSV o TXT, confronto e aggiornamento delle variabili di testo, collegamenti, copia dell''artwork.'
lang: it
ref: manual
order: 2
permalink: /it/manuale/
---

# Manuale di Copydeck

Copydeck collega un file `.ai` al file dati delle variabili (XML, CSV o TXT), mostra cosa è cambiato e aggiorna i testi. L'interfaccia è disponibile in italiano, inglese, francese e tedesco: usa il menu in alto a destra nella finestra.


## 1. Installazione

Copia `Copydeck.jsx` nella cartella Scripts di Illustrator:

| Sistema | Cartella |
| --- | --- |
| Windows | `C:\Program Files\Adobe\Adobe Illustrator <versione>\Presets\it_IT\Scripts\` |
| macOS | `/Applications/Adobe Illustrator <versione>/Presets.localized/it_IT/Scripts/` |

La cartella della lingua dipende dal tuo Illustrator (`it_IT`, `en_US`…). Riavvia Illustrator: lo script compare in **File > Script > Copydeck**. Senza installarlo, usa **File > Script > Altro script…** e scegli il file.

### Scorciatoia da tastiera

Una scorciatoia è consigliata, soprattutto per il metodo *Scegli sulla tavola*.

1. **Finestra > Azioni**. Crea un nuovo set, poi una nuova azione.
2. Come **Tasto funzione** scegli un tasto libero, per esempio Ctrl+Maiusc+F12. Non usare F5–F9: sono già di Illustrator (F5 = Pennelli) e vincono loro.
3. Premi **Registra**, poi nel menu del pannello Azioni scegli **Inserisci voce di menu…**, clicca **File > Script > Copydeck** e premi OK. Interrompi la registrazione.
4. Controlla che nell'azione compaia il passaggio Copydeck: se manca, il tasto non fa niente.

Se dopo un riavvio di Illustrator il tasto smette di funzionare, il passaggio dello script si è perso dall'azione (succede): ripeti il punto 3.

## 2. Primo avvio su un file

- Apri il file `.ai` e avvia lo script.
- Premi **Scegli file dati…** e scegli il file delle variabili.
- Il collegamento al file dati viene salvato dentro il file `.ai`: le volte successive si ricarica da solo. Se il file dati viene spostato, lo script lo segnala e basta sceglierlo di nuovo.
- Se il file contiene più record, scegli quello giusto in **Record**.
- A ogni apertura lo script salva da solo nelle Note degli oggetti i collegamenti che non ce l'hanno ancora (vedi la [sezione 6](#collegamenti)). La barra in basso dice quanti ne ha salvati.

### File dati supportati

**XML** – il formato "Libreria variabili" di Illustrator (*pannello Variabili > Salva libreria variabili*). `<p>` = paragrafo, `<br/>` = a capo forzato, `<b>` e `<i>` = grassetto e corsivo (se il font ha quegli stili).

**CSV o TXT con tabulazioni** – come per Illustrator e VariableImporter:

| Elemento | Significato |
| --- | --- |
| prima riga | nomi delle variabili |
| altre righe | un record per riga |
| `@nome` | variabile immagine (mostrata, gestita da Illustrator) |
| `#nome` | variabile visibilità (mostrata, gestita da Illustrator) |
| `%nome` | variabile grafico (mostrata, gestita da Illustrator) |
| a capo dentro una cella, oppure `\\` | nuovo paragrafo |

Separatore (virgola, punto e virgola o tabulazione) e codifica (UTF-8, UTF-16 "Testo Unicode" di Excel, Windows-1252) sono riconosciuti in automatico.

## 3. Leggere il confronto

Scheda **Variabili e confronto**. Ogni riga è una variabile:

| Stato | Significato |
| --- | --- |
| ● Da aggiornare | il testo nel documento è diverso dal file |
| ≈ Solo spazi/a capo | cambiano solo spazi o ritorni a capo |
| ≈ Solo maiuscole | cambiano solo maiuscole/minuscole |
| ○ Non collegata | la variabile esiste ma nessun oggetto la usa |
| + Nuova nel file | c'è solo nel file dati: creala e collegala |
| ! Non nel file | c'è nel documento ma non nel file dati |
| ✓ Aggiornata | coincide con il file |

### Come confronta

- Solo il testo. Grassetto, corsivo, sottolineato, colori e altra formattazione non contano mai.
- **Ignora spazi e a capo** (attiva di default): le righe "≈ Solo spazi/a capo" non sono da aggiornare e *Aggiorna tutte* le salta.
- **Ignora maiuscole** (spenta di default): lo stesso per le righe "≈ Solo maiuscole".
- Una riga "≈" si può comunque allineare al file, una alla volta, con **Rendi identica al file**.

### Uso dell'elenco

- **Mostra** filtra per stato (anche *Differenze ignorate*); **Cerca** cerca nel nome e nel testo. Più parole = devono esserci tutte.
- Clic su una riga: in basso vedi il testo attuale, quello del file e la riga **Cambierà** con la parte che verrà modificata.
- La colonna **Ultimo aggiornamento da** dice da quale file e quando la variabile è stata aggiornata l'ultima volta con lo script.
- Doppio clic su una riga: Illustrator va all'oggetto e lo seleziona.

## 4. Aggiornare

| Per aggiornare | Fai così |
| --- | --- |
| una variabile | seleziona la riga > **Aggiorna questa** |
| alcune variabili | Ctrl/Cmd+clic o Maiusc+clic sulle righe > **Aggiorna le righe selezionate** |
| tutte le variabili | **Aggiorna tutte le variabili da aggiornare** (solo quelle "● Da aggiornare") |
| tornare indietro | **Annulla ultimo aggiornamento** |

### Come aggiorna

- Cambiano solo le parole diverse: grassetti e stili del resto del testo restano com'erano.
- Con *Ignora spazi e a capo* attivo, i tuoi a capo e spazi manuali restano dove sono. Esempio: nel documento "GRANO⏎tenero (71%)", nel file "GRANO tenero (70%)" → diventa "GRANO⏎tenero (70%)".
- **Rendi identica al file** e i valori con `<b>`/`<i>` nell'XML copiano invece il testo del file esattamente, a capo compresi.
- Se una variabile è collegata a più oggetti, li aggiorna tutti.
- Gli oggetti bloccati, o su livelli bloccati o nascosti, vengono aggiornati lo stesso.

**Importante:** le modifiche sono già nel documento. Salva il file `.ai`.

## 5. Collegare una variabile a un testo

### Automatico: Accoppia automaticamente…

Si trova nella scheda Variabili e nella scheda Oggetti di testo. Propone in un elenco:

- **Collega** – oggetti non collegati il cui testo coincide con il valore di una variabile nel file.
- **Copia in più** – oggetti con lo stesso testo di una variabile già collegata altrove.
- **Ripristina** – oggetti collegati solo tramite le Note (per esempio dopo averli incollati da un altro file): li ricollega anche nel pannello Variabili di Illustrator.

Sono già selezionate solo le righe sicure. Quelle dubbie (valori uguali per più variabili, valori molto corti, copie in più) sono in elenco ma non selezionate: la colonna **Nota** dice perché. Controlla, aggiungi o togli righe con Ctrl/Cmd+clic, poi premi **Collega le selezionate**. Doppio clic su una riga per vedere l'oggetto.

### A mano

La finestra blocca Illustrator finché è aperta. Ci sono tre modi:

**A) Scegli sulla tavola** (il più comodo): seleziona la variabile > **Scegli sulla tavola…** > la finestra si chiude > clicca il testo sulla tavola > rilancia lo script con la scorciatoia. Il collegamento si completa da solo e la finestra si riapre lì.

**B) Seleziona prima di aprire**: seleziona il testo in Illustrator > avvia lo script > scegli la variabile > **Collega agli oggetti selezionati**.

**C) Dall'elenco** (scheda **Oggetti di testo**): a sinistra gli oggetti di testo, a destra le variabili, ognuno con il suo campo di ricerca.

1. Cerca e scegli l'oggetto (doppio clic per vederlo).
2. Cerca e scegli la variabile.
3. Premi **Collega oggetto e variabile**.

La ★ indica le coppie probabili (testo dell'oggetto uguale al valore della variabile nel file); le righe con ★ vanno in cima. L'elenco oggetti mostra al massimo 200 righe: se sono di più, scrivi nella ricerca per restringere.

### Altre azioni

- **Scollega** – toglie il collegamento (anche la riga nelle Note).
- **Crea variabile** – per le righe "Nuova nel file".
- **Nuova variabile da questo testo…** – nella scheda Oggetti di testo.
- **Elimina variabile** – la toglie dal documento (il testo resta).

## 6. Come sono salvati i collegamenti {#collegamenti}

Un oggetto può essere collegato in due modi, e lo script li legge tutti e due:

- **Collegamento di Illustrator** – quello del pannello Variabili. Una variabile ne ha uno solo; non segue l'oggetto se lo copi in un altro file.
- **La riga `VAR:nomevariabile` nelle Note dell'oggetto** (pannello Attributi) – la scrive lo script e viaggia con l'oggetto quando lo copi. Non cancellarla e non modificarla a mano.

Se un oggetto ha tutti e due e indicano variabili diverse, vale quello di Illustrator.

La riga nelle Note viene scritta:

- quando colleghi un oggetto con lo script;
- a ogni apertura dello script, per i collegamenti che non l'hanno ancora (fatti dal pannello Variabili o con versioni precedenti);
- per la stessa variabile su più oggetti: il primo usa il collegamento di Illustrator, gli altri solo la riga nelle Note.

### Copiare l'artwork

**Dentro lo stesso file**: la copia resta collegata alla stessa variabile e viene aggiornata insieme all'originale. Se una copia non deve più seguire la variabile, selezionala e premi **Scollega**.

**In un altro file**:

1. Nel file di partenza apri lo script (salva le Note mancanti), chiudilo e salva il file `.ai`.
2. Copia e incolla l'artwork nel nuovo file.
3. Nel nuovo file apri lo script: gli oggetti risultano già collegati. Scegli il file dati e premi **Accoppia automaticamente…**: le righe *Ripristina* ricreano anche i collegamenti nel pannello Variabili.

### Opzioni

Nella scheda Oggetti di testo, in basso a destra:

- **Collega anche nel pannello Variabili** – se la disattivi, i collegamenti nuovi sono solo nelle Note. Lo script funziona lo stesso, ma il pannello Variabili di Illustrator non li vede.
- **Memorizza nelle Note (per copiare)** – se la disattivi, lo script non scrive più le Note né nei collegamenti nuovi né all'apertura; quelle già scritte restano.

## 7. Da sapere

| Cosa | Dove viene salvato |
| --- | --- |
| collegamento al file dati, storico aggiornamenti | dentro il file `.ai` (metadati XMP) |
| collegamenti degli oggetti | pannello Variabili e Note degli oggetti |
| opzioni e lingua | preferenze di Illustrator di questo computer |

- Nel pannello Variabili di Illustrator il set di dati può risultare "modificato": è normale, lo script scrive direttamente nei testi.
- Se alla chiusura dello script Illustrator resta occupato per un po', dopo molti collegamenti, prova a chiudere il pannello Variabili prima di usare lo script. Se non basta, disattiva *Collega anche nel pannello Variabili*.
- In caso di errore, annota il messaggio e il numero di riga e [apri una segnalazione su GitHub]({{ site.repository_url }}/issues).
