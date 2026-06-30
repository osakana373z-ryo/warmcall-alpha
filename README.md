# WarmCall Alpha

养老陪伴聊天应用 — 让子女为父母建立专属档案，通过 AI 温暖陪伴，并在聊天结束后生成摘要报告。

**版本：Alpha 正式测试版**

## 技术栈

- **前端**：React + Vite + React Router
- **后端**：Node.js + Express + JWT + bcrypt
- **数据库**：SQLite（better-sqlite3）
- **AI**：Mock fallback + 可选 OpenAI 兼容 API

## 功能概览

### 子女端
- 手机号或邮箱 + 密码注册/登录
- 添加老人资料（需同意隐私说明）
- 复制长辈专属聊天链接
- 查看陪伴摘要，安心掌握近况

### 长辈端
- 打开专属链接即可聊天，无需登录
- 大字体、大按钮，温暖简洁
- 首次进入显示同意说明

### 开发者后台
- `/admin` 运营统计数据（不含完整聊天内容）

## 快速开始

```bash
# 安装依赖
npm run install:all

# 配置环境变量（可选）
cp server/.env.example server/.env

# 同时启动前后端
npm run dev
```

- 前端：http://localhost:5173
- 后端 API：http://localhost:3001

## 从 MVP 升级

请参阅 [MIGRATION.md](./MIGRATION.md)。

> **注意**：从 MVP mock 登录升级时，旧用户数据会被清空，需重新注册。

## 项目结构

```
warmcall/
├── client/                 # React 前端
├── server/
│   ├── services/
│   │   ├── aiService.js    # 真实 AI + Mock fallback
│   │   ├── mockAi.js
│   │   └── chatService.js
│   ├── routes/
│   └── db.js
├── MIGRATION.md
└── package.json
```

## 主要路由

| 路由 | 说明 |
|------|------|
| `/register` | 注册 |
| `/login` | 登录 |
| `/privacy` | 隐私与数据使用说明 |
| `/` | 子女首页（需登录） |
| `/elder-chat/:token` | 长辈公开聊天页 |
| `/admin` | 开发者后台 |

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 当前用户 |
| GET/POST | `/api/elders` | 老人档案 |
| POST | `/api/chat/sessions` | 子女端聊天 |
| GET | `/api/elder-chat/:token` | 长辈端信息 |
| POST | `/api/elder-chat/:token/sessions` | 长辈端聊天 |
| GET | `/api/admin/stats` | 运营统计 |

## 后续计划

- 真实短信/邮箱验证
- 授权诊断模式（后台查看详情）
- 语音陪伴
