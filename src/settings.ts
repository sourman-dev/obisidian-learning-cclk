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
            this.plugin.settings.cardsFolder = value || "cclk-cards";
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
            this.plugin.settings.dataFolder = value || ".cclk-data";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Cards per session")
      .setDesc("Maximum cards per study session (0 = unlimited)")
      .addSlider((slider) =>
        slider
          .setLimits(0, 100, 5)
          .setValue(this.plugin.settings.cardsPerSession)
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
          .setValue(this.plugin.settings.showStreak)
          .onChange(async (value) => {
            this.plugin.settings.showStreak = value;
            await this.plugin.saveSettings();
          })
      );

    // Cards download section
    containerEl.createEl("h3", { text: "Quản lý Cards" });

    new Setting(containerEl)
      .setName("Tải cards mới")
      .setDesc("Tải các file cards chưa có trong vault từ GitHub")
      .addButton((btn) =>
        btn
          .setButtonText("Tải cards mới")
          .onClick(async () => {
            btn.setDisabled(true);
            btn.setButtonText("Đang tải...");
            await this.plugin.downloadCards(false);
            btn.setDisabled(false);
            btn.setButtonText("Tải cards mới");
          })
      );

    new Setting(containerEl)
      .setName("Cập nhật toàn bộ")
      .setDesc("Tải lại tất cả cards từ GitHub (ghi đè file hiện có)")
      .addButton((btn) =>
        btn
          .setButtonText("Cập nhật tất cả")
          .setWarning()
          .onClick(async () => {
            btn.setDisabled(true);
            btn.setButtonText("Đang cập nhật...");
            await this.plugin.downloadCards(true);
            btn.setDisabled(false);
            btn.setButtonText("Cập nhật tất cả");
          })
      );
  }
}
