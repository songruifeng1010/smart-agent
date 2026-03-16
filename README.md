# SmartAgent

一个类似于DeepSeek的智能体，基于OpenAI API构建。

## 功能特性

- 基于OpenAI GPT模型的智能对话
- 简单易用的API接口
- 可配置的智能体参数

## 安装依赖

```bash
npm install
```

## 配置环境变量

1. 复制 `.env` 文件并填写你的OpenAI API密钥：

```env
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# 智能体配置
AGENT_NAME=SmartAgent
AGENT_VERSION=1.0.0
```

## 使用方法

### 基本使用

```bash
npm start
```

### 作为模块使用

```javascript
const SmartAgent = require('./agent');

async function main() {
  const agent = new SmartAgent();
  const response = await agent.processMessage('你好，你是谁？');
  console.log(response);
}

main();
```

## 项目结构

```
smart-agent/
├── agent.js          # 智能体核心类
├── index.js          # 主入口文件
├── package.json      # 项目配置
├── .env              # 环境变量
└── README.md         # 项目说明
```

## 技术栈

- Node.js
- OpenAI API
- Dotenv

## 注意事项

- 请确保你有有效的OpenAI API密钥
- 本项目使用GPT-3.5-turbo模型，你可以根据需要修改为其他模型
- 调用OpenAI API会产生费用，请合理使用
