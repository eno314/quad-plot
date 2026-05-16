import { describe, it, expect } from 'bun:test';
import { getRelativeCoordinates } from './geometry';

describe('geometry.js', () => {
  describe('getRelativeCoordinates', () => {
    it('should calculate relative coordinates correctly', () => {
      // 仮想のコンテナのRect（左端が50、上端が100の場所にある）
      const mockRect = { left: 50, top: 100 };
      
      // マウス位置
      const clientX = 150;
      const clientY = 300;

      const result = getRelativeCoordinates(clientX, clientY, mockRect);
      
      expect(result.x).toBe(100); // 150 - 50 = 100
      expect(result.y).toBe(200); // 300 - 100 = 200
    });

    it('should handle zero and negative coordinates', () => {
      const mockRect = { left: -20, top: -50 };
      
      const clientX = 0;
      const clientY = 0;

      const result = getRelativeCoordinates(clientX, clientY, mockRect);
      
      expect(result.x).toBe(20);  // 0 - (-20) = 20
      expect(result.y).toBe(50);  // 0 - (-50) = 50
    });
  });
});
