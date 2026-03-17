const https = require('https');

/**
 * API模块 - 处理外部API调用
 */
class APIManager {
  constructor(config = {}) {
    this.apiKey = config.apiKey || 'your_openai_api_key_here';
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
   * 调用OpenAI API
   * @param {string} prompt - 用户输入
   * @param {string} cacheKey - 缓存键
   * @param {object} cache - 缓存对象
   * @param {string} agentName - 智能体名称
   * @returns {Promise<string>} API响应
   */
  callOpenAIAPI(prompt, cacheKey, cache, agentName) {
    return new Promise((resolve) => {
      try {
        const postData = JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `你是${agentName}，一个智能对话助手。你能够理解并回答用户的各种问题，提供准确且有用的信息，并且能够进行自然的对话。`
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
          },
          timeout: 30000
        };

        this.log('debug', '正在发送请求到:', options.hostname + options.path);
        
        const req = https.request(options, (res) => {
          this.log('info', 'API响应状态:', res.statusCode);
          
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              // 检查响应长度
              if (!data || data.length === 0) {
                this.log('error', 'API响应为空');
                resolve('抱歉，我在处理您的请求时遇到了问题。');
                return;
              }
              
              const responseData = JSON.parse(data);
              if (res.statusCode !== 200) {
                this.log('error', 'API错误:', responseData);
                // 根据错误类型返回不同的提示
                if (responseData.error && responseData.error.code === 'rate_limit_exceeded') {
                  resolve('抱歉，API调用次数超限，请稍后再试。');
                } else if (responseData.error && responseData.error.code === 'invalid_api_key') {
                  resolve('抱歉，API密钥无效，请检查配置。');
                } else {
                  resolve('抱歉，我在处理您的请求时遇到了问题。');
                }
              } else {
                this.log('info', 'API响应成功');
                if (responseData.choices && responseData.choices.length > 0) {
                  const response = responseData.choices[0].message.content;
                  // 安全地设置缓存
                  if (cache) {
                    cache.setCache(cacheKey, response);
                  }
                  resolve(response);
                } else {
                  this.log('error', 'API响应格式错误: 缺少choices字段');
                  resolve('抱歉，我在处理您的请求时遇到了问题。');
                }
              }
            } catch (parseError) {
              this.log('error', '解析响应失败:', parseError);
              resolve('抱歉，我在处理您的请求时遇到了问题。');
            }
          });
        });

        req.on('error', (error) => {
          this.log('error', '请求错误:', error.message);
          // 根据错误类型返回不同的提示
          if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            resolve('抱歉，网络连接失败，请检查您的网络连接。');
          } else {
            resolve('抱歉，我在处理您的请求时遇到了问题。');
          }
        });

        req.on('timeout', () => {
          this.log('error', '请求超时');
          req.destroy();
          resolve('抱歉，请求超时，请稍后再试。');
        });

        req.write(postData);
        req.end();
      } catch (error) {
        this.log('error', 'API请求准备错误:', error.message);
        resolve('抱歉，我在处理您的请求时遇到了问题。');
      }
    });
  }

  /**
   * 检查API密钥是否有效
   * @returns {boolean} API密钥是否有效
   */
  isApiKeyValid() {
    return this.apiKey && this.apiKey !== 'your_openai_api_key_here';
  }
}

module.exports = APIManager;
