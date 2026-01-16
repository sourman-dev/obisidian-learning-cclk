import { Plugin } from "obsidian";
import { CCLKSidebarView, VIEW_TYPE_CCLK } from "./views/sidebar-view";
import { CCLKSettingTab } from "./settings";
import { CardsDownloader } from "./core/cards-downloader";

export interface CCLKSettings {
  cardsFolder: string;
  dataFolder: string;
  cardsPerSession: number;
  showStreak: boolean;
}

const DEFAULT_SETTINGS: CCLKSettings = {
  cardsFolder: "cclk-cards",
  dataFolder: ".cclk-data",
  cardsPerSession: 0,
  showStreak: true
};

export default class CCLKPlugin extends Plugin {
  settings: CCLKSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    // Check and download cards if needed
    await this.ensureCardsExist();

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

    // Settings tab
    this.addSettingTab(new CCLKSettingTab(this.app, this));
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

  /**
   * Check if cards exist, download from GitHub if not
   */
  async ensureCardsExist(): Promise<void> {
    const downloader = new CardsDownloader(this.app, this.settings.cardsFolder);
    if (await downloader.needsDownload()) {
      await downloader.downloadCards();
    }
  }
}
