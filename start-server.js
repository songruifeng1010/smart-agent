const http = require('http');
const fs = require('fs');
const path = require('path');
const SmartAgent = require('./agent');

// 创建智能体实例
console.log('正在初始化SmartAgent...');
let agent;
try {
  agent = new SmartAgent({
    apiKey: process.env.API_KEY || 'your_openai_api_key_here',
    name: 'SmartAgent',
    version: '2.0.0',
    logLevel: 'info',
    model: process.env.MODEL || 'gpt-3.5-turbo',
    provider: process.env.PROVIDER || 'openai'
  });
  console.log('SmartAgent初始化成功');
  console.log('当前配置:', agent.getConfig());
} catch (error) {
  console.error('SmartAgent初始化失败:', error);
  process.exit(1);
}

// 处理请求
function handleRequest(req, res) {
  try {
    // 解析请求URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    // 处理API请求
    if (pathname === '/api/chat') {
      if (req.method === 'POST') {
        let body = '';
        const maxBodySize = 1048576; // 1MB
        let bodySize = 0;
        
        req.on('data', chunk => {
          bodySize += chunk.length;
          if (bodySize > maxBodySize) {
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Request body too large' }));
            req.destroy();
          }
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            if (!body) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Request body is required' }));
              return;
            }
            
            const data = JSON.parse(body);
            const message = data.message;
            if (!message || typeof message !== 'string') {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Message is required and must be a string' }));
              return;
            }
            
            const response = await agent.processMessage(message);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ response }));
          } catch (error) {
            console.error('API Error:', error);
            if (error instanceof SyntaxError) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON format' }));
            } else {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Internal server error' }));
            }
          }
        });
      } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
      }
      return;
    }
    
    // 处理静态文件
    let filePath = '.' + pathname;
    
    // 防止路径遍历攻击
    if (filePath.includes('..')) {
      res.writeHead(403, { 'Content-Type': 'text/html' });
      res.end('<h1>403 Forbidden</h1>', 'utf-8');
      return;
    }
    
    if (filePath === './') {
      filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.svg': 'application/image/svg+xml'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // 限制文件类型，只允许静态资源
    const allowedExtensions = Object.keys(mimeTypes);
    if (!allowedExtensions.includes(extname) && extname !== '') {
      res.writeHead(403, { 'Content-Type': 'text/html' });
      res.end('<h1>403 Forbidden</h1>', 'utf-8');
      return;
    }
    
    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code == 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>', 'utf-8');
        } else {
          console.error('File read error:', error);
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end('<h1>500 Internal Server Error</h1>', 'utf-8');
        }
      } else {
        // 设置缓存头
        if (extname === '.js' || extname === '.css' || extname === '.png' || extname === '.jpg' || extname === '.jpeg' || extname === '.gif' || extname === '.svg') {
          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400' // 24小时缓存
          });
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
        }
        res.end(content, 'utf-8');
      }
    });
  } catch (error) {
    console.error('Request handling error:', error);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end('<h1>500 Internal Server Error</h1>', 'utf-8');
  }
}

// 创建服务器
const server = http.createServer(handleRequest);

// 健康检查端点
function addHealthCheck(app) {
  // 处理健康检查请求
  const originalHandleRequest = app._events.request;
  app._events.request = (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }));
      return;
    }
    originalHandleRequest(req, res);
  };
}

// 定期自我唤醒（防止Render休眠）
function startKeepAlive() {
  const interval = 5 * 60 * 1000; // 5分钟
  let keepAliveCount = 0;
  
  setInterval(() => {
    try {
      const port = process.env.PORT || 3002;
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/health',
        method: 'GET',
        timeout: 10000 // 10秒超时
      };
      
      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          keepAliveCount++;
          if (keepAliveCount % 12 === 0) { // 每小时输出一次详细信息
            console.log(`✓ 自我唤醒成功 (累计: ${keepAliveCount}次)`);
          } else if (keepAliveCount % 3 === 0) { // 每15分钟输出一次简要信息
            console.log('✓ 自我唤醒成功');
          }
        } else {
          console.log(`自我唤醒响应异常: 状态码 ${res.statusCode}`);
        }
      });
      
      req.on('error', (e) => {
        console.log('自我唤醒失败:', e.message);
      });
      
      req.on('timeout', () => {
        console.log('自我唤醒超时');
        req.destroy();
      });
      
      req.end();
    } catch (error) {
      console.log('自我唤醒出错:', error.message);
    }
  }, interval);
  console.log('自我唤醒机制已启动，每5分钟唤醒一次');
}

// 启动服务器
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API端点: http://localhost:${PORT}/api/chat`);
  console.log(`前端页面: http://localhost:${PORT}`);
  console.log(`健康检查: http://localhost:${PORT}/health`);
});

// 添加错误处理
server.on('error', (error) => {
  console.error('服务器错误:', error);
});

// 防止进程退出
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n收到终止信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

// 添加健康检查
addHealthCheck(server);

// 启动自我唤醒
startKeepAlive();
