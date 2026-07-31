# Klarwert – Website-Inhalte (für die Astro-Umsetzung)

Diese Datei enthält den vollständigen Text-Inhalt der Website, getrennt von der technischen Umsetzung (siehe `prompt-phase-5-launch.md`). Struktur: eine Startseite + drei Betriebssystem-Unterseiten, exakt nach dem ursprünglich vom Nutzer skizzierten Konzept.

## Startseite (`/`)

**Headline:** Klarwert – deine Finanzen, zu 100 % lokal

**Subline:** Ein kostenloses Open-Source-Finanztool. Deine Daten bleiben auf deinem Gerät – keine Cloud, kein Login, keine Kontodaten an Dritte.

**Primäre CTAs (drei Buttons nebeneinander, je nach erkanntem Betriebssystem des Besuchers das passende hervorgehoben):**
- [Windows Download →](/windows)
- [macOS Download →](/macos)
- [Linux Download →](/linux)

**Vier Vorteile (Icon + Kurztext, Reihe):**
- ✓ 100 % lokal – keine Cloud-Speicherung deiner Finanzdaten
- ✓ Keine Kontodaten an Dritte – Import per CSV/Excel, keine Bankverbindung
- ✓ Open Source – der komplette Code ist einsehbar
- ✓ Kostenlos – keine Kosten, keine Abos, keine Werbung

**Abschnitt "Was Klarwert kann"** (Kurzliste, siehe README.md für den vollständigen Funktionsumfang): Transaktions-Import mit automatischer Kategorisierung, Verträge & wiederkehrende Zahlungen, Sparen nach Zweck, Budgets, Steuer-Vorbereitung, Finanz-Rechner (FIRE/Zinseszins/Entnahmeplan).

**Screenshots-Karussell** (Platzhalter – Screenshots aus der laufenden App einfügen, sobald verfügbar: Übersicht, Transaktionen, Verträge).

**Feedback-Bereich (Footer, auf jeder Seite):**
- 🐛 [Fehler melden](https://github.com/<user>/klarwert/issues/new?template=bug_report.md)
- 💡 [Feature vorschlagen](https://github.com/<user>/klarwert/issues/new?template=feature_request.md)
- 💬 [Frage stellen](https://github.com/<user>/klarwert/discussions)

## Windows-Seite (`/windows`)

**Headline:** Klarwert für Windows

**Download-Button:** [Klarwert-Setup.exe herunterladen](https://github.com/<user>/klarwert/releases/latest) *(Link zeigt auf das jeweils neueste Release-Asset)*

**Installationsanleitung (nummeriert):**
1. Datei herunterladen und ausführen.
2. Windows zeigt eventuell die Meldung **"Windows hat Ihren PC geschützt"** (SmartScreen). Das ist normal bei neuer, unsignierter Software – klicke auf **"Weitere Informationen"** und dann **"Trotzdem ausführen"**.
3. Installation folgen, Klarwert startet automatisch.

**Systemvoraussetzungen:** Windows 10 (Version 2004+) oder Windows 11. WebView2 ist bei aktuellem Windows bereits vorinstalliert.

## macOS-Seite (`/macos`)

**Headline:** Klarwert für macOS

**Download-Button:** [Klarwert.dmg herunterladen](https://github.com/<user>/klarwert/releases/latest)

**Installationsanleitung (nummeriert):**
1. `.dmg`-Datei öffnen, Klarwert in den Programme-Ordner ziehen.
2. Beim ersten Start blockiert macOS **Gatekeeper** die App eventuell ("Klarwert kann nicht geöffnet werden, da der Entwickler nicht verifiziert werden kann").
3. Öffne **Systemeinstellungen → Datenschutz & Sicherheit**, scrolle zu "Sicherheit" – dort erscheint ein Hinweis auf Klarwert mit dem Button **"Trotzdem öffnen"**.
4. Danach startet Klarwert normal.

**Systemvoraussetzungen:** macOS 12 (Monterey) oder neuer.

## Linux-Seite (`/linux`)

**Headline:** Klarwert für Linux

**Download-Button:** [Klarwert.AppImage herunterladen](https://github.com/<user>/klarwert/releases/latest) *(zusätzlich `.deb`, sobald verfügbar)*

**Installationsanleitung (nummeriert):**
1. `.AppImage`-Datei herunterladen.
2. Ausführbar machen: Rechtsklick → Eigenschaften → "Ausführung erlauben" (oder `chmod +x Klarwert.AppImage` im Terminal).
3. Doppelklick startet Klarwert direkt, keine Installation nötig.

**Systemvoraussetzungen:** Aktuelle Distribution mit WebKitGTK (bei den gängigen Distributionen standardmäßig vorhanden).

## Hinweis für die Umsetzung

Alle `<user>`-Platzhalter in Links durch den tatsächlichen GitHub-Benutzernamen/Repo-Pfad ersetzen, sobald das Repo öffentlich ist. Screenshots sind bewusst als Platzhalter markiert – erst einfügen, wenn die App einen vorzeigbaren Stand hat, sonst wirkt die Seite verfrüht/unfertig (siehe Grundsatz "Bereiche, die unfertig wirken" aus der Projekt-Historie).
