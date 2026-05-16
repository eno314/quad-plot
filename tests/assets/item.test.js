import { describe, it, expect } from 'bun:test';
import { createItem } from '../../src/item';

describe('item.js', () => {
  describe('createItem', () => {
    it('should create an item with correct properties', () => {
      const item = createItem('  Test Item  ', 100, 200);
      
      expect(item).toHaveProperty('id');
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.text).toBe('Test Item'); // 余白がトリムされること
      expect(item.x).toBe(100);
      expect(item.y).toBe(200);
    });

    it('should use the provided id generator if given', () => {
      const mockIdGenerator = () => 'mock-id-123';
      const item = createItem('Test', 10, 20, mockIdGenerator);
      
      expect(item.id).toBe('mock-id-123');
    });

    it('should generate unique ids for different items by default', () => {
      const item1 = createItem('A', 0, 0);
      const item2 = createItem('B', 0, 0);
      
      expect(item1.id).not.toBe(item2.id);
    });
  });
});
