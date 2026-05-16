import { test, expect } from '@playwright/test';

test.describe('QuadPlot SPA MVP', () => {
  test.beforeEach(async ({ page }) => {
    // ページにアクセスした直後に1度だけローカルストレージをクリアする
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
    // 確実に初期状態から始めるため再度リロードしておく
    await page.reload();
  });

  test('初期表示: X軸とY軸が正しく描画されていること', async ({ page }) => {
    // 軸が存在するか確認
    await expect(page.getByText('X Axis')).toBeVisible();
    await expect(page.getByText('Y Axis')).toBeVisible();
  });

  test('アイテムの追加: ダブルクリックでプロンプトが表示され、アイテムが追加されること', async ({ page }) => {
    // window.prompt のモック設定
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toBe('アイテムの名前を入力してください:');
      await dialog.accept('Test Item 1');
    });

    const container = page.locator('#app > div').first();

    // コンテナの特定座標をダブルクリック
    await container.dblclick({ position: { x: 200, y: 200 } });

    // 'Test Item 1' というテキストが表示されることを確認
    await expect(page.getByText('Test Item 1')).toBeVisible();

    // DOM要素の位置を検証
    const item = page.locator('text="Test Item 1"').locator('..');
    const style = await item.getAttribute('style');
    expect(style).toContain('left: 200px');
    expect(style).toContain('top: 200px');
  });

  test('ドラッグ＆ドロップ機能: アイテムの座標が正しく移動すること', async ({ page }) => {
    // window.prompt のモック設定
    page.on('dialog', async dialog => dialog.accept('Draggable Item'));

    const container = page.locator('#app > div').first();
    await container.dblclick({ position: { x: 300, y: 300 } });

    const item = page.locator('text="Draggable Item"').locator('..');
    
    // アイテムが描画されるのを少し待つ
    await expect(item).toBeVisible();

    // アイテムをドラッグ&ドロップ
    await page.mouse.move(300, 300);
    await page.mouse.down();
    await page.mouse.move(400, 400, { steps: 10 });
    await page.mouse.up();

    // style属性が変わっていることを確認
    const style = await item.getAttribute('style');
    expect(style).toContain('left: 400px');
    expect(style).toContain('top: 400px');
  });

  test('データの永続化: ページをリロードしてもアイテムが残っていること', async ({ page }) => {
    page.on('dialog', async dialog => dialog.accept('Persistent Item'));

    const container = page.locator('#app > div').first();
    await container.dblclick({ position: { x: 150, y: 150 } });
    await expect(page.getByText('Persistent Item')).toBeVisible();

    // リロード
    await page.reload();

    // リロード後にも存在することを確認
    await expect(page.getByText('Persistent Item')).toBeVisible();
    
    const item = page.locator('text="Persistent Item"').locator('..');
    const style = await item.getAttribute('style');
    expect(style).toContain('left: 150px');
    expect(style).toContain('top: 150px');
  });
});
