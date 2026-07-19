import { create } from "zustand";
import { getAllSettings, setSetting } from "@/db/repositories/settings";

interface SettingsState {
  loaded: boolean;
  currency: string;
  importReminderDays: number;
  kirchensteuerAktiv: boolean;
  kirchensteuerSatz: 8 | 9;
  onboardingDone: boolean;
  load: () => Promise<void>;
  setCurrency: (currency: string) => Promise<void>;
  setImportReminderDays: (days: number) => Promise<void>;
  setKirchensteuer: (aktiv: boolean, satz: 8 | 9) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  loaded: false,
  currency: "EUR",
  importReminderDays: 30,
  kirchensteuerAktiv: false,
  kirchensteuerSatz: 8,
  onboardingDone: false,

  load: async () => {
    const all = await getAllSettings();
    set({
      loaded: true,
      currency: all.currency ?? "EUR",
      importReminderDays: Number(all.import_reminder_days ?? "30"),
      kirchensteuerAktiv: all.kirchensteuer_aktiv === "1",
      kirchensteuerSatz: all.kirchensteuer_satz === "9" ? 9 : 8,
      onboardingDone: all.onboarding_done === "1",
    });
  },

  setCurrency: async (currency) => {
    await setSetting("currency", currency);
    set({ currency });
  },

  setImportReminderDays: async (days) => {
    await setSetting("import_reminder_days", String(days));
    set({ importReminderDays: days });
  },

  setKirchensteuer: async (aktiv, satz) => {
    await setSetting("kirchensteuer_aktiv", aktiv ? "1" : "0");
    await setSetting("kirchensteuer_satz", String(satz) as "8" | "9");
    set({ kirchensteuerAktiv: aktiv, kirchensteuerSatz: satz });
  },

  completeOnboarding: async () => {
    await setSetting("onboarding_done", "1");
    set({ onboardingDone: true });
  },
}));
