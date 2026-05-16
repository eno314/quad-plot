/**
 * クライアントの画面座標とコンテナの境界矩形から、コンテナ内の相対座標を計算する
 * @param {number} clientX マウスイベントの clientX
 * @param {number} clientY マウスイベントの clientY
 * @param {DOMRect} containerRect コンテナの getBoundingClientRect() の結果
 * @returns {{x: number, y: number}} 相対座標
 */
export function getRelativeCoordinates(clientX, clientY, containerRect) {
	return {
		x: clientX - containerRect.left,
		y: clientY - containerRect.top,
	};
}
