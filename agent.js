const https = require('https');

class SmartAgent {
  constructor(config = {}) {
    // 从配置对象或默认值获取配置
    this.apiKey = config.apiKey || 'your_openai_api_key_here';
    this.name = config.name || 'SmartAgent';
    this.version = config.version || '1.0.0';
    this.logLevel = config.logLevel || 'info'; // 日志级别: debug, info, error
    
    // 请求缓存，避免重复请求相同的问题
    this.cache = new Map();
    this.cacheExpiry = 3600000; // 缓存过期时间：1小时
  }
  
  // 日志方法
  log(level, message) {
    if (['debug', 'info', 'error'].indexOf(level) >= ['debug', 'info', 'error'].indexOf(this.logLevel)) {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }

  generateResponse(prompt) {
    return new Promise((resolve, reject) => {
      try {
        // 检查缓存
        const cacheKey = prompt.trim().toLowerCase();
        if (this.cache.has(cacheKey)) {
          const cachedData = this.cache.get(cacheKey);
          if (Date.now() - cachedData.timestamp < this.cacheExpiry) {
            this.log('info', `从缓存获取响应: ${cacheKey}`);
            resolve(cachedData.response);
            return;
          } else {
            this.log('debug', `缓存过期，重新请求: ${cacheKey}`);
            this.cache.delete(cacheKey);
          }
        }
        
        this.log('info', '正在调用OpenAI API...');
        this.log('debug', 'API密钥:', this.apiKey ? '已设置' : '未设置');
        
        // 检查是否使用的是占位符API密钥
        if (this.apiKey === 'your_openai_api_key_here') {
          this.log('info', '使用模拟响应模式');
          // 模拟响应，根据不同的问题返回不同的回答
          let mockResponse = '';
          if (prompt.includes('你好') || prompt.includes('是谁') || prompt.includes('hi') || prompt.includes('hello')) {
            mockResponse = `你好！我是${this.name}，一个类似于DeepSeek的智能体。我能够理解并回答您的各种问题，提供准确且有用的信息。`;
          } else if (prompt.includes('人工智能') || prompt.includes('AI')) {
            mockResponse = '人工智能（AI）是指由人制造的机器所表现出的智能。它是计算机科学的一个分支，旨在创建能够模拟人类智能行为的系统。人工智能的应用包括语音识别、图像识别、自然语言处理、自动驾驶等多个领域。';
          } else if (prompt.includes('学习编程') || prompt.includes('编程入门')) {
            mockResponse = '学习编程的步骤：1. 选择一种适合初学者的编程语言，如Python；2. 学习基本语法和概念；3. 实践编写简单的程序；4. 参与项目开发；5. 不断学习和提升。推荐的学习资源包括在线教程、编程书籍和实践项目。';
          } else if (prompt.includes('天气') || prompt.includes('温度')) {
            mockResponse = '抱歉，我无法实时获取天气信息。您可以通过天气应用或网站查看当前天气情况。';
          } else if (prompt.includes('时间') || prompt.includes('几点')) {
            const now = new Date();
            mockResponse = `当前时间是 ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
          } else {
            mockResponse = `我是${this.name}，很高兴为您服务。您的问题是：${prompt}`;
          }
          this.log('debug', '模拟响应:', mockResponse);
          
          // 缓存模拟响应
          this.cache.set(cacheKey, {
            response: mockResponse,
            timestamp: Date.now()
          });
          
          resolve(mockResponse);
          return;
        }
        
        const postData = JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `你是${this.name}，一个类似于DeepSeek的智能体。你能够理解并回答用户的各种问题，提供准确且有用的信息。`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        });

        const options = {
          hostname: 'api.openai.com',
          port: 443,
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        this.log('debug', '正在发送请求到:', options.hostname + options.path);
        this.log('debug', '请求方法:', options.method);
        this.log('debug', '请求头:', JSON.stringify(options.headers, null, 2));
        this.log('debug', '请求体长度:', Buffer.byteLength(postData));
        
        const req = https.request(options, (res) => {
          this.log('info', 'API响应状态:', res.statusCode);
          this.log('debug', '响应头:', JSON.stringify(res.headers, null, 2));
          
          let data = '';
          res.on('data', (chunk) => {
            this.log('debug', '收到数据块，长度:', chunk.length);
            data += chunk;
          });

          res.on('end', () => {
            this.log('debug', '响应结束，总数据长度:', data.length);
            try {
              this.log('debug', '响应数据:', data);
              const responseData = JSON.parse(data);
              if (res.statusCode !== 200) {
                this.log('error', 'API错误:', responseData);
                resolve('抱歉，我在处理您的请求时遇到了问题。');
              } else {
                this.log('info', 'API响应成功，获取到回复');
                const response = responseData.choices[0].message.content;
                
                // 缓存API响应
                this.cache.set(cacheKey, {
                  response: response,
                  timestamp: Date.now()
                });
                
                resolve(response);
              }
            } catch (parseError) {
              this.log('error', '解析响应失败:', parseError);
              resolve('抱歉，我在处理您的请求时遇到了问题。');
            }
          });
        });

        req.on('error', (error) => {
          this.log('error', '请求错误:', error.message);
          this.log('debug', '错误堆栈:', error.stack);
          resolve('抱歉，我在处理您的请求时遇到了问题。');
        });

        req.on('timeout', () => {
          this.log('error', '请求超时');
          req.destroy();
          resolve('抱歉，请求超时，请稍后再试。');
        });

        req.setTimeout(30000); // 30秒超时
        
        this.log('debug', '正在发送请求...');
        req.write(postData);
        req.end();
        this.log('debug', '请求已发送');
      } catch (error) {
        this.log('error', 'Error generating response:', error.message);
        this.log('debug', '错误堆栈:', error.stack);
        resolve('抱歉，我在处理您的请求时遇到了问题。');
      }
    });
  }

  async processMessage(message) {
    this.log('info', `[${this.name}] 收到消息: ${message}`);
    const response = await this.generateResponse(message);
    this.log('info', `[${this.name}] 回复: ${response}`);
    return response;
  }
}

module.exports = SmartAgent;