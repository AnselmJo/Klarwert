# Klarwert – Entwicklungs-Roadmap für die nächste Claude-Code-Session

Reihenfolge, Begründung und die fertigen Prompts für die drei aktuell priorisierten Themen. Ergänzt `klarwert-backlog-roadmap.md` (dort steht die Einordnung ins Gesamtbild), ersetzt sie nicht.

## Reihenfolge

| # | Prompt | Warum an dieser Stelle |
|---|---|---|
| 1 | `prompt-rechner-achsen-fix.md` | Kleiner, isolierter Bugfix ohne Abhängigkeiten – zuerst abhaken, klarer Kopf für die größeren Themen danach. |
| 2 | `prompt-mehrkonto-import.md` | Muss vor Punkt 3 stehen: liefert mit dem C24-Import drei echte, verlinkte eigene Konten – der beste verfügbare Realtest für die IBAN-Erkennung in Punkt 3. Ohne diesen Schritt lässt sich Punkt 3 nur synthetisch testen. |
| 3 | `prompt-transfer-sparen-erkennung.md` | Größtes fachliches Thema, baut auf Punkt 2 auf, unabhängig vom parallelen Antigravity-Track. |

## Wichtig: Antigravity läuft parallel am selben File

`prompt-community-datenbanken.md` (Händler-DB-Pipelinestufe + Bank-Format-Templates, an Antigravity vergeben) fügt in `src/lib/pipeline.ts` die Stufen 5 (Händler-DB) und 6 (Ähnlichkeit) **nach** den Benutzerregeln ein. `prompt-transfer-sparen-erkennung.md` ändert Stufe 2 (Transfer-Erkennung) desselben Files. Beide Änderungen liegen an unterschiedlichen Stellen der Pipeline, aber im selben File – ein zeitgleicher Merge zweier Branches, die dieselbe Datei anfassen, ist unnötiges Konfliktrisiko.

**Empfehlung:** einen der beiden Branches zuerst fertigstellen und mergen, dann den zweiten Agenten auf dem aktuellen `main` neu starten (nicht auf einem veralteten Stand parallel weiterarbeiten lassen). Da Claude Code hier ohnehin sequenziell drei Prompts abarbeitet, liegt es nahe, den Antigravity-Branch entweder vor Punkt 1 oder nach Punkt 3 zu mergen – nicht mittendrin.

## Status Backlog-Reprioritisierung (Ergebnis dieser Runde, Details in `klarwert-backlog-roadmap.md`)

- **Ins Backlog verschoben:** Demo-Modus, Mehrsprachigkeit (Vorbereitung/Scaffolding weiterhin erlaubt), Bank-APIs (frühere "bewusst nicht geplant"-Einordnung bewusst wieder geöffnet).
- **Ganz depriorisiert:** Mobile-Layout, PDF-Exporte, CAMT.053/054-Import, Split-Transaktionen-UI, Theme.
- **Offen:** Theme wurde in der Anweisung sowohl bei "Backlog" als auch bei "ganz depriorisieren" genannt – aktuell als "ganz depriorisiert" gesetzt, bitte kurz bestätigen.
