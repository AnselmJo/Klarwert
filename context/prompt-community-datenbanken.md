# Klarwert – Community-Datenbanken: Händler-DB fertigstellen + Bank-Format-Templates neu bauen

## Kontext

Dieser Auftrag hat zwei Teile: (A) die bereits konzipierte, aber im Code noch nicht umgesetzte **Händler-Datenbank-Pipelinestufe (Ebene A)** fertigstellen, (B) die **Community-Bank-Format-Templates** als neues, analoges Feature aufbauen. Beide teilen sich später dieselbe Repo-Infrastruktur (GitHub Action, Issue-Templates, In-App-Diff-Update).

**Wichtig – Ist-Stand vs. dokumentierter Soll-Stand:** `klarwert-community-haendler-db.md` beschreibt Abschnitt 7 ("Phase 3 jetzt") teilweise als bereits gebaut. Der tatsächliche Code-Stand von `src/lib/pipeline.ts` (Stand dieser Anfrage) enthält aber **nur** folgende Stufen: (1) Vertrags-Zuordnung, (2) Transfer-Erkennung, (3) Benutzerregeln. Es gibt aktuell **keine** Händler-DB-Pipelinestufe, keinen Händler-Editor, keinen Ähnlichkeits-Fallback. Das Schema (`klarwert-schema.sql`) ist dafür aber bereits vollständig vorbereitet (`merchants`, `merchant_aliases`, `merchant_suppressions`, `categorization_log` mit `matched_by` inkl. `'merchant_iban'`, `'merchant_alias'`, `'similarity'`). Behandle den Code, nicht die Konzeptdokumente, als Quelle der Wahrheit für den Ist-Zustand – lies `src/lib/pipeline.ts` und die zugehörigen Repository-Dateien zuerst, bevor du von den Dokumenten ausgehst.

## Leserreihenfolge

1. `CLAUDE.md` – Konventionen, Invarianten, Konfliktregel (`schema.sql > domain-model > product-spec > component-library`)
2. `klarwert-schema.sql` – Tabellen `merchants`, `merchant_aliases`, `merchant_suppressions`, `categorization_log`, `import_profiles`, `transactions` (insb. `extra_fields_json`, `categorization_source`, `categorization_confidence`)
3. `klarwert-community-haendler-db.md` – Konzept Ebene A, Contribution-Modell, Sicherheitsnetze
4. `klarwert-community-bankformat-templates.md` (dieses Paket) – Konzept Bank-Format-Templates
5. `klarwert-product-specification.md`, Kapitel zur Kategorisierungs-Pipeline und zum Import-Wizard
6. `klarwert-component-library.md` – für die neue Händler-Editor- und "Vorlage vorschlagen"-UI (Muster: List Row, Combobox, Diff-Modal `update`-Variante existiert bereits als Komponente)
7. Aktueller Code: `src/lib/pipeline.ts`, `src/lib/import/`, `src/features/kategorien/`, `src/features/import/` (Bankprofil-Editor)

## Arbeitsweise

1. Eigener Branch `feature/community-datenbanken`.
2. Teil A → Teil B → Teil C in dieser Reihenfolge, Commit nach jedem abgeschlossenen Punkt.
3. Keine neue Dependency für Ähnlichkeitsvergleich/Fuzzy-Matching – kleine eigene Funktion (Trigram- oder Levenshtein-Distanz reicht), gemäß CLAUDE.md "keine weiteren größeren Dependencies ohne Notwendigkeit".
4. Bei Session-Ende: erstes offenes `[ ]` suchen, dort weiter.

---

## Teil A – Händler-DB als Pipeline-Stufe (Ebene A)

Keine Schema-Änderung nötig – nur Code.

- [ ] 1. **Normalisierungsfunktion** (`src/lib/pipeline.ts` oder eigenes Modul `src/lib/merchant-match.ts`): Kleinschreibung, Whitespace-Normalisierung, Entfernen von Referenznummern/Filialcodes am Ende des Empfängerstrings. Diese Funktion wird sowohl beim Matching als auch später beim Erzeugen von Community-Vorschlägen (Teil A.6) verwendet – ein einziges Modul, keine Duplikation.
- [ ] 2. **Zahlungsdienstleister-Extraktion vor der Normalisierung:** Erkennt PayPal/Klarna/Stripe-typische Muster im Empfänger (`counterparty`), extrahiert den eingebetteten echten Händlernamen aus `purpose`, falls möglich. Nur bei fehlgeschlagener Extraktion greift die bestehende Blockliste. Ziel: diese Buchungen sollen nicht kollektiv unkategorisiert bleiben.
- [ ] 3. **Pipeline-Stufe 5 (Händler-DB) einbauen**, nach Benutzerregeln, vor Ähnlichkeit: Abgleich der normalisierten Werte gegen `merchant_aliases` in `priority`-Reihenfolge (`iban` vor `name_exact` vor `name_fuzzy` vor `regex`). IBAN-Abgleich nutzt `extra_fields_json.recipient_iban` gegen `merchant_aliases.match_value where match_type='iban'`. Treffer respektiert `merchant_suppressions` (lokal unterdrückte globale Zuordnung wird übersprungen). Setzt `category_id`, `merchant_id`, `categorization_source='merchant'`, `categorization_confidence`, schreibt `categorization_log`-Eintrag mit `matched_by='merchant_iban'` bzw. `'merchant_alias'`.
- [ ] 4. **Pipeline-Stufe 6 (Ähnlichkeits-Fallback) einbauen**, nach Händler-DB, vor Unkategorisiert: Vergleicht normalisierten Empfänger gegen bereits *manuell* kategorisierte eigene Buchungen (nur `categorization_source='manual'`). Schwellwert ≥ 0,85 (konfigurierbar als Konstante). Ergebnis **immer als Vorschlag markiert** (nicht stillschweigend wie ein sicherer Treffer behandeln – UI muss das transparent als "unsicher" anzeigen, siehe Component Library, Transparenz-Badge). `categorization_source='similarity'`, `categorization_log.matched_by='similarity'`.
- [ ] 5. **Lokaler Händler-Editor-UI** (Kategorien → "Händler-Datenbank"): durchsuchbare Tabelle (Händler, Standardkategorie, Aliase), editierbar, Schloss-Icon bei kuratierten Einträgen (`is_builtin=1`) mit `aria-label="Kuratiert, nicht direkt editierbar"` – Muster ist in `klarwert-component-library.md` bereits unter der entsprechenden Tabellen-Zeilen-Komponente beschrieben. Lokale Korrekturen legen `is_builtin=0`-Einträge oder `merchant_suppressions`-Zeilen an, nie Änderung an kuratierten Zeilen selbst.
- [ ] 6. **"Vorschläge teilen"-Export**: exportiert nur lokal ergänzte/geänderte `Händler → Kategorie`-Paare (+ optional auslösender Alias-Rohtext, normalisiert), Vorschau-Dialog mit Zeile-für-Zeile-Abwahl, öffnet vorausgefülltes GitHub-Issue per URL-Parameter.
- [ ] 7. **"Regel-Update prüfen"**: lädt die kuratierte `merchants`-Datei als statische Rohdatei von `raw.githubusercontent.com`, zeigt Diff ("12 neue Händler, 3 geänderte Kategorien – übernehmen?") vor Übernahme, protokolliert `source_version`.
- [ ] 8. **Starter-Seed generieren** (einmalig, außerhalb dieses Repos, nicht Teil des Codes): Hinweis im PR/Commit-Kommentar, dass der Seed aus bereits kategorisierten echten Buchungen extrahiert werden soll – ausschließlich normalisierter Empfänger → Kategorie, ohne Beträge/Daten/IBANs/Häufigkeiten, manuell gegengelesen vor Aufnahme in `klarwert-seed-data.md` Kapitel 5b.

## Teil B – Regression-Absicherung (Händler-DB)

- [ ] 9. Fixture-Ordner mit 10–20 anonymisierten Test-Buchungen anlegen (im Repo, synthetische Daten), die die Pipeline-Stufen 1–6 durchlaufen und die erwartete Kategorie/den erwarteten `categorization_source` prüfen (einfacher Unit-Test, kein E2E nötig).

---

## Teil C – Bank-Format-Templates (neu)

- [ ] 10. **Migration**: `alter table import_profiles add column source_version text` (siehe `klarwert-community-bankformat-templates.md`, Abschnitt 6). Einzige Schema-Änderung in diesem gesamten Auftrag.
- [ ] 11. **UI: "Als Vorlage vorschlagen"-Button** im bestehenden Bankprofil-Editor (Import-Wizard, Phase 1). Export enthält ausschließlich Struktur (`delimiter`, `encoding`, `date_format`, `decimal_format`, `header_fingerprint`, `column_map_json`) + 2–3 lokal generierte synthetische Beispielzeilen (nie echte Zeilen) – siehe Datenformat in `klarwert-community-bankformat-templates.md` Abschnitt 3.
- [ ] 12. **Vorschau-Pflicht + GitHub-Issue-Export**, analog Teil A.6, eigenes Issue-Template.
- [ ] 13. **"Regel-Update prüfen" erweitern**, um zusätzlich neue/aktualisierte `import_profiles` aus der Community-Datei zu erkennen und per Diff anzuzeigen (gleiche UI-Komponente wie Teil A.7, zweite Datenquelle).

## Teil D – Repo-seitige Infrastruktur (außerhalb der App, kann parallel/danach entstehen)

- [ ] 14. GitHub-Action, die eingehende Issues für **Händler** parst, unabhängige Zustimmungen je `Händler → Kategorie` zählt, ab ≥ 3 automatisch einen PR erzeugt **und mergt**, sofern das Regression-Set (Teil B) grün bleibt.
- [ ] 15. GitHub-Action-Erweiterung für **Bank-Format-Templates**: zählt Vorschläge je `header_fingerprint`, öffnet ab ≥ 2 einen PR, führt den echten Parser gegen die mitgelieferten `sample_rows` aus und kommentiert das Ergebnis – **merged wird hier nie automatisch**, unabhängig vom Ergebnis.
- [ ] 16. Zahlungsdienstleister-Blockliste (PayPal, Klarna, …) von der Auto-Übernahme bei Händler-PRs ausschließen (echter Händler steckt im Zweck, nicht im Empfängerfeld).

---

## Nicht Teil dieses Auftrags

Transfer-/Sparen-Erkennung über IBAN-Abgleich eigener Konten (`assets.iban`, `person_aliases`) ist ein separates Thema und explizit **nicht** in diesem Paket enthalten.
