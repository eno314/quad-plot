import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { loadItems, saveItems } from "../../src/storage";

// Bunのテスト環境にはlocalStorageが存在しないためモック化する
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

describe("storage.js", () => {
	const TEST_KEY = "test_quadPlot_items";

	beforeEach(() => {
		// 各テスト前にlocalStorageをクリアする
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	describe("loadItems", () => {
		it("should return an empty array if nothing is saved", () => {
			const items = loadItems(TEST_KEY);
			expect(items).toEqual([]);
		});

		it("should parse and return saved JSON", () => {
			const testData = [{ id: "1", text: "test", x: 10, y: 20 }];
			localStorage.setItem(TEST_KEY, JSON.stringify(testData));

			const items = loadItems(TEST_KEY);
			expect(items).toEqual(testData);
		});

		it("should return an empty array and log error on invalid JSON", () => {
			localStorage.setItem(TEST_KEY, "{invalid json");

			// console.errorのモック
			const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

			const items = loadItems(TEST_KEY);

			expect(items).toEqual([]);
			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
		});
	});

	describe("saveItems", () => {
		it("should save items as a JSON string", () => {
			const testData = [{ id: "1", text: "test", x: 10, y: 20 }];
			saveItems(TEST_KEY, testData);

			const saved = localStorage.getItem(TEST_KEY);
			expect(saved).toBe(JSON.stringify(testData));
		});
	});
});
