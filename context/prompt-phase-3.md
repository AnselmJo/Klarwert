# Klarwert – Phase 3 (autonom abzuarbeiten)

## Kontext

Phase 1+2 sind gebaut, zwei Bugfix-Runden sind abgeschlossen (Checkpoint erreicht). Diese Runde: **Teil A** schließt die Händler-Datenbank/Kategorisierungs-Erweiterung und drei akute Bugs ab (waren noch nicht umgesetzt); **Teil B** ist die reguläre Phase 3 aus dem Phasenplan (Übersicht/Dashboard, Budgets, Steuer, Benachrichtigungen, Undo-System).

**Lies zuerst die komplette, aktuelle Dokumenten-Suite** (alle Dateien wurden in dieser Runde aktualisiert, nicht nur einzelne Kapitel):
- `CLAUDE.md` – neu: Abschnitte "Daten-Robustheit" (Template-Seeding, Migrations-Regeln) und "Kategorisierung: Händler-DB + Benutzerregeln"
- `klarwert-product-specification.md` – Kap. 3 (Pipeline: neue Stufen 4b Händler-DB, 4c Ähnlichkeit, Transparenz, Lern-Dialog), Kap. 4.5 (Sammlungen: zweistufige Auswahl), Kap. 4.6 (Händler-Editor-Abschnitt), Kap. 6 (Kontostand-Parser-Bugfix)
- `klarwert-schema.sql` – neu: `merchants`, `merchant_aliases`, `merchant_suppressions`, `categorization_log`, `categories.template_key`, `contracts.amount_tolerance_percent`/`confidence`/`merchant_id` (und `generated_rule_id` **entfernt** – zirkuläre FK behoben), `transactions.merchant_id`/`categorization_confidence`
- `klarwert-domain-model.md` – neue Entitäten Händler/Händler-Alias/Händler-Unterdrückung/Kategorisierungs-Protokoll/Benutzerdefinierte Spalte
- `klarwert-seed-data.md` – `template_key`-Ableitungsregel, DKB/C24 `import_all_columns=true`, Händler-Starter-Seed (Abschnitt 5b)
- `klarwert-component-library.md` – neu: B14 Händler-Editor-Tabelle, B15 Diff-Vorschau
- `klarwert-community-haendler-db.md` – **komplett neues Dokument**, Konzept für die Community-Pflege der Händler-Datenbank (Hybrid-Modell: lokaler Editor + GitHub-Issue + GitHub-Action-Konsens + statischer Diff-Download)

**Zum Datenbestand:** Falls die lokale DB bereits Test-Kategorien ohne `template_key` enthält (aus einer früheren Session): DB zurücksetzen ist hier ausdrücklich der einfachere Weg als eine nachträgliche Backfill-Migration zu schreiben – Reset ist erlaubt.

## Arbeitsweise (identisch zu den vorherigen Runden)

1. Eigener Branch (`phase-3`).
2. Checkliste strikt von oben nach unten, Teil A vor Teil B; nur nachfragen bei echten offenen Produktentscheidungen.
3. Nach jedem Punkt: Häkchen setzen + committen, **bevor** der nächste beginnt.
4. Bei Session-Ende: erstes `[ ]` in dieser Datei suchen, dort weiter.
5. Kein Overengineering – bestehende Bibliotheken nutzen.

---

## Teil A – Abschluss der Kategorisierungs-Erweiterung + akute Bugs

- [x] 1. **Bugfix: Template-Kategorien verschwinden nach Migration/Reset nicht mehr.** Idempotentes Seeding über `template_key` bei jedem App-Start implementieren (CLAUDE.md, "Daten-Robustheit"): fehlender `template_key` → einfügen; vorhandener (auch ausgeblendet/umbenannt) → unangetastet lassen. Nie löschen, nie Nutzer-Änderungen zurücksetzen.
- [x] 2. **Bugfix: `no such table: main.contracts_old`.** Zirkuläre FK zwischen `contracts` und `rules` ist im Schema bereits entfernt (`generated_rule_id` gestrichen) – bestehende Migrationen entsprechend anpassen: Rebuild-Migrationen für `contracts` liefen vermutlich fehlerhaft ab. Neue Migration idempotent/sicher schreiben (eine Transaktion, `PRAGMA foreign_keys=OFF` während Rebuild, danach `PRAGMA foreign_key_check`, `_old`-Tabelle im selben Schritt droppen).
- [ ] 3. **Bugfix: Kontostand-Anker zeigt "Aus Datei übernommen" aber 0,00 €.** Der aus der Datei extrahierte Kontostand-Betrag muss durch denselben robusten Betrags-Parser laufen wie normale Transaktionsbeträge (Product Spec Kap. 6) – kein naives `parseFloat`. Verifiziere mit `test-fixtures/dkb_transaktionen.csv` ("Kontostand vom 05.07.2026: 1.572,41 €" muss als 157241 Cent ankommen, nicht 0).
- [x] 4. **DKB/C24-Importprofile: alle Spalten per Default.** `import_all_columns=true` für diese beiden Profile setzen (seed-data.md Abschnitt 5) – alle Spalten werden importiert und sind über das Auge-Icon in der Transaktionstabelle sichtbar, abwählbar im Wizard.
- [x] 5. **Händler-Datenbank als Pipeline-Stufe** (Product Spec Kap. 3, Stufe 4b): Normalisierung (lowercase, Umlaute transliterieren, Rechtsform-Suffixe/Filialnummern entfernen) → IBAN-exakt → Alias exakt → Alias fuzzy (konservativ) → Regex-Sonderfälle. Greift nur, wenn keine Benutzerregel matchte. Ambiguität (Händler in eigener Historie mehrfach unterschiedlich kategorisiert) → `categorization_source='none'` + Vorschlag, keine blinde Mehrheitsentscheidung.
- [ ] 6. **Ähnlichkeits-Fallback** (Stufe 4c): Fuzzy-Abgleich gegen eigene manuell kategorisierte Historie, wenn weder Regel noch Händler matchten. Konservativ, niedrige Confidence.
- [ ] 7. **Händler-Starter-Seed einspielen** (seed-data.md Abschnitt 5b) inkl. Ambiguitäts-Blockliste (PayPal/Klarna ohne Standardkategorie).
- [ ] 8. **Transparenz-Anzeige im Transaktions-Drawer**: welche Stufe/Regel/Händler gegriffen hat (Klartext), Confidence-Wert, aufklappbarer Debug-Block mit knapp unterlegenen Alternativen. Jede automatische Zuordnung schreibt einen `categorization_log`-Eintrag.
- [ ] 9. **Lern-Dialog bei manueller Korrektur**: "Diese Zuordnung künftig automatisch übernehmen?" → Händler korrekt erkannt, nur Kategorie falsch → neue Benutzerregel; Händler nicht erkannt → neuer lokaler Alias. Zusatzoption bei Korrektur einer globalen Zuordnung: "bei mir nie anwenden" → `merchant_suppressions`-Eintrag (kein Löschen des globalen Eintrags).
- [ ] 10. **Händler-Editor-UI** (Kategorien-Seite, Component Library B14): durchsuchbare Tabelle, eigene Händler voll editierbar, kuratierte nur "Unterdrücken". Aktionen "Vorschläge teilen" (Export + Zeile-für-Zeile-Vorschau via B15 + vorausgefülltes GitHub-Issue) und "Regel-Update prüfen" (Diff via B15 gegen die statische Repo-Datei, siehe `klarwert-community-haendler-db.md`).
- [ ] 11. **Sparen-Zuordnung über Regeln**: Regel-Aktion "Als Sparen markieren (+Sparzweck)" muss auch für Überweisungen an *fremde* Konten funktionieren (nicht nur die automatische Transfer-Erkennung zwischen eigenen Konten) – Product Spec Kap. 3, "Wie eine Transaktion zu Sparen kommt".
- [ ] 12. **Transfer-/Sparen-Kategorie-Kopplung**, falls in Runde 2 noch nicht vollständig umgesetzt: Kategorie bei `Transfer=ja`/`Sparen=ja` abgeleitet + schreibgeschützt, nur Sparzweck frei wählbar.
- [ ] 13. **Sammlungen: zweistufige Transaktions-Zuordnung** (Product Spec 4.5): Stufe 1 Filter (Zeitraum + Konto + Kategorien einschließen/ausschließen), Stufe 2 Ergebnisliste mit Checkbox je Zeile, alle vorausgewählt, gezielt abwählbar, "Alle/Keine"-Kopfzeile.

## Teil B – Phase 3 (regulär)

- [ ] 14. **Übersicht/Dashboard** (Product Spec 4.1) vollständig: Zeitraum-Switcher, Freshness-Banner, alle 12 Widgets (KPI ×4, Sankey, Kategorisierungs-Fortschritt, Sammlung im Fokus, Ausgaben-Donut, Cashflow-Trend, Sparen nach Zweck, Vergleich nach Person, Geplante Buchungen), "Elemente ein-/ausblenden".
- [ ] 15. **Budgets** (Product Spec 4.7) vollständig: Kacheln mit Fortschrittsbalken + Mini-Verlauf, Anlegen/Bearbeiten-Modal mit Zeitraum-Typ, Budgetperioden-Snapshots, Benachrichtigung bei 80 %/100 %.
- [ ] 16. **Steuer-Seite** (Product Spec 4.8): Jahresauswahl, Steuer-Themen-Blöcke (Default-Set aus seed-data.md), CSV-Export je Block und gesamt, Themen-Editor.
- [ ] 17. **Benachrichtigungs-Logik** (nicht nur die Glocke, die schon existiert): tatsächliche Erzeugung aller Typen aus R14 (Import-Erinnerung, Saldo-Abweichung, Import fehlgeschlagen, Vertrag neu/Preisänderung/beendet, Transfer erkannt, Budget 80 %/überschritten, Sparzweck erreicht), Upsert je Typ+Bezug, Auto-Archiv bei behobener Ursache.
- [ ] 18. **Änderungsverlauf/Undo-System** vollständig (Product Spec 5.6, R11): Verlauf-Drawer, 30-Tage/50-Aktionen-Fenster, Rückgängig je Eintrag, für alle Bulk-/Regel-/Lösch-Aktionen aus Phase 1–3.

---

## Checkpoint-Verifikation

- [ ] 19. Beide Test-Fixtures erneut importieren, jetzt mit allen Spalten (DKB/C24-Default) – prüfen, dass der Kontostand-Anker korrekt befüllt wird (nicht 0,00 €).
- [ ] 20. Einen Händler-Vorschlag im Aufräum-Modus prüfen, eine Korrektur vornehmen und den Lern-Dialog durchlaufen (beide Zweige: neue Regel, neuer Alias).
- [ ] 21. App-Neustart nach einem DB-Reset: Template-Kategorien müssen vollständig und mit vorherigen Ausblendungen/Umbenennungen intakt wieder da sein.
- [ ] 22. Vollständiger Durchlauf: Übersicht mit echten Daten öffnen, Budget anlegen und Schwelle überschreiten (Benachrichtigung prüfen), Steuer-Thema-Export, eine Bulk-Aktion rückgängig machen.

---

*Ende der Checkliste.*
