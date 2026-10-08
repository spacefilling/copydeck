/*
  Copydeck for Adobe Illustrator
  https://github.com/spacefilling/copydeck

  Keeps the artwork in sync with its copy deck. Links an Illustrator
  document to a variables data file (Illustrator
  "Variable Library" XML, CSV or tab-delimited TXT), compares the text in
  the document with the text in the file, and updates the variables one by
  one or all together.

  - Finds the variables already in the document and the text objects bound
    to them.
  - Remembers inside the .ai file (XMP metadata) which data file is linked
    and, for every variable, from which file and when it was last updated.
  - Binds and unbinds variables, also several objects per variable.
  - Replaces only the words that change, so the formatting of the rest of
    the text (and, optionally, manual spaces and line breaks) is kept.
  - User interface in English, Italian, French and German.

  Usage: File > Scripts > Other Script... and choose this file, or copy it
  into Illustrator's Scripts folder.

  Version 1.0.0 · by spacefiller

  Copyright (C) 2026 spacefiller

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

#target illustrator
#targetengine "Copydeck"

(function () {

var VERSION = "1.0.0";
var HOMEPAGE = "github.com/spacefilling/copydeck";
var MANUAL_URL = { en: "https://spacefilling.github.io/copydeck/manual/", it: "https://spacefilling.github.io/copydeck/it/manuale/",
                   fr: "https://spacefilling.github.io/copydeck/fr/manuel/", de: "https://spacefilling.github.io/copydeck/de/handbuch/" };
var PREF = "Copydeck_";
var LEGACY_PREF = null;   // preference prefix of an earlier private version, if any
var XMP_NS = "https://github.com/spacefilling/copydeck/ns/1.0/";
var XMP_PREFIX = "copydeck";
var XMP_PROP = "state";
// XMP state written by earlier private versions of the script, read once and migrated:
// [{ ns: "http://example.com/ns/1.0/", prefix: "old", prop: "state" }]
var LEGACY_XMP = [];
var TAG = "VAR:";
var LANGS = ["en", "it", "fr", "de"];
var LANG_NAMES = { en: "English", it: "Italiano", fr: "Français", de: "Deutsch" };

// ============================== LANGUAGE ==============================

var LANG = "en";
var I18N = {};   // translation tables, filled at the end of the file

function prefString(key) {
    try { return String(app.preferences.getStringPreference(PREF + key) || ""); } catch (e) { return ""; }
}

function loadLanguage() {
    var l = prefString("lang"), loc = "";
    if (!l) {
        try { loc = String(app.locale || ""); } catch (e) {}
        l = loc.substr(0, 2).toLowerCase();
    }
    LANG = (l === "en" || has(I18N, l)) ? l : "en";
}

function saveLanguage(l) {
    LANG = l;
    try { app.preferences.setStringPreference(PREF + "lang", l); } catch (e) {}
}

// L("Text with {0}", value): translated text with placeholders filled in.
function L(key) {
    var s = (I18N[LANG] && has(I18N[LANG], key)) ? I18N[LANG][key]
          : ((I18N.en && has(I18N.en, key)) ? I18N.en[key] : key), i;
    for (i = 1; i < arguments.length; i++) s = s.split("{" + (i - 1) + "}").join(String(arguments[i]));
    return s;
}

// Plural: P(n, "{0} object", "{0} objects")
function P(n, one, many) { return L(n === 1 ? one : many, n); }

var TOOL = "Copydeck";

var ST = {
    DIFF:    { key: "diff",    label: "● To update" },
    SPACES:  { key: "spaces",  label: "≈ Spaces/line breaks only" },
    CASE:    { key: "case",    label: "≈ Case only" },
    UNBOUND: { key: "unbound", label: "○ Not bound" },
    NEW:     { key: "new",     label: "+ New in file" },
    MISSING: { key: "missing", label: "! Not in file" },
    SAME:    { key: "same",    label: "✓ Up to date" },
    BOUND:   { key: "bound",   label: "✓ Bound" },
    OTHER:   { key: "other",   label: "– Other type" }
};

var doc = null;
var state = null;          // state saved in the document (XMP)
var xmpOk = true;
var xmlData = null;        // loaded data file (XML, CSV or TXT)
var dsIndex = 0;           // chosen record
var frames = [];           // text objects in the document
var rows = [];             // one row per variable
var rowMap = {};
var launchSel = {};        // indexes of the objects selected at launch
var undoStack = [];
var startupNotes = 0;      // bindings saved in the Notes at launch
var famCache = {};

// Memory between runs in the same Illustrator session (#targetengine keeps
// $.global alive): pending binding, window position, hint already shown.
var MEM = $.global.Copydeck || ($.global.Copydeck = {});

// Settings saved in Illustrator's preferences (1 = yes, 2 = no).
var SET = { useNative: true, saveTags: true, ignoreSpaces: true, ignoreCase: false };

function loadSettings() {
    var k, v;
    for (k in SET) {
        if (!SET.hasOwnProperty(k)) continue;
        v = 0;
        try { v = app.preferences.getIntegerPreference(PREF + k); } catch (e) {}
        if (v !== 1 && v !== 2 && LEGACY_PREF) { try { v = app.preferences.getIntegerPreference(LEGACY_PREF + k); } catch (e) {} }
        if (v === 1) SET[k] = true; else if (v === 2) SET[k] = false;
    }
    if (!SET.useNative) SET.saveTags = true;
}

function saveSetting(k, val) {
    SET[k] = val;
    try { app.preferences.setIntegerPreference(PREF + k, val ? 1 : 2); } catch (e) {}
}

function docKey() {
    try { return doc.fullName.fsName; } catch (e) { return "unsaved:" + doc.name; }
}


// ============================== UTILITIES ==============================

function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }

function pad2(n) { return (n < 10 ? "0" : "") + n; }

function nowStamp() {
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) +
        " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
}

function fmtYMD(y, m, d, rest) {
    if (LANG === "de") return d + "." + m + "." + y + rest;
    if (LANG === "en") return y + "-" + m + "-" + d + rest;
    return d + "/" + m + "/" + y + rest;
}

function fmtDate(d) {
    if (!d) return "";
    return fmtYMD(d.getFullYear(), pad2(d.getMonth() + 1), pad2(d.getDate()), " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()));
}

// "2026-10-08 05:40" -> local date format
function fmtStamp(s) {
    var m = /^(\d{4})-(\d\d)-(\d\d)(.*)$/.exec(s || "");
    return m ? fmtYMD(m[1], m[2], m[3], m[4]) : (s || "");
}

function oneLine(s, max) {
    s = String(s).replace(/\r\n|\r|\n/g, " ¶ ").replace(/\u0003/g, " ↵ ").replace(/\t/g, " ");
    if (max && s.length > max) s = s.substr(0, max - 1) + "…";
    return s;
}

function multiLine(s) {
    return String(s).replace(/\u0003/g, "↵\n").replace(/\r\n|\r/g, "\n");
}

// Key for "tolerant" comparisons: no spaces, line breaks or invisible
// characters; lower case if the option is on. Formatting (bold, italic,
// underline...) is never part of the comparison.
function cmpKey(s, ignoreCase) {
    s = String(s).replace(/[\s\u00A0\u0003\u00AD\u200B\uFEFF]+/g, "");
    return (ignoreCase === undefined ? SET.ignoreCase : ignoreCase) ? s.toLowerCase() : s;
}

function quoteJSON(s) {
    return '"' + s.replace(/[\\"\u0000-\u001F\u007F-\uFFFF]/g, function (c) {
        if (c === '"') return '\\"';
        if (c === "\\") return "\\\\";
        return "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4);
    }) + '"';
}

function toJSON(v) {
    var i, out, k;
    if (v === null || v === undefined) return "null";
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (typeof v === "string") return quoteJSON(v);
    if (v instanceof Array) {
        out = [];
        for (i = 0; i < v.length; i++) out.push(toJSON(v[i]));
        return "[" + out.join(",") + "]";
    }
    out = [];
    for (k in v) if (v.hasOwnProperty(k)) out.push(quoteJSON(k) + ":" + toJSON(v[k]));
    return "{" + out.join(",") + "}";
}

function fromJSON(s) {
    try { return eval("(" + s + ")"); } catch (e) { return null; }
}

function has(obj, k) { return Object.prototype.hasOwnProperty.call(obj, k); }

function isValidVarName(s) { return /^[A-Za-z_][A-Za-z0-9_.\-]*$/.test(s); }

// "flour soy" finds the texts that contain both words
function searchTerms(q) {
    q = trim(String(q)).toLowerCase();
    return q ? q.split(/\s+/) : [];
}

function matchAll(hay, terms) {
    for (var i = 0; i < terms.length; i++) if (hay.indexOf(terms[i]) < 0) return false;
    return true;
}

function errMsg(e) { return (e && e.message) ? e.message : String(e); }


// ============================== STATE IN THE DOCUMENT (XMP) ==============================

function loadXmpLib() {
    try {
        if (!ExternalObject.AdobeXMPScript) ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
        XMPMeta.registerNamespace(XMP_NS, XMP_PREFIX);
        for (var i = 0; i < LEGACY_XMP.length; i++) XMPMeta.registerNamespace(LEGACY_XMP[i].ns, LEGACY_XMP[i].prefix);
        return true;
    } catch (e) { return false; }
}

function emptyState() { return { v: 1, source: null, vars: {} }; }

function readState() {
    var st = emptyState(), xmp, prop = null, obj, i;
    xmpOk = loadXmpLib();
    if (!xmpOk) return st;
    try {
        xmp = new XMPMeta(doc.XMPString);
        prop = xmp.getProperty(XMP_NS, XMP_PROP);
        for (i = 0; !prop && i < LEGACY_XMP.length; i++) prop = xmp.getProperty(LEGACY_XMP[i].ns, LEGACY_XMP[i].prop);
        if (prop) {
            obj = fromJSON(String(prop.value));
            if (obj) {
                st.source = obj.source || null;
                st.vars = obj.vars || {};
            }
        }
    } catch (e) {}
    return st;
}

function writeState() {
    if (!xmpOk) return false;
    try {
        var xmp = new XMPMeta(doc.XMPString), i;
        xmp.setProperty(XMP_NS, XMP_PROP, toJSON(state));
        for (i = 0; i < LEGACY_XMP.length; i++) { try { xmp.deleteProperty(LEGACY_XMP[i].ns, LEGACY_XMP[i].prop); } catch (e2) {} }
        doc.XMPString = xmp.serialize(XMPConst.SERIALIZE_USE_COMPACT_FORMAT);
        return true;
    } catch (e) {
        xmpOk = false;
        alert(L("Cannot save the link information in the document:") + "\n" + errMsg(e), TOOL);
        return false;
    }
}


// ============================== READING XML ==============================

function decodeEntities(s) {
    return s.replace(/&(#x[0-9A-Fa-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/g, function (m, e) {
        if (e.charAt(0) === "#") {
            var code = e.charAt(1).toLowerCase() === "x" ? parseInt(e.substr(2), 16) : parseInt(e.substr(1), 10);
            return String.fromCharCode(code);
        }
        return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00A0" }[e];
    });
}

function getAttr(tag, name) {
    var m = new RegExp("\\b" + name + "\\s*=\\s*(\"([^\"]*)\"|'([^']*)')").exec(tag);
    if (!m) return null;
    return decodeEntities(m[2] !== undefined && m[2] !== "" ? m[2] : (m[3] || ""));
}

// Turns the content of a variable element into Illustrator text:
// <p> -> paragraphs separated by \r, <br/> -> forced line break, <b>/<i> -> styles.
function parseValue(inner) {
    var paras = [], m, pRe, body, text = "", runs = [], markup = false, p, tokRe, t, name, closing;
    var bold = 0, ital = 0, seg;

    // CDATA sections become plain text
    inner = inner.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, function (all, c) {
        return c.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    });

    pRe = /<(?:[\w.\-]+:)?p(?:\s[^>]*)?(?:\/>|>([\s\S]*?)<\/(?:[\w.\-]+:)?p\s*>)/g;
    while ((m = pRe.exec(inner)) !== null) paras.push(m[1] || "");
    if (paras.length === 0) paras.push(inner);

    for (p = 0; p < paras.length; p++) {
        if (p > 0) text += "\r";
        body = paras[p].replace(/[\r\n]+[ \t]*/g, " ");
        tokRe = /<(\/?)(?:[\w.\-]+:)?([\w.\-]+)[^>]*?(\/?)>|([^<]+)/g;
        while ((t = tokRe.exec(body)) !== null) {
            if (t[4] !== undefined && t[4] !== "") {
                seg = decodeEntities(t[4]);
                if ((bold || ital) && seg.length) runs.push({ start: text.length, end: text.length + seg.length, b: bold > 0, i: ital > 0 });
                text += seg;
                continue;
            }
            name = String(t[2]).toLowerCase();
            closing = t[1] === "/";
            if (name === "br") { text += "\u0003"; continue; }
            if (t[3] === "/") continue;
            if (name === "b" || name === "strong") { markup = true; bold += closing ? -1 : 1; if (bold < 0) bold = 0; }
            else if (name === "i" || name === "em") { markup = true; ital += closing ? -1 : 1; if (ital < 0) ital = 0; }
        }
    }
    return { text: text, runs: runs, markup: markup };
}

function parseXmlFile(file) {
    var src, vars = [], varIndex = {}, datasets = [], m, re, tag, name, trait, dsRe, ds, elRe, el, values;

    src = readTextAny(file).replace(/^\uFEFF/, "");

    re = /<(?:[\w.\-]+:)?variable\b[^>]*>/g;
    while ((m = re.exec(src)) !== null) {
        tag = m[0];
        name = getAttr(tag, "varName");
        if (!name || has(varIndex, "#" + name)) continue;
        trait = getAttr(tag, "trait") || "textcontent";
        varIndex["#" + name] = vars.length;
        vars.push({ name: name, trait: trait });
    }

    dsRe = /<((?:[\w.\-]+:)?)sampleDataSet\b([^>]*)>([\s\S]*?)<\/\1sampleDataSet\s*>/g;
    while ((ds = dsRe.exec(src)) !== null) {
        values = {};
        elRe = /<((?:[\w.\-]+:)?([\w.\-]+))(\s[^>]*)?(?:\/>|>([\s\S]*?)<\/\1\s*>)/g;
        while ((el = elRe.exec(ds[3])) !== null) {
            values["#" + el[2]] = parseValue(el[4] || "");
        }
        datasets.push({ name: getAttr("<x " + ds[2] + ">", "dataSetName") || L("Record {0}", datasets.length + 1), values: values });
    }

    if (vars.length === 0) throw new Error(L("The file contains no variables (<variable varName=\"…\">).\nIs it an Illustrator Variable Library file?"));
    if (datasets.length === 0) throw new Error(L("The file contains no records with values (<sampleDataSet>)."));

    return { file: file, path: file.fsName, name: decodeURI(file.name), modified: file.modified, vars: vars, varIndex: varIndex, datasets: datasets };
}


// ============================== READING CSV / TXT ==============================

// Windows-1252 characters (Excel "CSV" on Windows) that differ from Latin-1.
var CP1252 = {
    128: 0x20AC, 130: 0x201A, 131: 0x0192, 132: 0x201E, 133: 0x2026, 134: 0x2020, 135: 0x2021, 136: 0x02C6,
    137: 0x2030, 138: 0x0160, 139: 0x2039, 140: 0x0152, 142: 0x017D, 145: 0x2018, 146: 0x2019, 147: 0x201C,
    148: 0x201D, 149: 0x2022, 150: 0x2013, 151: 0x2014, 152: 0x02DC, 153: 0x2122, 154: 0x0161, 155: 0x203A,
    156: 0x0153, 158: 0x017E, 159: 0x0178
};

// Reads a text file detecting its encoding: UTF-16 (Excel "Unicode Text"),
// UTF-8 with or without BOM, otherwise Windows-1252.
function readTextAny(file) {
    var raw, b0, b1, le, parts = [], i, c;
    file.encoding = "BINARY";
    if (!file.open("r")) throw new Error(L("Cannot open the file:") + " " + file.error);
    raw = file.read();
    file.close();
    b0 = raw.charCodeAt(0);
    b1 = raw.charCodeAt(1);
    if ((b0 === 0xFF && b1 === 0xFE) || (b0 === 0xFE && b1 === 0xFF)) {
        le = b0 === 0xFF;
        for (i = 2; i + 1 < raw.length; i += 2) {
            parts.push(String.fromCharCode(le ? (raw.charCodeAt(i) | (raw.charCodeAt(i + 1) << 8))
                                              : ((raw.charCodeAt(i) << 8) | raw.charCodeAt(i + 1))));
        }
        return parts.join("");
    }
    if (raw.charCodeAt(0) === 0xEF && raw.charCodeAt(1) === 0xBB && raw.charCodeAt(2) === 0xBF) raw = raw.substr(3);
    try { return decodeURIComponent(escape(raw)); } catch (e) {}
    for (i = 0; i < raw.length; i++) {
        c = raw.charCodeAt(i);
        parts.push(String.fromCharCode(CP1252[c] || c));
    }
    return parts.join("");
}

function countChar(s, ch) {
    var n = 0, i = -1;
    while ((i = s.indexOf(ch, i + 1)) >= 0) n++;
    return n;
}

// Splits delimited text into rows and cells. Handles quoted cells, doubled
// quotes and line breaks inside cells.
function parseDelimited(text, delim) {
    var rows = [], row = [], n = text.length, i = 0, j, k, c, cell;
    while (i <= n) {
        if (text.charAt(i) === '"') {
            cell = "";
            j = i + 1;
            while (true) {
                k = text.indexOf('"', j);
                if (k < 0) { cell += text.substring(j); i = n; break; }
                cell += text.substring(j, k);
                if (text.charAt(k + 1) === '"') { cell += '"'; j = k + 2; continue; }
                i = k + 1;
                break;
            }
            while (i < n) {
                c = text.charAt(i);
                if (c === delim || c === "\r" || c === "\n") break;
                cell += c;
                i++;
            }
        } else {
            j = i;
            while (j < n) {
                c = text.charAt(j);
                if (c === delim || c === "\r" || c === "\n") break;
                j++;
            }
            cell = text.substring(i, j);
            i = j;
        }
        row.push(cell);
        if (i >= n) { rows.push(row); break; }
        c = text.charAt(i);
        if (c === delim) {
            i++;
            if (i >= n) { row.push(""); rows.push(row); break; }
            continue;
        }
        rows.push(row);
        row = [];
        if (c === "\r" && text.charAt(i + 1) === "\n") i++;
        i++;
        if (i >= n) break;
    }
    return rows;
}

// CSV/TXT in the format used by Illustrator and by VariableImporter: the
// first row holds the variable names (@ = image, # = visibility,
// % = graph, no prefix = text), every following row is a record.
function parseTableFile(file, ext) {
    var text = readTextAny(file), first, counts, delim, rows, clean = [], header, cols = [], vars = [], varIndex = {};
    var datasets = [], i, j, h, prefix, trait, name, values, cell, label, any;

    first = text.split(/\r\n|\r|\n/)[0] || "";
    counts = { "\t": countChar(first, "\t"), ";": countChar(first, ";"), ",": countChar(first, ",") };
    // delimiter: the most frequent one in the first row (ties: comma for
    // .csv, tab for .txt)
    delim = ext === "csv" ? "," : "\t";
    if (counts["\t"] > counts[delim]) delim = "\t";
    if (counts[";"] > counts[delim]) delim = ";";
    if (counts[","] > counts[delim]) delim = ",";

    rows = parseDelimited(text, delim);
    for (i = 0; i < rows.length; i++) {
        any = false;
        for (j = 0; j < rows[i].length; j++) if (trim(rows[i][j]) !== "") { any = true; break; }
        if (any) clean.push(rows[i]);
    }
    if (clean.length === 0) throw new Error(L("The file is empty."));

    header = clean[0];
    for (j = 0; j < header.length; j++) {
        h = trim(header[j]).replace(/^'/, "");
        cols.push(null);
        if (h === "") continue;
        prefix = h.charAt(0);
        trait = prefix === "@" ? "fileref" : (prefix === "#" ? "visibility" : (prefix === "%" ? "graphdata" : "textcontent"));
        name = trait === "textcontent" ? h : trim(h.substr(1));
        if (name === "" || has(varIndex, "#" + name)) continue;
        varIndex["#" + name] = vars.length;
        vars.push({ name: name, trait: trait });
        cols[j] = { name: name, trait: trait };
    }
    if (vars.length === 0) throw new Error(L("The first row of the file must contain the variable names."));
    if (clean.length < 2) throw new Error(L("The file only contains the row of names: the rows with the values are missing."));

    for (i = 1; i < clean.length; i++) {
        values = {};
        label = "";
        for (j = 0; j < cols.length; j++) {
            if (!cols[j]) continue;
            cell = j < clean[i].length ? clean[i][j] : "";
            if (cols[j].trait === "textcontent") {
                // line break inside the cell, or "\\" as in VariableImporter -> new paragraph
                cell = cell.replace(/\r\n|\n|\r/g, "\r").replace(/\\\\/g, "\r");
                if (label === "" && trim(cell) !== "") label = oneLine(cell, 40);
            }
            values["#" + cols[j].name] = { text: cell, runs: [], markup: false };
        }
        datasets.push({ name: L("Row {0}", i + 1) + (label ? " · " + label : ""), values: values });
    }

    return { file: file, path: file.fsName, name: decodeURI(file.name), modified: file.modified, vars: vars, varIndex: varIndex, datasets: datasets };
}

function parseDataFile(file) {
    var m = /\.([^.]+)$/.exec(decodeURI(file.name)), ext = m ? m[1].toLowerCase() : "";
    if (ext === "xml") return parseXmlFile(file);
    if (ext === "csv" || ext === "txt" || ext === "tsv") return parseTableFile(file, ext);
    // unknown extension: look at the content
    return /^\s*</.test(readTextAny(file)) ? parseXmlFile(file) : parseTableFile(file, ext);
}

function loadData(file, preferredName, preferredIndex) {
    var data, i, byName = -1;
    try { data = parseDataFile(file); }
    catch (e) { alert(L("Error reading {0}:", decodeURI(file.name)) + "\n\n" + errMsg(e), TOOL); return false; }
    xmlData = data;
    for (i = 0; i < data.datasets.length; i++) if (data.datasets[i].name === preferredName) { byName = i; break; }
    if (byName >= 0) dsIndex = byName;
    else if (typeof preferredIndex === "number" && preferredIndex >= 0 && preferredIndex < data.datasets.length) dsIndex = preferredIndex;
    else dsIndex = 0;
    return true;
}

function currentDataSetName() {
    return xmlData ? xmlData.datasets[dsIndex].name : "";
}


// ============================== READING THE DOCUMENT ==============================

function getBoards() {
    var out = [];
    for (var i = 0; i < doc.artboards.length; i++) out.push(doc.artboards[i].artboardRect);
    return out;
}

function boardOf(tf, boards) {
    var b, cx, cy, i, r;
    try { b = tf.visibleBounds; } catch (e) { return 0; }
    cx = (b[0] + b[2]) / 2; cy = (b[1] + b[3]) / 2;
    for (i = 0; i < boards.length; i++) {
        r = boards[i];
        if (cx >= r[0] && cx <= r[2] && cy <= r[1] && cy >= r[3]) return i + 1;
    }
    return 0;
}

function readNote(item) { try { return String(item.note || ""); } catch (e) { return ""; } }

function readTag(item) {
    var m = /(?:^|[\r\n])VAR:([^\r\n]+)/.exec(readNote(item));
    return m ? trim(m[1]) : null;
}

function stripTag(note) {
    return trim(note.replace(/(^|[\r\n])VAR:[^\r\n]*/g, "$1").replace(/[\r\n]{2,}/g, "\r"));
}

function scanFrames(first) {
    var out = [], tfs = doc.textFrames, n = tfs.length, boards = getBoards(), i, tf, r, cv;
    for (i = 0; i < n; i++) {
        tf = tfs[i];
        r = { i: i, tf: tf, nativeVar: null, tagVar: null, hasTag: false, text: "", layer: "", name: "", board: 0 };
        try { r.text = String(tf.contents); } catch (e) {}
        try { cv = tf.contentVariable; if (cv && cv.name) r.nativeVar = String(cv.name); } catch (e) {}
        r.tagVar = readTag(tf);
        if (r.tagVar && r.nativeVar) {
            // the note is a memory of the Illustrator binding; if it names a
            // different variable, Illustrator wins (the note is rewritten later)
            r.hasTag = r.tagVar === r.nativeVar;
            r.tagVar = null;
        }
        try { r.layer = String(tf.layer.name); } catch (e) {}
        try { r.name = String(tf.name); } catch (e) {}
        r.board = boardOf(tf, boards);
        if (first) { try { if (tf.selected) launchSel[i] = true; } catch (e) {} }
        out.push(r);
    }
    return out;
}

function frameVar(r) { return r.nativeVar || r.tagVar; }

function findDocVar(name) {
    var vs = doc.variables, n = vs.length;
    for (var i = 0; i < n; i++) if (vs[i].name === name) return vs[i];
    return null;
}

function isTextual(row) {
    if (row.inDoc) return row.kind === VariableKind.TEXTUAL;
    return !row.xmlTrait || row.xmlTrait === "textcontent";
}

function getRow(name) {
    if (!has(rowMap, "#" + name)) {
        var r = { name: name, inDoc: false, kind: null, inXml: false, xmlTrait: null, xml: null, items: [], status: null };
        rowMap["#" + name] = r;
        rows.push(r);
    }
    return rowMap["#" + name];
}

function buildRows() {
    var i, r, v, f, ds, docVars, nVars;
    rows = []; rowMap = {};

    if (xmlData) {
        ds = xmlData.datasets[dsIndex];
        for (i = 0; i < xmlData.vars.length; i++) {
            r = getRow(xmlData.vars[i].name);
            r.inXml = true;
            r.xmlTrait = xmlData.vars[i].trait;
            r.xml = has(ds.values, "#" + r.name) ? ds.values["#" + r.name] : { text: "", runs: [], markup: false };
        }
    }
    docVars = doc.variables;
    nVars = docVars.length;
    for (i = 0; i < nVars; i++) {
        v = docVars[i];
        r = getRow(String(v.name));
        r.inDoc = true;
        r.kind = v.kind;
    }
    for (i = 0; i < frames.length; i++) {
        f = frames[i];
        if (f.nativeVar) getRow(f.nativeVar).items.push({ rec: f, isNative: true });
        if (f.tagVar) getRow(f.tagVar).items.push({ rec: f, isNative: false });
    }
    for (i = 0; i < rows.length; i++) rows[i].status = computeStatus(rows[i]);
}

function computeStatus(r) {
    var i, t, x, worst = 0, lvl;
    if (!isTextual(r)) return ST.OTHER;
    if (xmlData && !r.inXml) return ST.MISSING;
    if (!r.inDoc && r.items.length === 0) return ST.NEW;
    if (r.items.length === 0) return ST.UNBOUND;
    if (!xmlData) return ST.BOUND;
    x = r.xml.text;
    // 0 = identical, 1 = spaces/line breaks only, 2 = case only, 3 = different
    for (i = 0; i < r.items.length; i++) {
        t = r.items[i].rec.text;
        if (t === x) lvl = 0;
        else if (cmpKey(t, false) === cmpKey(x, false)) lvl = 1;
        else if (SET.ignoreCase && cmpKey(t, true) === cmpKey(x, true)) lvl = 2;
        else lvl = 3;
        if (lvl > worst) worst = lvl;
    }
    return [ST.SAME, ST.SPACES, ST.CASE, ST.DIFF][worst];
}

// To update: the text really changes (or spaces/line breaks change, when
// they are not ignored).
function needsUpdate(r) { return r.status === ST.DIFF || (r.status === ST.SPACES && !SET.ignoreSpaces); }

// Ignored differences: can still be made identical to the file by hand.
function isMinor(r) { return (r.status === ST.SPACES && SET.ignoreSpaces) || r.status === ST.CASE; }

function canUpdate(r) { return needsUpdate(r) || isMinor(r); }

function refreshData(first) {
    frames = scanFrames(first);
    buildRows();
}


// ============================== EDITING TEXT ==============================

// Temporarily unlocks/shows the object and the layers/groups containing
// it, runs fn and puts everything back.
function withUnlocked(item, fn) {
    var restore = [], chain = [], p = null, i;
    function set(obj, prop, val) {
        try {
            if (obj[prop] !== val) {
                var old = obj[prop];
                obj[prop] = val;
                restore.push([obj, prop, old]);
            }
        } catch (e) {}
    }
    try { p = item.parent; } catch (e) {}
    while (p && p.typename !== "Document") {
        chain.push(p);
        try { p = p.parent; } catch (e) { p = null; }
    }
    for (i = chain.length - 1; i >= 0; i--) {
        if (chain[i].typename === "Layer") { set(chain[i], "locked", false); set(chain[i], "visible", true); }
        else { set(chain[i], "locked", false); set(chain[i], "hidden", false); }
    }
    set(item, "locked", false);
    set(item, "hidden", false);
    try { return fn(); }
    finally {
        for (i = restore.length - 1; i >= 0; i--) {
            try { restore[i][0][restore[i][1]] = restore[i][2]; } catch (e) {}
        }
    }
}

function replaceRange(tf, p, n, expectOld, str) {
    var r = null, c, k;
    try {
        r = tf.textRange.characters[p];
        if (n > 1) r.length = n;
        if (String(r.contents) !== expectOld) r = null;
    } catch (e) { r = null; }
    if (r) {
        if (str === "") r.remove(); else r.contents = str;
        return true;
    }
    // Fallback: delete the characters one by one and replace the first one.
    if (n > 3000) return false;
    if (String(tf.textRange.characters[p].contents) !== expectOld.charAt(0)) return false;
    for (k = p + n - 1; k > p; k--) tf.textRange.characters[k].remove();
    c = tf.textRange.characters[p];
    if (str === "") c.remove(); else c.contents = str;
    return true;
}

function wordList(s) {
    var out = [], re = /[^\s\u00A0\u0003]+/g, m;
    while ((m = re.exec(s)) !== null) out.push({ s: m.index, e: m.index + m[0].length, t: m[0] });
    return out;
}

function wordKey(w, ignoreCase) {
    w = w.replace(/[\u00AD\u200B\uFEFF]/g, "");
    return ignoreCase ? w.toLowerCase() : w;
}

// Pairs [i, j] of equal words in A and B, in order (common subsequence).
function matchWords(A, B, ignoreCase) {
    var n = A.length, m = B.length, ka = [], kb = [], pairs = [], p = 0, q = 0, i, j, n2, m2, W, T, x, y;
    for (i = 0; i < n; i++) ka.push(wordKey(A[i].t, ignoreCase));
    for (j = 0; j < m; j++) kb.push(wordKey(B[j].t, ignoreCase));
    while (p < n && p < m && ka[p] === kb[p]) { pairs.push([p, p]); p++; }
    while (q < n - p && q < m - p && ka[n - 1 - q] === kb[m - 1 - q]) q++;
    n2 = n - p - q; m2 = m - p - q;
    if (n2 > 0 && m2 > 0 && n2 * m2 <= 250000) {
        W = m2 + 1;
        T = [];
        for (i = n2 - 1; i >= 0; i--) {
            for (j = m2 - 1; j >= 0; j--) {
                if (ka[p + i] === kb[p + j]) T[i * W + j] = (T[(i + 1) * W + j + 1] || 0) + 1;
                else { x = T[(i + 1) * W + j] || 0; y = T[i * W + j + 1] || 0; T[i * W + j] = x >= y ? x : y; }
            }
        }
        i = 0; j = 0;
        while (i < n2 && j < m2) {
            if (ka[p + i] === kb[p + j]) { pairs.push([p + i, p + j]); i++; j++; }
            else if ((T[(i + 1) * W + j] || 0) >= (T[i * W + j + 1] || 0)) i++;
            else j++;
        }
    }
    for (i = q - 1; i >= 0; i--) pairs.push([n - 1 - i, m - 1 - i]);
    return pairs;
}

function leadWs(s) { var m = /^[\s\u00A0\u0003]*/.exec(s); return m ? m[0] : ""; }
function trailWs(s) { var m = /[\s\u00A0\u0003]*$/.exec(s); return m ? m[0] : ""; }
function trimWs(s) { return s.replace(/^[\s\u00A0\u0003]+|[\s\u00A0\u0003]+$/g, ""); }

// Plans the update: compares word by word and returns the edits (hunks)
// to apply to the current text, and the resulting text.
// keepSpaces: unchanged words keep the document's spaces and line breaks.
// ignoreCase: words that differ only in case stay as they are.
function planUpdate(old, xml, keepSpaces, ignoreCase) {
    var A = wordList(old), B = wordList(xml), pairs = matchWords(A, B, ignoreCase), hunks = [];
    var k, a1, b1, pa = -1, pb = -1, oFrom, oTo, oReg, nReg, wO, wN, inner, before, after, rep, target, h;
    pairs.push([A.length, B.length]);
    for (k = 0; k < pairs.length; k++) {
        a1 = pairs[k][0]; b1 = pairs[k][1];
        oFrom = pa < 0 ? 0 : A[pa].e;
        oTo = a1 < A.length ? A[a1].s : old.length;
        oReg = old.substring(oFrom, oTo);
        nReg = xml.substring(pb < 0 ? 0 : B[pb].e, b1 < B.length ? B[b1].s : xml.length);
        wO = a1 - pa > 1;
        wN = b1 - pb > 1;
        if (!wO && !wN) rep = keepSpaces ? oReg : nReg;
        else if (!keepSpaces) rep = nReg;
        else {
            inner = trimWs(nReg);
            if (inner !== "") {
                before = pa >= 0 ? (leadWs(oReg) || leadWs(nReg) || " ") : leadWs(oReg);
                after = a1 < A.length ? (wO ? (trailWs(oReg) || trailWs(nReg) || " ") : (trailWs(nReg) || " ")) : (wO ? trailWs(oReg) : "");
                rep = before + inner + after;
            } else if (pa >= 0 && a1 < A.length) rep = leadWs(oReg) || trailWs(oReg) || nReg || " ";
            else if (pa < 0) rep = leadWs(oReg);
            else rep = trailWs(oReg);
        }
        if (rep !== oReg) hunks.push({ pos: oFrom, len: oTo - oFrom, str: rep });
        pa = a1; pb = b1;
    }
    target = old;
    for (k = hunks.length - 1; k >= 0; k--) {
        h = hunks[k];
        target = target.substr(0, h.pos) + h.str + target.substr(h.pos + h.len);
    }
    return { hunks: hunks, target: target };
}

function applyHunk(tf, old, h) {
    var p = h.pos, n = h.len, str = h.str, oSub = old.substr(p, n), a = 0, b = 0, lim = Math.min(oSub.length, str.length);
    while (a < lim && oSub.charAt(a) === str.charAt(a)) a++;
    while (b < lim - a && oSub.charAt(oSub.length - 1 - b) === str.charAt(str.length - 1 - b)) b++;
    p += a;
    n -= a + b;
    str = str.substring(a, str.length - b);
    if (n === 0) {
        // pure insertion: widen by one existing character
        if (p > 0) { p--; str = old.charAt(p) + str; }
        else { str = str + old.charAt(0); }
        n = 1;
    }
    return replaceRange(tf, p, n, old.substr(p, n), str);
}

// Updates the object's text changing only the words that differ: the rest
// keeps its formatting (bold, colours, etc.).
function replaceText(tf, newText, keepSpaces, ignoreCase) {
    var old = String(tf.contents), plan, i, ok = true, now = "";
    if (old === newText) return "same";
    if (old.length === 0 || newText.length === 0) { tf.contents = newText; return "full"; }
    plan = planUpdate(old, newText, !!keepSpaces, !!ignoreCase);
    if (plan.target === old) return "same";
    try {
        for (i = plan.hunks.length - 1; i >= 0 && ok; i--) ok = applyHunk(tf, old, plan.hunks[i]);
    } catch (e) { ok = false; }
    try { now = String(tf.contents); } catch (e) {}
    if (!ok || now !== plan.target) { tf.contents = plan.target; return "full"; }
    return "partial";
}

function styledFont(base, bold, italic) {
    var fam, key, list, i, f, st, isB, isI, score, best = null, bestScore = 0, pref;
    try { fam = base.family; } catch (e) { return null; }
    key = "#" + fam;
    if (!has(famCache, key)) {
        list = [];
        for (i = 0; i < app.textFonts.length; i++) {
            try { if (app.textFonts[i].family === fam) list.push(app.textFonts[i]); } catch (e) {}
        }
        famCache[key] = list;
    }
    list = famCache[key];
    pref = bold && italic ? /^bold\s*(italic|oblique)$/i : (bold ? /^bold$/i : /^(italic|oblique)$/i);
    for (i = 0; i < list.length; i++) {
        f = list[i];
        st = String(f.style);
        isB = /bold|black|heavy|demi/i.test(st);
        isI = /italic|oblique/i.test(st);
        if (isB !== bold || isI !== italic) continue;
        score = pref.test(st) ? 2 : 1;
        if (score > bestScore) { best = f; bestScore = score; }
    }
    return best;
}

// Applies the bold/italic marked in the XML with <b>/<i>.
function applyRuns(tf, val) {
    var base, i, k, run, f, missing = 0;
    if (!val.markup) return 0;
    try { base = tf.textRange.characters[0].characterAttributes.textFont; } catch (e) { return 0; }
    try { tf.textRange.characterAttributes.textFont = base; } catch (e) {}
    for (i = 0; i < val.runs.length; i++) {
        run = val.runs[i];
        f = styledFont(base, run.b, run.i);
        if (!f) { missing++; continue; }
        for (k = run.start; k < run.end; k++) {
            try { tf.textRange.characters[k].characterAttributes.textFont = f; } catch (e) {}
        }
    }
    return missing;
}


// ============================== BINDINGS ==============================

function writeTag(tf, name) {
    var note = stripTag(readNote(tf));
    tf.note = note ? note + "\r" + TAG + name : TAG + name;
}

function removeTag(tf) { tf.note = stripTag(readNote(tf)); }

function ensureDocVar(name) {
    var v = findDocVar(name);
    if (v) return v;
    v = doc.variables.add();
    v.kind = VariableKind.TEXTUAL;
    v.name = name;
    return v;
}

function nativeNameOf(tf) {
    try { var cv = tf.contentVariable; return (cv && cv.name) ? String(cv.name) : null; } catch (e) { return null; }
}

function bindNative(rec, v) {
    withUnlocked(rec.tf, function () { try { rec.tf.contentVariable = v; } catch (e) {} });
    if (nativeNameOf(rec.tf) === String(v.name)) { rec.nativeVar = String(v.name); return true; }
    return false;
}

// Writes the line "VAR:name" in the object's Note. It travels with the
// object when it is copied: used to re-bind it elsewhere or in another file.
function memorizeTag(rec, name) {
    withUnlocked(rec.tf, function () { writeTag(rec.tf, name); });
    rec.hasTag = true;
}

// Binds the object to the variable. The first object uses Illustrator's
// binding (if enabled in the options); extra objects, or all of them when
// Illustrator's binding is disabled, are bound by the script through the
// object's Note.
function bindFrame(rec, name) {
    var v, i, taken = false;
    if (frameVar(rec) === name) {
        if (rec.nativeVar === name && SET.saveTags && !rec.hasTag) memorizeTag(rec, name);
        return "already";
    }
    unbindFrame(rec, false);
    v = ensureDocVar(name);
    if (SET.useNative) {
        for (i = 0; i < frames.length; i++) if (frames[i] !== rec && frames[i].nativeVar === name) { taken = true; break; }
        if (!taken && bindNative(rec, v)) {
            if (SET.saveTags) memorizeTag(rec, name);
            return "illustrator";
        }
    }
    withUnlocked(rec.tf, function () { writeTag(rec.tf, name); });
    rec.tagVar = name;
    rec.hasTag = false;
    return "script";
}

// Turns a script binding into an Illustrator binding, keeping the note as
// memory (e.g. after pasting the artwork into another file).
function promoteToNative(rec) {
    var name = rec.tagVar;
    if (!name || rec.nativeVar) return false;
    if (!bindNative(rec, ensureDocVar(name))) return false;
    rec.tagVar = null;
    rec.hasTag = true;
    return true;
}

// At launch: saves in the Notes the Illustrator bindings that do not have
// one yet (made in the Variables panel or with earlier versions).
function memorizeMissingTags() {
    var i, n = 0;
    if (!SET.saveTags) return 0;
    for (i = 0; i < frames.length; i++) {
        if (frames[i].nativeVar && !frames[i].hasTag) {
            try { memorizeTag(frames[i], frames[i].nativeVar); n++; } catch (e) {}
        }
    }
    return n;
}

function unbindFrame(rec, noPromote) {
    var name = rec.nativeVar, v, others = [], i, nv;
    if (rec.tagVar || rec.hasTag) {
        withUnlocked(rec.tf, function () { removeTag(rec.tf); });
        rec.tagVar = null;
        rec.hasTag = false;
    }
    if (!name) return true;

    withUnlocked(rec.tf, function () {
        try { rec.tf.contentVariable = null; } catch (e) {}
        if (nativeNameOf(rec.tf)) { try { rec.tf.contentVariable = undefined; } catch (e2) {} }
    });

    if (nativeNameOf(rec.tf)) {
        // Last resort: recreate the variable (unbinds everything) and re-bind the others.
        for (i = 0; i < frames.length; i++) if (frames[i] !== rec && frames[i].nativeVar === name) others.push(frames[i]);
        v = findDocVar(name);
        if (v) {
            v.remove();
            nv = ensureDocVar(name);
            for (i = 0; i < others.length; i++) bindNative(others[i], nv);
        }
    }
    if (nativeNameOf(rec.tf)) return false;
    rec.nativeVar = null;

    if (!noPromote && SET.useNative) {
        // if script bindings remain, one of them becomes the Illustrator binding
        for (i = 0; i < frames.length; i++) {
            if (frames[i].tagVar === name) { promoteToNative(frames[i]); break; }
        }
    }
    return true;
}

function revealFrame(rec) {
    var b, cx, cy;
    try { doc.selection = null; } catch (e) {}
    if (rec.board > 0) { try { doc.artboards.setActiveArtboardIndex(rec.board - 1); } catch (e) {} }
    try {
        b = rec.tf.visibleBounds;
        cx = (b[0] + b[2]) / 2; cy = (b[1] + b[3]) / 2;
        doc.activeView.centerPoint = [cx, cy];
    } catch (e) {}
    try { rec.tf.selected = true; } catch (e) {}
    app.redraw();
}


// ============================== USER INTERFACE ==============================

function addRow(lb, cols) {
    var it = lb.add("item", cols[0]);
    for (var c = 1; c < cols.length; c++) it.subItems[c - 1].text = cols[c];
    return it;
}

function selectedItems(lb) {
    var s = lb.selection;
    if (!s) return [];
    if (s instanceof Array) return s;
    if (typeof s.length === "number" && s.index === undefined) return s;
    return [s];
}

function boldFont(el, size) {
    try { el.graphics.font = ScriptUI.newFont(el.graphics.font.name, "BOLD", size || el.graphics.font.size); } catch (e) {}
}

function greyText(el) {
    try { el.graphics.foregroundColor = el.graphics.newPen(el.graphics.PenType.SOLID_COLOR, [0.55, 0.55, 0.55], 1); } catch (e) {}
}

function itemsLabel(r) {
    var scr = 0, i;
    for (i = 0; i < r.items.length; i++) if (!r.items[i].isNative) scr++;
    if (!r.items.length) return "—";
    return String(r.items.length) + (scr ? " " + L("({0} script)", scr) : "");
}

function originLabel(name) {
    var o = has(state.vars, name) ? state.vars[name] : null;
    if (!o) return "";
    return o.file + " · " + fmtStamp(o.date);
}

function diffSummary(a, b) {
    var p = 0, s = 0, lim = Math.min(a.length, b.length), ctx = 35, before, after, oldMid, newMid, change;
    while (p < lim && a.charAt(p) === b.charAt(p)) p++;
    while (s < lim - p && a.charAt(a.length - 1 - s) === b.charAt(b.length - 1 - s)) s++;
    before = (p > ctx ? "…" : "") + a.substring(Math.max(0, p - ctx), p);
    after = a.substr(a.length - s, ctx) + (s > ctx ? "…" : "");
    oldMid = a.substring(p, a.length - s);
    newMid = b.substring(p, b.length - s);
    if (oldMid.length > 160) oldMid = oldMid.substr(0, 159) + "…";
    if (newMid.length > 160) newMid = newMid.substr(0, 159) + "…";
    change = oldMid === "" ? "[+ «" + newMid + "»]" : (newMid === "" ? "[– «" + oldMid + "»]" : "[«" + oldMid + "» → «" + newMid + "»]");
    return oneLine(before + " " + change + " " + after);
}

function showHelp() {
    alert(L("@help") + "\n\n" + L("Full manual:") + " " + (MANUAL_URL[LANG] || MANUAL_URL.en) +
        "\n" + TOOL + " " + VERSION + "  ·  " + HOMEPAGE + "  ·  GPL-3.0 License", TOOL);
}

function buildUI() {
    var visRows = [], visFrames = [], visCols = [], pickerNames = [], busy = false, i;
    var MAX_OBJ_ROWS = 200;

    var w = new Window("dialog", TOOL + " " + VERSION.replace(/\.0$/, "") + "  —  " + doc.name, undefined, { resizeable: true });
    w.orientation = "column";
    w.alignChildren = ["fill", "top"];
    w.spacing = 10;
    w.margins = 14;

    // ---------- Data file ----------
    var pSrc = w.add("panel", undefined, L("Linked data file"));
    pSrc.alignChildren = ["fill", "top"];
    pSrc.margins = [12, 18, 12, 10];
    pSrc.spacing = 6;

    var gFile = pSrc.add("group");
    gFile.alignChildren = ["left", "center"];
    var tFileName = gFile.add("statictext", undefined, "", { truncate: "middle" });
    tFileName.preferredSize.width = 520;
    boldFont(tFileName);
    var bChoose = gFile.add("button", undefined, L("Choose data file…"));
    var bReload = gFile.add("button", undefined, L("Reload"));
    var bHelp = gFile.add("button", undefined, L("How it works"));
    var ddLang = gFile.add("dropdownlist", undefined, (function () { var a = []; for (var x = 0; x < LANGS.length; x++) a.push(LANG_NAMES[LANGS[x]]); return a; })());
    for (i = 0; i < LANGS.length; i++) if (LANGS[i] === LANG) ddLang.selection = i;
    ddLang.helpTip = "Language / Lingua / Langue / Sprache";

    var gFile2 = pSrc.add("group");
    gFile2.alignChildren = ["left", "center"];
    gFile2.add("statictext", undefined, L("Record:"));
    var ddSet = gFile2.add("dropdownlist", undefined, []);
    ddSet.preferredSize.width = 280;
    var tFileInfo = gFile2.add("statictext", undefined, "", { truncate: "end" });
    tFileInfo.preferredSize.width = 600;
    greyText(tFileInfo);

    var tSummary = pSrc.add("statictext", undefined, "");
    boldFont(tSummary);

    // ---------- Tabs ----------
    var tp = w.add("tabbedpanel");
    tp.alignChildren = ["fill", "fill"];
    tp.alignment = ["fill", "fill"];
    var tabV = tp.add("tab", undefined, "  " + L("Variables and comparison") + "  ");
    var tabO = tp.add("tab", undefined, "  " + L("Text objects") + "  ");

    // ---------- Variables tab ----------
    tabV.orientation = "column";
    tabV.alignChildren = ["fill", "top"];
    tabV.margins = [10, 12, 10, 10];
    tabV.spacing = 8;

    var gFilt = tabV.add("group");
    gFilt.alignChildren = ["left", "center"];
    gFilt.add("statictext", undefined, L("Show:"));
    var FILTERS = [
        [L("All"), null],
        [L("To update"), function (r) { return needsUpdate(r); }],
        [L("Not bound"), function (r) { return r.status === ST.UNBOUND; }],
        [L("New in file"), function (r) { return r.status === ST.NEW; }],
        [L("Not in file"), function (r) { return r.status === ST.MISSING; }],
        [L("Ignored differences"), function (r) { return isMinor(r); }],
        [L("Up to date"), function (r) { return r.status === ST.SAME || r.status === ST.BOUND || isMinor(r); }]
    ];
    var ddFilter = gFilt.add("dropdownlist", undefined, (function () { var a = []; for (var x = 0; x < FILTERS.length; x++) a.push(FILTERS[x][0]); return a; })());
    ddFilter.selection = 0;
    gFilt.add("statictext", undefined, "   " + L("Search:"));
    var etSearch = gFilt.add("edittext", undefined, "");
    etSearch.preferredSize.width = 200;
    var cbIgnSp = gFilt.add("checkbox", undefined, L("Ignore spaces and line breaks"));
    cbIgnSp.helpTip = L("Variables that differ only in spaces or line breaks are not marked as to update. When updating, the document's spaces and line breaks stay where they are. Bold, italic and other formatting never count in the comparison.");
    cbIgnSp.value = SET.ignoreSpaces;
    var cbIgnCase = gFilt.add("checkbox", undefined, L("Ignore case"));
    cbIgnCase.helpTip = L("Variables that differ only in upper/lower case are not marked as to update.");
    cbIgnCase.value = SET.ignoreCase;
    var tCount = gFilt.add("statictext", undefined, "", { truncate: "end" });
    tCount.preferredSize.width = 160;
    greyText(tCount);

    var lbV = tabV.add("listbox", undefined, [], {
        multiselect: true, numberOfColumns: 5, showHeaders: true,
        columnTitles: [L("Status"), L("Variable"), L("Objects"), L("Text in the document"), L("Last updated from")],
        columnWidths: [150, 190, 80, 380, 230]
    });
    lbV.preferredSize = [1060, 250];
    lbV.alignment = ["fill", "fill"];

    var gBulk = tabV.add("group");
    gBulk.alignChildren = ["left", "center"];
    var bUpdAll = gBulk.add("button", undefined, L("Update all variables to update"));
    var bUpdSel = gBulk.add("button", undefined, L("Update selected rows"));
    var bUndo = gBulk.add("button", undefined, L("Undo last update"));
    var bAuto = gBulk.add("button", undefined, L("Auto-match…"));
    bAuto.helpTip = L("Binds the variables to the text objects that already contain their value, and restores the bindings saved in the Notes (e.g. after copying the artwork).");
    bUpdSel.helpTip = L("Ctrl/Cmd+click or Shift+click to select several rows.");

    var pDet = tabV.add("panel", undefined, L("Details"));
    pDet.alignChildren = ["fill", "top"];
    pDet.margins = [12, 16, 12, 10];
    pDet.spacing = 6;
    var tDetTitle = pDet.add("statictext", undefined, L("Select a variable in the list."));
    boldFont(tDetTitle, 14);

    var gCmp = pDet.add("group");
    gCmp.alignChildren = ["fill", "top"];
    var gL = gCmp.add("group"); gL.orientation = "column"; gL.alignChildren = ["fill", "top"]; gL.spacing = 3;
    var tLeft = gL.add("statictext", undefined, L("Now in the document"));
    var etDoc = gL.add("edittext", undefined, "", { multiline: true, readonly: true, scrolling: true });
    etDoc.preferredSize = [520, 105];
    var gR = gCmp.add("group"); gR.orientation = "column"; gR.alignChildren = ["fill", "top"]; gR.spacing = 3;
    var tRight = gR.add("statictext", undefined, L("In the file"));
    var etXml = gR.add("edittext", undefined, "", { multiline: true, readonly: true, scrolling: true });
    etXml.preferredSize = [520, 105];

    var tDiff = pDet.add("statictext", undefined, " ", { multiline: true });
    tDiff.preferredSize = [1040, 34];
    var tDetInfo = pDet.add("statictext", undefined, " ", { multiline: true });
    tDetInfo.preferredSize = [1040, 34];
    greyText(tDetInfo);

    var gDetBtns = pDet.add("group");
    gDetBtns.alignChildren = ["left", "center"];
    var bUpdOne = gDetBtns.add("button", undefined, L("Update this one"));
    var bShow = gDetBtns.add("button", undefined, L("Show in document"));
    var bBindSel = gDetBtns.add("button", undefined, L("Bind to selected objects"));
    var bPickArt = gDetBtns.add("button", undefined, L("Pick on artboard…"));
    var bBindPick = gDetBtns.add("button", undefined, L("Bind from list…"));
    var bUnbind = gDetBtns.add("button", undefined, L("Unbind"));
    var bCreate = gDetBtns.add("button", undefined, L("Create variable"));
    var bDelete = gDetBtns.add("button", undefined, L("Delete variable"));

    // ---------- Text objects tab ----------
    tabO.orientation = "row";
    tabO.alignChildren = ["fill", "fill"];
    tabO.margins = [10, 12, 10, 10];
    tabO.spacing = 14;

    // left column: objects
    var gOL = tabO.add("group");
    gOL.orientation = "column";
    gOL.alignChildren = ["fill", "top"];
    gOL.alignment = ["fill", "fill"];
    gOL.spacing = 6;
    var tOTitle = gOL.add("statictext", undefined, L("1 · Choose the text object"));
    boldFont(tOTitle);

    var gOF = gOL.add("group");
    gOF.alignChildren = ["left", "center"];
    gOF.add("statictext", undefined, L("Search:"));
    var etOSearch = gOF.add("edittext", undefined, "");
    etOSearch.preferredSize.width = 260;
    etOSearch.helpTip = L("Searches the text, layer, name or bound variable. Several words = all of them must be present.");
    gOF.add("statictext", undefined, "  " + L("Show:"));
    var OFILTERS = [
        [L("All"), null],
        [L("Without variable"), function (f) { return !frameVar(f); }],
        [L("With variable"), function (f) { return !!frameVar(f); }],
        [L("Selected before opening"), function (f) { return !!launchSel[f.i]; }]
    ];
    var ddOFilter = gOF.add("dropdownlist", undefined, (function () { var a = []; for (var x = 0; x < OFILTERS.length; x++) a.push(OFILTERS[x][0]); return a; })());
    ddOFilter.selection = 0;

    var tOCount = gOL.add("statictext", undefined, "", { truncate: "end" });
    greyText(tOCount);

    var lbO = gOL.add("listbox", undefined, [], {
        multiselect: true, numberOfColumns: 6, showHeaders: true,
        columnTitles: ["★", L("Bound variable"), L("Link"), L("Layer"), L("Artb."), L("Text")],
        columnWidths: [28, 150, 72, 110, 40, 330]
    });
    lbO.preferredSize = [740, 330];
    lbO.alignment = ["fill", "fill"];

    var etOText = gOL.add("edittext", undefined, "", { multiline: true, readonly: true, scrolling: true });
    etOText.preferredSize = [740, 80];

    var gOBtns = gOL.add("group");
    gOBtns.alignChildren = ["left", "center"];
    var bOShow = gOBtns.add("button", undefined, L("Show in document"));
    var bOUnbind = gOBtns.add("button", undefined, L("Unbind"));

    // right column: variables
    var gOR = tabO.add("group");
    gOR.orientation = "column";
    gOR.alignChildren = ["fill", "top"];
    gOR.alignment = ["right", "fill"];
    gOR.spacing = 6;
    var tVTitle = gOR.add("statictext", undefined, L("2 · Choose the variable"));
    boldFont(tVTitle);
    var gVS = gOR.add("group");
    gVS.alignChildren = ["left", "center"];
    gVS.add("statictext", undefined, L("Search:"));
    var etVarSearch = gVS.add("edittext", undefined, "");
    etVarSearch.preferredSize.width = 250;
    etVarSearch.helpTip = L("Searches the variable name and its value in the file.");
    var lbVar = gOR.add("listbox", undefined, [], {
        multiselect: false, numberOfColumns: 3, showHeaders: true,
        columnTitles: ["★", L("Variable"), L("Obj.")],
        columnWidths: [28, 230, 50]
    });
    lbVar.preferredSize = [320, 220];
    lbVar.alignment = ["fill", "fill"];
    var tVarVal = gOR.add("statictext", undefined, " ", { multiline: true });
    tVarVal.preferredSize = [320, 64];
    greyText(tVarVal);

    var tStep3 = gOR.add("statictext", undefined, L("3 · Bind"));
    boldFont(tStep3);
    var bOBind = gOR.add("button", undefined, L("Bind object and variable"));
    var bOPickArt = gOR.add("button", undefined, L("Pick the object on the artboard…"));
    var bONew = gOR.add("button", undefined, L("New variable from this text…"));
    var bOAuto = gOR.add("button", undefined, L("Auto-match…"));
    var tOHint = gOR.add("statictext", undefined, L("★ = object text equal to the variable's value in the file. Double-click an object to see it."), { multiline: true });
    tOHint.preferredSize = [320, 34];
    greyText(tOHint);
    var tOpt = gOR.add("statictext", undefined, L("Options"));
    boldFont(tOpt);
    var cbNative = gOR.add("checkbox", undefined, L("Also bind in the Variables panel"));
    cbNative.helpTip = L("Also uses Illustrator's binding (visible in the Variables panel). If disabled, bindings belong to the script only, in the objects' Notes.");
    var cbTags = gOR.add("checkbox", undefined, L("Remember in Notes (for copying)"));
    cbTags.helpTip = L("Writes «VAR:name» in the object's Note: the binding survives when you copy the object or paste it into another file.");
    cbNative.value = SET.useNative;
    cbTags.value = SET.saveTags;
    cbTags.enabled = SET.useNative;

    // ---------- Footer ----------
    var gFoot = w.add("group");
    gFoot.alignChildren = ["left", "center"];
    var tStatus = gFoot.add("statictext", undefined, "", { truncate: "end" });
    tStatus.preferredSize.width = 820;
    var pb = gFoot.add("progressbar", undefined, 0, 100);
    pb.preferredSize = [150, 8];
    pb.visible = false;
    var bClose = gFoot.add("button", undefined, L("Close"), { name: "cancel" });
    bClose.alignment = ["right", "center"];


    // ---------- UI functions ----------

    function setStatus(msg) { tStatus.text = msg || ""; }

    function progress(k, n) {
        if (n < 3) return;
        pb.visible = k < n;
        pb.value = Math.round(100 * k / n);
        try { w.update(); } catch (e) {}
    }

    function fillHeader() {
        var k, c = { diff: 0, minor: 0, unbound: 0, newv: 0, missing: 0, same: 0, textual: 0 }, parts = [], info;
        if (xmlData) {
            tFileName.text = xmlData.name + "   (" + File(xmlData.path).parent.fsName + ")";
            info = L("File modified on {0}", fmtDate(xmlData.modified));
            if (state.source && state.source.path === xmlData.path && state.source.linkedAt) info += "  ·  " + L("linked to this document on {0}", fmtStamp(state.source.linkedAt));
            tFileInfo.text = info;
        } else if (state.source && state.source.path) {
            tFileName.text = L("Linked file not found: {0}", state.source.path);
            tFileInfo.text = L("Press «Choose data file…» to show where it is now.");
        } else {
            tFileName.text = L("No file linked.");
            tFileInfo.text = L("Press «Choose data file…» (XML, CSV or TXT) to load the variables file and compare it with the document.");
        }

        busy = true;
        ddSet.removeAll();
        if (xmlData) {
            for (k = 0; k < xmlData.datasets.length; k++) ddSet.add("item", xmlData.datasets[k].name);
            ddSet.selection = dsIndex;
        }
        ddSet.enabled = !!xmlData && xmlData.datasets.length > 1;
        busy = false;
        bReload.enabled = !!xmlData;

        for (k = 0; k < rows.length; k++) {
            if (rows[k].status === ST.OTHER) continue;
            c.textual++;
            if (needsUpdate(rows[k])) c.diff++;
            else if (isMinor(rows[k])) c.minor++;
            else if (rows[k].status === ST.UNBOUND) c.unbound++;
            else if (rows[k].status === ST.NEW) c.newv++;
            else if (rows[k].status === ST.MISSING) c.missing++;
            else if (rows[k].status === ST.SAME) c.same++;
        }
        parts.push(P(c.textual, "{0} variable", "{0} variables"));
        if (xmlData) {
            parts.push(c.diff ? L("{0} to update", c.diff) : L("none to update"));
            if (c.same) parts.push(L("{0} up to date", c.same));
            if (c.minor) parts.push(L("{0} with ignored differences", c.minor));
        }
        if (c.unbound) parts.push(L("{0} not bound", c.unbound));
        if (c.newv) parts.push(L("{0} new in file", c.newv));
        if (c.missing) parts.push(L("{0} not in file", c.missing));
        tSummary.text = parts.join("   ·   ");

        bUpdAll.text = c.diff ? L("Update all variables to update") + " (" + c.diff + ")" : L("Update all variables to update");
        bUpdAll.enabled = c.diff > 0;
        bUndo.enabled = undoStack.length > 0;
        tLeft.text = L("Now in the document");
        tRight.text = xmlData ? L("In the file") + "  (" + currentDataSetName() + ")" : L("In the file");
    }

    function fillVarList(keepNames) {
        var f = FILTERS[ddFilter.selection ? ddFilter.selection.index : 0][1];
        var tm = searchTerms(etSearch.text), k, r, it, sel = [], docText;
        busy = true;
        lbV.removeAll();
        visRows = [];
        for (k = 0; k < rows.length; k++) {
            r = rows[k];
            if (f && !f(r)) continue;
            docText = r.items.length ? r.items[0].rec.text : "";
            if (tm.length && !matchAll((r.name + " " + docText + " " + (r.xml ? r.xml.text : "")).toLowerCase(), tm)) continue;
            it = addRow(lbV, [L(r.status.label), r.name, itemsLabel(r), r.items.length ? oneLine(docText, 120) : "", originLabel(r.name)]);
            visRows.push(r);
            if (keepNames && keepNames["#" + r.name]) sel.push(it);
        }
        tCount.text = L("{0} of {1} rows", visRows.length, rows.length);
        if (sel.length) {
            try { lbV.selection = sel; } catch (e) { try { lbV.selection = sel[0]; } catch (e2) {} }
            try { lbV.revealItem(sel[0]); } catch (e) {}
        }
        busy = false;
        showDetail();
    }

    function selectedRows() {
        var items = selectedItems(lbV), out = [], k;
        for (k = 0; k < items.length; k++) if (visRows[items[k].index]) out.push(visRows[items[k].index]);
        return out;
    }

    function selectedNames() {
        var s = selectedRows(), o = {}, k;
        for (k = 0; k < s.length; k++) o["#" + s[k].name] = true;
        return o;
    }

    function launchSelFrames() {
        var out = [], k;
        for (k = 0; k < frames.length; k++) if (launchSel[frames[k].i]) out.push(frames[k]);
        return out;
    }

    function showDetail() {
        var sel = selectedRows(), r, k, docText, lines = [], o, places = [], canUpd = false, canCreate = false, plan, diffMsg, textual;
        var nSel = launchSelFrames().length;
        bBindSel.text = L("Bind to selected objects") + " (" + nSel + ")";

        if (sel.length !== 1) {
            tDetTitle.text = sel.length ? P(sel.length, "{0} variable selected", "{0} variables selected") : L("Select a variable in the list.");
            etDoc.text = ""; etXml.text = ""; tDiff.text = " ";
            tDetInfo.text = sel.length ? L("Use «Update selected rows» to update them together.") : " ";
            for (k = 0; k < sel.length; k++) { if (canUpdate(sel[k])) canUpd = true; if (sel[k].status === ST.NEW) canCreate = true; }
            bUpdSel.enabled = canUpd;
            bUpdOne.enabled = false; bShow.enabled = false; bBindSel.enabled = false; bBindPick.enabled = false; bPickArt.enabled = false;
            bUnbind.enabled = false; bDelete.enabled = false;
            bCreate.enabled = canCreate;
            return;
        }

        r = sel[0];
        tDetTitle.text = r.name + "    " + L(r.status.label);
        docText = r.items.length ? r.items[0].rec.text : "";
        etDoc.text = r.items.length ? multiLine(docText) : L("(no object bound)");
        etXml.text = !xmlData ? L("(no file loaded)") : (r.inXml ? multiLine(r.xml.text) : L("(this variable is not in the file)"));

        if (needsUpdate(r)) {
            plan = planUpdate(docText, r.xml.text, SET.ignoreSpaces, SET.ignoreCase);
            diffMsg = L("Will change:") + "  " + diffSummary(docText, plan.target);
            for (k = 1; k < r.items.length; k++) if (r.items[k].rec.text !== docText) { diffMsg += "\n" + L("Warning: the bound objects do not all have the same text."); break; }
            tDiff.text = diffMsg;
        } else if (isMinor(r)) {
            tDiff.text = r.status === ST.CASE
                ? L("Only upper/lower case changes: it does not count as to update. «Make identical to file» aligns it with the file anyway.")
                : L("Only spaces or line breaks change: it does not count as to update. «Make identical to file» aligns it with the file anyway.");
        } else if (r.status === ST.SAME) tDiff.text = L("The text in the document matches the file.");
        else if (r.status === ST.UNBOUND) tDiff.text = L("No object uses this variable: bind it to a text object.");
        else if (r.status === ST.NEW) tDiff.text = L("The variable is in the file but not in the document: create the variable and bind it to an object.");
        else if (r.status === ST.MISSING) tDiff.text = L("The variable is in the document but not in the loaded file.");
        else if (r.status === ST.OTHER) tDiff.text = L("Non-text variable (visibility, image or graph): manage it from Illustrator's Variables panel.");
        else tDiff.text = " ";

        if (r.items.length) {
            for (k = 0; k < r.items.length; k++) {
                places.push("«" + r.items[k].rec.layer + "»" + (r.items[k].rec.board ? " " + L("artboard {0}", r.items[k].rec.board) : "") +
                    (r.items[k].isNative ? "" : " (script)"));
            }
            lines.push(P(r.items.length, "Bound to {0} object:", "Bound to {0} objects:") + " " + places.join(", "));
        }
        o = has(state.vars, r.name) ? state.vars[r.name] : null;
        lines.push(o ? L("Last update: {0} from file {1}", fmtStamp(o.date), o.file) + (o.dataSet ? " " + L("(record «{0}»)", o.dataSet) : "")
                     : L("Never updated with this script."));
        tDetInfo.text = lines.join("\n");

        textual = r.status !== ST.OTHER;
        bUpdOne.enabled = canUpdate(r);
        bUpdOne.text = isMinor(r) ? L("Make identical to file") : L("Update this one");
        bUpdSel.enabled = canUpdate(r);
        bShow.enabled = r.items.length > 0;
        bBindSel.enabled = textual && nSel > 0 && (r.inDoc || r.inXml);
        bBindPick.enabled = textual;
        bPickArt.enabled = textual;
        bUnbind.enabled = r.items.length > 0 && textual;
        bCreate.enabled = r.status === ST.NEW;
        bDelete.enabled = r.inDoc;
    }

    function chosenVar() {
        return lbVar.selection ? pickerNames[lbVar.selection.index] : null;
    }

    function selectedFrameKeys() {
        var o = {}, s = selectedFrames(), k;
        for (k = 0; k < s.length; k++) o[s[k].i] = true;
        return o;
    }

    // Variable list in the Objects tab: filtered by the search, with the
    // variables whose value matches the chosen object on top (★).
    function fillVarPicker(keep) {
        var tm = searchTerms(etVarSearch.text), sf = selectedFrames(), ftext = null, sugg = [], rest = [], list, k, r, idx = -1;
        if (keep === undefined) keep = chosenVar();
        if (sf.length === 1 && sf[0].text !== "") ftext = cmpKey(sf[0].text);
        for (k = 0; k < rows.length; k++) {
            r = rows[k];
            if (r.status === ST.OTHER) continue;
            if (tm.length && !matchAll((r.name + " " + (r.xml ? r.xml.text : "")).toLowerCase(), tm)) continue;
            if (ftext !== null && r.xml && cmpKey(r.xml.text) === ftext) sugg.push(r); else rest.push(r);
        }
        list = sugg.concat(rest);
        busy = true;
        lbVar.removeAll();
        pickerNames = [];
        for (k = 0; k < list.length; k++) {
            addRow(lbVar, [k < sugg.length ? "★" : "", list[k].name, list[k].items.length ? String(list[k].items.length) : ""]);
            pickerNames.push(list[k].name);
            if (list[k].name === keep) idx = k;
        }
        if (idx >= 0) {
            lbVar.selection = idx;
            try { lbVar.revealItem(lbVar.items[idx]); } catch (e) {}
        }
        busy = false;
        showVarValue();
    }

    function showVarValue() {
        var name = chosenVar(), r = name && has(rowMap, "#" + name) ? rowMap["#" + name] : null;
        if (!r) tVarVal.text = L("No variable chosen.");
        else tVarVal.text = L("In the file:") + " " + (r.xml ? (r.xml.text === "" ? L("(empty)") : oneLine(r.xml.text, 150)) : "—") +
            "\n" + (r.items.length ? P(r.items.length, "Already bound to {0} object.", "Already bound to {0} objects.") : L("Not bound yet."));
        updateObjButtons();
    }

    function targetValue() {
        var t = chosenVar(), r = t && has(rowMap, "#" + t) ? rowMap["#" + t] : null;
        return (r && r.xml && cmpKey(r.xml.text) !== "") ? cmpKey(r.xml.text) : null;
    }

    function objCols(fr, tval) {
        return [(tval !== null && cmpKey(fr.text) === tval) ? "★" : "", frameVar(fr) || "",
            fr.nativeVar ? "Illustrator" : (fr.tagVar ? "script" : ""), fr.layer, fr.board ? String(fr.board) : "", oneLine(fr.text, 150)];
    }

    // Rebuilds the object list (filter, search, ★ on top). Shows at most
    // MAX_OBJ_ROWS rows to stay fast.
    function fillObjList(keepIdx) {
        var f = OFILTERS[ddOFilter.selection ? ddOFilter.selection.index : 0][1];
        var tm = searchTerms(etOSearch.text), tval = targetValue(), k, fr, it, cols, sel = [], sugg = [], rest = [], list, total;
        for (k = 0; k < frames.length; k++) {
            fr = frames[k];
            if (f && !f(fr)) continue;
            if (tm.length && !matchAll((fr.text + " " + (frameVar(fr) || "") + " " + fr.layer + " " + fr.name).toLowerCase(), tm)) continue;
            if (tval !== null && cmpKey(fr.text) === tval) sugg.push(fr); else rest.push(fr);
        }
        list = sugg.concat(rest);
        total = list.length;
        if (list.length > MAX_OBJ_ROWS) list = list.slice(0, MAX_OBJ_ROWS);
        busy = true;
        lbO.removeAll();
        visFrames = [];
        visCols = [];
        for (k = 0; k < list.length; k++) {
            fr = list[k];
            cols = objCols(fr, tval);
            it = addRow(lbO, cols);
            visFrames.push(fr);
            visCols.push(cols);
            if (keepIdx && keepIdx[fr.i]) sel.push(it);
        }
        tOCount.text = (total > MAX_OBJ_ROWS ? L("Showing the first {0} of {1}: type in the search box to narrow down", MAX_OBJ_ROWS, total)
                                             : L("{0} of {1} objects", total, frames.length)) +
            (sugg.length ? "   ·   " + L("{0} ★ suggested", sugg.length) : "");
        if (sel.length) {
            try { lbO.selection = sel; } catch (e) { try { lbO.selection = sel[0]; } catch (e2) {} }
            try { lbO.revealItem(sel[0]); } catch (e) {}
        }
        busy = false;
        showObjDetail();
    }

    // Updates only the changed cells, without rebuilding the list.
    function syncObjList() {
        var tval = targetValue(), k, c, cols, old, item;
        for (k = 0; k < visFrames.length; k++) {
            cols = objCols(visFrames[k], tval);
            old = visCols[k];
            item = lbO.items[k];
            if (cols[0] !== old[0]) item.text = cols[0];
            for (c = 1; c < cols.length; c++) if (cols[c] !== old[c]) item.subItems[c - 1].text = cols[c];
            visCols[k] = cols;
        }
        showObjDetail();
    }

    function selectedFrames() {
        var items = selectedItems(lbO), out = [], k;
        for (k = 0; k < items.length; k++) if (visFrames[items[k].index]) out.push(visFrames[items[k].index]);
        return out;
    }

    function showObjDetail() {
        var s = selectedFrames(), fr, v;
        if (s.length === 1) {
            fr = s[0];
            v = frameVar(fr);
            etOText.text = (v ? L("Variable: {0}", v) + " " + (fr.nativeVar ? L("(Illustrator binding)") : L("(script binding)")) : L("No variable bound")) +
                "   ·   " + L("Layer «{0}»", fr.layer) + (fr.board ? "   ·   " + L("Artboard {0}", fr.board) : "") + (fr.name ? "   ·   " + L("Name «{0}»", fr.name) : "") +
                "\n\n" + multiLine(fr.text);
        } else etOText.text = s.length ? P(s.length, "{0} object selected", "{0} objects selected") : "";
        updateObjButtons();
    }

    function updateObjButtons() {
        var s = selectedFrames(), anyBound = false, k;
        for (k = 0; k < s.length; k++) if (frameVar(s[k])) anyBound = true;
        bOBind.enabled = s.length > 0 && !!chosenVar();
        bOPickArt.enabled = !!chosenVar();
        bONew.enabled = s.length === 1;
        bOUnbind.enabled = anyBound;
        bOShow.enabled = s.length > 0;
    }

    // Refreshes the interface after a change. Does not re-read the
    // document: the actions already updated the object data in memory.
    function refreshAll(msg) {
        var keepV = selectedNames(), keepVar = chosenVar();
        buildRows();
        fillHeader();
        fillVarList(keepV);
        fillVarPicker(keepVar);
        syncObjList();
        if (msg !== undefined) setStatus(msg);
    }

    // ---------- Auto-match ----------

    function buildProposals() {
        var props = [], seen = {}, byVal = {}, freeByText = {}, nativeTaken = {}, perFrame = {};
        var k, j, q, r, fr, val, cur, refs, list, others, memo = 0, p;

        function add(kind, rec, name, sel, note) {
            var id = rec.i + "|" + name;
            if (seen[id]) return;
            seen[id] = true;
            props.push({ kind: kind, rec: rec, name: name, sel: sel, notes: note ? [note] : [] });
        }

        for (k = 0; k < rows.length; k++) {
            r = rows[k];
            if (r.status === ST.OTHER || !r.xml) continue;
            val = cmpKey(r.xml.text);
            if (val === "") continue;
            (byVal["#" + val] = byVal["#" + val] || []).push(r.name);
        }
        for (k = 0; k < frames.length; k++) {
            fr = frames[k];
            if (fr.nativeVar) nativeTaken["#" + fr.nativeVar] = true;
            if (fr.nativeVar && !fr.hasTag) memo++;
            if (frameVar(fr)) continue;
            val = cmpKey(fr.text);
            if (val !== "") (freeByText["#" + val] = freeByText["#" + val] || []).push(fr);
        }

        // bindings saved in the Notes but not (any more) in the Variables panel
        if (SET.useNative) {
            for (k = 0; k < frames.length; k++) {
                fr = frames[k];
                if (fr.tagVar && !nativeTaken["#" + fr.tagVar]) {
                    nativeTaken["#" + fr.tagVar] = true;
                    add("restore", fr, fr.tagVar, true, L("binding saved in the object's Note"));
                }
            }
        }

        // free objects with the same text as a variable
        for (k = 0; k < rows.length; k++) {
            r = rows[k];
            if (r.status === ST.OTHER || !r.xml) continue;
            refs = [];
            val = cmpKey(r.xml.text);
            if (val !== "") refs.push(val);
            if (r.items.length) {
                cur = cmpKey(r.items[0].rec.text);
                if (cur !== "" && cur !== val) refs.push(cur);
            }
            for (j = 0; j < refs.length; j++) {
                list = freeByText["#" + refs[j]] || [];
                others = [];
                if (byVal["#" + refs[j]]) for (q = 0; q < byVal["#" + refs[j]].length; q++) if (byVal["#" + refs[j]][q] !== r.name) others.push(byVal["#" + refs[j]][q]);
                for (q = 0; q < list.length; q++) {
                    if (r.items.length) add("extra", list[q], r.name, false, P(r.items.length, "already bound to {0} object: this would be an extra copy", "already bound to {0} objects: this would be an extra copy"));
                    else if (others.length) add("link", list[q], r.name, false, L("same value as: {0}", others.join(", ")));
                    else if (refs[j].length < 4) add("link", list[q], r.name, false, L("very short value: check it"));
                    else add("link", list[q], r.name, true, "");
                }
            }
        }

        // an object proposed for several variables is not preselected
        for (k = 0; k < props.length; k++) perFrame[props[k].rec.i] = (perFrame[props[k].rec.i] || 0) + 1;
        for (k = 0; k < props.length; k++) {
            p = props[k];
            if (perFrame[p.rec.i] > 1 && p.kind !== "restore") {
                p.sel = false;
                if (p.kind !== "link" || !p.notes.length) p.notes.push(L("the object matches several variables"));
            }
        }
        return { props: props, memo: memo };
    }

    function autoMatch() {
        var res = buildProposals(), props = res.props, k, sel, p, done = 0, restored = 0, memoDone = 0, msg = [];
        var KIND = { restore: L("Restore"), link: L("Bind"), extra: L("Extra copy") };
        if (!props.length && !res.memo) {
            alert(L("Nothing to match.") + "\n\n" + (xmlData ? L("There are no free text objects whose text matches the value of a variable.")
                                                             : L("There are no free text objects whose text matches the value of a variable (no data file loaded).")), TOOL);
            return;
        }

        var d = new Window("dialog", L("Auto-match"), undefined, { resizeable: true });
        d.orientation = "column";
        d.alignChildren = ["fill", "top"];
        d.margins = 14;
        d.spacing = 8;
        var intro = d.add("statictext", undefined, L("Unbound text objects whose text matches the value of a variable. Only the safe matches are preselected: check the list (double-click = show the object), add or remove rows with Ctrl/Cmd+click and press «Bind selected»."), { multiline: true });
        intro.preferredSize = [1000, 36];
        var lb = d.add("listbox", undefined, [], {
            multiselect: true, numberOfColumns: 5, showHeaders: true,
            columnTitles: [L("Action"), L("Variable"), L("Layer · artboard"), L("Object text"), L("Note")],
            columnWidths: [100, 190, 150, 300, 260]
        });
        lb.preferredSize = [1000, 360];
        lb.alignment = ["fill", "fill"];
        for (k = 0; k < props.length; k++) {
            p = props[k];
            addRow(lb, [KIND[p.kind], p.name, p.rec.layer + (p.rec.board ? " · " + L("artb. {0}", p.rec.board) : ""), oneLine(p.rec.text, 90), p.notes.join("; ")]);
        }
        for (k = 0; k < props.length; k++) if (props[k].sel) { try { lb.items[k].selected = true; } catch (e) {} }

        var g = d.add("group");
        g.alignChildren = ["left", "center"];
        var bAll = g.add("button", undefined, L("Select all"));
        var bNone = g.add("button", undefined, L("None"));
        var tCnt = g.add("statictext", undefined, "", { truncate: "end" });
        tCnt.preferredSize.width = 400;
        var cbMemo = d.add("checkbox", undefined, L("Also save the existing bindings in the objects' Notes ({0} objects), so they survive when you copy the artwork", res.memo));
        cbMemo.value = res.memo > 0 && SET.saveTags;
        cbMemo.enabled = res.memo > 0;
        var gb = d.add("group");
        gb.alignment = ["right", "center"];
        gb.add("button", undefined, L("Cancel"), { name: "cancel" });
        var bOk = gb.add("button", undefined, L("Bind selected"), { name: "ok" });

        function count() {
            var n = selectedItems(lb).length;
            tCnt.text = L("{0} of {1} rows selected", n, props.length);
            bOk.enabled = n > 0 || cbMemo.value;
        }
        bAll.onClick = function () { for (var x = 0; x < lb.items.length; x++) lb.items[x].selected = true; count(); };
        bNone.onClick = function () { lb.selection = null; count(); };
        lb.onChange = count;
        cbMemo.onClick = count;
        lb.onDoubleClick = function () { var s2 = selectedItems(lb); if (s2.length) revealFrame(props[s2[0].index].rec); };
        d.onResizing = d.onResize = function () { this.layout.resize(); };
        count();

        if (d.show() !== 1) return;

        sel = selectedItems(lb);
        try {
            for (k = 0; k < sel.length; k++) {
                progress(k, sel.length);
                p = props[sel[k].index];
                if (p.kind === "restore") { if (promoteToNative(p.rec)) restored++; }
                else if (!frameVar(p.rec)) { bindFrame(p.rec, p.name); done++; }
            }
            if (cbMemo.value) {
                for (k = 0; k < frames.length; k++) {
                    if (frames[k].nativeVar && !frames[k].hasTag) { memorizeTag(frames[k], frames[k].nativeVar); memoDone++; }
                }
            }
        } catch (e) {
            alert(L("Error while matching:") + "\n" + errMsg(e), TOOL);
        }
        progress(1, 1);
        if (done) msg.push(P(done, "{0} object bound", "{0} objects bound"));
        if (restored) msg.push(P(restored, "{0} binding restored", "{0} bindings restored"));
        if (memoDone) msg.push(P(memoDone, "{0} binding saved in the Notes", "{0} bindings saved in the Notes"));
        refreshAll(msg.length ? msg.join(", ") + "." : L("No changes."));
    }

    // ---------- Actions ----------

    function chooseFile() {
        var start = null, f, filter, title = L("Choose the variables file (XML, CSV or TXT)");
        if (xmlData) start = File(xmlData.path);
        else if (state.source && state.source.path && Folder(File(state.source.path).parent).exists) start = File(state.source.path);
        else { try { start = File(doc.path + "/x.xml"); } catch (e) { start = null; } }
        filter = ($.os.indexOf("Windows") >= 0)
            ? L("Data files") + ":*.xml;*.csv;*.txt;*.tsv,XML:*.xml,CSV:*.csv,TXT:*.txt," + L("All files") + ":*.*"
            : function (x) { return (x instanceof Folder) || /\.(xml|csv|txt|tsv)$/i.test(x.name); };
        f = start ? start.openDlg(title, filter, false) : File.openDialog(title, filter, false);
        if (!f) return;
        if (!loadData(f, state.source ? state.source.dataSet : null, state.source ? state.source.dataSetIndex : 0)) return;
        state.source = { path: xmlData.path, name: xmlData.name, dataSet: currentDataSetName(), dataSetIndex: dsIndex, linkedAt: nowStamp() };
        writeState();
        refreshAll(L("Loaded {0}. Check the rows «To update».", xmlData.name));
    }

    function reloadFile() {
        if (!xmlData) return;
        var f = File(xmlData.path);
        if (!f.exists) { alert(L("The file no longer exists:") + "\n" + xmlData.path, TOOL); return; }
        if (!loadData(f, currentDataSetName(), dsIndex)) return;
        refreshAll(L("File reloaded."));
    }

    function updateRows(list, label) {
        var entry = { label: label, items: [], varsBefore: toJSON(state.vars) }, k, j, r, it, nObj = 0, nVar = 0, nFull = 0, missingFonts = 0, errors = [];
        var dsName = currentDataSetName(), msg;
        for (k = 0; k < list.length; k++) {
            r = list[k];
            progress(k, list.length);
            if (!r.xml || !r.items.length) continue;
            for (j = 0; j < r.items.length; j++) {
                it = r.items[j];
                try {
                    var before = String(it.rec.tf.contents), mode = null, tf = it.rec.tf, val = r.xml;
                    // ignored differences updated by hand, or text with <b>/<i>: exact copy of the file
                    var exact = !needsUpdate(r) || val.markup;
                    withUnlocked(tf, function () {
                        mode = exact ? replaceText(tf, val.text, false, false) : replaceText(tf, val.text, SET.ignoreSpaces, SET.ignoreCase);
                        missingFonts += applyRuns(tf, val);
                    });
                    it.rec.text = String(tf.contents);
                    entry.items.push({ rec: it.rec, text: before });
                    if (mode === "full") nFull++;
                    nObj++;
                } catch (e) {
                    errors.push(r.name + ": " + errMsg(e));
                }
            }
            state.vars[r.name] = { file: xmlData.name, path: xmlData.path, dataSet: dsName, date: nowStamp() };
            nVar++;
        }
        progress(1, 1);
        state.source = state.source || {};
        state.source.path = xmlData.path;
        state.source.name = xmlData.name;
        state.source.dataSet = dsName;
        state.source.dataSetIndex = dsIndex;
        if (!state.source.linkedAt) state.source.linkedAt = nowStamp();
        writeState();
        if (entry.items.length) undoStack.push(entry);

        msg = P(nVar, "{0} variable updated", "{0} variables updated") + " (" + P(nObj, "{0} object", "{0} objects") + ").";
        if (nFull) msg += " " + P(nFull, "In {0} object the whole text was replaced.", "In {0} objects the whole text was replaced.");
        if (missingFonts) msg += " " + L("Bold/italic style not found for {0} parts.", missingFonts);
        refreshAll(msg);
        app.redraw();
        if (errors.length) alert(L("Some objects were not updated:") + "\n\n" + errors.join("\n"), TOOL);
    }

    function undoLast() {
        var e = undoStack.pop(), k;
        if (!e) return;
        for (k = e.items.length - 1; k >= 0; k--) {
            (function (x) {
                try {
                    withUnlocked(x.rec.tf, function () { replaceText(x.rec.tf, x.text); });
                    x.rec.text = String(x.rec.tf.contents);
                } catch (err) {}
            })(e.items[k]);
        }
        state.vars = fromJSON(e.varsBefore) || {};
        writeState();
        refreshAll(L("Undone: {0}.", e.label));
        app.redraw();
    }

    function doBind(frs, name) {
        var k, res, nNat = 0, nScr = 0, replaced = [], msg;
        for (k = 0; k < frs.length; k++) {
            if (frameVar(frs[k]) && frameVar(frs[k]) !== name) replaced.push(frameVar(frs[k]));
        }
        if (replaced.length && !confirm(L("Some objects are already bound to another variable ({0}).\nReplace the binding with «{1}»?", replaced.join(", "), name), false, TOOL)) return;
        try {
            for (k = 0; k < frs.length; k++) {
                res = bindFrame(frs[k], name);
                if (res === "illustrator") nNat++;
                else if (res === "script") nScr++;
            }
        } catch (e) {
            alert(L("Error while binding:") + "\n" + errMsg(e), TOOL);
        }
        msg = P(nNat + nScr, "«{1}» bound to {0} object", "«{1}» bound to {0} objects").split("{1}").join(name);
        if (nScr) msg += " " + L("({0} through the script, because the variable was already bound to another object)", nScr);
        refreshAll(msg + ".");
    }

    function doUnbind(frs) {
        var k, failed = 0;
        for (k = 0; k < frs.length; k++) { try { if (!unbindFrame(frs[k], false)) failed++; } catch (e) { failed++; } }
        refreshAll(failed ? P(failed, "Could not unbind {0} object.", "Could not unbind {0} objects.") : L("Binding removed."));
    }

    // Closes the window remembering the variable: the user selects the
    // object on the artboard and runs the script again, which completes the binding.
    function pickOnArtboard(name, tabIndex) {
        if (!name) return;
        if (!MEM.pickHintShown) {
            if (!confirm(L("The window closes and Illustrator is free again.\n\n1. Select on the artboard the text object to bind to «{0}».\n2. Run the script again (best with a keyboard shortcut).\n\nThe binding is completed automatically and the window reopens here.\n\nContinue?", name), false, TOOL)) return;
            MEM.pickHintShown = true;
        }
        MEM.pending = { doc: docKey(), name: name, tab: tabIndex };
        try { doc.selection = null; } catch (e) {}
        w.close();
    }

    // ---------- Events ----------

    bHelp.onClick = showHelp;
    bChoose.onClick = chooseFile;
    bReload.onClick = reloadFile;

    ddLang.onChange = function () {
        if (!ddLang.selection || LANGS[ddLang.selection.index] === LANG) return;
        saveLanguage(LANGS[ddLang.selection.index]);
        MEM.reopen = true;
        w.close();
    };

    ddSet.onChange = function () {
        if (busy || !ddSet.selection) return;
        dsIndex = ddSet.selection.index;
        if (state.source) { state.source.dataSet = currentDataSetName(); state.source.dataSetIndex = dsIndex; writeState(); }
        refreshAll(L("Record selected: {0}", currentDataSetName()));
    };

    ddFilter.onChange = function () { if (!busy) fillVarList(selectedNames()); };
    etSearch.onChanging = function () { fillVarList(selectedNames()); };
    lbV.onChange = function () { if (!busy) showDetail(); };
    lbV.onDoubleClick = function () { var s = selectedRows(); if (s.length === 1 && s[0].items.length) revealFrame(s[0].items[0].rec); };

    bUpdOne.onClick = function () {
        var s = selectedRows();
        if (s.length === 1 && canUpdate(s[0])) updateRows(s, L("update of «{0}»", s[0].name));
    };
    bUpdSel.onClick = function () {
        var s = selectedRows(), list = [], k;
        for (k = 0; k < s.length; k++) if (canUpdate(s[k])) list.push(s[k]);
        if (list.length) updateRows(list, P(list.length, "update of {0} variable", "update of {0} variables"));
    };
    bUpdAll.onClick = function () {
        var list = [], k, nObj = 0;
        for (k = 0; k < rows.length; k++) if (needsUpdate(rows[k])) { list.push(rows[k]); nObj += rows[k].items.length; }
        if (!list.length) return;
        if (!confirm(L("Update {0} variables ({1} objects) with the values of\n{2} — record «{3}»?", list.length, nObj, xmlData.name, currentDataSetName()), false, TOOL)) return;
        updateRows(list, L("update of all variables"));
    };
    bUndo.onClick = undoLast;

    bShow.onClick = function () {
        var s = selectedRows(), r;
        if (s.length !== 1 || !s[0].items.length) return;
        r = s[0];
        // with several objects, every click moves to the next one
        r._showIdx = ((r._showIdx === undefined ? -1 : r._showIdx) + 1) % r.items.length;
        revealFrame(r.items[r._showIdx].rec);
        setStatus(L("Showing object {0} of {1} for «{2}».", r._showIdx + 1, r.items.length, r.name));
    };

    bBindSel.onClick = function () {
        var s = selectedRows(), frs = launchSelFrames();
        if (s.length !== 1 || !frs.length) return;
        doBind(frs, s[0].name);
    };

    bPickArt.onClick = function () {
        var s = selectedRows();
        if (s.length === 1) pickOnArtboard(s[0].name, 0);
    };
    bOPickArt.onClick = function () { pickOnArtboard(chosenVar(), 1); };

    bBindPick.onClick = function () {
        var s = selectedRows();
        if (s.length !== 1) return;
        etVarSearch.text = "";
        fillVarPicker(s[0].name);
        busy = true; ddOFilter.selection = 1; busy = false;
        etOSearch.text = "";
        fillObjList(null);
        tp.selection = tabO;
        setStatus(L("Choose the text object for «{0}» (★ = text equal to the value in the file) and press «Bind object and variable».", s[0].name));
    };

    bUnbind.onClick = function () {
        var s = selectedRows(), frs = [], k;
        if (s.length !== 1) return;
        for (k = 0; k < s[0].items.length; k++) frs.push(s[0].items[k].rec);
        if (frs.length > 1 && !confirm(L("Unbind «{0}» from all {1} objects?", s[0].name, frs.length), false, TOOL)) return;
        doUnbind(frs);
    };

    bCreate.onClick = function () {
        var s = selectedRows(), k, n = 0;
        try {
            for (k = 0; k < s.length; k++) if (s[k].status === ST.NEW) { ensureDocVar(s[k].name); n++; }
        } catch (e) { alert(L("Error while creating the variable:") + "\n" + errMsg(e), TOOL); }
        refreshAll(P(n, "{0} variable created.", "{0} variables created.") + " " + L("Now bind it to a text object."));
    };

    bDelete.onClick = function () {
        var s = selectedRows(), r, v, k;
        if (s.length !== 1 || !s[0].inDoc) return;
        r = s[0];
        if (!confirm(L("Delete the variable «{0}» from the document?\nThe bound objects stay, with their current text, but will no longer be bound.", r.name), false, TOOL)) return;
        for (k = 0; k < r.items.length; k++) {
            if (!r.items[k].isNative || r.items[k].rec.hasTag) (function (f) { withUnlocked(f.tf, function () { removeTag(f.tf); }); f.tagVar = null; f.hasTag = false; })(r.items[k].rec);
        }
        v = findDocVar(r.name);
        try {
            if (v) v.remove();
            for (k = 0; k < r.items.length; k++) if (r.items[k].isNative) r.items[k].rec.nativeVar = null;
        } catch (e) { alert(L("Error:") + "\n" + errMsg(e), TOOL); }
        if (has(state.vars, r.name)) { delete state.vars[r.name]; writeState(); }
        refreshAll(L("Variable «{0}» deleted.", r.name));
    };

    ddOFilter.onChange = function () { if (!busy) fillObjList(selectedFrameKeys()); };
    etOSearch.onChanging = function () { fillObjList(selectedFrameKeys()); };
    etVarSearch.onChanging = function () { fillVarPicker(); };
    lbVar.onChange = function () {
        if (busy) return;
        showVarValue();
        // bring the suggested objects to the top, otherwise just update the ★
        var tval = targetValue(), k, found = false;
        if (tval !== null) for (k = 0; k < frames.length; k++) if (cmpKey(frames[k].text) === tval) { found = true; break; }
        if (found) fillObjList(selectedFrameKeys()); else syncObjList();
    };
    lbO.onChange = function () {
        if (busy) return;
        showObjDetail();
        fillVarPicker();
    };
    lbO.onDoubleClick = function () { var s = selectedFrames(); if (s.length) revealFrame(s[0]); };

    bOBind.onClick = function () {
        var frs = selectedFrames(), name = chosenVar();
        if (frs.length && name) doBind(frs, name);
    };
    bONew.onClick = function () {
        var frs = selectedFrames(), name, suggestion;
        if (frs.length !== 1) return;
        suggestion = String(frs[0].name || "").replace(/[^A-Za-z0-9_.\-]+/g, "_").replace(/^[^A-Za-z_]+/, "");
        name = prompt(L("Name of the new variable (letters, digits, _ . -, no spaces):"), suggestion || L("new_variable"), TOOL);
        if (name === null) return;
        name = trim(name);
        if (!isValidVarName(name)) { alert(L("Invalid name: «{0}».\nUse letters, digits, _ . - and start with a letter.", name), TOOL); return; }
        if (findDocVar(name) && !confirm(L("The variable «{0}» already exists. Bind the object to it?", name), false, TOOL)) return;
        try { ensureDocVar(name); } catch (e) { alert(L("Error while creating the variable:") + "\n" + errMsg(e), TOOL); return; }
        etVarSearch.text = "";
        doBind(frs, name);
        fillVarPicker(name);
    };
    bOUnbind.onClick = function () {
        var frs = selectedFrames(), out = [], k;
        for (k = 0; k < frs.length; k++) if (frameVar(frs[k])) out.push(frs[k]);
        if (out.length) doUnbind(out);
    };
    bOShow.onClick = function () { var s = selectedFrames(); if (s.length) revealFrame(s[0]); };
    bAuto.onClick = autoMatch;
    bOAuto.onClick = autoMatch;
    cbIgnSp.onClick = function () {
        saveSetting("ignoreSpaces", cbIgnSp.value);
        refreshAll(cbIgnSp.value ? L("Differences in spaces/line breaks only no longer count as to update.") : L("Differences in spaces/line breaks now count as to update."));
    };
    cbIgnCase.onClick = function () {
        saveSetting("ignoreCase", cbIgnCase.value);
        refreshAll(cbIgnCase.value ? L("Differences in case only no longer count as to update.") : L("Differences in case now count as to update."));
    };
    cbNative.onClick = function () {
        saveSetting("useNative", cbNative.value);
        if (!cbNative.value) { cbTags.value = true; saveSetting("saveTags", true); }
        cbTags.enabled = cbNative.value;
    };
    cbTags.onClick = function () { saveSetting("saveTags", cbTags.value); };

    w.onResizing = w.onResize = function () { this.layout.resize(); };
    w.onClose = function () { try { MEM.bounds = [w.bounds.left, w.bounds.top, w.bounds.right, w.bounds.bottom]; } catch (e) {} };

    // ---------- Start ----------
    fillHeader();
    fillVarList(null);
    fillObjList(null);
    fillVarPicker(null);

    if (launchSelFrames().length && !xmlData) tp.selection = tabO;

    var pending = MEM.pending, keep = {}, sel, msg = [];
    MEM.pending = null;
    if (pending && pending.doc !== docKey()) pending = null;
    if (pending) {
        keep["#" + pending.name] = true;
        if (pending.tab === 1) { fillVarPicker(pending.name); fillObjList(null); tp.selection = tabO; }
        else { tp.selection = tabV; }
        fillVarList(keep);
    }

    if (MEM.bounds) {
        w.onShow = function () { try { w.bounds = MEM.bounds; w.layout.resize(); } catch (e) {} };
    }

    if (!xmpOk) msg.push(L("Warning: cannot read/write the document metadata, the link to the file will not be remembered."));
    if (startupNotes) {
        msg.push(P(startupNotes, "{0} binding saved in the objects' Notes (so it can be copied).", "{0} bindings saved in the objects' Notes (so they can be copied)."));
        startupNotes = 0;
    }
    if (launchSelFrames().length) msg.push(P(launchSelFrames().length, "{0} text object selected at launch.", "{0} text objects selected at launch."));
    if (!msg.length) msg.push(L("Double-click a row to see the object in the document."));
    setStatus(msg.join("  "));

    if (pending) {
        sel = launchSelFrames();
        if (!sel.length) {
            setStatus(L("No text object selected: «{0}» was not bound. Try again with «Pick on artboard…».", pending.name));
        } else if (sel.length === 1 || confirm(L("{0} text objects are selected.\nBind them all to «{1}»?", sel.length, pending.name), false, TOOL)) {
            doBind(sel, pending.name);
            fillVarList(keep);
        } else {
            setStatus(L("Binding of «{0}» cancelled.", pending.name));
        }
    }

    w.show();
}


// ============================== START ==============================

function main() {
    var f, first;
    loadLanguage();
    if (app.documents.length === 0) {
        alert(L("Open the Illustrator document with the variables first."), TOOL);
        return;
    }
    doc = app.activeDocument;
    loadSettings();
    state = readState();
    if (state.source && state.source.path) {
        f = File(state.source.path);
        if (f.exists) loadData(f, state.source.dataSet, state.source.dataSetIndex);
    }
    refreshData(true);
    startupNotes = memorizeMissingTags();
    MEM.reopen = true;
    first = true;
    while (MEM.reopen) {
        // the window reopens when the language changes
        MEM.reopen = false;
        if (!first && xmlData && File(xmlData.path).exists) loadData(File(xmlData.path), currentDataSetName(), dsIndex);
        first = false;
        buildRows();
        buildUI();
    }
}

// ============================== TRANSLATIONS ==============================
// The source language is English. Each table maps the English text to the
// translation; missing entries fall back to English.

I18N.en = {
    "@help": "HOW IT WORKS\n\n" +
        "1. DATA FILE — Choose the variables file: XML (Illustrator Variable Library), CSV or tab-delimited TXT (first row = variable names, every following row = a record; @ = image, # = visibility, % = graph). The link is saved inside the .ai file: next time the file reloads by itself. If the file contains several records, choose which one to use.\n\n" +
        "2. COMPARISON — Every row is a variable. Only the text is compared: bold, italic, underline and other formatting do not count.\n" +
        "   ● To update: the text differs from the file\n" +
        "   ≈ Spaces/line breaks only, ≈ Case only: ignored differences (options «Ignore spaces and line breaks» / «Ignore case»)\n" +
        "   ○ Not bound: the variable exists but no object uses it\n" +
        "   + New in file: only in the data file (create it and bind it)\n" +
        "   ! Not in file: in the document but not in the data file\n" +
        "   ✓ Up to date: matches the file\n\n" +
        "3. UPDATING — One at a time, the selected ones, or all those to update. Only the words that differ are changed: formatting, spaces and line breaks of the rest stay as they are. «Undo last update» puts back the previous texts.\n\n" +
        "4. BINDING — «Auto-match…» proposes to bind the objects that already contain the value of a variable (check the list before confirming). By hand: «Pick on artboard…», or select the objects before running the script, or choose object and variable in the «Text objects» tab.\n\n" +
        "5. COPYING ARTWORK — With the option «Remember in Notes» every bound object has the line «VAR:name» in its Note (Attributes panel), which travels with the object. The script adds it automatically every time it opens, also to bindings made in the Variables panel. After pasting into another file, open the script and use «Auto-match…» to restore the bindings.\n\n" +
        "Changes are applied to the document as you work: remember to save the .ai file."
};

I18N.it = {
    "@help": "COME FUNZIONA\n\n" +
        "1. FILE DATI — Scegli il file delle variabili: XML (Libreria variabili di Illustrator), CSV o TXT con tabulazioni (prima riga = nomi delle variabili, ogni riga dopo = un record; @ = immagine, # = visibilità, % = grafico). Il collegamento viene salvato dentro il file .ai: la prossima volta il file si ricarica da solo. Se il file contiene più record, scegli quale usare.\n\n" +
        "2. CONFRONTO — Ogni riga è una variabile. Si confronta solo il testo: grassetto, corsivo, sottolineato e altra formattazione non contano.\n" +
        "   ● Da aggiornare: il testo è diverso dal file\n" +
        "   ≈ Solo spazi/a capo, ≈ Solo maiuscole: differenze ignorate (opzioni «Ignora spazi e a capo» / «Ignora maiuscole»)\n" +
        "   ○ Non collegata: la variabile esiste ma nessun oggetto la usa\n" +
        "   + Nuova nel file: c'è solo nel file dati (creala e collegala)\n" +
        "   ! Non nel file: c'è nel documento ma non nel file dati\n" +
        "   ✓ Aggiornata: coincide con il file\n\n" +
        "3. AGGIORNARE — Una alla volta, quelle selezionate, oppure tutte quelle da aggiornare. Cambiano solo le parole diverse: formattazione, spazi e a capo del resto restano come sono. «Annulla ultimo aggiornamento» rimette i testi di prima.\n\n" +
        "4. COLLEGARE — «Accoppia automaticamente…» propone di collegare gli oggetti che contengono già il valore di una variabile (controlla l'elenco prima di confermare). A mano: «Scegli sulla tavola…», oppure seleziona gli oggetti prima di avviare lo script, oppure scegli oggetto e variabile nella scheda «Oggetti di testo».\n\n" +
        "5. COPIARE L'ARTWORK — Con l'opzione «Memorizza nelle Note» ogni oggetto collegato ha la riga «VAR:nome» nelle Note (pannello Attributi), che viaggia con l'oggetto. Lo script la aggiunge da solo a ogni apertura, anche ai collegamenti fatti dal pannello Variabili. Dopo aver incollato in un altro file, apri lo script e usa «Accoppia automaticamente…» per ripristinare i collegamenti.\n\n" +
        "Le modifiche sono già nel documento mentre lavori: ricordati di salvare il file .ai.",
    "Cannot save the link information in the document:": "Non riesco a salvare le informazioni di collegamento nel documento:",
    "Record {0}": "Record {0}",
    "The file contains no variables (<variable varName=\"…\">).\nIs it an Illustrator Variable Library file?": "Nel file non ci sono variabili (<variable varName=\"…\">).\nÈ un file «Libreria variabili» di Illustrator?",
    "The file contains no records with values (<sampleDataSet>).": "Nel file non ci sono record con i valori (<sampleDataSet>).",
    "Cannot open the file:": "Non riesco ad aprire il file:",
    "The file is empty.": "Il file è vuoto.",
    "The first row of the file must contain the variable names.": "La prima riga del file deve contenere i nomi delle variabili.",
    "The file only contains the row of names: the rows with the values are missing.": "Nel file c'è solo la riga dei nomi: mancano le righe con i valori.",
    "Row {0}": "Riga {0}",
    "Error reading {0}:": "Errore nella lettura di {0}:",
    "({0} script)": "({0} script)",
    "Full manual:": "Manuale completo:",
    "Linked data file": "File dati collegato",
    "Choose data file…": "Scegli file dati…",
    "Reload": "Ricarica",
    "How it works": "Come funziona",
    "Record:": "Record:",
    "Variables and comparison": "Variabili e confronto",
    "Text objects": "Oggetti di testo",
    "Show:": "Mostra:",
    "All": "Tutti",
    "To update": "Da aggiornare",
    "Not bound": "Non collegate",
    "New in file": "Nuove nel file",
    "Not in file": "Non presenti nel file",
    "Ignored differences": "Differenze ignorate",
    "Up to date": "Aggiornate",
    "Search:": "Cerca:",
    "Ignore spaces and line breaks": "Ignora spazi e a capo",
    "Variables that differ only in spaces or line breaks are not marked as to update. When updating, the document's spaces and line breaks stay where they are. Bold, italic and other formatting never count in the comparison.": "Le variabili che differiscono solo per spazi o ritorni a capo non risultano da aggiornare. Negli aggiornamenti, spazi e a capo del documento restano dove sono. Grassetto, corsivo e altra formattazione non contano mai nel confronto.",
    "Ignore case": "Ignora maiuscole",
    "Variables that differ only in upper/lower case are not marked as to update.": "Le variabili che differiscono solo per maiuscole/minuscole non risultano da aggiornare.",
    "Status": "Stato",
    "Variable": "Variabile",
    "Objects": "Oggetti",
    "Text in the document": "Testo nel documento",
    "Last updated from": "Ultimo aggiornamento da",
    "Update all variables to update": "Aggiorna tutte le variabili da aggiornare",
    "Update selected rows": "Aggiorna le righe selezionate",
    "Undo last update": "Annulla ultimo aggiornamento",
    "Auto-match…": "Accoppia automaticamente…",
    "Binds the variables to the text objects that already contain their value, and restores the bindings saved in the Notes (e.g. after copying the artwork).": "Collega le variabili agli oggetti di testo che contengono già il loro valore, e ripristina i collegamenti salvati nelle Note (es. dopo aver copiato l'artwork).",
    "Ctrl/Cmd+click or Shift+click to select several rows.": "Ctrl/Cmd+clic o Maiusc+clic per selezionare più righe.",
    "Details": "Dettaglio",
    "Select a variable in the list.": "Seleziona una variabile nell'elenco.",
    "Now in the document": "Ora nel documento",
    "In the file": "Nel file",
    "Update this one": "Aggiorna questa",
    "Show in document": "Mostra nel documento",
    "Bind to selected objects": "Collega agli oggetti selezionati",
    "Pick on artboard…": "Scegli sulla tavola…",
    "Bind from list…": "Collega dall'elenco…",
    "Unbind": "Scollega",
    "Create variable": "Crea variabile",
    "Delete variable": "Elimina variabile",
    "1 · Choose the text object": "1 · Scegli l'oggetto di testo",
    "Searches the text, layer, name or bound variable. Several words = all of them must be present.": "Cerca nel testo, nel livello, nel nome o nella variabile collegata. Più parole = devono esserci tutte.",
    "Without variable": "Senza variabile",
    "With variable": "Con variabile",
    "Selected before opening": "Selezionati prima di aprire",
    "Bound variable": "Variabile collegata",
    "Link": "Coll.",
    "Layer": "Livello",
    "Artb.": "Tav.",
    "Text": "Testo",
    "2 · Choose the variable": "2 · Scegli la variabile",
    "Searches the variable name and its value in the file.": "Cerca nel nome della variabile e nel suo valore nel file.",
    "Obj.": "Ogg.",
    "3 · Bind": "3 · Collega",
    "Bind object and variable": "Collega oggetto e variabile",
    "Pick the object on the artboard…": "Scegli l'oggetto sulla tavola…",
    "New variable from this text…": "Nuova variabile da questo testo…",
    "★ = object text equal to the variable's value in the file. Double-click an object to see it.": "★ = testo dell'oggetto uguale al valore della variabile nel file. Doppio clic su un oggetto per vederlo.",
    "Options": "Opzioni",
    "Also bind in the Variables panel": "Collega anche nel pannello Variabili",
    "Also uses Illustrator's binding (visible in the Variables panel). If disabled, bindings belong to the script only, in the objects' Notes.": "Usa anche il collegamento di Illustrator (visibile nel pannello Variabili). Se lo disattivi, i collegamenti sono solo dello script, nelle Note degli oggetti.",
    "Remember in Notes (for copying)": "Memorizza nelle Note (per copiare)",
    "Writes «VAR:name» in the object's Note: the binding survives when you copy the object or paste it into another file.": "Scrive «VAR:nome» nelle Note dell'oggetto: il collegamento resta anche quando copi l'oggetto o lo incolli in un altro file.",
    "Close": "Chiudi",
    "File modified on {0}": "File modificato il {0}",
    "linked to this document on {0}": "collegato a questo documento il {0}",
    "Linked file not found: {0}": "File collegato non trovato: {0}",
    "Press «Choose data file…» to show where it is now.": "Premi «Scegli file dati…» per indicare dove si trova ora.",
    "No file linked.": "Nessun file collegato.",
    "Press «Choose data file…» (XML, CSV or TXT) to load the variables file and compare it with the document.": "Premi «Scegli file dati…» (XML, CSV o TXT) per caricare il file delle variabili e confrontarlo con il documento.",
    "{0} to update": "{0} da aggiornare",
    "none to update": "nessuna da aggiornare",
    "{0} up to date": "{0} aggiornate",
    "{0} with ignored differences": "{0} con differenze ignorate",
    "{0} not bound": "{0} non collegate",
    "{0} new in file": "{0} nuove nel file",
    "{0} not in file": "{0} non presenti nel file",
    "{0} of {1} rows": "{0} di {1} righe",
    "Use «Update selected rows» to update them together.": "Usa «Aggiorna le righe selezionate» per aggiornarle insieme.",
    "(no object bound)": "(nessun oggetto collegato)",
    "(no file loaded)": "(nessun file caricato)",
    "(this variable is not in the file)": "(questa variabile non è nel file)",
    "Will change:": "Cambierà:",
    "Warning: the bound objects do not all have the same text.": "Attenzione: gli oggetti collegati non hanno tutti lo stesso testo.",
    "Only upper/lower case changes: it does not count as to update. «Make identical to file» aligns it with the file anyway.": "Cambiano solo maiuscole/minuscole: non conta come da aggiornare. «Rendi identica al file» la allinea comunque al file.",
    "Only spaces or line breaks change: it does not count as to update. «Make identical to file» aligns it with the file anyway.": "Cambiano solo spazi o a capo: non conta come da aggiornare. «Rendi identica al file» la allinea comunque al file.",
    "The text in the document matches the file.": "Il testo nel documento coincide con il file.",
    "No object uses this variable: bind it to a text object.": "Nessun oggetto usa questa variabile: collegala a un oggetto di testo.",
    "The variable is in the file but not in the document: create the variable and bind it to an object.": "La variabile è nel file ma non nel documento: crea la variabile e collegala a un oggetto.",
    "The variable is in the document but not in the loaded file.": "La variabile è nel documento ma non nel file caricato.",
    "Non-text variable (visibility, image or graph): manage it from Illustrator's Variables panel.": "Variabile di tipo non testuale (visibilità, immagine o grafico): gestiscila dal pannello Variabili di Illustrator.",
    "artboard {0}": "tavola {0}",
    "Last update: {0} from file {1}": "Ultimo aggiornamento: {0} dal file {1}",
    "(record «{0}»)": "(record «{0}»)",
    "Never updated with this script.": "Mai aggiornata con questo script.",
    "Make identical to file": "Rendi identica al file",
    "No variable chosen.": "Nessuna variabile scelta.",
    "In the file:": "Nel file:",
    "(empty)": "(vuoto)",
    "Not bound yet.": "Non ancora collegata.",
    "Showing the first {0} of {1}: type in the search box to narrow down": "Mostrati i primi {0} di {1}: scrivi nella ricerca per restringere",
    "{0} of {1} objects": "{0} di {1} oggetti",
    "{0} ★ suggested": "{0} ★ suggeriti",
    "Variable: {0}": "Variabile: {0}",
    "(Illustrator binding)": "(collegamento Illustrator)",
    "(script binding)": "(collegamento script)",
    "No variable bound": "Nessuna variabile collegata",
    "Layer «{0}»": "Livello «{0}»",
    "Artboard {0}": "Tavola {0}",
    "Name «{0}»": "Nome «{0}»",
    "binding saved in the object's Note": "collegamento salvato nelle Note dell'oggetto",
    "same value as: {0}": "stesso valore di: {0}",
    "very short value: check it": "valore molto corto: controlla",
    "the object matches several variables": "l'oggetto corrisponde a più variabili",
    "Restore": "Ripristina",
    "Bind": "Collega",
    "Extra copy": "Copia in più",
    "Nothing to match.": "Nessun accoppiamento da proporre.",
    "There are no free text objects whose text matches the value of a variable.": "Non ci sono oggetti di testo liberi il cui testo coincide con il valore di una variabile.",
    "There are no free text objects whose text matches the value of a variable (no data file loaded).": "Non ci sono oggetti di testo liberi il cui testo coincide con il valore di una variabile (nessun file dati caricato).",
    "Auto-match": "Accoppia automaticamente",
    "Unbound text objects whose text matches the value of a variable. Only the safe matches are preselected: check the list (double-click = show the object), add or remove rows with Ctrl/Cmd+click and press «Bind selected».": "Oggetti di testo non collegati il cui testo coincide con il valore di una variabile. Sono già selezionate solo le corrispondenze sicure: controlla l'elenco (doppio clic = mostra l'oggetto), aggiungi o togli righe con Ctrl/Cmd+clic e premi «Collega le selezionate».",
    "Action": "Azione",
    "Layer · artboard": "Livello · tavola",
    "Object text": "Testo dell'oggetto",
    "Note": "Nota",
    "artb. {0}": "tav. {0}",
    "Select all": "Seleziona tutte",
    "None": "Nessuna",
    "Also save the existing bindings in the objects' Notes ({0} objects), so they survive when you copy the artwork": "Salva anche i collegamenti già esistenti nelle Note degli oggetti ({0} oggetti), così restano quando copi l'artwork",
    "Cancel": "Annulla",
    "Bind selected": "Collega le selezionate",
    "{0} of {1} rows selected": "{0} di {1} righe selezionate",
    "Error while matching:": "Errore durante l'accoppiamento:",
    "No changes.": "Nessuna modifica.",
    "Choose the variables file (XML, CSV or TXT)": "Scegli il file delle variabili (XML, CSV o TXT)",
    "Data files": "File dati",
    "All files": "Tutti i file",
    "Loaded {0}. Check the rows «To update».": "Caricato {0}. Controlla le righe «Da aggiornare».",
    "The file no longer exists:": "Il file non esiste più:",
    "File reloaded.": "File ricaricato.",
    "Bold/italic style not found for {0} parts.": "Grassetto/corsivo non trovato per {0} parti.",
    "Some objects were not updated:": "Alcuni oggetti non sono stati aggiornati:",
    "Undone: {0}.": "Annullato: {0}.",
    "Some objects are already bound to another variable ({0}).\nReplace the binding with «{1}»?": "Alcuni oggetti sono già collegati a un'altra variabile ({0}).\nSostituire il collegamento con «{1}»?",
    "Error while binding:": "Errore nel collegamento:",
    "({0} through the script, because the variable was already bound to another object)": "({0} tramite script, perché la variabile era già collegata a un altro oggetto)",
    "Binding removed.": "Collegamento rimosso.",
    "The window closes and Illustrator is free again.\n\n1. Select on the artboard the text object to bind to «{0}».\n2. Run the script again (best with a keyboard shortcut).\n\nThe binding is completed automatically and the window reopens here.\n\nContinue?": "La finestra si chiude e Illustrator torna libero.\n\n1. Seleziona sulla tavola l'oggetto di testo da collegare a «{0}».\n2. Rilancia lo script (meglio con la scorciatoia da tastiera).\n\nIl collegamento si completa da solo e la finestra si riapre qui.\n\nProcedere?",
    "Record selected: {0}": "Record selezionato: {0}",
    "update of «{0}»": "aggiornamento di «{0}»",
    "Update {0} variables ({1} objects) with the values of\n{2} — record «{3}»?": "Aggiornare {0} variabili ({1} oggetti) con i valori di\n{2} — record «{3}»?",
    "update of all variables": "aggiornamento di tutte le variabili",
    "Showing object {0} of {1} for «{2}».": "Mostrato oggetto {0} di {1} per «{2}».",
    "Choose the text object for «{0}» (★ = text equal to the value in the file) and press «Bind object and variable».": "Scegli l'oggetto di testo per «{0}» (★ = testo uguale al valore nel file) e premi «Collega oggetto e variabile».",
    "Unbind «{0}» from all {1} objects?": "Scollegare «{0}» da tutti i {1} oggetti?",
    "Error while creating the variable:": "Errore nella creazione della variabile:",
    "Now bind it to a text object.": "Ora collegala a un oggetto di testo.",
    "Delete the variable «{0}» from the document?\nThe bound objects stay, with their current text, but will no longer be bound.": "Eliminare la variabile «{0}» dal documento?\nGli oggetti collegati restano, con il testo attuale, ma non saranno più collegati.",
    "Error:": "Errore:",
    "Variable «{0}» deleted.": "Variabile «{0}» eliminata.",
    "Name of the new variable (letters, digits, _ . -, no spaces):": "Nome della nuova variabile (lettere, numeri, _ . -, senza spazi):",
    "new_variable": "nuova_variabile",
    "Invalid name: «{0}».\nUse letters, digits, _ . - and start with a letter.": "Nome non valido: «{0}».\nUsa lettere, numeri, _ . - e inizia con una lettera.",
    "The variable «{0}» already exists. Bind the object to it?": "La variabile «{0}» esiste già. Collegare l'oggetto a quella?",
    "Differences in spaces/line breaks only no longer count as to update.": "Le differenze di soli spazi/a capo non contano più come da aggiornare.",
    "Differences in spaces/line breaks now count as to update.": "Anche le differenze di spazi/a capo contano come da aggiornare.",
    "Differences in case only no longer count as to update.": "Le differenze di sole maiuscole non contano più come da aggiornare.",
    "Differences in case now count as to update.": "Anche le differenze di maiuscole contano come da aggiornare.",
    "Warning: cannot read/write the document metadata, the link to the file will not be remembered.": "Attenzione: non riesco a leggere/scrivere i metadati del documento, il collegamento al file non verrà ricordato.",
    "Double-click a row to see the object in the document.": "Doppio clic su una riga per vedere l'oggetto nel documento.",
    "No text object selected: «{0}» was not bound. Try again with «Pick on artboard…».": "Nessun oggetto di testo selezionato: «{0}» non è stata collegata. Riprova con «Scegli sulla tavola…».",
    "{0} text objects are selected.\nBind them all to «{1}»?": "Sono selezionati {0} oggetti di testo.\nCollegarli tutti a «{1}»?",
    "Binding of «{0}» cancelled.": "Collegamento di «{0}» annullato.",
    "Open the Illustrator document with the variables first.": "Apri prima il documento Illustrator con le variabili.",
    "Unexpected error: {0}": "Errore imprevisto: {0}",
    "(line {0})": "(riga {0})",
    "{0} object": "{0} oggetto",
    "{0} objects": "{0} oggetti",
    "{0} variable": "{0} variabile",
    "{0} variables": "{0} variabili",
    "{0} variable selected": "{0} variabile selezionata",
    "{0} variables selected": "{0} variabili selezionate",
    "Bound to {0} object:": "Collegata a {0} oggetto:",
    "Bound to {0} objects:": "Collegata a {0} oggetti:",
    "Already bound to {0} object.": "Già collegata a {0} oggetto.",
    "Already bound to {0} objects.": "Già collegata a {0} oggetti.",
    "{0} object selected": "{0} oggetto selezionato",
    "{0} objects selected": "{0} oggetti selezionati",
    "already bound to {0} object: this would be an extra copy": "già collegata a {0} oggetto: sarebbe una copia in più",
    "already bound to {0} objects: this would be an extra copy": "già collegata a {0} oggetti: sarebbe una copia in più",
    "{0} object bound": "{0} oggetto collegato",
    "{0} objects bound": "{0} oggetti collegati",
    "{0} binding restored": "{0} collegamento ripristinato",
    "{0} bindings restored": "{0} collegamenti ripristinati",
    "{0} binding saved in the Notes": "{0} collegamento salvato nelle Note",
    "{0} bindings saved in the Notes": "{0} collegamenti salvati nelle Note",
    "{0} variable updated": "{0} variabile aggiornata",
    "{0} variables updated": "{0} variabili aggiornate",
    "In {0} object the whole text was replaced.": "In {0} oggetto il testo è stato sostituito per intero.",
    "In {0} objects the whole text was replaced.": "In {0} oggetti il testo è stato sostituito per intero.",
    "«{1}» bound to {0} object": "«{1}» collegata a {0} oggetto",
    "«{1}» bound to {0} objects": "«{1}» collegata a {0} oggetti",
    "Could not unbind {0} object.": "Non è stato possibile scollegare {0} oggetto.",
    "Could not unbind {0} objects.": "Non è stato possibile scollegare {0} oggetti.",
    "update of {0} variable": "aggiornamento di {0} variabile",
    "update of {0} variables": "aggiornamento di {0} variabili",
    "{0} variable created.": "{0} variabile creata.",
    "{0} variables created.": "{0} variabili create.",
    "{0} binding saved in the objects' Notes (so it can be copied).": "{0} collegamento salvato nelle Note degli oggetti (per poterlo copiare).",
    "{0} bindings saved in the objects' Notes (so they can be copied).": "{0} collegamenti salvati nelle Note degli oggetti (per poterli copiare).",
    "{0} text object selected at launch.": "{0} oggetto di testo selezionato all'apertura.",
    "{0} text objects selected at launch.": "{0} oggetti di testo selezionati all'apertura.",
    "● To update": "● Da aggiornare",
    "≈ Spaces/line breaks only": "≈ Solo spazi/a capo",
    "≈ Case only": "≈ Solo maiuscole",
    "○ Not bound": "○ Non collegata",
    "+ New in file": "+ Nuova nel file",
    "! Not in file": "! Non nel file",
    "✓ Up to date": "✓ Aggiornata",
    "✓ Bound": "✓ Collegata",
    "– Other type": "– Altro tipo"
};

I18N.fr = {
    "@help": "MODE D'EMPLOI\n\n" +
        "1. FICHIER DE DONNÉES — Choisissez le fichier des variables : XML (bibliothèque de variables d'Illustrator), CSV ou TXT délimité par tabulations (première ligne = noms des variables, chaque ligne suivante = un jeu de données ; @ = image, # = visibilité, % = graphe). Le lien est enregistré dans le fichier .ai : la prochaine fois, le fichier se recharge tout seul. Si le fichier contient plusieurs jeux de données, choisissez celui à utiliser.\n\n" +
        "2. COMPARAISON — Chaque ligne est une variable. Seul le texte est comparé : le gras, l'italique, le soulignement et toute autre mise en forme ne comptent pas.\n" +
        "   ● À mettre à jour : le texte diffère du fichier\n" +
        "   ≈ Espaces/retours seulement, ≈ Casse seulement : différences ignorées (options « Ignorer espaces et retours » / « Ignorer la casse »)\n" +
        "   ○ Non liée : la variable existe mais aucun objet ne l'utilise\n" +
        "   + Nouvelle dans le fichier : uniquement dans le fichier de données (créez-la et liez-la)\n" +
        "   ! Absente du fichier : dans le document mais pas dans le fichier de données\n" +
        "   ✓ À jour : identique au fichier\n\n" +
        "3. METTRE À JOUR — Une à la fois, celles sélectionnées, ou toutes celles à mettre à jour. Seuls les mots différents changent : la mise en forme, les espaces et les retours du reste ne bougent pas. « Annuler la dernière mise à jour » rétablit les textes précédents.\n\n" +
        "4. LIER — « Association automatique… » propose de lier les objets qui contiennent déjà la valeur d'une variable (vérifiez la liste avant de confirmer). À la main : « Choisir sur le plan de travail… », ou sélectionnez les objets avant de lancer le script, ou choisissez l'objet et la variable dans l'onglet « Objets texte ».\n\n" +
        "5. COPIER L'ILLUSTRATION — Avec l'option « Mémoriser dans les notes », chaque objet lié porte la ligne « VAR:nom » dans ses notes (panneau Options d'objet), qui voyage avec l'objet. Le script l'ajoute automatiquement à chaque ouverture, y compris pour les liens créés dans le panneau Variables. Après avoir collé dans un autre fichier, ouvrez le script et utilisez « Association automatique… » pour rétablir les liens.\n\n" +
        "Les modifications sont appliquées au document au fur et à mesure : pensez à enregistrer le fichier .ai.",
    "Cannot save the link information in the document:": "Impossible d'enregistrer les informations de lien dans le document :",
    "Record {0}": "Jeu {0}",
    "The file contains no variables (<variable varName=\"…\">).\nIs it an Illustrator Variable Library file?": "Le fichier ne contient aucune variable (<variable varName=\"…\">).\nEst-ce bien une bibliothèque de variables d'Illustrator ?",
    "The file contains no records with values (<sampleDataSet>).": "Le fichier ne contient aucun jeu de données avec des valeurs (<sampleDataSet>).",
    "Cannot open the file:": "Impossible d'ouvrir le fichier :",
    "The file is empty.": "Le fichier est vide.",
    "The first row of the file must contain the variable names.": "La première ligne du fichier doit contenir les noms des variables.",
    "The file only contains the row of names: the rows with the values are missing.": "Le fichier ne contient que la ligne des noms : les lignes avec les valeurs manquent.",
    "Row {0}": "Ligne {0}",
    "Error reading {0}:": "Erreur de lecture de {0} :",
    "({0} script)": "({0} script)",
    "Full manual:": "Manuel complet :",
    "Linked data file": "Fichier de données lié",
    "Choose data file…": "Choisir le fichier de données…",
    "Reload": "Recharger",
    "How it works": "Mode d'emploi",
    "Record:": "Jeu de données :",
    "Variables and comparison": "Variables et comparaison",
    "Text objects": "Objets texte",
    "Show:": "Afficher :",
    "All": "Tous",
    "To update": "À mettre à jour",
    "Not bound": "Non liées",
    "New in file": "Nouvelles dans le fichier",
    "Not in file": "Absentes du fichier",
    "Ignored differences": "Différences ignorées",
    "Up to date": "À jour",
    "Search:": "Rechercher :",
    "Ignore spaces and line breaks": "Ignorer espaces et retours",
    "Variables that differ only in spaces or line breaks are not marked as to update. When updating, the document's spaces and line breaks stay where they are. Bold, italic and other formatting never count in the comparison.": "Les variables qui ne diffèrent que par des espaces ou des retours à la ligne ne sont pas signalées à mettre à jour. Lors de la mise à jour, les espaces et retours du document restent en place. Le gras, l'italique et toute autre mise en forme ne comptent jamais dans la comparaison.",
    "Ignore case": "Ignorer la casse",
    "Variables that differ only in upper/lower case are not marked as to update.": "Les variables qui ne diffèrent que par les majuscules/minuscules ne sont pas signalées à mettre à jour.",
    "Status": "État",
    "Variable": "Variable",
    "Objects": "Objets",
    "Text in the document": "Texte dans le document",
    "Last updated from": "Dernière mise à jour depuis",
    "Update all variables to update": "Mettre à jour toutes les variables à mettre à jour",
    "Update selected rows": "Mettre à jour les lignes sélectionnées",
    "Undo last update": "Annuler la dernière mise à jour",
    "Auto-match…": "Association automatique…",
    "Binds the variables to the text objects that already contain their value, and restores the bindings saved in the Notes (e.g. after copying the artwork).": "Lie les variables aux objets texte qui contiennent déjà leur valeur et rétablit les liens enregistrés dans les notes (par ex. après avoir copié l'illustration).",
    "Ctrl/Cmd+click or Shift+click to select several rows.": "Ctrl/Cmd+clic ou Maj+clic pour sélectionner plusieurs lignes.",
    "Details": "Détails",
    "Select a variable in the list.": "Sélectionnez une variable dans la liste.",
    "Now in the document": "Actuellement dans le document",
    "In the file": "Dans le fichier",
    "Update this one": "Mettre à jour celle-ci",
    "Show in document": "Afficher dans le document",
    "Bind to selected objects": "Lier aux objets sélectionnés",
    "Pick on artboard…": "Choisir sur le plan de travail…",
    "Bind from list…": "Lier depuis la liste…",
    "Unbind": "Délier",
    "Create variable": "Créer la variable",
    "Delete variable": "Supprimer la variable",
    "1 · Choose the text object": "1 · Choisissez l'objet texte",
    "Searches the text, layer, name or bound variable. Several words = all of them must be present.": "Recherche dans le texte, le calque, le nom ou la variable liée. Plusieurs mots = tous doivent être présents.",
    "Without variable": "Sans variable",
    "With variable": "Avec variable",
    "Selected before opening": "Sélectionnés avant l'ouverture",
    "Bound variable": "Variable liée",
    "Link": "Lien",
    "Layer": "Calque",
    "Artb.": "Plan",
    "Text": "Texte",
    "2 · Choose the variable": "2 · Choisissez la variable",
    "Searches the variable name and its value in the file.": "Recherche dans le nom de la variable et dans sa valeur dans le fichier.",
    "Obj.": "Obj.",
    "3 · Bind": "3 · Liez",
    "Bind object and variable": "Lier l'objet et la variable",
    "Pick the object on the artboard…": "Choisir l'objet sur le plan de travail…",
    "New variable from this text…": "Nouvelle variable à partir de ce texte…",
    "★ = object text equal to the variable's value in the file. Double-click an object to see it.": "★ = texte de l'objet identique à la valeur de la variable dans le fichier. Double-cliquez sur un objet pour le voir.",
    "Options": "Options",
    "Also bind in the Variables panel": "Lier aussi dans le panneau Variables",
    "Also uses Illustrator's binding (visible in the Variables panel). If disabled, bindings belong to the script only, in the objects' Notes.": "Utilise aussi le lien d'Illustrator (visible dans le panneau Variables). Si l'option est désactivée, les liens n'appartiennent qu'au script, dans les notes des objets.",
    "Remember in Notes (for copying)": "Mémoriser dans les notes (pour copier)",
    "Writes «VAR:name» in the object's Note: the binding survives when you copy the object or paste it into another file.": "Écrit « VAR:nom » dans les notes de l'objet : le lien est conservé quand vous copiez l'objet ou le collez dans un autre fichier.",
    "Close": "Fermer",
    "File modified on {0}": "Fichier modifié le {0}",
    "linked to this document on {0}": "lié à ce document le {0}",
    "Linked file not found: {0}": "Fichier lié introuvable : {0}",
    "Press «Choose data file…» to show where it is now.": "Cliquez sur « Choisir le fichier de données… » pour indiquer où il se trouve maintenant.",
    "No file linked.": "Aucun fichier lié.",
    "Press «Choose data file…» (XML, CSV or TXT) to load the variables file and compare it with the document.": "Cliquez sur « Choisir le fichier de données… » (XML, CSV ou TXT) pour charger le fichier des variables et le comparer au document.",
    "{0} to update": "{0} à mettre à jour",
    "none to update": "aucune à mettre à jour",
    "{0} up to date": "{0} à jour",
    "{0} with ignored differences": "{0} avec différences ignorées",
    "{0} not bound": "{0} non liées",
    "{0} new in file": "{0} nouvelles dans le fichier",
    "{0} not in file": "{0} absentes du fichier",
    "{0} of {1} rows": "{0} sur {1} lignes",
    "Use «Update selected rows» to update them together.": "Utilisez « Mettre à jour les lignes sélectionnées » pour les mettre à jour ensemble.",
    "(no object bound)": "(aucun objet lié)",
    "(no file loaded)": "(aucun fichier chargé)",
    "(this variable is not in the file)": "(cette variable n'est pas dans le fichier)",
    "Will change:": "Va changer :",
    "Warning: the bound objects do not all have the same text.": "Attention : les objets liés n'ont pas tous le même texte.",
    "Only upper/lower case changes: it does not count as to update. «Make identical to file» aligns it with the file anyway.": "Seule la casse change : ce n'est pas compté comme à mettre à jour. « Rendre identique au fichier » l'aligne quand même sur le fichier.",
    "Only spaces or line breaks change: it does not count as to update. «Make identical to file» aligns it with the file anyway.": "Seuls des espaces ou des retours changent : ce n'est pas compté comme à mettre à jour. « Rendre identique au fichier » l'aligne quand même sur le fichier.",
    "The text in the document matches the file.": "Le texte du document correspond au fichier.",
    "No object uses this variable: bind it to a text object.": "Aucun objet n'utilise cette variable : liez-la à un objet texte.",
    "The variable is in the file but not in the document: create the variable and bind it to an object.": "La variable est dans le fichier mais pas dans le document : créez la variable et liez-la à un objet.",
    "The variable is in the document but not in the loaded file.": "La variable est dans le document mais pas dans le fichier chargé.",
    "Non-text variable (visibility, image or graph): manage it from Illustrator's Variables panel.": "Variable non textuelle (visibilité, image ou graphe) : gérez-la depuis le panneau Variables d'Illustrator.",
    "artboard {0}": "plan de travail {0}",
    "Last update: {0} from file {1}": "Dernière mise à jour : {0} depuis le fichier {1}",
    "(record «{0}»)": "(jeu « {0} »)",
    "Never updated with this script.": "Jamais mise à jour avec ce script.",
    "Make identical to file": "Rendre identique au fichier",
    "No variable chosen.": "Aucune variable choisie.",
    "In the file:": "Dans le fichier :",
    "(empty)": "(vide)",
    "Not bound yet.": "Pas encore liée.",
    "Showing the first {0} of {1}: type in the search box to narrow down": "Affichage des {0} premiers sur {1} : tapez dans la recherche pour affiner",
    "{0} of {1} objects": "{0} sur {1} objets",
    "{0} ★ suggested": "{0} ★ suggérés",
    "Variable: {0}": "Variable : {0}",
    "(Illustrator binding)": "(lien Illustrator)",
    "(script binding)": "(lien du script)",
    "No variable bound": "Aucune variable liée",
    "Layer «{0}»": "Calque « {0} »",
    "Artboard {0}": "Plan de travail {0}",
    "Name «{0}»": "Nom « {0} »",
    "binding saved in the object's Note": "lien enregistré dans les notes de l'objet",
    "same value as: {0}": "même valeur que : {0}",
    "very short value: check it": "valeur très courte : à vérifier",
    "the object matches several variables": "l'objet correspond à plusieurs variables",
    "Restore": "Rétablir",
    "Bind": "Lier",
    "Extra copy": "Copie en plus",
    "Nothing to match.": "Rien à associer.",
    "There are no free text objects whose text matches the value of a variable.": "Aucun objet texte libre dont le texte correspond à la valeur d'une variable.",
    "There are no free text objects whose text matches the value of a variable (no data file loaded).": "Aucun objet texte libre dont le texte correspond à la valeur d'une variable (aucun fichier de données chargé).",
    "Auto-match": "Association automatique",
    "Unbound text objects whose text matches the value of a variable. Only the safe matches are preselected: check the list (double-click = show the object), add or remove rows with Ctrl/Cmd+click and press «Bind selected».": "Objets texte non liés dont le texte correspond à la valeur d'une variable. Seules les correspondances sûres sont présélectionnées : vérifiez la liste (double-clic = afficher l'objet), ajoutez ou retirez des lignes avec Ctrl/Cmd+clic et cliquez sur « Lier la sélection ».",
    "Action": "Action",
    "Layer · artboard": "Calque · plan",
    "Object text": "Texte de l'objet",
    "Note": "Remarque",
    "artb. {0}": "plan {0}",
    "Select all": "Tout sélectionner",
    "None": "Aucune",
    "Also save the existing bindings in the objects' Notes ({0} objects), so they survive when you copy the artwork": "Enregistrer aussi les liens existants dans les notes des objets ({0} objets), pour qu'ils soient conservés quand vous copiez l'illustration",
    "Cancel": "Annuler",
    "Bind selected": "Lier la sélection",
    "{0} of {1} rows selected": "{0} sur {1} lignes sélectionnées",
    "Error while matching:": "Erreur pendant l'association :",
    "No changes.": "Aucune modification.",
    "Choose the variables file (XML, CSV or TXT)": "Choisissez le fichier des variables (XML, CSV ou TXT)",
    "Data files": "Fichiers de données",
    "All files": "Tous les fichiers",
    "Loaded {0}. Check the rows «To update».": "{0} chargé. Vérifiez les lignes « À mettre à jour ».",
    "The file no longer exists:": "Le fichier n'existe plus :",
    "File reloaded.": "Fichier rechargé.",
    "Bold/italic style not found for {0} parts.": "Style gras/italique introuvable pour {0} passages.",
    "Some objects were not updated:": "Certains objets n'ont pas été mis à jour :",
    "Undone: {0}.": "Annulé : {0}.",
    "Some objects are already bound to another variable ({0}).\nReplace the binding with «{1}»?": "Certains objets sont déjà liés à une autre variable ({0}).\nRemplacer le lien par « {1} » ?",
    "Error while binding:": "Erreur lors de la liaison :",
    "({0} through the script, because the variable was already bound to another object)": "({0} par le script, car la variable était déjà liée à un autre objet)",
    "Binding removed.": "Lien supprimé.",
    "The window closes and Illustrator is free again.\n\n1. Select on the artboard the text object to bind to «{0}».\n2. Run the script again (best with a keyboard shortcut).\n\nThe binding is completed automatically and the window reopens here.\n\nContinue?": "La fenêtre se ferme et Illustrator redevient utilisable.\n\n1. Sélectionnez sur le plan de travail l'objet texte à lier à « {0} ».\n2. Relancez le script (idéalement avec un raccourci clavier).\n\nLe lien se termine automatiquement et la fenêtre se rouvre ici.\n\nContinuer ?",
    "Record selected: {0}": "Jeu de données sélectionné : {0}",
    "update of «{0}»": "mise à jour de « {0} »",
    "Update {0} variables ({1} objects) with the values of\n{2} — record «{3}»?": "Mettre à jour {0} variables ({1} objets) avec les valeurs de\n{2} — jeu « {3} » ?",
    "update of all variables": "mise à jour de toutes les variables",
    "Showing object {0} of {1} for «{2}».": "Objet {0} sur {1} affiché pour « {2} ».",
    "Choose the text object for «{0}» (★ = text equal to the value in the file) and press «Bind object and variable».": "Choisissez l'objet texte pour « {0} » (★ = texte identique à la valeur dans le fichier) puis cliquez sur « Lier l'objet et la variable ».",
    "Unbind «{0}» from all {1} objects?": "Délier « {0} » des {1} objets ?",
    "Error while creating the variable:": "Erreur lors de la création de la variable :",
    "Now bind it to a text object.": "Liez-la maintenant à un objet texte.",
    "Delete the variable «{0}» from the document?\nThe bound objects stay, with their current text, but will no longer be bound.": "Supprimer la variable « {0} » du document ?\nLes objets liés restent, avec leur texte actuel, mais ne seront plus liés.",
    "Error:": "Erreur :",
    "Variable «{0}» deleted.": "Variable « {0} » supprimée.",
    "Name of the new variable (letters, digits, _ . -, no spaces):": "Nom de la nouvelle variable (lettres, chiffres, _ . -, sans espaces) :",
    "new_variable": "nouvelle_variable",
    "Invalid name: «{0}».\nUse letters, digits, _ . - and start with a letter.": "Nom non valide : « {0} ».\nUtilisez des lettres, chiffres, _ . - et commencez par une lettre.",
    "The variable «{0}» already exists. Bind the object to it?": "La variable « {0} » existe déjà. Lier l'objet à celle-ci ?",
    "Differences in spaces/line breaks only no longer count as to update.": "Les différences d'espaces/retours seulement ne comptent plus comme à mettre à jour.",
    "Differences in spaces/line breaks now count as to update.": "Les différences d'espaces/retours comptent maintenant comme à mettre à jour.",
    "Differences in case only no longer count as to update.": "Les différences de casse seulement ne comptent plus comme à mettre à jour.",
    "Differences in case now count as to update.": "Les différences de casse comptent maintenant comme à mettre à jour.",
    "Warning: cannot read/write the document metadata, the link to the file will not be remembered.": "Attention : impossible de lire/écrire les métadonnées du document, le lien vers le fichier ne sera pas mémorisé.",
    "Double-click a row to see the object in the document.": "Double-cliquez sur une ligne pour voir l'objet dans le document.",
    "No text object selected: «{0}» was not bound. Try again with «Pick on artboard…».": "Aucun objet texte sélectionné : « {0} » n'a pas été liée. Réessayez avec « Choisir sur le plan de travail… ».",
    "{0} text objects are selected.\nBind them all to «{1}»?": "{0} objets texte sont sélectionnés.\nLes lier tous à « {1} » ?",
    "Binding of «{0}» cancelled.": "Liaison de « {0} » annulée.",
    "Open the Illustrator document with the variables first.": "Ouvrez d'abord le document Illustrator contenant les variables.",
    "Unexpected error: {0}": "Erreur inattendue : {0}",
    "(line {0})": "(ligne {0})",
    "{0} object": "{0} objet",
    "{0} objects": "{0} objets",
    "{0} variable": "{0} variable",
    "{0} variables": "{0} variables",
    "{0} variable selected": "{0} variable sélectionnée",
    "{0} variables selected": "{0} variables sélectionnées",
    "Bound to {0} object:": "Liée à {0} objet :",
    "Bound to {0} objects:": "Liée à {0} objets :",
    "Already bound to {0} object.": "Déjà liée à {0} objet.",
    "Already bound to {0} objects.": "Déjà liée à {0} objets.",
    "{0} object selected": "{0} objet sélectionné",
    "{0} objects selected": "{0} objets sélectionnés",
    "already bound to {0} object: this would be an extra copy": "déjà liée à {0} objet : ce serait une copie en plus",
    "already bound to {0} objects: this would be an extra copy": "déjà liée à {0} objets : ce serait une copie en plus",
    "{0} object bound": "{0} objet lié",
    "{0} objects bound": "{0} objets liés",
    "{0} binding restored": "{0} lien rétabli",
    "{0} bindings restored": "{0} liens rétablis",
    "{0} binding saved in the Notes": "{0} lien enregistré dans les notes",
    "{0} bindings saved in the Notes": "{0} liens enregistrés dans les notes",
    "{0} variable updated": "{0} variable mise à jour",
    "{0} variables updated": "{0} variables mises à jour",
    "In {0} object the whole text was replaced.": "Dans {0} objet, tout le texte a été remplacé.",
    "In {0} objects the whole text was replaced.": "Dans {0} objets, tout le texte a été remplacé.",
    "«{1}» bound to {0} object": "« {1} » liée à {0} objet",
    "«{1}» bound to {0} objects": "« {1} » liée à {0} objets",
    "Could not unbind {0} object.": "Impossible de délier {0} objet.",
    "Could not unbind {0} objects.": "Impossible de délier {0} objets.",
    "update of {0} variable": "mise à jour de {0} variable",
    "update of {0} variables": "mise à jour de {0} variables",
    "{0} variable created.": "{0} variable créée.",
    "{0} variables created.": "{0} variables créées.",
    "{0} binding saved in the objects' Notes (so it can be copied).": "{0} lien enregistré dans les notes des objets (pour pouvoir le copier).",
    "{0} bindings saved in the objects' Notes (so they can be copied).": "{0} liens enregistrés dans les notes des objets (pour pouvoir les copier).",
    "{0} text object selected at launch.": "{0} objet texte sélectionné au lancement.",
    "{0} text objects selected at launch.": "{0} objets texte sélectionnés au lancement.",
    "● To update": "● À mettre à jour",
    "≈ Spaces/line breaks only": "≈ Espaces/retours seulement",
    "≈ Case only": "≈ Casse seulement",
    "○ Not bound": "○ Non liée",
    "+ New in file": "+ Nouvelle dans le fichier",
    "! Not in file": "! Absente du fichier",
    "✓ Up to date": "✓ À jour",
    "✓ Bound": "✓ Liée",
    "– Other type": "– Autre type"
};

I18N.de = {
    "@help": "SO FUNKTIONIERT ES\n\n" +
        "1. DATENDATEI — Wählen Sie die Variablendatei: XML (Illustrator-Variablenbibliothek), CSV oder tabulatorgetrennte TXT (erste Zeile = Variablennamen, jede weitere Zeile = ein Datensatz; @ = Bild, # = Sichtbarkeit, % = Diagramm). Die Verknüpfung wird in der .ai-Datei gespeichert: beim nächsten Mal wird die Datei automatisch neu geladen. Enthält die Datei mehrere Datensätze, wählen Sie den gewünschten aus.\n\n" +
        "2. VERGLEICH — Jede Zeile ist eine Variable. Verglichen wird nur der Text: Fett, Kursiv, Unterstreichung und andere Formatierungen zählen nicht.\n" +
        "   ● Zu aktualisieren: der Text weicht von der Datei ab\n" +
        "   ≈ Nur Leerzeichen/Umbrüche, ≈ Nur Groß-/Kleinschreibung: ignorierte Unterschiede (Optionen „Leerzeichen und Umbrüche ignorieren“ / „Groß-/Kleinschreibung ignorieren“)\n" +
        "   ○ Nicht verknüpft: die Variable existiert, aber kein Objekt verwendet sie\n" +
        "   + Neu in der Datei: nur in der Datendatei (anlegen und verknüpfen)\n" +
        "   ! Nicht in der Datei: im Dokument, aber nicht in der Datendatei\n" +
        "   ✓ Aktuell: stimmt mit der Datei überein\n\n" +
        "3. AKTUALISIEREN — Einzeln, die ausgewählten oder alle zu aktualisierenden. Nur die abweichenden Wörter werden geändert: Formatierung, Leerzeichen und Umbrüche des übrigen Textes bleiben erhalten. „Letzte Aktualisierung rückgängig“ stellt die vorherigen Texte wieder her.\n\n" +
        "4. VERKNÜPFEN — „Automatisch zuordnen…“ schlägt vor, Objekte zu verknüpfen, die bereits den Wert einer Variable enthalten (Liste vor dem Bestätigen prüfen). Von Hand: „Auf der Zeichenfläche wählen…“, oder die Objekte vor dem Start des Skripts auswählen, oder Objekt und Variable im Register „Textobjekte“ wählen.\n\n" +
        "5. BILDMATERIAL KOPIEREN — Mit der Option „In Notizen speichern“ trägt jedes verknüpfte Objekt die Zeile „VAR:name“ in seiner Notiz (Attribute-Bedienfeld), die mit dem Objekt mitwandert. Das Skript ergänzt sie bei jedem Öffnen automatisch, auch für Verknüpfungen aus dem Variablen-Bedienfeld. Nach dem Einfügen in eine andere Datei das Skript öffnen und „Automatisch zuordnen…“ verwenden, um die Verknüpfungen wiederherzustellen.\n\n" +
        "Die Änderungen werden direkt im Dokument vorgenommen: denken Sie daran, die .ai-Datei zu speichern.",
    "Cannot save the link information in the document:": "Die Verknüpfungsinformationen können nicht im Dokument gespeichert werden:",
    "Record {0}": "Datensatz {0}",
    "The file contains no variables (<variable varName=\"…\">).\nIs it an Illustrator Variable Library file?": "Die Datei enthält keine Variablen (<variable varName=\"…\">).\nIst es eine Illustrator-Variablenbibliothek?",
    "The file contains no records with values (<sampleDataSet>).": "Die Datei enthält keine Datensätze mit Werten (<sampleDataSet>).",
    "Cannot open the file:": "Die Datei kann nicht geöffnet werden:",
    "The file is empty.": "Die Datei ist leer.",
    "The first row of the file must contain the variable names.": "Die erste Zeile der Datei muss die Variablennamen enthalten.",
    "The file only contains the row of names: the rows with the values are missing.": "Die Datei enthält nur die Zeile mit den Namen: die Zeilen mit den Werten fehlen.",
    "Row {0}": "Zeile {0}",
    "Error reading {0}:": "Fehler beim Lesen von {0}:",
    "({0} script)": "({0} Skript)",
    "Full manual:": "Vollständiges Handbuch:",
    "Linked data file": "Verknüpfte Datendatei",
    "Choose data file…": "Datendatei wählen…",
    "Reload": "Neu laden",
    "How it works": "So funktioniert es",
    "Record:": "Datensatz:",
    "Variables and comparison": "Variablen und Vergleich",
    "Text objects": "Textobjekte",
    "Show:": "Anzeigen:",
    "All": "Alle",
    "To update": "Zu aktualisieren",
    "Not bound": "Nicht verknüpft",
    "New in file": "Neu in der Datei",
    "Not in file": "Nicht in der Datei",
    "Ignored differences": "Ignorierte Unterschiede",
    "Up to date": "Aktuell",
    "Search:": "Suchen:",
    "Ignore spaces and line breaks": "Leerzeichen und Umbrüche ignorieren",
    "Variables that differ only in spaces or line breaks are not marked as to update. When updating, the document's spaces and line breaks stay where they are. Bold, italic and other formatting never count in the comparison.": "Variablen, die sich nur durch Leerzeichen oder Zeilenumbrüche unterscheiden, gelten nicht als zu aktualisieren. Beim Aktualisieren bleiben Leerzeichen und Umbrüche des Dokuments erhalten. Fett, Kursiv und andere Formatierungen zählen beim Vergleich nie.",
    "Ignore case": "Groß-/Kleinschreibung ignorieren",
    "Variables that differ only in upper/lower case are not marked as to update.": "Variablen, die sich nur durch Groß-/Kleinschreibung unterscheiden, gelten nicht als zu aktualisieren.",
    "Status": "Status",
    "Variable": "Variable",
    "Objects": "Objekte",
    "Text in the document": "Text im Dokument",
    "Last updated from": "Zuletzt aktualisiert aus",
    "Update all variables to update": "Alle zu aktualisierenden Variablen aktualisieren",
    "Update selected rows": "Ausgewählte Zeilen aktualisieren",
    "Undo last update": "Letzte Aktualisierung rückgängig",
    "Auto-match…": "Automatisch zuordnen…",
    "Binds the variables to the text objects that already contain their value, and restores the bindings saved in the Notes (e.g. after copying the artwork).": "Verknüpft die Variablen mit den Textobjekten, die bereits ihren Wert enthalten, und stellt die in den Notizen gespeicherten Verknüpfungen wieder her (z. B. nach dem Kopieren des Bildmaterials).",
    "Ctrl/Cmd+click or Shift+click to select several rows.": "Strg/Cmd+Klick oder Umschalt+Klick, um mehrere Zeilen auszuwählen.",
    "Details": "Details",
    "Select a variable in the list.": "Wählen Sie eine Variable in der Liste.",
    "Now in the document": "Aktuell im Dokument",
    "In the file": "In der Datei",
    "Update this one": "Diese aktualisieren",
    "Show in document": "Im Dokument zeigen",
    "Bind to selected objects": "Mit ausgewählten Objekten verknüpfen",
    "Pick on artboard…": "Auf der Zeichenfläche wählen…",
    "Bind from list…": "Aus der Liste verknüpfen…",
    "Unbind": "Verknüpfung lösen",
    "Create variable": "Variable anlegen",
    "Delete variable": "Variable löschen",
    "1 · Choose the text object": "1 · Textobjekt wählen",
    "Searches the text, layer, name or bound variable. Several words = all of them must be present.": "Durchsucht Text, Ebene, Namen oder verknüpfte Variable. Mehrere Wörter = alle müssen vorkommen.",
    "Without variable": "Ohne Variable",
    "With variable": "Mit Variable",
    "Selected before opening": "Vor dem Öffnen ausgewählt",
    "Bound variable": "Verknüpfte Variable",
    "Link": "Verkn.",
    "Layer": "Ebene",
    "Artb.": "ZF",
    "Text": "Text",
    "2 · Choose the variable": "2 · Variable wählen",
    "Searches the variable name and its value in the file.": "Durchsucht den Variablennamen und ihren Wert in der Datei.",
    "Obj.": "Obj.",
    "3 · Bind": "3 · Verknüpfen",
    "Bind object and variable": "Objekt und Variable verknüpfen",
    "Pick the object on the artboard…": "Objekt auf der Zeichenfläche wählen…",
    "New variable from this text…": "Neue Variable aus diesem Text…",
    "★ = object text equal to the variable's value in the file. Double-click an object to see it.": "★ = Objekttext gleich dem Wert der Variable in der Datei. Doppelklick auf ein Objekt, um es anzuzeigen.",
    "Options": "Optionen",
    "Also bind in the Variables panel": "Auch im Variablen-Bedienfeld verknüpfen",
    "Also uses Illustrator's binding (visible in the Variables panel). If disabled, bindings belong to the script only, in the objects' Notes.": "Verwendet auch die Illustrator-Verknüpfung (im Variablen-Bedienfeld sichtbar). Wenn deaktiviert, gehören die Verknüpfungen nur dem Skript, in den Notizen der Objekte.",
    "Remember in Notes (for copying)": "In Notizen speichern (zum Kopieren)",
    "Writes «VAR:name» in the object's Note: the binding survives when you copy the object or paste it into another file.": "Schreibt „VAR:name“ in die Notiz des Objekts: die Verknüpfung bleibt erhalten, wenn Sie das Objekt kopieren oder in eine andere Datei einfügen.",
    "Close": "Schließen",
    "File modified on {0}": "Datei geändert am {0}",
    "linked to this document on {0}": "mit diesem Dokument verknüpft am {0}",
    "Linked file not found: {0}": "Verknüpfte Datei nicht gefunden: {0}",
    "Press «Choose data file…» to show where it is now.": "Klicken Sie auf „Datendatei wählen…“, um anzugeben, wo sie sich jetzt befindet.",
    "No file linked.": "Keine Datei verknüpft.",
    "Press «Choose data file…» (XML, CSV or TXT) to load the variables file and compare it with the document.": "Klicken Sie auf „Datendatei wählen…“ (XML, CSV oder TXT), um die Variablendatei zu laden und mit dem Dokument zu vergleichen.",
    "{0} to update": "{0} zu aktualisieren",
    "none to update": "keine zu aktualisieren",
    "{0} up to date": "{0} aktuell",
    "{0} with ignored differences": "{0} mit ignorierten Unterschieden",
    "{0} not bound": "{0} nicht verknüpft",
    "{0} new in file": "{0} neu in der Datei",
    "{0} not in file": "{0} nicht in der Datei",
    "{0} of {1} rows": "{0} von {1} Zeilen",
    "Use «Update selected rows» to update them together.": "Mit „Ausgewählte Zeilen aktualisieren“ gemeinsam aktualisieren.",
    "(no object bound)": "(kein Objekt verknüpft)",
    "(no file loaded)": "(keine Datei geladen)",
    "(this variable is not in the file)": "(diese Variable ist nicht in der Datei)",
    "Will change:": "Wird geändert:",
    "Warning: the bound objects do not all have the same text.": "Achtung: die verknüpften Objekte haben nicht alle denselben Text.",
    "Only upper/lower case changes: it does not count as to update. «Make identical to file» aligns it with the file anyway.": "Nur die Groß-/Kleinschreibung ändert sich: gilt nicht als zu aktualisieren. „An Datei angleichen“ gleicht sie trotzdem an die Datei an.",
    "Only spaces or line breaks change: it does not count as to update. «Make identical to file» aligns it with the file anyway.": "Nur Leerzeichen oder Umbrüche ändern sich: gilt nicht als zu aktualisieren. „An Datei angleichen“ gleicht sie trotzdem an die Datei an.",
    "The text in the document matches the file.": "Der Text im Dokument stimmt mit der Datei überein.",
    "No object uses this variable: bind it to a text object.": "Kein Objekt verwendet diese Variable: mit einem Textobjekt verknüpfen.",
    "The variable is in the file but not in the document: create the variable and bind it to an object.": "Die Variable ist in der Datei, aber nicht im Dokument: Variable anlegen und mit einem Objekt verknüpfen.",
    "The variable is in the document but not in the loaded file.": "Die Variable ist im Dokument, aber nicht in der geladenen Datei.",
    "Non-text variable (visibility, image or graph): manage it from Illustrator's Variables panel.": "Keine Textvariable (Sichtbarkeit, Bild oder Diagramm): über das Variablen-Bedienfeld von Illustrator verwalten.",
    "artboard {0}": "Zeichenfläche {0}",
    "Last update: {0} from file {1}": "Letzte Aktualisierung: {0} aus der Datei {1}",
    "(record «{0}»)": "(Datensatz „{0}“)",
    "Never updated with this script.": "Nie mit diesem Skript aktualisiert.",
    "Make identical to file": "An Datei angleichen",
    "No variable chosen.": "Keine Variable gewählt.",
    "In the file:": "In der Datei:",
    "(empty)": "(leer)",
    "Not bound yet.": "Noch nicht verknüpft.",
    "Showing the first {0} of {1}: type in the search box to narrow down": "Die ersten {0} von {1} werden angezeigt: zum Eingrenzen in das Suchfeld tippen",
    "{0} of {1} objects": "{0} von {1} Objekten",
    "{0} ★ suggested": "{0} ★ vorgeschlagen",
    "Variable: {0}": "Variable: {0}",
    "(Illustrator binding)": "(Illustrator-Verknüpfung)",
    "(script binding)": "(Skript-Verknüpfung)",
    "No variable bound": "Keine Variable verknüpft",
    "Layer «{0}»": "Ebene „{0}“",
    "Artboard {0}": "Zeichenfläche {0}",
    "Name «{0}»": "Name „{0}“",
    "binding saved in the object's Note": "Verknüpfung in der Notiz des Objekts gespeichert",
    "same value as: {0}": "gleicher Wert wie: {0}",
    "very short value: check it": "sehr kurzer Wert: bitte prüfen",
    "the object matches several variables": "das Objekt passt zu mehreren Variablen",
    "Restore": "Wiederherstellen",
    "Bind": "Verknüpfen",
    "Extra copy": "Zusätzliche Kopie",
    "Nothing to match.": "Nichts zuzuordnen.",
    "There are no free text objects whose text matches the value of a variable.": "Es gibt keine freien Textobjekte, deren Text dem Wert einer Variable entspricht.",
    "There are no free text objects whose text matches the value of a variable (no data file loaded).": "Es gibt keine freien Textobjekte, deren Text dem Wert einer Variable entspricht (keine Datendatei geladen).",
    "Auto-match": "Automatisch zuordnen",
    "Unbound text objects whose text matches the value of a variable. Only the safe matches are preselected: check the list (double-click = show the object), add or remove rows with Ctrl/Cmd+click and press «Bind selected».": "Nicht verknüpfte Textobjekte, deren Text dem Wert einer Variable entspricht. Nur die sicheren Treffer sind vorausgewählt: Liste prüfen (Doppelklick = Objekt anzeigen), Zeilen mit Strg/Cmd+Klick hinzufügen oder entfernen und „Auswahl verknüpfen“ klicken.",
    "Action": "Aktion",
    "Layer · artboard": "Ebene · Zeichenfläche",
    "Object text": "Objekttext",
    "Note": "Hinweis",
    "artb. {0}": "ZF {0}",
    "Select all": "Alle auswählen",
    "None": "Keine",
    "Also save the existing bindings in the objects' Notes ({0} objects), so they survive when you copy the artwork": "Auch die bestehenden Verknüpfungen in den Notizen der Objekte speichern ({0} Objekte), damit sie beim Kopieren des Bildmaterials erhalten bleiben",
    "Cancel": "Abbrechen",
    "Bind selected": "Auswahl verknüpfen",
    "{0} of {1} rows selected": "{0} von {1} Zeilen ausgewählt",
    "Error while matching:": "Fehler beim Zuordnen:",
    "No changes.": "Keine Änderungen.",
    "Choose the variables file (XML, CSV or TXT)": "Variablendatei wählen (XML, CSV oder TXT)",
    "Data files": "Datendateien",
    "All files": "Alle Dateien",
    "Loaded {0}. Check the rows «To update».": "{0} geladen. Prüfen Sie die Zeilen „Zu aktualisieren“.",
    "The file no longer exists:": "Die Datei existiert nicht mehr:",
    "File reloaded.": "Datei neu geladen.",
    "Bold/italic style not found for {0} parts.": "Fett-/Kursivschnitt für {0} Stellen nicht gefunden.",
    "Some objects were not updated:": "Einige Objekte wurden nicht aktualisiert:",
    "Undone: {0}.": "Rückgängig gemacht: {0}.",
    "Some objects are already bound to another variable ({0}).\nReplace the binding with «{1}»?": "Einige Objekte sind bereits mit einer anderen Variable verknüpft ({0}).\nVerknüpfung durch „{1}“ ersetzen?",
    "Error while binding:": "Fehler beim Verknüpfen:",
    "({0} through the script, because the variable was already bound to another object)": "({0} über das Skript, weil die Variable bereits mit einem anderen Objekt verknüpft war)",
    "Binding removed.": "Verknüpfung gelöst.",
    "The window closes and Illustrator is free again.\n\n1. Select on the artboard the text object to bind to «{0}».\n2. Run the script again (best with a keyboard shortcut).\n\nThe binding is completed automatically and the window reopens here.\n\nContinue?": "Das Fenster wird geschlossen und Illustrator ist wieder frei.\n\n1. Wählen Sie auf der Zeichenfläche das Textobjekt, das mit „{0}“ verknüpft werden soll.\n2. Starten Sie das Skript erneut (am besten per Tastaturbefehl).\n\nDie Verknüpfung wird automatisch abgeschlossen und das Fenster öffnet sich wieder hier.\n\nFortfahren?",
    "Record selected: {0}": "Datensatz ausgewählt: {0}",
    "update of «{0}»": "Aktualisierung von „{0}“",
    "Update {0} variables ({1} objects) with the values of\n{2} — record «{3}»?": "{0} Variablen ({1} Objekte) mit den Werten aus\n{2} — Datensatz „{3}“ aktualisieren?",
    "update of all variables": "Aktualisierung aller Variablen",
    "Showing object {0} of {1} for «{2}».": "Objekt {0} von {1} für „{2}“ angezeigt.",
    "Choose the text object for «{0}» (★ = text equal to the value in the file) and press «Bind object and variable».": "Wählen Sie das Textobjekt für „{0}“ (★ = Text gleich dem Wert in der Datei) und klicken Sie auf „Objekt und Variable verknüpfen“.",
    "Unbind «{0}» from all {1} objects?": "Verknüpfung von „{0}“ mit allen {1} Objekten lösen?",
    "Error while creating the variable:": "Fehler beim Anlegen der Variable:",
    "Now bind it to a text object.": "Jetzt mit einem Textobjekt verknüpfen.",
    "Delete the variable «{0}» from the document?\nThe bound objects stay, with their current text, but will no longer be bound.": "Variable „{0}“ aus dem Dokument löschen?\nDie verknüpften Objekte bleiben mit ihrem aktuellen Text erhalten, sind aber nicht mehr verknüpft.",
    "Error:": "Fehler:",
    "Variable «{0}» deleted.": "Variable „{0}“ gelöscht.",
    "Name of the new variable (letters, digits, _ . -, no spaces):": "Name der neuen Variable (Buchstaben, Ziffern, _ . -, keine Leerzeichen):",
    "new_variable": "neue_variable",
    "Invalid name: «{0}».\nUse letters, digits, _ . - and start with a letter.": "Ungültiger Name: „{0}“.\nBuchstaben, Ziffern, _ . - verwenden und mit einem Buchstaben beginnen.",
    "The variable «{0}» already exists. Bind the object to it?": "Die Variable „{0}“ existiert bereits. Objekt damit verknüpfen?",
    "Differences in spaces/line breaks only no longer count as to update.": "Unterschiede nur bei Leerzeichen/Umbrüchen gelten nicht mehr als zu aktualisieren.",
    "Differences in spaces/line breaks now count as to update.": "Unterschiede bei Leerzeichen/Umbrüchen gelten jetzt als zu aktualisieren.",
    "Differences in case only no longer count as to update.": "Unterschiede nur bei Groß-/Kleinschreibung gelten nicht mehr als zu aktualisieren.",
    "Differences in case now count as to update.": "Unterschiede bei Groß-/Kleinschreibung gelten jetzt als zu aktualisieren.",
    "Warning: cannot read/write the document metadata, the link to the file will not be remembered.": "Achtung: die Metadaten des Dokuments können nicht gelesen/geschrieben werden, die Verknüpfung zur Datei wird nicht gespeichert.",
    "Double-click a row to see the object in the document.": "Doppelklick auf eine Zeile, um das Objekt im Dokument zu sehen.",
    "No text object selected: «{0}» was not bound. Try again with «Pick on artboard…».": "Kein Textobjekt ausgewählt: „{0}“ wurde nicht verknüpft. Erneut mit „Auf der Zeichenfläche wählen…“ versuchen.",
    "{0} text objects are selected.\nBind them all to «{1}»?": "{0} Textobjekte sind ausgewählt.\nAlle mit „{1}“ verknüpfen?",
    "Binding of «{0}» cancelled.": "Verknüpfung von „{0}“ abgebrochen.",
    "Open the Illustrator document with the variables first.": "Öffnen Sie zuerst das Illustrator-Dokument mit den Variablen.",
    "Unexpected error: {0}": "Unerwarteter Fehler: {0}",
    "(line {0})": "(Zeile {0})",
    "{0} object": "{0} Objekt",
    "{0} objects": "{0} Objekte",
    "{0} variable": "{0} Variable",
    "{0} variables": "{0} Variablen",
    "{0} variable selected": "{0} Variable ausgewählt",
    "{0} variables selected": "{0} Variablen ausgewählt",
    "Bound to {0} object:": "Verknüpft mit {0} Objekt:",
    "Bound to {0} objects:": "Verknüpft mit {0} Objekten:",
    "Already bound to {0} object.": "Bereits mit {0} Objekt verknüpft.",
    "Already bound to {0} objects.": "Bereits mit {0} Objekten verknüpft.",
    "{0} object selected": "{0} Objekt ausgewählt",
    "{0} objects selected": "{0} Objekte ausgewählt",
    "already bound to {0} object: this would be an extra copy": "bereits mit {0} Objekt verknüpft: wäre eine zusätzliche Kopie",
    "already bound to {0} objects: this would be an extra copy": "bereits mit {0} Objekten verknüpft: wäre eine zusätzliche Kopie",
    "{0} object bound": "{0} Objekt verknüpft",
    "{0} objects bound": "{0} Objekte verknüpft",
    "{0} binding restored": "{0} Verknüpfung wiederhergestellt",
    "{0} bindings restored": "{0} Verknüpfungen wiederhergestellt",
    "{0} binding saved in the Notes": "{0} Verknüpfung in den Notizen gespeichert",
    "{0} bindings saved in the Notes": "{0} Verknüpfungen in den Notizen gespeichert",
    "{0} variable updated": "{0} Variable aktualisiert",
    "{0} variables updated": "{0} Variablen aktualisiert",
    "In {0} object the whole text was replaced.": "In {0} Objekt wurde der gesamte Text ersetzt.",
    "In {0} objects the whole text was replaced.": "In {0} Objekten wurde der gesamte Text ersetzt.",
    "«{1}» bound to {0} object": "„{1}“ mit {0} Objekt verknüpft",
    "«{1}» bound to {0} objects": "„{1}“ mit {0} Objekten verknüpft",
    "Could not unbind {0} object.": "Verknüpfung von {0} Objekt konnte nicht gelöst werden.",
    "Could not unbind {0} objects.": "Verknüpfung von {0} Objekten konnte nicht gelöst werden.",
    "update of {0} variable": "Aktualisierung von {0} Variable",
    "update of {0} variables": "Aktualisierung von {0} Variablen",
    "{0} variable created.": "{0} Variable angelegt.",
    "{0} variables created.": "{0} Variablen angelegt.",
    "{0} binding saved in the objects' Notes (so it can be copied).": "{0} Verknüpfung in den Notizen der Objekte gespeichert (damit sie kopiert werden kann).",
    "{0} bindings saved in the objects' Notes (so they can be copied).": "{0} Verknüpfungen in den Notizen der Objekte gespeichert (damit sie kopiert werden können).",
    "{0} text object selected at launch.": "{0} Textobjekt beim Start ausgewählt.",
    "{0} text objects selected at launch.": "{0} Textobjekte beim Start ausgewählt.",
    "● To update": "● Zu aktualisieren",
    "≈ Spaces/line breaks only": "≈ Nur Leerzeichen/Umbrüche",
    "≈ Case only": "≈ Nur Groß-/Kleinschreibung",
    "○ Not bound": "○ Nicht verknüpft",
    "+ New in file": "+ Neu in der Datei",
    "! Not in file": "! Nicht in der Datei",
    "✓ Up to date": "✓ Aktuell",
    "✓ Bound": "✓ Verknüpft",
    "– Other type": "– Anderer Typ"
};

try {
    main();
} catch (e) {
    alert(L("Unexpected error: {0}", errMsg(e)) + (e.line ? " " + L("(line {0})", e.line) : ""), TOOL);
}

})();
