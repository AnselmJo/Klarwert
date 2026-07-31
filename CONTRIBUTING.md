# Mitwirken bei Klarwert

Danke für dein Interesse! Es gibt mehrere Wege, ohne dass alle davon Programmierkenntnisse brauchen.

## Ohne Programmierkenntnisse

- **Händler-Datenbank ergänzen** (welche Kategorie zu welchem Händler gehört, z. B. "REWE → Lebensmittel"): direkt in der App unter Kategorien → Händler-Datenbank → "Vorschläge teilen". Details: [`context/klarwert-community-haendler-db.md`](context/klarwert-community-haendler-db.md). Es werden dabei **niemals** Beträge, Daten oder Kontodaten geteilt – ausschließlich die Zuordnung Händler→Kategorie.
- **Fehler melden / Feature vorschlagen**: über [GitHub Issues](../../issues) oder das Formular, sobald die Website live ist.
- **Übersetzungen/Formulierungen prüfen**: die App ist bewusst auf Deutsch; Hinweise zu unklaren Texten sind willkommen.

## Mit Programmierkenntnissen

1. Repo forken, Branch anlegen.
2. [`context/CLAUDE.md`](context/CLAUDE.md) lesen – enthält Tech-Stack, Projektstruktur, Konventionen und die verbindlichen Invarianten (z. B. Transaktions-Disziplin bei der Datenbank).
3. Für Produktentscheidungen ist [`context/klarwert-product-specification.md`](context/klarwert-product-specification.md) maßgeblich – bitte keine abweichenden UI-/Verhaltens-Entscheidungen ohne Rücksprache (Issue eröffnen).
4. Pull Request mit klarer Beschreibung, was geändert wurde und warum.

## Neue Bankformat-Parser beitragen

Ein neues Bankformat wird als eigenes Parser-Modul beigetragen (kein Laufzeit-Plugin-System – siehe [`context/CLAUDE.md`](context/CLAUDE.md), Abschnitt "Bewusst nicht geplant"). Orientiere dich an den bestehenden Profilen in [`context/klarwert-seed-data.md`](context/klarwert-seed-data.md), Abschnitt 5.

## Verhaltenskodex

Sei freundlich und konstruktiv. Klarwert ist ein Projekt, das mit echten, teils sensiblen Finanzdaten arbeitet – entsprechend sorgfältig sollten Beiträge sein, die diese Daten verarbeiten.
