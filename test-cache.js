const SmartAgent = require('./agent');

async function testCache() {
  console.log('=== 测试缓存功能 ===');
  
  // 配置智能体，使用debug日志级别以便查看缓存操作
  const config = {
    apiKey: 'your_openai_api_key_here',
    name: 'SmartAgent',
    version: '1.0.0',
    logLevel: 'debug' // 使用debug级别查看详细日志
  };
  
  const agent = new SmartAgent(config);
  
  console.log('智能体初始化完成');
  console.log('==================');
  
  // 测试重复请求相同的问题
  const testMessage = '你好，你是谁？';
  
  console.log('\n第一次请求:');
  const response1 = await agent.processMessage(testMessage);
  console.log('响应1:', response1);
  
  console.log('\n第二次请求（应该从缓存获取）:');
  const response2 = await agent.processMessage(testMessage);
  console.log('响应2:', response2);
  
  console.log('\n第三次请求（应该从缓存获取）:');
  const response3 = await agent.processMessage(testMessage);
  console.log('响应3:', response3);
  
  console.log('\n=== 缓存功能测试完成 ===');
}

testCache().catch(console.error);