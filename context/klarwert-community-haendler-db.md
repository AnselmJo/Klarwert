# Klarwert – Community-Händler-Datenbank: Konzept & Contribution-Modell

Ziel: Eine gemeinsam gepflegte Zuordnung "Händler → Standardkategorie", die die automatische Kategorisierung für alle Nutzer verbessert – **ohne Server, ohne 0€-Budget zu sprengen, ohne die Local-First-/Datenschutz-Zusage zu verletzen, und ohne dass Beitragende Programmier- oder Git-Kenntnisse brauchen.**

## 1. Warum das mit dem Local-First-Versprechen vereinbar ist

Klarwerts Kernversprechen ("100 % lokal, keine Cloud, keine Kontodaten an Dritte") betrifft **sensible** Daten: Beträge, Daten, Kontonummern, Salden, wer was wann gekauft hat. Eine Zuordnung wie "REWE → Lebensmittel" ist dagegen **für alle gleich** und enthält nichts Persönliches. Genau diese Trennlinie macht ein Community-Modell möglich: geteilt wird **ausschließlich** `Händler → Kategorie` (+ optional der Roh-Erkennungstext als Alias), **niemals** Beträge, Daten, Häufigkeiten, IBANs, Salden oder Transaktionsdaten.

## 2. Abgewogene Optionen

| Option | Nutzerfreundlich | 0 € / kein Server | Datenschutz | Automatik/Konsens | Für Nicht-Techniker |
|---|---|---|---|---|---|
| A) Reiner GitHub-PR-Workflow | ✗ (Git nötig) | ✓ | ✓ | ✗ | ✗ |
| B) In-App-Export → manuelle Einreichung | ○ | ✓ | ✓ | ✗ (Hand-Kuratierung) | ✓ |
| C) Eigener Server mit Crowd-Consensus | ✓ | ✗ (Server + Kosten) | ✗ (Upload widerspricht dem Versprechen) | ✓ | ✓ |
| **D) Hybrid: In-App-Editor + GitHub-Issue-Einreichung + GitHub-Action-Konsens + statischer Daten-Download mit Diff** | ✓ | ✓ | ✓ | ✓ (halbautomatisch) | ✓ |

## 3. Empfehlung: Option D

Vier Bausteine, alle 0 € und ohne eigenen Server:

**(1) Lokaler Händler-Editor (in Klarwert).** Unter Kategorien → "Händler-Datenbank": durchsuchbare Tabelle (Händler, Standardkategorie, Aliase), voll editierbar. Non-technische Beitragende pflegen hier lokal – kein Code, kein Git. Jede Korrektur im Alltag (Lern-Dialog, siehe Product Spec Kap. 3) landet ebenfalls hier.

**(2) "Vorschläge teilen" (Export + Einreichung in einem Klick).**
- Exportiert **nur** die lokal ergänzten/geänderten `Händler → Kategorie`-Zuordnungen (+ optional den auslösenden Alias-Rohtext), als kompaktes, menschenlesbares Textblock-Format.
- **Vorschau-Pflicht:** vor dem Senden zeigt ein Dialog Zeile für Zeile, was geteilt wird ("REWE → Lebensmittel", …), mit Häkchen je Zeile zum Abwählen. Explizite Zusicherung im Dialog: keine Beträge/Daten/Kontonummern verlassen das Gerät.
- Ein Klick öffnet im Browser ein **vorausgefülltes GitHub-Issue** (per URL-Parameter, Issue-Template) mit dem Textblock. Der Nutzer bestätigt nur noch. (Einzige Hürde: GitHub-Account fürs Absenden – kein Git/PR-Wissen. Für maximale Niedrigschwelligkeit optional zusätzlich ein Web-Formular, z. B. Tally/Google Form → Sheet, das dieselben Daten aufnimmt; siehe Variante unten.)

**(3) Konsens per GitHub Action (der "Server", der keiner ist).**
- Eine GitHub Action (kostenlos für öffentliche Repos) parst eingehende Issues/Formular-Einträge und zählt je `Händler → Kategorie` die **unabhängigen** Zustimmungen.
- Ab Schwelle (Empfehlung Start: **≥ 3 unabhängige übereinstimmende Vorschläge**) erzeugt die Action automatisch einen **Pull Request**, der den Eintrag in die kuratierte Daten-Datei aufnimmt. Maintainer merged (oder Auto-Merge, sobald das Regression-Set grün ist, siehe unten).
- **Uneinigkeit** (derselbe Händler von verschiedenen Nutzern unterschiedlich kategorisiert) → **nicht** automatisch übernommen, sondern als "ambig" markiert; wird ausgeliefert als "Vorschlag, nicht automatisch anwenden" (deckt sich mit dem Ambiguitäts-Prinzip der Pipeline).
- Zahlungsdienstleister (PayPal/Klarna) bleiben per Blocklist von der Auto-Übernahme ausgeschlossen (echter Händler steckt im Zweck).

**(4) Statischer Daten-Download mit Diff-Vorschau.** Klarwert lädt bei "Regel-Update prüfen" die kuratierte Daten-Datei direkt als **statische Rohdatei** vom GitHub-Repo (`raw.githubusercontent.com`, kein Server, kein Tracking). Vor dem Übernehmen zeigt die App einen **Diff** ("12 neue Händler, 3 geänderte Kategorien – übernehmen?"). Der Nutzer entscheidet. `source_version` protokolliert den Stand. Das ist bei einem Tool ohne Server die einzige echte Kontrollmöglichkeit – deshalb Pflicht, kein stilles Auto-Update.

## 4. Datenformat (im Repo, getrennt vom Code)

Daten liegen als versionierte Datei im Community-Repo (JSON oder CSV), **nicht** als Code-Migration – Updates sind reine Daten-Releases, kein App-Rebuild. Struktur entspricht `merchants` + `merchant_aliases` (siehe Schema). Beispiel (JSON):

```json
{
  "source_version": "2026-08",
  "merchants": [
    { "canonical_name": "rewe", "display_name": "REWE", "default_category": "lebenshaltung.lebensmittel-und-getraenke",
      "aliases": [ {"type": "name_exact", "value": "rewe"}, {"type": "name_fuzzy", "value": "rewe markt"} ] }
  ]
}
```

Kategorie-Referenz über den stabilen `template_key` (Kap. 1b der Seed-Daten), nicht über eine lokale ID – damit die Datei bei jedem Nutzer korrekt auflöst.

## 5. Sicherheitsnetze

- **Regression-Set:** 50–100 anonymisierte Test-Transaktionen als Fixture im Repo; die GitHub Action prüft jeden Daten-PR automatisch dagegen und blockt Änderungen, die bestehende korrekte Zuordnungen kippen (verhindert stille Regressionen durch Community-Beiträge).
- **Nur additive Auto-Übernahme:** Die Action fügt neue Händler hinzu oder bestätigt Kategorien; das *Entfernen*/Umkategorisieren bestehender Einträge bleibt manuell beim Maintainer.
- **Lokale Souveränität:** Eine übernommene globale Zuordnung kann jeder Nutzer für sich unterdrücken (`merchant_suppressions`) oder per eigener Regel (Ebene B) überstimmen – Ebene B schlägt immer Ebene A.

## 6. Variante für noch niedrigere Hürde (optional, später)

Statt GitHub-Issue ein eingebettetes Web-Formular (Tally o. ä., 0 €) → schreibt in ein Google Sheet → dieselbe GitHub Action liest das Sheet zusätzlich zu den Issues. Nimmt die GitHub-Account-Hürde raus. Nachteil: eine weitere Abhängigkeit; deshalb nicht Teil des ersten Wurfs, nur wenn sich zeigt, dass die GitHub-Hürde Beiträge spürbar bremst.

## 7. Was in Phase 3 gebaut wird vs. später

**Phase 3 (jetzt):** lokaler Händler-Editor, Händler-DB als Pipeline-Stufe (Ebene A), `merchant_suppressions`, Lern-Dialog, Transparenz-Anzeige, "Regel-Update prüfen" mit Diff gegen die statische Repo-Datei, Starter-Seed (Seed-Daten 5b).
**Später/Backlog:** die GitHub-Action-Konsens-Pipeline im Community-Repo (lebt außerhalb der App, kann unabhängig entstehen), Regression-Set im Repo, optionales Web-Formular, IBAN-Alias-Sammlung.
