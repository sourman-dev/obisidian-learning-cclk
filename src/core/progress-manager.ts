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
    try {
      const folder = this.app.vault.getAbstractFileByPath(this.dataFolder);
      if (!folder) {
        await this.app.vault.createFolder(this.dataFolder);
      }
    } catch (error: unknown) {
      // Ignore "Folder already exists" error - can happen due to race condition
      // or if folder was created externally
      const msg = error instanceof Error ? error.message : String(error);
      if (!msg.includes("already exists")) {
        throw error;
      }
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

    try {
      if (file instanceof TFile) {
        await this.app.vault.modify(file, content);
      } else {
        await this.app.vault.create(this.progressFile, content);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("already exists")) {
        // File was created between check and create, retry with modify
        const existingFile = this.app.vault.getAbstractFileByPath(this.progressFile);
        if (existingFile instanceof TFile) {
          await this.app.vault.modify(existingFile, content);
        }
      } else {
        throw error;
      }
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
