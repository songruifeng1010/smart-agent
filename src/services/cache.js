/**
 * 缓存模块 - 管理响应缓存
 */
class CacheManager {
  constructor(config = {}) {
    this.cache = new Map();
    this.cacheExpiry = config.cacheExpiry || 3600000; // 默认1小时
    this.cacheSizeLimit = config.cacheSizeLimit || 1000; // 缓存大小限制
    this.cacheAccessCount = new Map(); // 记录缓存访问次数
    this.cacheLastAccess = new Map(); // 记录缓存最后访问时间
    this.hitCount = 0; // 缓存命中次数
    this.missCount = 0; // 缓存未命中次数
    this.totalRequests = 0; // 总请求次数
  }

  /**
   * 处理缓存
   * @param {string} cacheKey - 缓存键
   * @returns {string|null} 缓存的响应
   */
  handleCache(cacheKey) {
    try {
      this.totalRequests++;
      if (this.cache && this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < this.cacheExpiry) {
          // 更新缓存访问次数和最后访问时间
          if (this.cacheAccessCount) {
            const currentCount = this.cacheAccessCount.get(cacheKey) || 0;
            this.cacheAccessCount.set(cacheKey, currentCount + 1);
          }
          if (this.cacheLastAccess) {
            this.cacheLastAccess.set(cacheKey, Date.now());
          }
          this.hitCount++;
          return cachedData.response;
        } else {
          // 删除过期缓存
          this.cache.delete(cacheKey);
          if (this.cacheAccessCount) {
            this.cacheAccessCount.delete(cacheKey);
          }
          if (this.cacheLastAccess) {
            this.cacheLastAccess.delete(cacheKey);
          }
        }
      }
      this.missCount++;
    } catch (error) {
      console.error('缓存处理错误:', error.message);
    }
    return null;
  }

  /**
   * 管理缓存大小
   */
  manageCache() {
    // 先清理过期缓存
    const expiredKeys = [];
    for (const key of this.cache.keys()) {
      const cachedData = this.cache.get(key);
      if (cachedData && Date.now() - cachedData.timestamp >= this.cacheExpiry) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.cache.delete(key);
      if (this.cacheAccessCount) {
        this.cacheAccessCount.delete(key);
      }
      if (this.cacheLastAccess) {
        this.cacheLastAccess.delete(key);
      }
      console.log(`缓存清理: 删除过期项: ${key}`);
    }
    
    // 如果缓存仍然超过限制，使用LRU策略删除多个缓存项
    if (this.cache.size >= this.cacheSizeLimit) {
      // 计算需要删除的缓存项数量
      const deleteCount = Math.min(Math.floor(this.cache.size * 0.2), this.cache.size - this.cacheSizeLimit + 10);
      
      // 按照最后访问时间排序，找出最久未使用的缓存项
      const sortedKeys = Array.from(this.cacheLastAccess.entries())
        .sort((a, b) => a[1] - b[1])
        .map(([key]) => key)
        .slice(0, deleteCount);
      
      // 删除最久未使用的缓存项
      for (const key of sortedKeys) {
        this.cache.delete(key);
        if (this.cacheAccessCount) {
          this.cacheAccessCount.delete(key);
        }
        if (this.cacheLastAccess) {
          this.cacheLastAccess.delete(key);
        }
        console.log(`缓存清理: LRU策略删除: ${key}`);
      }
    }
  }

  /**
   * 设置缓存
   * @param {string} cacheKey - 缓存键
   * @param {string} response - 响应内容
   */
  setCache(cacheKey, response) {
    try {
      // 管理缓存大小
      this.manageCache();
      
      // 设置缓存，初始化访问次数和最后访问时间
      this.cache.set(cacheKey, {
        response: response,
        timestamp: Date.now()
      });
      if (this.cacheAccessCount) {
        this.cacheAccessCount.set(cacheKey, 1);
      }
      if (this.cacheLastAccess) {
        this.cacheLastAccess.set(cacheKey, Date.now());
      }
    } catch (error) {
      console.error('设置缓存错误:', error.message);
    }
  }

  /**
   * 清除相关缓存
   * @param {string} keyword - 关键词
   */
  clearRelatedCache(keyword) {
    if (this.cache) {
      for (const cacheKey of this.cache.keys()) {
        if (cacheKey.includes(keyword.toLowerCase())) {
          this.cache.delete(cacheKey);
          if (this.cacheAccessCount) {
            this.cacheAccessCount.delete(cacheKey);
          }
          if (this.cacheLastAccess) {
            this.cacheLastAccess.delete(cacheKey);
          }
        }
      }
    }
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    this.cache.clear();
    if (this.cacheAccessCount) {
      this.cacheAccessCount.clear();
    }
    if (this.cacheLastAccess) {
      this.cacheLastAccess.clear();
    }
    this.hitCount = 0;
    this.missCount = 0;
    this.totalRequests = 0;
  }

  /**
   * 获取缓存大小
   * @returns {number} 缓存大小
   */
  getCacheSize() {
    return this.cache.size;
  }

  /**
   * 获取缓存统计信息
   * @returns {object} 缓存统计信息
   */
  getCacheStats() {
    const hitRate = this.totalRequests > 0 ? (this.hitCount / this.totalRequests * 100).toFixed(2) : 0;
    return {
      size: this.cache.size,
      sizeLimit: this.cacheSizeLimit,
      expiry: this.cacheExpiry,
      hitCount: this.hitCount,
      missCount: this.missCount,
      totalRequests: this.totalRequests,
      hitRate: `${hitRate}%`,
      accessCount: this.cacheAccessCount.size
    };
  }

  /**
   * 预热缓存
   * @param {array} items - 要预热的缓存项，格式: [{ key: '缓存键', value: '响应内容' }]
   */
  prewarmCache(items) {
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.key && item.value) {
          this.setCache(item.key, item.value);
        }
      }
    }
  }

  /**
   * 异步管理缓存
   */
  async manageCacheAsync() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.manageCache();
        resolve();
      }, 0);
    });
  }
}

module.exports = CacheManager;
