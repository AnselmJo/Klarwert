# Klarwert – Seed-Daten-Spezifikation (final)

Verbindliche Ausgangsdaten, die bei der ersten Initialisierung der Datenbank angelegt werden.

## 1. Template-Kategorien (13 Oberkategorien)

Alle mit `is_template=1`. Farbe+Icon (Lucide) nur an Oberkategorien; Unterkategorien erben die Farbe, `icon=null`. Sortierung wie gelistet.

| # | Oberkategorie | Farbe | Icon | Unterkategorien |
|---|---|---|---|---|
| a | Wohnen | `#1d4750` | `home` | Wohnnebenkosten · Heimwerken und Garten · Strom · Gas · Möbel und Haushaltsgeräte · Haushaltsdienstleistungen · Immobilienkredit · Miete / Wohngeld |
| b | Kinder | `#b79a5b` | `baby` | Kinderbetreuung und -gruppen · Taschengeld / Unterhalt · Spielwaren |
| c | Lebenshaltung | `#6f9a6d` | `shopping-basket` | Drogerie · Lebensmittel und Getränke · Haushaltsbedarf · Festnetz und Internet · Handy · Haustier (-bedarf) |
| d | Gesundheit und Wellness | `#4e8d7c` | `heart-pulse` | Arztbesuch / Krankenhaus · Arznei- und Heilmittel · Wellness und Beauty |
| e | Einnahmen | `#3f7d4e` | `banknote` | Staatliche Leistung und Förderung · Unterhalt · Kapitaleinkommen · Bareinzahlung · Mieteinnahmen · Rente und Pension · Gehalt |
| f | Versicherung | `#6b7a80` | `shield` | Unfallversicherung · Krankenversicherung · Wohngebäudeversicherung · Hausratversicherung · Rechtsschutzversicherung · Haftpflichtversicherung · Pflegeversicherung · Berufsunfähigkeitsversicherung · Tierversicherung · Kranken-Zusatzversicherung · Risiko-Lebensversicherung · Reiseversicherung |
| g | Freizeit, Hobbies und Soziales | `#c07a4a` | `ticket` | Kirche / Spende · Freizeitaktivitäten · Restaurant / Cafe / Bar · Sport und Fitness |
| h | Mobilität | `#4a6fa5` | `car` | KFZ-Versicherung · KFZ-Kredit / Leasingrate / KFZ-Kauf · KFZ-Sonstige · Tanken · Taxi / ÖPNV / Car- und Bikesharing |
| i | Sparen und Anlegen | `#2e6e5e` | `piggy-bank` | Festgeld / Tagesgeld / Sparkonto · Bausparen · Kapitallebensversicherung · Private Rentenversicherung · Wertpapieranlage · Wertgegenstände und andere Anlagen |
| j | Shopping und Unterhaltung | `#8a5fa0` | `shopping-bag` | Bücher / Zeitungen / Zeitschriften · Bekleidung / Schuhe / Accessoires · Unterhaltungselektronik und Software · Büromaterial · TV / Video / Musik |
| k | Reisen | `#3e8fa3` | `plane` | Hotel und Unterkunft · Pauschalreise · Transport |
| l | Bank und Kredit | `#55606a` | `landmark` | Kontentransfer · Bankgebühren · Barauszahlung · Kreditkartenabrechnung · Kredittilgung und -zinsen |
| m | Unkategorisiert | `#9aa4a8` | `circle-help` | *(keine; `is_system=1`, weder ausblendbar noch löschbar; Pipeline-Fallback)* |

Transfer-Erkennung kategorisiert automatisch als "Bank und Kredit → Kontentransfer".

## 1b. Kategorie-Aliase (Auswahl, für die Suche in 4.6)

Zusätzliche Suchbegriffe je Unterkategorie (`category_aliases`, `is_template`-Kategorien) – keine erschöpfende Liste, sondern Startpunkt; Nutzer können bei eigenen Kategorien beliebige weitere Aliase ergänzen.

| Unterkategorie | Aliase |
|---|---|
| Strom | Energie, Stromanbieter, Ökostrom |
| Gas | Heizung, Erdgas |
| Handy | Mobilfunk, Telefon, Smartphone-Vertrag |
| Festnetz und Internet | DSL, Glasfaser, Router |
| Lebensmittel und Getränke | Supermarkt, Einkauf, Rewe, Edeka, Lidl, Aldi |
| Arznei- und Heilmittel | Apotheke, Medikamente |
| Tanken | Benzin, Diesel, Kraftstoff |
| Taxi / ÖPNV / Car- und Bikesharing | Bahn, Bus, Nahverkehr, Uber |
| Restaurant / Cafe / Bar | Essen gehen, Gastronomie |
| Wertpapieranlage | ETF, Aktien, Depot, Fonds |
| Kranken-Zusatzversicherung | Zahnzusatz, Auslandskrankenversicherung |
| Gehalt | Lohn, Einkommen |
| Kontentransfer | Umbuchung, Eigenüberweisung |

## 2. Sparzwecke (Defaults, löschbar/editierbar)

| Name | Farbe | Zielbetrag |
|---|---|---|
| Rente / FIRE | `#2e6e5e` | – |
| Hauskauf | `#1d4750` | – |
| Kind | `#b79a5b` | – |
| Urlaub | `#3e8fa3` | – |
| Notgroschen | `#6b7a80` | – |

## 2b. Tags (Defaults, voll editierbar/löschbar – kein Template-Schutz wie bei Kategorien)

| Name | Farbe |
|---|---|
| Geschäftlich | `#4a6fa5` |
| Erstattungsfähig | `#b79a5b` |
| Geschenk | `#c07a4a` |
| Einmalig | `#6b7a80` |
| Gemeinsam | `#6f9a6d` |

## 3. Steuer-Themen (Defaults, editierbar)

| Thema | Kategorien | Stichwörter |
|---|---|---|
| Versicherungen & Vorsorge | gesamte Gruppe f (alle Unterkategorien) | – |
| Handwerker & haushaltsnahe Dienstleistungen (§35a) | Haushaltsdienstleistungen · Heimwerken und Garten | handwerker, hausmeister, gartenpflege, schornstein, wartung |
| Spenden & Kirche | Kirche / Spende | spende |
| Gesundheitskosten (außergewöhnl. Belastungen) | gesamte Gruppe d | zuzahlung, apotheke, brille, zahnarzt |
| Kinderbetreuung | Kinderbetreuung und -gruppen | kita, kindergarten, tagesmutter, hort |
| Kapitalerträge | Kapitaleinkommen | dividende, zinsen, ausschüttung |

## 4. Dashboard-Widgets (feste Reihenfolge)

`kpi_income` · `kpi_expenses` · `kpi_saving_amount` · `kpi_saving_rate` · `sankey` · `categorization_progress` · `collection_focus` · `category_donut` · `cashflow_trend` · `saving_by_purpose` · `person_compare` (config `{"metric":"expenses"}`) · `upcoming_payments` – alle `is_visible=1`.

## 5. Bankprofile (is_builtin=1)

Header-Fingerprint = normalisierte Header-Zeile (lowercase, Umlaute vereinfacht, Spaltennamen sortiert verkettet). **Hinweis:** DKB- und C24-Profile sind gegen reale Export-Dateien verifiziert (Stand Juli 2026); alle anderen Profile sind Best-Effort und müssen beim ersten realen Test gegen eine echte Datei geprüft werden – Banken ändern Formate gelegentlich, deshalb hat die Byte-/Encoding-Erkennung zur Laufzeit (Kap. 6 der Product Spec) immer Vorrang vor der hier hinterlegten Annahme.

| Profil | Trennz. | Encoding | Datum | Dezimal | Kernspalten (→ Rolle) |
|---|---|---|---|---|---|
| Sparkasse (CSV-CAMT) | `;` | windows-1252 | dd.MM.yy | de | Buchungstag→date · Betrag→amount · Beguenstigter/Zahlungspflichtiger→counterparty · Verwendungszweck→purpose · Kundenreferenz (End-to-End)→external_id |
| ING | `;` | windows-1252 | dd.MM.yyyy | de | Buchung→date · Betrag→amount · Auftraggeber/Empfänger→counterparty · Verwendungszweck→purpose |
| **DKB** (verifiziert) | `;` | **utf-8** (nicht windows-1252 – aktuelle DKB-Exporte sind UTF-8) | dd.MM.yy | de (auch ganzzahlig ohne Komma, z. B. "900") | Buchungsdatum→date · Betrag (€)→amount · **Zahlungsempfänger\*in→"Empfänger (nur bei Ausgabe)"**, **Zahlungspflichtige\*r→"Zahlungspflichtiger (nur bei Einnahme)"** (richtungsabhängig, siehe Product Spec Kap. 6) · Verwendungszweck→purpose · Kundenreferenz→external_id · Wertstellung/Status/Umsatztyp/Gläubiger-ID/Mandatsreferenz→verfügbar als Extra-Feld-Rollen, nicht zwingend gemappt. Datei beginnt typischerweise mit Kontoname- und "Kontostand vom …"-Zeilen vor der echten Kopfzeile (siehe Schritt 1.5 im Import-Wizard). |
| **C24** (verifiziert) | `,` | utf-8 | dd.MM.yyyy | de (Betrag inkl. "€"-Suffix und umschließenden Anführungszeichen, z. B. `"-5,47 €"`) | Buchungsdatum→date · Betrag→amount · Zahlungsempfänger→counterparty · Verwendungszweck→purpose · Beschreibung→"Beschreibung" (Extra-Feld) · Transaktionstyp→"Transaktionstyp" (Extra-Feld) · Karteneinsatz→"Karteneinsatz-Zeitpunkt" · Bargeldabhebung→"Bargeldabhebung-Zeitpunkt" · IBAN/BIC→Empfänger-IBAN/-BIC · Kontonummer/Kontoname→"Kontoname/Kontonummer (Bank)" (relevant bei Mehrkonten-Dateien, siehe Product Spec Kap. 6) · Kategorie/Unterkategorie→Bank-Kategorie/-Unterkategorie (Extra-Feld, für unsere Pipeline irrelevant). **Achtung:** manche C24-Exporte lassen leere *trailing* Felder am Zeilenende weg (Spaltenzahl der Datenzeilen kann kleiner sein als die des Headers) – siehe Header-Erkennungs-Toleranz in Kap. 6. |
| comdirect | `;` | windows-1252 | dd.MM.yyyy | de | Buchungstag→date · Umsatz in EUR→amount · Buchungstext→purpose (enthält Empfänger; Parser extrahiert "Auftraggeber:"/"Empfänger:"-Präfixe) |
| Commerzbank | `;` | windows-1252 | dd.MM.yyyy | de | Buchungstag→date · Betrag→amount · Buchungstext→purpose |
| Volksbank/GLS (VR) | `;` | windows-1252 | dd.MM.yyyy | de | Buchungstag→date · Betrag→amount · Name Zahlungsbeteiligter→counterparty · Verwendungszweck→purpose |
| N26 | `,` | utf-8 | yyyy-MM-dd | en | Booking Date→date · Amount (EUR)→amount · Partner Name→counterparty · Payment Reference→purpose |
| Trade Republic | `;` | utf-8 | dd.MM.yyyy | de | Datum→date · Betrag→amount · Beschreibung→purpose |

## 6. Rechner: Defaults & Tooltip-Texte (verbatim in die UI übernehmen)

**Gemeinsam:** Rendite 6 % · Inflation 2 % · Steuersatz effektiv 26,375 % (mit KiSt 9 %: 27,99 %, mit 8 %: 27,82 % – automatisch aus Profil vorbelegt, editierbar) · Teilfreistellung 30 % an.

| Feld | Tooltip |
|---|---|
| Erwartete Rendite p. a. | Durchschnittliche jährliche Wertentwicklung vor Steuern. Weltweite Aktien-ETFs erzielten historisch 6–8 % pro Jahr – Vergangenheitswerte sind keine Garantie. |
| Inflation | Jährliche Geldentwertung. Die EZB zielt auf 2 %. Wird genutzt, um Ergebnisse zusätzlich in heutiger Kaufkraft ("real") auszuweisen. |
| Steuersatz Kapitalerträge | Abgeltungsteuer 25 % + Soli 5,5 % = 26,375 %; mit Kirchensteuer entsprechend mehr. Vereinfachtes Modell ohne Sparerpauschbetrag und Vorabpauschale. |
| Teilfreistellung 30 % | Bei Aktienfonds (≥51 % Aktienquote) bleiben 30 % der Erträge steuerfrei – nur 70 % werden versteuert. |
| Entnahmerate (SWR) | Anteil des Kapitals, der jährlich entnommen wird. Die 4-%-Regel stammt aus der Trinity-Studie; 3–3,5 % gelten als vorsichtiger für lange Ruhestände. |
| Kapitalverzehr | An: Das Kapital darf bis zum Lebensende (Annahme: Alter 100) aufgebraucht werden – geringeres Zielkapital nötig. Aus: Nur Erträge werden entnommen, das Kapital bleibt erhalten. |
| Netto-Wunschbetrag | Monatlicher Betrag, der dir nach Steuern zum Leben zur Verfügung stehen soll. |
| Vorhandenes Kapital | Bereits angespartes Vermögen, das für dieses Ziel arbeitet (z. B. aktueller Depotwert). |
| Sparrate monatlich | Betrag, den du jeden Monat zusätzlich investierst. |
| Jährliche Erhöhung | Prozentuale Steigerung der Sparrate pro Jahr, z. B. entsprechend Gehaltserhöhungen ("Sparraten-Dynamik"). |
| TER / Gebühren | Laufende Fonds-/Depotkosten pro Jahr, mindern die Rendite direkt. Günstige ETFs liegen bei 0,1–0,3 %. |
| Ausschüttend / Thesaurierend | Ausschüttend: Erträge werden ausgezahlt und jährlich versteuert. Thesaurierend: Erträge werden reinvestiert, Steuer vereinfacht erst am Ende gerechnet. |
| Entnahme mit Inflation erhöhen | An: Die Entnahme steigt jedes Jahr um die Inflationsrate, damit die Kaufkraft konstant bleibt. |
| Horizont | Zeitraum in Jahren, über den der Entnahmeplan simuliert wird. |
| Geburtsjahr (Profil) | Optional im Profil hinterlegbar – daraus berechnet der FIRE-Rechner dein heutiges Alter und dein Alter bei Zielerreichung. |

Weitere Defaults: FIRE Netto-Wunsch 2.500 €, SWR 3,5 %, Sparrate 800 €, Wunsch-Eintrittsalter 55 · Zinseszins Anfangskapital 10.000 €, Sparrate 500 €, Erhöhung 2 %, Laufzeit 20 J, TER 0,2 % · Entnahme Startkapital 800.000 €, Entnahme 2.500 €/M, Horizont 35 J, Inflations-Erhöhung an.

## 7. Demo-Daten (`demo.db`, deterministisch generiert)

- Personen: "Alex" (Erwachsener, Geburtsjahr 1990), "Sam" (Erwachsener, 1992), "Juni" (Kind, 2021).
- Konten: "Gemeinschaftskonto" (Giro, beide Owner), "Tagesgeld Alex" (Standard-Sparzweck Notgroschen), "Depot Alex" (Standard-Sparzweck Rente/FIRE); Wertgegenstand "Bausparvertrag Sam" (12.400 €, 3 Historien-Einträge).
- Zeitraum: letzte 8 volle Monate bis heute. Pro Monat auf dem Giro: Gehalt Alex 3.400 € + Gehalt Sam 2.750 € (Gruppe e); Miete −1.450 € (Vertrag, bestätigt); Strom −95 € (Vertrag; im vorletzten Monat auf −112 € → erzeugt live eine "Preisänderung erkannt"-Karte); Streaming −12,99 € (neu erkannt, unbestätigt); Internet −44,99 € (bestätigt); 14–18 Alltagsbuchungen (Rewe/Edeka/dm/Tanken/Restaurants/Amazon, plausibel gestreut, ~70 % via mitgelieferten Demo-Regeln kategorisiert, Rest unkategorisiert → Aufräum-Modus demonstrierbar); Transfer 500 € Giro→Tagesgeld + 400 € Giro→Depot (bestätigte Transfer-Paare, Sparen mit Zweck → Spar-KPIs & "Sparen nach Zweck" gefüllt).
- Sonstiges: Sammlung "Urlaub Ostsee" (Sparziel 2.000 €, Stand ~1.350 €), Budgets Lebensmittel 550 €/Monat (bei ~85 %) und Restaurant 150 €/Monat (überschritten → Benachrichtigung), 2 gespeicherte Rechner-Szenarien, 3 Benachrichtigungen (1 ungelesen).
