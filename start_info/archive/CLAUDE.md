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

## Invarianten (nie verletzen)

1. **Kategorisierungs-Pipeline-Reihenfolge:** Manuell > Vertrag > Transfer-Erkennung > Regeln (nach Priorität, erste Treffer-Regel gewinnt) > "Unkategorisiert". Manuelle Zuweisungen werden von Automatik nie überschrieben.
2. **Eine Währung global** (Setting, Default EUR). Keine Umrechnung, keine Währung pro Konto.
3. **Importierte Transaktionen sind feldgesperrt** (Datum/Empfänger/Zweck/Betrag). Korrektur nur über Re-Import. Manuelle Transaktionen sind voll editierbar.
4. **Kontostand** eines Kontos = Anker-Saldo + Summe aller Transaktionen ab Anker. Flags (Transfer/Statistik/Sparen) beeinflussen nur Auswertungen, nie den Kontostand.
5. **Demo-Modus** = separate SQLite-Datei (`demo.db`), niemals gemischte Daten. Aktiver Modus als App-State + permanenter Banner.
6. **Erweiterungs-Tabellen ohne v1-UI** (z. B. `transaction_splits`) bekommen **kein** UI-Element.

## Phasenplan (Arbeitsreihenfolge)

1. **Fundament:** Tauri-Setup, Migrations, Repositories, Settings, Onboarding, Personen, Konten/Wertgegenstände, Import-Wizard (alle 3 Stufen), Transaktionsliste + Drawer + manuelle Transaktion, Template-Kategorien-Seed, Pipeline (nur Regeln + Unkategorisiert), Globalbar + Filter.
2. **Ordnung:** Regeln-UI + Prioritätsverwaltung, Transfer-Erkennung + Sparen/Sparzwecke, Verträge + wiederkehrende Zahlungen (+ Hochstufen), Sammlungen (+ Zeitraum-Bulk), Aufräum-Modus, Tags.
3. **Auswertung & Planung:** Übersicht/Dashboard komplett, Vermögen-Charts, Budgets + Perioden, Steuer-Seite, Benachrichtigungen, Änderungsverlauf/Undo.
4. **Abschluss:** Rechner (3 Module), Demo-Modus, Backup/Export/CSV-Export, Auto-Backup, Profil-Feinschliff, Packaging beider Plattformen.

Jede Phase endet in einem lauffähigen, nutzbaren Zustand.
