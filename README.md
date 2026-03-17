# SmartAgent - 智能对话助手

一个功能丰富的智能对话助手，支持多种功能。

## 功能特性

- ✅ 情感检测和响应
- ✅ 对话上下文记忆
- ✅ 用户名记忆
- ✅ 数学计算
- ✅ 单位转换
- ✅ 知识库回答（涵盖5大类别）
- ✅ 笑话生成
- ✅ 自然聊天响应
- ✅ 缓存机制
- ✅ 多模型支持（OpenAI、Anthropic、Google Gemini、DeepSeek）
- ✅ 环境变量配置

## 本地运行

```bash
npm start
```

或直接运行：

```bash
node start-server.js
```

## 部署到云平台

### 方案一：使用Render（推荐，免费）

1. 访问 https://render.com
2. 使用GitHub账号登录
3. 点击 "New +" → "Web Service"
4. 选择您的 smart-agent 仓库
5. 配置：
   - Name: smart-agent
   - Region: 选择离您最近的
   - Runtime: Node
   - Build Command: (留空)
   - Start Command: `npm start`
6. 点击 "Create Web Service"

### 方案二：使用Railway

1. 访问 https://railway.app
2. 使用GitHub账号登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择您的 smart-agent 仓库
5. 部署

### 方案三：使用Vercel

1. 访问 https://vercel.com
2. 使用GitHub账号登录
3. 点击 "New Project"
4. 选择您的 smart-agent 仓库
5. 点击 "Deploy"

## 使用说明

部署成功后，访问您的应用URL即可使用SmartAgent！

## 技术栈

- Node.js
- JavaScript
- 纯前端（HTML/CSS/JS）

## 许可证

MIT
