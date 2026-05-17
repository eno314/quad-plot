import { describe, expect, it, mock } from "bun:test";

describe("main.js", () => {
	it("should initialize Alpine component", async () => {
		let alpineInitCb;
		globalThis.window = globalThis.window || {};
		globalThis.document = {
			addEventListener: mock((event, cb) => {
				if (event === "alpine:init") alpineInitCb = cb;
			}),
		};

		// Mock Alpine
		const alpineMock = {
			data: mock(),
			start: mock(),
		};
		mock.module("alpinejs", () => ({
			default: alpineMock,
		}));

		// Dynamic import main.js
		await import("../../src/main.js");

		expect(globalThis.document.addEventListener).toHaveBeenCalled();
		expect(globalThis.window.Alpine).toBeDefined();

		// Trigger alpine:init
		if (alpineInitCb) alpineInitCb();
		expect(alpineMock.data).toHaveBeenCalledWith(
			"quadPlot",
			expect.any(Function),
		);
	});
});
