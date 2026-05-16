import "./style.css";
import Alpine from "alpinejs";
import { getRelativeCoordinates } from "./geometry";
import { createItem } from "./item";
import { loadItems, saveItems } from "./storage";

const STORAGE_KEY = "quadPlot_items";

document.addEventListener("alpine:init", () => {
	Alpine.data("quadPlot", () => ({
		items: [],
		draggingId: null,
		startX: 0,
		startY: 0,
		offsetX: 0,
		offsetY: 0,

		init() {
			// 1. ローカルストレージから初期データを復元（モジュールを使用）
			this.items = loadItems(STORAGE_KEY);
		},

		// データを保存するヘルパー関数（モジュールを使用）
		save() {
			saveItems(STORAGE_KEY, this.items);
		},

		// 2. ダブルクリックでアイテムを追加
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
			this.items.push(newItem);

			// データ変更後に保存
			this.save();
		},

		// 3. ドラッグ＆ドロップ開始処理
		startDrag(e, id) {
			// 左クリックのみ許可
			if (e.button !== 0) return;

			this.draggingId = id;
			const item = this.items.find((i) => i.id === id);
			if (!item) return;

			// ドラッグ開始時のマウス位置とアイテム位置を記録
			this.startX = e.clientX;
			this.startY = e.clientY;
			this.offsetX = item.x;
			this.offsetY = item.y;

			// ドラッグ中のマウス移動処理
			const onMouseMove = (ev) => {
				if (!this.draggingId) return;
				const dx = ev.clientX - this.startX;
				const dy = ev.clientY - this.startY;

				// 対象アイテムの座標を更新（Alpine.jsのリアクティビティで自動で画面に反映される）
				const currentItem = this.items.find((i) => i.id === this.draggingId);
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
