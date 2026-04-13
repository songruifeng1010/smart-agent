const https = require('https');
const http = require('http');

/**
 * API模块 - 处理外部API调用
 */
class APIManager {
  constructor(config = {}) {
    this.apiKey = config.apiKey || 'your_openai_api_key_here';
    this.logLevel = config.logLevel || 'info';
    this.model = config.model || 'gpt-3.5-turbo'; // 默认模型
    this.provider = config.provider || 'openai'; // 默认提供商: openai, anthropic, google, deepseek
    
    // 提供商配置
    this.providers = {
      openai: {
        baseURL: 'api.openai.com',
        path: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      },
      anthropic: {
        baseURL: 'api.anthropic.com',
        path: '/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      },
      google: {
        baseURL: 'generativelanguage.googleapis.com',
        path: '/v1/models/gemini-1.5-flash-lite:generateContent',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        }
      },
      deepseek: {
        baseURL: 'api.deepseek.com',
        path: '/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      },
      // 国内大模型
      zhipu: {
        baseURL: 'open.bigmodel.cn',
        path: '/api/messages',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      },
      baidu: {
        baseURL: 'aip.baidubce.com',
        path: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/eb-instant',
        headers: {
          'Content-Type': 'application/json'
        }
      },
      iflytek: {
        baseURL: 'spark-api.xf-yun.com',
        path: '/v2.1/chat',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      }
    };
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
          model: this.model,
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

        const providerConfig = this.providers.openai;
        const options = {
          hostname: providerConfig.baseURL,
          port: 443,
          path: providerConfig.path,
          method: 'POST',
          headers: {
            ...providerConfig.headers,
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
   * 调用Anthropic API
   * @param {string} prompt - 用户输入
   * @param {string} cacheKey - 缓存键
   * @param {object} cache - 缓存对象
   * @param {string} agentName - 智能体名称
   * @returns {Promise<string>} API响应
   */
  callAnthropicAPI(prompt, cacheKey, cache, agentName) {
    return new Promise((resolve) => {
      try {
        const postData = JSON.stringify({
          model: this.model || 'claude-3-sonnet-20240229',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          system: `你是${agentName}，一个智能对话助手。你能够理解并回答用户的各种问题，提供准确且有用的信息，并且能够进行自然的对话。`,
          temperature: 0.7,
          max_tokens: 1000
        });

        const providerConfig = this.providers.anthropic;
        const options = {
          hostname: providerConfig.baseURL,
          port: 443,
          path: providerConfig.path,
          method: 'POST',
          headers: {
            ...providerConfig.headers,
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
                resolve('抱歉，我在处理您的请求时遇到了问题。');
              } else {
                this.log('info', 'API响应成功');
                if (responseData.content && responseData.content.length > 0) {
                  const response = responseData.content[0].text;
                  // 安全地设置缓存
                  if (cache) {
                    cache.setCache(cacheKey, response);
                  }
                  resolve(response);
                } else {
                  this.log('error', 'API响应格式错误: 缺少content字段');
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
   * 调用Google Gemini API
   * @param {string} prompt - 用户输入
   * @param {string} cacheKey - 缓存键
   * @param {object} cache - 缓存对象
   * @param {string} agentName - 智能体名称
   * @returns {Promise<string>} API响应
   */
  callGoogleAPI(prompt, cacheKey, cache, agentName) {
    return new Promise((resolve) => {
      try {
        const postData = JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `你是${agentName}，一个智能对话助手。你能够理解并回答用户的各种问题，提供准确且有用的信息，并且能够进行自然的对话。\n\n用户问题: ${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        });

        const providerConfig = this.providers.google;
        const options = {
          hostname: providerConfig.baseURL,
          port: 443,
          path: providerConfig.path,
          method: 'POST',
          headers: {
            ...providerConfig.headers,
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
                resolve('抱歉，我在处理您的请求时遇到了问题。');
              } else {
                this.log('info', 'API响应成功');
                if (responseData.candidates && responseData.candidates.length > 0) {
                  const response = responseData.candidates[0].content.parts[0].text;
                  // 安全地设置缓存
                  if (cache) {
                    cache.setCache(cacheKey, response);
                  }
                  resolve(response);
                } else {
                  this.log('error', 'API响应格式错误: 缺少candidates字段');
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
   * 调用DeepSeek API
   * @param {string} prompt - 用户输入
   * @param {string} cacheKey - 缓存键
   * @param {object} cache - 缓存对象
   * @param {string} agentName - 智能体名称
   * @returns {Promise<string>} API响应
   */
  callDeepSeekAPI(prompt, cacheKey, cache, agentName) {
    return new Promise((resolve) => {
      try {
        const postData = JSON.stringify({
          model: this.model || 'deepseek-chat',
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

        const providerConfig = this.providers.deepseek;
        const options = {
          hostname: providerConfig.baseURL,
          port: 443,
          path: providerConfig.path,
          method: 'POST',
          headers: {
            ...providerConfig.headers,
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
                resolve('抱歉，我在处理您的请求时遇到了问题。');
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
   * 带重试的API调用
   * @param {function} apiCall - API调用函数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} retryDelay - 重试延迟（毫秒）
   * @returns {Promise<string>} API响应
   */
  async callWithRetry(apiCall, maxRetries = 2, retryDelay = 1000) {
    let retries = 0;
    while (retries <= maxRetries) {
      try {
        this.log('info', `API调用尝试 ${retries + 1}/${maxRetries + 1}`);
        return await apiCall();
      } catch (error) {
        retries++;
        if (retries > maxRetries) {
          this.log('error', 'API调用失败，已达到最大重试次数:', error.message);
          // 返回友好的错误信息
          throw new Error(`API调用失败: ${error.message}`);
        }
        this.log('info', `API调用失败，正在重试 (${retries}/${maxRetries})...`);
        // 指数退避策略
        const backoffDelay = retryDelay * Math.pow(2, retries - 1);
        this.log('debug', `重试延迟: ${backoffDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }

  /**
   * 调用智谱AI API
   * @param {string} prompt - 用户输入
   * @param {string} cacheKey - 缓存键
   * @param {object} cache - 缓存对象
   * @param {string} agentName - 智能体名称
   * @returns {Promise<string>} API响应
   */
  callZhipuAPI(prompt, cacheKey, cache, agentName) {
    return new Promise((resolve) => {
      try {
        const postData = JSON.stringify({
          model: this.model || 'glm-4',
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

        const providerConfig = this.providers.zhipu;
        const options = {
          hostname: providerConfig.baseURL,
          port: 443,
          path: providerConfig.path,
          method: 'POST',
          headers: {
            ...providerConfig.headers,
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
              
              this.log('debug', 'API响应数据:', data);
              const responseData = JSON.parse(data);
              if (res.statusCode !== 200) {
                this.log('error', 'API错误:', responseData);
                resolve('抱歉，我在处理您的请求时遇到了问题。');
              } else {
                this.log('info', 'API响应成功');
                // 智谱AI的响应格式可能不同，尝试多种格式
                let response;
                if (responseData.choices && responseData.choices.length > 0) {
                  // OpenAI格式
                  response = responseData.choices[0].message.content;
                } else if (responseData.data && responseData.data.length > 0) {
                  // 智谱AI可能的格式
                  response = responseData.data[0].content;
                } else if (responseData.result) {
                  // 百度文心一言格式
                  response = responseData.result;
                } else if (responseData.output) {
                  // 其他格式
                  response = responseData.output;
                } else {
                  this.log('error', 'API响应格式错误: 无法解析响应');
                  resolve('抱歉，我在处理您的请求时遇到了问题。');
                  return;
                }
                // 安全地设置缓存
                if (cache) {
                  cache.setCache(cacheKey, response);
                }
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
   * 调用百度文心一言API
   * @param {string} prompt - 用户输入
   * @param {string} cacheKey - 缓存键
   * @param {object} cache - 缓存对象
   * @param {string} agentName - 智能体名称
   * @returns {Promise<string>} API响应
   */
  callBaiduAPI(prompt, cacheKey, cache, agentName) {
    return new Promise((resolve) => {
      try {
        // 百度API需要在URL中添加API Key
        const apiKey = this.apiKey;
        const providerConfig = this.providers.baidu;
        const options = {
          hostname: providerConfig.baseURL,
          port: 443,
          path: `${providerConfig.path}?access_token=${apiKey}`,
          method: 'POST',
          headers: {
            ...providerConfig.headers,
            'Content-Length': 0 // 会在下面重新计算
          },
          timeout: 30000
        };

        const postData = JSON.stringify({
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

        options.headers['Content-Length'] = Buffer.byteLength(postData);

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
                resolve('抱歉，我在处理您的请求时遇到了问题。');
              } else {
                this.log('info', 'API响应成功');
                if (responseData.result) {
                  const response = responseData.result;
                  // 安全地设置缓存
                  if (cache) {
                    cache.setCache(cacheKey, response);
                  }
                  resolve(response);
                } else {
                  this.log('error', 'API响应格式错误: 缺少result字段');
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
   * 调用讯飞星火API
   * @param {string} prompt - 用户输入
   * @param {string} cacheKey - 缓存键
   * @param {object} cache - 缓存对象
   * @param {string} agentName - 智能体名称
   * @returns {Promise<string>} API响应
   */
  callIflytekAPI(prompt, cacheKey, cache, agentName) {
    return new Promise((resolve) => {
      try {
        const postData = JSON.stringify({
          header: {
            app_id: this.apiKey.split('.')[0], // 讯飞API需要app_id
            uid: 'user'
          },
          parameter: {
            chat: {
              domain: 'general',
              temperature: 0.7,
              max_tokens: 1000
            }
          },
          payload: {
            message: {
              text: [
                {
                  role: 'system',
                  content: `你是${agentName}，一个智能对话助手。你能够理解并回答用户的各种问题，提供准确且有用的信息，并且能够进行自然的对话。`
                },
                {
                  role: 'user',
                  content: prompt
                }
              ]
            }
          }
        });

        const providerConfig = this.providers.iflytek;
        const options = {
          hostname: providerConfig.baseURL,
          port: 443,
          path: providerConfig.path,
          method: 'POST',
          headers: {
            ...providerConfig.headers,
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
                resolve('抱歉，我在处理您的请求时遇到了问题。');
              } else {
                this.log('info', 'API响应成功');
                if (responseData.payload && responseData.payload.message && responseData.payload.message.text) {
                  const response = responseData.payload.message.text[0].content;
                  // 安全地设置缓存
                  if (cache) {
                    cache.setCache(cacheKey, response);
                  }
                  resolve(response);
                } else {
                  this.log('error', 'API响应格式错误: 缺少payload.message.text字段');
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
   * 调用API
   * @param {string} prompt - 用户输入
   * @param {string} cacheKey - 缓存键
   * @param {object} cache - 缓存对象
   * @param {string} agentName - 智能体名称
   * @returns {Promise<string>} API响应
   */
  async callAPI(prompt, cacheKey, cache, agentName) {
    try {
      this.log('info', `开始API调用，提供商: ${this.provider}`);
      
      switch (this.provider) {
        case 'anthropic':
          return await this.callWithRetry(() => this.callAnthropicAPI(prompt, cacheKey, cache, agentName));
        case 'google':
          return await this.callWithRetry(() => this.callGoogleAPI(prompt, cacheKey, cache, agentName));
        case 'deepseek':
          return await this.callWithRetry(() => this.callDeepSeekAPI(prompt, cacheKey, cache, agentName));
        case 'zhipu':
          return await this.callWithRetry(() => this.callZhipuAPI(prompt, cacheKey, cache, agentName));
        case 'baidu':
          return await this.callWithRetry(() => this.callBaiduAPI(prompt, cacheKey, cache, agentName));
        case 'iflytek':
          return await this.callWithRetry(() => this.callIflytekAPI(prompt, cacheKey, cache, agentName));
        case 'openai':
        default:
          return await this.callWithRetry(() => this.callOpenAIAPI(prompt, cacheKey, cache, agentName));
      }
    } catch (error) {
      this.log('error', 'API调用错误:', error.message);
      // 返回友好的错误信息
      return `抱歉，我在调用${this.provider} API时遇到了问题：${error.message}。请稍后再试。`;
    }
  }

  /**
   * 检查API密钥是否有效
   * @returns {boolean} API密钥是否有效
   */
  isApiKeyValid() {
    return this.apiKey && this.apiKey !== 'your_openai_api_key_here' && this.apiKey !== 'your_api_key_here';
  }

  /**
   * 设置模型
   * @param {string} model - 模型名称
   */
  setModel(model) {
    this.model = model;
  }

  /**
   * 设置提供商
   * @param {string} provider - 提供商名称
   */
  setProvider(provider) {
    if (this.providers[provider]) {
      this.provider = provider;
      return true;
    }
    return false;
  }

  /**
   * 获取支持的提供商列表
   * @returns {array} 支持的提供商列表
   */
  getSupportedProviders() {
    return Object.keys(this.providers);
  }
}

module.exports = APIManager;