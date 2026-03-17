// 工具函数

/**
 * 生成随机响应
 * @param {Array} responses - 响应数组
 * @returns {string} 随机选择的响应
 */
function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * 检测用户情绪
 * @param {string} prompt - 用户输入
 * @returns {string} 情绪类型
 */
function detectEmotion(prompt) {
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

/**
 * 响应情绪
 * @param {string} emotion - 情绪类型
 * @returns {string|null} 情绪响应
 */
function respondToEmotion(emotion) {
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
    return getRandomResponse(emoSuggestions);
  }
  return null;
}

/**
 * 处理计算请求
 * @param {string} cleanPrompt - 清理后的用户输入
 * @returns {string|null} 计算结果
 */
function handleCalculation(cleanPrompt) {
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
        return getRandomResponse(calcResponses);
      }
    } catch (e) {
      return '抱歉，计算时出了点小问题...';
    }
  }
  return null;
}

/**
 * 处理单位转换
 * @param {string} cleanPrompt - 清理后的用户输入
 * @param {string} prompt - 原始用户输入
 * @returns {string|null} 转换结果
 */
function handleUnitConversion(cleanPrompt, prompt) {
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
        return getRandomResponse(unitResponses);
      }
    }
  }
  return null;
}

/**
 * 生成聊天响应
 * @param {string} prompt - 用户输入
 * @param {string} cleanPrompt - 清理后的用户输入
 * @param {string} userName - 用户名
 * @returns {string} 聊天响应
 */
function generateChatResponse(prompt, cleanPrompt, userName) {
  const emotion = detectEmotion(prompt);
  const emotionResponse = respondToEmotion(emotion);
  
  if (emotionResponse && emotion !== 'neutral') {
    return emotionResponse;
  }

  if (cleanPrompt.includes('我叫') || cleanPrompt.includes('我的名字是')) {
    const nameMatch = prompt.match(/(?:我叫|我的名字是)\s*([^\s，。！？,.!?]+)/);
    if (nameMatch) {
      return `很高兴认识你，${nameMatch[1]}！以后我就这么叫你啦 😊`;
    }
  }

  if (userName && (cleanPrompt.includes('我是谁') || cleanPrompt.includes('我的名字'))) {
    return `你是${userName}呀！我记得你 😊`;
  }

  const chatResponses = [
    '嗯，我在听呢～继续说吧！',
    '有意思！能告诉我更多吗？',
    '原来是这样～还有呢？',
    '我明白了，你接着说！',
    '嗯嗯，我懂你的意思。',
    '好的，我在认真听着呢！'
  ];

  return getRandomResponse(chatResponses);
}

/**
 * 生成 fallback 响应
 * @returns {string} fallback 响应
 */
function getFallbackResponse() {
  const responses = [
    '嗯...这个问题我得想想。要不我们聊点别的？',
    '这个话题有点超出我的知识库了，换个话题聊聊？',
    '不好意思，我暂时回答不了这个问题...你想让我帮你计算点什么吗？',
    '让我想想...要不试试问我一些简单的问题？比如计算或者单位转换？',
    '这个问题很有意思！不过我现在还回答不了...要不要听个笑话？'
  ];
  return getRandomResponse(responses);
}

/**
 * 提取学习关键词
 * @param {string} content - 学习内容
 * @returns {string} 关键词
 */
function extractLearningKeyword(content) {
  // 提取关键字
  // 对于中文，使用更智能的关键词提取
  // 对于英文，跳过冠词，提取有意义的词
  const firstChineseMatch = content.match(/^[\u4e00-\u9fa5]+/);
  const firstEnglishMatch = content.match(/^[a-zA-Z]+/);
  
  if (firstChineseMatch) {
    // 对于中文，尝试提取更准确的关键词
    const chineseContent = firstChineseMatch[0];
    
    // 尝试匹配常见的结构：名词 + 是 + 描述
    const nounMatch = chineseContent.match(/^([\u4e00-\u9fa5]{1,3})(是|有|在|为|属于)/);
    if (nounMatch && nounMatch[1]) {
      return nounMatch[1];
    }
    
    // 如果没有匹配到特定结构，取前1-3个字符作为关键词
    if (chineseContent.length <= 2) {
      return chineseContent;
    } else {
      return chineseContent.substring(0, 3);
    }
  } else if (firstEnglishMatch) {
    // 对于英文，跳过常见冠词和介词
    const commonArticles = ['the', 'a', 'an', 'in', 'on', 'at', 'for', 'with', 'by'];
    let words = content.split(/\s+/);
    
    // 找到第一个不是冠词或介词的词
    for (let word of words) {
      if (!commonArticles.includes(word.toLowerCase())) {
        return word;
      }
    }
    
    // 如果所有词都是冠词或介词，取第一个词
    return firstEnglishMatch[0];
  } else {
    // 如果都不是，取整个内容的前两个字符作为关键字
    return content.substring(0, 2);
  }
}

/**
 * 计算知识库匹配度
 * @param {string} cleanPrompt - 清理后的用户输入
 * @param {Array} keywords - 关键词数组
 * @returns {number} 匹配度得分
 */
function calculateMatchScore(cleanPrompt, keywords) {
  let score = 0;
  for (const kw of keywords) {
    if (cleanPrompt.includes(kw.toLowerCase())) {
      // 计算匹配度：关键词长度越长，匹配度越高
      score += kw.length;
      // 完全匹配的得分更高
      if (cleanPrompt === kw.toLowerCase()) {
        score += 10;
      }
    }
  }
  return score;
}

/**
 * 处理天气查询
 * @param {string} cleanPrompt - 清理后的用户输入
 * @returns {string|null} 天气查询响应
 */
function handleWeatherQuery(cleanPrompt) {
  const weatherKeywords = ['天气', 'temperature', '气温', '今天天气', '天气怎么样', '天气预报'];
  if (weatherKeywords.some(kw => cleanPrompt.includes(kw))) {
    const responses = [
      '抱歉，我目前无法获取实时天气数据。您可以使用天气APP或访问天气网站来查询最新天气情况。',
      '由于没有天气API密钥，我无法提供实时天气信息。建议您使用专业的天气应用查询。',
      '天气查询功能需要接入天气API，当前处于模拟模式，无法提供实时数据。'
    ];
    return getRandomResponse(responses);
  }
  return null;
}

/**
 * 处理新闻资讯
 * @param {string} cleanPrompt - 清理后的用户输入
 * @returns {string|null} 新闻资讯响应
 */
function handleNewsQuery(cleanPrompt) {
  const newsKeywords = ['新闻', '资讯', 'news', '最新新闻', '热点新闻', '新闻资讯'];
  if (newsKeywords.some(kw => cleanPrompt.includes(kw))) {
    const responses = [
      '抱歉，我目前无法获取实时新闻数据。您可以访问新闻网站或使用新闻APP来了解最新资讯。',
      '由于没有新闻API密钥，我无法提供实时新闻信息。建议您使用专业的新闻应用查询。',
      '新闻资讯功能需要接入新闻API，当前处于模拟模式，无法提供实时数据。'
    ];
    return getRandomResponse(responses);
  }
  return null;
}

/**
 * 处理日期计算
 * @param {string} cleanPrompt - 清理后的用户输入
 * @returns {string|null} 日期计算响应
 */
function handleDateCalculation(cleanPrompt) {
  // 匹配日期计算模式，如"今天是2024年10月15日，3天后是几号"
  const dateCalcMatch = cleanPrompt.match(/(\d+)天(后|前)/);
  if (dateCalcMatch) {
    try {
      const days = parseInt(dateCalcMatch[1]);
      const direction = dateCalcMatch[2];
      const now = new Date();
      
      if (direction === '后') {
        now.setDate(now.getDate() + days);
      } else if (direction === '前') {
        now.setDate(now.getDate() - days);
      }
      
      const resultDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
      const responses = [
        `计算出来啦！${days}天${direction}是${resultDate}`,
        `让我算一下... ${days}天${direction}是${resultDate}`,
        `嗯... ${days}天${direction}应该是${resultDate}`
      ];
      return getRandomResponse(responses);
    } catch (e) {
      return '抱歉，日期计算时出了点小问题...';
    }
  }
  return null;
}

module.exports = {
  getRandomResponse,
  detectEmotion,
  respondToEmotion,
  handleCalculation,
  handleUnitConversion,
  handleWeatherQuery,
  handleNewsQuery,
  handleDateCalculation,
  generateChatResponse,
  getFallbackResponse,
  extractLearningKeyword,
  calculateMatchScore
};