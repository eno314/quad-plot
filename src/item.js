/**
 * 新しいアイテムオブジェクトを生成する
 * @param {string} text アイテムのテキスト
 * @param {number} x X座標
 * @param {number} y Y座標
 * @param {function} idGenerator (Optional) 依存性注入のためのID生成関数
 * @returns {Object} 生成されたアイテム
 */
export function createItem(text, x, y, idGenerator = null) {
  // 指定されていなければデフォルトのID生成ロジックを使用
  const generateId = idGenerator || (() => Date.now().toString() + Math.random().toString(36).substring(2, 9));
  
  return {
    id: generateId(),
    text: text.trim(),
    x,
    y
  };
}
