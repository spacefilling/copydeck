---
title: 'Manual – install and use Copydeck in Adobe Illustrator'
description: 'Copydeck manual: install the script, link an Illustrator file to XML, CSV or TXT, compare and update text variables, bind objects, copy artwork.'
lang: en
ref: manual
order: 1
permalink: /manual/
---

# Copydeck manual

Copydeck links an `.ai` file to a variables data file (XML, CSV or TXT), shows what changed and updates the texts. The interface is available in English, Italian, French, German and Spanish: use the menu at the top right of the window.


## 1. Installation

Copy `Copydeck.jsx` into Illustrator's Scripts folder:

| System | Folder |
| --- | --- |
| Windows | `C:\Program Files\Adobe\Adobe Illustrator <version>\Presets\en_US\Scripts\` |
| macOS | `/Applications/Adobe Illustrator <version>/Presets.localized/en_US/Scripts/` |

The language folder depends on your Illustrator (`en_US`, `it_IT`, `fr_FR`, `de_DE`…). Restart Illustrator: the script appears in **File > Scripts > Copydeck**. Without installing it, use **File > Scripts > Other Script…** and choose the file.

### Keyboard shortcut

A shortcut is recommended, especially for the *Pick on artboard* workflow.

1. **Window > Actions**. Create a new set, then a new action.
2. As **Function Key** choose a free key, for example Ctrl+Shift+F12. Do not use F5–F9: Illustrator already uses them (F5 = Brushes) and they win.
3. Press **Record**, then in the Actions panel menu choose **Insert Menu Item…**, click **File > Scripts > Copydeck** and press OK. Stop recording.
4. Check that the action contains the Copydeck step: if it is missing, the key does nothing.

If the key stops working after restarting Illustrator, the script step was lost from the action (it happens): repeat step 3.

## 2. First run on a file

- Open the `.ai` file and run the script.
- Press **Choose data file…** and choose the variables file.
- The link to the data file is saved inside the `.ai` file: next time it reloads by itself. If the data file is moved, the script says so and you just choose it again.
- If the file contains several records, choose the right one in **Record**.
- Every time it opens, the script saves in the objects' Notes the bindings that do not have one yet (see [section 6](#bindings)). The status bar says how many it saved.

### Supported data files

**XML** – the Variable Library format of Illustrator (*Variables panel > Save Variable Library*). `<p>` = paragraph, `<br/>` = forced line break, `<b>` and `<i>` = bold and italic (if the font has those styles).

**CSV or tab-delimited TXT** – as used by Illustrator and by VariableImporter:

| Element | Meaning |
| --- | --- |
| first row | variable names |
| other rows | one record per row |
| `@name` | image variable (listed, managed by Illustrator) |
| `#name` | visibility variable (listed, managed by Illustrator) |
| `%name` | graph variable (listed, managed by Illustrator) |
| line break inside a cell, or `\\` | new paragraph |

The delimiter (comma, semicolon or tab) and the encoding (UTF-8, UTF-16 "Unicode Text" from Excel, Windows-1252) are detected automatically.

## 3. Reading the comparison

Tab **Variables and comparison**. Each row is a variable:

| Status | Meaning |
| --- | --- |
| ● To update | the text in the document differs from the file |
| ≈ Spaces/line breaks only | only spaces or line breaks differ |
| ≈ Case only | only upper/lower case differs |
| ○ Not bound | the variable exists but no object uses it |
| + New in file | only in the data file: create it and bind it |
| ! Not in file | in the document but not in the data file |
| ✓ Up to date | matches the file |

### How it compares

- Only the text. Bold, italic, underline, colours and other formatting never count.
- **Ignore spaces and line breaks** (on by default): "≈ Spaces/line breaks only" rows are not to update, and *Update all* skips them.
- **Ignore case** (off by default): the same for "≈ Case only" rows.
- A "≈" row can still be aligned with the file, one at a time, with **Make identical to file**.

### Using the list

- **Show** filters by status (also *Ignored differences*); **Search** searches name and text. Several words = all of them must be present.
- Click a row: below you see the current text, the text in the file and the **Will change** line with the part that will be modified.
- The **Last updated from** column tells from which file and when the variable was last updated with the script.
- Double-click a row: Illustrator goes to the object and selects it.

## 4. Updating

| To update | Do this |
| --- | --- |
| one variable | select the row > **Update this one** |
| some variables | Ctrl/Cmd+click or Shift+click the rows > **Update selected rows** |
| all variables | **Update all variables to update** (only the "● To update" ones) |
| go back | **Undo last update** |

### How it updates

- Only the words that differ change: bold and styles of the rest of the text stay as they were.
- With *Ignore spaces and line breaks* on, your manual line breaks and spaces stay where they are. Example: document "FLOUR⏎wheat (71%)", file "FLOUR wheat (70%)" → becomes "FLOUR⏎wheat (70%)".
- **Make identical to file** and values with `<b>`/`<i>` in the XML copy the text of the file exactly instead, line breaks included.
- If a variable is bound to several objects, all of them are updated.
- Locked objects, or objects on locked or hidden layers, are updated anyway.

**Important:** the changes are already in the document. Save the `.ai` file.

## 5. Binding a variable to a text

### Automatic: Auto-match…

Available in the Variables and in the Text objects tab. It proposes in a list:

- **Bind** – unbound objects whose text matches the value of a variable in the file.
- **Extra copy** – objects with the same text as a variable already bound elsewhere.
- **Restore** – objects bound only through their Note (for example after pasting them from another file): binds them again in Illustrator's Variables panel too.

Only the safe rows are preselected. The doubtful ones (same value for several variables, very short values, extra copies) are listed but not selected: the **Note** column says why. Check, add or remove rows with Ctrl/Cmd+click, then press **Bind selected**. Double-click a row to see the object.

### By hand

The window blocks Illustrator while it is open. There are three ways:

**A) Pick on artboard** (the handiest): select the variable > **Pick on artboard…** > the window closes > click the text on the artboard > run the script again with the shortcut. The binding is completed automatically and the window reopens there.

**B) Select before opening**: select the text in Illustrator > run the script > choose the variable > **Bind to selected objects**.

**C) From the list** (tab **Text objects**): text objects on the left, variables on the right, each list with its own search box.

1. Search and choose the object (double-click to see it).
2. Search and choose the variable.
3. Press **Bind object and variable**.

The ★ marks likely pairs (object text equal to the variable's value in the file); rows with ★ go to the top. The object list shows at most 200 rows: if there are more, type in the search box to narrow down.

### Other actions

- **Unbind** – removes the binding (also the Note line).
- **Create variable** – for "New in file" rows.
- **New variable from this text…** – in the Text objects tab.
- **Delete variable** – removes it from the document (the text stays).

## 6. How bindings are saved {#bindings}

An object can be bound in two ways, and the script reads both:

- **Illustrator binding** – the one in the Variables panel. A variable has only one; it does not follow the object if you copy it to another file.
- **The line `VAR:variablename` in the object's Note** (Attributes panel) – written by the script, it travels with the object when you copy it. Do not delete or edit it by hand.

If an object has both and they name different variables, Illustrator's binding wins.

The Note line is written:

- when you bind an object with the script;
- every time the script opens, for the bindings that do not have it yet (made in the Variables panel or with earlier versions);
- for the same variable on several objects: the first uses Illustrator's binding, the others only the Note line.

### Copying artwork

**Within the same file**: the copy stays bound to the same variable and is updated together with the original. If a copy must no longer follow the variable, select it and press **Unbind**.

**To another file**:

1. In the source file open the script (it saves the missing Notes), close it and save the `.ai` file.
2. Copy and paste the artwork into the new file.
3. In the new file open the script: the objects are already bound. Choose the data file and press **Auto-match…**: the *Restore* rows recreate the bindings in the Variables panel too.

### Options

In the Text objects tab, bottom right:

- **Also bind in the Variables panel** – if off, new bindings are only in the Notes. The script works the same, but Illustrator's Variables panel does not see them.
- **Remember in Notes (for copying)** – if off, the script no longer writes Notes for new bindings nor at startup; the ones already written stay.

## 7. Good to know

| What | Where it is saved |
| --- | --- |
| link to the data file, update history | inside the `.ai` file (XMP metadata) |
| object bindings | Variables panel and objects' Notes |
| options and language | Illustrator preferences on this computer |

- In Illustrator's Variables panel the data set may show as "modified": that is normal, the script writes directly into the texts.
- If Illustrator stays busy for a while after closing the script, after many bindings, try closing the Variables panel before using the script. If that is not enough, turn off *Also bind in the Variables panel*.
- In case of an error, note the message and the line number and [open an issue on GitHub]({{ site.repository_url }}/issues).
