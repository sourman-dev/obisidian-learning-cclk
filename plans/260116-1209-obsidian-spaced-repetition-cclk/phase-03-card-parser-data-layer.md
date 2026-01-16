# Phase 3: Card Parser + Data Layer

**Status:** completed
**Priority:** high

---

## Overview
Implement card parsing from Markdown files and progress persistence in JSON.

## Context Links
- [Brainstorm Report](reports/brainstorm-260116-1209-obsidian-spaced-repetition-plugin.md)
- [Phase 2: SM-2 Algorithm](phase-02-sm2-algorithm.md)

---

## Key Insights

### Card Markdown Format
```markdown
---
topic: Lục khí cơ bản
chapter: 1
tags: [luc-khi, co-ban]
---

## Card 1
Q:: Question here?
A:: Answer here

## Card 2 (Reverse)
Q::: Question (creates reverse card too)
A::: Answer

## Matching Set
MATCH::
- Term 1 | Definition 1
- Term 2 | Definition 2
```

### Progress JSON Format
```json
{
  "cards": {
    "topic-name::card-id": {
      "easeFactor": 2.5,
      "interval": 4,
      "repetitions": 3,
      "nextReview": "2026-01-20"
    }
  },
  "sessions": [...]
}
```

---

## Files to Create

### 1. src/types/card-types.ts
```typescript
/**
 * Card Types and Interfaces
 */

import { SM2CardState } from "./sm2-types";

/** Card display type */
export type CardType = "forward" | "reverse" | "matching";

/** Base card structure */
export interface Card {
  /** Unique ID: topic::card-number */
  id: string;
  /** Topic name from frontmatter */
  topic: string;
  /** Chapter number */
  chapter: number;
  /** Card type */
  type: CardType;
  /** Question text */
  question: string;
  /** Answer text (for forward/reverse) */
  answer?: string;
  /** Matching pairs (for matching type) */
  pairs?: MatchingPair[];
  /** Source file path */
  sourceFile: string;
  /** Tags from frontmatter */
  tags: string[];
}

/** Matching pair for matching cards */
export interface MatchingPair {
  term: string;
  definition: string;
}

/** Card with SM-2 state attached */
export interface CardWithState extends Card {
  state: SM2CardState;
}

/** Topic summary */
export interface TopicInfo {
  name: string;
  chapter: number;
  cardCount: number;
  dueCount: number;
  sourceFile: string;
}

/** Frontmatter structure */
export interface CardFrontmatter {
  topic: string;
  chapter?: number;
  tags?: string[];
}
```

### 2. src/core/card-parser.ts
```typescript
/**
 * Card Parser
 *
 * Parses Markdown files into Card objects.
 * Supports three formats: forward (Q::A::), reverse (Q:::A:::), matching (MATCH::)
 */

import { TFile, parseYaml } from "obsidian";
import { Card, CardType, MatchingPair, CardFrontmatter } from "../types/card-types";

/** Regex patterns for card parsing */
const FORWARD_PATTERN = /^Q::\s*(.+)$/m;
const ANSWER_PATTERN = /^A::\s*(.+)$/m;
const REVERSE_Q_PATTERN = /^Q:::\s*(.+)$/m;
const REVERSE_A_PATTERN = /^A:::\s*(.+)$/m;
const MATCHING_PATTERN = /^MATCH::$/m;
const MATCHING_ITEM_PATTERN = /^-\s*(.+?)\s*\|\s*(.+)$/gm;

/**
 * Extract frontmatter from markdown content
 */
export function parseFrontmatter(content: string): CardFrontmatter | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  try {
    const yaml = parseYaml(match[1]);
    return {
      topic: yaml.topic || "Unknown",
      chapter: yaml.chapter || 0,
      tags: yaml.tags || []
    };
  } catch {
    return null;
  }
}

/**
 * Parse a single card block (between ## headers)
 */
export function parseCardBlock(
  block: string,
  frontmatter: CardFrontmatter,
  sourceFile: string,
  cardIndex: number
): Card[] {
  const cards: Card[] = [];
  const baseId = `${frontmatter.topic.toLowerCase().replace(/\s+/g, "-")}::${cardIndex}`;

  // Check for matching cards first
  if (MATCHING_PATTERN.test(block)) {
    const pairs = parseMatchingPairs(block);
    if (pairs.length >= 2) {
      cards.push({
        id: `${baseId}-matching`,
        topic: frontmatter.topic,
        chapter: frontmatter.chapter || 0,
        type: "matching",
        question: "Match the following pairs:",
        pairs,
        sourceFile,
        tags: frontmatter.tags || []
      });
    }
    return cards;
  }

  // Check for reverse cards (Q:::)
  const reverseQ = block.match(REVERSE_Q_PATTERN);
  const reverseA = block.match(REVERSE_A_PATTERN);
  if (reverseQ && reverseA) {
    // Create forward card
    cards.push({
      id: `${baseId}-forward`,
      topic: frontmatter.topic,
      chapter: frontmatter.chapter || 0,
      type: "forward",
      question: reverseQ[1].trim(),
      answer: reverseA[1].trim(),
      sourceFile,
      tags: frontmatter.tags || []
    });

    // Create reverse card
    cards.push({
      id: `${baseId}-reverse`,
      topic: frontmatter.topic,
      chapter: frontmatter.chapter || 0,
      type: "reverse",
      question: reverseA[1].trim(),
      answer: reverseQ[1].trim(),
      sourceFile,
      tags: frontmatter.tags || []
    });
    return cards;
  }

  // Check for forward cards (Q::)
  const forwardQ = block.match(FORWARD_PATTERN);
  const forwardA = block.match(ANSWER_PATTERN);
  if (forwardQ && forwardA) {
    cards.push({
      id: baseId,
      topic: frontmatter.topic,
      chapter: frontmatter.chapter || 0,
      type: "forward",
      question: forwardQ[1].trim(),
      answer: forwardA[1].trim(),
      sourceFile,
      tags: frontmatter.tags || []
    });
  }

  return cards;
}

/**
 * Parse matching pairs from MATCH:: block
 */
export function parseMatchingPairs(block: string): MatchingPair[] {
  const pairs: MatchingPair[] = [];
  let match;

  // Reset regex lastIndex
  MATCHING_ITEM_PATTERN.lastIndex = 0;

  while ((match = MATCHING_ITEM_PATTERN.exec(block)) !== null) {
    pairs.push({
      term: match[1].trim(),
      definition: match[2].trim()
    });
  }

  return pairs;
}

/**
 * Parse entire markdown file into cards
 */
export function parseMarkdownFile(content: string, filePath: string): Card[] {
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    console.warn(`No frontmatter found in ${filePath}`);
    return [];
  }

  // Split by ## headers
  const blocks = content.split(/(?=^## )/m);
  const cards: Card[] = [];

  blocks.forEach((block, index) => {
    // Skip frontmatter block
    if (block.startsWith("---")) return;

    const parsedCards = parseCardBlock(block, frontmatter, filePath, index);
    cards.push(...parsedCards);
  });

  return cards;
}

/**
 * Generate unique card ID
 */
export function generateCardId(topic: string, index: number, type: CardType): string {
  const slug = topic.toLowerCase().replace(/\s+/g, "-");
  return `${slug}::${index}-${type}`;
}
```

### 3. src/core/progress-manager.ts
```typescript
/**
 * Progress Manager
 *
 * Handles reading/writing progress data to JSON file in vault.
 */

import { App, TFile } from "obsidian";
import { SM2CardState, DEFAULT_SM2_STATE } from "../types/sm2-types";
import { Card, CardWithState } from "../types/card-types";
import { SessionStats } from "./card-scheduler";

/** Progress data structure */
export interface ProgressData {
  version: number;
  lastUpdated: string;
  cards: Record<string, SM2CardState>;
  sessions: SessionRecord[];
}

/** Session record for history */
export interface SessionRecord {
  date: string;
  cardsReviewed: number;
  accuracy: number;
  topics: string[];
}

const PROGRESS_VERSION = 1;
const DEFAULT_PROGRESS: ProgressData = {
  version: PROGRESS_VERSION,
  lastUpdated: new Date().toISOString(),
  cards: {},
  sessions: []
};

/**
 * Progress Manager class
 */
export class ProgressManager {
  private app: App;
  private dataFolder: string;
  private progressFile: string;
  private cache: ProgressData | null = null;

  constructor(app: App, dataFolder: string) {
    this.app = app;
    this.dataFolder = dataFolder;
    this.progressFile = `${dataFolder}/progress.json`;
  }

  /**
   * Ensure data folder exists
   */
  async ensureDataFolder(): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(this.dataFolder);
    if (!folder) {
      await this.app.vault.createFolder(this.dataFolder);
    }
  }

  /**
   * Load progress data from file
   */
  async load(): Promise<ProgressData> {
    if (this.cache) return this.cache;

    await this.ensureDataFolder();

    const file = this.app.vault.getAbstractFileByPath(this.progressFile);
    if (!file || !(file instanceof TFile)) {
      this.cache = { ...DEFAULT_PROGRESS };
      return this.cache;
    }

    try {
      const content = await this.app.vault.read(file);
      this.cache = JSON.parse(content);
      return this.cache!;
    } catch (error) {
      console.error("Failed to load progress:", error);
      this.cache = { ...DEFAULT_PROGRESS };
      return this.cache;
    }
  }

  /**
   * Save progress data to file
   */
  async save(): Promise<void> {
    if (!this.cache) return;

    await this.ensureDataFolder();
    this.cache.lastUpdated = new Date().toISOString();

    const content = JSON.stringify(this.cache, null, 2);
    const file = this.app.vault.getAbstractFileByPath(this.progressFile);

    if (file instanceof TFile) {
      await this.app.vault.modify(file, content);
    } else {
      await this.app.vault.create(this.progressFile, content);
    }
  }

  /**
   * Get state for a specific card
   */
  async getCardState(cardId: string): Promise<SM2CardState> {
    const data = await this.load();
    return data.cards[cardId] || { ...DEFAULT_SM2_STATE };
  }

  /**
   * Update state for a specific card
   */
  async updateCardState(cardId: string, state: SM2CardState): Promise<void> {
    const data = await this.load();
    data.cards[cardId] = state;
    this.cache = data;
    await this.save();
  }

  /**
   * Attach states to cards
   */
  async attachStates(cards: Card[]): Promise<CardWithState[]> {
    const data = await this.load();

    return cards.map((card) => ({
      ...card,
      state: data.cards[card.id] || { ...DEFAULT_SM2_STATE }
    }));
  }

  /**
   * Record completed session
   */
  async recordSession(stats: SessionStats, topics: string[]): Promise<void> {
    const data = await this.load();

    data.sessions.push({
      date: new Date().toISOString(),
      cardsReviewed: stats.completed,
      accuracy: stats.accuracy,
      topics
    });

    // Keep only last 100 sessions
    if (data.sessions.length > 100) {
      data.sessions = data.sessions.slice(-100);
    }

    this.cache = data;
    await this.save();
  }

  /**
   * Get statistics summary
   */
  async getStatistics(): Promise<{
    totalCards: number;
    dueToday: number;
    reviewedToday: number;
    streak: number;
  }> {
    const data = await this.load();
    const today = new Date().toISOString().split("T")[0];

    const dueToday = Object.values(data.cards).filter(
      (state) => state.nextReview <= today
    ).length;

    const todaySessions = data.sessions.filter(
      (s) => s.date.startsWith(today)
    );
    const reviewedToday = todaySessions.reduce(
      (sum, s) => sum + s.cardsReviewed,
      0
    );

    // Calculate streak
    let streak = 0;
    const sortedDates = [...new Set(
      data.sessions.map((s) => s.date.split("T")[0])
    )].sort().reverse();

    for (let i = 0; i < sortedDates.length; i++) {
      const expected = new Date();
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().split("T")[0];

      if (sortedDates[i] === expectedStr) {
        streak++;
      } else {
        break;
      }
    }

    return {
      totalCards: Object.keys(data.cards).length,
      dueToday,
      reviewedToday,
      streak
    };
  }
}
```

### 4. src/core/card-loader.ts
```typescript
/**
 * Card Loader
 *
 * Loads and caches cards from vault markdown files.
 */

import { App, TFile, TFolder } from "obsidian";
import { Card, CardWithState, TopicInfo } from "../types/card-types";
import { parseMarkdownFile } from "./card-parser";
import { ProgressManager } from "./progress-manager";
import { isDue } from "./sm2-algorithm";

export class CardLoader {
  private app: App;
  private cardsFolder: string;
  private progressManager: ProgressManager;
  private cache: Card[] | null = null;

  constructor(app: App, cardsFolder: string, progressManager: ProgressManager) {
    this.app = app;
    this.cardsFolder = cardsFolder;
    this.progressManager = progressManager;
  }

  /**
   * Clear cache (call when files change)
   */
  clearCache(): void {
    this.cache = null;
  }

  /**
   * Load all cards from vault
   */
  async loadAllCards(): Promise<Card[]> {
    if (this.cache) return this.cache;

    const folder = this.app.vault.getAbstractFileByPath(this.cardsFolder);
    if (!folder || !(folder instanceof TFolder)) {
      console.warn(`Cards folder not found: ${this.cardsFolder}`);
      return [];
    }

    const cards: Card[] = [];

    for (const file of folder.children) {
      if (file instanceof TFile && file.extension === "md") {
        const content = await this.app.vault.read(file);
        const fileCards = parseMarkdownFile(content, file.path);
        cards.push(...fileCards);
      }
    }

    this.cache = cards;
    return cards;
  }

  /**
   * Load cards with SM-2 state attached
   */
  async loadCardsWithState(): Promise<CardWithState[]> {
    const cards = await this.loadAllCards();
    return this.progressManager.attachStates(cards);
  }

  /**
   * Get unique topics from loaded cards
   */
  async getTopics(): Promise<TopicInfo[]> {
    const cards = await this.loadCardsWithState();
    const topicMap = new Map<string, TopicInfo>();

    for (const card of cards) {
      const existing = topicMap.get(card.topic);
      const isDueNow = isDue(card.state);

      if (existing) {
        existing.cardCount++;
        if (isDueNow) existing.dueCount++;
      } else {
        topicMap.set(card.topic, {
          name: card.topic,
          chapter: card.chapter,
          cardCount: 1,
          dueCount: isDueNow ? 1 : 0,
          sourceFile: card.sourceFile
        });
      }
    }

    return Array.from(topicMap.values()).sort((a, b) => a.chapter - b.chapter);
  }

  /**
   * Get cards filtered by topics
   */
  async getCardsByTopics(topics: string[]): Promise<CardWithState[]> {
    const cards = await this.loadCardsWithState();

    if (topics.length === 0) return cards;
    return cards.filter((card) => topics.includes(card.topic));
  }
}
```

### 5. src/utils/file-utils.ts
```typescript
/**
 * File Utilities
 */

import { App, TFile, TFolder } from "obsidian";

/**
 * Check if folder exists
 */
export async function folderExists(app: App, path: string): Promise<boolean> {
  const folder = app.vault.getAbstractFileByPath(path);
  return folder instanceof TFolder;
}

/**
 * Ensure folder exists (create if not)
 */
export async function ensureFolder(app: App, path: string): Promise<void> {
  if (!(await folderExists(app, path))) {
    await app.vault.createFolder(path);
  }
}

/**
 * Get all markdown files in folder
 */
export function getMarkdownFiles(app: App, folderPath: string): TFile[] {
  const folder = app.vault.getAbstractFileByPath(folderPath);
  if (!folder || !(folder instanceof TFolder)) return [];

  return folder.children.filter(
    (f): f is TFile => f instanceof TFile && f.extension === "md"
  );
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(content: string, fallback: T): T {
  try {
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}
```

---

## Implementation Steps

1. [x] Create src/types/card-types.ts
2. [x] Create src/core/card-parser.ts
3. [x] Create src/core/progress-manager.ts
4. [x] Create src/core/card-loader.ts
5. [x] Create src/utils/file-utils.ts
6. [ ] Create sample card file for testing
7. [x] Build and verify parsing works

---

## Sample Card File (for testing)

Create `cclk-cards/00-test-cards.md`:
```markdown
---
topic: Test Topic
chapter: 0
tags: [test]
---

# Test Cards

## Card 1
Q:: What is the capital of Vietnam?
A:: Hanoi

## Card 2 (Reverse)
Q::: Kim is which element?
A::: Metal

## Matching Set
MATCH::
- Wood | Liver
- Fire | Heart
- Earth | Spleen
- Metal | Lung
- Water | Kidney
```

---

## Success Criteria

- [ ] Frontmatter parsed correctly
- [ ] Forward cards (Q::A::) parsed
- [ ] Reverse cards (Q:::A:::) create 2 cards
- [ ] Matching pairs parsed correctly
- [ ] Progress saved to JSON file
- [ ] Progress loads on restart
- [ ] Cards with states load correctly

---

## Next Phase
→ [Phase 4: React UI Components](phase-04-react-ui-components.md)
