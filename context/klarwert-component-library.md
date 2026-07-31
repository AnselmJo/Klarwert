# Klarwert – UI-Komponentenbibliothek / Design System (v1)

**Bezug:** Vollständige Analyse von `klarwert-prototyp-vollstaendig.html` (alle CSS-Klassen, alle Seiten, alle Modals/Drawer/Overlays). Ziel: das kleinste, konsistenteste Set an wiederverwendbaren Komponenten, das den gesamten Prototyp abdeckt – ohne neue Komponenten zu erfinden, wo bestehende erweitert werden können.

**Ergebnis der Konsolidierung:** Der Prototyp verwendet **~48 einzelne CSS-Klassen/Ad-hoc-Styles** für UI-Bausteine. Diese werden hier auf **36 Komponenten** (in 4 Gruppen) plus **2 fundamentale Systeme** (Icon-System, Popover-Primitive) konsolidiert. Kapitel 3 zeigt die vollständige Zuordnung alt → neu.

**Nachträge:** B13 „Sortierbare Liste" (Regel-Prioritäts-Verwaltung, Drag&Drop + Pfeil-Buttons), B3b „Spalten-Auswahl" (optionale Bankfelder in der Transaktionstabelle), B14 „Händler-Editor-Tabelle" und B15 „Diff-Vorschau" (Community-Händler-Datenbank, siehe `klarwert-community-haendler-db.md`) wurden nach Praxis-Feedback ergänzt.

---

## Inhaltsverzeichnis

1. Design-Tokens
2. Icon-System
3. Konsolidierungs-Entscheidungen (alt → neu)
4. Popover-Primitive (fundamentales Positionierungssystem)
5. Komponentenbibliothek
   - Gruppe A – Eingabe & Aktion
   - Gruppe B – Layout, Struktur & Anzeige
   - Gruppe C – Overlays & Feedback
   - Gruppe D – Datenvisualisierung
6. Komponenten-Abhängigkeiten
7. Verwendungsmatrix (Komponente × Seite)
8. Bewusst nicht übernommene Prototyp-Artefakte

---

## 1. Design-Tokens

Aus den `:root`-Variablen des Prototyps abgeleitet – gelten für **alle** Komponenten, werden in den einzelnen Specs nicht wiederholt.

| Token | Wert | Verwendung |
|---|---|---|
| `farbe.petrol` | `#123138` | Primärfarbe (Sidebar, primäre Buttons, Fokus-Ring) |
| `farbe.petrol-light` | `#1d4750` | Verläufe, sekundäre Akzente |
| `farbe.charcoal` | `#262321` | Fließtext, dunkle Flächen (Toast, Bulk-Bar) |
| `farbe.brick` | `#b6503a` | Destruktiv, Warnung, negative Werte |
| `farbe.sage` | `#6f9a6d` | Positiv, Erfolg, Bestätigt |
| `farbe.gold` | `#b79a5b` | Preisänderung/Achtung (dritte Stufe zwischen Warnung und neutral) |
| `farbe.slate` | `#6b7a80` | Neutral/inaktiv |
| `farbe.paper` | `#f3efe4` | Seitenhintergrund |
| `farbe.card` | `#fffdf8` | Oberflächen (Card, Modal, Drawer, Input) |
| `radius.standard` | `16px` | Card, Modal, Drawer, Dropzone |
| `radius.klein` | `8–10px` | Button, Chip, Input, Icon-Button |
| `radius.pill` | `20px` | Chip, Badge, Toast, Freshness-Hinweisbox |
| `schrift.überschrift` | Fraunces, 500 | H1–H3 |
| `schrift.text` | Inter, 400/500/600/700 | Fließtext, UI-Labels |
| `schrift.zahl` | IBM Plex Mono | Alle Geldbeträge, Prozentwerte, Daten mit `.num`-Klasse |
| `fokus-ring` | 2px solid petrol-light, Offset 2px | Einheitlich für **alle** interaktiven Elemente (siehe Accessibility je Komponente) |

---

## 2. Icon-System

**Entscheidung:** Der Prototyp mischt Emoji (✎ 🗑 🔎 📅 ⚠ 🧩 ⤢) mit eigenen SVG-Pfaden (Sidebar, Kategorie-Icons) und Sonderzeichen (‹ › ⌄ ↕ ✕). Für v1 wird eine **einzige Icon-Bibliothek** verbindlich, damit Strichstärke, Eckenradius und optische Größe konsistent sind – Emoji rendern je Betriebssystem unterschiedlich und passen nicht zur reduzierten, schlichten Formsprache.

**Empfehlung:** Lucide Icons (Strichstärke 1,5–1,8px passend zur bestehenden SVG-Formsprache der Sidebar, bereits gut mit React/Web-Stacks integrierbar).

| Bisher im Prototyp | Bedeutung | Neues Icon (Lucide) |
|---|---|---|
| ✎ | Bearbeiten | `pencil` |
| 🗑 | Löschen | `trash-2` |
| ✕ | Schließen / Entfernen | `x` |
| 🔎 | Suche | `search` |
| ⤢ | Vollbild | `maximize-2` |
| ⌄ | Dropdown-Anzeiger | `chevron-down` |
| ‹ › | Zeitraum-Navigation | `chevron-left`, `chevron-right` |
| 🕐 | Änderungsverlauf | `history` |
| ↕ | Spalte sortierbar (beide Richtungen kombiniert) | ersetzt durch **zwei getrennte, einfache Zustände**: `chevron-up` (aufsteigend sortiert), `chevron-down` (absteigend sortiert), `chevrons-up-down` (noch unsortiert, gedimmt) |
| 📅 | Datenstand | `calendar` |
| ⚠ | Warnung/Fehler | `triangle-alert` |
| ✓ | Erfolg | `check` |
| „i" im Kreis | Tooltip-Auslöser | `info` (in Kreis-Badge) |
| 🧩 | Community-Hinweis | `puzzle` |
| Zahnrad (bereits SVG) | Einstellungen | `settings` (1:1-Ersatz) |
| Kategorie-Icons (Haus, Besteck, Film, Stern, eigene Pfade) | Kategorie-Symbolik | entsprechende Lucide-Pendants: `home`, `utensils`, `film`, `star`, … |

**Größen-Skala:** `xs` 14px (inline in Text/Badges) · `sm` 16px (Icon-Button, Listenzeilen, Formularfeld-Präfix) · `md` 20px (Sidebar-Navigation) · `lg` 24px (Empty-State-Illustration, Modal-Header bei Warnungen).

**Regel:** Icons erben immer `currentColor` (keine fest codierten Füllfarben außer bei Status-Icons wie `triangle-alert` in Brick), damit sie sich automatisch an Button-/Text-Farbvarianten anpassen.

---

## 3. Konsolidierungs-Entscheidungen (alt → neu)

| Wireframe-Klasse(n) | Neue Komponente | Begründung |
|---|---|---|
| `.btn`, `.btn.ghost`, `.btn.brick`, `.btn.sage`, `.btn.sm`, `.iconbtn` | **Button** (A1) | Identische Struktur (Padding/Radius/Cursor), Unterschied ist nur Farbvariante, Größe und ob Label sichtbar ist |
| `.chip`, `.chip.active` | **Chip** (A6) | Bereits eigenständig, keine Dopplung – bleibt erhalten |
| `.badge` (7 Farbvarianten), `.tag-pill` | **Badge** (A7) | Beide sind nicht-interaktive, farbcodierte Pill-Labels; Tag-Pill nutzt nur eine freie statt einer festen Farbpalette |
| `input[type=text]`, `select` | **Formularfeld** (A5) | Im Prototyp bereits durch **eine** CSS-Regel gemeinsam gestylt |
| `.toggle-switch`, `.tristate` | **Segmented Control** (A4) | Beide sind eine Reihe exklusiv wählbarer Text-Optionen (2 vs. 3 Optionen) – nur die Optionsanzahl unterscheidet sich |
| `.tile`, `.widget`, `.widget.span1/2/4`, `.tile.glass`, `.contract-card`, `.collection-card` | **Card** (B1) | Alle sind Container mit Rahmen/Radius/Padding; Verträge/Sammlungen sind lediglich eine Card-Variante mit Akzentbalken + Footer-Aktionen |
| `.konto-row`, `.tx-row`, Kategorie-Zeile, Tag-Zeile, `.rule-row`, `.hist-row`, `.mini-tx-row`, `.mini-toggle` | **List Row** (B2) | Alle sind horizontale Zeilen mit führendem Inhalt links, Meta/Wert/Aktionen rechts – unterscheiden sich nur in genutzten Slots |
| `.progress-track/.progress-fill`, `.compare-bar/.compare-track/.compare-fill`, `.loading-track/.loading-fill` | **Fortschrittsbalken** (B5) | Mechanisch identisch (Track + proportionale Füllung); Unterschied ist nur die Semantik (Ziel-Fortschritt / Vergleich / Ladevorgang) |
| `.step-dots`, `.onb-progress` | **Fortschritts-Schritte** (B6) | Beide sind eine Reihe kleiner Balken zur Schritt-Anzeige; Unterschied ist nur „nur aktueller Schritt" vs. „kumulativ erledigte Schritte" |
| `.freshness`, `.inline-explainer`, `.warn-box`, `.error-box`, `.ok-box`, `.preview-box`, `.rule-preview` | **Hinweisbox/Alert** (B7) | Alle sind farbcodierte Inline-Boxen mit Icon + Text; Unterschied ist nur die Semantik-Farbe (neutral/warnend/fehlerhaft/erfolgreich) |
| `.contextmenu`, gedachte Bulk-Bar-Dropdowns („Kategorie zuweisen ▾") | **Dropdown-/Kontextmenü** (C4) | Beide sind eine schwebende Liste klickbarer Einträge, nur der Auslöse-Ort unterscheidet sich (Cursor-Position vs. unterhalb eines Elements) |
| `.fs-overlay/.fs-box` | **Modal** (C1), Variante „Vollbild" | Gleiche Grundmechanik (zentrierter Overlay-Container), nur andere Breite/Zweck |
| `.disclosure` | **Aufklappbereich** (B10) | Eigenständig, keine Dopplung |
| `.dropzone` | **Dropzone** (B9) | Eigenständig, keine Dopplung |
| `.choice-cards/.choice-card` | **Auswahlkarte** (B8) | Eigenständig (andere Interaktionssemantik als Card: exklusive Auswahl wie Radio-Buttons) |
| `.empty-state`, `.empty-hint` | **Empty State** (C6) | Gleiche Aussage („nichts zu zeigen"), nur unterschiedliche Prominenz (groß mit CTA vs. klein ohne CTA) |
| `.period-switcher`, `.seg-control`, `.pnav-arrow`, `.period-cal`, `.cal-grid`, `.period-quicklinks` | **Zeitraum-Switcher** (C7) + **Kalender-Popover** (C8) | Komposit aus Segmented Control + Button (Icon) + Popover + Link – keine neue Grundkomponente nötig, nur neue Zusammensetzung |
| `.navitem`, `.navgroup-label`, `.profile-pill`, `.brand .dot` | **Nav Item** (B12) | Sidebar-spezifisch, aber wiederverwendbares Zustandsmuster (Standard/Hover/Aktiv/Deaktiviert) |
| `.demo-toggle` | **entfällt** | Reines Prototyp-Debug-Artefakt, siehe Kapitel 8 |


## 4. Popover-Primitive (fundamentales Positionierungssystem)

**Problem im Prototyp:** Der Tooltip wird per CSS fest `bottom:20px; left:50%; transform:translateX(-50%)` relativ zum Auslöser positioniert – ohne Rücksicht auf den sichtbaren Bereich. Am oberen Bildschirmrand (z. B. Tooltip neben dem Personen-Filter in der Globalbar) wird er dadurch abgeschnitten. Dieselbe feste Positionierung würde bei jedem weiteren schwebenden Element (Kontextmenü, Kalender-Popover) erneut auftreten.

**Lösung:** Statt den Fix pro Komponente einzeln zu bauen, wird eine gemeinsame **Popover-Primitive** definiert, auf der Tooltip (A8), Dropdown-/Kontextmenü (C4) und Kalender-Popover (C8) aufsetzen. Sie ist keine eigenständige, sichtbare Komponente, sondern die Positionierungslogik darunter.

| Aspekt | Spezifikation |
|---|---|
| Zweck | Platziert ein schwebendes Element relativ zu einem Auslöser, unter Berücksichtigung des sichtbaren Viewports |
| Verhalten | Bevorzugte Position wird pro Komponente vorgegeben (z. B. Tooltip: oberhalb; Kalender: unterhalb). Reicht der Platz in der bevorzugten Richtung nicht aus, **kippt** die Primitive automatisch auf die gegenüberliegende Seite („Auto-Flip") und schiebt seitlich nach, bis das Element vollständig sichtbar ist (Kollisions-Erkennung gegen alle 4 Viewport-Kanten) |
| Schließen | Bei Klick außerhalb, `Esc`, oder Scroll/Resize der Seite (Neuberechnung der Position statt falscher Restposition) |
| Layering | Popover-Inhalte liegen immer über Cards/Widgets, aber unter Modal/Drawer (Modal hat höchste Ebene) |
| Accessibility | Trägt `role="tooltip"`, `role="menu"` bzw. `role="dialog"` je nach aufsetzender Komponente; verschiebt niemals den Fokus unerwartet (Ausnahme: Kontextmenü/Kalender öffnen mit Fokus auf erstem Eintrag, Tooltip erhält nie Fokus) |

---

## 5. Komponentenbibliothek

### Gruppe A – Eingabe & Aktion

#### A1. Button (inkl. Icon-Button)

| Feld | Beschreibung |
|---|---|
| Zweck | Auslöser für Aktionen – primäre, sekundäre, destruktive und positive Kurzaktionen sowie kompakte Icon-only-Aktionen in Listen |
| Varianten | `primär` (petrol, gefüllt) · `ghost` (transparent, Rahmen) · `destruktiv` (brick, für Löschen) · `positiv` (sage, für bestätigende Kurzaktionen wie „Bestätigen" bei Verträgen) |
| Größen | `md` (Standard, 8×14px Padding) · `sm` (kompakt, 6×10px Padding, für Karten-Footer/Bulk-Bar) · `icon-only` (quadratisch 30×30px, ersetzt das bisherige separate Icon-Button-Element) |
| States | Standard, Hover, Fokus (Ring), Aktiv/Gedrückt, Disabled (40 % Opazität, `cursor:not-allowed`), Loading (optional: Inhalt durch Spinner ersetzt, Button bleibt in der Breite stabil) |
| Icons | Optional führend oder folgend neben Label; im `icon-only`-Modus ausschließlich Icon, **Pflicht**: `aria-label`, wenn kein sichtbares Label vorhanden ist |
| Verhalten | Einfacher Klick löst Aktion aus; bei destruktiven Aktionen löst der Button selbst **nie** direkt die Aktion aus, sondern öffnet ein Bestätigungsmodal (siehe C1), außer die Aktion ist bereits die Bestätigung innerhalb eines solchen Modals |
| Keyboard Navigation | Erreichbar per `Tab`, Auslösung per `Enter`/`Leerzeichen`; disabled Buttons sind aus der Tab-Reihenfolge entfernt (`tabindex="-1"`) |
| Accessibility | Nativ `<button>`, kein `<div onclick>`; Icon-only-Buttons **immer** mit `aria-label`; Ladezustand kommuniziert `aria-busy="true"` |
| Responsive Verhalten | `sm`/`md` behalten feste Innenabstände, Label darf umbrechen erst ab sehr schmalen Containern (<200px); in solchen Fällen wird der Button auf Icon-only reduziert, sofern ein Icon vorhanden ist |

#### A2. Checkbox

| Feld | Beschreibung |
|---|---|
| Zweck | Mehrfachauswahl in Listen (ersetzt das bisherige `.rowcheck`) |
| Varianten | Nur eine visuelle Variante, aber zwei Kontexte: freistehend (Formular) und in Listenzeile eingebettet (Bulk-Selektion) |
| Größen | `sm` 16×16px (einzige Größe, deckt beide Kontexte) |
| States | Unselected, Checked (petrol gefüllt mit Häkchen), Indeterminate (für „einige, aber nicht alle in einer Gruppe ausgewählt" – Erweiterungspunkt für künftige verschachtelte Auswahl), Hover, Fokus, Disabled |
| Icons | `check` (16px) im Checked-Zustand |
| Verhalten | Klick auf die Checkbox selbst selektiert **ohne** die übergeordnete Listenzeilen-Aktion (z. B. Öffnen eines Drawers) auszulösen – Klick-Event wird gestoppt, nicht weitergereicht |
| Keyboard Navigation | Erreichbar per `Tab`, Umschalten per `Leerzeichen` |
| Accessibility | Nativ `<input type="checkbox">` oder `role="checkbox"` mit `aria-checked` (inkl. `"mixed"` für Indeterminate) |
| Responsive Verhalten | Größe bleibt konstant, kein Skalieren |

#### A3. Switch

| Feld | Beschreibung |
|---|---|
| Zweck | Binärer Ein/Aus-Schalter mit sofortiger Wirkung (z. B. Kategorie aktiv/inaktiv, Kirchensteuer, Widget-Sichtbarkeit) |
| Varianten | Nur eine Variante |
| Größen | `sm` 36×20px (einzige Größe) |
| States | Aus (grau), Ein (sage), Hover, Fokus, Disabled (bei fehlender Berechtigung/Kontext) |
| Icons | Keine – reine Knopf-Slider-Metapher |
| Verhalten | Klick schaltet sofort um; wenn die Wirkung eine Bestätigung erfordert (z. B. Kategorie mit Nutzung deaktivieren), öffnet der Switch **vor** dem Umschalten ein Bestätigungsmodal und ändert seinen Zustand erst nach Bestätigung – niemals ein optimistisches Umschalten mit nachträglichem Zurückspringen |
| Keyboard Navigation | Erreichbar per `Tab`, Umschalten per `Leerzeichen`/`Enter` |
| Accessibility | `role="switch"` mit `aria-checked`; zugehöriges Label ist immer per `aria-labelledby` oder umschließendes `<label>` verknüpft, nie nur visuell danebenstehend |
| Responsive Verhalten | Größe konstant |

#### A4. Segmented Control (inkl. Toggle-Switch, Tristate)

| Feld | Beschreibung |
|---|---|
| Zweck | Auswahl **einer** von mehreren sich gegenseitig ausschließenden Text-Optionen, sichtbar nebeneinander (ersetzt sowohl den 2-Werte-„Toggle-Switch" als auch den 3-Werte-„Tristate") |
| Varianten | `2-Optionen` (z. B. €/%), `3-Optionen` (z. B. Alle/Nur/Ohne), `4-Optionen` (z. B. Woche/Monat/Quartal/Jahr) – **eine** Komponente, Optionsanzahl ist ein Parameter, kein separater Komponententyp. **Visuell verbindlich:** jede Option ist eine eigene, einzeln umrandete Box (Button-Gruppe), aneinandergereiht ohne Zwischenraum; **kein** natives `<select>`/Dropdown, **keine** unterstrichenen Tabs – das gilt insbesondere für den Zeitraum-Typ im Zeitraum-Switcher (C7). |
| Größen | `sm` (Standard in Filtern/Widgets) |
| States | Je Option: Inaktiv, Aktiv (heller Hintergrund, dunklerer Text), Hover, Fokus; Control selbst: Disabled |
| Icons | Keine, ausschließlich Text-Labels |
| Verhalten | Klick auf eine Option wählt diese exklusiv aus, vorherige Auswahl wird deaktiviert; Wirkung ist immer sofort (kein „Übernehmen"-Button) |
| Keyboard Navigation | Erreichbar als eine Gruppe per `Tab`; innerhalb der Gruppe Wechsel der Option per `Pfeil links/rechts`; `Leerzeichen`/`Enter` bestätigt die per Pfeil fokussierte Option (Roving-Tabindex-Muster) |
| Accessibility | `role="radiogroup"` mit je Option `role="radio"` und `aria-checked` |
| Responsive Verhalten | Bei mehr als 3 Optionen oder sehr schmalem Container: Umbruch auf zweizeilige Darstellung vermeiden – stattdessen horizontales Scrollen innerhalb der Control (kein automatischer Wechsel zu einem Dropdown, um Konsistenz zu wahren) |

#### A5. Formularfeld (Textfeld / Auswahlfeld / Suchfeld)

| Feld | Beschreibung |
|---|---|
| Zweck | Einzeilige Dateneingabe oder -auswahl – deckt Freitext, Zahl, Datum (Text mit Kalender-Popover-Ergänzung, siehe C8) und native Auswahllisten ab |
| Varianten | `text`, `zahl`, `datum` (Text + Kalender-Popover-Trigger), `auswahl` (Select), `suche` (Text mit führendem Such-Icon + Clear-Icon bei Eingabe), **`combobox`** (durchsuchbare Auswahl – Tippen filtert die Optionsliste live; verbindlich für jede Kategorie-Auswahl im Produkt, siehe Product Spec 4.3, da die Kategorienliste mit Ober-/Unterkategorien schnell zu lang für ein reines Klick-Dropdown wird; filtert gegen Name **und** hinterlegte Aliase) |
| Größen | `md` (Standard, 9×12px Padding) – einheitlich über alle Typen, keine separate Größen-Skala nötig |
| States | Leer/Platzhalter, Befüllt, Fokus (Ring), Fehler (roter Rahmen + Fehlertext darunter), Disabled, Read-only |
| Icons | `search` (führend, nur Suche-Variante) · `x` (folgend, nur wenn Suche-Variante befüllt ist, zum Leeren) · `calendar` (folgend, nur Datum-Variante) · `chevron-down` (folgend, nur Auswahl-Variante) · `chevrons-up-down` (folgend, nur Combobox-Variante) |
| Verhalten | Frei editierbar; Auswahl-Variante öffnet native/angepasste Optionsliste; Such-Variante filtert i. d. R. live (kein expliziter Such-Button). **Combobox-Variante (Bugfixes):** die Optionsliste muss `max-height` + `overflow-y:auto` haben und **Mausrad-Scrollen** innerhalb der geöffneten Liste unterstützen (bekannter Bug bei nicht korrekt konfiguriertem cmdk/Radix-Popover – Scroll-Events dürfen nicht an das Hintergrund-Fenster durchgereicht werden); Popover-Breite orientiert sich am **Inhalt** (längster sichtbarer Optionstext), nicht stur an der Breite des Auslöser-Felds, damit lange Kategorienamen ("Freizeit, Hobbies und Soziales") nicht zweizeilig umbrechen – mit sinnvoller Maximalbreite (~360px), darüber Ellipsis. |
| Keyboard Navigation | Erreichbar per `Tab`; Auswahl-Variante zusätzlich mit Pfeiltasten innerhalb der geöffneten Liste navigierbar, `Enter` übernimmt, `Esc` schließt ohne Änderung |
| Accessibility | Zugehöriges `<label>` immer über die Formularfeld-Gruppe (B4) verknüpft (nie nur Platzhaltertext als einzige Beschriftung); Fehlertext per `aria-describedby` verknüpft, Feld erhält `aria-invalid="true"` |
| Responsive Verhalten | Volle verfügbare Breite des Containers (`width:100%`); bei nebeneinander angeordneten Feldern (siehe `.row2`-Muster) Umbruch auf untereinander ab <480px Container-Breite |

#### A6. Chip

| Feld | Beschreibung |
|---|---|
| Zweck | Klickbarer Filter- oder Auswahl-Baustein, kompakter als ein Button |
| Varianten | `Standard` (togglebar, z. B. Quick-Filter „Unkategorisiert") · `entfernbar` (zeigt zusätzlich ein `x`-Icon, z. B. aktiver Detailfilter „Vertrag: Miete Wohnung") |
| Größen | `sm` (einzige Größe) |
| States | Inaktiv, Aktiv (dunkel gefüllt), Hover, Fokus, Disabled |
| Icons | `x` (nur `entfernbar`-Variante, klickbare Teilzone am rechten Rand) |
| Verhalten | Klick auf den Chip-Körper togglet die Auswahl; bei der `entfernbar`-Variante entfernt Klick **ausschließlich auf das `x`** den Filter, Klick auf den restlichen Chip hat keine Wirkung (verhindert versehentliches Entfernen) |
| Keyboard Navigation | Erreichbar per `Tab`; Toggle per `Leerzeichen`/`Enter`; bei `entfernbar` ist das `x` als eigenes fokussierbares Element erreichbar (zweiter Tab-Stop) mit `Entf`/`Enter` zum Entfernen |
| Accessibility | `role="button"` mit `aria-pressed` für Toggle-Verhalten; das `x` trägt eigenes `aria-label` (z. B. „Filter Vertrag: Miete Wohnung entfernen") |
| Responsive Verhalten | Chips fließen in einer Zeile (`flex-wrap`), umbrechen zeilenweise statt horizontal zu scrollen |

#### A7. Badge (inkl. Tag-Pill)

| Feld | Beschreibung |
|---|---|
| Zweck | Nicht-interaktiver, farbcodierter Status- oder Klassifikations-Indikator |
| Varianten | **Semantische Palette** (feste Bedeutung): `bestätigt` (sage) · `vorgeschlagen` (brick) · `geändert` (gold) · `eigene` (petrol) · `neutral` (slate) · `währung` (petrol, Mono-Schrift). **Freie Farbe** (Tag-Pill-Ersatz): beliebige, vom Nutzer gewählte Farbe für Tags |
| Größen | `sm` (einzige Größe) |
| States | Statisch, keine Interaktionszustände (kein Hover/Fokus, da nicht klickbar) |
| Icons | Optional ein kleines führendes Status-Icon bei Bedarf (in v1 nicht genutzt, aber vorgesehen, z. B. künftig `check` bei „bestätigt") |
| Verhalten | Rein darstellend |
| Keyboard Navigation | Nicht zutreffend (nicht fokussierbar) |
| Accessibility | Reiner Text mit ausreichendem Farbkontrast (Text-auf-Hintergrund ≥ 4,5:1 geprüft je Variante); Farbe alleine transportiert nie die einzige Information – der Text im Badge ist immer selbsterklärend (z. B. „Bestätigt", nicht nur eine grüne Fläche) |
| Responsive Verhalten | Kein Umbruch innerhalb des Badges; bei zu wenig Platz wird der Text nicht gekürzt, sondern das umgebende Layout muss Platz reservieren |

#### A8. Tooltip

| Feld | Beschreibung |
|---|---|
| Zweck | Hover-ausgelöste Zusatzerklärung zu einem UI-Element, das selbst schon verständlich sein muss (Tooltip ergänzt, ersetzt keine Kernbeschriftung) |
| Varianten | Nur eine Variante (Text-Tooltip); kein Rich-Content in v1 |
| Größen | Feste maximale Breite 220px, Höhe automatisch nach Textlänge |
| States | Verborgen, Sichtbar (bei Hover/Fokus des Auslösers) |
| Icons | `info` im Kreis als Standard-Auslöser-Icon |
| Verhalten | Erscheint bei `mouseenter`/Fokus des Auslösers mit kurzer Verzögerung (Empfehlung 300ms, verhindert Flackern bei zufälligem Überfahren), verschwindet bei `mouseleave`/Fokusverlust; **positioniert sich über die Popover-Primitive (Kapitel 4)**, kippt automatisch, wenn der bevorzugte Platz (oberhalb) am Bildschirmrand fehlt |
| Keyboard Navigation | Auslöser ist per `Tab` erreichbar und zeigt den Tooltip bei Fokus (nicht nur bei Maus-Hover) – wichtig für Tastatur- und Screenreader-Nutzung |
| Accessibility | Auslöser trägt `aria-describedby`, das auf den Tooltip-Inhalt verweist; Tooltip selbst `role="tooltip"`; niemals die einzige Quelle für sicherheitsrelevante Information |
| Responsive Verhalten | Durch die Popover-Primitive immer vollständig innerhalb des Viewports sichtbar, unabhängig von der Position des Auslösers |


### Gruppe B – Layout, Struktur & Anzeige

#### B1. Card (inkl. Tile, Widget, Entity-Card)

| Feld | Beschreibung |
|---|---|
| Zweck | Generischer Container für gruppierte Inhalte – von einfachen Info-Kacheln bis zu Dashboard-Widgets und Verträge-/Sammlungen-Karten |
| Varianten | `Standard` (weiße Fläche, Rahmen) · `Glass` (leicht transparent/verblasst, für „im Fokus"-Hervorhebungen) · `Entity` (mit farbigem Akzentbalken links, Titel, Betragszeile, Footer-Aktionszone – ersetzt Contract-Card/Collection-Card) |
| Größen | Im Grid-Kontext (Dashboard): `span1`/`span2`/`span4` (Spaltenbreite); außerhalb des Grids: volle verfügbare Breite |
| States | Statisch (Standard), Hover (nur wenn die ganze Card klickbar ist, z. B. Entity-Variante → leichte Erhöhung/Schatten), Fokus (wenn klickbar) |
| Icons | Keine eigenen, außer im Entity-Footer über eingebettete Buttons/Badges |
| Verhalten | Standard-Card ist rein struktureller Container ohne eigene Interaktion; Entity-Variante ist als Ganzes klickbar (öffnet Detail-Drawer) **außer** auf eingebetteten Aktions-Buttons im Footer, die ihr Klick-Event stoppen, damit nicht gleichzeitig die Card-Navigation ausgelöst wird |
| Keyboard Navigation | Nur klickbare Varianten (Entity) sind per `Tab` erreichbar, Aktivierung per `Enter` |
| Accessibility | Klickbare Card-Varianten erhalten `role="button"` oder werden als `<a>`/`<button>`-Wrapper umgesetzt (kein reines `<div onclick>`); rein darstellende Cards benötigen keine besondere Rolle |
| Responsive Verhalten | Grid-Spans reduzieren sich stufenweise: `span4`→volle Breite, `span2`→volle Breite ab <900px Container, `span1`-Kacheln brechen von 4 auf 2 pro Zeile ab <900px und auf 1 ab <560px |

#### B2. List Row

| Feld | Beschreibung |
|---|---|
| Zweck | Generische horizontale Zeile für Listen-Einträge – deckt Konten-Zeilen, Transaktions-Zeilen, Kategorie-/Tag-Zeilen, Regel-/Verlauf-/Mini-Transaktions-Zeilen und Einstellungs-Zeilen (Label+Switch) ab |
| Varianten | `Standard` (Icon/Checkbox links, Primär-/Sekundärtext, Meta-Badge, Wert rechts, Aktions-Icons) · `Kompakt` (nur zwei Textzonen links/rechts + optionale kleine Icons, für Regel-/Verlauf-/Mini-Zeilen) · `Options-Zeile` (Label links, ein Steuerelement – Switch/Segmented Control – rechts, für Einstellungs-Listen) |
| Größen | `md` (Standard, ~48px Zeilenhöhe) · `sm` (Kompakt, ~36px Zeilenhöhe) |
| States | Statisch, Hover (nur wenn die Zeile klickbar ist), Fokus (bei Tastaturnavigation), Selektiert (Checkbox aktiv, hellblauer/petrol-getönter Hintergrund) |
| Icons | Kontextabhängig: führendes Icon (Kategorie-Symbol, Konto-Typ), Sparkline (siehe D2, Kompakt-Größe), trailing Icon-Buttons (Bearbeiten/Löschen aus A1) |
| Verhalten | Klick auf die Zeile öffnet i. d. R. ein Detail (Drawer/Panel), **außer** Klick landet auf einem eingebetteten interaktiven Element (Checkbox, Icon-Button, Switch) – dieses stoppt die Weiterleitung des Klick-Events; Rechtsklick auf klickbare Standard-Zeilen kann zusätzlich ein Kontextmenü öffnen (siehe C4) |
| Keyboard Navigation | Zeile selbst per `Tab` erreichbar, wenn klickbar, Aktivierung per `Enter`; eingebettete Steuerelemente sind eigene Tab-Stopps innerhalb der Zeile |
| Accessibility | Klickbare Zeilen als `role="button"` oder semantische `<tr>`/`<li>` mit zusätzlicher Beschreibung; Options-Zeile verknüpft Label und Steuerelement über `aria-labelledby` |
| Responsive Verhalten | Spaltenbasierte Varianten (Standard) reduzieren bei schmalem Container zuerst sekundäre Meta-Spalten (Sparkline zuerst, dann Typ-Badge), bevor Primärtext oder Betrag betroffen sind – Betrag bleibt immer sichtbar und rechtsbündig |

#### B3. Sortierbare Tabellenkopfzeile

| Feld | Beschreibung |
|---|---|
| Zweck | Kopfzeile über einer List-Row-Liste mit klickbaren, sortierbaren Spaltenüberschriften |
| Varianten | Nur eine Variante, Spaltenanzahl ist konfigurierbar |
| Größen | Feste Zeilenhöhe, passend zur darunterliegenden List-Row-Größe |
| States | Je Spalte: unsortiert (gedimmter `chevrons-up-down`), aufsteigend sortiert (`chevron-up`, volle Deckkraft), absteigend sortiert (`chevron-down`, volle Deckkraft), Hover |
| Icons | `chevrons-up-down` / `chevron-up` / `chevron-down` (siehe Icon-System, Kapitel 2 – ersetzt das kombinierte `↕`-Zeichen) |
| Verhalten | Klick auf eine Spalte setzt sie als aktive Sortierspalte (aufsteigend); erneuter Klick auf dieselbe Spalte kehrt die Richtung um; es ist immer nur eine Spalte aktiv sortiert |
| Keyboard Navigation | Jede sortierbare Spalte ist per `Tab` erreichbar, Auslösung per `Enter`/`Leerzeichen` |
| Accessibility | Spalten-Header als `<th>` mit `aria-sort="ascending"/"descending"/"none"` |
| Responsive Verhalten | Bei schmalem Container werden nicht-essenzielle Spalten ausgeblendet (z. B. Kategorie-Icon-Spalte), Sortierbarkeit bleibt auf den verbleibenden Spalten erhalten |

#### B3b. Spalten-Auswahl (Column Visibility)

| Feld | Beschreibung |
|---|---|
| Zweck | Ein-/Ausblenden **und Umsortieren** optionaler Tabellenspalten, ohne Daten zu verlieren – primärer Anwendungsfall: Transaktionstabelle mit optionalen Bankfeldern (Tags, IBAN, Transaktionstyp etc., siehe Product Spec 4.3) |
| Varianten | Nur eine Variante |
| Größen | Icon-Button `sm` (siehe A1) + Popover-Liste, Breite ~240px |
| States | Icon-Button: Standard/Hover/Fokus; je Spalte in der Liste: aus/ein (Checkbox); je Spaltenkopf in der Tabelle: Standard/Wird gezogen (siehe B13) |
| Icons | `eye` (Auslöser-Icon, unabhängig vom aktuellen Zustand – kein Wechsel zu `eye-off`, da mehrere Spalten gleichzeitig unterschiedliche Sichtbarkeit haben können) · `grip-vertical` (Drag-Handle im Spaltenkopf, horizontal statt vertikal ausgerichtet für Spalten) |
| Verhalten | Klick öffnet Popover mit einer Checkbox je optionaler Spalte; Toggle wirkt sofort auf die Tabelle. **Reihenfolge:** direkt im Tabellenkopf per Drag&Drop auf dem Spaltenkopf verschiebbar (analog zu B13, hier horizontal statt vertikal); zusätzlich in der Auge-Popover-Liste je Zeile Pfeil-hoch/-runter-Icons als gleichwertige Tastatur-Alternative (kein reiner Fallback). Auswahl + Reihenfolge werden als lokale UI-Präferenz gespeichert (persistiert über Sitzungen hinweg, geräteweit) |
| Keyboard Navigation | Öffnen per `Enter`/`Leerzeichen` auf dem Icon-Button; innerhalb der Liste `Pfeil hoch/runter` zwischen Checkboxen, `Leerzeichen` togglet, die separaten Reorder-Pfeil-Buttons verschieben die Spalte um eine Position; `Esc` schließt |
| Accessibility | Icon-Button `aria-label="Spalten ein-/ausblenden und sortieren"`; Popover `role="menu"`, jede Checkbox mit sprechendem Label (voller Spaltenname, nicht nur Icon); Reorder-Änderungen per `aria-live="polite"` angesagt |
| Responsive Verhalten | Popover positioniert sich über die Popover-Primitive (Kapitel 4), kippt bei Platzmangel |

#### B14. Händler-Editor-Tabelle (Merchant Table)

| Feld | Beschreibung |
|---|---|
| Zweck | Durchsuchbare Verwaltungstabelle der Händler-Datenbank (Ebene A) auf der Kategorien-Seite, siehe Product Spec 4.6 und `klarwert-community-haendler-db.md` |
| Varianten | Nur eine Variante; Zeilen unterscheiden sich nur im Herkunfts-Badge |
| Größen | Volle Breite des Kategorien-Seiten-Abschnitts, Zeilenhöhe wie List Row (B2) |
| States | Zeile: Standard/Hover; Herkunfts-Badge: "kuratiert" (neutral) / "eigen" (sage) / "kuratiert, lokal unterdrückt" (gedimmt + durchgestrichene Standardkategorie) |
| Icons | `store` (Zeilen-Icon) · `lock` bei kuratierten, nicht direkt editierbaren Feldern (nur "Unterdrücken" statt Löschen möglich) · `plus` (Aliase hinzufügen) |
| Verhalten | Spalten: Anzeigename, Standardkategorie (Combobox, siehe A5), Aliase (Chip-Liste + inline "+"), Herkunft. Eigene Händler: alle Felder editierbar, löschbar. Kuratierte Händler: Standardkategorie/Aliase nicht direkt editierbar (Schloss-Icon + Tooltip "kuratiert – zum Abweichen lokal unterdrücken"); Aktion "Unterdrücken" (Popover-Bestätigung, siehe C-Kapitel) statt Löschen. Suchfeld filtert Anzeigename + Aliase. |
| Keyboard Navigation | Zeilen per `Tab`, Combobox-Verhalten wie A5, Chip-Liste: `Tab` zwischen Chips, `Backspace` auf fokussiertem Chip entfernt ihn (nur bei eigenen Händlern) |
| Accessibility | `role="table"` mit korrekten `<th>`-Headern; Schloss-Icon trägt `aria-label="Kuratiert, nicht direkt editierbar"` |
| Responsive Verhalten | Aliase-Spalte bricht bei schmalem Viewport in eine zweite Zeile innerhalb derselben Tabellenzeile um, keine horizontale Scrollbar für diese Tabelle |

#### B15. Diff-Vorschau (für "Vorschläge teilen" und "Regel-Update prüfen")

| Feld | Beschreibung |
|---|---|
| Zweck | Zeigt vor einer Übernahme/einem Versand genau, welche Zeilen betroffen sind – zwei Anwendungsfälle: (a) Export der eigenen Händler-Zuordnungen vor dem Teilen, (b) Diff der kuratierten Datei vor einem Update (siehe Product Spec 4.6) |
| Varianten | `export` (Checkbox je Zeile, alle vorausgewählt, abwählbar) · `update` (rein informativ, Zeilen mit Badge "neu"/"geändert", keine Checkbox – Übernahme ist Alles-oder-Nichts) |
| Größen | Modal-Variante `standard` (480px), Liste scrollt intern ab ~8 Zeilen |
| States | Zeile: Standard/Abgewählt (nur `export`-Variante, gedimmt) |
| Icons | `sparkles` (neu) · `refresh-cw` (geändert) |
| Verhalten | `export`: Kopfzeile "N von M ausgewählt", Datenschutz-Hinweistext fest sichtbar ("Es werden ausschließlich Händler→Kategorie-Zuordnungen geteilt, niemals Beträge, Daten oder Kontodaten"), Bestätigen öffnet das vorausgefüllte GitHub-Issue im Browser. `update`: Bestätigen übernimmt die komplette neue Datei, Abbrechen verwirft. |
| Keyboard Navigation | Wie B3b (Checkbox-Liste): Pfeile, Leertaste toggelt, Enter bestätigt |
| Accessibility | `aria-live="polite"` meldet die aktuelle Auswahl-Anzahl bei jeder Änderung |
| Responsive Verhalten | Liste scrollt intern, Modal-Höhe fix |

#### B4. Formularfeld-Gruppe (Label + Feld + Hilfetext/Fehler)

| Feld | Beschreibung |
|---|---|
| Zweck | Wiederverwendbarer Wrapper, der ein Formularfeld (A5) oder Steuerelement (Switch/Segmented Control) mit Label, optionalem Hilfetext und optionalem Fehlertext kombiniert |
| Varianten | Mit/ohne Hilfetext, mit/ohne Tooltip neben dem Label (siehe A8), mit/ohne Fehlerzustand |
| Größen | Passt sich dem enthaltenen Steuerelement an |
| States | Normal, Fehler (Fehlertext sichtbar, Feld-Rahmen rot) |
| Icons | Optionaler Tooltip-Auslöser (`info`) direkt neben dem Label-Text |
| Verhalten | Rein strukturell, keine eigene Interaktion außer der Weiterleitung an das enthaltene Feld |
| Keyboard Navigation | Nicht zutreffend (Gruppe selbst nicht fokussierbar) |
| Accessibility | Stellt die native `<label for="...">`-Verknüpfung sowie `aria-describedby` für Hilfe-/Fehlertext sicher – zentrale Stelle, an der Formular-Accessibility korrekt verdrahtet wird, damit einzelne Formulare das nicht wiederholt selbst umsetzen müssen |
| Responsive Verhalten | Label immer über dem Feld (nie daneben), unabhängig von der Bildschirmbreite – vermeidet das im Feedback genannte Problem umlaufender Unterzeilen |

#### B5. Fortschrittsbalken (inkl. Compare Bar, Ladefortschritt)

| Feld | Beschreibung |
|---|---|
| Zweck | Horizontale Balkendarstellung eines Anteils oder Fortschritts |
| Varianten | `Ziel-Fortschritt` (Füllung relativ zu 100 % eines Zielwerts, z. B. Budget/Sparziel/Kategorisierung) · `Vergleich` (mehrere Balken nebeneinander, Länge relativ zum jeweils höchsten Vergleichswert, nicht zu 100 %) · `Ladefortschritt` (unbestimmte oder prozentual bestimmte Anzeige während eines Imports/Exports) |
| Größen | `sm` 8px Höhe (Ziel-Fortschritt/Ladefortschritt) · `xs` 10px Höhe mit größerem Radius (Vergleich, da dort oft mehrere Balken mit Label dicht untereinanderstehen) |
| States | Normal (sage), Achtung/Über-Ziel (brick, z. B. Budget überschritten), Unbestimmt (animierte Füllung ohne festen Endpunkt, nur `Ladefortschritt`) |
| Icons | Keine |
| Verhalten | Rein darstellend, keine Nutzerinteraktion; Füllstand ändert sich animiert (CSS-Transition), nicht abrupt |
| Keyboard Navigation | Nicht zutreffend |
| Accessibility | `role="progressbar"` mit `aria-valuenow`/`aria-valuemin`/`aria-valuemax`; bei „Unbestimmt" wird `aria-valuenow` weggelassen statt eines Platzhalterwerts |
| Responsive Verhalten | Balkenbreite ist immer 100 % des Containers, Höhe bleibt konstant |

#### B6. Fortschritts-Schritte (inkl. Step-Dots, Onboarding-Progress)

| Feld | Beschreibung |
|---|---|
| Zweck | Reihe kleiner Balken zur Anzeige des Fortschritts in einem mehrstufigen Prozess (Import-Assistent, Onboarding) |
| Varianten | `Aktueller Schritt` (nur der aktuelle Schritt ist hervorgehoben, frühere/spätere neutral – für den Import-Assistenten) · `Kumulativ` (alle abgeschlossenen Schritte bleiben dauerhaft hervorgehoben – für das Onboarding) |
| Größen | Feste kleine Balkengröße (20×4px je Segment) |
| States | Je Segment: Neutral, Hervorgehoben (Farbe je Variante: brick bei „Aktueller Schritt", sage bei „Kumulativ") |
| Icons | Keine |
| Verhalten | Rein darstellend, wird von der Prozess-Logik (Modal-interner Zustand) gesteuert, keine eigene Nutzerinteraktion |
| Keyboard Navigation | Nicht zutreffend |
| Accessibility | `aria-label` am Container, z. B. „Schritt 2 von 4", damit Screenreader den Fortschritt textuell erfassen, ohne die Segmente einzeln vorlesen zu müssen |
| Responsive Verhalten | Segmente behalten feste Breite, Container zentriert sie bei Platzüberschuss |

#### B7. Hinweisbox / Alert

| Feld | Beschreibung |
|---|---|
| Zweck | Inline-Box mit Icon und Text zur Kommunikation von Systemzuständen oder dauerhaften Erklärungen (ersetzt Freshness-Banner, Inline-Explainer, Warn-/Error-/OK-Box, Vorschau-Box) |
| Varianten | `neutral/info` (dauerhafte Erklärung oder Datenstand, z. B. „Daten aktuell bis…", Tags-vs-Sammlungen-Erklärung, Regel-Treffervorschau) · `warnung` (gold/brick, z. B. Saldo-Abweichung, veralteter Import, Preisänderung) · `fehler` (brick, kräftiger, z. B. gescheiterter Import) · `erfolg` (sage, z. B. Import erfolgreich abgeschlossen) |
| Größen | `Kompakt` (Pill-Form, einzeilig, z. B. Freshness-Hinweis) · `Standard` (Block, mehrzeilig, mit Padding, z. B. Warnbox auf der Konten-Seite) |
| States | Statisch; optional mit eingebettetem Link/Button (z. B. „Jetzt aktualisieren") |
| Icons | `info` (neutral) · `triangle-alert` (warnung/fehler) · `check` (erfolg) |
| Verhalten | Rein darstellend; erscheint/verschwindet abhängig vom zugrunde liegenden Systemzustand (siehe Benachrichtigung-Entität im Domain Model), nicht durch manuelles Schließen es sei denn, es handelt sich um eine dauerhaft schließbare Erklärung (dann zusätzliches `x`, siehe A1 Icon-Button) |
| Keyboard Navigation | Nur relevant, wenn ein eingebetteter Link/Button vorhanden ist – dieser ist regulär per `Tab` erreichbar |
| Accessibility | `role="status"` (info/erfolg) bzw. `role="alert"` (warnung/fehler) – letzteres wird von Screenreadern proaktiv angesagt, daher nur für Zustände verwenden, die wirklich Aufmerksamkeit erfordern |
| Responsive Verhalten | Kompakt-Größe bleibt einzeilig bis zum Umbruchpunkt, danach zweizeilig statt Text abzuschneiden; Standard-Größe ist von Anfang an mehrzeilig-fähig |

#### B8. Auswahlkarte (Choice Card)

| Feld | Beschreibung |
|---|---|
| Zweck | Visuell hervorgehobene, kartenförmige Auswahl zwischen sich gegenseitig ausschließenden Optionen (z. B. „Mit Import" vs. „Nur Kontostand") – fachlich ein Radio-Button-Ersatz, optisch wie eine Mini-Card |
| Varianten | Nur eine Variante, Anzahl der Optionen variabel (im Prototyp immer 2) |
| Größen | Füllt die verfügbare Breite gleichmäßig zwischen den Optionen auf |
| States | Unselected, Selected (petrol Rahmen + leichte Hintergrundtönung), Hover, Fokus, Disabled |
| Icons | Keine im Prototyp, optional künftig ein kleines Icon je Option zur schnelleren visuellen Unterscheidung |
| Verhalten | Klick wählt die Karte exklusiv innerhalb ihrer Gruppe, vorherige Auswahl wird aufgehoben |
| Keyboard Navigation | Gruppe per `Tab` erreichbar, Wechsel per `Pfeil links/rechts` innerhalb der Gruppe (identisches Roving-Tabindex-Muster wie Segmented Control, A4) |
| Accessibility | `role="radiogroup"` / `role="radio"` mit `aria-checked` |
| Responsive Verhalten | Karten stapeln sich untereinander statt nebeneinander ab <480px Container-Breite |

#### B9. Dropzone

| Feld | Beschreibung |
|---|---|
| Zweck | Dateiauswahl per Drag&Drop oder Klick, spezifisch für den Import-Assistenten |
| Varianten | Nur eine Variante |
| Größen | Fest, großzügig dimensioniert (mind. 100px Höhe) |
| States | Standard (gestrichelter Rahmen), Drag-Over (Rahmen/Hintergrund hervorgehoben, während eine Datei über die Zone gezogen wird), Datei ausgewählt (zeigt Dateiname + Größe statt Platzhaltertext), Fehler (roter Rahmen bei ungültigem Dateityp/-größe) |
| Icons | Optional ein Upload-Icon zentral (in v1 nur Text, Erweiterungspunkt) |
| Verhalten | Klick öffnet den nativen Dateiauswahl-Dialog; Ziehen einer Datei darüber zeigt den Drag-Over-Zustand; Ablegen einer ungültigen Datei zeigt sofort den Fehlerzustand mit Begründungstext, ohne den Import-Schritt weiterzuschalten |
| Keyboard Navigation | Per `Tab` erreichbar, Öffnen des Dateidialogs per `Enter`/`Leerzeichen` (Drag&Drop ist eine Ergänzung, keine Voraussetzung) |
| Accessibility | Zugrunde liegendes `<input type="file">` bleibt für Screenreader nutzbar; Zone trägt beschreibenden `aria-label` (z. B. „Datei zum Import auswählen, unterstützt CSV und Excel") |
| Responsive Verhalten | Volle Breite des Containers, Höhe bleibt konstant |

#### B10. Aufklappbereich (Disclosure)

| Feld | Beschreibung |
|---|---|
| Zweck | Ein-/ausblendbarer Zusatzbereich für optionale/erweiterte Optionen (z. B. „Erweitert" im Detailfilter) |
| Varianten | Nur eine Variante |
| Größen | Passt sich dem Inhalt an |
| States | Eingeklappt (▸), Ausgeklappt (▾) |
| Icons | `chevron-right` (eingeklappt) / `chevron-down` (ausgeklappt) |
| Verhalten | Klick auf die Zusammenfassungszeile togglet den Zustand; Inhalt wird ein-/ausgeblendet, keine Animation zwingend nötig, aber empfohlen (max. 200ms) |
| Keyboard Navigation | Zusammenfassungszeile per `Tab` erreichbar, Toggle per `Enter`/`Leerzeichen` |
| Accessibility | Nativ `<details>/<summary>` (wie im Prototyp bereits verwendet) oder `aria-expanded` auf einem Button-Element |
| Responsive Verhalten | Keine besonderen Anpassungen nötig |

#### B11. Skeleton / Ladeplatzhalter

| Feld | Beschreibung |
|---|---|
| Zweck | Platzhalter in der exakten Form des final geladenen Inhalts während des Erstladens einer Liste/Seite – im Prototyp nicht sichtbar (da alles synchron gerendert wird), aber notwendig für reale Ladezustände (siehe Product Spec 5.11) |
| Varianten | `Zeile` (für List Row), `Kachel` (für Card/KPI), `Text` (einzelne Textzeile) |
| Größen | Übernimmt exakt die Maße der Komponente, die sie ersetzt |
| States | Nur ein Zustand: pulsierend/schimmernd animiert |
| Icons | Keine |
| Verhalten | Erscheint beim ersten Laden einer Ansicht, wird durch den echten Inhalt ersetzt, sobald Daten verfügbar sind – kein Layout-Sprung (identische Maße wie Zielinhalt) |
| Keyboard Navigation | Nicht zutreffend (nicht fokussierbar) |
| Accessibility | Trägt `aria-busy="true"` auf dem umgebenden Container; keine einzelnen Skeleton-Elemente werden vom Screenreader vorgelesen (`aria-hidden="true"` je Platzhalter-Block) |
| Responsive Verhalten | Skaliert 1:1 mit der Zielkomponente |

#### B12. Nav Item (Sidebar-Navigationseintrag, inkl. Profil-Pill)

| Feld | Beschreibung |
|---|---|
| Zweck | Klickbarer Navigationseintrag in der linken Sidebar |
| Varianten | `Standard` (Icon + Label) · `Gruppenüberschrift` (nur Text, nicht klickbar, rein strukturierend) · `Profil` (zusätzlich ein Avatar-Punkt links und ein Einstellungen-Icon rechts, für den Haushalts-Eintrag unten in der Sidebar) · **`Brand`** (oberster Eintrag der Sidebar: `klarwert-logo.svg` + Schriftzug – **Bugfix:** war bisher nirgends mit einer Mindestgröße spezifiziert und wurde zu klein/beiläufig gerendert; verbindlich: Logo-Icon-Teil mind. 28×28px, Schriftzug mind. 18px, ausreichend Innenabstand (mind. 16px) zum ersten Nav-Gruppen-Label darunter, damit die Marke nicht wie ein Nebendetail wirkt) |
| Größen | Einheitliche Zeilenhöhe über alle Varianten |
| States | Standard, Hover, Aktiv (aktuelle Seite, hervorgehobener Hintergrund), Deaktiviert (künftige Module wie „Wertpapiere"/„Rechner", mit „bald"-Badge, siehe A7) |
| Icons | Je Nav-Item ein eindeutiges Symbol aus dem Icon-System (Kapitel 2); Profil-Variante zusätzlich `settings` |
| Verhalten | Klick navigiert zur jeweiligen Seite; deaktivierte Items reagieren nicht auf Klick, zeigen aber weiterhin einen Hover-Zustand als Feedback, dass sie erkannt, aber gesperrt sind |
| Keyboard Navigation | Alle aktiven Items per `Tab` erreichbar, Aktivierung per `Enter`; deaktivierte Items sind aus der Tab-Reihenfolge entfernt |
| Accessibility | Als Navigationsliste `<nav><ul><li><a>` strukturiert, aktueller Eintrag trägt `aria-current="page"` |
| Responsive Verhalten | Sidebar-Breite ist in v1 fix (kein Einklappen), Label ist nie ausgeblendet – siehe Product Spec Kapitel 13 (kein Mobile-Layout in v1) |


#### B13. Sortierbare Liste (Drag & Drop Reorder)

| Feld | Beschreibung |
|---|---|
| Zweck | Manuelles Umsortieren einer Liste durch den Nutzer – aktuell einziger Anwendungsfall: Regel-Prioritäts-Verwaltung (siehe Product Spec 8.20). **Ergänzung aus dem kritischen Review:** war implizit durch die Anforderung „Regel-Reihenfolge per Pfeile und Drag&Drop zuweisen" gefordert, aber bislang keine eigenständige Komponente |
| Varianten | Nur eine Variante; jede Zeile nutzt intern List Row (B2, Kompakt-Größe) als Basis |
| Größen | Übernimmt die Größe der enthaltenen List-Row-Variante |
| States | Normal, Wird gezogen (Zeile optisch angehoben/transparent während Drag), Drop-Ziel-Indikator (Linie zwischen zwei Zeilen, zeigt an, wo die gezogene Zeile landen würde) |
| Icons | `grip-vertical` (Drag-Handle, führend) · `chevron-up`/`chevron-down` (Tastatur-Alternative, als Icon-Buttons trailing) |
| Verhalten | Ziehen einer Zeile am Drag-Handle ändert ihre Position live; Loslassen bestätigt die neue Reihenfolge sofort (kein separates „Speichern"), mit Toast-Undo. Die Pfeil-Icon-Buttons verschieben die Zeile alternativ um genau eine Position nach oben/unten – **gleichwertige, nicht nur ergänzende** Bedienmöglichkeit, nicht nur ein Fallback |
| Keyboard Navigation | Zeile per `Tab` erreichbar; Pfeil-hoch/-runter-**Buttons** (nicht die Cursortasten) verschieben die fokussierte Zeile; nach einer Verschiebung bleibt der Fokus auf der verschobenen Zeile, damit mehrfaches Verschieben ohne erneutes Suchen möglich ist |
| Accessibility | `role="list"` mit `aria-live="polite"` auf dem Container, der bei jeder Positionsänderung die neue Reihenfolge ansagt (z. B. „Regel „Miete" jetzt an Position 2 von 8"); Drag&Drop ist **nie** die einzige Bedienmöglichkeit – die Pfeil-Buttons sind vollwertig gleichwertig, nicht nur ein Notbehelf |
| Responsive Verhalten | Drag-Handle bleibt auch bei Touch-Bedienung nutzbar (ausreichend große Trefferfläche, min. 32×32px); bei sehr schmalem Container rutscht der Drag-Handle nie aus dem sichtbaren Bereich |

---

### Gruppe C – Overlays & Feedback

#### C1. Modal (inkl. Fullscreen-Overlay)

| Feld | Beschreibung |
|---|---|
| Zweck | Zentrierter, fokussierender Overlay-Container für Erstellung, mehrstufige Prozesse und kritische Bestätigungen |
| Varianten | `narrow` 400px (einfache Ja/Nein-/Ein-Feld-Dialoge) · `standard` 480px (reguläre Formulare) · `wide` 640px (Formulare mit vielen Feldern/Vorschau, z. B. Regel-Editor) · `import` **95vw × 90vh** (ausschließlich Import-Wizard – Bankexporte haben 12–15 Spalten, brauchen eigene Größe; Vorschautabelle darin scrollt horizontal+vertikal unabhängig vom Modal, erste 2 Spalten sticky, Fußzeile mit Zurück/Weiter immer sticky sichtbar) · `vollbild` 90vw/max. 1000px (ersetzt das bisherige separate Fullscreen-Overlay, ausschließlich für Diagramm-Großansicht mit Export) |
| Größen | Siehe Varianten (Breite ist die primäre Größendimension), Höhe max. 86vh mit internem Scroll (`import`: 90vh, siehe oben) |
| States | Öffnend (Fade/Scale-In), Offen, Schließend |
| Icons | Kontextabhängig im Header (z. B. `triangle-alert` bei destruktiven Bestätigungen) |
| Verhalten | Öffnet zentriert mit gedimmtem Hintergrund-Overlay; schließt bei Klick auf das Overlay außerhalb, `Esc`, oder Abschluss-Aktion – **außer** bei destruktiven Bestätigungen mit Texteingabe-Sperre, wo `Esc`/Overlay-Klick zwar schließt, aber ohne die Aktion auszuführen (nie versehentliche Bestätigung durch Wegklicken) |
| Keyboard Navigation | Fokus wird beim Öffnen auf das erste interaktive Element im Modal gesetzt; `Tab`/`Shift+Tab` zirkulieren ausschließlich innerhalb des Modals (Fokus-Trap); `Esc` schließt |
| Accessibility | `role="dialog"` mit `aria-modal="true"`, `aria-labelledby` auf die Modal-Überschrift; Fokus kehrt beim Schließen zum ursprünglichen Auslöser-Element zurück |
| Responsive Verhalten | `wide`/`standard`/`narrow` verlieren bei schmalen Fenstern ihre feste Breite und werden auf ca. 92 % der Viewport-Breite reduziert (mit Mindestabstand zum Rand); `vollbild` bleibt prozentual (90vw) |

#### C2. Drawer

| Feld | Beschreibung |
|---|---|
| Zweck | Rechts einschiebender Container für Detailansicht/-bearbeitung einer einzelnen Entität, ohne die Listenansicht dahinter zu verdecken |
| Varianten | `standard` 390px (Transaktion, Vertrag, Verlauf) · `breit` 430px (Kategorie, wegen Regel-Liste) |
| Größen | Siehe Varianten, Höhe immer 100 % |
| States | Öffnend (von rechts einschiebend), Offen, Schließend |
| Icons | „Schließen ✕" oben rechts (siehe A1, Icon-Button-Variante mit Label) |
| Verhalten | Schließt bei Klick auf „Schließen", Klick auf das Overlay außerhalb, oder `Esc` |
| Keyboard Navigation | Wie Modal: Fokus-Trap innerhalb des Drawers, `Esc` schließt, Fokus kehrt zum Auslöser zurück |
| Accessibility | `role="dialog"` mit `aria-modal="true"` (funktional identisch zum Modal, nur andere Positionierung/Breite) |
| Responsive Verhalten | Feste Breite bleibt bis zu einer Fenstermindestbreite erhalten, darunter (<480px) volle Breite (deckt dann den gesamten Inhalt ab wie ein Modal) |

#### C3. Toast

| Feld | Beschreibung |
|---|---|
| Zweck | Kurzlebige Bestätigungsmeldung nach einer Aktion, unten mittig |
| Varianten | `einfach` (nur Text) · `mit Undo` (Text + klickbarer „Rückgängig"-Link) |
| Größen | Passt sich der Textlänge an, feste Höhe |
| States | Erscheinend, Sichtbar (3 Sekunden), Verschwindend |
| Icons | Optional ein kleines Erfolgs-/Info-Icon führend (Erweiterungspunkt, im Prototyp nicht vorhanden) |
| Verhalten | Erscheint automatisch nach einer abgeschlossenen Aktion, verschwindet nach 3 Sekunden selbstständig; ein neuer Toast ersetzt einen noch sichtbaren sofort (kein Stapeln) |
| Keyboard Navigation | Der „Rückgängig"-Link ist per `Tab` erreichbar, solange der Toast sichtbar ist |
| Accessibility | `role="status"` mit `aria-live="polite"`, damit Screenreader die Meldung ansagen, ohne den Lesefluss zu unterbrechen |
| Responsive Verhalten | Bleibt horizontal zentriert, Breite passt sich dem Text an, mit Maximalbreite und Umbruch bei sehr langen Meldungen |

#### C4. Dropdown-/Kontextmenü

| Feld | Beschreibung |
|---|---|
| Zweck | Schwebende Liste klickbarer Aktionen, ausgelöst per Rechtsklick (Kontextmenü) oder per Klick unterhalb eines Auslöser-Elements (Dropdown, z. B. Bulk-Bar „Kategorie zuweisen ▾") |
| Varianten | `Kontextmenü` (positioniert am Cursor) · `Dropdown` (positioniert unterhalb des Auslösers, volle Breite des Auslösers oder Inhalts-abhängig) |
| Größen | Mindestbreite 200px, Höhe passt sich der Anzahl der Einträge an |
| States | Geschlossen, Offen; je Eintrag: Standard, Hover, Fokus, Disabled |
| Icons | Optional führendes Icon je Eintrag (in v1 nicht genutzt, Erweiterungspunkt) |
| Verhalten | Öffnet bei Rechtsklick bzw. Klick; schließt bei Klick außerhalb, `Esc`, oder Auswahl eines Eintrags; **positioniert sich über die Popover-Primitive (Kapitel 4)** |
| Keyboard Navigation | Nach Öffnen Fokus auf erstem Eintrag; `Pfeil hoch/runter` wechselt zwischen Einträgen; `Enter` wählt aus; `Esc` schließt ohne Auswahl |
| Accessibility | `role="menu"` mit `role="menuitem"` je Eintrag; Trennlinien als `role="separator"` |
| Responsive Verhalten | Kippt/verschiebt sich automatisch, wenn am gewählten Rand nicht genug Platz ist (siehe Popover-Primitive) |

#### C5. Bulk-Action-Bar

| Feld | Beschreibung |
|---|---|
| Zweck | Persistente, unten fixierte Werkzeugleiste, die erscheint, sobald mindestens ein Listeneintrag selektiert ist |
| Varianten | Nur eine Variante, Aktionsanzahl ist kontextabhängig konfigurierbar |
| Größen | Volle Breite des Listen-Containers, feste Höhe |
| States | Ausgeblendet (0 Selektionen), Eingeblendet (≥1 Selektion) |
| Icons | Keine eigenen; Aktionen mit Untermenü zeigen `chevron-down` |
| Verhalten | Erscheint/verschwindet automatisch mit der Selektionsanzahl; „Auswahl aufheben" setzt alle Selektionen zurück und blendet die Bar aus; Aktionen mit „▾" öffnen ein Dropdown-Menü (siehe C4) direkt oberhalb der Bar |
| Keyboard Navigation | Alle Aktionen per `Tab` erreichbar, solange die Bar sichtbar ist |
| Accessibility | `role="toolbar"` mit `aria-label` (z. B. „Sammelaktionen für 3 ausgewählte Transaktionen"); Änderung der Selektionsanzahl wird per `aria-live="polite"` auf einem versteckten Element angesagt |
| Responsive Verhalten | Aktionen brechen bei schmalem Container zeilenweise um (`flex-wrap`), bleiben aber alle sichtbar statt in einem Overflow-Menü zu verschwinden |

#### C6. Empty State

| Feld | Beschreibung |
|---|---|
| Zweck | Kommuniziert das Fehlen von Inhalten – strukturell (Liste ist grundsätzlich leer) oder als Ergebnis einer Filterung |
| Varianten | `Strukturell` (großer gestrichelter Kasten, Überschrift, Erklärtext, primärer CTA-Button) · `Leeres Filterergebnis` (kleiner, unauffälliger Text ohne CTA, z. B. „Keine Treffer.") |
| Größen | `Groß` (strukturell, mind. 200px Höhe) · `Klein` (Filterergebnis, einzeilig) |
| States | Nur ein sichtbarer Zustand je Variante |
| Icons | Optional eine große, dezente Illustration/Icon in der strukturellen Variante (in v1 nur Text) |
| Verhalten | Erscheint automatisch, wenn die zugrunde liegende Liste 0 Einträge liefert; verschwindet automatisch, sobald wieder Einträge vorhanden sind |
| Keyboard Navigation | Nur der CTA-Button (strukturelle Variante) ist per `Tab` erreichbar |
| Accessibility | `role="status"` mit `aria-live="polite"` für die Filterergebnis-Variante (damit z. B. „Keine Treffer" nach einer Sucheingabe angesagt wird) |
| Responsive Verhalten | Strukturelle Variante zentriert Inhalt unabhängig von der Containerbreite; Text bricht um statt zu überlaufen |

#### C7. Zeitraum-Switcher (Period Switcher)

| Feld | Beschreibung |
|---|---|
| Zweck | Navigation zwischen Zeitperioden – Kombination aus Pfeil-Navigation, Kalender-Auswahl und Schnellzugriffen; jetzt erweitert um eine Zeitraum-Typ-Auswahl (Woche/Monat/Quartal/Jahr, siehe Review-Feedback) |
| Varianten | Nur eine Variante als Komposit, zusammengesetzt aus bestehenden Grundkomponenten: Segmented Control (A4, für Woche/Monat/Quartal/Jahr) + Button Icon-only (A1, für ‹ ›) + Kalender-Popover (C8) + Text-Links (Schnellzugriffe „Aktueller Zeitraum"/„Letzter Zeitraum") |
| Größen | Einheitliche Höhe, Breite passt sich dem Inhalt an |
| States | Vorheriger/Nächster-Pfeil jeweils deaktiviert am Rand des verfügbaren Datenbereichs (kein Navigieren in Zeiträume ohne Daten in der Vergangenheit, kein Navigieren in die Zukunft) |
| Icons | `chevron-left` / `chevron-right` |
| Verhalten | Pfeile springen zur vorherigen/nächsten Periode **gemäß aktuell gewähltem Zeitraum-Typ** (bei „Woche" pro Woche, bei „Quartal" pro Quartal); Klick auf das Zeitraum-Label öffnet den Kalender-Popover; Schnellzugriffe springen direkt zum aktuellen bzw. letzten abgeschlossenen Zeitraum des gewählten Typs |
| Keyboard Navigation | Alle Teile (Segmented Control, Pfeile, Label, Links) einzeln per `Tab` erreichbar in logischer Reihenfolge: Zeitraum-Typ → vorheriger Pfeil → Label → nächster Pfeil → Schnellzugriffe |
| Accessibility | Gesamter Switcher trägt `aria-label="Zeitraum-Navigation"`; aktuelle Auswahl wird per `aria-live="polite"` bei Änderung angesagt (z. B. „Zeitraum: Juli 2026") |
| Responsive Verhalten | Bei schmalem Container werden zuerst die Schnellzugriff-Links ausgeblendet (weiterhin über den Kalender-Popover erreichbar), dann rückt die Segmented Control in eine zweite Zeile um |

#### C8. Kalender-Popover (Date Picker)

| Feld | Beschreibung |
|---|---|
| Zweck | Schwebende Datums-/Monatsauswahl, ausgelöst durch Klick auf ein Zeitraum-Label (im Zeitraum-Switcher) oder ein Datum-Formularfeld (A5) |
| Varianten | `Monatsraster` (Jahr-Navigation + 12-Monats-Grid, für den Zeitraum-Switcher) · `Tagesraster` (klassischer Kalender, für einzelne Datumsfelder wie „Kontostand am [Datum]") |
| Größen | Feste kompakte Breite (~200–260px) |
| States | Je Zelle: Standard, Auswählbar, Ausgewählt (petrol gefüllt), Außerhalb des verfügbaren Datenbereichs (gedimmt, nicht wählbar, aber sichtbar zur Orientierung), Hover, Fokus |
| Icons | `chevron-left` / `chevron-right` für Jahr-/Monatsnavigation innerhalb des Popovers |
| Verhalten | Auswahl einer Zelle übernimmt den Wert sofort und schließt den Popover; **positioniert sich über die Popover-Primitive (Kapitel 4)**, kippt automatisch bei Platzmangel |
| Keyboard Navigation | Pfeiltasten bewegen die Auswahl zwischen Zellen (Monatsraster: links/rechts = Monat, hoch/runter = Quartal-Sprung von 4; Tagesraster: klassische Wochenraster-Navigation), `Enter` übernimmt, `Esc` schließt ohne Änderung |
| Accessibility | `role="dialog"` mit `aria-label` (z. B. „Monat auswählen"); ausgewählte/deaktivierte Zellen tragen `aria-selected`/`aria-disabled` |
| Responsive Verhalten | Feste Größe, verschiebt sich nur in der Position (nie in der Größe) gemäß Popover-Primitive |

---

### Gruppe D – Datenvisualisierung

#### D1. KPI-Anzeige

| Feld | Beschreibung |
|---|---|
| Zweck | Kompakte Darstellung eines einzelnen Kennwerts mit Label, Wert, optionalem Vergleichstrend und Kontextzeile – der Inhalt, der typischerweise in eine Card (B1) eingebettet wird |
| Varianten | `neutral` (Standardfarbe) · `positiv` (sage, z. B. Einnahmen) · `negativ` (brick, z. B. Ausgaben) – Farbe folgt der **finanziellen Bewertung**, nicht der reinen Zahlenrichtung (siehe Product Spec 5.6) |
| Größen | Nur eine Größe (23px Wertdarstellung, wie im Prototyp) |
| States | Mit/ohne Delta-Indikator, Lade-Zustand (siehe B11 Skeleton) |
| Icons | `▲`/`▼`-Äquivalent als kleines Trend-Icon (`trending-up`/`trending-down` aus dem Icon-System statt reiner Textpfeile) |
| Verhalten | Rein darstellend |
| Keyboard Navigation | Nicht zutreffend (nicht interaktiv) |
| Accessibility | Wert und Trend werden als zusammenhängender Text vorgelesen (z. B. „Einnahmen: 4.820 Euro, 4 % mehr als im Vormonat"), nicht als isolierte Zahl + isoliertes Pfeil-Icon |
| Responsive Verhalten | Wertgröße bleibt konstant, Kontextzeile bricht bei Bedarf um |

#### D2. Liniendiagramm (inkl. Sparkline)

| Feld | Beschreibung |
|---|---|
| Zweck | Zeitreihen-Darstellung – deckt Konto-Sparklines, Vermögensentwicklung, Cashflow-Trend (mehrserien) und Vertrags-Verlauf einheitlich ab |
| Varianten | Ein-Serie oder Zwei-Serien (z. B. Einnahmen/Ausgaben mit Legende) |
| Größen | `Sparkline` (kompakt, ~80×26px, **keine** Achsenbeschriftung, **kein** Hover – zu klein für sinnvolle Detailinteraktion) · `Standard` (Widget-Größe, ~90–100px Höhe, **mit** beschrifteter Wert-Achse und Hover-Tooltip pro Datenpunkt) · `Groß` (Vollbild/Drawer, wie Standard mit mehr Platz für Beschriftungen) |
| States | Normal, Hover (nur Standard/Groß: zeigt Tooltip mit exaktem Wert + Datum am nächsten Datenpunkt), Leer (keine Daten im Zeitraum) |
| Icons | Keine eigenen |
| Verhalten | Linie folgt den **echten Datenpunkten** (keine dekorative Glättung); bei Standard/Groß folgt beim Bewegen der Maus über die Fläche ein vertikaler Indikator dem nächsten Datenpunkt und zeigt Wert + Datum in einem kleinen Tooltip (aufbauend auf der Popover-Primitive, Kapitel 4) |
| Keyboard Navigation | Standard/Groß: Diagrammfläche per `Tab` erreichbar, `Pfeil links/rechts` bewegt den Datenpunkt-Indikator schrittweise (Tastatur-Äquivalent zum Hover) |
| Accessibility | Zusätzlich zur visuellen Darstellung wird eine textuelle Zusammenfassung bereitgestellt (z. B. versteckte Tabelle oder `aria-label` mit Start-/End-/Höchstwert), da reine SVG-Pfade für Screenreader nicht interpretierbar sind; Sparkline-Variante ist rein dekorativ und wird per `aria-hidden="true"` markiert, sofern der numerische Wert bereits an anderer Stelle in der Zeile als Text vorhanden ist (z. B. der Kontostand daneben) |
| Responsive Verhalten | Skaliert horizontal mit dem Container (SVG `viewBox`), Höhe bleibt je Größenvariante konstant; bei sehr schmalem Container (<200px) wechselt Standard automatisch auf die Sparkline-Darstellung (ohne Achsen/Hover) |

#### D3. Donut-Diagramm

| Feld | Beschreibung |
|---|---|
| Zweck | Anteilsdarstellung von Ausgaben nach Kategorie |
| Varianten | Nur eine Variante |
| Größen | Fest, 150×150px (Widget-Kontext) |
| States | Normal, Hover (Segment hervorgehoben + Tooltip mit Kategorie, Betrag, Prozentanteil), Leer (keine Ausgaben im Zeitraum → neutraler grauer Vollring statt Segmenten) |
| Icons | Keine |
| Verhalten | Zeigt die drei größten Kategorien als Segmente, alle weiteren werden zu „Sonstige" aggregiert; Hover auf ein Segment hebt es optisch hervor (z. B. leichte Vergrößerung) und zeigt Details im Tooltip |
| Keyboard Navigation | Per `Tab` erreichbar, `Pfeil links/rechts` wechselt das fokussierte Segment (Tastatur-Äquivalent zum Hover) |
| Accessibility | Textuelle Zusammenfassung als Alternative zur reinen Grafik (Liste „Kategorie: Betrag (Prozent)" per `aria-describedby` oder versteckter Tabelle) |
| Responsive Verhalten | Feste Größe, zentriert im verfügbaren Platz |

#### D4. Sankey-Diagramm

| Feld | Beschreibung |
|---|---|
| Zweck | Geldfluss-Darstellung von Einnahmequelle(n) zu Ausgaben-Hauptkategorien und Sparen/Investieren |
| Varianten | `€` (absolute Beträge) / `%` (Anteile) – gesteuert über eine Segmented Control (A4) im Widget-Header |
| Größen | `Standard` (Widget, 190px Höhe) · `Groß` (Vollbild-Modal, 400px Höhe, mit PNG-Export-Button) |
| States | Normal, Hover (Fluss-Pfad hervorgehoben + Tooltip mit exaktem Betrag), Leer (keine Daten im Zeitraum → Empty-State-Text anstelle des Diagramms) |
| Icons | `maximize-2` (Vollbild-Auslöser, nur Standard-Größe) |
| Verhalten | Hover auf einen Fluss-Pfad hebt ihn optisch hervor und dimmt die anderen leicht; Vollbild-Icon öffnet Modal C1 (Variante „vollbild") mit PNG-Export – **Export ist ausschließlich dort verfügbar**, nicht in der Standard-Größe |
| Keyboard Navigation | Standard/Groß: Diagrammfläche per `Tab` erreichbar, `Pfeil hoch/runter` wechselt den fokussierten Fluss-Pfad |
| Accessibility | Textuelle Zusammenfassung als Tabelle (Quelle → Ziel → Betrag) zusätzlich zur SVG-Grafik bereitgestellt |
| Responsive Verhalten | Skaliert horizontal mit dem Container (SVG `viewBox`); Textbeschriftungen an den Flussenden werden bei zu wenig Platz durch eine externe Legende unterhalb des Diagramms ersetzt statt überlappend gerendert zu werden |


## 6. Komponenten-Abhängigkeiten

Zeigt, welche Komponenten aus welchen anderen zusammengesetzt sind – wichtig, um Änderungen an einer Grundkomponente auf ihre Auswirkung abzuschätzen.

```
Popover-Primitive (Kapitel 4)
 ├─ A8  Tooltip
 ├─ C4  Dropdown-/Kontextmenü
 └─ C8  Kalender-Popover
        └─ verwendet von: C7 Zeitraum-Switcher, A5 Formularfeld (Datum-Variante)

A1 Button
 └─ verwendet in: B1 Card (Entity-Footer), C1 Modal (Fußzeile), C5 Bulk-Action-Bar,
                  B2 List Row (Aktions-Icons), B9 Dropzone (Datei-Auswahl-Fallback)

A4 Segmented Control
 └─ verwendet in: C7 Zeitraum-Switcher (Zeitraum-Typ), D4 Sankey-Diagramm (€/%-Umschalter)

A5 Formularfeld + B4 Formularfeld-Gruppe
 └─ verwendet in: praktisch jedem Modal (C1) mit Eingaben, B9 Dropzone (Metadaten-Felder)

B1 Card
 └─ verwendet in: D1 KPI-Anzeige (Container), D2/D3/D4 Diagramme (Container),
                  Dashboard-Grid, Verträge-/Sammlungen-Grid (als „Entity"-Variante)

B2 List Row
 └─ verwendet in: Konten-Seite, Transaktionen-Seite, Kategorien-Seite, Tags-Liste,
                  Kategorie-Drawer (Regel-Liste), Änderungsverlauf-Drawer, Profil-Seite (Einstellungs-Zeilen)

B5 Fortschrittsbalken
 └─ verwendet in: D1 KPI-Anzeige (Kategorisierungs-Fortschritt), Budget-Kacheln,
                  Sparziel-Karten (B1 Entity-Variante), C1 Modal (Import-Ladefortschritt)
```

---

## 7. Verwendungsmatrix (Komponente × Seite)

„●" = Komponente kommt auf dieser Seite vor. Dient als Vollständigkeitsprüfung – jede Seite aus der Product Spec muss sich ausschließlich aus Bibliotheks-Komponenten zusammensetzen lassen.

| Komponente | Übersicht | Vermögen | Transakt. | Verträge | Sammlungen | Kategorien | Budgets | Profil |
|---|---|---|---|---|---|---|---|---|
| A1 Button | ● | ● | ● | ● | ● | ● | ● | ● |
| A2 Checkbox | | | ● | | | | | |
| A3 Switch | | | ● | | | ● | | ● |
| A4 Segmented Control | ● | | | | | | | |
| A5 Formularfeld | | | ● | ● | ● | ● | ● | ● |
| A6 Chip | | | ● | ● | | | | |
| A7 Badge | | ● | | ● | ● | ● | | |
| A8 Tooltip | ● | | | | | | ● | ● |
| B1 Card | ● | ● | | ● | ● | ● | ● | ● |
| B2 List Row | | ● | ● | | | ● | | ● |
| B3 Tabellenkopfzeile | | | ● | | | | | |
| B5 Fortschrittsbalken | ● | | | | ● | | ● | |
| B6 Fortschritts-Schritte | | | | | | | | ● (Onboarding) |
| B7 Hinweisbox/Alert | ● | ● | | | | | | |
| B8 Auswahlkarte | | ● | | | | | | |
| B9 Dropzone | | ● | | | | | | |
| B10 Aufklappbereich | | | ● | | | | | |
| B12 Nav Item | ● | ● | ● | ● | ● | ● | ● | ● |
| C1 Modal | ● | ● | ● | | ● | ● | ● | ● |
| C2 Drawer | | | ● | ● | | ● | | |
| C3 Toast | ● | ● | ● | ● | ● | ● | ● | ● |
| C4 Kontextmenü | | | ● | | | | | |
| C5 Bulk-Action-Bar | | | ● | | | | | |
| C6 Empty State | ● | ● | ● | ● | ● | | ● | |
| C7 Zeitraum-Switcher | ● | | ● | | | | | |
| D1 KPI-Anzeige | ● | | | | | | | |
| D2 Liniendiagramm | ● | ● | | ● | | | | |
| D3 Donut-Diagramm | ● | | | | | | | |
| D4 Sankey-Diagramm | ● | | | | | | | |

*Anmerkung: Leere Zellen sind gewollt – z. B. hat die Kategorien-Seite keinen eigenen Zeitraum-Switcher, da sie global (haushaltsweit) ist, nicht zeitraumbezogen (siehe Product Spec, Regel G1).*

---

## 8. Bewusst nicht übernommene Prototyp-Artefakte

| Artefakt | Grund |
|---|---|
| `.demo-toggle` („Demo: leerer Zustand"-Button auf der Konten-Seite) | Reine Entwicklungshilfe im Prototyp, um den Empty State ohne echte Daten vorzuführen. Kein Bestandteil des echten Produkts – der Empty State erscheint dort automatisch, wenn 0 Konten existieren, ohne manuellen Umschalter. |
| Browser-native `confirm()`-Dialoge (z. B. Kategorie deaktivieren) | Bereits in der Product Spec (Kapitel 7.6, D12) durch das reguläre Bestätigungsmodal (C1) ersetzt – kein separates Pattern nötig. |
| Emoji als Icons (✎ 🗑 🔎 📅 ⚠ 🧩 ⤢ ✓) | Ersetzt durch das einheitliche Icon-System (Kapitel 2) – Emoji sind kein eigenständiges „Komponenten"-Konzept, sondern werden 1:1 durch Bibliotheks-Icons ausgetauscht. |
| `↕` als kombiniertes Sortier-Symbol | Ersetzt durch drei einzelne, klar unterscheidbare Icon-Zustände in B3 (Tabellenkopfzeile) – siehe Icon-System-Tabelle. |
| Eigene SVG-Pfade für Kategorie-Icons | Ersetzt durch entsprechende Icon-System-Symbole (Kapitel 2), damit Strichstärke/Stil konsistent mit allen anderen Icons der App bleiben, statt handgezeichnete Einzelpfade zu pflegen. |

---

*Ende der Komponentenbibliothek. Bezug: Diese Komponenten bilden die verbindliche Grundlage für alle in `klarwert-product-specification.md` beschriebenen Seiten – jede dort beschriebene UI-Einheit lässt sich auf genau eine Komponente aus diesem Dokument zurückführen.*

---

## 9. v2-Ergänzungen (final)

Dieses Kapitel ergänzt die Bibliothek um die Umsetzungszuordnung für den festgelegten Stack (shadcn/ui + ECharts) und drei neue Komponenten. Alles Vorherige bleibt gültig; bei Widerspruch gilt dieses Kapitel.

### 9.1 shadcn/ui-Mapping

| Bibliotheks-Komponente | Umsetzung |
|---|---|
| A1 Button, A2 Checkbox, A3 Switch, A5 Select/Input, A6 Chip (via Badge/Toggle), A7 Badge | shadcn `button`, `checkbox`, `switch`, `select`/`input`, `badge`/`toggle`, `badge` – Varianten über Tailwind-Tokens (Kap. 1) |
| A5 Combobox-Variante (Kategorie-Auswahl überall) | shadcn `combobox` (Popover + `command`/cmdk) – **verbindlich statt reinem `select`**, sobald >~15 Optionen, insbesondere Kategorie |
| A4 Segmented Control, B8 Auswahlkarte | shadcn `tabs` (list-only) bzw. `radio-group` mit Card-Styling |
| A8 Tooltip, C4 Dropdown/Kontextmenü, C8 Kalender-Popover | shadcn `tooltip`, `dropdown-menu`/`context-menu`, `popover`+`calendar` – **die Popover-Primitive aus Kap. 4 ist damit erledigt**: Radix liefert Auto-Flip/Kollisionserkennung nativ; nichts selbst bauen |
| C1 Modal, C2 Drawer | shadcn `dialog` bzw. `sheet` (side="right", Breiten 390/430px; Import-Wizard: `dialog` mit `import`-Größe, siehe A-Kapitel C1) |
| C3 Toast | shadcn `sonner` (3 s, Undo-Action, kein Stacking: `toast.dismiss()` vor neuem Toast) |
| B10 Disclosure | shadcn `collapsible` |
| B13 Sortierbare Liste, B3b Spalten-Reihenfolge | `@dnd-kit/sortable` (vertikal für B13, horizontal für Tabellenspalten) + Pfeil-Buttons (A1 icon-only) als gleichwertige Alternative |
| B5/B6 Fortschritt | shadcn `progress` + eigene Compare-/Steps-Varianten |

### 9.2 ECharts-Mapping (Gruppe D)

Zentrale Theme-Datei `lib/charts/theme.ts` mit den Design-Tokens; alle Optionen als Factory-Funktionen, nie inline.

| Komponente | ECharts-Typ | Kernoptionen |
|---|---|---|
| D2 Liniendiagramm Standard/Groß | `line` | `tooltip.trigger='axis'`, sichtbare Y-Achse mit €-Formatter, echte Datenpunkte (`smooth:false`), `dataZoom` nur Groß |
| D2 Sparkline | `line` | Achsen/Grid/Tooltip aus, `silent:true`, `aria-hidden` |
| D3 Donut | `pie` (radius ['55%','80%']) | Top-5 Oberkategorien + "Sonstige", Klick-Event → Navigation mit Kategorie-Filter |
| D4 Sankey | `sankey` | €/%-Umschalter formatiert nur Labels/Tooltip um; Vollbild = Modal-Variante `vollbild`, Export via `getDataURL()` |
| Cashflow/Budget-Verlauf/Rechner-Charts | `bar` (Cashflow: gruppiert; Rechner a/b: gestapelt Einzahlung+Ertrag; Entnahme: `line` mit `areaStyle`) | gemeinsamer €-Tooltip-Formatter |

Barrierefreiheit gemäß D-Spezifikationen: jede Chart-Instanz bekommt eine begleitende, visuell versteckte Text-Zusammenfassung (`aria-label`/versteckte Tabelle) – ECharts-SVG allein ist nicht screenreader-tauglich.

### 9.3 Neue Komponente C9 – Benachrichtigungs-Glocke

Zweck: Zugang zu persistenten Benachrichtigungen in der Globalbar. Aufbau: Icon-Button (`bell`) + Zähler-Badge (ungelesen, max. Anzeige "9+") + Popover (Radix) mit Liste (List Row kompakt: Prioritäts-Icon `info`/`triangle-alert`, Text, relative Zeit), Eintrag-Klick navigiert zur Bezugsseite + markiert gelesen; Fußzeile "Alle als gelesen markieren"; Empty State klein. States: keine ungelesenen (kein Badge) / ungelesene / offen. Keyboard: Öffnen per Enter, Pfeile navigieren Einträge, Esc schließt. `aria-label="Benachrichtigungen, N ungelesen"`, Liste `role="menu"`.

### 9.4 Neue Komponente C10 – Demo-Banner

Zweck: unübersehbare Kennzeichnung des Demo-Modus. Volle Breite oberhalb der Globalbar, sage-getönt, Icon `flask-conical`, Text "Demo-Modus – Änderungen betreffen nur die Demo-Daten", Aktionen als Text-Buttons: "Zurück zu meinen Daten" · "Demo zurücksetzen" (→ Bestätigung). Nicht schließbar (verschwindet nur durch Verlassen des Modus). `role="status"`. Reserviert Layout-Höhe, überlappt nie Inhalte.

### 9.5 Neue Komponente C11 – Aufräum-Karte (Triage)

Zweck: Kern des Aufräum-Modus (Spec 4.3b). Aufbau innerhalb Modal `wide`: Fortschrittskopf (B5 + "N von M"), Transaktions-Karte (Datum/Konto/Empfänger groß/Zweck/Betrag), Kategorie-Schnellwahl (6 zuletzt genutzte als Chips) + vollständiges gruppiertes Select, Kurzoptionen Tag/Sparen, bedingte Inline-Box "Regel-Vorschlag" (B7 neutral, mit Primär-/Ghost-Aktion). Verhalten: Auswahl speichert sofort und wechselt zur nächsten Karte (kein Speichern-Button); "Überspringen" ohne Änderung. Keyboard: Ziffern 1–6 wählen die Schnellwahl-Chips, Enter bestätigt Regel-Vorschlag, Esc beendet den Modus. `aria-live="polite"` für den Fortschritt.

### 9.6 Icon-Ergänzungen

`bell` (Benachrichtigungen) · `flask-conical` (Demo) · `grip-vertical` (Drag-Handle) · `piggy-bank` (Sparen-Markierung) · `arrow-left-right` (Transfer-Badge) · `lock` (gesperrte Importfelder) · `folder-open` (Datenordner öffnen) · `broom`→ nicht vorhanden in Lucide, stattdessen `sparkles` für den Aufräum-Modus-Button.
