# Klarwert – Transfer- & Sparen-Erkennung zuverlässig machen (IBAN + Namensvarianten)

## Ausgangslage

Die aktuelle Transfer-Erkennung (`pipeline.ts`, Stufe 2) matcht ausschließlich über gegengleichen Betrag ±2 Tage auf einem anderen eigenen Konto. Das funktioniert nur, wenn **beide** Seiten importiert wurden – bei einem Depot ohne CSV-Export (typisch bei manchen Brokern) wird die Einzahlung nie als Transfer/Sparen erkannt, sondern bleibt eine gewöhnliche Ausgabe.

## Ziel: drei gestaffelte Signale statt eines

1. **IBAN-Vollmatch (höchste Konfidenz)** – funktioniert auch ohne Gegenbuchung.
2. **Gegenbuchungsmatch (mittlere Konfidenz)** – bestehende Logik, bleibt Fallback.
3. **Namensabgleich (niedrigste Konfidenz)** – reiner Hinweis, nie automatische Bestätigung.

## Schema-Erweiterung (additiv)

```sql
alter table assets
 add column iban text -- eigene iban, optional; grundlage für stufe 1
;

create table person_aliases (
  id integer primary key
, person_id integer not null references persons(id) on delete cascade
, alias text not null -- namensvariante, wie sie als empfänger/auftraggeber im bank-export auftauchen kann
);
create index idx_person_aliases on person_aliases(person_id);
```

## Aufgabe

- [x] 1. **Onboarding/Editier-UI:** optionales Feld "IBAN" im Anlage-/Bearbeiten-Dialog für Konten/Depots (auch für Depots ohne geplanten CSV-Import sinnvoll – reine Erkennungsgrundlage). Optionales Mehrfachfeld "Auch bekannt als" im Anlage-/Bearbeiten-Dialog für Personen, freie Eingabe mehrerer Varianten (z. B. "Anselm Josek", "A. Josek").
- [x] 2. **Stufe 1 – IBAN-Vollmatch:** Gegenpartei-IBAN aus dem Bankexport (`transactions.extra_fields_json.recipient_iban`, je nach Buchungsrichtung ggf. Auftraggeber-IBAN) gegen `assets.iban` aller aktiven eigenen Konten vergleichen. Treffer → `is_transfer = 1`, `transfer_status = 'confirmed'`, **unabhängig davon, ob die Gegenbuchung importiert wurde**. Diese Stufe ignoriert `dismissed_transfer_patterns` bewusst (anderes, stärkeres Signal als das Betragsmuster, das dort unterdrückt wurde).
- [x] 3. **Sparen-Zuordnung bleibt unverändert an Stufe 1/2 gekoppelt:** ist das Zielkonto vom Typ `tagesgeld` oder `depot`, zusätzlich `is_saving = 1` + `default_sparzweck_id` des Zielkontos übernehmen – bestehende Logik, jetzt nur auch von Stufe 1 erreichbar.
- [x] 4. **Stufe 2 – Gegenbuchungsmatch:** bestehende ±2-Tage-Logik bleibt exakt wie bisher, greift nur, wenn Stufe 1 nichts findet. Respektiert weiterhin `dismissed_transfer_patterns`.
- [x] 5. **Stufe 3 – Namensabgleich:** nur wenn Stufe 1 und 2 nichts finden. Normalisierter Empfängername (dieselbe Normalisierungsfunktion wie beim Händler-Matching, siehe `prompt-community-datenbanken.md` Teil A.1 – falls dieser Track schon gemergt ist, sonst eigene kleine Funktion) gegen `person_aliases` aller Haushaltsmitglieder. Bei Treffer: **kein** automatisches `is_transfer`/`transfer_status`, sondern eine `notifications`-Zeile (`type = 'transfer_detected'`, `priority = 'info'`, Text z. B. "Möglicher Transfer an {Person} – IBAN des Zielkontos ergänzen für sichere Erkennung?"). Bewusst schwächer als Stufe 1/2, da Namensgleichheit allein zu viele Fehltreffer produziert (z. B. Zahlungen an Dritte mit ähnlichem Namen).
- [x] 6. **Transparenz-Anzeige:** Kategorisierungs-/Transfer-Quelle (Stufe 1/2/3) muss im bestehenden "Transfer?"-Popover erkennbar sein (z. B. "Erkannt über IBAN" vs. "Erkannt über Betragsmuster"), analog zur bestehenden Transparenz-Anzeige für Kategorien.

## Testplan

- [ ] 7. Nach Abschluss von `prompt-mehrkonto-import.md`: die drei aus `transaktionen_c24.csv` importierten eigenen Konten sind ein guter echter Testfall für Stufe 1, sofern mindestens zwei davon als eigene Konten mit hinterlegter IBAN existieren – prüfen, dass interne Umbuchungen zwischen ihnen sofort als `confirmed` erkannt werden, ganz ohne Betragsmuster-Heuristik.
- [ ] 8. Mindestens einen Fall ohne Gegenbuchung testen (z. B. eine Überweisung an ein Konto, das nicht importiert, aber mit IBAN angelegt wurde) – muss trotzdem als Transfer/Sparen erkannt werden.

## Nicht Teil dieses Auftrags

Händler-DB-Pipelinestufe und Ähnlichkeits-Fallback für die allgemeine Kategorisierung – das läuft über `prompt-community-datenbanken.md` im parallelen Antigravity-Track. Beide Aufträge ändern `pipeline.ts` – Reihenfolge/Merge siehe `klarwert-roadmap-claude-code.md`.
