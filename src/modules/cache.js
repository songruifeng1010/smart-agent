/**
 * 缓存模块 - 管理响应缓存
 */
class CacheManager {
  constructor(config = {}) {
    this.cache = new Map();
    this.cacheExpiry = config.cacheExpiry || 3600000; // 默认1小时
    this.cacheSizeLimit = config.cacheSizeLimit || 1000; // 缓存大小限制
    this.cacheAccessCount = new Map(); // 记录缓存访问次数
  }

  /**
   * 处理缓存
   * @param {string} cacheKey - 缓存键
   * @returns {string|null} 缓存的响应
   */
  handleCache(cacheKey) {
    try {
      if (this.cache && this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < this.cacheExpiry) {
          // 更新缓存访问次数
          if (this.cacheAccessCount) {
            const currentCount = this.cacheAccessCount.get(cacheKey) || 0;
            this.cacheAccessCount.set(cacheKey, currentCount + 1);
          }
          return cachedData.response;
        } else {
          // 删除过期缓存
          this.cache.delete(cacheKey);
          if (this.cacheAccessCount) {
            this.cacheAccessCount.delete(cacheKey);
          }
        }
      }
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
      console.log(`缓存清理: 删除过期项: ${key}`);
    }
    
    // 如果缓存仍然超过限制，删除访问次数最少的项
    if (this.cache.size >= this.cacheSizeLimit) {
      // 找出访问次数最少的缓存项
      let leastAccessedKey = null;
      let leastAccessCount = Infinity;
      
      for (const [key, count] of this.cacheAccessCount.entries()) {
        if (count < leastAccessCount) {
          leastAccessCount = count;
          leastAccessedKey = key;
        }
      }
      
      // 删除访问次数最少的缓存项
      if (leastAccessedKey) {
        this.cache.delete(leastAccessedKey);
        this.cacheAccessCount.delete(leastAccessedKey);
        console.log(`缓存清理: 删除访问次数最少的项: ${leastAccessedKey}`);
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
      
      // 设置缓存，初始化访问次数
      this.cache.set(cacheKey, {
        response: response,
        timestamp: Date.now()
      });
      if (this.cacheAccessCount) {
        this.cacheAccessCount.set(cacheKey, 1);
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
    return {
      size: this.cache.size,
      sizeLimit: this.cacheSizeLimit,
      expiry: this.cacheExpiry,
      accessCount: this.cacheAccessCount.size
    };
  }
}

module.exports = CacheManager;
