const SmartAgent = require('./agent');

async function main() {
  console.log('=== 智能体启动 ===');
  
  // 配置智能体
  const config = {
    apiKey: 'your_openai_api_key_here', // 请在此处填写你的OpenAI API密钥
    name: 'SmartAgent',
    version: '1.0.0',
    logLevel: 'info' // 日志级别: debug, info, error
  };
  
  const agent = new SmartAgent(config);
  
  console.log(`智能体名称: ${agent.name}`);
  console.log(`智能体版本: ${agent.version}`);
  console.log(`日志级别: ${agent.logLevel}`);
  console.log('==================');
  
  // 示例对话
  const testMessages = [
    '你好，你是谁？',
    '什么是人工智能？',
    '如何学习编程？'
  ];
  
  for (const message of testMessages) {
    console.log('\n用户:', message);
    const response = await agent.processMessage(message);
    console.log('智能体:', response);
    console.log('------------------');
  }
  
  console.log('=== 智能体测试完成 ===');
}

main().catch(console.error);