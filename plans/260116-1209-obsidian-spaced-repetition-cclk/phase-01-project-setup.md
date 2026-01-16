# Phase 1: Project Setup

**Status:** completed
**Priority:** high

---

## Overview
Initialize Obsidian plugin boilerplate with React + TypeScript + esbuild.

## Context Links
- [Research: Obsidian React Plugin](research/researcher-260116-1309-obsidian-react-plugin.md)
- [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)

---

## Requirements

### Functional
- Plugin loads in Obsidian
- Ribbon icon opens sidebar
- Basic sidebar panel renders

### Non-functional
- Build completes < 3s
- Bundle size < 500KB
- TypeScript strict mode

---

## Files to Create

### 1. package.json
```json
{
  "name": "obsidian-cclk-flashcards",
  "version": "1.0.0",
  "description": "Spaced repetition flashcards for CCLK learning",
  "main": "main.js",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "NODE_ENV=production node esbuild.config.mjs",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "esbuild": "^0.25.5",
    "obsidian": "latest",
    "typescript": "^5.4.0"
  }
}
```

### 2. manifest.json
```json
{
  "id": "cclk-flashcards",
  "name": "CCLK Flashcards",
  "version": "1.0.0",
  "minAppVersion": "1.4.0",
  "description": "Spaced repetition flashcards for Châm cứu lục khí",
  "author": "User",
  "isDesktopOnly": false
}
```

### 3. tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "lib": ["ES2018", "DOM"],
    "jsx": "react-jsx",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"],
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

### 4. esbuild.config.mjs
```javascript
import esbuild from "esbuild";
import { builtinModules } from "module";

const production = process.env.NODE_ENV === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "@lezer/*",
    ...builtinModules
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  loader: {
    ".tsx": "tsx",
    ".ts": "ts"
  },
  jsx: "automatic",
  minify: production,
  drop: production ? ["console", "debugger"] : []
});

if (production) {
  await context.rebuild();
  await context.dispose();
  console.log("Build complete");
} else {
  await context.watch();
  console.log("Watching for changes...");
}
```

### 5. src/main.tsx
```typescript
import { Plugin } from "obsidian";
import { CCLKSidebarView, VIEW_TYPE_CCLK } from "./views/sidebar-view";

interface CCLKSettings {
  cardsFolder: string;
  dataFolder: string;
}

const DEFAULT_SETTINGS: CCLKSettings = {
  cardsFolder: "cclk-cards",
  dataFolder: ".cclk-data"
};

export default class CCLKPlugin extends Plugin {
  settings: CCLKSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    // Register sidebar view
    this.registerView(
      VIEW_TYPE_CCLK,
      (leaf) => new CCLKSidebarView(leaf, this)
    );

    // Ribbon icon
    this.addRibbonIcon("layers", "CCLK Flashcards", () => {
      this.activateView();
    });

    // Command
    this.addCommand({
      id: "open-cclk-flashcards",
      name: "Open CCLK Flashcards",
      callback: () => this.activateView()
    });
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_CCLK)[0];

    if (!leaf) {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        await rightLeaf.setViewState({
          type: VIEW_TYPE_CCLK,
          active: true
        });
        leaf = rightLeaf;
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

### 6. src/views/sidebar-view.tsx
```typescript
import { ItemView, WorkspaceLeaf } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import CCLKPlugin from "../main";
import { SidebarApp } from "../components/sidebar-app";
import { AppProvider } from "../context/app-context";

export const VIEW_TYPE_CCLK = "cclk-flashcards-view";

export class CCLKSidebarView extends ItemView {
  private root: Root | null = null;
  plugin: CCLKPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: CCLKPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_CCLK;
  }

  getDisplayText(): string {
    return "CCLK Flashcards";
  }

  getIcon(): string {
    return "layers";
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.contentEl);
    this.root.render(
      <AppProvider app={this.app} plugin={this.plugin}>
        <SidebarApp />
      </AppProvider>
    );
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
```

### 7. src/context/app-context.tsx
```typescript
import { createContext, useContext, ReactNode } from "react";
import { App } from "obsidian";
import CCLKPlugin from "../main";

interface AppContextType {
  app: App;
  plugin: CCLKPlugin;
}

const AppContext = createContext<AppContextType | null>(null);

interface AppProviderProps {
  app: App;
  plugin: CCLKPlugin;
  children: ReactNode;
}

export function AppProvider({ app, plugin, children }: AppProviderProps) {
  return (
    <AppContext.Provider value={{ app, plugin }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
```

### 8. src/components/sidebar-app.tsx
```typescript
import { useAppContext } from "../context/app-context";

export function SidebarApp() {
  const { app } = useAppContext();
  const files = app.vault.getMarkdownFiles();

  return (
    <div className="cclk-sidebar">
      <h2>CCLK Flashcards</h2>
      <p>Found {files.length} markdown files</p>
      <button className="mod-cta">Start Session</button>
    </div>
  );
}
```

### 9. styles.css
```css
.cclk-sidebar {
  padding: 1rem;
}

.cclk-sidebar h2 {
  margin-bottom: 1rem;
  color: var(--text-accent);
}

.cclk-sidebar button {
  width: 100%;
  margin-top: 1rem;
}
```

---

## Implementation Steps

1. [x] Create project root files (package.json, manifest.json, tsconfig.json)
2. [x] Create esbuild.config.mjs
3. [x] Create src/main.tsx plugin entry
4. [x] Create src/context/app-context.tsx
5. [x] Create src/views/sidebar-view.tsx
6. [x] Create src/components/sidebar-app.tsx
7. [x] Create styles.css
8. [x] Run `npm install`
9. [x] Run `npm run build`
10. [ ] Copy to Obsidian vault and test

---

## Success Criteria

- [x] `npm run build` succeeds without errors
- [ ] Plugin appears in Obsidian community plugins
- [ ] Ribbon icon visible
- [ ] Clicking icon opens sidebar panel
- [ ] Sidebar shows markdown file count

---

## Next Phase
→ [Phase 2: SM-2 Algorithm](phase-02-sm2-algorithm.md)
