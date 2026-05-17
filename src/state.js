export function getDefaultLabels() {
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
}

export function createInitialTab() {
	return {
		id: Date.now().toString(),
		name: "Map 1",
		items: [],
		labels: getDefaultLabels(),
	};
}

export function createNewTab(existingTabsCount) {
	return {
		id: Date.now().toString(),
		name: `Map ${existingTabsCount + 1}`,
		items: [],
		labels: getDefaultLabels(),
	};
}

export function resolveInitialState(savedTabs, savedActiveTabId) {
	if (savedTabs && savedTabs.length > 0) {
		const activeTabId =
			savedActiveTabId && savedTabs.some((t) => t.id === savedActiveTabId)
				? savedActiveTabId
				: savedTabs[0].id;
		return { tabs: savedTabs, activeTabId };
	}
	const newTab = createInitialTab();
	return { tabs: [newTab], activeTabId: newTab.id };
}

export function validateImportedData(data) {
	if (!data || typeof data !== "object") {
		return { isValid: false, error: "データがオブジェクトではありません。" };
	}
	if (!data.tabs || !Array.isArray(data.tabs) || data.tabs.length === 0) {
		return {
			isValid: false,
			error: "有効なQuadPlotのデータファイルではありません。",
		};
	}
	const activeTabId =
		data.activeTabId && data.tabs.some((t) => t.id === data.activeTabId)
			? data.activeTabId
			: data.tabs[0].id;

	return { isValid: true, tabs: data.tabs, activeTabId };
}

export function sanitizeFilename(filename, defaultFilename) {
	if (filename === null || filename === undefined) return null;
	const trimmed = filename.trim();
	if (!trimmed) return defaultFilename;
	if (!trimmed.endsWith(".json")) return `${trimmed}.json`;
	return trimmed;
}
