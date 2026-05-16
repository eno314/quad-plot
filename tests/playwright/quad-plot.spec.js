import { expect, test } from "@playwright/test";

test.describe("QuadPlot SPA MVP", () => {
	test.beforeEach(async ({ page }) => {
		// ページにアクセスした直後に1度だけローカルストレージをクリアする
		await page.goto("/");
		await page.evaluate(() => window.localStorage.clear());
		// 確実に初期状態から始めるため再度リロードしておく
		await page.reload();
	});

	test("初期表示: 軸ラベルと象限ラベルが正しく描画されていること", async ({
		page,
	}) => {
		// デフォルトのラベルが存在するか確認
		await expect(page.getByText("(+)").first()).toBeVisible();
		await expect(page.getByText("(-)").first()).toBeVisible();
		await expect(page.getByText("Top Left")).toBeVisible();
		await expect(page.getByText("Bottom Right")).toBeVisible();
	});

	test("アイテムの追加: ダブルクリックでプロンプトが表示され、アイテムが追加されること", async ({
		page,
	}) => {
		// window.prompt のモック設定
		page.on("dialog", async (dialog) => {
			expect(dialog.type()).toBe("prompt");
			expect(dialog.message()).toBe("アイテムの名前を入力してください:");
			await dialog.accept("Test Item 1");
		});

		const container = page.locator("#app > div").first();

		// コンテナの特定座標をダブルクリック
		await container.dblclick({ position: { x: 200, y: 200 } });

		// 'Test Item 1' というテキストが表示されることを確認
		await expect(page.getByText("Test Item 1")).toBeVisible();

		// DOM要素の位置を検証
		const item = page.locator('text="Test Item 1"').locator("..");
		const style = await item.getAttribute("style");
		expect(style).toContain("left: 200px");
		expect(style).toContain("top: 200px");
	});

	test("ドラッグ＆ドロップ機能: アイテムの座標が正しく移動すること", async ({
		page,
	}) => {
		// window.prompt のモック設定
		page.on("dialog", async (dialog) => dialog.accept("Draggable Item"));

		const container = page.locator("#app > div").first();
		await container.dblclick({ position: { x: 300, y: 300 } });

		const item = page.locator('text="Draggable Item"').locator("..");

		// アイテムが描画されるのを少し待つ
		await expect(item).toBeVisible();

		// アイテムをドラッグ&ドロップ
		await page.mouse.move(300, 300);
		await page.mouse.down();
		await page.mouse.move(400, 400, { steps: 10 });
		await page.mouse.up();

		// style属性が変わっていることを確認
		const style = await item.getAttribute("style");
		expect(style).toContain("left: 400px");
		expect(style).toContain("top: 400px");
	});

	test("データの永続化: ページをリロードしてもアイテムが残っていること", async ({
		page,
	}) => {
		page.on("dialog", async (dialog) => dialog.accept("Persistent Item"));

		const container = page.locator("#app > div").first();
		await container.dblclick({ position: { x: 150, y: 150 } });
		await expect(page.getByText("Persistent Item")).toBeVisible();

		// リロード
		await page.reload();

		// リロード後にも存在することを確認
		await expect(page.getByText("Persistent Item")).toBeVisible();

		const item = page.locator('text="Persistent Item"').locator("..");
		const style = await item.getAttribute("style");
		expect(style).toContain("left: 150px");
		expect(style).toContain("top: 150px");
	});
});

test.describe("アイテムの編集と削除", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => window.localStorage.clear());
		await page.reload();

		// テスト用アイテムの作成
		page.on("dialog", async (dialog) => {
			if (dialog.type() === "prompt") {
				await dialog.accept("Original Name");
			}
		});
		const container = page.locator("#app > div").first();
		await container.dblclick({ position: { x: 200, y: 200 } });
	});

	test("アイテムの名前とメモを編集できること", async ({ page }) => {
		// アイテムをダブルクリックしてモーダルを開く
		await page.getByText("Original Name").dblclick();

		// モーダルが表示されているか確認
		await expect(page.getByText("アイテムの編集")).toBeVisible();

		// 名前とメモを編集
		await page.fill('input[x-model="editingItem.text"]', "Updated Name");
		await page.fill('textarea[x-model="editingItem.memo"]', "This is a memo.");
		await page.click('button:has-text("保存")');

		// 変更が反映されているか確認
		await expect(page.getByText("Updated Name")).toBeVisible();

		// 再度開いてメモが残っているか確認
		await page.getByText("Updated Name").dblclick();
		const memoValue = await page.inputValue(
			'textarea[x-model="editingItem.memo"]',
		);
		expect(memoValue).toBe("This is a memo.");
	});

	test("アイテムを削除できること", async ({ page }) => {
		await page.getByText("Original Name").dblclick();

		// 削除ボタンをクリック (confirmダイアログを自動承認)
		page.on("dialog", async (dialog) => {
			if (dialog.type() === "confirm") {
				await dialog.accept();
			}
		});
		await page.click('button:has-text("削除する")');

		// アイテムが消えているか確認
		await expect(page.getByText("Original Name")).not.toBeVisible();
	});
});
