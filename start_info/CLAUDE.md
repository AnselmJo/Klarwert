# CLAUDE.md – Klarwert

Klarwert ist eine lokale, private Haushalts-Finanz-App (Desktop, kein Login, keine Cloud). Dieses Dokument ist der Einstiegspunkt für die Implementierung.

## Dokumenten-Suite (Leserreihenfolge)

1. `CLAUDE.md` (dieses Dokument) – Stack, Struktur, Phasenplan, Invarianten
2. `klarwert-product-specification.md` – **verbindliche** Produkt-/Seitenspezifikation (v2, konsolidiert, keine Änderungsschichten)
3. `klarwert-domain-model.md` – fachliches Datenmodell (v2)
4. `klarwert-schema.sql` – konkretes SQLite-Schema (maßgeblich bei Detailfragen zum Datenmodell)
5. `klarwert-seed-data.md` – Template-Kategorien, Bankprofile, Steuer-Themen, Sparzwecke, Rechner-Defaults & Tooltip-Texte, Demo-Daten
6. `klarwert-component-library.md` – UI-Komponenten inkl. shadcn/ECharts-Mapping
7. `klarwert-icon.svg` / `klarwert-logo.svg` – App-Icon bzw. Logo mit Schriftzug

Konfliktregel: Bei Widerspruch gilt schema.sql > domain-model > product-spec > component-library. Das alte HTML-Wireframe (`klarwert-prototyp-vollstaendig.html`) ist nur grobe visuelle Referenz – die Dokumente überschreiben es in jedem Detail.

**App-Icon erzeugen:** `klarwert-icon.svg` in ein 1024×1024-PNG rendern (z. B. per `npx sharp` oder Browser-Export), dann `npm run tauri icon pfad/zum/icon-1024.png` – erzeugt automatisch alle benötigten Formate/Größen für Windows (.ico) und macOS (.icns). Nicht händisch pro Plattform bauen. `klarwert-logo.svg` wird als Sidebar-/About-Logo direkt als SVG eingebunden (kein Rasterexport nötig, da im App-Kontext gerendert).

## Tech-Stack (verbindlich)

| Schicht | Technologie |
|---|---|
| Shell | Tauri 2 (Windows `.msi`/`.exe`, macOS `.dmg`) |
| Frontend | React 18 + TypeScript (strict) + Vite |
| Styling | Tailwind CSS + shadcn/ui (Radix-basiert) |
| Charts | Apache ECharts (`echarts-for-react`) |
| Datenbank | SQLite via `@tauri-apps/plugin-sql` |
| State | TanStack Query (DB-Reads) + Zustand (UI-State: Filter, Selektion, Demo-Modus) |
| Icons | lucide-react |
| Datei-Parsing | PapaParse (CSV), SheetJS (xlsx) |

Keine weiteren größeren Dependencies ohne Notwendigkeit. Kein Redux, kein ORM (SQL direkt, dünne typisierte Repository-Schicht).

## Projektstruktur

```
klarwert/
├─ src-tauri/            # Tauri-Konfiguration, SQL-Plugin, Auto-Backup-Hook
├─ src/
│  ├─ db/                # migrations/ (nummerierte .sql), repositories/ (ein Modul je Entität), demo-seed.ts
│  ├─ features/          # je Seite ein Ordner: uebersicht/, vermoegen/, transaktionen/, aufraeumen/,
│  │                     # vertraege/, sammlungen/, kategorien/, budgets/, steuer/, rechner/, profil/,
│  │                     # onboarding/, import/ (Wizard), benachrichtigungen/
│  ├─ components/        # Bibliotheks-Komponenten (siehe component-library), ui/ = shadcn
│  ├─ lib/               # pipeline.ts (Kategorisierung), import/ (Parser, Fingerprints, Heuristik),
│  │                     # rechner/ (fire.ts, zinseszins.ts, entnahme.ts – reine Funktionen, unit-testbar),
│  │                     # money.ts (Cent-Arithmetik), dates.ts
│  └─ stores/            # zustand-Stores (globalFilter, selection, demoMode)
```

## Konventionen

- UI-Sprache: Deutsch. Code (Bezeichner, Kommentare in TS): Englisch. SQL-Kommentare: Deutsch, `--`-Stil, lowercase keywords, leading commas (siehe schema.sql als Stilvorlage).
- Geldbeträge **immer als Integer-Cents** (`amount_cents`), nie Float. Formatierung deutsch: `1.240,00 €`, zentral in `money.ts`.
- Soft-Delete gemäß Spec (Undo-Fenster); einzige Hard-Delete-Aktion: "Alle Daten löschen".
- Alle Schreiboperationen laufen durch Repositories; Bulk-Aktionen erzeugen History-Log-Einträge.
- ECharts-Konfigurationen zentral in `lib/charts/` (Theme mit Design-Tokens), nicht inline pro Widget.

## Transaktions-Disziplin (verbindlich – behebt bekannte Bugs)

Die gemeldeten Fehler `cannot rollback - no transaction is active`, `database is locked` und ein Wizard, der bei "X von X Zeilen" ohne Fehlermeldung hängen bleibt (auch bei nur 9 Zeilen – also nicht datenmengenabhängig), haben mit hoher Wahrscheinlichkeit **eine gemeinsame Ursache**: verschachtelte oder über mehrere Connections verteilte Transaktionen.

**Verbindliche Regel:** Ein kompletter Import (Löschen bei "Komplett neu laden" + Einfügen aller Zeilen + Pipeline-Lauf + Import-Protokoll-Eintrag) läuft als **eine einzige Transaktion auf einer einzigen Connection** – `BEGIN` ganz am Anfang, `COMMIT` ganz am Ende, `ROLLBACK` im Catch. Funktionen, die *innerhalb* dieser Transaktion aufgerufen werden (Pipeline, Transfer-Erkennung, Vertrags-Erkennung), dürfen **niemals selbst ein eigenes `BEGIN`/`COMMIT` ausführen** – sie bekommen die offene Transaktion/den Executor übergeben und führen nur einfache Statements darauf aus. Verschachteltes `BEGIN` führt in SQLite entweder zum Fehler oder – schlimmer – zu einer Blockade, wenn eine zweite Connection auf denselben Lock wartet, den die äußere Transaktion hält (Deadlock, sieht wie "hängt" aus, ohne Fehlermeldung).

Konkret umsetzen:
- SQLite-Connection-Pool auf **genau 1 Connection** begrenzen (verhindert, dass BEGIN und ROLLBACK zufällig auf unterschiedlichen gepoolten Connections landen).
- Ein einziges wiederverwendbares `runInTransaction(fn)`-Utility in `src/db/`, das JEDER mehrschrittige Schreibvorgang nutzt (Import, Bulk-Aktionen, Regel-Anwendung) – nirgendwo sonst manuell `BEGIN`/`COMMIT` schreiben.
- Inserts batchen (z. B. Multi-Row-`INSERT ... VALUES (...),(...),(...)` in Chunks von 200) statt 900+ einzelner `execute()`-Aufrufe – reduziert IPC-Overhead und macht Hänger von echten Fehlern leichter unterscheidbar.
- Jeder Schritt des Imports (Löschen/Einfügen/Pipeline/Protokoll) meldet Fehler **mit der originalen Fehlermeldung der Datenbank** an die UI weiter (siehe "Fehlermeldungen" unten) – nie stillschweigend verschlucken.
- `pragma journal_mode = WAL` und `pragma busy_timeout = 5000` sind bereits in `klarwert-schema.sql` gesetzt – das ist Absicherung, ersetzt aber nicht die Single-Connection/Single-Transaction-Disziplin oben.

## Fehlermeldungen (verbindliches Prinzip)

Jede Fehlermeldung in der UI zeigt: (1) was der Nutzer versucht hat, in Alltagssprache, (2) die **original zurückgegebene Fehlermeldung** der Datenbank/des Parsers (nicht generisch "Ein Fehler ist aufgetreten"), (3) wenn möglich einen konkreten nächsten Schritt. Nie ein stiller Hänger ohne jede Rückmeldung – jeder asynchrone Schritt (Import, Bulk-Aktion, Regel-Anwendung) hat ein Timeout-/Catch-Verhalten, das im Zweifel lieber eine Fehlermeldung zeigt als endlos zu warten.



1. **Kategorisierungs-Pipeline-Reihenfolge:** Manuell > Vertrag > Transfer-Erkennung > Regeln (nach Priorität, erste Treffer-Regel gewinnt) > "Unkategorisiert". Manuelle Zuweisungen werden von Automatik nie überschrieben.
2. **Eine Währung global** (Setting, Default EUR). Keine Umrechnung, keine Währung pro Konto.
3. **Importierte Transaktionen sind feldgesperrt** (Datum/Empfänger/Zweck/Betrag). Korrektur nur über Re-Import. Manuelle Transaktionen sind voll editierbar.
4. **Kontostand** eines Kontos = Anker-Saldo + Summe aller Transaktionen ab Anker. Flags (Transfer/Statistik/Sparen) beeinflussen nur Auswertungen, nie den Kontostand.
5. **Demo-Modus** = separate SQLite-Datei (`demo.db`), niemals gemischte Daten. Aktiver Modus als App-State + permanenter Banner.
6. **Erweiterungs-Tabellen ohne v1-UI** (z. B. `transaction_splits`) bekommen **kein** UI-Element.
7. **Datumsspeicherung ist immer ISO** (`yyyy-MM-dd`) in der Datenbank, unabhängig von der Anzeige-Einstellung. Nur `lib/dates.ts` formatiert für die Anzeige nach `settings.date_format_display` (`de` = `dd.MM.yyyy` Default, `iso` = `yyyy-MM-dd`). Nie das gespeicherte Format ändern.
8. **Encoding beim Import wird immer aus den tatsächlichen Bytes erkannt** (BOM-Check, dann UTF-8-Validitätsprüfung, sonst Fallback Windows-1252) – nie blind aus einem Bankprofil übernommen. Bankprofile liefern nur einen *Vorschlag*, die tatsächliche Erkennung hat Vorrang (Banken ändern ihr Export-Encoding gelegentlich).

## Backlog (unpriorisiert, nicht Teil der aktuellen Phasen)

Nur gemerkt, noch nicht spezifiziert/geplant – erst nach Phase 4 angehen:

- **CAMT.053/054-Import** (ISO-20022-XML): eigener Parser nötig, sinnvoll als Ergänzung sobald eine Bank ohne CSV-Export vorkommt, kein Blocker aktuell.
- **Community-Import-Parser:** Parser-Schicht bewusst modular halten (ein Modul je Bank/Format, klar getrenntes Interface), damit Beiträge als Pull Request möglich sind. Kein Laufzeit-Plugin-System, das Fremdcode lädt (Sicherheitsrisiko bei einer Finanz-App mit echten Kontodaten).
- **ETF-/Aktienkurse automatisch abrufen** (Yahoo Finance/Stooq Tagesdaten) – gehört zum künftigen Wertpapiere-Modul.
- **Auto-Updater** (`@tauri-apps/plugin-updater`): signierte Releases über GitHub Releases, Manifest-Check beim Start, kein Tracking/Telemetrie.
- **Eigene Website** (GitHub Pages + Astro, `<user>.github.io/klarwert` – 0 € ohne eigene Domain): je Betriebssystem eine Downloadseite mit Installationsanleitung (inkl. SmartScreen-/Gatekeeper-Hinweis).
- **Feedback-/Feature-Request-Formular** (Kategorie/Titel/Beschreibung/Version/OS/optional E-Mail) → GitHub Action → automatisch als GitHub Issue in einem GitHub Project einsortiert.



1. **Fundament:** Tauri-Setup, Migrations, Repositories, Settings, Onboarding, Personen, Konten/Wertgegenstände, Import-Wizard (alle 3 Stufen), Transaktionsliste + Drawer + manuelle Transaktion, Template-Kategorien-Seed, Pipeline (nur Regeln + Unkategorisiert), Globalbar + Filter.
2. **Ordnung:** Regeln-UI + Prioritätsverwaltung, Transfer-Erkennung + Sparen/Sparzwecke, Verträge + wiederkehrende Zahlungen (+ Hochstufen), Sammlungen (+ Zeitraum-Bulk), Aufräum-Modus, Tags.
3. **Auswertung & Planung:** Übersicht/Dashboard komplett, Vermögen-Charts, Budgets + Perioden, Steuer-Seite, Benachrichtigungen, Änderungsverlauf/Undo.
4. **Abschluss:** Rechner (3 Module), Demo-Modus, Backup/Export/CSV-Export, Auto-Backup, Profil-Feinschliff, Packaging beider Plattformen.

Jede Phase endet in einem lauffähigen, nutzbaren Zustand.
