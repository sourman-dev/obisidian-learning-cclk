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
