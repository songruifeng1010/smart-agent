// 配置管理模块

const dotenv = require('dotenv');

// 加载.env文件
dotenv.config();

const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3002,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  
  // 智能体配置
  agent: {
    name: process.env.AGENT_NAME || 'SmartAgent',
    version: process.env.AGENT_VERSION || '4.0.0',
    logLevel: process.env.LOG_LEVEL || 'info',
    language: process.env.LANGUAGE || 'zh-CN'
  },
  
  // API配置
  api: {
    apiKey: process.env.API_KEY || 'your_api_key_here',
    model: process.env.MODEL || 'glm-4',
    provider: process.env.PROVIDER || 'zhipu',
    timeout: parseInt(process.env.API_TIMEOUT) || 30000
  },
  
  // 缓存配置
  cache: {
    expiry: parseInt(process.env.CACHE_EXPIRY) || 3600000, // 默认1小时
    sizeLimit: parseInt(process.env.CACHE_SIZE_LIMIT) || 1000 // 缓存大小限制
  },
  
  // 特性开关
  features: {
    learning: process.env.LEARNING_ENABLED !== 'false',
    sentimentAnalysis: process.env.SENTIMENT_ANALYSIS_ENABLED !== 'false',
    topicTracking: process.env.TOPIC_TRACKING_ENABLED !== 'false',
    keepAlive: process.env.KEEP_ALIVE_ENABLED !== 'false'
  },
  
  // 安全配置
  security: {
    maxBodySize: 1024 * 1024, // 1MB
    allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*']
  }
};

module.exports = config;