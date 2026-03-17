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
    this.version = config.version || '2.0.0'; // 升级版本号
    this.logLevel = config.logLevel || 'info';
    this.model = config.model || 'gpt-3.5-turbo';
    this.provider = config.provider || 'openai';
    
    // 初始化模块
    this.knowledgeManager = new KnowledgeManager();
    this.cacheManager = new CacheManager({
      cacheExpiry: 3600000, // 默认1小时
      cacheSizeLimit: 1000 // 缓存大小限制
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
    this.learningEnabled = true;
    
    // 情感分析
    this.sentimentAnalysisEnabled = true;
    
    // 话题跟踪
    this.topicTrackingEnabled = true;
    this.currentTopic = null;
    this.topicHistory = [];
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
          // 构建包含对话历史的提示
          const context = this.buildContext(prompt);
          // 调用API
          response = await this.apiManager.callAPI(
            context, 
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
    const cleanMessage = message.toLowerCase().trim();
    
    if (cleanMessage.includes('记住') || cleanMessage.includes('学习') || cleanMessage.includes('添加知识')) {
      return 'learning';
    } else if (cleanMessage.includes('切换到') && (cleanMessage.includes('模式') || cleanMessage.includes('mode'))) {
      return 'mode_switch';
    } else if (cleanMessage.includes('你好') || cleanMessage.includes('嗨') || cleanMessage.includes('哈喽')) {
      return 'greeting';
    } else if (cleanMessage.includes('再见') || cleanMessage.includes('拜拜') || cleanMessage.includes('晚安')) {
      return 'farewell';
    } else if (cleanMessage.includes('计算') || cleanMessage.includes('+') || cleanMessage.includes('-') || cleanMessage.includes('*') || cleanMessage.includes('/') || cleanMessage.includes('=')) {
      return 'calculation';
    } else if (cleanMessage.includes('天气') || cleanMessage.includes('温度')) {
      return 'weather';
    } else if (cleanMessage.includes('时间') || cleanMessage.includes('日期')) {
      return 'datetime';
    } else if (cleanMessage.includes('笑话') || cleanMessage.includes('搞笑') || cleanMessage.includes('幽默')) {
      return 'joke';
    } else if (cleanMessage.includes('帮助') || cleanMessage.includes('帮助我') || cleanMessage.includes('怎么')) {
      return 'help';
    } else if (cleanMessage.includes('设置') || cleanMessage.includes('偏好') || cleanMessage.includes('配置')) {
      return 'settings';
    } else {
      return 'general';
    }
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
    
    const cleanMessage = message.toLowerCase().trim();
    
    // 积极情感关键词
    const positiveKeywords = ['高兴', '开心', '快乐', '喜欢', '爱', '好', '棒', '优秀', '感谢', '谢谢', '不错', '很好', '完美'];
    // 消极情感关键词
    const negativeKeywords = ['伤心', '难过', '生气', '讨厌', '恨', '坏', '差', '糟糕', '失望', '遗憾', '不好', '不行', '失败'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    for (const keyword of positiveKeywords) {
      if (cleanMessage.includes(keyword)) {
        positiveScore++;
      }
    }
    
    for (const keyword of negativeKeywords) {
      if (cleanMessage.includes(keyword)) {
        negativeScore++;
      }
    }
    
    if (positiveScore > negativeScore) {
      return 'positive';
    } else if (negativeScore > positiveScore) {
      return 'negative';
    } else {
      return 'neutral';
    }
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
    
    const cleanMessage = message.toLowerCase().trim();
    
    // 话题关键词
    const topics = {
      '科技': ['科技', '技术', '互联网', 'AI', '人工智能', '计算机', '手机', '软件', '硬件'],
      '娱乐': ['电影', '音乐', '游戏', '明星', '体育', '旅游', '美食', '购物'],
      '学习': ['学习', '教育', '考试', '学校', '课程', '作业', '知识'],
      '工作': ['工作', '职场', '职业', '面试', '公司', '加班', '薪资'],
      '生活': ['生活', '家庭', '健康', '健身', '减肥', '睡眠', '心情']
    };
    
    let currentTopic = null;
    let maxScore = 0;
    
    for (const [topic, keywords] of Object.entries(topics)) {
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
      this.currentTopic = currentTopic;
      if (!this.topicHistory.includes(currentTopic)) {
        this.topicHistory.push(currentTopic);
        if (this.topicHistory.length > 5) {
          this.topicHistory.shift();
        }
      }
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
      this.log('info', `[${this.name}] 收到消息: ${message}`);
      
      // 验证输入
      if (!message || typeof message !== 'string' || message.trim() === '') {
        this.log('error', '无效的消息: 消息为空或不是字符串');
        return '抱歉，我无法处理空的请求。';
      }
      
      // 识别用户意图
      const intent = this.identifyUserIntent(message);
      this.log('debug', `用户意图: ${intent}`);
      
      // 分析用户情感
      const sentiment = this.analyzeSentiment(message);
      this.log('debug', `用户情感: ${sentiment}`);
      
      // 跟踪话题
      const topic = this.trackTopic(message);
      if (topic) {
        this.log('debug', `当前话题: ${topic}`);
      }
      
      // 处理学习意图
      if (intent === 'learning' && this.learningEnabled) {
        const learnResult = this.learnFromUser(message);
        if (learnResult) {
          this.log('info', `学习成功: ${message}`);
          return learnResult;
        }
      }
      
      // 处理模式切换意图
      if (intent === 'mode_switch') {
        if (message.includes('友好')) {
          return this.setChatMode('friendly');
        } else if (message.includes('专业')) {
          return this.setChatMode('professional');
        } else if (message.includes('casual')) {
          return this.setChatMode('casual');
        } else if (message.includes('默认')) {
          return this.setChatMode('default');
        }
      }
      
      // 处理设置意图
      if (intent === 'settings') {
        const settingsResult = this.handleUserPreferences(message);
        if (settingsResult) {
          this.log('info', `设置成功: ${message}`);
          return settingsResult;
        }
      }
      
      // 处理帮助意图
      if (intent === 'help') {
        return '我可以帮助您做以下事情：\n1. 回答各种问题\n2. 进行数学计算\n3. 单位转换\n4. 讲笑话\n5. 学习新知识\n6. 切换对话模式\n7. 设置偏好\n\n请问您需要什么帮助？';
      }
      
      const response = await this.generateResponse(message);
      
      // 根据情感调整响应
      if (sentiment === 'negative') {
        const adjustedResponse = `我理解您现在可能感到不太开心。${response}`;
        this.log('info', `[${this.name}] 回复: ${adjustedResponse}`);
        return adjustedResponse;
      }
      
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
      provider: this.provider
    };
  }
}

module.exports = SmartAgent;
