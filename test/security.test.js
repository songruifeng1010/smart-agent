const securityManager = require('../src/services/security');

describe('SecurityManager', () => {
  describe('输入验证', () => {
    test('应该验证有效输入', () => {
      const result = securityManager.validateInput('你好');
      expect(result).toBe(true);
    });

    test('应该拒绝空输入', () => {
      const result = securityManager.validateInput('');
      expect(result).toBe(false);
    });

    test('应该拒绝过长输入', () => {
      const longInput = 'a'.repeat(1001);
      const result = securityManager.validateInput(longInput);
      expect(result).toBe(false);
    });

    test('应该拒绝包含脚本的输入', () => {
      const result = securityManager.validateInput('<script>alert(1)</script>');
      expect(result).toBe(false);
    });

    test('应该拒绝包含iframe的输入', () => {
      const result = securityManager.validateInput('<iframe src="http://example.com"></iframe>');
      expect(result).toBe(false);
    });

    test('应该拒绝包含JavaScript伪协议的输入', () => {
      const result = securityManager.validateInput('javascript:alert(1)');
      expect(result).toBe(false);
    });
  });

  describe('输入清理', () => {
    test('应该清理HTML特殊字符', () => {
      const input = '<script>alert(1)</script>';
      const result = securityManager.sanitizeInput(input);
      expect(result).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    test('应该处理空输入', () => {
      const result = securityManager.sanitizeInput('');
      expect(result).toBe('');
    });

    test('应该处理非字符串输入', () => {
      const result = securityManager.sanitizeInput(123);
      expect(result).toBe('');
    });
  });

  describe('SQL注入防护', () => {
    test('应该防止SQL注入', () => {
      const input = "' OR 1=1 --";
      const result = securityManager.preventSQLInjection(input);
      expect(result).toBe("\\' OR 1=1 --");
    });

    test('应该处理空输入', () => {
      const result = securityManager.preventSQLInjection('');
      expect(result).toBe('');
    });

    test('应该处理非字符串输入', () => {
      const result = securityManager.preventSQLInjection(123);
      expect(result).toBe('');
    });
  });

  describe('XSS防护', () => {
    test('应该防止XSS攻击', () => {
      const input = '<script>alert(1)</script>';
      const result = securityManager.preventXSS(input);
      expect(result).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    test('应该处理空输入', () => {
      const result = securityManager.preventXSS('');
      expect(result).toBe('');
    });

    test('应该处理非字符串输入', () => {
      const result = securityManager.preventXSS(123);
      expect(result).toBe('');
    });
  });

  describe('会话ID验证', () => {
    test('应该验证有效会话ID', () => {
      const result = securityManager.validateSessionId('test_session_id_123');
      expect(result).toBe(true);
    });

    test('应该拒绝过短会话ID', () => {
      const result = securityManager.validateSessionId('short');
      expect(result).toBe(false);
    });

    test('应该拒绝过长会话ID', () => {
      const longSessionId = 'a'.repeat(101);
      const result = securityManager.validateSessionId(longSessionId);
      expect(result).toBe(false);
    });

    test('应该拒绝包含无效字符的会话ID', () => {
      const result = securityManager.validateSessionId('test session id');
      expect(result).toBe(false);
    });
  });

  describe('会话ID生成', () => {
    test('应该生成安全的会话ID', () => {
      const sessionId = securityManager.generateSessionId();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBe(32);
      expect(securityManager.validateSessionId(sessionId)).toBe(true);
    });
  });

  describe('URL安全检查', () => {
    test('应该验证安全的URL', () => {
      const result = securityManager.isSafeUrl('http://example.com');
      expect(result).toBe(true);
    });

    test('应该验证安全的HTTPS URL', () => {
      const result = securityManager.isSafeUrl('https://example.com');
      expect(result).toBe(true);
    });

    test('应该拒绝不安全的URL', () => {
      const result = securityManager.isSafeUrl('javascript:alert(1)');
      expect(result).toBe(false);
    });

    test('应该处理无效的URL', () => {
      const result = securityManager.isSafeUrl('invalid-url');
      expect(result).toBe(false);
    });
  });

  describe('API密钥验证', () => {
    test('应该验证有效API密钥', () => {
      const result = securityManager.validateApiKey('test_api_key_123');
      expect(result).toBe(true);
    });

    test('应该拒绝过短API密钥', () => {
      const result = securityManager.validateApiKey('short');
      expect(result).toBe(false);
    });

    test('应该拒绝过长API密钥', () => {
      const longApiKey = 'a'.repeat(101);
      const result = securityManager.validateApiKey(longApiKey);
      expect(result).toBe(false);
    });

    test('应该拒绝包含无效字符的API密钥', () => {
      const result = securityManager.validateApiKey('test api key');
      expect(result).toBe(false);
    });
  });
});