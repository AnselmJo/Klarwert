# Sicherheitsrichtlinie

Klarwert verarbeitet echte, teils sensible Finanzdaten (Kontostände, Transaktionen, Verwendungszwecke). Sicherheitslücken bitte **nicht** als öffentliches GitHub Issue melden, sondern:

- Über GitHubs privaten Meldeweg ("Report a vulnerability" im "Security"-Tab des Repos), falls aktiviert, oder
- Per E-Mail an die im Repo hinterlegte Kontaktadresse (siehe Profil des Maintainers).

Bitte gib nach Möglichkeit an: betroffene Version, Reproduktionsschritte, potenzielle Auswirkung (z. B. Datenverlust, Datenleck, Datenkorruption).

## Umfang

Relevant sind insbesondere:
- Schwachstellen, die lokale Daten (die SQLite-Datenbank, Backups) für andere Prozesse/Nutzer auf demselben Gerät zugänglich machen könnten
- Schwachstellen in der Auto-Update-Funktion (sobald implementiert), die manipulierte Updates ermöglichen könnten
- Schwachstellen, durch die die Händler-Datenbank-Synchronisation (Community-Feature) mehr als reine Kategorie-Zuordnungen preisgibt

Nicht im Fokus: Die App hat keinen Server und keine Cloud-Komponente – klassische Server-seitige Angriffsvektoren (SQL-Injection gegen einen Server, Auth-Bypass o. ä.) entfallen konzeptionell.

## Reaktionszeit

Dies ist ein Open-Source-Projekt eines Einzelentwicklers, keine kommerzielle Garantie auf Reaktionszeiten – ernsthafte Meldungen werden aber priorisiert behandelt.
