import { getRelativeCoordinates } from "./geometry";
import { createItem } from "./item";
import {
	createNewTab,
	getDefaultLabels,
	resolveInitialState,
	sanitizeFilename,
	validateImportedData,
} from "./state";
import { loadItems, saveItems } from "./storage";

export function quadPlotApp() {
	return {
		tabs: [],
		activeTabId: null,
		draggingId: null,
		startX: 0,
		startY: 0,
		offsetX: 0,
		offsetY: 0,
		editingItem: null,

		get activeTab() {
			const defaultTab = {
				id: "temp",
				name: "",
				items: [],
				labels: getDefaultLabels(),
			};
			return (
				this.tabs.find((t) => t.id === this.activeTabId) ||
				this.tabs[0] ||
				defaultTab
			);
		},

		init() {
			const savedTabs = loadItems("quadPlot_tabs");
			const savedActiveTabId = localStorage.getItem("quadPlot_activeTabId");
			const { tabs, activeTabId } = resolveInitialState(
				savedTabs,
				savedActiveTabId,
			);
			this.tabs = tabs;
			this.activeTabId = activeTabId;
			this.save();
		},

		save() {
			saveItems("quadPlot_tabs", this.tabs);
			if (this.activeTabId) {
				localStorage.setItem("quadPlot_activeTabId", this.activeTabId);
			}
		},

		addTab() {
			const newTab = createNewTab(this.tabs.length);
			this.tabs.push(newTab);
			this.activeTabId = newTab.id;
			this.save();
		},

		editTabName(id) {
			const tab = this.tabs.find((t) => t.id === id);
			if (!tab) return;
			const newName = window.prompt("タブの名前を入力してください:", tab.name);
			if (newName !== null && newName.trim() !== "") {
				tab.name = newName.trim();
				this.save();
			}
		},

		switchTab(id) {
			this.activeTabId = id;
			this.save();
		},

		async exportData() {
			const data = {
				tabs: this.tabs,
				activeTabId: this.activeTabId,
				version: 1,
				exportedAt: new Date().toISOString(),
			};
			const jsonStr = JSON.stringify(data, null, 2);
			const defaultFilename = `quadplot_data_${data.exportedAt.replace(/[:.]/g, "-")}.json`;

			const promptResult = window.prompt(
				"エクスポートするファイル名を入力してください:",
				defaultFilename,
			);
			const filename = sanitizeFilename(promptResult, defaultFilename);
			if (!filename) return; // キャンセル

			const file = new File([jsonStr], filename, { type: "application/json" });

			const fallbackDownload = (f) => {
				const url = URL.createObjectURL(f);
				const a = document.createElement("a");
				a.href = url;
				a.download = f.name;
				a.click();
				URL.revokeObjectURL(url);
			};

			if (
				navigator.share &&
				navigator.canShare &&
				navigator.canShare?.({ files: [file] })
			) {
				try {
					await navigator.share({
						files: [file],
						title: "QuadPlot Data",
						text: "QuadPlotのデータファイルです。",
					});
				} catch (err) {
					if (err.name !== "AbortError") {
						console.error("共有に失敗しました:", err);
						fallbackDownload(file);
					}
				}
			} else {
				fallbackDownload(file);
			}
		},

		importData(event) {
			const file = event.target.files?.[0];
			if (!file) return;

			if (
				!window.confirm(
					"現在のデータはすべて上書きされ、元に戻すことはできません。インポートを実行しますか？",
				)
			) {
				event.target.value = "";
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				try {
					const data = JSON.parse(e.target.result);
					const validation = validateImportedData(data);
					if (!validation.isValid) {
						alert(validation.error);
						return;
					}
					this.tabs = validation.tabs;
					this.activeTabId = validation.activeTabId;
					this.save();
					alert("データのインポートが完了しました。");
				} catch (err) {
					console.error(err);
					alert("JSONファイルの読み込みに失敗しました。");
				} finally {
					event.target.value = "";
				}
			};
			reader.readAsText(file);
		},

		editLabel(key) {
			if (!this.activeTab) return;
			const newText = window.prompt(
				"新しいラベルを入力してください:",
				this.activeTab.labels[key],
			);
			if (newText !== null && newText.trim() !== "") {
				this.activeTab.labels[key] = newText.trim();
				this.save();
			}
		},

		openItemDialog(item) {
			this.editingItem = { ...item };
		},

		saveItemDialog() {
			if (!this.editingItem || !this.activeTab) return;
			if (!this.editingItem.text || this.editingItem.text.trim() === "") {
				alert("名前を入力してください。");
				return;
			}
			this.editingItem.text = this.editingItem.text.trim();

			if (this.editingItem.isNew) {
				delete this.editingItem.isNew;
				this.activeTab.items.push({ ...this.editingItem });
				this.save();
			} else {
				const index = this.activeTab.items.findIndex(
					(i) => i.id === this.editingItem.id,
				);
				if (index !== -1) {
					this.activeTab.items[index] = { ...this.editingItem };
					this.save();
				}
			}
			this.editingItem = null;
		},

		closeItemDialog() {
			this.editingItem = null;
		},

		deleteItem() {
			if (!this.editingItem || !this.activeTab) return;
			if (window.confirm("このアイテムを削除してもよろしいですか？")) {
				this.activeTab.items = this.activeTab.items.filter(
					(i) => i.id !== this.editingItem.id,
				);
				this.save();
				this.editingItem = null;
			}
		},

		handleDblClick(e) {
			if (e.target !== this.$refs.container) return;

			const rect = this.$refs.container.getBoundingClientRect();
			const { x, y } = getRelativeCoordinates(e.clientX, e.clientY, rect);

			const newItem = createItem("", x, y);
			this.editingItem = { ...newItem, isNew: true };
		},

		startDrag(e, id) {
			if (e.button !== 0) return;

			this.draggingId = id;
			if (!this.activeTab) return;
			const item = this.activeTab.items.find((i) => i.id === id);
			if (!item) return;

			this.startX = e.clientX;
			this.startY = e.clientY;
			this.offsetX = item.x;
			this.offsetY = item.y;

			const onMouseMove = (ev) => {
				if (!this.draggingId || !this.activeTab) return;
				const dx = ev.clientX - this.startX;
				const dy = ev.clientY - this.startY;

				const currentItem = this.activeTab.items.find(
					(i) => i.id === this.draggingId,
				);
				if (currentItem) {
					currentItem.x = this.offsetX + dx;
					currentItem.y = this.offsetY + dy;
				}
			};

			const onMouseUp = () => {
				if (this.draggingId) {
					this.save();
				}
				this.draggingId = null;
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("mouseup", onMouseUp);
			};

			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
		},
	};
}
