/**
 * 意图识别模块 - 识别用户的意图
 */
class IntentManager {
  constructor() {
    // 意图关键词配置
    this.intentKeywords = {
      learning: ['记住', '学习', '添加知识'],
      mode_switch: ['切换到', '模式', 'mode'],
      greeting: ['你好', '嗨', '哈喽'],
      farewell: ['再见', '拜拜', '晚安'],
      calculation: ['计算', '+', '-', '*', '/', '='],
      weather: ['天气', '温度'],
      datetime: ['时间', '日期'],
      joke: ['笑话', '搞笑', '幽默'],
      help: ['帮助', '帮助我', '怎么'],
      settings: ['设置', '偏好', '配置']
    };
  }

  /**
   * 识别用户意图
   * @param {string} message - 用户消息
   * @returns {string} 意图类型
   */
  identifyIntent(message) {
    const cleanMessage = message.toLowerCase().trim();
    
    // 检查学习意图
    if (this.intentKeywords.learning.some(keyword => cleanMessage.includes(keyword))) {
      return 'learning';
    }
    
    // 检查模式切换意图
    if (cleanMessage.includes('切换到') && 
        (cleanMessage.includes('模式') || cleanMessage.includes('mode'))) {
      return 'mode_switch';
    }
    
    // 检查问候意图
    if (this.intentKeywords.greeting.some(keyword => cleanMessage.includes(keyword))) {
      return 'greeting';
    }
    
    // 检查告别意图
    if (this.intentKeywords.farewell.some(keyword => cleanMessage.includes(keyword))) {
      return 'farewell';
    }
    
    // 检查计算意图
    if (this.intentKeywords.calculation.some(keyword => cleanMessage.includes(keyword))) {
      return 'calculation';
    }
    
    // 检查天气意图
    if (this.intentKeywords.weather.some(keyword => cleanMessage.includes(keyword))) {
      return 'weather';
    }
    
    // 检查时间日期意图
    if (this.intentKeywords.datetime.some(keyword => cleanMessage.includes(keyword))) {
      return 'datetime';
    }
    
    // 检查笑话意图
    if (this.intentKeywords.joke.some(keyword => cleanMessage.includes(keyword))) {
      return 'joke';
    }
    
    // 检查帮助意图
    if (this.intentKeywords.help.some(keyword => cleanMessage.includes(keyword))) {
      return 'help';
    }
    
    // 检查设置意图
    if (this.intentKeywords.settings.some(keyword => cleanMessage.includes(keyword))) {
      return 'settings';
    }
    
    // 默认意图
    return 'general';
  }

  /**
   * 获取支持的意图列表
   * @returns {array} 意图列表
   */
  getSupportedIntents() {
    return Object.keys(this.intentKeywords).concat(['general']);
  }
}

module.exports = IntentManager;