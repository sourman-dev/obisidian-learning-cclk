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
