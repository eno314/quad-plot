import { beforeEach, describe, expect, it, mock } from "bun:test";
import { quadPlotApp } from "../../src/app";

// Bunのテスト環境にはlocalStorageが存在しない場合があるためモック化する
const mockStorage = {};
globalThis.localStorage = {
	getItem: (key) => mockStorage[key] || null,
	setItem: (key, val) => {
		mockStorage[key] = String(val);
	},
	removeItem: (key) => {
		delete mockStorage[key];
	},
	clear: () => {
		for (const key in mockStorage) {
			delete mockStorage[key];
		}
	},
};

describe("app.js", () => {
	beforeEach(() => {
		localStorage.clear();
		globalThis.alert = mock();
		globalThis.console.error = mock();
		globalThis.window = globalThis.window || {};
	});

	it("should initialize correctly", () => {
		const app = quadPlotApp();
		app.init();
		expect(app.tabs.length).toBe(1);
		expect(app.activeTabId).toBe(app.tabs[0].id);
		expect(app.activeTab).toEqual(app.tabs[0]);
	});

	it("should add tab", () => {
		const app = quadPlotApp();
		app.init();
		app.addTab();
		expect(app.tabs.length).toBe(2);
		expect(app.tabs[1].name).toBe("Map 2");
		expect(app.activeTabId).toBe(app.tabs[1].id);
	});

	it("should switch tab", () => {
		const app = quadPlotApp();
		app.init();
		app.addTab();
		const firstTabId = app.tabs[0].id;
		app.switchTab(firstTabId);
		expect(app.activeTabId).toBe(firstTabId);
	});

	it("should edit tab name", () => {
		const app = quadPlotApp();
		app.init();
		globalThis.window.prompt = mock(() => "Renamed Map");
		app.editTabName(app.tabs[0].id);
		expect(app.tabs[0].name).toBe("Renamed Map");

		// Test invalid tab
		app.editTabName("invalid");

		// Test prompt cancel
		globalThis.window.prompt = mock(() => null);
		app.editTabName(app.tabs[0].id);
		expect(app.tabs[0].name).toBe("Renamed Map");
	});

	it("should edit label", () => {
		const app = quadPlotApp();
		app.init();
		globalThis.window.prompt = mock(() => "New Label");
		app.editLabel("xPositive");
		expect(app.activeTab.labels.xPositive).toBe("New Label");

		// Test prompt cancel
		globalThis.window.prompt = mock(() => null);
		app.editLabel("xPositive");
		expect(app.activeTab.labels.xPositive).toBe("New Label");
	});

	it("should handle open, save, close, delete item dialog", () => {
		const app = quadPlotApp();
		app.init();

		// Open dialog
		const item = { id: "i1", text: "Original", x: 10, y: 10 };
		app.openItemDialog(item);
		expect(app.editingItem).toEqual(item);

		// Save existing item (not in items yet, so findIndex is -1)
		app.saveItemDialog();
		expect(app.editingItem).toBe(null);

		// Now add a new item
		app.editingItem = { id: "i2", text: "New Item", x: 20, y: 20, isNew: true };
		app.saveItemDialog();
		expect(app.activeTab.items.length).toBe(1);
		expect(app.activeTab.items[0].text).toBe("New Item");
		expect(app.editingItem).toBe(null);

		// Edit the added item
		app.editingItem = { id: "i2", text: "Updated Item", x: 20, y: 20 };
		app.saveItemDialog();
		expect(app.activeTab.items[0].text).toBe("Updated Item");

		// Save with empty text
		app.editingItem = { id: "i2", text: "   ", x: 20, y: 20 };
		app.saveItemDialog();
		expect(globalThis.alert).toHaveBeenCalledWith("名前を入力してください。");

		// Close dialog
		app.closeItemDialog();
		expect(app.editingItem).toBe(null);

		// Delete item
		app.editingItem = { id: "i2", text: "Updated Item", x: 20, y: 20 };
		globalThis.window.confirm = mock(() => true);
		app.deleteItem();
		expect(app.activeTab.items.length).toBe(0);
		expect(app.editingItem).toBe(null);
	});

	it("should handle dblclick to add item", () => {
		const app = quadPlotApp();
		app.init();
		const container = {
			getBoundingClientRect: () => ({
				left: 0,
				top: 0,
				width: 500,
				height: 500,
			}),
		};
		app.$refs = { container };

		const event = { target: container, clientX: 250, clientY: 250 };
		app.handleDblClick(event);
		expect(app.editingItem).not.toBe(null);
		expect(app.editingItem.isNew).toBe(true);

		// Ignore if target is not container
		app.handleDblClick({ target: {}, clientX: 250, clientY: 250 });
	});

	it("should handle startDrag", () => {
		const app = quadPlotApp();
		app.init();
		app.activeTab.items.push({ id: "drag-1", text: "Drag Me", x: 10, y: 10 });

		let mouseMoveCb;
		let mouseUpCb;
		globalThis.window.addEventListener = mock((event, cb) => {
			if (event === "mousemove") mouseMoveCb = cb;
			if (event === "mouseup") mouseUpCb = cb;
		});
		globalThis.window.removeEventListener = mock();

		// Right click should be ignored
		app.startDrag({ button: 1 }, "drag-1");
		expect(app.draggingId).toBe(null);

		// Left click start drag
		app.startDrag({ button: 0, clientX: 100, clientY: 100 }, "drag-1");
		expect(app.draggingId).toBe("drag-1");
		expect(app.startX).toBe(100);

		// Simulate mousemove
		mouseMoveCb({ clientX: 150, clientY: 120 });
		expect(app.activeTab.items[0].x).toBe(60); // 10 + (150 - 100)
		expect(app.activeTab.items[0].y).toBe(30); // 10 + (120 - 100)

		// Simulate mouseup
		mouseUpCb();
		expect(app.draggingId).toBe(null);
	});

	it("should export data correctly", async () => {
		const app = quadPlotApp();
		app.init();

		// Mock prompt cancel
		globalThis.window.prompt = mock(() => null);
		await app.exportData();

		// Mock prompt success with fallback download
		globalThis.window.prompt = mock(() => "test_export");
		let downloadCalled = false;
		globalThis.document = {
			createElement: () => ({
				click: () => {
					downloadCalled = true;
				},
			}),
		};
		globalThis.URL = {
			createObjectURL: () => "blob:url",
			revokeObjectURL: () => {},
		};
		globalThis.navigator = { share: null, canShare: null };

		await app.exportData();
		expect(downloadCalled).toBe(true);

		// Mock navigator share success
		globalThis.navigator = {
			share: mock(() => Promise.resolve()),
			canShare: mock(() => true),
		};
		await app.exportData();
		expect(globalThis.navigator.share).toHaveBeenCalled();

		// Mock navigator share abort error
		globalThis.navigator = {
			share: mock(() => Promise.reject({ name: "AbortError" })),
			canShare: mock(() => true),
		};
		await app.exportData(); // Should ignore AbortError

		// Mock navigator share other error
		downloadCalled = false;
		globalThis.navigator = {
			share: mock(() => Promise.reject(new Error("Share failed"))),
			canShare: mock(() => true),
		};
		await app.exportData();
		expect(downloadCalled).toBe(true);
	});

	it("should import data correctly", () => {
		const app = quadPlotApp();
		app.init();

		// No file
		app.importData({ target: { files: [] } });

		// Confirm cancel
		globalThis.window.confirm = mock(() => false);
		const inputTarget = {
			files: [new File(["{}"], "data.json")],
			value: "some",
		};
		app.importData({ target: inputTarget });
		expect(inputTarget.value).toBe("");

		// Confirm accept, but invalid json
		globalThis.window.confirm = mock(() => true);
		globalThis.FileReader = class {
			readAsText() {
				setTimeout(() => {
					this.onload({ target: { result: "invalid-json" } });
				}, 0);
			}
		};
		const targetWithFile = {
			files: [new File(["{}"], "data.json")],
			value: "some",
		};
		app.importData({ target: targetWithFile });

		// Mock FileReader onload synchronously for testing
		globalThis.FileReader = class {
			readAsText() {
				this.onload({
					target: {
						result: JSON.stringify({
							tabs: [{ id: "t1", name: "Imported", items: [], labels: {} }],
							activeTabId: "t1",
						}),
					},
				});
			}
		};
		app.importData({ target: targetWithFile });
		expect(app.tabs[0].name).toBe("Imported");

		// Test import validation error
		globalThis.FileReader = class {
			readAsText() {
				this.onload({ target: { result: JSON.stringify({ tabs: [] }) } });
			}
		};
		app.importData({ target: targetWithFile });
	});

	it("should handle deleteTab", () => {
		let mockTime = 1000;
		const originalDateNow = Date.now;
		globalThis.Date.now = () => mockTime++;

		try {
			const app = quadPlotApp();
			app.init();

			// Case 1: Cannot delete the last remaining tab
			app.deleteTab(app.tabs[0].id);
			expect(app.tabs.length).toBe(1);
			expect(globalThis.alert).toHaveBeenCalledWith("これ以上タブを削除することはできません。");

			// Add a second tab
			app.addTab(); // now we have Map 1 and Map 2 (activeTabId is Map 2)
			const map1Id = app.tabs[0].id;
			const map2Id = app.tabs[1].id;
			expect(app.tabs.length).toBe(2);
			expect(app.activeTabId).toBe(map2Id);

			// Case 2: Delete an empty tab (Map 1) without items should succeed without confirm
			globalThis.window.confirm = mock(() => false);
			app.deleteTab(map1Id);
			expect(app.tabs.length).toBe(1);
			expect(app.tabs[0].id).toBe(map2Id);
			expect(app.activeTabId).toBe(map2Id);

			// Case 3: Deleting a tab with items prompts for confirm
			app.addTab(); // Adds Map 3, active becomes Map 3
			const map3Id = app.activeTabId;
			app.activeTab.items.push({ id: "item1", text: "Test Item", x: 10, y: 10 });
			
			// If confirm is canceled, tab is NOT deleted
			globalThis.window.confirm = mock(() => false);
			app.deleteTab(map3Id);
			expect(app.tabs.length).toBe(2);

			// If confirm is accepted, tab IS deleted and active tab switches
			globalThis.window.confirm = mock(() => true);
			app.deleteTab(map3Id);
			expect(app.tabs.length).toBe(1);
			expect(app.tabs[0].id).toBe(map2Id);
			expect(app.activeTabId).toBe(map2Id);
		} finally {
			globalThis.Date.now = originalDateNow;
		}
	});
});
