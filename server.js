const http = require('http');
const fs = require('fs');
const path = require('path');
const SmartAgent = require('./agent');

// 创建智能体实例
console.log('正在初始化SmartAgent...');
let agent;
try {
  agent = new SmartAgent({
    apiKey: 'your_openai_api_key_here',
    name: 'SmartAgent',
    version: '1.0.0',
    logLevel: 'info'
  });
  console.log('SmartAgent初始化成功');
} catch (error) {
  console.error('SmartAgent初始化失败:', error);
  process.exit(1);
}

// 处理请求
function handleRequest(req, res) {
  // 解析请求URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // 处理API请求
  if (pathname === '/api/chat') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body);
          const message = data.message;
          if (!message) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Message is required' }));
            return;
          }
          
          const response = await agent.processMessage(message);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ response }));
        } catch (error) {
          console.error('API Error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
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
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
        res.end(); 
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
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
  setInterval(() => {
    try {
      const options = {
        hostname: 'localhost',
        port: process.env.PORT || 3002,
        path: '/health',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          console.log('✓ 自我唤醒成功');
        }
      });
      
      req.on('error', (e) => {
        console.log('自我唤醒失败:', e.message);
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
