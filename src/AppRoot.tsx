import { useEffect, useState } from "react";
import { runMigrations } from "@/db/migrate";
import { ensureBuiltinBankProfiles } from "@/lib/import/bankProfiles";
import { useSettingsStore } from "@/stores/settingsStore";
import { Onboarding } from "@/features/onboarding/Onboarding";
import { AppShell } from "@/components/AppShell";

/**
 * DB-Migrationen (Abschnitt 2), Settings/Onboarding-Gate (Abschnitt 3) und
 * Kern-Layout (Abschnitt 4) laufen hier zusammen.
 */
export function AppRoot() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useSettingsStore((s) => s.load);
  const loaded = useSettingsStore((s) => s.loaded);
  const onboardingDone = useSettingsStore((s) => s.onboardingDone);

  useEffect(() => {
    runMigrations()
      .then(() => Promise.all([load(), ensureBuiltinBankProfiles()]))
      .then(() => setReady(true))
      .catch((e) => setError(String(e)));
  }, [load]);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-brick">
        Datenbank-Fehler: {error}
      </div>
    );
  }

  if (!ready || !loaded) {
    return (
      <div className="flex h-screen items-center justify-center text-slate">
        Lädt…
      </div>
    );
  }

  if (!onboardingDone) {
    return <Onboarding />;
  }

  return <AppShell />;
}
