# Research Report: Obsidian Plugin Development with React + TypeScript

**Date:** 2026-01-16
**Researcher:** ab0ed04
**Topic:** Obsidian plugin development with React integration

---

## Executive Summary

Obsidian plugin development uses TypeScript + esbuild by default. React integration requires custom configuration as official sample plugin doesn't include React. Key findings:

- **Official repo**: [obsidianmd/obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- **Build tool**: esbuild (not Rollup)
- **View system**: ItemView + WorkspaceLeaf pattern
- **React**: Manual integration required (not default)
- **State**: Plugin class properties or React state libraries

---

## 1. Official Sample Plugin Structure

### Repository Layout
```
obsidian-sample-plugin/
├── src/
│   └── main.ts              # Plugin entry point
├── esbuild.config.mjs       # Build configuration
├── manifest.json            # Plugin metadata
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── styles.css               # Plugin styles
└── versions.json            # API compatibility
```

### Key Files

**manifest.json**
- Plugin metadata (id, name, version, minAppVersion)
- Required for Obsidian to load plugin

**main.ts**
- Plugin class extending `Plugin`
- Lifecycle methods: `onload()`, `onunload()`
- Register commands, views, settings

**esbuild.config.mjs**
- Entry: `src/main.ts`
- Output: `main.js` (CommonJS)
- Target: ES2018
- Externals: `obsidian`, `electron`, CodeMirror, Lezer
- Watch mode for development

### Development Workflow
```bash
npm install                 # Install dependencies
npm run dev                 # Watch mode compilation
# Copy main.js, manifest.json, styles.css to:
# {vault}/.obsidian/plugins/{plugin-id}/
# Reload Obsidian
```

---

## 2. React Integration Patterns

### Challenge: No Official React Support
Official sample uses vanilla TypeScript. React requires manual setup.

### Required Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "esbuild": "^0.25.5"
  }
}
```

### esbuild Configuration for React

**Add to esbuild.config.mjs:**
```javascript
import esbuild from "esbuild";

const production = process.env.NODE_ENV === "production";

esbuild.build({
  entryPoints: ["src/main.tsx"],      // Change to .tsx
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/*",
    "@lezer/*"
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",

  // React-specific configuration
  loader: {
    ".tsx": "tsx",
    ".ts": "ts"
  },
  jsx: "automatic",                    // React 18 JSX transform
  jsxImportSource: "react",            // Optional: explicit source

  minify: production,
  watch: !production && {
    onRebuild(error, result) {
      console.log(error || "Build succeeded");
    }
  }
}).catch(() => process.exit(1));
```

### tsconfig.json for React
```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "lib": ["ES2018", "DOM"],
    "jsx": "react-jsx",                 // React 18 transform
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"]
}
```

---

## 3. ItemView + WorkspaceLeaf Implementation

### Core API Classes

**Plugin Class**
```typescript
abstract class Plugin extends Component {
  app: App;
  manifest: PluginManifest;

  // View registration
  registerView(type: string, viewCreator: ViewCreator): void;

  // Lifecycle
  onload(): Promise<void>;
  onunload(): Promise<void>;

  // Commands, ribbons, settings
  addCommand(command: Command): Command;
  addRibbonIcon(...): HTMLElement;
  addSettingTab(settingTab: PluginSettingTab): void;

  // Data persistence
  loadData(): Promise<any>;
  saveData(data: any): Promise<void>;
}
```

**ItemView Class**
```typescript
abstract class ItemView extends View {
  // Container for view content
  contentEl: HTMLElement;

  // View metadata
  abstract getViewType(): string;
  abstract getDisplayText(): string;

  // Lifecycle
  onOpen(): Promise<void>;
  onClose(): Promise<void>;

  // Actions (toolbar icons)
  addAction(icon: IconName, title: string, callback: Function): HTMLElement;
}
```

**WorkspaceLeaf**
```typescript
class WorkspaceLeaf {
  view: View;

  open(view: View): Promise<void>;
  setViewState(viewState: ViewState, eState?: any): Promise<void>;
  getViewState(): ViewState;

  detach(): void;
}
```

### React + ItemView Pattern

**Step 1: Create React Component**
```typescript
// src/components/MyView.tsx
import React, { useState, useEffect } from 'react';
import { App } from 'obsidian';

interface MyViewProps {
  app: App;
}

export const MyViewComponent: React.FC<MyViewProps> = ({ app }) => {
  const [data, setData] = useState<string>('');

  useEffect(() => {
    // Access Obsidian API
    const files = app.vault.getMarkdownFiles();
    setData(`Found ${files.length} files`);
  }, [app]);

  return (
    <div className="my-view-container">
      <h2>My Custom View</h2>
      <p>{data}</p>
    </div>
  );
};
```

**Step 2: Create ItemView Wrapper**
```typescript
// src/views/MyItemView.ts
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import { MyViewComponent } from '../components/MyView';

export const VIEW_TYPE_MY_VIEW = "my-view-type";

export class MyItemView extends ItemView {
  private root: Root | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_MY_VIEW;
  }

  getDisplayText(): string {
    return "My View";
  }

  getIcon(): string {
    return "dice";  // Lucide icon name
  }

  async onOpen(): Promise<void> {
    // Create React root
    this.root = createRoot(this.contentEl);

    // Render React component
    this.root.render(
      <MyViewComponent app={this.app} />
    );
  }

  async onClose(): Promise<void> {
    // Cleanup React
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
```

**Step 3: Register View in Plugin**
```typescript
// src/main.ts
import { Plugin } from 'obsidian';
import { MyItemView, VIEW_TYPE_MY_VIEW } from './views/MyItemView';

export default class MyPlugin extends Plugin {
  async onload() {
    // Register view type
    this.registerView(
      VIEW_TYPE_MY_VIEW,
      (leaf) => new MyItemView(leaf)
    );

    // Add command to open view
    this.addCommand({
      id: 'open-my-view',
      name: 'Open My View',
      callback: () => this.activateView()
    });

    // Add ribbon icon
    this.addRibbonIcon('dice', 'Open My View', () => {
      this.activateView();
    });
  }

  async activateView() {
    const { workspace } = this.app;

    // Check if view already exists
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_MY_VIEW)[0];

    if (!leaf) {
      // Create new leaf in right sidebar
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({
        type: VIEW_TYPE_MY_VIEW,
        active: true
      });
    }

    // Reveal the leaf
    workspace.revealLeaf(leaf);
  }

  onunload() {
    // Cleanup handled by ItemView.onClose()
  }
}
```

### Sidebar Panel Positioning

**Right sidebar (default):**
```typescript
leaf = workspace.getRightLeaf(false);
```

**Left sidebar:**
```typescript
leaf = workspace.getLeftLeaf(false);
```

**New tab in main area:**
```typescript
leaf = workspace.getLeaf('tab');
```

**Split current leaf:**
```typescript
leaf = workspace.getLeaf('split');
```

---

## 4. State Management Best Practices

### Option 1: Plugin Class Properties
**Simplest for small plugins**

```typescript
export default class MyPlugin extends Plugin {
  settings: MySettings;
  sharedState: any;

  async onload() {
    await this.loadSettings();

    // Pass plugin instance to views
    this.registerView(VIEW_TYPE, (leaf) =>
      new MyView(leaf, this)
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

### Option 2: React Context
**Good for component trees**

```typescript
// src/context/AppContext.tsx
import React, { createContext, useContext } from 'react';
import { App } from 'obsidian';
import MyPlugin from '../main';

interface AppContextType {
  app: App;
  plugin: MyPlugin;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{
  app: App;
  plugin: MyPlugin;
  children: React.ReactNode;
}> = ({ app, plugin, children }) => {
  return (
    <AppContext.Provider value={{ app, plugin }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be within AppProvider');
  return context;
};
```

**Usage:**
```typescript
// In ItemView
this.root.render(
  <AppProvider app={this.app} plugin={this.plugin}>
    <MyViewComponent />
  </AppProvider>
);

// In component
const { app, plugin } = useApp();
```

### Option 3: Zustand (Recommended for Complex State)
**Best for multi-view state synchronization**

```typescript
// src/store/useStore.ts
import { create } from 'zustand';

interface State {
  count: number;
  files: TFile[];
  increment: () => void;
  setFiles: (files: TFile[]) => void;
}

export const useStore = create<State>((set) => ({
  count: 0,
  files: [],
  increment: () => set((state) => ({ count: state.count + 1 })),
  setFiles: (files) => set({ files })
}));
```

**Dependencies:**
```json
{
  "dependencies": {
    "zustand": "^4.4.0"
  }
}
```

### Option 4: Jotai (Atomic State)
**Good for granular updates**

```typescript
// src/atoms/index.ts
import { atom } from 'jotai';

export const countAtom = atom(0);
export const filesAtom = atom<TFile[]>([]);
```

---

## 5. Build Configuration Deep Dive

### Standard esbuild Config (No React)
```javascript
import esbuild from "esbuild";
import { builtinModules } from "module";

const production = process.env.NODE_ENV === "production";

esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    ...builtinModules
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  minify: production
}).catch(() => process.exit(1));
```

### Enhanced Config for React
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

  // React configuration
  loader: {
    ".tsx": "tsx",
    ".ts": "ts",
    ".css": "css"
  },
  jsx: "automatic",

  // Production optimizations
  minify: production,
  drop: production ? ["console", "debugger"] : [],

  // CSS handling
  banner: {
    js: "/* Obsidian Plugin - Built with React */",
  }
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
  console.log("Watching for changes...");
}
```

### Alternative: Rollup Config
**Less common, but supported**

```javascript
// rollup.config.mjs
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

export default {
  input: 'src/main.tsx',
  output: {
    file: 'main.js',
    format: 'cjs',
    exports: 'default'
  },
  external: ['obsidian', 'electron', '@codemirror/*'],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      preventAssignment: true
    }),
    typescript({
      jsx: 'react-jsx'
    }),
    resolve({
      browser: false,
      preferBuiltins: true
    }),
    commonjs()
  ]
};
```

**Note:** esbuild is faster and preferred for Obsidian plugins.

---

## 6. Code Patterns & Best Practices

### Plugin Lifecycle Pattern
```typescript
export default class MyPlugin extends Plugin {
  settings: MySettings;
  private views: Set<MyItemView> = new Set();

  async onload() {
    console.log('Loading plugin');

    // 1. Load settings
    await this.loadSettings();

    // 2. Register views
    this.registerView(VIEW_TYPE, (leaf) => {
      const view = new MyItemView(leaf, this);
      this.views.add(view);
      return view;
    });

    // 3. Add commands
    this.addCommand({
      id: 'open-view',
      name: 'Open View',
      callback: () => this.activateView()
    });

    // 4. Add settings tab
    this.addSettingTab(new MySettingTab(this.app, this));

    // 5. Register events
    this.registerEvent(
      this.app.workspace.on('file-open', this.onFileOpen.bind(this))
    );
  }

  onunload() {
    console.log('Unloading plugin');
    // Cleanup handled automatically by Obsidian
    // Views call onClose(), registered events are removed
  }

  private onFileOpen(file: TFile | null) {
    // React to file changes
    this.views.forEach(view => view.updateFile(file));
  }
}
```

### Error Handling
```typescript
async onOpen() {
  try {
    this.root = createRoot(this.contentEl);
    this.root.render(<MyViewComponent app={this.app} />);
  } catch (error) {
    console.error('Failed to render view:', error);
    this.contentEl.createEl('div', {
      text: 'Failed to load view',
      cls: 'error-message'
    });
  }
}
```

### Hot Reload Support
```typescript
// In development, cleanup previous instances
if (module.hot) {
  module.hot.accept();
  module.hot.dispose(() => {
    console.log('Hot reload: disposing');
  });
}
```

### Styling Best Practices

**styles.css:**
```css
/* Scope all styles to your plugin */
.my-plugin-view {
  padding: 1rem;
}

/* Use CSS variables from Obsidian theme */
.my-plugin-view {
  background-color: var(--background-primary);
  color: var(--text-normal);
}

/* Support dark/light themes automatically */
body.theme-dark .my-plugin-view {
  /* Dark theme overrides if needed */
}
```

**React inline styles:**
```typescript
const styles = {
  container: {
    backgroundColor: 'var(--background-primary)',
    padding: '1rem'
  }
};

<div style={styles.container}>Content</div>
```

---

## 7. File Organization

### Recommended Structure
```
src/
├── main.tsx                    # Plugin entry point
├── types.ts                    # TypeScript types
├── constants.ts                # Constants
├── components/                 # React components
│   ├── MyView.tsx
│   ├── Sidebar.tsx
│   └── Settings.tsx
├── views/                      # Obsidian ItemView wrappers
│   ├── MyItemView.ts
│   └── index.ts
├── context/                    # React context
│   └── AppContext.tsx
├── store/                      # State management
│   └── useStore.ts
├── utils/                      # Utilities
│   └── helpers.ts
└── styles/                     # Component styles
    └── components.css
```

### Import Aliases (tsconfig.json)
```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@components/*": ["components/*"],
      "@views/*": ["views/*"],
      "@utils/*": ["utils/*"]
    }
  }
}
```

---

## 8. Testing & Debugging

### Development Setup
```bash
# Terminal 1: Watch mode
npm run dev

# Terminal 2: Copy to vault (create script)
npm run copy-dev

# Obsidian: Ctrl+Shift+I (DevTools)
```

### package.json scripts
```json
{
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "NODE_ENV=production node esbuild.config.mjs",
    "copy-dev": "cp main.js manifest.json styles.css /path/to/vault/.obsidian/plugins/my-plugin/",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

### Debugging Tips
- Use Chrome DevTools in Obsidian (Ctrl+Shift+I)
- `console.log()` works normally
- React DevTools not available (desktop app limitation)
- Use `debugger` statements
- Check Obsidian console for API errors

---

## Key Takeaways

### ✅ Do
- Use esbuild with `jsx: "automatic"` for React
- Extend ItemView for sidebar panels
- Register views in `onload()`
- Cleanup React roots in `onClose()`
- Use Obsidian CSS variables for theming
- Pass `app` instance to React components
- Store state in Plugin class or external store

### ❌ Don't
- Don't bundle Obsidian API (`external: ["obsidian"]`)
- Don't use React Router (WorkspaceLeaf handles navigation)
- Don't forget to unmount React roots
- Don't assume DOM availability in `constructor`
- Don't hardcode colors (breaks themes)
- Don't use CRA or Vite (esbuild required)

### 🎯 Best Practices
- Keep views lightweight (lazy load heavy components)
- Use WorkspaceLeaf for panel management
- Leverage Obsidian events for reactivity
- Follow Obsidian naming conventions
- Test in both light/dark themes
- Support mobile (avoid hover-only interactions)

---

## Unresolved Questions

1. **React 19 compatibility** - Not tested yet, React 18 recommended
2. **Server components** - Not applicable (desktop app)
3. **Performance benchmarks** - No official data on React overhead in Obsidian
4. **CSS-in-JS libraries** - Compatibility with styled-components/emotion unclear
5. **React DevTools** - Cannot inject into Electron app easily
6. **Hot module replacement** - Limited support, requires manual reload
7. **Mobile plugin support** - React bundle size impact on mobile unclear

---

## References

- [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
- [Obsidian API Repository](https://github.com/obsidianmd/obsidian-api)
- [Obsidian Developer Docs](https://docs.obsidian.md)

---

**Report End**
