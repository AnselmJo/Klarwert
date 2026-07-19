import { create } from "zustand";

interface UiState {
  /** Vom Onboarding (Schritt 3) gesetzt; die Vermögen-Seite öffnet daraufhin einmalig Modal 5.1. */
  pendingOpenCreateAsset: boolean;
  requestOpenCreateAsset: () => void;
  consumeOpenCreateAssetRequest: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  pendingOpenCreateAsset: false,
  requestOpenCreateAsset: () => set({ pendingOpenCreateAsset: true }),
  consumeOpenCreateAssetRequest: () => set({ pendingOpenCreateAsset: false }),
}));
