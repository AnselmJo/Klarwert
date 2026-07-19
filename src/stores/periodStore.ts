import { create } from "zustand";
import type { PeriodType } from "@/lib/periods";

interface PeriodState {
  type: PeriodType;
  /** ISO-Datum (yyyy-MM-dd) als Anker innerhalb des gewählten Zeitraums. */
  anchorIso: string;
  setType: (type: PeriodType) => void;
  setAnchorIso: (iso: string) => void;
}

/** Seitenübergreifend geteilter Zeitraum-Zustand (Übersicht/Transaktionen) – session-persistent, kein Reset bei Seitenwechsel. */
export const usePeriodStore = create<PeriodState>((set) => ({
  type: "month",
  anchorIso: new Date().toISOString().slice(0, 10),
  setType: (type) => set({ type }),
  setAnchorIso: (anchorIso) => set({ anchorIso }),
}));
