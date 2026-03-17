const KnowledgeManager = require('./src/modules/knowledge');
const CacheManager = require('./src/modules/cache');
const APIManager = require('./src/modules/api');
const ResponseManager = require('./src/modules/response');
const { extractLearningKeyword } = require('./utils');

/**
 * 智能对话助手
 */
class SmartAgent {
  constructor(config = {}) {
    this.apiKey = config.apiKey || 'your_openai_api_key_here';
    this.name = config.name || 'SmartAgent';
    this.version = config.version || '1.0.0';
    this.logLevel = config.logLevel || 'info';
    
    // 初始化模块
    this.knowledgeManager = new KnowledgeManager();
    this.cacheManager = new CacheManager({
      cacheExpiry: 3600000, // 默认1小时
      cacheSizeLimit: 1000 // 缓存大小限制
    });
    this.apiManager = new APIManager({
      apiKey: this.apiKey,
      logLevel: this.logLevel
    });
    this.responseManager = new ResponseManager({
      logLevel: this.logLevel
    });
    
    // 对话历史
    this.conversationHistory = [];
    this.maxHistoryLength = 10;
    
    // 用户信息
    this.userName = null;
    this.lastTopic = null;
    
    // 对话模式
    this.chatMode = 'default'; // default, friendly, professional, casual
    this.chatModes = {
      default: {
        name: '默认模式',
        prefix: '',
        suffix: ''
      },
      friendly: {
        name: '友好模式',
        prefix: '😊 ',
        suffix: ' 希望能帮到你！'
      },
      professional: {
        name: '专业模式',
        prefix: '',
        suffix: ''
      },
      casual: {
        name: ' casual模式',
        prefix: '嘿！',
        suffix: ' 咋样？'
      }
    };
    
    // 自学习功能
    this.learningEnabled = true;
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
   * 获取知识响应
   * @param {string} cleanPrompt - 清理后的用户输入
   * @returns {object|null} 知识响应对象
   */
  getKnowledgeResponse(cleanPrompt) {
    return this.knowledgeManager.getKnowledgeResponse(
      cleanPrompt, 
      this.chatModes, 
      this.chatMode, 
      this.userName
    );
  }

  /**
   * 从用户输入中学习知识
   * @param {string} prompt - 用户输入
   * @returns {string|null} 学习结果
   */
  learnFromUser(prompt) {
    const learnResult = this.knowledgeManager.learnFromUser(prompt, extractLearningKeyword);
    if (learnResult) {
      // 提取关键词以清除相关缓存
      const cleanPrompt = prompt.toLowerCase();
      let keyword = '';
      if (cleanPrompt.includes('记住') || cleanPrompt.includes('学习') || cleanPrompt.includes('添加知识') || cleanPrompt.includes('应该知道')) {
        let content = prompt.replace(/记住|学习|添加知识|应该知道/gi, '').trim();
        content = content.replace(/^[，,]/, '').trim();
        keyword = extractLearningKeyword(content);
      }
      if (keyword) {
        this.cacheManager.clearRelatedCache(keyword);
      }
      this.log('info', `学习成功: ${keyword} -> ${prompt}`);
    }
    return learnResult;
  }

  /**
   * 生成响应
   * @param {string} prompt - 用户输入
   * @returns {Promise<string>} 响应内容
   */
  generateResponse(prompt) {
    return new Promise(async (resolve) => {
      try {
        // 验证输入
        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
          this.log('error', '无效的输入: 提示为空或不是字符串');
          resolve('抱歉，我无法处理空的请求。');
          return;
        }
        
        const cacheKey = prompt.trim().toLowerCase();
        
        // 检查缓存
        const cachedResponse = this.cacheManager.handleCache(cacheKey);
        if (cachedResponse) {
          try {
            const finalResponse = this.responseManager.applyChatMode(
              cachedResponse, 
              this.chatModes, 
              this.chatMode
            );
            this.responseManager.addToHistory(
              this.conversationHistory, 
              prompt, 
              finalResponse, 
              this.maxHistoryLength
            );
            resolve(finalResponse);
            return;
          } catch (cacheError) {
            this.log('error', '处理缓存响应错误:', cacheError.message);
            // 继续处理，不依赖缓存
          }
        }
        
        this.log('info', '正在处理请求...');
        
        let response;
        if (!this.apiManager.isApiKeyValid()) {
          this.log('info', '使用模拟响应模式');
          const { mockResponse, skipCache } = this.responseManager.generateMockResponse(
            prompt, 
            (cleanPrompt) => this.getKnowledgeResponse(cleanPrompt),
            this.userName
          );
          response = mockResponse;
          
          if (!skipCache) {
            this.cacheManager.setCache(cacheKey, response);
          } else {
            this.log('debug', '跳过缓存');
          }
        } else {
          // 调用OpenAI API
          response = await this.apiManager.callOpenAIAPI(
            prompt, 
            cacheKey, 
            this.cacheManager, 
            this.name
          );
        }
        
        // 处理响应
        response = this.responseManager.processResponse(response);
        
        try {
          const finalResponse = this.responseManager.applyChatMode(
            response, 
            this.chatModes, 
            this.chatMode
          );
          this.responseManager.addToHistory(
            this.conversationHistory, 
            prompt, 
            finalResponse, 
            this.maxHistoryLength
          );
          resolve(finalResponse);
        } catch (finalError) {
          this.log('error', '处理最终响应错误:', finalError.message);
          resolve(response); // 直接返回原始响应
        }
      } catch (error) {
        this.log('error', '生成响应错误:', error.message);
        resolve('抱歉，我在处理您的请求时遇到了问题。');
      }
    });
  }

  /**
   * 处理消息
   * @param {string} message - 用户消息
   * @returns {Promise<string>} 响应内容
   */
  async processMessage(message) {
    try {
      this.log('info', `[${this.name}] 收到消息: ${message}`);
      
      // 验证输入
      if (!message || typeof message !== 'string' || message.trim() === '') {
        this.log('error', '无效的消息: 消息为空或不是字符串');
        return '抱歉，我无法处理空的请求。';
      }
      
      const response = await this.generateResponse(message);
      this.log('info', `[${this.name}] 回复: ${response}`);
      return response;
    } catch (error) {
      this.log('error', '处理消息错误:', error.message);
      return '抱歉，我在处理您的请求时遇到了问题。';
    }
  }

  /**
   * 设置对话模式
   * @param {string} mode - 对话模式
   * @returns {string} 设置结果
   */
  setChatMode(mode) {
    if (this.chatModes[mode]) {
      this.chatMode = mode;
      return `已切换到${this.chatModes[mode].name}！`;
    } else {
      return `不支持的对话模式。支持的模式：${Object.keys(this.chatModes).join('、')}`;
    }
  }

  /**
   * 获取当前对话模式
   * @returns {string} 当前对话模式名称
   */
  getChatMode() {
    return this.chatModes[this.chatMode].name;
  }

  /**
   * 设置用户名
   * @param {string} name - 用户名
   */
  setUserName(name) {
    this.userName = name;
  }

  /**
   * 获取用户名
   * @returns {string} 用户名
   */
  getUserName() {
    return this.userName;
  }

  /**
   * 获取对话历史
   * @returns {array} 对话历史
   */
  getConversationHistory() {
    return this.conversationHistory;
  }

  /**
   * 清除对话历史
   */
  clearConversationHistory() {
    this.conversationHistory = [];
  }

  /**
   * 获取缓存统计信息
   * @returns {object} 缓存统计信息
   */
  getCacheStats() {
    return this.cacheManager.getCacheStats();
  }

  /**
   * 清除所有缓存
   */
  clearCache() {
    this.cacheManager.clearAllCache();
  }

  /**
   * 获取动态知识库
   * @returns {object} 动态知识库
   */
  getKnowledge() {
    return this.knowledgeManager.getKnowledge();
  }
}

module.exports = SmartAgent;
