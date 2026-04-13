// 安全模块

class SecurityManager {
  /**
   * 验证输入
   * @param {string} input - 输入字符串
   * @returns {boolean} 是否有效
   */
  validateInput(input) {
    if (!input || typeof input !== 'string') {
      return false;
    }
    
    // 检查输入长度
    if (input.length > 1000) {
      return false;
    }
    
    // 检查是否包含恶意代码
    const maliciousPatterns = [
      /<script[^>]*>.*?<\/script>/gi, // 脚本注入
      /<iframe[^>]*>.*?<\/iframe>/gi, // iframe注入
      /javascript:/gi, // JavaScript伪协议
      /on\w+\s*=/gi, // 事件处理器
      /expression\s*\(/gi, // CSS表达式
      /vbscript:/gi, // VBScript伪协议
      /alert\s*\(/gi, // 弹窗
      /eval\s*\(/gi, // 执行代码
      /document\.cookie/gi, // 访问cookie
      /localStorage|sessionStorage/gi, // 访问存储
      /XMLHttpRequest|fetch/gi, // 网络请求
      /ActiveXObject/gi, // ActiveX对象
      /exec|system|shell|cmd/gi, // 命令执行
      /file:\/\//gi, // 文件协议
      /data:\/\//gi, // 数据协议
      /chrome-extension:\/\//gi, // 扩展协议
      /javascript:\/\//gi, // JavaScript协议
      /vbscript:\/\//gi, // VBScript协议
      /ftp:\/\//gi, // FTP协议
      /sftp:\/\//gi, // SFTP协议
      /telnet:\/\//gi, // Telnet协议
      /mailto:\/\//gi, // Mailto协议
      /news:\/\//gi, // News协议
      /nntp:\/\//gi, // NNTP协议
      /irc:\/\//gi, // IRC协议
      /gopher:\/\//gi, // Gopher协议
      /wais:\/\//gi, // WAIS协议
      /prospero:\/\//gi, // Prospero协议
      /z39\.50s:\/\//gi, // Z39.50S协议
      /z39\.50r:\/\//gi, // Z39.50R协议
      /ldap:\/\//gi, // LDAP协议
      /file:\/\//gi, // 文件协议
      /data:\/\//gi, // 数据协议
      /chrome-extension:\/\//gi, // 扩展协议
      /javascript:\/\//gi, // JavaScript协议
      /vbscript:\/\//gi, // VBScript协议
      /ftp:\/\//gi, // FTP协议
      /sftp:\/\//gi, // SFTP协议
      /telnet:\/\//gi, // Telnet协议
      /mailto:\/\//gi, // Mailto协议
      /news:\/\//gi, // News协议
      /nntp:\/\//gi, // NNTP协议
      /irc:\/\//gi, // IRC协议
      /gopher:\/\//gi, // Gopher协议
      /wais:\/\//gi, // WAIS协议
      /prospero:\/\//gi, // Prospero协议
      /z39\.50s:\/\//gi, // Z39.50S协议
      /z39\.50r:\/\//gi, // Z39.50R协议
      /ldap:\/\//gi // LDAP协议
    ];
    
    for (const pattern of maliciousPatterns) {
      if (pattern.test(input)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 清理输入
   * @param {string} input - 输入字符串
   * @returns {string} 清理后的输入
   */
  sanitizeInput(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // 转义HTML特殊字符
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 防止SQL注入
   * @param {string} input - 输入字符串
   * @returns {string} 处理后的输入
   */
  preventSQLInjection(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // 转义SQL特殊字符
    return input
      .replace(/'/g, "''")
      .replace(/"/g, '""')
      .replace(/\/g, '\\')
      .replace(/\//g, '//')
      .replace(/\*/g, '\\*')
      .replace(/\-/g, '\\-')
      .replace(/\+/g, '\\+')
      .replace(/\=/g, '\\=')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\;/g, '\\;')
      .replace(/\:/g, '\\:')
      .replace(/\,/g, '\\,')
      .replace(/\./g, '\\.')
      .replace(/\?/g, '\\?')
      .replace(/\!/g, '\\!')
      .replace(/\~/g, '\\~')
      .replace(/\`/g, '\\`')
      .replace(/\~/g, '\\~')
      .replace(/\#/g, '\\#')
      .replace(/\$/g, '\\$')
      .replace(/\%/g, '\\%')
      .replace(/\^/g, '\\^')
      .replace(/\&/g, '\\&')
      .replace(/\*/g, '\\*')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\-/g, '\\-')
      .replace(/\+/g, '\\+')
      .replace(/\=/g, '\\=')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\|/g, '\\|')
      .replace(/\;/g, '\\;')
      .replace(/\:/g, '\\:')
      .replace(/"/g, '\\"')
      .replace(/\'/g, "\\'")
      .replace(/\</g, '\\<')
      .replace(/\>/g, '\\>')
      .replace(/\,/g, '\\,')
      .replace(/\./g, '\\.')
      .replace(/\?/g, '\\?');
  }

  /**
   * 防止XSS攻击
   * @param {string} input - 输入字符串
   * @returns {string} 处理后的输入
   */
  preventXSS(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // 转义HTML特殊字符
    return this.sanitizeInput(input);
  }

  /**
   * 验证会话ID
   * @param {string} sessionId - 会话ID
   * @returns {boolean} 是否有效
   */
  validateSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      return false;
    }
    
    // 检查会话ID长度
    if (sessionId.length < 10 || sessionId.length > 100) {
      return false;
    }
    
    // 检查会话ID格式
    const sessionIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!sessionIdPattern.test(sessionId)) {
      return false;
    }
    
    return true;
  }

  /**
   * 生成安全的会话ID
   * @returns {string} 会话ID
   */
  generateSessionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let sessionId = '';
    for (let i = 0; i < 32; i++) {
      sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sessionId;
  }

  /**
   * 检查是否为安全的URL
   * @param {string} url - URL
   * @returns {boolean} 是否安全
   */
  isSafeUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    // 检查URL格式
    try {
      const parsedUrl = new URL(url);
      
      // 检查协议
      const safeProtocols = ['http:', 'https:'];
      if (!safeProtocols.includes(parsedUrl.protocol)) {
        return false;
      }
      
      // 检查主机
      const safeHosts = ['localhost', '127.0.0.1'];
      if (!safeHosts.includes(parsedUrl.hostname)) {
        // 可以根据需要添加更多安全的主机
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 验证API密钥
   * @param {string} apiKey - API密钥
   * @returns {boolean} 是否有效
   */
  validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // 检查API密钥长度
    if (apiKey.length < 10 || apiKey.length > 100) {
      return false;
    }
    
    // 检查API密钥格式
    const apiKeyPattern = /^[a-zA-Z0-9_-]+$/;
    if (!apiKeyPattern.test(apiKey)) {
      return false;
    }
    
    return true;
  }
}

// 导出单例实例
module.exports = new SecurityManager();