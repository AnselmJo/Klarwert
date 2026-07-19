# Klarwert – Bugfix- & Verbesserungsrunde (autonom abzuarbeiten)

## Kontext

Du arbeitest an Klarwert, einer lokalen Tauri-Desktop-Finanz-App. Phase 1+2 sind bereits gebaut und wurden getestet. Diese Runde behebt gemeldete Bugs und ergänzt eine Reihe kleinerer, klar spezifizierter Verbesserungen – **keine neuen Phasen** (Übersicht/Budgets/Steuer/Rechner bleiben unangetastet, außer wo explizit unten erwähnt).

**Lies zuerst neu (wurden seit der letzten Session aktualisiert):**
- `CLAUDE.md` – neu: Abschnitt "Transaktions-Disziplin" (Ursache mehrerer gemeldeter Bugs) und "Fehlermeldungen"-Prinzip, neue Invarianten 7+8, Backlog-Abschnitt
- `klarwert-product-specification.md` – Kap. 3 (Pipeline), 4.3 (Transaktionen), 4.4 (Verträge), 4.6 (Kategorien), Kap. 5 (neue Dialoge 5.18/5.19), Kap. 6 (Import-Wizard fast komplett überarbeitet), Kap. 7 (R4/R6/R9/R16)
- `klarwert-schema.sql` – neu: `category_aliases`, `custom_fields`, `transaction_custom_values`, WAL-Pragma
- `klarwert-seed-data.md` – DKB-Profil korrigiert (war fälschlich Windows-1252, ist UTF-8; falsches Trennzeichen korrigiert), C24-Profil neu ergänzt, Abschnitt 1b Kategorie-Aliase neu
- `klarwert-component-library.md` – A5 Combobox-Variante, B3b erweitert um Drag&Drop, Kap. 9.1 Mapping aktualisiert

**Test-Fixtures:** `test-fixtures/dkb_transaktionen.csv` und `test-fixtures/c24_transaktionen.csv` – reale (gekürzte) Bank-Exporte, an denen die gemeldeten Bugs reproduzierbar sind. Nutze sie zur Verifikation nach jedem relevanten Fix (siehe Akzeptanzkriterien unten).

**Zum Datenbestand:** Vorhandene Dev-/Test-Daten müssen nicht erhalten bleiben. DB zurücksetzen (Migrationen neu laufen lassen), wenn das einfacher ist.

## Arbeitsweise (wichtig – bitte genau befolgen)

1. **Arbeite auf einem eigenen Branch** (`fix/bugfix-round-1` o. ä.), nicht direkt auf `main`.
2. **Arbeite die Checkliste unten strikt von oben nach unten ab, ohne auf Rückmeldung zu warten.** Frage nur nach, wenn du auf eine echte Produktentscheidung stößt, die weder in den Dokumenten noch in dieser Liste beantwortet ist – nicht bei Implementierungsdetails.
3. **Nach jedem abgeschlossenen Punkt: Häkchen in dieser Datei setzen (`[ ]` → `[x]`) und committen** mit einer aussagekräftigen Message (z. B. `fix: Header-Erkennung toleriert fehlende trailing-Felder (Punkt 3)`), **bevor** du zum nächsten Punkt übergehst. Das ist die einzige Absicherung gegen Datenverlust, falls die Session vorzeitig endet – nicht überspringen.
4. **Wenn die Session/das Kontingent mittendrin endet:** Beim nächsten Start diese Datei öffnen, den ersten unerledigten Punkt (`[ ]`) suchen und dort weitermachen. Kein erneutes Aufsetzen von vorne nötig.
5. Kein Overengineering – shadcn/Radix/dnd-kit-Fähigkeiten nutzen statt selbst bauen (siehe Component Library Kap. 9.1).

---

## Checkliste

### A. Kritische Bugs (zuerst – blockieren den Import komplett)

- [ ] 1. **Transaktions-Disziplin durchsetzen** (CLAUDE.md, Abschnitt "Transaktions-Disziplin"): SQLite-Connection-Pool auf 1 begrenzen; ein einziges `runInTransaction(fn)`-Utility für den gesamten Import (Löschen/Einfügen/Pipeline/Protokoll als eine Transaktion); keine verschachtelten `BEGIN`/`COMMIT` in aufgerufenen Funktionen (Pipeline, Transfer-/Vertrags-Erkennung bekommen die offene Transaktion übergeben). Behebt `cannot rollback - no transaction is active` und `database is locked`.
- [ ] 2. **Inserts batchen** (Multi-Row-`INSERT` in Chunks von ~200) statt einzelner `execute()`-Aufrufe pro Zeile.
- [ ] 3. **Fortschritts-Phasen mit Fehlerbehandlung** (Product Spec Kap. 6, Schritt 4): "Datei wird gelesen…" → "Zeilen werden gespeichert…" → "Kategorisierung/Vertrags-/Transfer-Erkennung läuft…" → "Import wird abgeschlossen…"; jede Phase eigener Try/Catch, Fehler springt sofort mit Originalmeldung zu Schritt 5. Behebt den Hänger bei "X von X Zeilen" (unabhängig von der Zeilenzahl, siehe Bugbericht).
- [ ] 4. **Encoding immer aus den Bytes erkennen**, nie aus dem Bankprofil übernehmen (BOM → UTF-8-Validität → Fallback Windows-1252). Verifiziere mit `dkb_transaktionen.csv` (ist UTF-8, nicht Windows-1252 wie im alten Profil angenommen).
- [ ] 5. **Header-Erkennung tolerant gegenüber fehlenden trailing-Feldern**: Kandidatenzeile gültig, wenn alle Folgezeilen **höchstens so viele** Felder haben (nicht: exakt gleich viele); fehlende Felder am Zeilenende mit Leerstring auffüllen. Verifiziere mit `c24_transaktionen.csv` (Header hat 14 Spalten, Datenzeilen nur 13 – muss jetzt automatisch erkannt werden, ohne manuelle Auswahl).
- [ ] 6. **Betrags-Parser gemäß Algorithmus in Product Spec Kap. 6** implementieren (Komma/Punkt-Erkennung nach dem "letztes Zeichen gewinnt"-Prinzip, Ganzzahl-Fall ohne Trennzeichen). Verifiziere mit beiden Testdateien: DKB-Werte `900`, `-42`, `0` (ganzzahlig) und `-11,02`; C24-Werte `"-5,47 €"`, `"341,31 €"`.
- [ ] 7. **Richtungsabhängige Empfänger-Spalte** (Product Spec Kap. 6): Rollen "Empfänger (nur bei Ausgabe)" und "Zahlungspflichtiger (nur bei Einnahme)" im Spalten-Mapping ergänzen; Empfänger-Berechnung nach Vorzeichen des Betrags, nicht nach Text-Spalte wie "Umsatztyp". Verifiziere mit DKB-Profil (Zahlungsempfänger\*in vs. Zahlungspflichtige\*r).
- [ ] 8. **Import-Wizard-Fenster**: eigene Modal-Größe `import` (95vw×90vh) statt `wide`; Vorschau zeigt mind. 20 Zeilen; **keine** sticky/fixierten Spalten in der Mapping-Vorschau (bewusste Korrektur – war vorher fälschlich spezifiziert); Kopf+Fußzeile (Zurück/Weiter) immer sticky sichtbar; deaktiviertes "Weiter" zeigt den Grund als Text daneben.

### B. UI-Fixes

- [ ] 9. **macOS-Dock-Icon**: prüfen, ob `npm run tauri icon klarwert-icon.svg` (bzw. daraus erzeugtes 1024×1024-PNG) tatsächlich gelaufen ist und `src-tauri/icons/` befüllt sowie in `tauri.conf.json` unter `bundle.icon` eingetragen ist. Nach dem Build: macOS cached App-Icons hartnäckig – App-Bundle nicht nur überschreiben, sondern alte Version erst in den Papierkorb legen und leeren, dann neu installieren; alternativ `sudo rm -rf /Library/Caches/com.apple.iconservices.store && killall Dock && killall Finder`.
- [ ] 10. **Kategorie-Auswahl überall als durchsuchbare Combobox** (Component Library A5, shadcn `combobox`/cmdk) statt Klick-Dropdown – Transaktions-Drawer, Bulk-Bar, Regel-Editor, manuelle Transaktion, überall wo eine Kategorie gewählt wird.
- [ ] 11. **"Regel aus dieser Transaktion erstellen"** im Transaktions-Drawer (Product Spec 4.3/5.7): öffnet Regel-Editor mit vorbefüllter Bedingung "Empfänger ist genau [Empfänger]" + aktuelle Kategorie, nach Speichern zurück zum Transaktions-Drawer.
- [ ] 12. **Aufräum-Modus-Bug beheben**: Kandidatenkriterium ist `category_id = Unkategorisiert`, unabhängig von `categorization_source`. Zusätzlich: Setzen einer Transaktion auf "Unkategorisiert" setzt `categorization_source` immer auf `none`, nie `manual` (Product Spec Kap. 3, Punkt 1).
- [ ] 13. **Regel-Editor: Live-Vorschau als Liste** (max. 10 betroffene Transaktionen + "und N weitere"), nicht nur eine Zahl.
- [ ] 14. **Regel-Reevaluation bei Änderung**: Anlegen/Bearbeiten/Löschen/Umsortieren einer Regel triggert sofort eine Neubewertung aller Transaktionen mit `categorization_source IN ('none','rule')` (Product Spec Kap. 3, Punkt 4 / R4). Das behebt den Bug "Regel zeigt 1 betroffene Transaktion, aber Kategorie-Summe bleibt bei 0 € und die Transaktion bleibt Unkategorisiert".
- [ ] 15. **Kategorien-Seite: Suchfeld** (filtert nach Name + Aliase, siehe seed-data.md Abschnitt 1b) + Alias-Chips im Editor eigener Kategorien.
- [ ] 16. **Transaktionstabelle: Spalten-Auswahl massiv erweitern** (Component Library B3b): zusätzlich Verwendungszweck/Zweck (unabhängig von Empfänger), Konto, Person(en), Sparzweck, alle Bankfelder, alle benutzerdefinierten Spalten (siehe Punkt 19). Reihenfolge per Drag&Drop im Tabellenkopf **und** Pfeil-Buttons in der Auge-Popover-Liste.
- [ ] 17. **Sammlungen-Auswahl direkt im Transaktions-Drawer** (Multi-Select), nicht mehr nur über Bulk-Auswahl erreichbar.
- [ ] 18. **Datumsformat-Einstellung** (Profil → Allgemein): Select `dd.MM.yyyy` (Default)/`yyyy-MM-dd`, nur Anzeige, Speicherung bleibt intern ISO (`lib/dates.ts` zentral anpassen, nicht pro Stelle).
- [ ] 18b. **"Import-Format ändern"** pro Konto (Vermögen-Seite, ⋯-Menü an der Konto-Zeile): öffnet Schritt 2 des Wizards zur Korrektur des hinterlegten Importprofils.

### C. Neue Features

- [ ] 19. **Benutzerdefinierte Spalten** (Custom Fields, Text-only): Anlage im Import-Wizard Schritt 2 ("+ Neue Spalte anlegen") und im Profil (5.18); Nutzung in Transaktionstabelle (Punkt 16), Transaktions-Drawer, Regel-Bedingungen (zusätzliches "Feld" neben Verwendungszweck/Empfänger/Betrag/Konto).
- [ ] 20. **Vertrags-Erkennungsalgorithmus neu implementieren** gemäß Product Spec 4.4 (normalisierter Zweck-Vergleich mit Token-Overlap ≥70 % statt exakter Zeichenkettengleichheit, Turnus-Zeitfenster mit Toleranz). Der alte Algorithmus hat den in `dkb_transaktionen.csv`/Nutzerbestand vorhandenen Strom-Abschlag-Vertrag nicht erkannt, weil der Verwendungszweck den Monatsnamen enthält, der sich jeden Monat ändert – neuer Algorithmus muss das erkennen.
- [ ] 21. **Manuelle Vertragserstellung**: Bulk-Bar-Aktion "Als Vertrag zusammenfassen" (Product Spec 5.19) bei ≥2 selektierten Transaktionen.

### D. Abschließende Verifikation

- [ ] 22. Beide Test-Fixtures (`test-fixtures/dkb_transaktionen.csv`, `test-fixtures/c24_transaktionen.csv`) vollständig durch den Import-Wizard laufen lassen, jeweils in ein frisch angelegtes Testkonto: Kopfzeile muss automatisch erkannt werden (kein manueller Eingriff nötig), alle Spalten korrekt zugeordnet, Beträge korrekt geparst, Import läuft ohne Hänger/Fehlermeldung durch bis Schritt 5.
- [ ] 23. Kurzer Testlauf: Regel anlegen → betroffene Bestandstransaktion wird sofort tatsächlich umkategorisiert (nicht nur in der Vorschau). Transaktion auf "Unkategorisiert" zurücksetzen → taucht im Aufräum-Modus wieder auf.

---

*Ende der Checkliste. Wenn alle Punkte abgehakt sind: kurze Zusammenfassung der Änderungen als PR-Beschreibung vorbereiten, aber noch nicht mergen – das macht der Nutzer nach eigener Prüfung.*
