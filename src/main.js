
const OBSIDIAN = "obsidian"; /* force dynamic evaluation */
const { Plugin, ItemView, normalizePath } = require(OBSIDIAN);

const frameSrc = require('bundle-text:./frame.html');

const VIEW_TYPE_CARDS_OF_ZEAL = "cards-of-zeal-view";

module.exports = class CardsOfZealPlugin extends Plugin {
    async onload() {
        this.registerView(
            VIEW_TYPE_CARDS_OF_ZEAL,
            (leaf) => new CardsOfZealView(leaf, this.app, this)
        );

        this.addCommand({
            id: 'open-cards-of-zeal-split',
            name: 'Open Cards of Zeal in a split view',
            callback: () => {
                this.activateView(false);
            },
        });

        this.addCommand({
            id: 'open-cards-of-zeal-right',
            name: 'Show Cards of Zeal sidebar view',
            callback: () => {
                this.activateView(true);
            },
        });
    }

    async activateView(onRightLeaf) {
        const { workspace } = this.app;

        let leaf;
        if (onRightLeaf) {
            // Check if view already exists
            const existingLeaves = workspace.getLeavesOfType(VIEW_TYPE_CARDS_OF_ZEAL);
            for (const leaf of existingLeaves) {
                if (leaf.getRoot().side === "right") {
                    workspace.revealLeaf(leaf);
                    return;
                }
            }

            // It's not there, so create it
            leaf = workspace.getRightLeaf(false);
            if (!leaf) return;
            await leaf.setViewState({
                type: VIEW_TYPE_CARDS_OF_ZEAL,
                active: true,
            });
        } else {
            leaf = this.app.workspace.splitActiveLeaf()
            if (!leaf) return;
            await leaf.setViewState({
                type: VIEW_TYPE_CARDS_OF_ZEAL,
                active: false,
            });
        }

        workspace.revealLeaf(leaf);
    }
};

class CardsOfZealView extends ItemView {
    constructor(leaf, app, plugin) {
        super(leaf);
        this.app = app;
        this.plugin = plugin;
        this.iframe = null;
    }

    getViewType() {
        return VIEW_TYPE_CARDS_OF_ZEAL;
    }

    getDisplayText() {
        return "Cards of Zeal";
    }

    getIcon() {
        return "book-check";
    }

    async onOpen() {
        this.containerEl.empty();
        this.containerEl.addClass("cards-of-zeal-container");
        if (this.containerEl.children.length === 0) {
            const iframe = document.createElement('iframe')
            iframe.style.width = "100%";
            iframe.style.height = "100%";
            iframe.style.margin = 0;
            iframe.style.padding = 0;
            iframe.srcdoc = frameSrc;
            this.containerEl.appendChild(iframe);
            this.iframe = iframe;
        }

        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
            await this.renderFile(activeFile);
        }

        this.registerEvent(
            this.app.workspace.on("active-leaf-change", async () => {
                const file = this.app.workspace.getActiveFile();
                if (file) await this.renderFile(file);
            })
        );

        this.registerEvent(
            this.app.vault.on("modify", async (file) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (activeFile && file === activeFile) {
                    await this.renderFile(file);
                }
            })
        );
    }

    async renderFile(file) {
        const content = await this.app.vault.read(file);
        const taskRegex = /^\s*[\*\-\+]\s*\[([ xX])] (.*)$/gm;
        const idRegex = /\s+#([0-9a-fA-F]+)\s*$/;
        let match;
        const tasks = [];
        while ((match = taskRegex.exec(content)) !== null) {
            let [ , status, content] = match;
                let id = null;
                const idMatch = content.match(idRegex);
                if (idMatch) {
                    id = idMatch[1]; // Capture the digits
                    content = content.replace(idRegex, '').trim(); // Remove ID from text
                }
                tasks.push({
                  id: id ? parseInt(id, 10) : null,
                  completed: status === 'x' || status === 'X',
                  text: content.trim()
                });
        }
        if (this.iframe && this.iframe.contentWindow) {
            this.iframe.contentWindow.postMessage({ type: 'update-tasks', tasks, filepath: file.path }, '*');
        }
    }

    async onClose() {
        this.containerEl.empty();
    }
}
