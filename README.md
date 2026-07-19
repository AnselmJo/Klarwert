# Klarwert

Lokale, private Haushalts-Finanz-App (Desktop, kein Login, keine Cloud). Tauri 2 + React 18 + TypeScript + SQLite.

- **Setup-Anleitung für nicht-technische Nutzer:** siehe [ANLEITUNG.md](./ANLEITUNG.md)
- **Produktdokumentation & Spezifikation:** siehe `start_info/`

## Entwicklung

```
npm install
npm run tauri dev      # Entwicklungsmodus mit Hot-Reload
npm run tauri build     # Produktions-Build (.app/.dmg unter src-tauri/target/release/bundle/)
```

## Stack

Tauri 2 · React 18 · TypeScript (strict) · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Zustand · SQLite (`@tauri-apps/plugin-sql`) · ECharts · PapaParse/SheetJS

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
