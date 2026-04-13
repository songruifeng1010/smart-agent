/**
 * 话题跟踪模块 - 跟踪用户的话题
 */
class TopicManager {
  constructor() {
    // 话题关键词配置
    this.topics = {
      '科技': ['科技', '技术', '互联网', 'AI', '人工智能', '计算机', '手机', '软件', '硬件'],
      '娱乐': ['电影', '音乐', '游戏', '明星', '体育', '旅游', '美食', '购物'],
      '学习': ['学习', '教育', '考试', '学校', '课程', '作业', '知识'],
      '工作': ['工作', '职场', '职业', '面试', '公司', '加班', '薪资'],
      '生活': ['生活', '家庭', '健康', '健身', '减肥', '睡眠', '心情']
    };
    
    // 话题历史
    this.topicHistory = [];
    this.maxHistoryLength = 5;
  }

  /**
   * 跟踪话题
   * @param {string} message - 用户消息
   * @returns {string} 当前话题
   */
  trackTopic(message) {
    const cleanMessage = message.toLowerCase().trim();
    
    let currentTopic = null;
    let maxScore = 0;
    
    for (const [topic, keywords] of Object.entries(this.topics)) {
      let score = 0;
      for (const keyword of keywords) {
        if (cleanMessage.includes(keyword)) {
          score++;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        currentTopic = topic;
      }
    }
    
    if (currentTopic) {
      this.addToTopicHistory(currentTopic);
    }
    
    return currentTopic;
  }

  /**
   * 添加到话题历史
   * @param {string} topic - 话题
   */
  addToTopicHistory(topic) {
    if (!this.topicHistory.includes(topic)) {
      this.topicHistory.push(topic);
      if (this.topicHistory.length > this.maxHistoryLength) {
        this.topicHistory.shift();
      }
    }
  }

  /**
   * 获取话题历史
   * @returns {array} 话题历史
   */
  getTopicHistory() {
    return this.topicHistory;
  }

  /**
   * 清除话题历史
   */
  clearTopicHistory() {
    this.topicHistory = [];
  }

  /**
   * 获取支持的话题列表
   * @returns {array} 话题列表
   */
  getSupportedTopics() {
    return Object.keys(this.topics);
  }

  /**
   * 添加话题
   * @param {string} topic - 话题名称
   * @param {array} keywords - 关键词列表
   */
  addTopic(topic, keywords) {
    if (!this.topics[topic]) {
      this.topics[topic] = keywords;
    }
  }

  /**
   * 移除话题
   * @param {string} topic - 话题名称
   */
  removeTopic(topic) {
    if (this.topics[topic]) {
      delete this.topics[topic];
    }
  }

  /**
   * 添加话题关键词
   * @param {string} topic - 话题名称
   * @param {string} keyword - 关键词
   */
  addTopicKeyword(topic, keyword) {
    if (this.topics[topic] && !this.topics[topic].includes(keyword)) {
      this.topics[topic].push(keyword);
    }
  }

  /**
   * 移除话题关键词
   * @param {string} topic - 话题名称
   * @param {string} keyword - 关键词
   */
  removeTopicKeyword(topic, keyword) {
    if (this.topics[topic]) {
      this.topics[topic] = this.topics[topic].filter(k => k !== keyword);
    }
  }
}

module.exports = TopicManager;