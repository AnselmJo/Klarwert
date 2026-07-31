# Klarwert – Phase 5: Website & GitHub-Launch (autonom abzuarbeiten, mit einer manuellen Ausnahme)

## Kontext

Die App selbst ist Gegenstand der Phasen 1–4 (siehe `CLAUDE.md`). Diese Runde ist **Repo- und Website-Infrastruktur**, keine App-Änderung. Bereits vorbereitet und mitgeliefert:
- `LICENSE` (MIT), `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.gitignore` – fertig, nur an die Repo-Wurzel legen.
- `.github/workflows/deploy-website.yml` – fertiger GitHub-Actions-Workflow, baut `website/` mit Astro und deployt nach GitHub Pages.
- `.github/ISSUE_TEMPLATE/bug_report.md` und `feature_request.md` – fertig.
- `klarwert-website-content.md` – kompletter Text-Inhalt aller Seiten (Startseite + Windows/macOS/Linux-Unterseiten).

**Wichtige Einschränkung:** Ich (die KI) kann den eigentlichen `git push` zu GitHub **nicht** ausführen – das erfordert deine GitHub-Zugangsdaten. Alles bis dahin (Repo-Struktur, Website-Code, Commits) läuft autonom; der Push selbst ist der einzige Schritt, den der Nutzer manuell auslöst (Schritt 12 unten, mit fertigen Befehlen zum Copy-Paste).

## Arbeitsweise

1. Eigener Branch (`feature/website-launch`), außer für die Repo-Grunddateien (Punkt 1–2 unten), die direkt auf `main` gehören.
2. Checkliste von oben nach unten, Commit nach jedem Punkt.
3. Bei Session-Ende: erstes `[ ]` suchen, dort weiter.

---

## Checkliste

- [x] 1. `LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.gitignore` an die Repo-Wurzel legen (bereits fertig, siehe oben – nur platzieren, nicht neu schreiben).
- [x] 2. `.github/workflows/deploy-website.yml` und `.github/ISSUE_TEMPLATE/*.md` an ihre Zielpfade legen (bereits fertig).
- [x] 3. **Astro-Projekt unter `website/` scaffolden** (`npm create astro@latest` o. ä., minimal, kein CMS, kein Server-Rendering nötig – reines Static Site Generation reicht für 4 Seiten). Tailwind für die Website separat einrichten (eigenständiges kleines Projekt, nicht Teil der App-Codebase, aber gleiche Design-Tokens wie die App verwenden – siehe `klarwert-component-library.md` Kap. 1 für Farben/Typografie, damit Website und App zusammen aussehen).
- [x] 4. **Vier Seiten anlegen** (`website/src/pages/index.astro`, `windows.astro`, `macos.astro`, `linux.astro`) mit dem Inhalt aus `klarwert-website-content.md` – Text 1:1 übernehmen, `<user>`-Platzhalter in Links durch den echten GitHub-Benutzernamen ersetzen (nachfragen, falls nicht bekannt).
- [x] 5. **Betriebssystem-Erkennung auf der Startseite** (einfache `navigator.userAgent`-Prüfung, rein clientseitig, kein Tracking): der zum Besucher-OS passende Download-Button wird visuell hervorgehoben, alle drei bleiben trotzdem klickbar.
- [x] 6. **Download-Links auf `/releases/latest`** verweisen lassen (GitHub löst das automatisch auf das neueste Release auf – kein manuelles Pflegen von Versionsnummern auf der Website nötig).
- [x] 7. Footer mit den drei Feedback-Links (Fehler melden/Feature vorschlagen/Frage stellen) auf **jeder** Seite, wie in `klarwert-website-content.md` beschrieben.
- [x] 8. Screenshots: **Platzhalter-Kommentar im Code lassen**, keine Fake-Screenshots einfügen (bewusst leer, bis echte Screenshots existieren – siehe Hinweis in `klarwert-website-content.md`).
- [x] 9. `npm run build` lokal verifizieren (Astro baut nach `website/dist`, das ist bereits in `.gitignore` ausgeschlossen – wird von der GitHub Action gebaut, nicht eingecheckt).
- [x] 10. **GitHub-Repo-Einstellung vorbereiten** (Textblock für den Nutzer ausgeben, nicht selbst ausführbar): "Gehe zu Repo → Settings → Pages → Source: 'GitHub Actions' auswählen (nicht 'Deploy from a branch')." Ohne diese einmalige manuelle Einstellung im GitHub-Web-UI greift der Workflow nicht.
- [x] 11. Prüfen, ob bereits ein lokales Git-Repo existiert (`git status`); falls nicht: `git init`, alle Dateien hinzufügen, ersten Commit erstellen ("Initial commit: Klarwert v1 + Website").
- [ ] 12. **Manueller Schritt für den Nutzer (nicht von der KI ausführbar – braucht GitHub-Zugangsdaten):**
    ```bash
    # 1. Auf github.com ein neues, leeres Repository "klarwert" anlegen (ohne README/LICENSE/.gitignore –
    #    die haben wir schon lokal, sonst gibt es einen Konflikt beim ersten Push)
    # 2. Im Projektordner:
    git remote add origin https://github.com/<dein-username>/klarwert.git
    git branch -M main
    git push -u origin main
    # 3. Danach in den Repo-Einstellungen (siehe Punkt 10) Pages auf "GitHub Actions" stellen
    # 4. Erstes Release erstellen (Tag z.B. v0.1.0) mit den gebauten Installer-Dateien (.exe/.dmg/.AppImage)
    #    als Release-Assets – GitHub → Releases → "Draft a new release"
    ```
    Nach diesem Push läuft die GitHub Action automatisch und deployed die Website; die Download-Links auf der Website funktionieren, sobald mindestens ein Release mit Assets existiert.

---

## Danach (nicht Teil dieser Checkliste, folgt später)

Community-Konsens-Pipeline für die Händler-Datenbank (siehe `klarwert-community-haendler-db.md`, Abschnitt 7 "Später"), Code-Signing für Windows/macOS, Auto-Updater-Integration mit dem Release-Mechanismus aus Punkt 12 – siehe `klarwert-backlog-roadmap.md`.
