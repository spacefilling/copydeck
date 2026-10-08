---
title: 'Aggiornare le variabili di testo di Illustrator da XML, CSV e TXT'
description: 'Script gratuito per Adobe Illustrator: confronta le variabili di testo con un copy deck XML, CSV o TXT e aggiornale senza perdere la formattazione.'
lang: it
ref: home
order: 2
permalink: /it/
image: /assets/social-preview.png
faq:
  - q: 'Come aggiorno le variabili di testo di Illustrator da un file CSV o XML?'
    a: 'Avvia Copydeck, scegli il file dati e apri la scheda "Variabili e confronto". Ogni variabile il cui testo è diverso dal file è segnata "Da aggiornare". Puoi aggiornarle una alla volta o tutte insieme; vengono sostituite solo le parole cambiate.'
  - q: 'Copydeck funziona con il pannello Variabili e i set di dati di Illustrator?'
    a: 'Sì. Copydeck legge e scrive le stesse variabili che vedi nel pannello Variabili e carica la libreria di variabili XML salvata da Illustrator. In più offre un confronto chiaro e aggiornamenti più sicuri.'
  - q: 'Una variabile può essere collegata a più oggetti di testo?'
    a: 'Sì. Il primo oggetto usa il collegamento di Illustrator, gli altri sono collegati da Copydeck tramite la riga "VAR:nome" nelle Note dell''oggetto. Vengono aggiornati tutti insieme.'
  - q: 'Aggiornare una variabile cancella grassetti, colori o a capo manuali?'
    a: 'No. Copydeck sostituisce solo le parole diverse, quindi la formattazione del resto del testo resta com''è. Con "Ignora spazi e a capo" attivo, anche i tuoi a capo manuali restano al loro posto.'
  - q: 'Che formato CSV legge Copydeck?'
    a: 'Lo stesso dell''unione dati di Illustrator. La prima riga contiene i nomi delle variabili, ogni riga successiva è un record. Le colonne che iniziano con @, # o % sono variabili immagine, visibilità e grafico. Separatori (virgola, punto e virgola, tabulazione) e codifiche (UTF-8, UTF-16, Windows-1252) sono riconosciuti in automatico.'
  - q: 'Con quali versioni di Illustrator funziona?'
    a: 'Copydeck è uno script ExtendScript (.jsx) e funziona con Illustrator per Windows e macOS che supporta gli script. È stato scritto per Illustrator 2025; i riscontri su altre versioni sono benvenuti su GitHub.'
  - q: 'Copydeck è gratuito?'
    a: 'Sì. Copydeck è gratuito e open source, con licenza GNU GPL v3. Puoi usarlo per qualsiasi lavoro, anche pagato; le versioni modificate si possono distribuire solo con la stessa licenza e con il codice sorgente.'
---

# Copydeck per Adobe Illustrator

<p class="lead">Tieni l'artwork di Illustrator allineato al suo copy deck. Confronta le variabili di testo con un file XML, CSV o TXT, guarda esattamente cosa è cambiato e aggiorna i testi senza perdere la formattazione.</p>

{% include download.html %}

![Copydeck: confronto e aggiornamento delle variabili di testo di Adobe Illustrator da un file dati]({{ '/assets/social-preview.png' | relative_url }})

## Che cos'è Copydeck?

Il *copy deck* è il documento che raccoglie tutti i testi di una confezione, di un'etichetta o di una campagna: nome prodotto, ingredienti, tabella nutrizionale, allergeni, diciture legali, claim. Copydeck collega quel documento, salvato come XML, CSV o TXT, al tuo artwork di Illustrator attraverso le **variabili di Illustrator**, e ti dice quali testi sulla tavola non sono aggiornati.

Il pannello Variabili e l'unione dati di Illustrator importano i dati, ma non mostrano cosa è cambiato, collegano ogni variabile a un solo oggetto e, applicando un set di dati, riscrivono tutto il testo e la sua formattazione. Copydeck usa le stesse variabili di Illustrator e ci aggiunge un modo di lavorare chiaro e sicuro.

## Funzioni

- **Confronto**: lo stato di ogni variabile (da aggiornare, aggiornata, non collegata, nuova nel file, non nel file), il testo nel documento, quello nel file e la parte esatta che cambierà.
- **Aggiornamenti che rispettano la formattazione**: vengono sostituite solo le parole diverse. Grassetti, colori, stili di carattere e, se vuoi, spazi e a capo manuali restano com'erano.
- **Ignora ciò che non conta**: le differenze di spazi e a capo (e, se vuoi, di maiuscole) non contano come modifiche. La formattazione non conta mai.
- **Aggiorna una, alcune o tutte le variabili**, con annullamento dell'ultimo aggiornamento.
- **Ricorda la fonte**: il file dati collegato e, per ogni variabile, il file e il record da cui è stata aggiornata l'ultima volta vengono salvati dentro il file `.ai`.
- **Strumenti di collegamento**: elenchi di oggetti di testo e variabili con ricerca, scelta sulla tavola, collegamento della selezione, creazione di una variabile da un testo.
- **Accoppiamento automatico**: propone di collegare gli oggetti il cui testo coincide già con il valore di una variabile; i casi dubbi sono elencati ma non preselezionati.
- **Una variabile su più oggetti**, e collegamenti che restano anche copiando e incollando in un altro documento.
- **XML, CSV e TXT** nei formati usati da Illustrator e da VariableImporter.
- **Interfaccia in italiano, inglese, francese e tedesco.**

## Per chi è?

- **Chi progetta packaging ed etichette** e aggiorna ingredienti, valori nutrizionali, allergeni, pesi e diciture legali su molte referenze.
- **Agenzie e studi** che ricevono il copy deck dal cliente e devono verificare ogni testo nell'artwork.
- **Cataloghi, listini e grafiche basate su dati** realizzati con l'unione dati di Illustrator.
- **Packaging multilingua**, con un record per lingua o mercato.

## Come funziona

1. Apri il file `.ai` e avvia **Copydeck** (File > Script > Copydeck).
2. Premi **Scegli file dati…** e scegli l'XML, il CSV o il TXT. Il collegamento viene salvato nel file `.ai`.
3. Controlla le righe **● Da aggiornare**: sotto vedi il testo attuale, quello nuovo e cosa cambierà.
4. Premi **Aggiorna questa** oppure **Aggiorna tutte le variabili da aggiornare**, poi salva il file `.ai`.

Le nuove variabili si collegano con **Accoppia automaticamente…**, scegliendo l'oggetto sulla tavola o dalla scheda **Oggetti di testo**. Tutte le opzioni sono nel [manuale]({{ '/it/manuale/' | relative_url }}).

## Copydeck e il pannello Variabili di Illustrator

| | Pannello Variabili di Illustrator | Copydeck |
| --- | --- | --- |
| Vedere quali testi sono diversi dai dati | No | Sì, con la modifica esatta |
| Aggiornare una sola variabile | Solo cambiando set di dati | Sì |
| Mantenere la formattazione delle parole invariate | No | Sì |
| Ignorare differenze di spazi e a capo | No | Sì |
| Una variabile su più oggetti | No | Sì |
| Ricordare il file sorgente e lo storico | No | Sì, dentro il file `.ai` |
| Mantenere i collegamenti copiando l'artwork in un altro file | No | Sì, tramite le Note dell'oggetto |

## File dati

**XML**: la libreria di variabili che Illustrator salva dal pannello Variabili. `<p>` diventa un paragrafo, `<br/>` un a capo forzato, `<b>` e `<i>` grassetto e corsivo.

**CSV e TXT**: la prima riga contiene i nomi delle variabili, ogni riga successiva è un record.

```csv
product_name,net_weight,ingredients,@photo,#show_badge
Tomato soup,500 g,"Tomatoes 85%, water, olive oil, salt",/images/tomato.jpg,TRUE
Pea soup,400 g,"Peas 70%, water, CELERY, salt",/images/pea.jpg,FALSE
```

I file di esempio sono nella [cartella examples su GitHub]({{ site.repository_url }}/tree/main/examples).

## Installazione

Scarica `Copydeck.jsx` e copialo nella cartella Scripts di Illustrator (`Presets/<lingua>/Scripts`), poi riavvia Illustrator. Puoi anche avviarlo una volta con **File > Script > Altro script…**. Il [manuale]({{ '/it/manuale/' | relative_url }}) spiega come assegnargli una scorciatoia da tastiera.

{% include faq.html %}
