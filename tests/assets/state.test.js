import { describe, expect, it } from "bun:test";
import {
	createInitialTab,
	createNewTab,
	getDefaultLabels,
	resolveInitialState,
	sanitizeFilename,
	validateImportedData,
} from "../../src/state";

describe("state.js", () => {
	it("should return default labels", () => {
		const labels = getDefaultLabels();
		expect(labels.xPositive).toBe("(+)");
		expect(labels.qTopLeft).toBe("Top Left");
	});

	it("should create initial tab", () => {
		const tab = createInitialTab();
		expect(tab.name).toBe("Map 1");
		expect(tab.items).toEqual([]);
		expect(tab.labels.xPositive).toBe("(+)");
	});

	it("should create new tab with correct name", () => {
		const tab = createNewTab(2);
		expect(tab.name).toBe("Map 3");
	});

	it("should resolve initial state with saved tabs", () => {
		const savedTabs = [
			{ id: "tab-1", name: "Custom Map", items: [], labels: {} },
		];
		const state = resolveInitialState(savedTabs, "tab-1");
		expect(state.tabs).toEqual(savedTabs);
		expect(state.activeTabId).toBe("tab-1");
	});

	it("should resolve initial state with saved tabs but invalid activeTabId", () => {
		const savedTabs = [
			{ id: "tab-1", name: "Custom Map", items: [], labels: {} },
		];
		const state = resolveInitialState(savedTabs, "invalid-id");
		expect(state.tabs).toEqual(savedTabs);
		expect(state.activeTabId).toBe("tab-1");
	});

	it("should resolve initial state when no saved tabs exist", () => {
		const state = resolveInitialState(null, null);
		expect(state.tabs.length).toBe(1);
		expect(state.tabs[0].name).toBe("Map 1");
		expect(state.activeTabId).toBe(state.tabs[0].id);
	});

	it("should validate imported data correctly", () => {
		const invalidObj = validateImportedData("not-an-object");
		expect(invalidObj.isValid).toBe(false);

		const noTabs = validateImportedData({ tabs: [] });
		expect(noTabs.isValid).toBe(false);

		const validData = {
			tabs: [{ id: "t1", name: "Map", items: [], labels: {} }],
			activeTabId: "t1",
		};
		const validObj = validateImportedData(validData);
		expect(validObj.isValid).toBe(true);
		expect(validObj.tabs).toEqual(validData.tabs);
		expect(validObj.activeTabId).toBe("t1");

		const validDataInvalidActive = {
			tabs: [{ id: "t1", name: "Map", items: [], labels: {} }],
			activeTabId: "invalid",
		};
		const validObj2 = validateImportedData(validDataInvalidActive);
		expect(validObj2.isValid).toBe(true);
		expect(validObj2.activeTabId).toBe("t1");
	});

	it("should sanitize filename correctly", () => {
		expect(sanitizeFilename(null, "default.json")).toBe(null);
		expect(sanitizeFilename("   ", "default.json")).toBe("default.json");
		expect(sanitizeFilename("custom", "default.json")).toBe("custom.json");
		expect(sanitizeFilename("custom.json", "default.json")).toBe("custom.json");
	});
});
