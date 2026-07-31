# Klarwert

Eine private Haushalts-Finanz-App, die **zu 100 % lokal** läuft: keine Cloud, kein Login, keine Kontodaten verlassen dein Gerät.

![Klarwert Logo](klarwert-logo.svg)

## Warum Klarwert?

- **100 % lokal** – deine Bankdaten liegen als SQLite-Datei auf deinem eigenen Rechner, nicht in einer Cloud.
- **Keine Kontodaten an Dritte** – Import läuft ausschließlich über CSV/Excel-Exporte deiner Bank, keine Kontoverbindung (PSD2/FinTS), kein Server.
- **Open Source** – der komplette Code ist einsehbar, Mitwirken ist ausdrücklich erwünscht (siehe [CONTRIBUTING.md](CONTRIBUTING.md)).
- **Für den deutschen Finanzalltag gebaut** – Kirchensteuer, Steuerberater-Export, deutsche Bankformate (Sparkasse, DKB, ING, comdirect, C24, N26, Trade Republic, u. a.) sind direkt unterstützt.

## Was Klarwert kann

- Transaktionen aus gängigen deutschen Bankformaten importieren (automatische Spalten-Erkennung)
- Automatische Kategorisierung über Regeln + eine kuratierte, community-pflegbare Händler-Datenbank
- Verträge und wiederkehrende Zahlungen erkennen, Preisänderungen verfolgen
- Sparen nach Zweck (Rente/FIRE, Hauskauf, Kind, Urlaub, Notgroschen …) auswerten
- Budgets mit Woche/Monat/Quartal/Jahr-Zeiträumen
- Steuer-Vorbereitung: Belege nach Themen sortiert und summiert für die Steuererklärung
- FIRE-, Zinseszins- und Entnahmeplan-Rechner

## Download

| Betriebssystem | Download |
|---|---|
| Windows | [Releases](../../releases) |
| macOS | [Releases](../../releases) |
| Linux | [Releases](../../releases) |

Ausführliche Installationsanleitung (inkl. Hinweis zu Windows-SmartScreen/macOS-Gatekeeper): siehe [klarwert.github.io](https://github.io) *(Platzhalter – wird durch die tatsächliche GitHub-Pages-URL ersetzt, sobald die Seite live ist)*.

## Tech-Stack

Tauri 2 · React · TypeScript · Tailwind CSS · shadcn/ui · Apache ECharts · SQLite

## Für Mitwirkende

Siehe [CONTRIBUTING.md](CONTRIBUTING.md) für den Einstieg, `CLAUDE.md` für die technische Projektübersicht (Stack, Konventionen, Architektur) und `klarwert-community-haendler-db.md` für die Mitwirkung an der Händler-Datenbank (keine Programmierkenntnisse nötig).

## Sicherheit

Klarwert verarbeitet echte Finanzdaten. Sicherheitslücken bitte gemäß [SECURITY.md](SECURITY.md) melden.

## Lizenz

[MIT](LICENSE)
