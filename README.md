# 玄天 CTF 实验室

一个专注于网络安全攻防技术研究与实战训练的开放平台。

🌐 **在线访问**：[xuantianctf.github.io](https://xuantianctf.github.io)

---

## 📚 文档方向

| 方向 | 说明 |
|------|------|
| [Web 安全](https://xuantianctf.github.io/docs/web/) | SQL 注入、XSS、文件上传等 Web 漏洞攻防 |
| [逆向工程](https://xuantianctf.github.io/docs/reverse/) | 二进制分析、脱壳、调试等逆向技术 |
| [密码学](https://xuantianctf.github.io/docs/crypto/) | 古典密码、RSA、哈希碰撞等密码学挑战 |
| [PWN](https://xuantianctf.github.io/docs/pwn/) | 栈溢出、堆利用、ROP 等二进制漏洞利用 |
| [杂项](https://xuantianctf.github.io/docs/misc/) | 隐写术、流量分析、取证分析等综合技能 |
| [移动安全](https://xuantianctf.github.io/docs/mobile/) | Android/iOS 逆向与安全分析 |

## 🏠 博客

- [CTF 入门指南：各方向详解](https://xuantianctf.github.io/blog/ctf-beginners-guide/)
- [玄天 CTF 实验室正式上线](https://xuantianctf.github.io/blog/hello-world/)

## 🛠 技术栈

- **静态网站生成器**：[Hugo](https://gohugo.io/) v0.163.3
- **主题**：[HugoBlox Easy Docs](https://github.com/HugoBlox/hugo-theme-documentation)
- **CSS 框架**：[Tailwind CSS](https://tailwindcss.com/)
- **部署**：[GitHub Pages](https://pages.github.com/) + GitHub Actions

---

## ✏️ 内容编辑指南

### 编写博客文章

在 `content/blog/` 目录下创建**子目录**，每个子目录包含一个 `index.md` 文件：

```
content/blog/
├── _index.md                    # 博客列表页（勿删）
├── my-new-post/
│   └── index.md                 # 你的文章
└── another-post/
    └── index.md
```

**文章模板**（`index.md`）：

```markdown
---
title: "文章标题"
summary: "文章摘要（1-2 句话）"
date: 2026-06-21
tags:
  - 标签1
  - 标签2
categories:
  - 分类
---

## 正文内容

在这里编写文章内容...
```

**注意事项**：
- Front matter 使用 `---`（YAML 格式），不是 `+++`
- `date` 格式为 `YYYY-MM-DD`
- 不需要 `authors` 字段，直接写文章即可
- 博客列表页 `_index.md` 包含 `view: date-title-summary`，**不要修改**

### 编写文档

文档位于 `content/docs/` 目录，支持嵌套层级：

```
content/docs/
├── _index.md                    # 文档首页（勿删）
├── getting-started.md           # 快速入门
├── web/
│   ├── _index.md                # Web 安全子页面首页
│   ├── sqli.md                  # SQL 注入
│   ├── xss.md                   # XSS
│   └── upload.md                # 文件上传
├── reverse/
│   ├── _index.md
│   └── basic.md
├── crypto/
│   ├── _index.md
│   ├── classical.md
│   └── rsa.md
├── pwn/
│   ├── _index.md
│   └── stack-overflow.md
├── misc/
│   ├── _index.md
│   ├── steganography.md
│   ├── traffic.md
│   └── forensics.md
└── mobile/
    ├── _index.md
    └── android.md
```

**新建文档页面**：

1. 在对应目录下创建 `.md` 文件
2. 添加 Front matter：

```markdown
---
title: "页面标题"
description: "页面描述（可选）"
date: 2026-06-21T00:00:00.000Z
---

## 内容标题

正文内容...
```

**新建文档子方向**：

1. 在 `content/docs/` 下创建新目录
2. 创建 `_index.md` 作为该方向首页：

```markdown
---
title: "方向名称"
---

## 引言

该方向的介绍文字和学习路线...
```

**注意事项**：
- 文档目录的 `_index.md` 控制侧边栏导航顺序，可通过 `weight` 字段调整
- `_index.md` 中的 `{{< button >}}` 等 shortcode 已被新主题移除，使用普通 Markdown 链接

---

## 🚀 本地开发

### 环境要求

- Hugo v0.163.3+（Extended 版本）
- Node.js v22+
- Go 1.19+

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/XuantianCTF/XuantianCTF.github.io.git
cd XuantianCTF.github.io

# 安装 Node.js 依赖（Tailwind CSS、Preact、Pagefind）
npm install
```

### 启动开发服务器

```bash
# 启动本地服务器（含草稿）
hugo server -D

# 构建生产版本
hugo --minify

# 生成搜索索引
npx pagefind --site public
```

---

## 📁 项目结构

```
├── config/                    # Hugo 配置（YAML 格式）
│   └── _default/
│       ├── hugo.yaml          # 主配置
│       ├── params.yaml        # 主题参数
│       ├── languages.yaml     # 语言配置
│       ├── menus.yaml         # 菜单配置
│       └── module.yaml        # Hugo 模块配置
├── content/                   # 内容目录
│   ├── _index.md              # 首页（使用 blocks 构建）
│   ├── blog/                  # 博客文章（每篇一个子目录）
│   └── docs/                  # 文档目录
│       ├── web/               # Web 安全
│       ├── reverse/           # 逆向工程
│       ├── crypto/            # 密码学
│       ├── pwn/               # PWN
│       ├── misc/              # 杂项
│       └── mobile/            # 移动安全
├── static/                    # 静态资源
├── themes/theme-documentation/  # HugoBlox 主题
├── go.mod                     # Hugo 模块依赖
└── .github/workflows/hugo.yml  # GitHub Actions 部署
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
- ❌ 修改 `layouts/` 目录下的文件（除非你确定知道自己在做什么）

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
