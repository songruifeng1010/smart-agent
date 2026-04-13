# 部署指南：将SmartAgent部署到GitHub并配置自定义域名

## 步骤1：创建GitHub仓库

1. **登录GitHub**：访问 <https://github.com> 并登录你的账号
2. **创建新仓库**：
   - 点击右上角的"+"按钮，选择"New repository"
   - 仓库名称：`smart-agent`（或其他你喜欢的名称）
   - 描述：`一个类似于DeepSeek的智能对话助手`
   - 选择"Public"（公开）
   - 勾选"Add a README file"（可选）
   - 点击"Create repository"

## 步骤2：上传项目文件

### 方法A：使用Git命令行

1. **初始化Git仓库**：
   ```bash
   cd f:\supper smart
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. **关联GitHub仓库**：
   ```bash
   git remote add origin https://github.com/your-username/smart-agent.git
   git push -u origin main
   ```

### 方法B：使用GitHub Desktop

1. **下载并安装GitHub Desktop**：<https://desktop.github.com/>
2. **克隆仓库**：
   - 打开GitHub Desktop
   - 点击"File" > "Clone repository"
   - 选择"GitHub.com"标签
   - 选择你刚创建的仓库
   - 点击"Clone"
3. **复制文件**：
   - 将项目文件复制到克隆的仓库目录中
   - 在GitHub Desktop中查看更改
   - 填写提交信息，点击"Commit to main"
   - 点击"Push origin"

## 步骤3：配置GitHub Pages

1. **进入仓库设置**：
   - 打开你的GitHub仓库页面
   - 点击顶部的"Settings"标签
2. **配置GitHub Pages**：
   - 滚动到"GitHub Pages"部分
   - 在"Source"下拉菜单中选择"main"分支
   - 点击"Save"
   - 稍等片刻，GitHub Pages会生成一个URL（类似 `https://your-username.github.io/smart-agent/`）

## 步骤4：配置自定义域名

### 方法A：使用GitHub Pages的自定义域名功能

1. **购买域名**：
   - 在域名注册商（如GoDaddy、Namecheap等）购买一个域名
2. **配置DNS记录**：
   - 登录你的域名注册商控制面板
   - 找到DNS设置
   - 添加以下记录：
     - **A记录**：指向GitHub Pages的IP地址（185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153）
     - **CNAME记录**：将`www`指向`your-username.github.io`
3. **在GitHub中设置域名**：
   - 回到GitHub仓库的"Settings"页面
   - 在"GitHub Pages"部分，找到"Custom domain"输入框
   - 输入你的自定义域名（例如 `chat.yourdomain.com`）
   - 点击"Save"

### 方法B：使用Vercel或Netlify部署（推荐）

1. **注册Vercel或Netlify账号**：
   - Vercel：<https://vercel.com>
   - Netlify：<https://www.netlify.com>
2. **导入GitHub仓库**：
   - 登录Vercel或Netlify
   - 点击"New Project"或"Import site"
   - 选择你的GitHub仓库
   - 按照提示完成部署
3. **配置自定义域名**：
   - 在Vercel或Netlify的项目设置中，找到"Domains"或"Custom Domains"
   - 添加你的自定义域名
   - 按照提供的DNS记录配置指南设置域名

## 步骤5：修改项目配置

由于GitHub Pages和静态托管服务（如Vercel、Netlify）只支持静态网站，我们需要修改项目以适应静态部署环境。

### 创建静态版本的智能体

1. **创建静态版前端**：
   - 复制 `index.html` 为 `static-index.html`
   - 修改API调用部分，使用第三方AI服务或模拟响应
2. **使用GitHub Actions构建**（可选）：
   - 创建 `.github/workflows/build.yml` 文件，配置自动构建流程

## 步骤6：测试部署

1. **访问部署的网站**：
   - 通过GitHub Pages URL访问：`https://your-username.github.io/smart-agent/`
   - 或通过自定义域名访问：`https://chat.yourdomain.com`
2. **测试功能**：
   - 发送消息测试智能体的响应
   - 检查页面加载速度和功能完整性

## 部署注意事项

1. **API密钥安全**：
   - 不要将OpenAI API密钥直接硬编码在前端代码中
   - 使用环境变量或服务器端API代理
2. **性能优化**：
   - 压缩静态资源
   - 使用CDN加速
3. **HTTPS配置**：
   - 确保你的自定义域名启用了HTTPS
   - GitHub Pages和Vercel默认提供HTTPS
4. **监控和维护**：
   - 定期检查部署状态
   - 监控API使用情况

## 常见问题排查

1. **DNS配置问题**：
   - DNS更改可能需要24-48小时生效
   - 使用 `nslookup` 或 `dig` 命令检查DNS记录
2. **GitHub Pages构建失败**：
   - 检查仓库设置中的GitHub Pages配置
   - 查看构建日志了解错误原因
3. **API调用失败**：
   - 检查网络连接
   - 验证API密钥是否正确
   - 查看浏览器控制台的错误信息

## 部署方案对比

| 部署方式         | 优点                        | 缺点                       |
| ------------ | ------------------------- | ------------------------ |
| GitHub Pages | 免费，集成度高                   | 只支持静态网站，API调用受限          |
| Vercel       | 免费，支持Serverless Functions | 需要配置Serverless Functions |
| Netlify      | 免费，支持Serverless Functions | 需要配置Serverless Functions |
| 自建服务器        | 完全控制                      | 需要维护服务器，成本高              |

## 推荐部署方案

对于智能体项目，推荐使用 **Vercel** 或 **Netlify** 部署，因为：

1. 支持Serverless Functions，可以安全地处理API调用
2. 提供免费的HTTPS证书
3. 自动部署功能，每次推送代码都会自动更新
4. 全球CDN加速，提高访问速度

## 后续维护

1. **更新代码**：
   - 推送代码到GitHub仓库
   - Vercel/Netlify会自动部署更新

**监控使用情况**：

查看Vercel/Netlify的 analytics

监控API调用频率

**功能扩展**：

添加新的响应模式

- 集成更多AI模型
- 优化前端界面

部署完成后，你的智能体将可以通过自定义域名访问，为用户提供智能对话服务。
