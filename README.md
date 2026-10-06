# 简历与岗位匹配助手

面向求职者的简历-岗位匹配 Web 应用：粘贴简历与岗位描述，获得**有依据的匹配分析**和**逐条可采纳的修改建议**，最终导出修改后的 Markdown 简历。

> 技术栈：React + Spring Boot + MySQL + DeepSeek（OpenAI 兼容）。
> 需求详见 `需求归档.md`，设计详见 `技术方案.md`。

---

## 目录结构

```
├── backend/            # Spring Boot 后端（Java 17 / Maven）
├── frontend/           # React 前端（Vite + TypeScript）
├── docker-compose.yml  # mysql + backend + frontend 编排
├── .env.example        # 环境变量模板
├── 需求归档.md          # 需求文档
└── 技术方案.md          # 技术设计文档
```

## 快速启动

### 1. 准备环境变量

```bash
cp .env.example .env
# 编辑 .env，填入：
#   - MySQL 密码（MYSQL_ROOT_PASSWORD / MYSQL_PASSWORD）
#   - DeepSeek API Key（DEEPSEEK_API_KEY）
#   - JWT 签名密钥（JWT_SECRET）
```

> 密钥只走服务端环境变量，`.env` 已被 `.gitignore` 忽略，不会进入仓库或前端代码。

### 2. 启动

```bash
docker compose --env-file .env up --build
```

启动后：

- 前端：http://localhost:80
- 后端健康检查：http://localhost:8080/actuator/health（含 DB 连接状态）
- 后端探测：http://localhost:8080/api/ping

### 3. 停止 / 清理

```bash
docker compose down            # 停止（保留数据卷）
docker compose down -v         # 停止并删除数据卷（数据会丢）
```

---

## 本地开发（不依赖 Docker）

后端（需本机 Java 17 + Maven）：

```bash
cd backend
mvn spring-boot:run
```

前端（需本机 Node 18+）：

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173，/api 已代理到 localhost:8080
```

## 当前进度

- [x] M1 项目骨架 + docker-compose + MySQL 连通
- [ ] M2 认证 + 简历/岗位 CRUD
- [ ] M3 DeepSeek 集成 + 异步分析
- [ ] M4 分析/建议/版本/导出
- [ ] M5 测试账号 + 场景验证 + README 完善
