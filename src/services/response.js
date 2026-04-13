const { getRandomResponse, handleCalculation, handleUnitConversion, handleWeatherQuery, handleNewsQuery, handleDateCalculation, generateChatResponse, getFallbackResponse } = require('../utils');

/**
 * 响应生成模块 - 生成智能体响应
 */
class ResponseManager {
  constructor(config = {}) {
    this.logLevel = config.logLevel || 'info';
  }

  /**
   * 日志记录
   * @param {string} level - 日志级别
   * @param  {...any} args - 日志参数
   */
  log(level, ...args) {
    if (['debug', 'info', 'error'].indexOf(level) >= ['debug', 'info', 'error'].indexOf(this.logLevel)) {
      console.log(`[${level.toUpperCase()}]`, ...args);
    }
  }

  /**
   * 生成模拟响应
   * @param {string} prompt - 用户输入
   * @param {function} getKnowledgeResponse - 获取知识响应的函数
   * @param {string} userName - 用户名
   * @param {array} conversationHistory - 对话历史
   * @returns {object} 模拟响应对象
   */
  generateMockResponse(prompt, getKnowledgeResponse, userName, conversationHistory = []) {
    try {
      const cleanPrompt = prompt.toLowerCase().trim();
      let mockResponse = '';
      let skipCache = false;
      
      const knowledgeResult = getKnowledgeResponse(cleanPrompt);
      if (knowledgeResult) {
        mockResponse = knowledgeResult.response;
        skipCache = knowledgeResult.skipCache;
      } else {
        const calcResult = handleCalculation(cleanPrompt);
        if (calcResult) {
          mockResponse = calcResult;
        } else {
          const unitResult = handleUnitConversion(cleanPrompt, prompt);
          if (unitResult) {
            mockResponse = unitResult;
          } else {
            const weatherResult = handleWeatherQuery(cleanPrompt);
            if (weatherResult) {
              mockResponse = weatherResult;
            } else {
              const newsResult = handleNewsQuery(cleanPrompt);
              if (newsResult) {
                mockResponse = newsResult;
              } else {
                const dateResult = handleDateCalculation(cleanPrompt);
                if (dateResult) {
                  mockResponse = dateResult;
                } else {
                  if (cleanPrompt.length < 15 || 
                      cleanPrompt.includes('嗯') || 
                      cleanPrompt.includes('哦') || 
                      cleanPrompt.includes('啊') ||
                      cleanPrompt.includes('哈')) {
                    mockResponse = generateChatResponse(prompt, cleanPrompt, userName, conversationHistory);
                  } else {
                    mockResponse = getFallbackResponse(conversationHistory);
                  }
                }
              }
            }
          }
        }
      }
      
      return { mockResponse, skipCache };
    } catch (error) {
      this.log('error', '生成模拟响应错误:', error.message);
      return { mockResponse: getFallbackResponse(), skipCache: false };
    }
  }

  /**
   * 应用对话模式
   * @param {string} response - 原始响应
   * @param {object} chatModes - 对话模式配置
   * @param {string} chatMode - 当前对话模式
   * @returns {string} 应用对话模式后的响应
   */
  applyChatMode(response, chatModes, chatMode) {
    const mode = chatModes[chatMode];
    return mode.prefix + response + mode.suffix;
  }

  /**
   * 添加到对话历史
   * @param {array} conversationHistory - 对话历史
   * @param {string} userMessage - 用户消息
   * @param {string} botResponse - 机器人响应
   * @param {number} maxHistoryLength - 最大历史长度
   */
  addToHistory(conversationHistory, userMessage, botResponse, maxHistoryLength) {
    conversationHistory.push({ user: userMessage, bot: botResponse });
    if (conversationHistory.length > maxHistoryLength) {
      conversationHistory.shift();
    }
  }

  /**
   * 处理响应
   * @param {string} response - 原始响应
   * @returns {string} 处理后的响应
   */
  processResponse(response) {
    // 确保响应有效
    if (!response || typeof response !== 'string' || response.trim() === '') {
      return getFallbackResponse();
    }
    return response;
  }
}

module.exports = ResponseManager;
