# Klarwert – Mehrkonto-CSV-Import (inkl. Testdatei transaktionen_c24.csv)

## Ausgangslage

`transaktionen_c24.csv` enthält Buchungen für **drei verschiedene eigene Konten** in einer einzigen Datei (typisch für Neobanken wie C24, die mehrere Unterkonten unter einem Export bündeln). Der aktuelle Import ist darauf **nicht ausgelegt**: `imports.asset_id` ist `not null` (ein Import = ein Konto), `import_profiles.column_map_json` kennt keine Spalte zur Kontokennung. Eine solche Datei kann heute nur importiert werden, wenn sie vorher außerhalb von Klarwert manuell in drei Dateien aufgeteilt wird – kein guter Zustand, da mehrkontenfähige Exporte bei mehreren deutschen Banken üblich sind, nicht nur bei C24.

## Ziel

Eine hochgeladene Datei kann mehrere Konten enthalten. Der Wizard erkennt das, lässt den Nutzer die Kontokennung einmalig pro Bankprofil den Klarwert-Konten zuordnen, und importiert alle betroffenen Konten in einem Durchlauf – ohne die bestehende Transaktions-Disziplin (CLAUDE.md: ein kompletter Import = eine Transaktion) zu brechen.

## Aufgabe

- [x] 1. **Schema-Erweiterung** (additiv, `ALTER TABLE`, keine Rebuild-Migration nötig):
  ```sql
  alter table import_profiles
   add column account_column_index integer -- spaltenindex der kontokennung im csv; null = einzelkonto-profil wie bisher
  ;
  create table import_profile_account_map (
    id integer primary key
  , import_profile_id integer not null references import_profiles(id) on delete cascade
  , source_value text not null -- wert aus der kontokennungs-spalte, z. b. iban oder kontoname laut bank-export
  , asset_id integer not null references assets(id) on delete cascade
  );
  create unique index idx_import_profile_account_map on import_profile_account_map(import_profile_id, source_value);
  ```
- [x] 2. **Wizard-Schritt "Kontokennung zuordnen"**: erscheint nur, wenn beim Anlegen/Bearbeiten eines Bankprofils erkennbar ist, dass eine Spalte mehrere unterschiedliche Werte enthält, die auf verschiedene Konten hindeuten (z. B. eine IBAN- oder Kontoname-Spalte mit > 1 distinktem Wert in der Vorschau). Nutzer ordnet jeden gefundenen Wert einmalig einem bestehenden oder neu anzulegenden Klarwert-Konto zu → landet in `import_profile_account_map`. Bei Re-Importen mit demselben Profil entfällt dieser Schritt (Mapping ist gespeichert).
- [x] 3. **Import-Routine anpassen**: eine hochgeladene Datei mit erkannter Kontokennung wird nach `source_value` gruppiert; **eine äußere Transaktion** (`BEGIN`…`COMMIT`) umschließt weiterhin den gesamten Datei-Durchlauf, innerhalb davon läuft die bestehende Pro-Konto-Logik (Löschen bei "Komplett neu laden" + Einfügen + Pipeline-Lauf + Protokoll) einmal je Gruppe, jede Gruppe erzeugt eine eigene Zeile in `imports` mit dem jeweiligen `asset_id`. Kein verschachteltes `BEGIN`/`COMMIT` (siehe CLAUDE.md, Transaktions-Disziplin).
- [x] 4. **Zusammenfassungs-Screen erweitern**: bisher ein aggregiertes Ergebnis, jetzt Aufschlüsselung je erkanntem Konto ("Girokonto: 42 neu, 3 aktualisiert · Tagesgeld: 5 neu · Depot: 12 neu").
- [x] 5. **Encoding/Delimiter-Erkennung unverändert** – gilt weiterhin für die gesamte Datei, nicht pro Kontogruppe (Bankexporte sind pro Datei einheitlich kodiert).

## Testplan mit transaktionen_c24.csv

- [ ] 6. Bankprofil für C24 anlegen (oder falls schon vorhanden, um den neuen Schritt erweitern), Kontokennungs-Spalte identifizieren, alle drei Werte den passenden (ggf. neu anzulegenden) Konten zuordnen.
- [ ] 7. Import durchführen, für jedes der drei Konten prüfen: Kontostand-Invariante (Anker-Saldo + Summe aller Transaktionen ab Anker, CLAUDE.md Invariante 4) stimmt, keine Buchung landet auf dem falschen Konto, Encoding/Umlaute korrekt.
- [ ] 8. Re-Import derselben Datei (Modus "upsert") prüfen: kein doppeltes Einfügen, Kontokennungs-Zuordnung wird nicht erneut abgefragt.

## Nicht Teil dieses Auftrags

Einzelkonto-Profile (der bisherige Normalfall) bleiben unverändert lauffähig – `account_column_index = null` ist der bestehende Pfad, keine Migration bestehender Profile nötig.
