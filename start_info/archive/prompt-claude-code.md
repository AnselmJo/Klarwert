# Klarwert – Claude Code Prompt (Phase 1)

## Deine Aufgabe

Implementiere Phase 1 von Klarwert: eine Desktop-Finanz-App (Tauri 2 + React/TypeScript + SQLite).

Lies zuerst alle mitgelieferten Dokumente vollständig:
- `CLAUDE.md` – Stack, Konventionen, Invarianten, Phasenplan
- `klarwert-product-specification.md` – Produktentscheidungen (verbindlich)
- `klarwert-schema.sql` – SQLite-Schema (maßgeblich)
- `klarwert-seed-data.md` – Template-Kategorien, Bankprofile, Demo-Daten
- `klarwert-domain-model.md` – Datenmodell
- `klarwert-component-library.md` – UI-Komponenten

**Konflikt-Regel:** schema.sql > domain-model > product-spec > component-library.

---

## Phase 1 – Umfang

Implementiere **ausschließlich** folgende Teile, in dieser Reihenfolge:

1. **Projekt-Setup**
   - Tauri 2 + React 18 + TypeScript (strict) + Vite + Tailwind + shadcn/ui + lucide-react
   - `@tauri-apps/plugin-sql` für SQLite
   - PapaParse + SheetJS für Import
   - Ordnerstruktur exakt wie in CLAUDE.md beschrieben

2. **Datenbank**
   - Migrations-System: nummerierte `.sql`-Dateien in `src/db/migrations/`, Ausführung beim App-Start
   - Migration 001: komplettes Schema aus `klarwert-schema.sql`
   - Migration 002: Seed-Daten (Template-Kategorien aus seed-data.md Abschnitt 1, Sparzwecke Abschnitt 2, Default-Widgets Abschnitt 4, Settings mit Defaults)
   - Thin Repository-Schicht: ein TypeScript-Modul je Tabelle in `src/db/repositories/`, typisierte Funktionen (kein ORM, SQL direkt)

3. **Settings & Onboarding**
   - Settings-Store (Zustand): currency, import_reminder_days, kirchensteuer_aktiv, kirchensteuer_satz, onboarding_done
   - Onboarding-Flow: 3 Schritte gemäß Spec 4.11 (Willkommen / Personen+Währung / Konto-Anlegen-CTA); erscheint automatisch wenn `onboarding_done = false`

4. **Kern-Layout**
   - Sidebar mit Navigation (Erfassen / Ordnen / Planen gemäß Spec 2.1), Profil-Pill
   - Globalbar: Konto-Filter, Personen-Filter, Info-Tooltip, Benachrichtigungs-Glocke (Platzhalter ohne Logik), globale Suche (Platzhalter)
   - GlobalFilter-Store (Zustand): selectedAccountId, selectedPersonId
   - Responsive Breakpoints gemäß component-library.md

5. **Vermögen-Seite** (Spec 4.2)
   - Kontenliste mit allen Zuständen (normal / veraltet / saldo-unbestätigt)
   - Modal: Konto/Wertgegenstand anlegen (Spec 5.1)
   - Modal: Konto bearbeiten (Spec 5.2)
   - Modal: Wert aktualisieren für Wertgegenstände (Spec 5.3)
   - Lösch-Bestätigung mit Transaktionsanzahl
   - Vermögensentwicklungs-Chart: ECharts Linienchart, Y-Achse beschriftet, Hover-Tooltip (D2 Standard-Größe)

6. **Import-Wizard** (Spec Kap. 6, vollständig)
   - Alle 5 Schritte: Datei & Konto → Zuordnung (Fingerprint / Heuristik / Manuell) → Vorschau & Modus → Fortschritt → Ergebnis
   - Beide Modi: Aktualisieren (Upsert) und Komplett neu laden
   - Kontostand-Anker-Logik (Erstimport: Pflicht; Folgeimport: optional)
   - Bankprofil-Fingerprints aus seed-data.md Abschnitt 5
   - Importprofil automatisch speichern bei manuellem Mapping
   - Import ist transaktional (bei Fehler kein Teilimport)

7. **Transaktionen-Seite** (Spec 4.3, ohne Aufräum-Modus)
   - Tabelle mit Zeitraum-Switcher, Suche, Quick-Filter-Chips, Sortierung
   - Drawer: Transaktion detail (Spec 5.4a) – importierte Felder gesperrt, alle Zustände
   - Modal: Transaktion manuell anlegen (Spec 5.4b)
   - Detailfilter-Modal (Spec 5.5)
   - Bulk-Action-Bar mit allen Aktionen
   - Kontextmenü (Spec 5.14)
   - CSV-Export der gefilterten Liste

---

## Was Phase 1 noch NICHT enthält

Folgendes kommt erst in späteren Phasen – **nicht anfangen**:
- Übersicht/Dashboard, Kategorien-Seite, Verträge, Sammlungen, Budgets, Steuer, Rechner
- Kategorisierungs-Pipeline (Regeln, Transfer-Erkennung, Sparen-Logik)
- Aufräum-Modus
- Demo-Modus
- Benachrichtigungs-Logik
- Auto-Backup

---

## Arbeitsweise

- **Erst lesen, dann bauen.** Keine Annahmen treffen – alles ist in den Docs entschieden.
- **Kein Overengineering.** Wenn shadcn eine Komponente liefert, nicht selbst bauen.
- **Geldbeträge immer als Integer-Cents** (`amount_cents`). Formatierung zentral in `src/lib/money.ts`: `formatEur(cents: number): string` → `"1.240,00 €"`.
- **SQL-Stil** wie in schema.sql: lowercase keywords, leading commas, deutsche Inline-Kommentare.
- Nach jedem abgeschlossenen Abschnitt (1–7) kurz bestätigen was fertig ist, bevor du weiter machst.
- Frag nach, bevor du eine Produktentscheidung triffst, die nicht in den Docs steht.
