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

	test("アイテムの追加: ダブルクリックでモーダルが表示され、アイテムが追加されること", async ({
		page,
	}) => {
		const container = page.locator('[x-ref="container"]');

		// コンテナの特定座標をダブルクリック
		await container.dblclick({ position: { x: 200, y: 200 } });

		// モーダルが表示され、名前を入力して保存
		await expect(page.getByText("アイテムの追加")).toBeVisible();
		await page.fill('input[x-model="editingItem.text"]', "Test Item 1");
		await page.click('button:has-text("保存")');

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
		const container = page.locator('[x-ref="container"]');
		await container.dblclick({ position: { x: 300, y: 300 } });
		await expect(page.getByText("アイテムの追加")).toBeVisible();
		await page.fill('input[x-model="editingItem.text"]', "Draggable Item");
		await page.click('button:has-text("保存")');

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
		const container = page.locator('[x-ref="container"]');
		await container.dblclick({ position: { x: 150, y: 150 } });
		await expect(page.getByText("アイテムの追加")).toBeVisible();
		await page.fill('input[x-model="editingItem.text"]', "Persistent Item");
		await page.click('button:has-text("保存")');
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
		const container = page.locator('[x-ref="container"]');
		await container.dblclick({ position: { x: 200, y: 200 } });
		await expect(page.getByText("アイテムの追加")).toBeVisible();
		await page.fill('input[x-model="editingItem.text"]', "Original Name");
		await page.click('button:has-text("保存")');
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

test.describe("タブ機能", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => window.localStorage.clear());
		await page.reload();
	});

	test("新しいタブを追加し、名前を変更できること", async ({ page }) => {
		// 初期タブの確認
		await expect(page.getByText("Map 1")).toBeVisible();

		// タブ追加
		await page.click('button:has-text("新しいマップ")');
		await expect(page.getByText("Map 2")).toBeVisible();

		// タブ名の変更
		page.on("dialog", async (dialog) => {
			if (dialog.type() === "prompt") {
				await dialog.accept("My Custom Map");
			}
		});
		await page.getByText("Map 2").dblclick();
		await expect(page.getByText("My Custom Map")).toBeVisible();
	});

	test("タブを切り替えるとアイテムが独立して管理されること", async ({
		page,
	}) => {
		// Map 1 にアイテム追加
		const container = page.locator('[x-ref="container"]');
		await container.dblclick({ position: { x: 200, y: 200 } });
		await expect(page.getByText("アイテムの追加")).toBeVisible();
		await page.fill('input[x-model="editingItem.text"]', "Item in Map 1");
		await page.click('button:has-text("保存")');
		await expect(page.getByText("Item in Map 1")).toBeVisible();

		// Map 2 を追加
		await page.click('button:has-text("新しいマップ")');
		await expect(page.getByText("Item in Map 1")).not.toBeVisible();

		// Map 1 に戻る
		await page.click('button:has-text("Map 1")');
		await expect(page.getByText("Item in Map 1")).toBeVisible();
	});

	test("タブを削除できること", async ({ page }) => {
		// 1つのタブだけの場合、削除ボタンは非表示
		await expect(page.locator('button[title="タブを削除"]')).not.toBeVisible();

		// タブ追加
		await page.click('button:has-text("新しいマップ")');
		await expect(page.getByRole("button", { name: "Map 2" })).toBeVisible();

		// 削除ボタンが表示されることを確認
		await expect(
			page.locator('button[title="タブを削除"]').first(),
		).toBeVisible();

		// Map 2 でアイテムを追加
		const container = page.locator('[x-ref="container"]');
		await container.dblclick({ position: { x: 200, y: 200 } });
		await page.fill('input[x-model="editingItem.text"]', "Item in Map 2");
		await page.click('button:has-text("保存")');
		await expect(page.getByText("Item in Map 2")).toBeVisible();

		// キャンセル確認ダイアログの挙動テスト
		let dialogHandled = false;
		page.on("dialog", async (dialog) => {
			if (dialog.type() === "confirm") {
				dialogHandled = true;
				expect(dialog.message()).toContain(
					"このタブにはアイテムが含まれています。本当に削除しますか？",
				);
				await dialog.dismiss();
			}
		});

		// Map 2 の削除ボタンをクリック（2番目のタブなのでインデックス 1）
		await page.locator('button[title="タブを削除"]').nth(1).click();
		expect(dialogHandled).toBe(true);

		// キャンセルしたので Map 2 は残っている
		await expect(page.getByRole("button", { name: "Map 2" })).toBeVisible();

		// 承諾確認ダイアログの挙動テスト
		page.removeAllListeners("dialog");
		page.on("dialog", async (dialog) => {
			if (dialog.type() === "confirm") {
				await dialog.accept();
			}
		});

		// 再度削除ボタンをクリック
		await page.locator('button[title="タブを削除"]').nth(1).click();

		// Map 2 が消え、Map 1 がアクティブになることを確認
		await expect(page.getByRole("button", { name: "Map 2" })).not.toBeVisible();
		await expect(page.getByText("Map 1")).toBeVisible();
	});
});

test.describe("インポートとエクスポート機能", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.evaluate(() => window.localStorage.clear());
		await page.reload();
	});

	test("データをエクスポートできること", async ({ page }) => {
		// promptダイアログを処理する
		page.on("dialog", async (dialog) => {
			if (dialog.type() === "prompt") {
				await dialog.accept("custom_export.json");
			}
		});

		// ダウンロードの待機設定
		const downloadPromise = page.waitForEvent("download");
		await page.click('button:has-text("エクスポート")');
		const download = await downloadPromise;

		// プロンプトで入力した名前が使われていることを確認
		expect(download.suggestedFilename()).toBe("custom_export.json");
	});

	test("データをインポートして上書きできること", async ({ page }) => {
		// インポート用のダミーデータを作成
		const dummyData = {
			tabs: [
				{
					id: "import-tab-1",
					name: "Imported Map",
					items: [{ id: "item-1", text: "Imported Item", x: 250, y: 250 }],
					labels: {
						xPositive: "(+)",
						xNegative: "(-)",
						yPositive: "(+)",
						yNegative: "(-)",
						qTopLeft: "Top Left",
						qTopRight: "Top Right",
						qBottomLeft: "Bottom Left",
						qBottomRight: "Bottom Right",
					},
				},
			],
			activeTabId: "import-tab-1",
		};

		// confirmダイアログを自動承認する設定
		page.on("dialog", async (dialog) => {
			if (dialog.type() === "confirm") {
				expect(dialog.message()).toContain("現在のデータはすべて上書きされ");
				await dialog.accept();
			} else if (dialog.type() === "alert") {
				await dialog.accept();
			}
		});

		// input[type="file"] にファイルをセット
		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: "data.json",
			mimeType: "application/json",
			buffer: Buffer.from(JSON.stringify(dummyData)),
		});

		// インポートされたタブとアイテムが表示されることを確認
		await expect(page.getByText("Imported Map")).toBeVisible();
		await expect(page.getByText("Imported Item")).toBeVisible();
	});

	test("インポートの確認ダイアログでキャンセルすると上書きされないこと", async ({
		page,
	}) => {
		// confirmダイアログをキャンセルする設定
		page.on("dialog", async (dialog) => {
			if (dialog.type() === "confirm") {
				await dialog.dismiss();
			}
		});

		const dummyData = {
			tabs: [
				{
					id: "import-tab-2",
					name: "Canceled Map",
					items: [],
					labels: {},
				},
			],
			activeTabId: "import-tab-2",
		};

		const fileInput = page.locator('input[type="file"]');
		await fileInput.setInputFiles({
			name: "data.json",
			mimeType: "application/json",
			buffer: Buffer.from(JSON.stringify(dummyData)),
		});

		// 既存のMap 1のままであることを確認
		await expect(page.getByText("Map 1")).toBeVisible();
		await expect(page.getByText("Canceled Map")).not.toBeVisible();
	});
});
