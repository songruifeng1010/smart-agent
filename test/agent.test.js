const SmartAgent = require('../agent');

describe('SmartAgent', () => {
  let agent;

  beforeEach(() => {
    agent = new SmartAgent({
      apiKey: 'test_api_key',
      name: 'TestAgent',
      version: '4.0.0',
      logLevel: 'error',
      model: 'gpt-3.5-turbo',
      provider: 'openai',
      language: 'zh-CN'
    });
  });

  describe('初始化', () => {
    test('应该成功初始化', () => {
      expect(agent).toBeDefined();
      expect(agent.name).toBe('TestAgent');
      expect(agent.version).toBe('4.0.0');
      expect(agent.language).toBe('zh-CN');
    });
  });

  describe('处理消息', () => {
    test('应该处理空消息', async () => {
      const response = await agent.processMessage('');
      expect(response).toBe('抱歉，我无法处理空的请求。');
    });

    test('应该处理安全消息', async () => {
      const response = await agent.processMessage('你好');
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    test('应该拒绝不安全消息', async () => {
      const response = await agent.processMessage('<script>alert(1)</script>');
      expect(response).toBe('抱歉，我无法处理包含不安全内容的请求。');
    });
  });

  describe('会话管理', () => {
    test('应该创建会话', () => {
      const sessionId = 'test_session_id';
      const session = agent.createSession(sessionId);
      expect(session).toBeDefined();
      expect(session.id).toBe(sessionId);
    });

    test('应该获取会话', () => {
      const sessionId = 'test_session_id';
      agent.createSession(sessionId);
      const session = agent.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session.id).toBe(sessionId);
    });

    test('应该删除会话', () => {
      const sessionId = 'test_session_id';
      agent.createSession(sessionId);
      const result = agent.deleteSession(sessionId);
      expect(result).toBe(true);
      const session = agent.getSession(sessionId);
      expect(session).toBeNull();
    });

    test('应该处理带有会话的消息', async () => {
      const sessionId = 'test_session_id';
      const response = await agent.processMessageWithSession('你好', sessionId);
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
      const session = agent.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session.conversationHistory.length).toBe(1);
    });
  });

  describe('配置管理', () => {
    test('应该获取配置', () => {
      const config = agent.getConfig();
      expect(config).toBeDefined();
      expect(config.name).toBe('TestAgent');
      expect(config.version).toBe('4.0.0');
      expect(config.language).toBe('zh-CN');
    });

    test('应该设置语言', () => {
      const result = agent.setLanguage('en-US');
      expect(result).toBe(true);
      expect(agent.getLanguage()).toBe('en-US');
    });

    test('应该设置模型', () => {
      agent.setModel('gpt-4');
      const config = agent.getConfig();
      expect(config.model).toBe('gpt-4');
    });

    test('应该设置提供商', () => {
      const result = agent.setProvider('anthropic');
      expect(result).toBe(true);
      const config = agent.getConfig();
      expect(config.provider).toBe('anthropic');
    });
  });

  describe('缓存管理', () => {
    test('应该获取缓存统计信息', () => {
      const stats = agent.getCacheStats();
      expect(stats).toBeDefined();
      expect(stats.size).toBe(0);
    });

    test('应该清除所有缓存', () => {
      agent.clearCache();
      const stats = agent.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('会话管理统计', () => {
    test('应该获取会话数量', () => {
      const count = agent.getSessionCount();
      expect(typeof count).toBe('number');
      expect(count).toBe(0);
    });

    test('应该清理过期会话', () => {
      agent.cleanupExpiredSessions();
      // 没有异常抛出，测试通过
      expect(true).toBe(true);
    });

    test('应该清空所有会话', () => {
      agent.clearAllSessions();
      const count = agent.getSessionCount();
      expect(count).toBe(0);
    });
  });
});