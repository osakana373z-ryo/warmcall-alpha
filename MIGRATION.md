# WarmCall Alpha 数据库迁移说明

本文档说明从 **MVP 演示版** 升级到 **Alpha 正式测试版** 时的数据库变更与初始化方式。

## 自动迁移（推荐）

启动服务时，`server/db.js` 会自动检测并迁移 SQLite 数据库（`server/warmcall.db`）。

```bash
cd server
npm install
npm run dev
```

首次启动 Alpha 版本时，迁移脚本会：

1. 若检测到旧版 mock 登录用户表（无 `password_hash`）：
   - 清空 `chat_messages`、`chat_sessions`、`memories`、`elders`
   - 删除 `auth_sessions` 与旧 `users` 表
   - **旧演示账号与数据将被清除，需重新注册**

2. 创建 / 更新 Alpha 表结构（见下方「新表结构」）

3. 为已有 `elders` 记录补全 `access_token`（若缺失）

## 全新初始化

若希望从空库开始：

```bash
# 停止服务后删除数据库文件
rm server/warmcall.db server/warmcall.db-wal server/warmcall.db-shm

# 重新启动
npm run dev
```

Windows PowerShell：

```powershell
Remove-Item server\warmcall.db* -ErrorAction SilentlyContinue
npm run dev
```

## 新表结构

| 表名 | 说明 |
|------|------|
| `users` | 用户账号（手机号或邮箱 + bcrypt 密码） |
| `elders` | 老人档案，绑定 `user_id`，含 `access_token` |
| `chat_sessions` | 聊天会话，绑定 `elder_id`，摘要存 `summary` |
| `chat_messages` | 聊天消息，绑定 `session_id` |
| `memories` | 陪伴记忆，绑定 `elder_id`（会话结束时提取） |

### 关键字段

**users**
- `phone` / `email`：至少填一项，唯一
- `password_hash`：bcrypt 加密
- `parent_consent_at`：子女注册/同意时间

**elders**
- `user_id`：所属子女用户
- `access_token`：长辈专属聊天链接令牌（自动生成）
- `elder_consent_at`：长辈首次同意聊天时间

## 环境变量

复制 `server/.env.example` 为 `server/.env`：

```bash
cp server/.env.example server/.env
```

| 变量 | 说明 |
|------|------|
| `JWT_SECRET` | JWT 签名密钥（生产必改） |
| `JWT_EXPIRES_IN` | 令牌有效期，默认 `30d` |
| `ADMIN_KEY` | 开发者后台密钥 |
| `AI_API_KEY` | 可选，配置后启用真实 AI |
| `AI_API_BASE_URL` | AI 接口地址，默认 OpenAI 兼容 |
| `AI_MODEL` | 模型名称，默认 `gpt-4o-mini` |

未配置 `AI_API_KEY` 时，系统自动使用 Mock AI。

## Alpha 与 MVP 的主要差异

| 项目 | MVP | Alpha |
|------|-----|-------|
| 登录 | 手机号 + 固定验证码 | 手机号/邮箱 + 密码 |
| 会话令牌 | UUID + 数据库 | JWT |
| 长辈入口 | 无 | `/elder-chat/:accessToken` |
| 隐私同意 | 无 | 子女添加老人前 + 长辈首次聊天 |
| AI | 仅 Mock | Mock fallback + 可选真实 API |
| 记忆 | 无 | `memories` 表 |

## 验证迁移成功

```bash
# 健康检查
curl http://localhost:3001/api/health

# 注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"account":"13800138000","password":"test123","parent_consent":true}'
```

返回 `token` 与 `user` 即表示迁移与认证正常。

## 回滚

Alpha 不保证可回滚到 MVP。如需保留 MVP 数据，请在升级前备份：

```bash
cp server/warmcall.db server/warmcall.db.mvp-backup
```
