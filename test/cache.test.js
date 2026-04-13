const CacheManager = require('../src/services/cache');

describe('CacheManager', () => {
  let cacheManager;

  beforeEach(() => {
    cacheManager = new CacheManager({
      cacheExpiry: 1000, // 1秒过期
      cacheSizeLimit: 10 // 缓存大小限制
    });
  });

  describe('初始化', () => {
    test('应该成功初始化', () => {
      expect(cacheManager).toBeDefined();
    });
  });

  describe('设置和获取缓存', () => {
    test('应该设置和获取缓存', () => {
      const cacheKey = 'test_key';
      const response = 'test_response';
      cacheManager.setCache(cacheKey, response);
      const cachedResponse = cacheManager.handleCache(cacheKey);
      expect(cachedResponse).toBe(response);
    });

    test('应该返回null对于不存在的缓存', () => {
      const cacheKey = 'non_existent_key';
      const cachedResponse = cacheManager.handleCache(cacheKey);
      expect(cachedResponse).toBeNull();
    });

    test('应该返回null对于过期的缓存', async () => {
      const cacheKey = 'expired_key';
      const response = 'expired_response';
      cacheManager.setCache(cacheKey, response);
      // 等待缓存过期
      await new Promise(resolve => setTimeout(resolve, 1100));
      const cachedResponse = cacheManager.handleCache(cacheKey);
      expect(cachedResponse).toBeNull();
    });
  });

  describe('缓存大小管理', () => {
    test('应该管理缓存大小', () => {
      // 添加超过缓存大小限制的缓存项
      for (let i = 0; i < 15; i++) {
        cacheManager.setCache(`key_${i}`, `response_${i}`);
      }
      const stats = cacheManager.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(10);
    });
  });

  describe('清除缓存', () => {
    test('应该清除相关缓存', () => {
      cacheManager.setCache('test_key_1', 'response_1');
      cacheManager.setCache('test_key_2', 'response_2');
      cacheManager.setCache('other_key', 'response_3');
      cacheManager.clearRelatedCache('test');
      expect(cacheManager.handleCache('test_key_1')).toBeNull();
      expect(cacheManager.handleCache('test_key_2')).toBeNull();
      expect(cacheManager.handleCache('other_key')).toBe('response_3');
    });

    test('应该清除所有缓存', () => {
      cacheManager.setCache('key_1', 'response_1');
      cacheManager.setCache('key_2', 'response_2');
      cacheManager.clearAllCache();
      expect(cacheManager.handleCache('key_1')).toBeNull();
      expect(cacheManager.handleCache('key_2')).toBeNull();
    });
  });

  describe('缓存统计', () => {
    test('应该获取缓存统计信息', () => {
      cacheManager.setCache('key_1', 'response_1');
      cacheManager.handleCache('key_1'); // 增加命中次数
      const stats = cacheManager.getCacheStats();
      expect(stats).toBeDefined();
      expect(stats.size).toBe(1);
      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(0);
      expect(stats.totalRequests).toBe(1);
    });
  });

  describe('预热缓存', () => {
    test('应该预热缓存', () => {
      const items = [
        { key: 'prewarm_key_1', value: 'prewarm_response_1' },
        { key: 'prewarm_key_2', value: 'prewarm_response_2' }
      ];
      cacheManager.prewarmCache(items);
      expect(cacheManager.handleCache('prewarm_key_1')).toBe('prewarm_response_1');
      expect(cacheManager.handleCache('prewarm_key_2')).toBe('prewarm_response_2');
    });
  });

  describe('异步管理缓存', () => {
    test('应该异步管理缓存', async () => {
      cacheManager.setCache('key_1', 'response_1');
      await cacheManager.manageCacheAsync();
      // 没有异常抛出，测试通过
      expect(true).toBe(true);
    });
  });
});