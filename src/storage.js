/**
 * ローカルストレージからアイテムを読み込む
 * @param {string} key 保存キー
 * @returns {Array} 読み込んだアイテムの配列、エラー時は空配列
 */
export function loadItems(key) {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse items', e);
      return [];
    }
  }
  return [];
}

/**
 * アイテムをローカルストレージに保存する
 * @param {string} key 保存キー
 * @param {Array} items 保存するアイテムの配列
 */
export function saveItems(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}
