// 智能Agent核心功能
class SmartAgent {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 3600000;
    this.conversationHistory = [];
    this.maxHistoryLength = 10;
    this.userName = null;
    
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
  }

  getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  detectEmotion(prompt) {
    const lower = prompt.toLowerCase();
    if (lower.includes('开心') || lower.includes('高兴') || lower.includes('快乐') || lower.includes('哈哈')) {
      return 'happy';
    } else if (lower.includes('难过') || lower.includes('伤心') || lower.includes('生气') || lower.includes('郁闷')) {
      return 'sad';
    } else if (lower.includes('累') || lower.includes('困') || lower.includes('疲倦')) {
      return 'tired';
    } else if (lower.includes('谢谢') || lower.includes('感谢') || lower.includes('好棒') || lower.includes('厉害')) {
      return 'grateful';
    }
    return 'neutral';
  }

  respondToEmotion(emotion) {
    const responses = {
      happy: [
        '看到您开心我也很高兴！😊',
        '真好！保持这份好心情！✨',
        '开心就好！有什么我可以帮您的吗？'
      ],
      sad: [
        '抱抱您～希望能让您感觉好一点 💙',
        '听起来您心情不好，想聊聊吗？',
        '都会好起来的！我在这里陪着您'
      ],
      tired: [
        '辛苦了！注意休息哦 😴',
        '累了就歇一会儿吧，身体最重要！',
        '好好休息一下，恢复精力！'
      ],
      grateful: [
        '您太客气了！能帮到您我很开心 😊',
        '不客气！这是我应该做的～',
        '谢谢您的认可！我会继续努力的！'
      ],
      neutral: []
    };
    const emoSuggestions = responses[emotion];
    if (emoSuggestions && emoSuggestions.length > 0) {
      return this.getRandomResponse(emoSuggestions);
    }
    return null;
  }

  generateChatResponse(prompt, cleanPrompt) {
    const emotion = this.detectEmotion(prompt);
    const emotionResponse = this.respondToEmotion(emotion);
    
    if (emotionResponse && emotion !== 'neutral') {
      return emotionResponse;
    }

    if (cleanPrompt.includes('我叫') || cleanPrompt.includes('我的名字是')) {
      const nameMatch = prompt.match(/(?:我叫|我的名字是)\s*([^\s，。！？,.!?]+)/);
      if (nameMatch) {
        this.userName = nameMatch[1];
        return `很高兴认识你，${this.userName}！以后我就这么叫你啦 😊`;
      }
    }

    if (this.userName && (cleanPrompt.includes('我是谁') || cleanPrompt.includes('我的名字'))) {
      return `你是${this.userName}呀！我记得你 😊`;
    }

    const chatResponses = [
      '嗯，我在听呢～继续说吧！',
      '有意思！能告诉我更多吗？',
      '原来是这样～还有呢？',
      '我明白了，你接着说！',
      '嗯嗯，我懂你的意思。',
      '好的，我在认真听着呢！'
    ];

    return this.getRandomResponse(chatResponses);
  }

  handleCalculation(cleanPrompt) {
    const calcMatch = cleanPrompt.match(/(\d+\.?\d*)\s*[+\-*/]\s*(\d+\.?\d*)/);
    if (calcMatch) {
      try {
        const num1 = parseFloat(calcMatch[1]);
        const num2 = parseFloat(calcMatch[2]);
        let result;
        let operator;
        
        if (cleanPrompt.includes('+')) {
          result = num1 + num2;
          operator = '加';
        } else if (cleanPrompt.includes('-')) {
          result = num1 - num2;
          operator = '减';
        } else if (cleanPrompt.includes('*')) {
          result = num1 * num2;
          operator = '乘';
        } else if (cleanPrompt.includes('/')) {
          if (num2 === 0) {
            return '抱歉，除数不能为零哦！';
          }
          result = num1 / num2;
          operator = '除';
        }
        
        if (result !== undefined) {
          const calcResponses = [
            `让我算一下... ${num1} ${operator} ${num2} = ${result}`,
            `嗯... ${num1} ${operator} ${num2} 等于 ${result}`,
            `算出来啦！${num1} ${operator} ${num2} = ${result}`
          ];
          return this.getRandomResponse(calcResponses);
        }
      } catch (e) {
        return '抱歉，计算时出了点小问题...';
      }
    }
    return null;
  }

  handleUnitConversion(cleanPrompt, prompt) {
    const unitKeywords = ['厘米', '米', '千克', '克', '摄氏度', '华氏度', '公里', '英里'];
    if (unitKeywords.some(kw => cleanPrompt.includes(kw))) {
      const numberMatch = prompt.match(/(\d+\.?\d*)/);
      if (numberMatch) {
        const num = parseFloat(numberMatch[1]);
        let result = null;
        
        if (cleanPrompt.includes('厘米') && cleanPrompt.includes('米')) {
          if (cleanPrompt.indexOf('厘米') < (cleanPrompt.indexOf('等于') !== -1 ? cleanPrompt.indexOf('等于') : cleanPrompt.length)) {
            result = `${num}厘米 = ${num / 100}米`;
          } else {
            result = `${num}米 = ${num * 100}厘米`;
          }
        } else if (cleanPrompt.includes('千克') && cleanPrompt.includes('克')) {
          if (cleanPrompt.indexOf('千克') < (cleanPrompt.indexOf('等于') !== -1 ? cleanPrompt.indexOf('等于') : cleanPrompt.length)) {
            result = `${num}千克 = ${num * 1000}克`;
          } else {
            result = `${num}克 = ${num / 1000}千克`;
          }
        } else if (cleanPrompt.includes('摄氏度') && cleanPrompt.includes('华氏度')) {
          if (cleanPrompt.indexOf('摄氏度') < (cleanPrompt.indexOf('等于') !== -1 ? cleanPrompt.indexOf('等于') : cleanPrompt.length)) {
            result = `${num}摄氏度 = ${(num * 9/5 + 32).toFixed(1)}华氏度`;
          } else {
            result = `${num}华氏度 = ${((num - 32) * 5/9).toFixed(1)}摄氏度`;
          }
        } else if (cleanPrompt.includes('公里') && cleanPrompt.includes('英里')) {
          if (cleanPrompt.indexOf('公里') < (cleanPrompt.indexOf('等于') !== -1 ? cleanPrompt.indexOf('等于') : cleanPrompt.length)) {
            result = `${num}公里 = ${(num * 0.621371).toFixed(2)}英里`;
          } else {
            result = `${num}英里 = ${(num / 0.621371).toFixed(2)}公里`;
          }
        } else if (cleanPrompt.includes('厘米')) {
          result = `${num}厘米 = ${num / 100}米`;
        } else if (cleanPrompt.includes('米')) {
          result = `${num}米 = ${num * 100}厘米`;
        } else if (cleanPrompt.includes('千克')) {
          result = `${num}千克 = ${num * 1000}克`;
        } else if (cleanPrompt.includes('克')) {
          result = `${num}克 = ${num / 1000}千克`;
        } else if (cleanPrompt.includes('摄氏度')) {
          result = `${num}摄氏度 = ${(num * 9/5 + 32).toFixed(1)}华氏度`;
        } else if (cleanPrompt.includes('华氏度')) {
          result = `${num}华氏度 = ${((num - 32) * 5/9).toFixed(1)}摄氏度`;
        } else if (cleanPrompt.includes('公里')) {
          result = `${num}公里 = ${(num * 0.621371).toFixed(2)}英里`;
        } else if (cleanPrompt.includes('英里')) {
          result = `${num}英里 = ${(num / 0.621371).toFixed(2)}公里`;
        }
        
        if (result) {
          const unitResponses = [
            `好的，这就帮您转换～ ${result}`,
            `让我看看... ${result}`,
            `转换好啦！${result}`
          ];
          return this.getRandomResponse(unitResponses);
        }
      }
    }
    return null;
  }

  getKnowledgeResponse(cleanPrompt) {
    // 检测对话模式切换
    if (cleanPrompt.includes('切换到') && (cleanPrompt.includes('模式') || cleanPrompt.includes('mode'))) {
      if (cleanPrompt.includes('友好')) {
        return { response: this.setChatMode('friendly'), skipCache: false };
      } else if (cleanPrompt.includes('专业')) {
        return { response: this.setChatMode('professional'), skipCache: false };
      } else if (cleanPrompt.includes('casual')) {
        return { response: this.setChatMode('casual'), skipCache: false };
      } else if (cleanPrompt.includes('默认')) {
        return { response: this.setChatMode('default'), skipCache: false };
      }
    }
    
    const knowledge = {
      greetings: {
        keywords: ['你好', '您好', 'hi', 'hello', '早上好', '下午好', '晚上好', '嗨'],
        responses: [
          '你好呀！很高兴见到你 😊 有什么我可以帮你的吗？',
          '嗨！今天过得怎么样？',
          '你好！我是SmartAgent，随时为你服务～',
          this.userName ? `${this.userName}你好！今天想聊点什么？` : '你好！想聊点什么吗？'
        ]
      },
      selfIntro: {
        keywords: ['你是谁', '介绍一下你自己', '你叫什么', 'what is your name'],
        responses: [
          `我是SmartAgent，一个智能对话助手。我可以陪你聊天、帮你计算、转换单位，还能回答一些问题！`,
          `我叫SmartAgent，是你的AI小伙伴！我能做很多事情呢，要不要试试看？`
        ]
      },
      capabilities: {
        keywords: ['你能做什么', '功能', '能力', 'help', '帮助', '你会什么'],
        responses: [
          '我可以做很多事情哦：\n• 陪你聊天\n• 简单的数学计算\n• 单位转换\n• 讲笑话\n• 回答一些常见问题\n想试试哪个？',
          '我的能力包括：聊天、计算、单位转换、讲笑话...你想让我做什么呢？'
        ]
      },
      thanks: {
        keywords: ['谢谢', '感谢', 'thanks', 'thank you', '多谢', '3q'],
        responses: [
          '不客气！能帮到你我很开心 😊',
          '不用谢～随时为你服务！',
          '太客气啦！还有其他需要吗？'
        ]
      },
      goodbye: {
        keywords: ['再见', '拜拜', 'bye', 'goodbye', '回见', '下次见'],
        responses: [
          '再见！期待下次聊天～ 👋',
          '拜拜！照顾好自己哦！',
          '下次见！祝你有美好的一天！'
        ]
      },
      time: {
        keywords: ['几点', '现在时间', '时间是多少', 'what time'],
        responses: [
          () => { const now = new Date(); return `现在是 ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} 哦～`; }
        ]
      },
      date: {
        keywords: ['今天几号', '今天星期几', 'what date', '今天是'],
        responses: [
          () => { 
            const now = new Date(); 
            const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
            return `今天是 ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日，${days[now.getDay()]}`; 
          }
        ]
      },
      jokes: {
        keywords: ['笑话', 'joke', '讲个笑话', '逗我笑', '讲笑话'],
        responses: [
          '好的，给你讲个笑话：程序员的女朋友问："你能给我写首诗吗？" 程序员回答："01001000 01100101 01101100 01101100 01101111"（这是二进制的Hello）',
          '程序员最讨厌的三件事：1. 数数；2. 数组下标从0开始；3. 数数；4. 数组下标从1开始',
          '问：为什么程序员总是分不清万圣节和圣诞节？答：因为 Oct 31 = Dec 25（八进制31等于十进制25）',
          '生活就像编程，充满了bug，但我们可以不断调试优化！💪'
        ],
        skipCache: true
      },
      aiKnowledge: {
        keywords: ['人工智能', 'ai', 'AI', '什么是人工智能'],
        responses: [
          '人工智能（AI）是计算机科学的重要分支，旨在创建能模拟人类智能的系统。现在AI已经应用在很多领域啦，比如语音识别、自动驾驶等等！',
          '人工智能是研究如何让计算机去做过去只有人类才能做的事情。它包括机器学习、深度学习、自然语言处理、计算机视觉等多个子领域。',
          'AI正在改变我们的世界！从智能手机上的语音助手，到电商网站的个性化推荐，从医疗诊断到自动驾驶，AI的应用越来越广泛。'
        ]
      }
    };

    for (const [cat, data] of Object.entries(knowledge)) {
      if (data.keywords.some(kw => cleanPrompt.includes(kw.toLowerCase()))) {
        let response;
        if (typeof data.responses[0] === 'function') {
          response = data.responses[0]();
        } else {
          response = this.getRandomResponse(data.responses);
        }
        return { response, skipCache: data.skipCache || false };
      }
    }
    return null;
  }

  getFallbackResponse() {
    const responses = [
      '嗯...这个问题我得想想。要不我们聊点别的？',
      '这个话题有点超出我的知识库了，换个话题聊聊？',
      '不好意思，我暂时回答不了这个问题...你想让我帮你计算点什么吗？',
      '让我想想...要不试试问我一些简单的问题？比如计算或者单位转换？',
      '这个问题很有意思！不过我现在还回答不了...要不要听个笑话？'
    ];
    return this.getRandomResponse(responses);
  }

  addToHistory(userMessage, botResponse) {
    this.conversationHistory.push({ user: userMessage, bot: botResponse });
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory.shift();
    }
  }

  setChatMode(mode) {
    if (this.chatModes[mode]) {
      this.chatMode = mode;
      return `已切换到${this.chatModes[mode].name}！`;
    } else {
      return `不支持的对话模式。支持的模式：${Object.keys(this.chatModes).join('、')}`;
    }
  }

  getChatMode() {
    return this.chatModes[this.chatMode].name;
  }

  applyChatMode(response) {
    const mode = this.chatModes[this.chatMode];
    return mode.prefix + response + mode.suffix;
  }

  generateResponse(prompt) {
    return new Promise((resolve) => {
      const cacheKey = prompt.trim().toLowerCase();
      if (this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey);
        if (Date.now() - cachedData.timestamp < this.cacheExpiry) {
          resolve(cachedData.response);
          return;
        } else {
          this.cache.delete(cacheKey);
        }
      }
      
      const cleanPrompt = prompt.toLowerCase().trim();
      let mockResponse = '';
      let skipCache = false;
      
      const knowledgeResult = this.getKnowledgeResponse(cleanPrompt);
      if (knowledgeResult) {
        mockResponse = knowledgeResult.response;
        skipCache = knowledgeResult.skipCache;
      } else {
        const calcResult = this.handleCalculation(cleanPrompt);
        if (calcResult) {
          mockResponse = calcResult;
        } else {
          const unitResult = this.handleUnitConversion(cleanPrompt, prompt);
          if (unitResult) {
            mockResponse = unitResult;
          } else {
            if (cleanPrompt.length < 15 || 
                cleanPrompt.includes('嗯') || 
                cleanPrompt.includes('哦') || 
                cleanPrompt.includes('啊') ||
                cleanPrompt.includes('哈')) {
              mockResponse = this.generateChatResponse(prompt, cleanPrompt);
            } else {
              mockResponse = this.getFallbackResponse();
            }
          }
        }
      }
      
      if (!skipCache) {
        this.cache.set(cacheKey, {
          response: mockResponse,
          timestamp: Date.now()
        });
      }
      
      const finalResponse = this.applyChatMode(mockResponse);
      this.addToHistory(prompt, finalResponse);
      resolve(finalResponse);
    });
  }

  async processMessage(message) {
    const response = await this.generateResponse(message);
    return response;
  }
}

// 页面逻辑
Page({
  data: {
    messages: [
      {
        type: 'bot',
        content: '你好！我是SmartAgent，一个智能对话助手。我能够理解并回答您的各种问题，提供准确且有用的信息。请问有什么可以帮助您的？',
        time: new Date().toLocaleTimeString()
      }
    ],
    inputValue: '',
    isTyping: false,
    showQuickReplies: true,
    quickReplies: ['你好', '讲个笑话', '123 + 456', '100厘米等于多少米', '什么是人工智能', '你能做什么']
  },

  onLoad() {
    this.agent = new SmartAgent();
  },

  handleInput(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  handleQuickReply(e) {
    const text = e.currentTarget.dataset.text;
    this.setData({
      inputValue: text
    });
    this.sendMessage();
  },

  async sendMessage() {
    const message = this.data.inputValue.trim();
    if (!message) return;
    
    // 添加用户消息
    const now = new Date().toLocaleTimeString();
    this.setData({
      messages: [...this.data.messages, {
        type: 'user',
        content: message,
        time: now
      }],
      inputValue: '',
      isTyping: true
    });
    
    // 滚动到底部
    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.select('#chat-messages').boundingClientRect();
      query.select('#chat-messages').scrollOffset();
      query.exec((res) => {
        wx.pageScrollTo({
          scrollTop: res[1].scrollHeight,
          duration: 300
        });
      });
    }, 100);
    
    try {
      // 模拟AI思考时间
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 调用智能Agent
      const response = await this.agent.processMessage(message);
      
      // 添加AI回复
      this.setData({
        messages: [...this.data.messages, {
          type: 'bot',
          content: response,
          time: new Date().toLocaleTimeString()
        }],
        isTyping: false
      });
      
      // 滚动到底部
      setTimeout(() => {
        const query = wx.createSelectorQuery();
        query.select('#chat-messages').boundingClientRect();
        query.select('#chat-messages').scrollOffset();
        query.exec((res) => {
          wx.pageScrollTo({
            scrollTop: res[1].scrollHeight,
            duration: 300
          });
        });
      }, 100);
    } catch (error) {
      console.error('Error:', error);
      this.setData({
        messages: [...this.data.messages, {
          type: 'bot',
          content: '抱歉，我在处理您的请求时遇到了问题。',
          time: new Date().toLocaleTimeString()
        }],
        isTyping: false
      });
    }
  }
});
