// 日志管理模块

class Logger {
  constructor(config = {}) {
    this.logLevel = config.logLevel || 'info';
    this.logFile = config.logFile || null;
    this.logFormat = config.logFormat || 'json'; // json或text
  }

  /**
   * 检查日志级别
   * @param {string} level - 日志级别
   * @returns {boolean} 是否应该记录该级别的日志
   */
  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  /**
   * 生成日志对象
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {object} meta - 元数据
   * @returns {object} 日志对象
   */
  createLogObject(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      meta,
      pid: process.pid,
      hostname: require('os').hostname()
    };
  }

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {object} meta - 元数据
   */
  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      const logObject = this.createLogObject('debug', message, meta);
      this.log(logObject);
    }
  }

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {object} meta - 元数据
   */
  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      const logObject = this.createLogObject('info', message, meta);
      this.log(logObject);
    }
  }

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {object} meta - 元数据
   */
  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      const logObject = this.createLogObject('warn', message, meta);
      this.log(logObject);
    }
  }

  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {object} meta - 元数据
   */
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      const logObject = this.createLogObject('error', message, meta);
      this.log(logObject);
    }
  }

  /**
   * 记录日志
   * @param {object} logObject - 日志对象
   */
  log(logObject) {
    if (this.logFormat === 'json') {
      console.log(JSON.stringify(logObject));
    } else {
      console.log(`[${logObject.timestamp}] [${logObject.level}] ${logObject.message}`, logObject.meta);
    }

    // 如果配置了日志文件，将日志写入文件
    if (this.logFile) {
      this.writeToFile(logObject);
    }
  }

  /**
   * 将日志写入文件
   * @param {object} logObject - 日志对象
   */
  writeToFile(logObject) {
    const fs = require('fs');
    const path = require('path');

    // 确保日志目录存在
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // 写入日志文件
    const logString = this.logFormat === 'json' ? JSON.stringify(logObject) + '\n' : `[${logObject.timestamp}] [${logObject.level}] ${logObject.message} ${JSON.stringify(logObject.meta)}\n`;
    fs.appendFile(this.logFile, logString, (error) => {
      if (error) {
        console.error('写入日志文件失败:', error);
      }
    });
  }

  /**
   * 设置日志级别
   * @param {string} level - 日志级别
   */
  setLogLevel(level) {
    this.logLevel = level;
  }

  /**
   * 设置日志文件
   * @param {string} logFile - 日志文件路径
   */
  setLogFile(logFile) {
    this.logFile = logFile;
  }

  /**
   * 设置日志格式
   * @param {string} format - 日志格式
   */
  setLogFormat(format) {
    this.logFormat = format;
  }

  /**
   * 获取日志统计信息
   * @returns {object} 日志统计信息
   */
  getStats() {
    // 这里可以添加日志统计逻辑
    return {
      logLevel: this.logLevel,
      logFile: this.logFile,
      logFormat: this.logFormat
    };
  }
}

// 导出单例实例
module.exports = new Logger();