// 会话管理模块

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 3600000; // 1小时超时
  }

  /**
   * 创建新会话
   * @param {string} sessionId - 会话ID
   * @returns {object} 会话对象
   */
  createSession(sessionId) {
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      conversationHistory: [],
      userPreferences: {},
      currentTopic: null,
      topicHistory: []
    };
    
    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 获取会话
   * @param {string} sessionId - 会话ID
   * @returns {object|null} 会话对象
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      // 更新最后访问时间
      session.lastAccessedAt = Date.now();
      // 检查会话是否超时
      if (Date.now() - session.lastAccessedAt > this.sessionTimeout) {
        this.sessions.delete(sessionId);
        return null;
      }
    }
    return session;
  }

  /**
   * 更新会话
   * @param {string} sessionId - 会话ID
   * @param {object} updates - 更新的内容
   * @returns {object|null} 更新后的会话对象
   */
  updateSession(sessionId, updates) {
    const session = this.getSession(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastAccessedAt = Date.now();
      return session;
    }
    return null;
  }

  /**
   * 删除会话
   * @param {string} sessionId - 会话ID
   * @returns {boolean} 是否删除成功
   */
  deleteSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastAccessedAt > this.sessionTimeout) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * 获取会话数量
   * @returns {number} 会话数量
   */
  getSessionCount() {
    return this.sessions.size;
  }

  /**
   * 清空所有会话
   */
  clearAllSessions() {
    this.sessions.clear();
  }
}

// 导出单例实例
module.exports = new SessionManager();