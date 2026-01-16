/**
 * Cards Downloader
 *
 * Downloads flashcard content from GitHub if not exists in vault.
 */

import { App, TFolder, Notice, requestUrl } from "obsidian";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/sourman-dev/obisidian-learning-cclk/main/cclk-cards";

const CARD_FILES = [
  "01-su-hinh-thanh-luc-khi.md",
  "02-tuong-sinh-tuong-khac-phan-sinh.md",
  "03-tang-phu-12.md",
  "04-kinh-mach-12.md",
  "05-bo-mach-bo-huyet.md",
  "06-huyet-ngu-du.md",
  "07-nguyen-ly-chua-benh.md",
  "08a-huyet-kinh-phe.md",
  "08b-huyet-kinh-dai-truong.md",
  "09a-huyet-kinh-tam-bao.md",
  "09b-huyet-kinh-tam-tieu.md",
  "10a-huyet-kinh-tam.md",
  "10b-huyet-kinh-tieu-truong.md",
  "11a-huyet-kinh-ty.md",
  "11b-huyet-kinh-vi.md",
  "12a-huyet-kinh-can.md",
  "12b-huyet-kinh-dom.md",
  "13a-huyet-kinh-than.md",
  "13b-huyet-kinh-bang-quang.md"
];

export class CardsDownloader {
  private app: App;
  private cardsFolder: string;

  constructor(app: App, cardsFolder: string) {
    this.app = app;
    this.cardsFolder = cardsFolder;
  }

  /**
   * Check if cards folder exists and has content
   */
  async needsDownload(): Promise<boolean> {
    const folder = this.app.vault.getAbstractFileByPath(this.cardsFolder);
    if (!folder || !(folder instanceof TFolder)) {
      return true;
    }
    // Check if folder has any .md files
    const hasCards = folder.children.some(f => f.name.endsWith(".md"));
    return !hasCards;
  }

  /**
   * Download all card files from GitHub
   */
  async downloadCards(): Promise<void> {
    const notice = new Notice("Đang tải flashcards từ GitHub...", 0);

    try {
      // Create folder if not exists
      await this.ensureFolder();

      let downloaded = 0;
      for (const fileName of CARD_FILES) {
        try {
          const url = `${GITHUB_RAW_BASE}/${fileName}`;
          const response = await requestUrl({ url });

          if (response.status === 200) {
            const filePath = `${this.cardsFolder}/${fileName}`;
            const existing = this.app.vault.getAbstractFileByPath(filePath);

            if (!existing) {
              await this.app.vault.create(filePath, response.text);
              downloaded++;
            }
          }
        } catch (e) {
          console.warn(`Failed to download ${fileName}:`, e);
        }
      }

      notice.hide();
      new Notice(`Đã tải ${downloaded} flashcard files thành công!`);
    } catch (error) {
      notice.hide();
      console.error("Failed to download cards:", error);
      new Notice("Lỗi khi tải flashcards. Vui lòng thử lại.");
    }
  }

  /**
   * Ensure cards folder exists
   */
  private async ensureFolder(): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(this.cardsFolder);
    if (!folder) {
      try {
        await this.app.vault.createFolder(this.cardsFolder);
      } catch (e) {
        // Folder may already exist
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes("already exists")) {
          throw e;
        }
      }
    }
  }
}
