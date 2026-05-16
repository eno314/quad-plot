import "./style.css";
import Alpine from "alpinejs";
import { getRelativeCoordinates } from "./geometry";
import { createItem } from "./item";
import { loadItems, saveItems } from "./storage";

document.addEventListener("alpine:init", () => {
	Alpine.data("quadPlot", () => ({
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
				labels: this.defaultLabels(),
			};
			return (
				this.tabs.find((t) => t.id === this.activeTabId) ||
				this.tabs[0] ||
				defaultTab
			);
		},

		defaultLabels() {
			return {
				xPositive: "(+)",
				xNegative: "(-)",
				yPositive: "(+)",
				yNegative: "(-)",
				qTopLeft: "Top Left",
				qTopRight: "Top Right",
				qBottomLeft: "Bottom Left",
				qBottomRight: "Bottom Right",
			};
		},

		init() {
			const savedTabs = loadItems("quadPlot_tabs");
			const savedActiveTabId = localStorage.getItem("quadPlot_activeTabId");

			if (savedTabs && savedTabs.length > 0) {
				this.tabs = savedTabs;
				if (
					savedActiveTabId &&
					this.tabs.some((t) => t.id === savedActiveTabId)
				) {
					this.activeTabId = savedActiveTabId;
				} else {
					this.activeTabId = this.tabs[0].id;
				}
			} else {
				// 初期タブを作成
				const newTab = {
					id: Date.now().toString(),
					name: "Map 1",
					items: [],
					labels: this.defaultLabels(),
				};
				this.tabs = [newTab];
				this.activeTabId = newTab.id;
				this.save();
			}
		},

		// データを保存するヘルパー関数
		save() {
			saveItems("quadPlot_tabs", this.tabs);
			if (this.activeTabId) {
				localStorage.setItem("quadPlot_activeTabId", this.activeTabId);
			}
		},

		// タブを追加
		addTab() {
			const newTab = {
				id: Date.now().toString(),
				name: `Map ${this.tabs.length + 1}`,
				items: [],
				labels: this.defaultLabels(),
			};
			this.tabs.push(newTab);
			this.activeTabId = newTab.id;
			this.save();
		},

		// タブ名を編集
		editTabName(id) {
			const tab = this.tabs.find((t) => t.id === id);
			if (!tab) return;
			const newName = window.prompt("タブの名前を入力してください:", tab.name);
			if (newName !== null && newName.trim() !== "") {
				tab.name = newName.trim();
				this.save();
			}
		},

		// タブを切り替え
		switchTab(id) {
			this.activeTabId = id;
			this.save();
		},

		// ラベル編集処理
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

		// アイテム詳細ダイアログを開く
		openItemDialog(item) {
			// ディープコピーを作成して編集
			this.editingItem = { ...item };
		},

		// アイテム詳細を保存
		saveItemDialog() {
			if (!this.editingItem || !this.activeTab) return;
			const index = this.activeTab.items.findIndex(
				(i) => i.id === this.editingItem.id,
			);
			if (index !== -1) {
				this.activeTab.items[index] = { ...this.editingItem };
				this.save();
			}
			this.editingItem = null;
		},

		// アイテム詳細ダイアログを閉じる
		closeItemDialog() {
			this.editingItem = null;
		},

		// アイテムを削除
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

		// ダブルクリックでアイテムを追加
		handleDblClick(e) {
			// コンテナ（背景）以外の要素（アイテムなど）をダブルクリックした場合は無視
			if (e.target !== this.$refs.container) return;

			const text = window.prompt("アイテムの名前を入力してください:");
			if (!text || text.trim() === "") return;

			// コンテナ内の相対座標を計算（モジュールを使用）
			const rect = this.$refs.container.getBoundingClientRect();
			const { x, y } = getRelativeCoordinates(e.clientX, e.clientY, rect);

			// アイテムを生成（モジュールを使用）
			const newItem = createItem(text, x, y);
			if (this.activeTab) {
				this.activeTab.items.push(newItem);
				this.save();
			}
		},

		// 3. ドラッグ＆ドロップ開始処理
		startDrag(e, id) {
			// 左クリックのみ許可
			if (e.button !== 0) return;

			this.draggingId = id;
			if (!this.activeTab) return;
			const item = this.activeTab.items.find((i) => i.id === id);
			if (!item) return;

			// ドラッグ開始時のマウス位置とアイテム位置を記録
			this.startX = e.clientX;
			this.startY = e.clientY;
			this.offsetX = item.x;
			this.offsetY = item.y;

			// ドラッグ中のマウス移動処理
			const onMouseMove = (ev) => {
				if (!this.draggingId || !this.activeTab) return;
				const dx = ev.clientX - this.startX;
				const dy = ev.clientY - this.startY;

				// 対象アイテムの座標を更新（Alpine.jsのリアクティビティで自動で画面に反映される）
				const currentItem = this.activeTab.items.find(
					(i) => i.id === this.draggingId,
				);
				if (currentItem) {
					currentItem.x = this.offsetX + dx;
					currentItem.y = this.offsetY + dy;
				}
			};

			// ドラッグ終了処理
			const onMouseUp = () => {
				if (this.draggingId) {
					// ドラッグが完了した時点で新しい座標を永続化
					this.save();
				}
				this.draggingId = null;
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("mouseup", onMouseUp);
			};

			// ウィンドウ全体でイベントをリスンする（マウスが高速に移動しても追従するため）
			window.addEventListener("mousemove", onMouseMove);
			window.addEventListener("mouseup", onMouseUp);
		},
	}));
});

// Alpine.js の起動
window.Alpine = Alpine;
Alpine.start();
