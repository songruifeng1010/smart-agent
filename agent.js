const KnowledgeManager = require('./src/services/knowledge');
const CacheManager = require('./src/services/cache');
const APIManager = require('./src/services/api');
const ResponseManager = require('./src/services/response');
const { extractLearningKeyword } = require('./src/utils');
const IntentManager = require('./src/services/intent');
const SentimentManager = require('./src/services/sentiment');
const TopicManager = require('./src/services/topic');
const sessionManager = require('./src/services/session');
const securityManager = require('./src/services/security');

/**
 * 智能对话助手
 */
class SmartAgent {
  constructor(config = {}) {
    const configModule = require('./src/config');
    this.apiKey = config.apiKey || configModule.api.apiKey;
    this.name = config.name || configModule.agent.name;
    this.version = config.version || configModule.agent.version;
    this.logLevel = config.logLevel || configModule.agent.logLevel;
    this.model = config.model || configModule.api.model;
    this.provider = config.provider || configModule.api.provider;
    this.language = config.language || configModule.agent.language;
    
    // 支持的语言
    this.supportedLanguages = {
      'zh-CN': '简体中文',
      'en-US': 'English',
      'ja-JP': '日本語',
      'ko-KR': '한국어',
      'fr-FR': 'Français',
      'de-DE': 'Deutsch',
      'es-ES': 'Español',
      'ru-RU': 'Русский'
    };
    
    // 初始化模块
    this.knowledgeManager = new KnowledgeManager();
    this.cacheManager = new CacheManager({
      cacheExpiry: configModule.cache.expiry,
      cacheSizeLimit: configModule.cache.sizeLimit
    });
    this.apiManager = new APIManager({
      apiKey: this.apiKey,
      logLevel: this.logLevel,
      model: this.model,
      provider: this.provider
    });
    this.responseManager = new ResponseManager({
      logLevel: this.logLevel
    });
    this.intentManager = new IntentManager();
    this.sentimentManager = new SentimentManager();
    this.topicManager = new TopicManager();
    
    // 对话历史
    this.conversationHistory = [];
    this.maxHistoryLength = 20; // 增加历史记录长度
    
    // 用户信息
    this.userName = null;
    this.lastTopic = null;
    this.userPreferences = {}; // 用户偏好设置
    
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
        name: 'casual模式',
        prefix: '嘿！',
        suffix: ' 咋样？'
      }
    };
    
    // 自学习功能
    this.learningEnabled = configModule.features.learning;
    
    // 情感分析
    this.sentimentAnalysisEnabled = configModule.features.sentimentAnalysis;
    
    // 话题跟踪
    this.topicTrackingEnabled = configModule.features.topicTracking;
    this.currentTopic = null;
    this.topicHistory = [];
  }
  
  /**
   * 日志记录
   * @param {string} level - 日志级别
   * @param  {...any} args - 日志参数
   */
  log(level, ...args) {
    const logger = require('./src/services/logger');
    const message = args.join(' ');
    const meta = { agent: this.name };
    
    switch (level) {
      case 'debug':
        logger.debug(message, meta);
        break;
      case 'info':
        logger.info(message, meta);
        break;
      case 'warn':
        logger.warn(message, meta);
        break;
      case 'error':
        logger.error(message, meta);
        break;
      default:
        logger.info(message, meta);
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
        this.log('debug', `生成响应: 缓存键 - ${cacheKey}`);
        
        // 检查缓存
        try {
          const cachedResponse = this.cacheManager.handleCache(cacheKey);
          if (cachedResponse) {
            this.log('info', '使用缓存响应');
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
              this.log('error', '处理缓存响应错误:', cacheError.message, cacheError.stack);
              // 继续处理，不依赖缓存
            }
          }
        } catch (cacheError) {
          this.log('error', '检查缓存错误:', cacheError.message, cacheError.stack);
          // 继续处理，不依赖缓存
        }
        
        this.log('info', '正在处理请求...');
        
        let response;
        if (!this.apiManager.isApiKeyValid()) {
          this.log('info', '使用模拟响应模式');
          try {
            const { mockResponse, skipCache } = this.responseManager.generateMockResponse(
              prompt, 
              (cleanPrompt) => this.getKnowledgeResponse(cleanPrompt),
              this.userName,
              this.conversationHistory
            );
            response = mockResponse;
            
            if (!skipCache) {
              try {
                this.cacheManager.setCache(cacheKey, response);
                this.log('debug', '响应已缓存');
              } catch (cacheError) {
                this.log('error', '设置缓存错误:', cacheError.message);
              }
            } else {
              this.log('debug', '跳过缓存');
            }
          } catch (mockError) {
            this.log('error', '生成模拟响应错误:', mockError.message, mockError.stack);
            response = '抱歉，我在生成响应时遇到了问题。';
          }
        } else {
          // 构建包含对话历史的提示
          try {
            const context = this.buildContext(prompt);
            // 调用API
            response = await this.apiManager.callAPI(
              context, 
              cacheKey, 
              this.cacheManager, 
              this.name
            );
          } catch (apiError) {
            this.log('error', 'API调用错误:', apiError.message, apiError.stack);
            response = '抱歉，我在调用API时遇到了问题。';
          }
        }
        
        // 处理响应
        try {
          response = this.responseManager.processResponse(response);
        } catch (processError) {
          this.log('error', '处理响应错误:', processError.message, processError.stack);
          // 继续使用原始响应
        }
        
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
          this.log('info', '响应生成成功');
          resolve(finalResponse);
        } catch (finalError) {
          this.log('error', '处理最终响应错误:', finalError.message, finalError.stack);
          resolve(response); // 直接返回原始响应
        }
      } catch (error) {
        this.log('error', '生成响应错误:', error.message, error.stack);
        resolve('抱歉，我在处理您的请求时遇到了问题。');
      }
    });
  }

  /**
   * 构建包含对话历史的上下文
   * @param {string} prompt - 当前用户输入
   * @returns {string} 包含上下文的完整提示
   */
  buildContext(prompt) {
    let context = `你是${this.name}，一个智能对话助手。你能够理解并回答用户的各种问题，提供准确且有用的信息，并且能够进行自然的对话。\n\n`;
    
    // 添加对话历史
    if (this.conversationHistory.length > 0) {
      context += '对话历史：\n';
      for (const entry of this.conversationHistory) {
        context += `用户: ${entry.user}\n`;
        context += `助手: ${entry.bot}\n`;
      }
      context += '\n';
    }
    
    // 添加当前话题信息
    if (this.currentTopic) {
      context += `当前话题: ${this.currentTopic}\n\n`;
    }
    
    // 添加用户信息
    if (this.userName) {
      context += `用户名称: ${this.userName}\n\n`;
    }
    
    // 添加当前用户输入
    context += `用户当前输入: ${prompt}`;
    
    return context;
  }

  /**
   * 识别用户意图
   * @param {string} message - 用户消息
   * @returns {string} 意图类型
   */
  identifyUserIntent(message) {
    return this.intentManager.identifyIntent(message);
  }

  /**
   * 分析用户情感
   * @param {string} message - 用户消息
   * @returns {string} 情感类型
   */
  analyzeSentiment(message) {
    if (!this.sentimentAnalysisEnabled) {
      return 'neutral';
    }
    
    const sentiment = this.sentimentManager.analyzeSentiment(message);
    this.log('debug', `情感分析结果: ${sentiment}`);
    return sentiment;
  }

  /**
   * 跟踪话题
   * @param {string} message - 用户消息
   * @returns {string} 当前话题
   */
  trackTopic(message) {
    if (!this.topicTrackingEnabled) {
      return null;
    }
    
    const currentTopic = this.topicManager.trackTopic(message);
    if (currentTopic) {
      this.currentTopic = currentTopic;
      this.topicHistory = this.topicManager.getTopicHistory();
    }
    
    return currentTopic;
  }

  /**
   * 处理用户偏好设置
   * @param {string} message - 用户消息
   * @returns {string} 设置结果
   */
  handleUserPreferences(message) {
    const cleanMessage = message.toLowerCase().trim();
    
    if (cleanMessage.includes('设置') && cleanMessage.includes('模式')) {
      if (cleanMessage.includes('友好')) {
        this.chatMode = 'friendly';
        return '已将默认对话模式设置为友好模式！';
      } else if (cleanMessage.includes('专业')) {
        this.chatMode = 'professional';
        return '已将默认对话模式设置为专业模式！';
      } else if (cleanMessage.includes('casual')) {
        this.chatMode = 'casual';
        return '已将默认对话模式设置为casual模式！';
      } else if (cleanMessage.includes('默认')) {
        this.chatMode = 'default';
        return '已将默认对话模式设置为默认模式！';
      }
    }
    
    if (cleanMessage.includes('设置') && cleanMessage.includes('名字') && cleanMessage.includes('叫')) {
      const nameMatch = message.match(/叫(.*?)(?:吧|了|。|！|\?)/);
      if (nameMatch && nameMatch[1]) {
        const name = nameMatch[1].trim();
        this.name = name;
        return `已将我的名字设置为${name}！`;
      }
    }
    
    return null;
  }

  /**
   * 处理消息
   * @param {string} message - 用户消息
   * @returns {Promise<string>} 响应内容
   */
  async processMessage(message) {
    try {
      // 安全验证
      if (!securityManager.validateInput(message)) {
        this.log('error', '无效的消息: 消息包含不安全的内容');
        return '抱歉，我无法处理包含不安全内容的请求。';
      }
      
      // 清理输入
      const sanitizedMessage = securityManager.sanitizeInput(message);
      this.log('info', `[${this.name}] 收到消息: ${sanitizedMessage}`);
      
      // 验证输入
      if (!sanitizedMessage || typeof sanitizedMessage !== 'string' || sanitizedMessage.trim() === '') {
        this.log('error', '无效的消息: 消息为空或不是字符串');
        return '抱歉，我无法处理空的请求。';
      }
      
      // 识别用户意图
      let intent;
      try {
        intent = this.identifyUserIntent(sanitizedMessage);
        this.log('debug', `用户意图: ${intent}`);
      } catch (intentError) {
        this.log('error', '意图识别错误:', intentError.message);
        intent = 'general';
      }
      
      // 分析用户情感
      let sentiment;
      try {
        sentiment = this.analyzeSentiment(sanitizedMessage);
        this.log('debug', `用户情感: ${sentiment}`);
      } catch (sentimentError) {
        this.log('error', '情感分析错误:', sentimentError.message);
        sentiment = 'neutral';
      }
      
      // 跟踪话题
      try {
        const topic = this.trackTopic(sanitizedMessage);
        if (topic) {
          this.log('debug', `当前话题: ${topic}`);
        }
      } catch (topicError) {
        this.log('error', '话题跟踪错误:', topicError.message);
      }
      
      // 处理学习意图
      if (intent === 'learning' && this.learningEnabled) {
        try {
          const learnResult = this.learnFromUser(sanitizedMessage);
          if (learnResult) {
            this.log('info', `学习成功: ${sanitizedMessage}`);
            return learnResult;
          }
        } catch (learnError) {
          this.log('error', '学习处理错误:', learnError.message);
        }
      }
      
      // 处理模式切换意图
      if (intent === 'mode_switch') {
        try {
          if (sanitizedMessage.includes('友好')) {
            return this.setChatMode('friendly');
          } else if (sanitizedMessage.includes('专业')) {
            return this.setChatMode('professional');
          } else if (sanitizedMessage.includes('casual')) {
            return this.setChatMode('casual');
          } else if (sanitizedMessage.includes('默认')) {
            return this.setChatMode('default');
          }
        } catch (modeError) {
          this.log('error', '模式切换错误:', modeError.message);
        }
      }
      
      // 处理设置意图
      if (intent === 'settings') {
        try {
          const settingsResult = this.handleUserPreferences(sanitizedMessage);
          if (settingsResult) {
            this.log('info', `设置成功: ${sanitizedMessage}`);
            return settingsResult;
          }
        } catch (settingsError) {
          this.log('error', '设置处理错误:', settingsError.message);
        }
      }
      
      // 处理帮助意图
      if (intent === 'help') {
        return '我可以帮助您做以下事情：\n1. 回答各种问题\n2. 进行数学计算\n3. 单位转换\n4. 讲笑话\n5. 学习新知识\n6. 切换对话模式\n7. 设置偏好\n\n请问您需要什么帮助？';
      }
      
      // 生成响应
      let response;
      try {
        response = await this.generateResponse(sanitizedMessage);
        // 确保响应有效
        if (!response || typeof response !== 'string' || response.trim() === '') {
          this.log('error', '生成的响应无效');
          response = '抱歉，我在处理您的请求时遇到了问题。';
        }
      } catch (responseError) {
        this.log('error', '生成响应错误:', responseError.message);
        response = '抱歉，我在处理您的请求时遇到了问题。';
      }
      
      // 根据情感调整响应
      try {
        if (sentiment === 'negative') {
          const adjustedResponse = `我理解您现在可能感到不太开心。${response}`;
          this.log('info', `[${this.name}] 回复: ${adjustedResponse}`);
          return adjustedResponse;
        } else if (sentiment === 'positive') {
          const adjustedResponse = `看到您心情不错，我也很开心！${response}`;
          this.log('info', `[${this.name}] 回复: ${adjustedResponse}`);
          return adjustedResponse;
        } else {
          this.log('info', `[${this.name}] 回复: ${response}`);
          return response;
        }
      } catch (adjustError) {
        this.log('error', '调整响应错误:', adjustError.message);
        return response;
      }
    } catch (error) {
      this.log('error', '处理消息错误:', error.message, error.stack);
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

  /**
   * 设置模型
   * @param {string} model - 模型名称
   */
  setModel(model) {
    this.model = model;
    if (this.apiManager) {
      this.apiManager.setModel(model);
    }
  }

  /**
   * 设置提供商
   * @param {string} provider - 提供商名称
   * @returns {boolean} 是否设置成功
   */
  setProvider(provider) {
    this.provider = provider;
    if (this.apiManager) {
      return this.apiManager.setProvider(provider);
    }
    return false;
  }

  /**
   * 获取支持的提供商列表
   * @returns {array} 支持的提供商列表
   */
  getSupportedProviders() {
    if (this.apiManager) {
      return this.apiManager.getSupportedProviders();
    }
    return [];
  }

  /**
   * 设置语言
   * @param {string} language - 语言代码
   * @returns {boolean} 是否设置成功
   */
  setLanguage(language) {
    if (this.supportedLanguages[language]) {
      this.language = language;
      this.log('info', `语言已设置为: ${this.supportedLanguages[language]}`);
      return true;
    }
    this.log('error', `不支持的语言: ${language}`);
    return false;
  }

  /**
   * 获取当前语言
   * @returns {string} 当前语言代码
   */
  getLanguage() {
    return this.language;
  }

  /**
   * 获取支持的语言列表
   * @returns {object} 支持的语言列表
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * 获取当前配置
   * @returns {object} 当前配置
   */
  getConfig() {
    return {
      apiKey: this.apiKey,
      name: this.name,
      version: this.version,
      logLevel: this.logLevel,
      model: this.model,
      provider: this.provider,
      language: this.language
    };
  }

  /**
   * 获取会话
   * @param {string} sessionId - 会话ID
   * @returns {object|null} 会话对象
   */
  getSession(sessionId) {
    return sessionManager.getSession(sessionId);
  }

  /**
   * 创建会话
   * @param {string} sessionId - 会话ID
   * @returns {object} 会话对象
   */
  createSession(sessionId) {
    return sessionManager.createSession(sessionId);
  }

  /**
   * 更新会话
   * @param {string} sessionId - 会话ID
   * @param {object} updates - 更新的内容
   * @returns {object|null} 更新后的会话对象
   */
  updateSession(sessionId, updates) {
    return sessionManager.updateSession(sessionId, updates);
  }

  /**
   * 删除会话
   * @param {string} sessionId - 会话ID
   * @returns {boolean} 是否删除成功
   */
  deleteSession(sessionId) {
    return sessionManager.deleteSession(sessionId);
  }

  /**
   * 处理带有会话的消息
   * @param {string} message - 用户消息
   * @param {string} sessionId - 会话ID
   * @returns {Promise<string>} 响应内容
   */
  async processMessageWithSession(message, sessionId) {
    try {
      // 验证会话ID
      if (!securityManager.validateSessionId(sessionId)) {
        this.log('error', '无效的会话ID');
        return '抱歉，会话无效，请重新开始对话。';
      }

      // 获取或创建会话
      let session = this.getSession(sessionId);
      if (!session) {
        session = this.createSession(sessionId);
        this.log('info', `创建新会话: ${sessionId}`);
      }

      // 处理消息
      const response = await this.processMessage(message);

      // 更新会话
      session.conversationHistory.push({ user: securityManager.sanitizeInput(message), bot: response });
      if (session.conversationHistory.length > 20) {
        session.conversationHistory.shift();
      }
      session.currentTopic = this.currentTopic;
      session.topicHistory = this.topicHistory;

      this.updateSession(sessionId, session);

      return response;
    } catch (error) {
      this.log('error', '处理会话消息错误:', error.message, error.stack);
      return '抱歉，我在处理您的请求时遇到了问题。';
    }
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions() {
    sessionManager.cleanupExpiredSessions();
  }

  /**
   * 获取会话数量
   * @returns {number} 会话数量
   */
  getSessionCount() {
    return sessionManager.getSessionCount();
  }

  /**
   * 清空所有会话
   */
  clearAllSessions() {
    sessionManager.clearAllSessions();
  }
}

module.exports = SmartAgent;
