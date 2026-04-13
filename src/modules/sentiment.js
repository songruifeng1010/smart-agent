/**
 * 情感分析模块 - 分析用户的情感
 */
class SentimentManager {
  constructor() {
    // 消极情感关键词（优先匹配）
    this.negativeKeywords = [
      '伤心', '难过', '生气', '讨厌', '恨', '坏', '差', '糟糕', 
      '失望', '遗憾', '不好', '不行', '失败', '心情不太好', 
      '心情不好', '不开心', '郁闷', '烦恼', '焦虑', '沮丧', '痛苦'
    ];
    
    // 积极情感关键词
    this.positiveKeywords = [
      '高兴', '开心', '快乐', '喜欢', '爱', '好', '棒', '优秀', 
      '感谢', '谢谢', '不错', '很好', '完美', '愉快', '兴奋', 
      '激动', '满意', '满足'
    ];
  }

  /**
   * 分析用户情感
   * @param {string} message - 用户消息
   * @returns {string} 情感类型
   */
  analyzeSentiment(message) {
    const cleanMessage = message.toLowerCase().trim();
    
    // 先检查是否包含消极关键词
    for (const keyword of this.negativeKeywords) {
      if (cleanMessage.includes(keyword)) {
        return 'negative';
      }
    }
    
    // 再检查是否包含积极关键词
    for (const keyword of this.positiveKeywords) {
      if (cleanMessage.includes(keyword)) {
        return 'positive';
      }
    }
    
    // 既不包含积极关键词也不包含消极关键词
    return 'neutral';
  }

  /**
   * 获取情感关键词列表
   * @returns {object} 情感关键词列表
   */
  getSentimentKeywords() {
    return {
      negative: this.negativeKeywords,
      positive: this.positiveKeywords
    };
  }

  /**
   * 添加情感关键词
   * @param {string} type - 情感类型
   * @param {string} keyword - 关键词
   */
  addSentimentKeyword(type, keyword) {
    if (type === 'negative' && !this.negativeKeywords.includes(keyword)) {
      this.negativeKeywords.push(keyword);
    } else if (type === 'positive' && !this.positiveKeywords.includes(keyword)) {
      this.positiveKeywords.push(keyword);
    }
  }

  /**
   * 移除情感关键词
   * @param {string} type - 情感类型
   * @param {string} keyword - 关键词
   */
  removeSentimentKeyword(type, keyword) {
    if (type === 'negative') {
      this.negativeKeywords = this.negativeKeywords.filter(k => k !== keyword);
    } else if (type === 'positive') {
      this.positiveKeywords = this.positiveKeywords.filter(k => k !== keyword);
    }
  }
}

module.exports = SentimentManager;