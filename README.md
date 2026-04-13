# SmartAgent - 智能对话助手

## 项目概述
SmartAgent是一个功能强大的智能对话助手，采用模块化设计，支持多种大模型，提供丰富的功能特性。

## 功能特性

### 核心功能
- ✅ 智能对话：支持与用户进行自然、连贯的对话
- ✅ 多模型支持：集成了OpenAI、Anthropic、Google Gemini、DeepSeek、智谱AI、百度文心一言、讯飞星火等大模型
- ✅ 会话管理：支持会话管理，保持对话上下文
- ✅ 情感分析：能够识别用户的情感状态，提供相应的情感化回应
- ✅ 话题跟踪：能够跟踪对话的话题，保持上下文的一致性
- ✅ 意图识别：能够识别用户的意图，提供更精准的响应
- ✅ 自学习：能够从用户的输入中学习新知识
- ✅ 多语言支持：支持8种语言，包括简体中文、英语、日语、韩语、法语、德语、西班牙语和俄语
- ✅ 数学计算：能够进行基本的数学计算
- ✅ 单位转换：能够进行常见的单位转换
- ✅ 知识库回答：涵盖多个类别的知识库
- ✅ 笑话生成：能够生成有趣的笑话
- ✅ 自然聊天响应：能够提供自然、真实的聊天响应

### 高级特性
- ✅ 安全验证：内置输入验证和防止注入攻击的功能
- ✅ 性能优化：采用LRU缓存策略，提高响应速度
- ✅ 配置管理：支持通过环境变量和配置文件进行配置
- ✅ 监控和日志：完善的监控和日志系统
- ✅ 部署支持：支持部署到Render、Railway、Vercel等平台

## 技术栈

- **后端**：Node.js, JavaScript
- **前端**：HTML5, CSS3, JavaScript
- **模块化设计**：采用模块化架构，便于维护和扩展
- **依赖管理**：使用npm管理依赖

## 安装和使用

### 安装

1. 克隆项目到本地：
   ```bash
   git clone https://github.com/songruifeng1010/smart-agent.git
   cd smart-agent
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量：
   - 复制 `.env.example` 文件为 `.env`
   - 编辑 `.env` 文件，填写相应的配置

### 运行

1. 启动服务器：
   ```bash
   npm start
   ```

2. 访问前端页面：
   - 打开浏览器，访问 `http://localhost:3002`

3. 使用API：
   - 详细的API文档请参考 [API.md](API.md)

## 部署

### 方案一：使用Render（推荐，免费）

1. 访问 https://render.com
2. 使用GitHub账号登录
3. 点击 "New +" → "Web Service"
4. 选择您的 smart-agent 仓库
5. 配置：
   - Name: smart-agent
   - Region: 选择离您最近的
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
6. 点击 "Create Web Service"
7. 配置环境变量（在Environment标签页）：
   - `API_KEY`: 您的大模型API密钥
   - `MODEL`: 模型名称（如gpt-3.5-turbo, claude-3-sonnet-20240229, gemini-1.5-flash-lite, deepseek-chat, glm-4等）
   - `PROVIDER`: 提供商名称（openai, anthropic, google, deepseek, zhipu, baidu, iflytek）

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

## 配置

### 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| PORT | 服务器端口 | 3002 |
| HOST | 服务器主机 | 0.0.0.0 |
| NODE_ENV | 运行环境 | development |
| API_KEY | API密钥 | your_api_key_here |
| MODEL | 模型名称 | glm-4 |
| PROVIDER | 模型提供商 | zhipu |
| AGENT_NAME | 智能体名称 | SmartAgent |
| AGENT_VERSION | 智能体版本 | 4.0.0 |
| LOG_LEVEL | 日志级别 | info |
| LANGUAGE | 默认语言 | zh-CN |
| CACHE_EXPIRY | 缓存过期时间（毫秒） | 3600000 |
| CACHE_SIZE_LIMIT | 缓存大小限制 | 1000 |
| LEARNING_ENABLED | 自学习功能 | true |
| SENTIMENT_ANALYSIS_ENABLED | 情感分析功能 | true |
| TOPIC_TRACKING_ENABLED | 话题跟踪功能 | true |
| KEEP_ALIVE_ENABLED | 自我唤醒功能 | true |
| API_TIMEOUT | API超时时间（毫秒） | 30000 |

## 项目结构

```
smart-agent/
├── src/
│   ├── config/          # 配置管理
│   ├── middleware/      # 中间件
│   ├── services/         # 业务逻辑服务
│   ├── utils/            # 工具函数
│   ├── models/           # 数据模型
│   └── routes/           # 路由
├── .env.example         # 环境变量示例
├── .gitignore           # Git忽略文件
├── API.md               # API文档
├── DEPLOY.md            # 部署文档
├── README.md            # 项目说明
├── agent.js             # 智能体主类
├── index.html           # 前端页面
├── package.json         # 项目配置
├── render.yaml          # Render配置
└── start-server.js      # 服务器启动文件
```

## 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 项目
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

本项目使用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 联系方式

- 邮箱：support@smartagent.com
- GitHub：https://github.com/songruifeng1010/smart-agent
