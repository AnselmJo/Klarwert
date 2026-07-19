# Klarwert – Claude Code Prompt (Phase 2)

## Ausgangslage

Phase 1 ist gebaut (Setup, DB, Onboarding, Layout, Vermögen, Import-Wizard, Transaktionen-Grundgerüst). Dieser Prompt hat zwei Teile: **A) Korrekturen an Phase 1** (aus Praxistest entstanden, zuerst erledigen) und **B) neuer Umfang Phase 2**.

**Dokumente wurden aktualisiert** – lies sie neu, verlasse dich nicht auf den Stand aus der letzten Session:
- `CLAUDE.md` (Icon-Hinweis ergänzt)
- `klarwert-product-specification.md` (Kap. 2.2, 4.2, 4.3, 5.1, 5.5, Kap. 6 Import-Wizard geändert)
- `klarwert-schema.sql` (`transactions.extra_fields_json` neu)
- `klarwert-seed-data.md` (Abschnitt 2b Tags neu)
- `klarwert-component-library.md` (A4, C1, neues B3b)
- `klarwert-icon.svg` / `klarwert-logo.svg` (neu)

Für Teil B reicht es, `klarwert-domain-model.md` nur bei konkreten Rückfragen nachzuschlagen (schema.sql ist maßgeblich und bereits vollständig) – spart Tokens.

**Zum Datenbestand:** Vorhandene Test-/Dev-Daten in `klarwert.db` müssen nicht migriert oder erhalten werden. DB zurücksetzen (Migrations neu laufen lassen) ist ausdrücklich erlaubt, wenn das einfacher ist als eine Migration für Altdaten zu schreiben.

---

## Teil A – Korrekturen an Phase 1 (zuerst)

1. **Import-Wizard: Fenstergröße + Bedienbarkeit.** Wizard läuft jetzt in eigener Modal-Größe `import` (95vw × 90vh, siehe Component Library C1). Vorschautabelle bekommt eigenen Scroll-Container (horizontal **und** vertikal, unabhängig vom restlichen Modal), erste 2 Spalten sticky beim horizontalen Scrollen. Kopf + Fußzeile (Zurück/Weiter) sind sticky, immer sichtbar. Ist "Weiter" deaktiviert, Grund als Text daneben anzeigen. **Das behebt den Bug, bei dem der Wizard bei der Spaltenzuweisung "feststeckt".**
2. **DKB-Header-Problem: Kopfzeile bestätigen.** Neuer Schritt 1.5 (Product Spec Kap. 6): wenn Bankprofil/Heuristik die Kopfzeile nicht eindeutig erkennen (z. B. DKB mit Konto-/Kontostand-Zeilen davor), rohe erste ~15 Zeilen nummeriert zeigen, Klick markiert die echte Kopfzeile. Zusätzlich: Kontostand-Zeile in der Datei ("Kontostand vom TT.MM.JJJJ: X €") automatisch erkennen und als Vorschlag in den Anker-Feld von Schritt 3 übernehmen.
3. **"Neuer Import" jederzeit erreichbar.** Jede Konto-Zeile auf der Vermögen-Seite hat immer eine Import-Aktion (nicht nur bei veralteten Konten). Zusätzlich Topbar-Button "Datei importieren" mit Konto-Auswahl im Wizard.
4. **Mehr Spaltenrollen + `extra_fields_json`.** Spaltenzuordnung (Schritt 2) bietet zusätzlich: Transaktionstyp, Karteneinsatz-Zeitpunkt, Bargeldabhebung-Zeitpunkt, Empfänger-IBAN/-BIC/-Kontonummer, Beschreibung, Bank-Kategorie, Bank-Unterkategorie, Kontoname/Kontonummer (Bank). Werte landen in `transactions.extra_fields_json` (JSON, siehe Schema). Nichts wird verworfen, auch wenn eine Spalte "Ignorieren" zugewiesen wird? Nein – nur explizit "Ignorieren" verwirft; alle anderen Rollen speichern in `extra_fields_json`.
5. **Mehrkonten-Dateien (z. B. C24).** Enthält die als "Kontoname/Kontonummer" zugeordnete Spalte mehrere distinkte Werte, Auswahl anzeigen ("Diese Datei enthält 2 Konten: X, Y – welches gehört zu [Zielkonto]?"), nur passende Zeilen importieren, Rest im Ergebnis als "N Zeilen anderer Konten ignoriert" ausweisen.
6. **Owner-Pflichtfeld.** Im Modal "Konto/Vermögenswert anlegen": Owner-Feld nur sichtbar und Pflicht, wenn >1 aktive Person existiert; bei genau 1 Person automatisch zugewiesen, Feld ausgeblendet.
7. **Globalfilter wirken jetzt ausnahmslos überall** (Product Spec Kap. 2.2 neu gefasst): Transaktionen-Header (Saldo, "N unkategorisiert") respektiert Konto-/Personen-Filter. Vermögen-Seite: Personen-Filter reduziert Kontenliste + Summe, Konto-Filter (≠ "Alle") reduziert die Seite auf genau dieses eine Konto als Detailansicht. Prüfe alle bereits gebauten Seiten/Kacheln auf diese Regel.
8. **Zeitraum-Switcher-Persistenz.** Zeitraum-Typ + gewählter Zeitraum sind ein gemeinsamer, seitenübergreifender Zustand (eigener Zustand-Store, session-persistent) – darf sich beim Wechsel zwischen Übersicht/Transaktionen/anderen Seiten nie zurücksetzen.
9. **Zeitraum-Switcher als Boxen.** Segmented Control (Woche/Monat/Quartal/Jahr) muss als Reihe einzeln umrandeter Boxen dargestellt werden – kein natives `<select>`, keine unterstrichenen Tabs (Component Library A4 präzisiert).
10. **Detailfilter: benutzerdefinierter Zeitraum.** Zeitraum-Feld im Detailfilter-Modal bekommt Option "Benutzerdefiniert" mit zwei Datumsfeldern (Von/Bis), unabhängig vom seitenweiten Zeitraum-Zustand.
11. **Spalten-Auswahl (Auge-Icon) in der Transaktionstabelle.** Neue Komponente B3b: Icon-Button öffnet Popover mit Checkboxen für alle optionalen Spalten (Tags, Transaktionstyp, IBAN/BIC/Kontonummer, Zeitstempel, Beschreibung, Bank-Kategorie/-Unterkategorie, Kontoname). Default: alle aus. Kern-Spalten bleiben beim Scrollen sticky. Auswahl als lokale UI-Präferenz speichern.
12. **Logo/Icon einbinden.** `klarwert-logo.svg` in der Sidebar (ersetzt Platzhalter-Punkt + "Klarwert"-Text) und im Profil/"Über"-Bereich. App-Icon per `npm run tauri icon` aus `klarwert-icon.svg` (siehe CLAUDE.md) erzeugen und in Tauri-Config einbinden.

---

## Teil B – Phase 2: neuer Umfang

Nach den Korrekturen, in dieser Reihenfolge:

1. **Kategorien-Seite** (Product Spec 4.6) vollständig: Liste mit Ober-/Unterkategorien (Template-Seed aus seed-data.md Abschnitt 1), Segmented Control Alle/Eigene, Editor für eigene Kategorien (Radio Ober-/Unterkategorie), Template-Ausblenden-Menü (⋯ → Drawer mit Switches).
2. **Tags-Verwaltung** auf der Kategorien-Seite (Anlegen/Bearbeiten/Löschen, Seed aus seed-data.md Abschnitt 2b) **und** Tags-Auswahl im Transaktions-Drawer nachrüsten (Feld war in Phase 1 vorgesehen, aber ohne Verwaltung nutzlos – jetzt verbinden).
3. **Sparzwecke-Verwaltung** auf der Kategorien-Seite (Anlegen/Bearbeiten/Löschen, Seed aus seed-data.md Abschnitt 2, alle Werte änderbar) **und** Sparen-Switch + Sparzweck-Select im Transaktions-Drawer aktivieren.
4. **Regel-Editor + Regel-Priorität** (Product Spec 5.7, "Regeln verwalten"-Drawer): Bedingungen/Aktionen wie spezifiziert, globale Priorität mit Drag&Drop **und** Pfeil-hoch/-runter-Buttons (Component Library B13).
5. **Kategorisierungs-Pipeline aktivieren** (Product Spec Kap. 3): Manuell → Vertrag → Transfer-Erkennung → Regeln → Unkategorisiert. Läuft nach jedem Import und bei manueller Transaktionsanlage.
6. **Transfer-Erkennung** (Kap. 3, Punkt 3): Paar-Erkennung über `transfer_pair_id`, Bestätigen/Trennen-UI in der Transaktionstabelle, Sparen-Ableitung bei Zielkonto-Typ Tagesgeld/Depot/Bausparen.
7. **Verträge & wiederkehrende Zahlungen** (Product Spec 4.4) vollständig inkl. Status Pausiert, "Zu Vertrag hochstufen".
8. **Sammlungen** (Product Spec 4.5) inkl. Zeitraum-Bulk-Zuordnung mit Vorschau.
9. **Aufräum-Modus** (Product Spec 4.3b, Component Library C11): Trigger vom Kategorisierungs-Fortschritt-Widget (folgt erst in Phase 3 mit der Übersicht) und vom "N aufräumen"-Button auf der Transaktionen-Seite – letzterer ist jetzt baubar.
10. **Manuelle Transaktion + gesperrte Importfelder** (Product Spec 5.4b, Regel R6/Kap. 3): "+ Transaktion" Modal, Drawer-Sperrlogik für importierte Zeilen.
11. **Änderungsverlauf-Drawer** (Product Spec 5.6) mit Undo für alle in dieser Phase entstehenden Bulk-/Regel-Aktionen.

## Was NICHT in diesem Prompt enthalten ist

Übersicht/Dashboard, Budgets, Steuer, Rechner, Benachrichtigungs-Logik, Demo-Modus, Auto-Backup – bleiben Phase 3/4 (siehe CLAUDE.md Phasenplan).

## Arbeitsweise

- Teil A vor Teil B, in der gelisteten Reihenfolge; nach Teil A kurz bestätigen, dann erst B beginnen.
- Bei Unklarheit: Product Spec Kap. 6 (Import) und Kap. 3 (Pipeline) genau befolgen, keine eigenen Annahmen.
- Kein Overengineering, shadcn/Radix-Fähigkeiten nutzen statt selbst bauen (siehe Component Library Kap. 9.1).
