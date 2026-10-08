# 简历与岗位匹配助手

面向求职者的简历-岗位匹配 Web 应用：粘贴简历与岗位描述，获得**有依据的匹配分析**和**逐条可采纳的修改建议**，最终导出修改后的 Markdown 简历。

> 技术栈：React + Spring Boot + MySQL + DeepSeek（OpenAI 兼容）。
> 需求详见 `需求归档.md`，设计详见 `技术方案.md`。

---

## 功能清单

- **简历/岗位管理**：粘贴创建、列表、删除；支持「AI 排版」把原始简历整理成规范模板。
- **匹配分析**：后端调用 DeepSeek，逐条展示「岗位要求 → 简历原文证据 → 三态判定（已体现/未体现/需确认）与原因」，采用 RAG（分块检索 + 逐条判断）+ 证据校验（拦截编造）。
- **修改建议**：改稿建议（原文→建议、可编辑后采纳）+ 补充问题（需确认项）；采纳/补充可**一键撤回**。
- **修改稿**：每次分析独立一份修改稿（互不关联），可手动编辑、保存、导出 Markdown。
- **历史与隔离**：分析历史持久化（刷新/重登不丢）、多账号数据隔离、失败可重试。

---

## 目录结构

```
├── backend/             # Spring Boot 后端（Java 17 / Maven）
├── frontend/            # React 前端（Vite + TypeScript）
├── scripts/seed.py      # 测试数据初始化脚本（幂等）
├── docker-compose.yml   # mysql + backend + frontend 编排
├── .env.example         # 环境变量模板
├── 需求归档.md / 技术方案.md
└── 测试验证清单.md       # 测试账号、材料与验证场景
```

---

## 快速启动（Docker）

### 1. 准备环境变量

```bash
cp .env.example .env
# 编辑 .env，填入 MySQL 密码（MYSQL_ROOT_PASSWORD / MYSQL_PASSWORD）与 JWT 签名密钥（JWT_SECRET）
# DEEPSEEK_API_KEY 可选：作为兜底 key（用户未在界面配置时回退使用），留空则要求用户自行配置
```

### 2. 启动

```bash
docker compose --env-file .env up --build
```

启动后：

- 前端：http://localhost:80
- 后端健康检查：http://localhost:8080/actuator/health（含 DB 连接状态）
- 后端探测：http://localhost:8080/api/ping

### 3. 初始化测试数据（可选）

**方式 A：一键脚本（需 Python 3）**

```bash
python scripts/seed.py
```

一键注册 2 个测试账号 + 导入 2 份虚构简历 + 2 份岗位（脚本幂等，可重复运行）。

**方式 B：手动创建（无需任何脚本）**

登录后进入「简历」「岗位」页，把 `测试验证清单.md` 中「完整素材文本」逐条粘贴创建即可：

- 账号 `candidate1@test.com`：简历「张伟-后端开发」+ 岗位「Java 后端开发工程师」；
- 账号 `candidate2@test.com`：简历「李娜-前端开发」+ 岗位「前端开发工程师」。

> 测试素材的完整文本（简历/岗位全文）见 `测试验证清单.md`，两种方式二选一即可。

### 4. 配置 API Key

两种方式，**用户自助配置优先**：

1. **环境变量兜底**：在 `.env` 中设置 `DEEPSEEK_API_KEY`（服务端环境变量，验收方式）；
2. **用户自助配置**：登录后点右上角「设置 API Key」粘贴自己的 key（保存时自动验证连接）。

> **安全说明**：用户自助配置的 key 仅存服务端**内存**（会话级），不落库、不进镜像、不写仓库；服务重启或重新登录后需重新配置。若两种都未配置，发起分析时会明确提示「请先配置 API Key」。

### 5. 停止 / 清理

```bash
docker compose down            # 停止（保留数据卷）
docker compose down -v         # 停止并删除数据卷（数据会丢）
```

---

## 测试账号

| 账号 | 密码 | 材料 | 用途 |
|---|---|---|---|
| `candidate1@test.com` | `pass123456` | 张伟（后端）× Java 后端岗位 | 较匹配组合 + 无量化成果验证 |
| `candidate2@test.com` | `pass123456` | 李娜（前端）× 前端岗位 | 信息缺口组合 + 数据隔离验证 |

完整测试场景见 `测试验证清单.md`。

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

---

## 架构设计

- **前后端分离**：React 单页应用（无路由库，状态切换）+ Spring Boot REST API。
- **认证**：JWT 无状态认证（Spring Security + BCrypt），所有资源按 `userId` 隔离。
- **异步分析**：发起分析后落库 `RUNNING`，线程池异步调用模型，前端轮询状态直到 `SUCCESS/FAILED`。
- **数据模型**：`resumes`（原稿/草稿）、`jobs`、`analyses`（分析快照 + 独立修改稿）、`job_requirements`（要求-证据-三态）、`suggestions`（建议）、`revisions`（保存版本）。
- **持久化**：MySQL 数据卷（`mysql_data`），重建容器数据保留。

## 关键取舍

- **RAG 用字符重叠检索**而非向量库：单份简历场景全文本就在上下文，字符重叠足够且无需引入 Embedding 依赖。
- **证据校验（Grounding check）**作为防幻觉主力：模型输出证据后，校验其是否原文子串，编造则降级为「未体现」。
- **修改稿为分析级**（每份分析独立），而非简历级：支持「新分析不覆盖旧修改稿」。
- **API Key 配置**：用户自助配置（内存态）优先、服务端环境变量兜底——既满足「密钥走环境变量」的验收要求，又支持「不落库、防泄露、每次登录重配」。

## 已知限制

- 模型输出质量依赖 DeepSeek 能力与 Prompt，虽有多重约束仍无法 100% 杜绝幻觉（故有证据校验 + 原文引用可核对）。
- 用户自助配置的 API Key 存服务端内存，服务重启即失效（需重新配置；若配置了环境变量兜底 key 则不受影响）。
- 匹配度为「已体现条数 / 总条数」的简化占比，非严谨评分模型。
- 未做 OCR/PDF 解析、招聘网站采集、评分排行榜等（见需求归档「范围边界」）。

---

## 需求与设计文档

- `需求归档.md`：功能需求、匹配判定规则、版本模型、RES/VER 测试场景清单。
- `技术方案.md`：架构、DDL、API、里程碑（M1-M5）。
- `测试验证清单.md`：测试账号、虚构材料、9 个验证场景及实测结论。
