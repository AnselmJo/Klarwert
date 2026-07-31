# Klarwert – Bugfix: Achsenbeschriftung im Rechner

## Problem

Der Rechner (FIRE/Zinseszins/Entnahmeplan, Product Spec 4.9) ist fertig gebaut. Die Y-Achsenbeschriftung der Diagramme skaliert nicht sinnvoll mit der Betragsgröße (aktuell z. B. "100.000 €" ausgeschrieben statt sinnvoll abgekürzt) und wird bei kleinem Fenster abgeschnitten/überlappt.

## Ursache vermutlich

Der Formatter für die Y-Achse ist direkt im jeweiligen Rechner-Widget inline definiert statt zentral in `lib/charts/` (Verstoß gegen die Konvention aus `CLAUDE.md`: "ECharts-Konfigurationen zentral in `lib/charts/`, nicht inline pro Widget") – deshalb vermutlich auch keine gemeinsame Lösung mit anderen Charts.

## Aufgabe

- [x] 1. Zentrale Formatierungsfunktion `formatAxisAmount(cents: number): string` in `lib/charts/` (oder `lib/money.ts`, falls dort der Rest der Geldformatierung liegt) erstellen, mit gestufter Abkürzung nach deutscher Konvention:
  - < 10.000 €: voller Betrag mit Tausenderpunkt (z. B. "8.400 €")
  - 10.000–999.999 €: voller Betrag mit Tausenderpunkt, keine Nachkommastellen (z. B. "120.000 €")
  - ≥ 1.000.000 €: "X,X Mio. €" (eine Nachkommastelle, Komma als Dezimaltrennzeichen, z. B. "1,2 Mio. €")
- [x] 2. Formatter in allen drei Rechner-Charts (FIRE, Zinseszins, Entnahmeplan) über `axisLabel.formatter` einbinden, keine Duplikate der Logik.
- [x] 3. `axisLabel: { hideOverlap: true }` (ECharts) als Basis-Absicherung gegen Überlappung setzen.
- [x] 4. Zusätzlich: bei sehr schmalem Container automatisch aggressiver abkürzen bzw. Label-Intervall vergrößern (Muster orientiert sich an der bereits bestehenden Breakpoint-Logik der Sparkline-Komponente in `klarwert-component-library.md`, Kapitel D – dort wechselt die Darstellung unter 200px Containerbreite automatisch; hier reicht eine einfache Breite-Prüfung statt Darstellungswechsel).
- [ ] 5. Manuell mit einem Szenario nahe 100.000 € und einem Szenario über 1 Mio. € (FIRE-Rechner mit hohem Zielkapital) in einem schmalen Fenster (~600px) prüfen.

## Nicht Teil dieses Auftrags

Keine sonstigen Rechner-Änderungen, keine Änderungen an anderen Chart-Typen außerhalb der drei Rechner-Widgets.
