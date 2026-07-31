# Klarwert – Community-Bankformat-Templates: Konzept & Contribution-Modell

Schwesterdokument zu `klarwert-community-haendler-db.md`, hier für **Bank-CSV-Importprofile** (`import_profiles`) statt Händler-Kategorien. Ziel: Nutzer, die manuell ein funktionierendes Importprofil für eine noch nicht unterstützte Bank erstellt haben, können es für alle anderen Nutzer vorschlagen – ohne Server, ohne echte Kontodaten zu teilen, aber mit einer **strengeren Prüfschwelle** als bei der Händler-DB.

## 1. Warum strenger als die Händler-DB

Eine falsche Händler→Kategorie-Zuordnung ist unangenehm, aber folgenlos für die Datenintegrität. Ein falsches Bankprofil (vertauschte Spalten, falsches Dezimaltrennzeichen, falsches Vorzeichen) verfälscht reale Kontostände – genau die Fehlerklasse, die Klarwerts Transaktions-Disziplin (CLAUDE.md) ausschließen soll. Deshalb: **kein Auto-Merge, unabhängig von der Anzahl übereinstimmender Vorschläge** – anders als bei der Händler-DB (dort ab 3 Zustimmungen automatisch).

## 2. Was geteilt wird (und was nicht)

Geteilt wird ausschließlich die **Struktur** eines Bankexports: `delimiter`, `encoding`, `date_format`, `decimal_format`, `header_fingerprint`, `column_map_json` (siehe `klarwert-schema.sql`, Tabelle `import_profiles`) – niemals echte Kontodaten. Als Funktionsnachweis liefert der Vorschlag zusätzlich **2–3 synthetische Beispielzeilen**, lokal aus dem echten Spaltenlayout generiert, mit frei erfundenen Beträgen/Daten/Namen (kein Export echter Zeilen). Vorschau-Pflicht vor dem Senden, wie bei der Händler-DB.

## 3. Datenformat (im Repo, versioniert)

```json
{
  "source_version": "2026-08",
  "profiles": [
    {
      "name": "Beispielbank (Girokonto)",
      "header_fingerprint": "datum;buchungstext;verwendungszweck;betrag;waehrung",
      "delimiter": ";",
      "encoding": "utf-8",
      "date_format": "dd.MM.yyyy",
      "decimal_format": "de",
      "column_map": { "date": 0, "counterparty": 1, "purpose": 2, "amount": 3 },
      "sample_rows": [
        ["01.01.2026", "Muster GmbH", "Testzweck 1", "-12,34", "EUR"]
      ]
    }
  ]
}
```

## 4. Ablauf

1. **Lokal:** Nutzer erstellt Profil im bestehenden Import-Wizard (Phase 1) → neuer Button "Als Vorlage vorschlagen" im Bankprofil-Editor.
2. **Export + Einreichung:** wie Händler-DB – vorausgefülltes GitHub-Issue, Vorschau-Dialog mit Zeile-für-Zeile-Bestätigung.
3. **GitHub Action:** zählt unabhängige Vorschläge je `header_fingerprint`. Ab Schwelle (Empfehlung: ≥ 2 übereinstimmend) öffnet sie automatisch einen PR – **gemerged wird nie automatisch**. Die Action führt zusätzlich den echten Parser (`src/lib/import/`) gegen die mitgelieferten `sample_rows` aus und hängt das Ergebnis als Kommentar an den PR (Parserfehler blockt den Merge).
4. **Statischer Download + Diff:** wie Händler-DB, über `raw.githubusercontent.com`, Diff-Vorschau ("2 neue Bankprofile: Beispielbank, C24 – übernehmen?").

## 5. Sicherheitsnetze

- Kein Auto-Merge (siehe oben) – einziger grundsätzlicher Unterschied zur Händler-DB-Pipeline.
- Regression-Fixture pro Profil (die `sample_rows`) läuft bei jeder Änderung erneut gegen den Parser.
- Lokale Souveränität: ein übernommenes Profil kann pro Nutzer ausgeblendet/gelöscht werden (`import_profiles.is_deleted`), ohne die globale Quelle zu beeinflussen.
- Header-Fingerprint-Kollisionen (zwei Banken mit identischem Spaltenlayout) werden im PR-Review manuell aufgelöst, nicht automatisch zusammengeführt.

## 6. Schema-Ergänzung

Eine Spalte genügt – `import_profiles` hat bereits `is_builtin`, `header_fingerprint`, `column_map_json` etc.:

```sql
alter table import_profiles
 add column source_version text -- daten-release, z. b. '2026-08'; null bei lokal erstellten profilen
;
```

## 7. Bezug zur Händler-DB

Beide Mechanismen teilen sich Infrastruktur (GitHub-Issue-Templates, Action-Grundgerüst, "Regel-Update prüfen"-UI, Diff-Anzeige) – Bank-Format-Templates sind eine zweite Datenquelle im selben Update-Check, keine zweite Baustelle. Empfehlung: Händler-DB-Pipeline zuerst produktiv laufen lassen, danach dieselbe Action um die Profil-Prüfung erweitern.
