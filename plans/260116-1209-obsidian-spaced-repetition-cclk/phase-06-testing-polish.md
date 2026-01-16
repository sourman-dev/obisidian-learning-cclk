# Phase 6: Testing + Polish

**Status:** pending
**Priority:** medium

---

## Overview
Final testing, bug fixes, and polish for production-ready plugin.

## Context Links
- All previous phases
- [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)

---

## Testing Checklist

### Core Functionality

| Test | Status | Notes |
|------|--------|-------|
| Plugin loads without errors | [ ] | Check console |
| Ribbon icon appears | [ ] | |
| Sidebar opens | [ ] | |
| Topics load from cards folder | [ ] | |
| Due cards calculated correctly | [ ] | |
| Forward cards display | [ ] | Q → A |
| Reverse cards display | [ ] | A → Q |
| Matching pairs work | [ ] | Shuffle + match |
| Rating updates SM-2 state | [ ] | Check JSON |
| Progress persists | [ ] | Restart Obsidian |
| Session stats accurate | [ ] | |
| Mixed mode shuffles | [ ] | |

### Edge Cases

| Test | Status | Notes |
|------|--------|-------|
| Empty cards folder | [ ] | Should show message |
| No due cards | [ ] | Should indicate |
| Invalid frontmatter | [ ] | Should skip file |
| Large card sets (100+) | [ ] | Performance |
| Multiple matching sets | [ ] | |
| Special characters in Q/A | [ ] | Vietnamese |
| Obsidian dark/light theme | [ ] | |
| Mobile (if supported) | [ ] | |

### Error Handling

| Test | Status | Notes |
|------|--------|-------|
| Missing cards folder | [ ] | Create or warn |
| Corrupt progress.json | [ ] | Reset gracefully |
| Invalid card format | [ ] | Skip with warning |
| File deleted during session | [ ] | Handle gracefully |

---

## Performance Optimization

### Current Bottlenecks
1. Card loading on every sidebar open
2. Full progress.json read/write
3. React re-renders on state change

### Optimizations

**1. Card Caching**
```typescript
// Add to CardLoader
private lastModified: Map<string, number> = new Map();

async loadAllCards(forceRefresh = false): Promise<Card[]> {
  if (this.cache && !forceRefresh && !this.hasChanges()) {
    return this.cache;
  }
  // ... load cards
}

private hasChanges(): boolean {
  // Check file modification times
}
```

**2. Progress Debouncing**
```typescript
// Add to ProgressManager
private saveTimeout: NodeJS.Timeout | null = null;

async updateCardState(cardId: string, state: SM2CardState): Promise<void> {
  // Update cache immediately
  this.cache.cards[cardId] = state;

  // Debounce save
  if (this.saveTimeout) clearTimeout(this.saveTimeout);
  this.saveTimeout = setTimeout(() => this.save(), 500);
}
```

**3. React Optimization**
```typescript
// Use React.memo for static components
export const RatingButtons = React.memo(function RatingButtons({ onRate }) {
  // ...
});

// Use useCallback for handlers
const handleRate = useCallback((rating: SimpleQuality) => {
  rateCard(rating);
}, [rateCard]);
```

---

## Polish Items

### UI Improvements

1. **Loading states**
   - Skeleton loading for card list
   - Loading spinner for session start

2. **Empty states**
   - No cards: "Create cards in `cclk-cards/` folder"
   - No due: "All caught up! Next review: X"

3. **Animations**
   - Card flip animation
   - Progress bar smooth transition
   - Matching pair highlight

4. **Accessibility**
   - Keyboard navigation
   - Focus indicators
   - Screen reader labels

### Error Messages

```typescript
const ERROR_MESSAGES = {
  NO_CARDS_FOLDER: "Cards folder not found. Create 'cclk-cards/' in your vault.",
  NO_CARDS: "No flashcard files found. Create .md files with Q::A:: format.",
  PARSE_ERROR: "Failed to parse card file: {file}",
  SAVE_ERROR: "Failed to save progress. Check file permissions.",
};
```

---

## Settings Tab

### Implementation

```typescript
// src/settings.ts
import { App, PluginSettingTab, Setting } from "obsidian";
import CCLKPlugin from "./main";

export class CCLKSettingTab extends PluginSettingTab {
  plugin: CCLKPlugin;

  constructor(app: App, plugin: CCLKPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "CCLK Flashcards Settings" });

    new Setting(containerEl)
      .setName("Cards folder")
      .setDesc("Folder containing flashcard .md files")
      .addText((text) =>
        text
          .setPlaceholder("cclk-cards")
          .setValue(this.plugin.settings.cardsFolder)
          .onChange(async (value) => {
            this.plugin.settings.cardsFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Data folder")
      .setDesc("Folder for progress data (hidden)")
      .addText((text) =>
        text
          .setPlaceholder(".cclk-data")
          .setValue(this.plugin.settings.dataFolder)
          .onChange(async (value) => {
            this.plugin.settings.dataFolder = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Cards per session")
      .setDesc("Maximum cards per study session (0 = unlimited)")
      .addSlider((slider) =>
        slider
          .setLimits(0, 100, 5)
          .setValue(this.plugin.settings.cardsPerSession || 0)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.cardsPerSession = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show streak")
      .setDesc("Display study streak in sidebar")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showStreak ?? true)
          .onChange(async (value) => {
            this.plugin.settings.showStreak = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
```

### Register in main.ts
```typescript
import { CCLKSettingTab } from "./settings";

async onload() {
  // ... existing code
  this.addSettingTab(new CCLKSettingTab(this.app, this));
}
```

---

## Documentation

### README.md for Plugin
```markdown
# CCLK Flashcards

Spaced repetition flashcards for learning "Châm cứu lục khí".

## Features
- SM-2 algorithm for optimal review scheduling
- Forward and reverse flashcards
- Matching pairs for concept association
- Progress tracking with statistics
- Single topic and mixed review modes

## Card Format

Create `.md` files in your cards folder:

\`\`\`markdown
---
topic: Topic Name
chapter: 1
tags: [tag1, tag2]
---

## Card 1
Q:: What is the question?
A:: The answer

## Card 2 (Reverse - creates 2 cards)
Q::: Term
A::: Definition

## Matching Set
MATCH::
- Term 1 | Definition 1
- Term 2 | Definition 2
\`\`\`

## Installation
1. Download latest release
2. Extract to `.obsidian/plugins/cclk-flashcards/`
3. Enable in Settings → Community plugins
```

---

## Implementation Steps

1. [ ] Run all functionality tests
2. [ ] Run edge case tests
3. [ ] Run error handling tests
4. [ ] Implement performance optimizations
5. [ ] Add loading/empty states
6. [ ] Add settings tab
7. [ ] Create README.md
8. [ ] Final build and test
9. [ ] Create release bundle

---

## Release Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] Settings work correctly
- [ ] Light/dark theme compatible
- [ ] README complete
- [ ] manifest.json correct
- [ ] versions.json updated
- [ ] Bundle size acceptable (<500KB)

---

## Success Criteria

- [ ] Plugin stable for daily use
- [ ] No data loss scenarios
- [ ] Responsive UI (< 100ms interactions)
- [ ] Works offline
- [ ] Clear error messages
- [ ] Settings persist

---

## Post-Release

### Future Improvements (v2.0)
- [ ] Card editor UI
- [ ] Import/export progress
- [ ] Statistics dashboard
- [ ] Heatmap calendar
- [ ] Audio pronunciation
- [ ] Image cards
- [ ] Sync with Obsidian Sync
