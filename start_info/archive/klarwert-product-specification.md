# Klarwert – Product Specification v2 (final, konsolidiert)

Diese Version ersetzt alle früheren Fassungen vollständig. Alle Review-Entscheidungen sind direkt eingearbeitet, es gibt keine Änderungsschichten. Ziel: Implementierung ohne weitere Produktentscheidungen.

---

## 1. Produkt & Prinzipien

Klarwert ist eine **lokale Desktop-App** (Tauri, Windows + macOS) für Haushalts-Finanzen: Konten, Transaktionen, Kategorisierung, Verträge, Sparen, Budgets, Steuer-Vorbereitung, Finanz-Rechner. Kein Login, keine Cloud, alle Daten in einer lokalen SQLite-Datei.

- Ein Haushalt pro Installation, 1–4 Personen, keine Zugriffsrechte (Personen dienen nur der Zuordnung/Auswertung).
- **Eine Währung global** (im Onboarding gewählt, Default EUR, im Profil änderbar als reine Anzeige-Einstellung). Keine Fremdwährungskonten, keine Umrechnung in v1.
- Automatik (Regeln, Vertrags-/Transfer-Erkennung) ist immer gekennzeichnet, bestätigbar, korrigierbar und überschreibt nie manuelle Entscheidungen.
- Nichts geht ohne Bestätigung endgültig verloren; einzige irreversible Aktion: "Alle Daten löschen".
- Dashboard: feste Reihenfolge/Größe, Widgets nur ein-/ausblendbar.
- Icons: ausschließlich Lucide (Mapping siehe Komponentenbibliothek Kap. 2). Beträge: `1.240,00 €`, Mono-Schrift.

## 2. Navigation & Rahmen

### 2.1 Sidebar

```
Erfassen:  Übersicht · Vermögen · Transaktionen
Ordnen:    Kategorien · Verträge · Sammlungen
Planen:    Budgets · Steuer · Rechner
Profil-Pill unten → Profil & Einstellungen
```

Keine gesperrten "bald"-Einträge mehr – alles Sichtbare ist funktional. "Wertpapiere" existiert nicht in der Navigation (kommt erst mit dem Modul).

### 2.2 Globalbar (auf jeder Seite)

| Element | Verhalten |
|---|---|
| Konto-Filter (Select: "Alle" + aktive Konten) | wirkt global auf **alle Beträge, Listen und Diagramme** aller Seiten |
| Personen-Filter (Select: "Alle" + aktive Personen) | dito; filtert über Konto-Ownerschaft |
| Info-Tooltip | Text: "Filtert alle angezeigten Beträge und Listen. Stammdaten (Kategorien, Regeln, Einstellungen) bleiben immer vollständig sichtbar." |
| Globale Suche | Placeholder "Verträge, Sammlungen, Kategorien durchsuchen…"; Dropdown mit max. 8 Treffern, gruppiert; Klick navigiert + öffnet Detail. Durchsucht **keine** Transaktionen. |
| **Benachrichtigungs-Glocke** | Icon `bell` mit Ungelesen-Badge (Zahl). Klick öffnet Popover: Liste der Benachrichtigungen (neueste zuerst, ungelesen fett), je Eintrag Icon nach Priorität, Text, Zeit, Klick navigiert zur Bezugsseite und markiert als gelesen. Fußzeile: "Alle als gelesen markieren". Leer: "Keine Benachrichtigungen." |

**Filter-Regel (global, einzige, ausnahmslos):** Die Filter wirken auf **jede** auf einer Seite angezeigte Zahl – Kennzahl, Summe, Zähler, Diagramm –, ohne Ausnahme. Das gilt explizit auch für Kopfzeilen-Werte (z. B. "N unkategorisiert", Saldo-Angaben) und für die Vermögen-Seite: Personen-Filter reduziert dort die Kontenliste + Gesamtsumme auf Konten dieser Person; Konto-Filter (auf etwas anderes als "Alle" gesetzt) reduziert die Vermögen-Seite auf genau dieses eine Konto (macht die Seite zur Detailansicht dieses Kontos). Einzige Ausnahme bleibt die Stammdaten-*Sichtbarkeit*: Kategorien-, Regel-, Sparzweck-, Steuer-Themen-Listen zeigen immer alle Einträge, nur ihre Summen/Zähler respektieren die Filter. Filterwahl bleibt über Seitenwechsel erhalten (Session), Reset bei App-Neustart.

**Zeitraum-Switcher (Übersicht & Transaktionen):** Zeitraum-Typ und gewählter Zeitraum sind **ein gemeinsamer, seitenübergreifender Zustand** (eigener Zustand-Store, nicht Teil der Globalbar-UI, aber genauso session-persistent). Wechselt man von Transaktionen zu Vermögen und zurück, bleibt die Auswahl erhalten – sie darf sich nie beim Seitenwechsel auf "Monat" zurücksetzen.

### 2.3 Demo-Modus

- Zwei getrennte SQLite-Dateien: `klarwert.db` (echte Daten) und `demo.db`. Niemals gemischt.
- Einstieg: Onboarding Schritt 1 bietet dritte Option "Mit Demo-Daten erkunden"; außerdem Umschalter im Profil ("Demo-Modus starten"/"Zurück zu meinen Daten").
- Im Demo-Modus: permanenter Banner oberhalb der Globalbar, sage-getönt: "Demo-Modus – Änderungen betreffen nur die Demo-Daten · [Zurück zu meinen Daten] · [Demo zurücksetzen]". "Demo zurücksetzen" regeneriert `demo.db` aus dem Seed (Bestätigungsmodal).
- Demo-Daten: siehe seed-data.md (2 Personen, 3 Konten, ~8 Monate realistische Buchungen, Verträge, Budgets, Sparzwecke – jedes Widget zeigt sofort sinnvolle Inhalte).

## 3. Kategorisierungs-Pipeline (Kernmechanik)

Läuft nach jedem Import sowie beim Anlegen manueller Transaktionen, pro Transaktion in dieser Reihenfolge – der erste zutreffende Schritt gewinnt, spätere Schritte ändern nichts mehr:

1. **Manuell** – vom Nutzer gesetzte Kategorie/Flags sind unantastbar (Reset im Drawer via "Automatik erneut anwenden").
2. **Vertrag** – Transaktion passt zu bestätigtem Vertrag → Vertragszuordnung + dessen Kategorie.
3. **Transfer-Erkennung** – (a) Betrag mit umgekehrtem Vorzeichen auf zwei eigenen Konten innerhalb ±2 Tagen → beide als Transfer-Paar markiert, Kategorie "Bank und Kredit → Kontentransfer"; Zielkonto-Typ Tagesgeld/Depot/Bausparen → abgehende Seite zusätzlich `Sparen=ja` mit Standard-Sparzweck des Zielkontos. (b) Neue Paare erhalten Status "erkannt, unbestätigt" (Badge in der Liste, Benachrichtigung) – ein Klick bestätigt, "Trennen" verwirft (Muster wird nicht erneut vorgeschlagen).
4. **Regeln** – global priorisierte Liste (Kap. 4.6), Bedingungen UND-verknüpft, erste zutreffende Regel gewinnt. Aktionen einer Regel (beliebig kombinierbar, min. eine): Kategorie zuweisen · Tag zuweisen · Als Transfer markieren · Als Sparen markieren (+ Sparzweck).
5. **Fallback** – System-Kategorie "Unkategorisiert" (nicht löschbar, nicht ausblendbar).

**Sparen-Semantik:** `Sparen=ja` heißt: dieser Abfluss ist kein Konsum, sondern Vermögensaufbau. Sparbetrag (Zeitraum) = Summe aller Sparen-Abflüsse; **Sparquote = Sparbetrag ÷ Einnahmen**. Sparzwecke: verwaltbare Liste (Defaults siehe Seed) mit optionalem Zielbetrag; Fortschritt = kumulierte Sparen-Transaktionen des Zwecks. Konten vom Typ Tagesgeld/Depot/Bausparen haben ein optionales Feld "Standard-Sparzweck".

**Auswertungs-Flags (Wirkung):** `Transfer` → aus Einnahmen/Ausgaben/Kategorien raus, Kontostand unberührt; Sparen-Seite eines Transfers zählt in Sparbetrag. `Aus Statistik entfernt` → aus allen Auswertungen raus, Kontostand unberührt. `Ungeprüft` → reiner Workflow-Marker ohne Rechenwirkung.

## 4. Seiten

### 4.1 Übersicht

- **Zeitraum-Switcher** (oben): Segmented Control Woche/Monat/Quartal/Jahr + ‹ › + Kalender-Popover + Quicklinks "Aktueller/Letzter Zeitraum". Grenzen: ältester Datenmonat bis heute. KPI-Vergleichsbasis skaliert mit: Woche→Vorwoche/Ø6W, Monat→Vormonat/Ø6M, Quartal→Vorquartal/Ø4Q, Jahr→Vorjahr/Ø3J.
- Freshness-Banner: "Daten aktuell bis [ältestes letzter-Import-Datum] (letzter Import: Konto, Zeit)"; bei Konten über der Erinnerungsschwelle zusätzlich Warnhinweis mit Link zu Vermögen.
- Widgets (feste Reihenfolge, einzeln ausblendbar via Modal "Elemente ein-/ausblenden"):
  1–4. KPI Einnahmen / Ausgaben / **Sparbetrag** / **Sparquote** (Delta-Farbe = finanzielle Bewertung: mehr Ausgaben = brick, mehr Sparen = sage)
  5. Sankey-Geldfluss (Einnahmen → Kategorien + Sparen; €/%-Umschalter; Vollbild mit PNG-Export – Export nur dort)
  6. Kategorisierungs-Fortschritt "(gesamter Haushalt)" – einziges Widget, das Globalfilter ignoriert; Button "**N aufräumen**" öffnet Aufräum-Modus (4.3b)
  7. Sammlung im Fokus (ausgeblendet, wenn keine aktive Sammlung)
  8. Ausgaben nach Kategorie (Donut, Top-5 Oberkategorien + "Sonstige"; Klick auf Segment → Transaktionen mit Kategorie-Filter)
  9. Cashflow letzte 6 Perioden (Balken Einnahmen/Ausgaben je Periode gemäß Zeitraum-Typ)
  10. **Sparen nach Zweck** (horizontale Balken je Sparzweck im Zeitraum; bei Zwecken mit Zielbetrag zusätzlich Gesamtfortschritt)
  11. Vergleich nach Person (Segmented Control im Header: Ausgaben/Kontostand, Default Ausgaben)
  12. Geplante Buchungen (nächste Fälligkeiten bestätigter Verträge = letzte Zahlung + Turnus; nicht klickbar)
- Zustände: Skeletons beim Laden; struktureller Empty State (keine Daten im Zeitraum) mit CTA "Konto anlegen"; "Keine Treffer"-Logik entfällt hier (keine Suche).

### 4.2 Vermögen (Konten & Vermögenswerte)

- Subline als strukturierte Segmente (kein "·"-Fließtext): Anzahl · Gesamtvermögen · "Saldo-Prüfung bei jedem Import".
- Kontenliste (List Row): Name, Typ-Badge, Owner, letzter Import, Sparkline (nur Import-Konten), Saldo, Aktionen ✎/🗑; Wertgegenstände zusätzlich Aktion "**Wert aktualisieren**" (Modal: Betrag+Datum → neuer Wertehistorie-Eintrag, append-only). Zeilen-Zustände: normal / veraltet (über Erinnerungsschwelle: Akzent + "Neuer Import"-Button) / "Saldo unbestätigt"-Badge (Anker fehlt).
- Warn-Box bei Saldo-Abweichung ≥ 0,01 € (berechneter Saldo vs. zuletzt eingegebener/importierter Bankstand) mit Differenz + "Jetzt aktualisieren".
- Widgets: **Vermögensentwicklung** (12 Perioden, Linienchart Standard-Größe: beschriftete Y-Achse, Hover-Tooltip je Datenpunkt) und **Sparen nach Zweck – Gesamtstand** (kumuliert je Zweck, Fortschrittsbalken bei Zielbetrag).
- Aktionen: "+ Konto / Vermögenswert" (Modal 5.1), Bearbeiten (5.2), Löschen (Bestätigung nennt exakte Transaktionsanzahl; Toast-Undo + Verlauf), "**Import**" (jederzeit an jeder Zeile verfügbar, nicht nur bei veralteten Konten) → Wizard (Kap. 6). Zusätzlich Topbar-Button "Datei importieren" (Zielkonto im Wizard wählbar) als zweiter, gut auffindbarer Einstiegspunkt.
- Globalfilter: siehe 2.2 (Personen-Filter reduziert Liste+Summe, Konto-Filter zeigt genau ein Konto als Detailansicht).
- Sortierung fest: Import-Konten vor Wertgegenständen, dann Typ-Reihenfolge Girokonto→Tagesgeld→Kreditkarte→Depot→Darlehen→Sonstiges, dann Saldo absteigend. Keine Suche.
- Empty State: "Noch keine Konten erfasst" + CTA.

### 4.3 Transaktionen

- Zeitraum-Switcher: **eigener, seitenübergreifend geteilter Zustand** (siehe 2.2) – Segmented Control als Reihe einzeln umrandeter, nebeneinanderliegender Boxen (kein Dropdown, keine unterstrichenen Tabs), Woche/Monat/Quartal/Jahr, + ‹ › + Kalender-Popover + Quicklinks. Subline: N Buchungen · Saldo des gefilterten Kontos · N unkategorisiert – **beide Zahlen respektieren zusätzlich Konto-/Personen-Filter** (siehe 2.2, keine Ausnahme).
- Suchfeld (live; durchsucht Empfänger, Zweck, Betrag-als-Text, Datum) + "Filter"-Button (Detailfilter-Modal 5.5) + **"CSV exportieren"** (exportiert exakt die aktuell gefilterte/sortierte Liste inkl. sichtbarer optionaler Spalten; Kern-Spalten immer dabei: Datum, Konto, Empfänger, Zweck, Betrag, Kategorie, Tags, Flags) + "**+ Transaktion**" (Modal 5.4b) + Aufräum-Button ("N aufräumen") + 🕐 Änderungsverlauf-Drawer + **Spalten-Auswahl (Auge-Icon)**.
- **Spalten-Auswahl:** Icon-Button `eye`, öffnet Popover mit Checkboxen für alle optionalen Spalten (Tags, Transaktionstyp, Kartenzahlung-Zeitpunkt, Bargeldabhebung-Zeitpunkt, Empfänger-IBAN, Empfänger-BIC, Empfänger-Kontonummer, Beschreibung, Bank-Kategorie, Bank-Unterkategorie, Kontoname (Bank)); alle standardmäßig aus. Auswahl wird als UI-Präferenz gespeichert (lokal, geräteweit, kein Sync-Bedarf). Kern-Spalten (Datum/Empfänger/Kategorie/Betrag) bleiben beim horizontalen Scrollen der optionalen Spalten links **sticky/eingefroren**, damit der Kontext nicht verloren geht.
- Quick-Filter-Chips: Unkategorisiert · Ungeprüft · **Transfers** · **Sparen** (togglebar) + entfernbare Chips aktiver Detailfilter. Alle Filter UND-verknüpft.
- Tabelle: sortierbare Spalten (Datum/Empfänger/Kategorie/Betrag; ein aktives Sortierkriterium; Default Datum absteigend; Icons chevron-up/down, unsortiert chevrons-up-down gedimmt), linksbündige Spalten, Checkbox-Selektion (Bulk-Bar), Zeilklick → Drawer, Rechtsklick → Kontextmenü. Badges in der Zeile: "Transfer" (bestätigt) / "Transfer?" (unbestätigt, klickbar → Bestätigen/Trennen-Popover) / "Sparen"-Punkt in Sparzweck-Farbe.
- Bulk-Bar-Aktionen (Dropdowns inline, Selektion bleibt nach Aktion bestehen): Kategorie · Tag · Sammlung · Sparen-Markierung (+Zweck) · Transfer-Markierung · Ungeprüft · Aus Statistik entfernen · Auswahl aufheben. Jede Bulk-Aktion → Toast + Verlaufs-Eintrag.
- **Drawer (5.4a):** importierte Transaktion → Kopffelder read-only mit Schloss-Hinweis "Importierte Daten – Korrektur über neuen Import"; manuelle Transaktion → alle Felder editierbar + Löschen-Button. Gemeinsam: Kategorie-Select (gruppiert Ober-/Unterkategorien, beide wählbar), **Tags** (Multi-Select + "+ neuer Tag" inline), Sparen-Switch + Sparzweck-Select, Ungeprüft/Transfer/Statistik-Switches, Herkunft der Kategorie ("automatisch via Regel X" → Link "Regel bearbeiten" / "manuell" → Link "Automatik erneut anwenden"). Bei vorhandenen Werten: Aufklappbereich "Weitere Bankdaten" (read-only) mit allen befüllten optionalen Feldern (Transaktionstyp, IBAN/BIC/Kontonummer des Empfängers, Zeitstempel, Beschreibung, Bank-Kategorie) – nichts geht beim Import verloren, auch wenn es in der Tabelle ausgeblendet ist. Speichern gesammelt, Toast-Undo.
- Pagination: "Weitere laden" ab 200 Zeilen.
- Empty States: strukturell ("Für diesen Zeitraum liegen keine Buchungen vor") vs. "Keine Treffer." + "Filter zurücksetzen".

#### 4.3b Aufräum-Modus

Fokussierter Vollflächen-Dialog (Modal `wide`) zum schnellen Abarbeiten unkategorisierter Transaktionen des gewählten Zeitraums.

- Kopf: Fortschritt "3 von 15" + Fortschrittsbalken; Aktionen "Überspringen", "Beenden".
- Karte je Transaktion: Datum, Konto, Empfänger groß, Zweck, Betrag; darunter Kategorie-Auswahl: zuletzt verwendete 6 Kategorien als Chips + vollständiges gruppiertes Select; Tag-/Sparen-Kurzoptionen.
- **Regel-Vorschlag:** kommt derselbe (normalisierte) Empfänger ≥2× im Bestand vor, erscheint nach der Kategorie-Wahl eine Inline-Box: "'Rewe' kommt 14× vor. Regel erstellen: Empfänger enthält 'Rewe' → [Kategorie]?" mit "Regel erstellen & anwenden" (legt Regel mit niedrigster Priorität an, wendet sie sofort auf passende unkategorisierte an, überspringt diese im Stapel) und "Nur diese".
- Auswahl speichert sofort und springt zur nächsten; nach der letzten: Abschluss-Screen "Alles aufgeräumt 🎉 – N kategorisiert, M Regeln erstellt".

### 4.4 Verträge & wiederkehrende Zahlungen

- Subline: N Verträge · Summe feste Kosten/Monat (nur Status Bestätigt/Preisänderung, jährlich÷12).
- Ansicht-Chips: "Verträge" / "Weitere wiederkehrende Zahlungen". Suche (Name/Kategorie, live).
- Vertrags-Karten (Entity-Card) nach Status: Neu erkannt (brick; Aktionen Bestätigen/Trennen) · Bestätigt (sage) · Preisänderung erkannt (gold; neuer+alter Betrag; Bestätigen/Trennen) · **Pausiert** (neutral; manuell setzbar, Erkennung eingefroren) · Beendet (neutral; automatisch nach 2 ausbleibenden Zyklen oder manuell). Sortierung: Handlungsbedarf zuerst (Preisänderung, Neu), dann Bestätigt, Pausiert, Beendet; je Gruppe Betrag absteigend.
- Wiederkehrende-Zahlungen-Karten: generierter Name (umbenennbar), typischer Betrag (gleitender Ø), Aktionen "Trennen" und "**Zu Vertrag hochstufen**" (erzeugt Vertrag Status Bestätigt, übernimmt Transaktionen, löscht den Eintrag; Toast-Undo).
- Drawer: Betrag, Status-Select (Aktiv/Pausiert/Beendet), Kategorie, Verlaufschart (Linien, Standard-Größe), letzte Buchungen + "Alle ansehen →" (Transaktionen vorgefiltert).
- Erkennungsregeln: Neu ab 2 aufeinanderfolgenden Perioden gleicher Empfänger, Betrag ±5 %, ähnlicher Zweck; Preisänderung bei Abweichung >5 % vom Referenzbetrag; Bestätigen aktualisiert Referenzbetrag; Trennen unterdrückt das Muster dauerhaft.
- Empty State: "Noch keine Verträge erkannt" (kein CTA – Erkennung ist automatisch; keine manuelle Vertragsanlage in v1).

### 4.5 Sammlungen

- Karten: einfache Sammlung (Summe, Anzahl, Zeitraum) / Sparziel (Zielbetrag + Fortschritt, >100 % voll, Betrag exakt) / abgeschlossen. Footer ✎/🗑 (Löschen entfernt nur Zuordnungen – Text betont Datenerhalt; Toast-Undo). Sortierung: aktive nach jüngster Zuordnung, dann abgeschlossene.
- Detailpanel inline unter dem Grid (bewusst kein Drawer): Transaktionsliste + Aktionen "**Transaktionen im Zeitraum hinzufügen**" (Zeitraum + optional Konto/Kategorie; Vorschau "23 Treffer, 4 bereits enthalten" vor Bestätigung; einmaliger Vollzug, keine Dauerregel) und "Entfernen" je Zeile.
- Modal Anlegen/Bearbeiten: Name, Switch "Sparziel mit Zielbetrag" (+Zielbetrag>0), Switch "Abgeschlossen".
- Abgrenzung (Inline-Explainer): Sammlungen = einmalige Projekte; laufende Sparströme → Sparzwecke (Profil/Vermögen); Tags = dauerhafte Etiketten.

### 4.6 Kategorien (inkl. Tags, Regeln, Sparzwecke)

- **Segmented Control "Alle / Eigene"** über der Liste. Kategorienliste: Oberkategorien mit Icon+Farbe, Unterkategorien eingerückt darunter in geerbter Farbe ohne Icon (kein Auf-/Zuklappen). Je Zeile: Jahres-Summe + Regelanzahl (Summen respektieren Globalfilter). **Eigene** Kategorien tragen einen kleinen Stift-Marker; Klick öffnet den Editor.
- Editor eigene Kategorie (Modal): Radio "Oberkategorie / Unterkategorie"; beide: Name (eindeutig je Ebene, case-insensitive); Oberkategorie: + Icon-Auswahl (Lucide-Raster) + Farbe (Swatches); Unterkategorie: + Select "Oberkategorie" (Templates **und** eigene wählbar; nur echte Oberkategorien gelistet – keine dritte Ebene). Nur eigene Kategorien sind editier-/löschbar; löschbar nur bei 0 Transaktionen, sonst nur ausblendbar.
- **Template-Kategorien ausblenden:** ⋯-Menü oben rechts in der Topbar → "Standard-Kategorien verwalten" → Drawer mit Switch je Template-Kategorie (Ober- und Unterebene getrennt schaltbar). Ausgeblendete: unsichtbar in Auswahl-Selects für Neues, historische Zuordnungen bleiben sichtbar/filterbar. "Unkategorisiert" ist System-Kategorie: nicht ausblendbar, nicht löschbar.
- Kategorie-Drawer (Klick auf Zeile): Jahres-Summe, Transaktionsanzahl, Regel-Liste dieser Kategorie mit "+ neue Regel" (öffnet Regel-Editor 5.7 mit vorbelegter Kategorie).
- **Topbar-Aktion "Regeln verwalten"** → Drawer: **alle** Regeln in globaler Prioritätsreihenfolge; je Zeile Drag-Handle (grip-vertical) + Pfeil-hoch/-runter-Buttons, Regel-Klartext, Ziel-Aktionen als Badges, ✎/🗑. Umsortieren wirkt sofort (Toast-Undo). Neue Regeln landen mit niedrigster Priorität.
- Abschnitt **Sparzwecke**: Liste (Name, Farbe, optionaler Zielbetrag, kumulierter Stand), "+ Sparzweck", ✎/🗑 (Löschen entfernt nur die Zweck-Zuordnung, Sparen-Flag bleibt; Bestätigung mit Anzahl).
- Abschnitt **Tags**: wie gehabt (Name+Farbe, Nutzungszähler, Löschen mit Bestätigung+Undo).

### 4.7 Budgets

- Kacheln je Budget: Kategorie, Verbraucht/Limit, Fortschrittsbalken (sage <80 %, gold 80–99 %, brick ≥100 %), Restbetrag bzw. Überschreitung, "Zeit verbleibend" in der Einheit des Zeitraum-Typs. **Mini-Verlauf**: 6 kleine Balken der letzten Perioden (Verbrauchsquote; Snapshot-Limits). Klick → Modal Bearbeiten (Kategorie fix, Limit + Zeitraum-Typ änderbar, Löschen-Button).
- Modal Anlegen: Kategorie (nur ohne bestehendes Budget; Ober- **oder** Unterkategorie – Oberkategorie-Budget misst inkl. aller Unterkategorien), Limit > 0, Zeitraum-Typ Woche/Monat/Quartal/Jahr.
- Hinweisblock "Kategorien ohne Budget" mit CTA. Sortierung: Verbrauchsquote absteigend. Benachrichtigung bei 80 % und bei Überschreitung.

### 4.8 Steuer

- Zweck: Vorbereitung der Einkommensteuererklärung durch Sammeln/Summieren relevanter Transaktionen. **Keine Steuerberechnung.**
- Kopf: **Jahresauswahl** (Select, Default Vorjahr) + freies Suchfeld (durchsucht Transaktionen des Jahres) + "Gesamtjahr als CSV exportieren".
- **Steuer-Themen-Blöcke** (konfigurierbare gespeicherte Filter; Defaults siehe Seed): je Block Titel, Jahressumme, Anzahl, aufklappbare Einzelliste (inkl. Kennzeichnung, welche Buchungen zu einem Vertrag gehören, mit Vertrags-Jahressumme), Aktionen "CSV exportieren" (nur dieser Block) und ✎ (Thema bearbeiten: Name + Kategorie-Mehrfachauswahl + optionale Stichwörter, die gegen Empfänger/Zweck matchen; UND zwischen Jahr und (Kategorien ODER Stichwörter)). "+ Thema" für eigene.
- Unterhalb: freie Trefferliste der Suchanfrage mit Summe. Empty States je Block: "Keine Buchungen in diesem Jahr."

### 4.9 Rechner

Eine Seite mit drei Tabs: **FIRE · Zinseszins · Entnahmeplan**. Gemeinsames Muster: linke Spalte Eingabeformular (jedes Feld mit ?-Tooltip, Texte siehe Seed; Defaults vorbefüllt), rechte Spalte Ergebnis (KPI-Kacheln + ECharts-Diagramm), Fußzeile "Szenario speichern" (Name) + Szenarien-Liste (laden/löschen). Alle Berechnungen live bei Eingabe (debounced), reine Funktionen in `lib/rechner/`.

Gemeinsame Steuer-Defaults: Kapitalertragsteuer effektiv = 26,375 % (Abgeltung 25 % + Soli); mit Kirchensteuer aus Profil: 9 % → 27,99 %, 8 % → 27,82 %. Checkbox "Teilfreistellung 30 % (Aktien-ETF)" reduziert die steuerpflichtige Basis auf 70 %. Alle Rechner rechnen mit **nominalen** Größen und weisen Realwerte (inflationsbereinigt) separat aus.

**a) FIRE.** Modus-Umschalter: "Wann bin ich frei?" (Sparrate gegeben → Zieljahr gesucht) / "Wieviel muss ich sparen?" (Wunsch-Alter gegeben → Sparrate gesucht). Inputs: monatlicher Netto-Wunschbetrag; erwartete Rendite p. a. (Default 6 %); Inflation (2 %); Entnahmerate/SWR (3,5 %); Steuersatz (Default s. o., editierbar); Teilfreistellung (an); vorhandenes Kapital; Sparrate mtl. bzw. Wunsch-Eintrittsalter (je Modus); Kapitalverzehr-Checkbox; Alter aus Profil-Geburtsjahr (fehlt es: Inline-Hinweis + Direkteingabe Alter). Berechnung: Brutto-Jahresbedarf = Netto×12 ÷ (1 − Steuersatz × steuerpflichtiger Anteil × Gewinnquote 0,6 angenommen); benötigtes Endkapital = Brutto-Jahresbedarf ÷ SWR; ohne Kapitalverzehr SWR wie eingegeben, mit Kapitalverzehr Annuität über (100 − Eintrittsalter) Jahre. Zieljahr/Sparrate über monatliche Aufzinsung: FV = K₀(1+i)ⁿ + R×((1+i)ⁿ−1)/i, i = (1+Rendite)^(1/12)−1; Modus 1 löst n, Modus 2 löst R. Outputs: Jahre bis FIRE + Alter + Kalenderjahr; benötigtes Endkapital; Sparrate; Fortschrittsbalken (vorhandenes Kapital ÷ Endkapital); gestapeltes Balkendiagramm pro Jahr (Einzahlungen vs. Wertzuwachs).
**b) Zinseszins.** Inputs: Anfangskapital; Sparrate mtl.; jährliche Sparraten-Erhöhung %; Zinssatz p. a.; Laufzeit Jahre; Inflation; TER/Gebühren % (optional, mindert Rendite); Ertragssteuer an/aus + Satz; Ausschüttend/Thesaurierend (ausschüttend: Steuer jährlich auf Ertrag; thesaurierend: Steuer am Ende auf Gesamtgewinn – vereinfachtes Modell, Tooltip weist darauf hin). Simulation jahresweise. Outputs: Endkapital (nominal + real), Summe Einzahlungen, Summe Erträge, gezahlte Steuern, Kostenwirkung TER; gestapeltes Balkendiagramm (Einzahlung/Ertrag) je Jahr.
**c) Entnahmeplan.** Inputs: Startkapital; monatliche Entnahme; Checkbox "Entnahme jährlich mit Inflation erhöhen"; Horizont Jahre; Rendite p. a.; Inflation; Gebühren %; Steuer an/aus + Satz (auf Ertragsanteil der Entnahme, Gewinnquote vereinfacht 60 %, Tooltip). Simulation jahresweise: Kapital = Kapital×(1+Rendite−Gebühren) − Jahresentnahme − Steuern. Outputs: Endsaldo nach Horizont; "Kapital reicht bis Jahr X / Alter Y" (falls vor Horizont aufgebraucht, brick hervorgehoben); Gesamtentnahmen; Gesamtsteuern; Flächendiagramm Kapitalverlauf.

### 4.10 Profil & Einstellungen

Kachel-Grid:
1. **Personen**: je Zeile Name (Inline-Edit, Autosave bei Blur/Enter), Rolle-Select (Erwachsener/Kind), **Geburtsjahr** (optional, 4-stellig – speist FIRE-Rechner), ✕ (Bestätigung "Konten/Transaktionen bleiben, verlieren die Zuordnung"; letzte Person nicht entfernbar); "+ Person".
2. **Allgemein**: Währung (Select, reine Anzeige, Hinweis "keine Umrechnung bestehender Beträge"); **Import-Erinnerung nach N Tagen** (Zahl, Default 30, 0 = aus).
3. **Steuer**: Kirchensteuer-Switch + Segmented 8 %/9 % (speist Rechner-Defaults; Tooltip erklärt das).
4. **Demo-Modus**: Umschalter (siehe 2.3).
5. **Daten**: "Backup exportieren" (JSON, komplette DB, mit Schema-Version) / "Backup importieren" (transaktional; Versions-Check, verständliche Fehlermeldung bei Inkompatibilität) / "**Datenordner öffnen**" (öffnet den OS-Ordner der DB/Backups) / Hinweis auf Auto-Backup ("Beim Beenden werden automatisch die letzten 10 Sicherungen behalten").
6. **Kategorien**: "Standard-Kategorien wiederherstellen" (setzt Ausblendungen zurück; eigene bleiben; Toast-Undo).
7. **Über**: Versionsnummer + "Auf GitHub: Feedback & Updates" (externer Link) + "Ersteinrichtung erneut ansehen".
8. **Gefahrenzone**: "Alle Daten löschen" (Texteingabe-Sperre "löschen"; kein Undo; Hinweis auf Backup; danach Onboarding).

### 4.11 Onboarding

3 Schritte (kumulativer Fortschritt): 1) Willkommen ("100 % lokal…") – Aktionen "Mit Demo-Daten erkunden" / "Überspringen" (legt Person "Ich" an) / "Los geht's". 2) Personen: "Dein Name" (Pflicht) + "+ weitere Person" (leere Zusatzfelder werden still entfernt) + Währungs-Select (Default EUR). 3) "Konto anlegen" → schließt und öffnet Modal 5.1. Onboarding erscheint automatisch nur bei `onboarding_done = false`.

## 5. Dialoge & Drawer (Feldreferenz)

| # | Dialog | Felder / Kerninhalt |
|---|---|---|
| 5.1 | Konto/Vermögenswert anlegen | Choice-Cards "Mit Import"/"Nur Wertstand"; Typ (Girokonto/Tagesgeld/Kreditkarte/Depot/Darlehen bzw. Bausparvertrag/Bargeld/Sonstiges); **Owner (Mehrfach) – Pflichtfeld, sobald >1 aktive Person existiert; bei genau 1 Person automatisch zugewiesen, Feld dann ausgeblendet**; Name ≤60; bei Tagesgeld/Depot/Bausparen: Standard-Sparzweck (optional); "Nur Wertstand": Wert (auch negativ) + Datum ≤ heute. "Mit Import" → weiter zum Import-Wizard. |
| 5.2 | Konto bearbeiten | Name, Typ, Owner, Standard-Sparzweck. Erfassungsart nicht wechselbar. |
| 5.3 | Wert aktualisieren (Wertgegenstand) | Betrag + Datum ≤ heute → neuer Historien-Eintrag. |
| 5.4a | Transaktions-Drawer | siehe 4.3. |
| 5.4b | Transaktion manuell anlegen | Konto (nur Import-Konten), Datum ≤ heute, Empfänger (Pflicht), Zweck, Betrag ≠ 0 (Vorzeichen = Richtung), Kategorie (optional; sonst Pipeline). Quelle=Manuell. |
| 5.5 | Detailfilter | Konto, Zeitraum (Woche/Monat/Quartal/Jahr wie Seiten-Switcher **oder "Benutzerdefiniert" → zwei Datumsfelder Von/Bis**, unabhängig vom seitenweiten Zeitraum-Zustand, nur für diese Filterung), Kategorie (gruppiert), Tag, Sparzweck, Betrag Min/Max (Min>Max → stilles Vertauschen); Erweitert (Disclosure): Tristate Alle/Nur/Ohne für Vertrag, Transfer, Sparen, Geprüft, Statistik-entfernt, Unkategorisiert. "Zurücksetzen"/"Anwenden" (erzeugt Chips). |
| 5.6 | Verlauf-Drawer | Bulk-/Regel-/Lösch-Aktionen, "Rückgängig" je Eintrag (30 Tage/50 Aktionen, danach gedimmt). |
| 5.7 | Regel-Editor | Vorlagen-Chips; Bedingungen 1..n (Feld Verwendungszweck/Empfänger/Betrag/Konto × Operator enthält/ist genau/≈±5 % (nur Betrag) × Wert), UND-verknüpft; Aktionen (min. 1): Kategorie (gruppiertes Select), Tag, Als Transfer, Als Sparen (+Zweck-Select); Live-Vorschau Treffer + Delta. |
| 5.8 | Sammlung anlegen/bearbeiten | Name ≤60; Sparziel-Switch + Zielbetrag>0; Abgeschlossen-Switch. |
| 5.9 | Generische Bestätigung | Titel-Frage, konkrete Konsequenz (Anzahl betroffener Datensätze wenn >0), Abbrechen (ghost) + Aktion (brick). |
| 5.10 | Sparzweck anlegen/bearbeiten | Name ≤40 eindeutig, Farbe, Zielbetrag optional >0. |
| 5.11 | Steuer-Thema bearbeiten | Name, Kategorie-Mehrfachauswahl, Stichwörter (Chips). |
| 5.12 | Budget anlegen/bearbeiten | Kategorie (Neuanlage: nur ohne Budget), Limit>0, Zeitraum-Typ; Bearbeiten: +Löschen. |
| 5.13 | Elemente ein-/ausblenden | Switch je Dashboard-Widget, "Fertig". |
| 5.14 | Kontextmenü (Transaktionszeile) | Kategorie zuweisen · Tag zuweisen · Als Transfer markieren · Als Sparen markieren · Zu Sammlung hinzufügen · — · Aus Statistik entfernen. Wirkt nur auf die Zeile. |
| 5.15 | Tag anlegen/bearbeiten | Name ≤30 eindeutig, Farbe. |
| 5.16 | Alle Daten löschen | Warntext, Backup-Hinweis, Eingabefeld; Button aktiv erst bei trim/lowercase == "löschen". |
| 5.17 | Demo zurücksetzen | Einfache Bestätigung. |

## 6. Import-Wizard (eigene Modal-Größe `import`: 95vw × 90vh, mehrstufig)

**Fenster-Anforderungen (verbindlich, behebt bekannten Bug):** Der Wizard läuft in einer eigenen, sehr großen Fenstergröße – nicht in `wide` (640px reicht bei 12–15 Bankspalten nicht). Die Vorschautabelle in Schritt 2/3 sitzt in einem eigenen Scroll-Container, der **horizontal und vertikal unabhängig vom restlichen Modal scrollt**; die ersten zwei Spalten bleiben beim horizontalen Scrollen sticky (Kontext nicht verlieren). Kopf (Schritt-Anzeige) und Fußzeile ("Zurück"/"Weiter") sind **immer sticky sichtbar**, unabhängig von der Scroll-Position der Tabelle – "Weiter" darf nie durch Überlauf unerreichbar werden. Ist "Weiter" deaktiviert, steht direkt daneben der Grund als Text (z. B. "Bitte Datum, Betrag und Empfänger zuordnen").

**Schritt 1 – Datei & Konto:** Zielkonto (vorbelegt), Dropzone (.csv/.xlsx, ≤20 MB; ungültig → Inline-Fehler, kein Weiter). Nach Dateiwahl automatisch: Encoding-Erkennung (UTF-8/Windows-1252), Trennzeichen, Dezimal- und Datumsformat.

**Schritt 1.5 – Kopfzeile bestätigen (nur wenn nötig):** Übersprungen, sobald ein Bankprofil-Fingerprint sofort matcht oder die Heuristik eindeutig eine Kopfzeile erkennt (Kriterium: erste Zeile, ab der alle Folgezeilen dieselbe Spaltenanzahl haben). Bei Mehrdeutigkeit (typisch bei DKB: Kontoname + "Kontostand vom …"-Zeile + Leerzeile vor der echten Kopfzeile): rohe erste ~15 Zeilen nummeriert anzeigen, Klick auf eine Zeile markiert sie als Kopfzeile – alles darüber wird verworfen. **Kontostand-Auto-Erkennung:** wird in den verworfenen Zeilen ein Muster wie "Kontostand vom TT.MM.JJJJ: 1.234,56 €" gefunden, wird Datum+Betrag automatisch als Vorschlag für den Anker in Schritt 3 übernommen ("Aus Datei übernommen – bitte prüfen").

**Schritt 2 – Zuordnung (übersprungen, wenn eindeutig):**
- *Bankprofil-Match:* Header-Zeile matcht Fingerprint eines mitgelieferten oder eigenen Profils → direkt zu Schritt 3, Hinweis "Erkannt: [Profil]".
- *Heuristik:* kein Match → Auto-Raten der Spaltenrollen (Datum=parsebar, Betrag=numerisch±, längste Textspalte=Zweck, zweite=Empfänger, ID-Kandidat=eindeutige Referenzspalte); Anzeige "automatisch erkannt – bitte prüfen".
- *Manuell:* Vorschautabelle (erste 5 Zeilen, sticky Kopf), über jeder Spalte ein Select mit Rollen: **Datum · Betrag · Empfänger · Verwendungszweck · Buchungs-ID · Transaktionstyp · Karteneinsatz-Zeitpunkt · Bargeldabhebung-Zeitpunkt · Empfänger-IBAN · Empfänger-BIC · Empfänger-Kontonummer · Beschreibung · Bank-Kategorie · Bank-Unterkategorie · Kontoname/Kontonummer (Bank) · Ignorieren**. Pflicht: Datum+Betrag+Empfänger zugeordnet, alle anderen optional (Werte landen in `extra_fields_json`, siehe Schema – nichts geht verloren, auch unbenutzte Spalten bleiben per Auge-Icon in der Transaktionstabelle einsehbar). Beim Fortfahren wird automatisch ein Importprofil gespeichert (Name-Vorschlag "Konto – eigenes Format"), inkl. Header-Fingerprint für künftige Auto-Erkennung.
- **Mehrkonten-Datei (z. B. C24-Exporte, die mehrere eigene Konten in einer Datei mischen):** enthält die Datei mehr als einen distinkten Wert in einer als "Kontoname/Kontonummer" zugeordneten Spalte, zeigt der Wizard die gefundenen Werte zur Auswahl ("Diese Datei enthält 2 Konten: Girokonto, C24 Smartkonto – welches gehört zu [Zielkonto]?") und importiert **nur die zum gewählten Zielkonto passenden Zeilen**; der Rest wird ignoriert (Hinweis "N Zeilen anderer Konten wurden ignoriert" im Ergebnis, Schritt 5).

**Schritt 3 – Vorschau & Modus:** 5 gemappte Beispielzeilen; Modus-Choice-Cards: "**Aktualisieren (empfohlen)**" (Upsert: mit Buchungs-ID → Update bei ID-Match; ohne ID → Fingerprint Datum+Betrag+Empfänger-normalisiert, Duplikate überspringen, Neues anhängen) / "**Komplett neu laden**" (alle *importierten* Zeilen des Kontos löschen + Datei laden; manuelle bleiben; Nutzer-Metadaten werden per Fingerprint übertragen, Verluste im Bericht gelistet). Zusätzliches Feld "Aktueller Kontostand laut Banking": **Pflicht beim ersten Import** (dient als Anker: Startsaldo = Eingabe − Summe importierter Transaktionen, gespeichert am Vortag der ältesten Buchung; bei Vollhistorie ist der Anker ≈ 0 und wirkt zugleich als Verifikation – daher immer abfragen, unabhängig davon ob Voll- oder Teilhistorie importiert wird), bei Folge-Importen optional (nur Verifikation; Abweichung ≥0,01 € → Warn-Benachrichtigung). Vorbelegt, falls Schritt 1.5 einen Kontostand aus der Datei erkannt hat. "Weiß ich gerade nicht"-Link beim Erstimport → Konto-Badge "Saldo unbestätigt", nachholbar per Ein-Feld-Dialog auf der Vermögen-Seite.

**Schritt 4 – Fortschritt:** Balken + "N von M Zeilen".

**Schritt 5 – Ergebnis:** gelesene Zeilen, neu, aktualisiert, übersprungene Duplikate, automatisch kategorisiert (Pipeline-Quote), erkannte Transfers/Verträge (Anzahl), ggf. ignorierte Fremdkonto-Zeilen (Mehrkonten-Datei), ggf. Liste nicht übertragbarer Metadaten, ggf. Fehler ("Andere Datei wählen"/"Schließen"). Import ist transaktional: bei Fehler bleibt der Altbestand vollständig unverändert.

## 7. Geschäftsregeln (konsolidiert)

| # | Regel |
|---|---|
| R1 | Kontostand = Anker + Σ Transaktionen ab Anker; Flags ändern nur Auswertungen. |
| R2 | Saldo-Verifikation bei jedem Import mit Eingabe; Abweichung ≥0,01 € → Warnung. Import-Erinnerung: Benachrichtigung, wenn letzter Import > N Tage (Setting, Default 30, 0=aus), geprüft bei App-Start. |
| R3 | Pipeline-Reihenfolge und Sparen-Semantik: siehe Kap. 3 (verbindlich). |
| R4 | Regel-Konflikt: globale Priorität, erste zutreffende Regel gewinnt; Regel-Löschung entkategorisiert nicht rückwirkend. |
| R5 | Transfer-Paar: beide Seiten verknüpft; Bestätigen/Trennen wirkt auf das Paar; getrennte Muster werden nicht erneut vorgeschlagen. |
| R6 | Kategorien: max. 2 Ebenen in der UI; Auswertungs-Roll-up Unter→Ober; Templates nur ausblendbar; Eigene löschbar nur bei 0 Nutzungen; "Unkategorisiert" = System. |
| R7 | Budgets: max. 1 je Kategorie; Oberkategorie-Budget inkludiert Unterkategorien; eine Kategorie ist nicht doppelt budgetiert (Unterkategorie nicht wählbar, wenn ihre Oberkategorie ein Budget hat, und umgekehrt); Perioden-Snapshots frieren Limits ein; Benachrichtigung bei 80 %/100 %. |
| R8 | Sammlungen: n:n, Löschen entfernt nur Zuordnung; Zeitraum-Bulk ist einmalig. |
| R9 | Verträge: Erkennung/Preisänderung/Beendigung siehe 4.4; nur automatische Entstehung; Pausiert friert Erkennung ein. |
| R10 | Steuer-Themen: Filter = Jahr UND (Kategorien ODER Stichwort-Match auf Empfänger/Zweck); keine Steuerberechnung. |
| R11 | Undo: Toast 3 s; Verlauf 30 Tage/50 Aktionen; Ausnahme ohne Undo: "Alle Daten löschen". Soft-Delete bis Fensterablauf. |
| R12 | Backups: JSON mit Schema-Version; Import transaktional + Versionsprüfung; Auto-Backup beim Beenden, Rotation 10. |
| R13 | Demo-Modus: separate DB, Banner immer sichtbar, Reset regeneriert Seed. |
| R14 | Benachrichtigungen: Upsert je Typ+Bezug (keine Duplikate), Auto-Archiv bei behobener Ursache. Typen: ImportErinnerung, SaldoAbweichung, ImportFehlgeschlagen, VertragNeu, Preisänderung, VertragBeendet, TransferErkannt, Budget80, BudgetÜberschritten, SparzweckErreicht. |
| R15 | Rechner: reine Funktionen, Formeln aus 4.9 verbindlich; Szenarien speichern Inputs+Ergebnis-Snapshot. |

## 8. Validierungen (Prüfung bei Blur/Submit, nicht je Tastendruck)

Namen: Konto/Sammlung ≤60, Kategorie/Sparzweck ≤40, Tag ≤30 – Pflicht, Eindeutigkeit wo in Kap. 5 genannt. Beträge: numerisch, Vorgaben je Dialog (Limit/Zielbetrag >0; Kontostand/Wert auch negativ; manuelle Transaktion ≠0). Daten ≤ heute. Import: Format/Größe vor Schritt 2; Mapping-Pflichtfelder vor Schritt 3; Anker-Pflicht beim Erstimport. Regel: ≥1 vollständige Bedingung, ≥1 Aktion; Betrag-Werte numerisch. Rechner: alle Prozentfelder 0–100 (SWR 0–20), Jahre 1–80, negative Eingaben abgefangen mit Feldfehler. Geburtsjahr: 1900–aktuelles Jahr. Personenname leer bei Blur → stiller Rollback. "löschen"-Sperre exakt nach trim+lowercase.

## 9. Bewusst außerhalb v1

Wertpapier-Modul (Kurse/Positionen) · Fremdwährungen/Umrechnung · Bank-APIs (PSD2/FinTS) · Split-Transaktionen-UI (Tabelle existiert) · Mobile-Layout · Mehrsprachigkeit · PDF-Exporte · eigenständiges i18n der Rechner-Steuerlogik (vereinfachte Modelle sind per Tooltip gekennzeichnet) · Auto-Update-Mechanismus (v1: GitHub-Link im Profil).
