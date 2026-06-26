# 玄天 CTF 实验室

一个专注于网络安全攻防技术研究与实战训练的开放平台。

🌐 **在线访问**：[xuantianctf.github.io](https://xuantianctf.github.io)

---

## 📚 文档方向

| 方向 | 说明 |
|------|------|
| [Web 安全](https://xuantianctf.github.io/docs/web-sqli/) | SQL 注入、XSS、文件上传等 Web 漏洞攻防 |
| [逆向工程](https://xuantianctf.github.io/docs/reverse-basic/) | 二进制分析、脱壳、调试等逆向技术 |
| [密码学](https://xuantianctf.github.io/docs/crypto-classical/) | 古典密码、RSA、哈希碰撞等密码学挑战 |
| [PWN](https://xuantianctf.github.io/docs/pwn-stack-overflow/) | 栈溢出、堆利用、ROP 等二进制漏洞利用 |
| [杂项](https://xuantianctf.github.io/docs/misc-steganography/) | 隐写术、流量分析、取证分析等综合技能 |
| [移动安全](https://xuantianctf.github.io/docs/mobile-android/) | Android/iOS 逆向与安全分析 |

## 🏠 博客

- [CTF 入门指南：各方向详解](https://xuantianctf.github.io/blog/ctf-beginners-guide/)
- [玄天 CTF 实验室正式上线](https://xuantianctf.github.io/blog/hello-world/)

## 🛠 技术栈

- **框架**：[Astro](https://astro.build/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **样式**：[Tailwind CSS](https://tailwindcss.com/)
- **模板**：基于 [Astro Portfolio](https://github.com/Gothsec/Astro-portfolio) 定制
- **部署**：[GitHub Pages](https://pages.github.com/) + GitHub Actions

---

## ✏️ 内容编辑指南

### 编写博客文章

在 `src/content/blog/` 目录下创建 `.md` 文件：

```
src/content/blog/
├── hello-world.md
├── ctf-beginners-guide.md
└── your-new-post.md
```

**文章模板**（`your-new-post.md`）：

```markdown
---
title: "文章标题"
description: "文章摘要（1-2 句话）"
date: 2026-06-21
tags:
  - 标签1
  - 标签2
---

## 正文内容

在这里编写文章内容...
```

**注意事项**：
- Front matter 使用 `---`（YAML 格式）
- `date` 格式为 `YYYY-MM-DD`
- `description` 用于列表页摘要展示
- `tags` 用于标签分类

### 编写文档

文档位于 `src/content/docs/` 目录，使用扁平化命名：

```
src/content/docs/
├── getting-started.md        # 快速入门
├── web-sqli.md               # SQL 注入
├── web-xss.md                # XSS
├── web-upload.md             # 文件上传
├── reverse-basic.md          # 逆向基础
├── crypto-classical.md       # 古典密码
├── crypto-rsa.md             # RSA
├── pwn-stack-overflow.md     # 栈溢出
├── misc-steganography.md     # 隐写术
├── misc-forensics.md         # 取证分析
├── misc-traffic.md           # 流量分析
├── mobile-android.md         # Android 逆向
├── pentest-recon.md          # 信息收集
├── pentest-exploit.md        # 漏洞利用
└── pentest-post-exploit.md   # 后渗透
```

**新建文档**：

1. 在 `src/content/docs/` 下创建 `.md` 文件
2. 文件名格式：`分类-主题.md`（如 `web-sqli.md`）
3. 添加 Front matter：

```markdown
---
title: "页面标题"
description: "页面描述（可选）"
date: 2026-06-21
tags:
  - 标签
---

## 内容标题

正文内容...
```

---

## 🚀 本地开发

### 环境要求

- Node.js v20+
- pnpm v9+

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/XuantianCTF/XuantianCTF.github.io.git
cd XuantianCTF.github.io

# 安装依赖
pnpm install
```

### 启动开发服务器

```bash
# 启动本地服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

---

## 📁 项目结构

```
├── src/
│   ├── components/           # Astro 组件
│   │   ├── nav.astro         # 导航栏
│   │   ├── home.astro        # 首页 Hero
│   │   ├── projects.astro    # CTF 方向展示
│   │   ├── contact.astro     # 联系方式
│   │   ├── footer.astro      # 页脚
│   │   └── logoWall.astro    # 技术栈滚动
│   ├── React/                # React 组件
│   │   ├── LetterGlitch.tsx  # 文字特效
│   │   └── SkillsList.tsx    # 技能列表
│   ├── content/
│   │   ├── blog/             # 博客文章
│   │   └── docs/             # 文档页面
│   ├── layouts/
│   │   └── Layout.astro      # 全局布局
│   └── pages/
│       ├── index.astro       # 首页
│       ├── blog/             # 博客路由
│       └── docs/             # 文档路由
├── public/                   # 静态资源
│   ├── fonts/                # 字体文件
│   └── svg/                  # 图标
├── astro.config.mjs          # Astro 配置
├── tailwind.config.mjs       # Tailwind 配置
├── tsconfig.json             # TypeScript 配置
└── .github/workflows/astro.yml  # GitHub Actions
```

---

## 🌿 分支策略

> **重要**：实验室成员不要直接在 `main` 分支上提交代码，必须通过分支开发 + PR 合并的方式工作。

### 分支命名规范

| 分支类型 | 命名格式 | 示例 |
|----------|----------|------|
| 功能开发 | `feature/<描述>` | `feature/add-web-docs` |
| 内容更新 | `content/<描述>` | `content/new-blog-post` |
| 问题修复 | `fix/<描述>` | `fix/broken-links` |
| 文档更新 | `docs/<描述>` | `docs/update-readme` |

### 工作流程

```bash
# 1. 从 main 创建新分支
git checkout main
git pull origin main
git checkout -b feature/your-feature

# 2. 开发并提交
git add .
git commit -m "feat: 描述你的更改"

# 3. 推送到远程分支
git push origin feature/your-feature

# 4. 在 GitHub 上创建 Pull Request
# 等待审查通过后合并到 main
```

### 禁止事项

- ❌ 直接向 `main` 分支推送代码
- ❌ 在未审查的情况下合并自己的 PR
- ❌ 使用 `git push --force` 覆盖远程分支
- ❌ 提交敏感信息（密码、密钥、Token 等）

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 从 `main` 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request，等待审查

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。
