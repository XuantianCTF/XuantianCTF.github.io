+++
title = "文档中心"
description = "玄天 CTF 实验室技术文档与学习资源。"
+++

## 欢迎来到玄天 CTF 实验室文档中心

这里汇集了 CTF 各方向的学习资料、技术文档和实战指南。无论你是刚入门的新手，还是经验丰富的老手，都能找到适合你的内容。

---

### 📊 方向总览

| 方向 | 难度 | 适合人群 | 核心技能 |
|------|------|----------|----------|
| [Web 安全](web/) | ⭐⭐ | 入门首选 | SQL 注入、XSS、文件上传 |
| [杂项](misc/) | ⭐⭐ | 入门首选 | 隐写术、流量分析、编码解码 |
| [密码学](crypto/) | ⭐⭐⭐ | 数学基础好 | 古典密码、RSA、哈希攻击 |
| [逆向工程](reverse/) | ⭐⭐⭐⭐ | 编程基础好 | 汇编、调试、算法分析 |
| [PWN](pwn/) | ⭐⭐⭐⭐⭐ | 深入学习 | 内存安全、漏洞利用、ROP |
| [移动安全](mobile/) | ⭐⭐⭐ | 对移动端感兴趣 | Android 逆向、Frida Hook |

---

### 🎯 快速开始

如果你是 CTF 新手，建议按以下顺序学习：

1. **[快速入门](getting-started.md)** — 了解 CTF 是什么，选择适合你的方向
2. **选择一个方向** — 从上方表格中选择一个感兴趣的方向
3. **学习基础知识** — 阅读该方向的入门文档
4. **动手实践** — 在靶场中练习所学知识
5. **参加比赛** — 通过比赛检验学习成果

---

### 📚 各方向简介

#### [Web 安全](web/)

Web 安全是 CTF 中最常见也是最适合新手入门的方向。本方向涵盖 OWASP Top 10 中的各类漏洞，包括注入、XSS、文件上传、反序列化等。

**子方向：**
- [SQL 注入](web/sqli/) — 5 种注入类型、绕过技巧、sqlmap 自动化
- [XSS](web/xss/) — 3 种 XSS 类型、Payload 构造、CSP 绕过
- [文件上传](web/upload/) — 9 种绕过方法、Webshell 技术

#### [杂项](misc/)

杂项方向涵盖隐写术、流量分析、取证分析、编码解码等多种技术领域，综合性最强。

**子方向：**
- [隐写术](misc/steganography/) — LSB、盲水印、文件附加、EXIF
- [流量分析](misc/traffic/) — Wireshark、tshark、协议解析
- [内存取证](misc/forensics/) — Volatility、内存转储分析

#### [密码学](crypto/)

密码学融合了数学、计算机科学和信息论等多学科知识，从古典密码到现代密码体系。

**子方向：**
- [古典密码](crypto/classical/) — 凯撒、维吉尼亚、栅栏、培根
- [RSA 入门](crypto/rsa/) — 基本原理、常见攻击、解题工具

#### [逆向工程](reverse/)

逆向工程是分析程序的内部结构和逻辑的技术，需要扎实的汇编基础。

**子方向：**
- [逆向基础](reverse/basic/) — 汇编语言、调试工具、分析流程

#### [PWN](pwn/)

PWN 方向研究二进制程序的漏洞发现与利用技术，技术含量最高。

**子方向：**
- [栈溢出](pwn/stack-overflow/) — 栈帧结构、利用技术、安全机制绕过

#### [移动安全](mobile/)

移动安全方向专注于 Android 和 iOS 应用的安全分析与逆向工程。

**子方向：**
- [Android 逆向](mobile/android/) — APK 结构、反编译、动态分析

---

### 🛠 推荐工具

| 类别 | 工具 | 用途 |
|------|------|------|
| Web | Burp Suite | 抓包改包、漏洞扫描 |
| Web | sqlmap | SQL 注入自动化 |
| 逆向 | IDA Pro | 反汇编分析 |
| 逆向 | Ghidra | 开源逆向框架 |
| PWN | pwntools | 利用开发框架 |
| PWN | GDB + pwndbg | 调试器增强 |
| 密码 | CyberChef | 万能编解码工具 |
| 杂项 | Stegsolve | 图片隐写分析 |
| 杂项 | Wireshark | 流量分析 |
| 杂项 | Volatility | 内存取证 |
| 移动 | jadx | Android 反编译 |
| 移动 | Frida | 动态 Hook 框架 |

---

### 📖 学习资源

- [CTF Wiki](https://ctf-wiki.org/) — CTF 技术百科
- [BUUCTF](https://buuoj.cn/) — 国内最大 CTF 题库
- [CTFHub](https://www.ctfhub.com/) — 丰富的学习资源
- [Hack The Box](https://www.hackthebox.com/) — 渗透测试练习
- [CryptoHack](https://cryptohack.org/) — 密码学练习平台
- [pwnable.kr](http://pwnable.kr/) — PWN 练习平台

---

### 🤝 参与贡献

如果你想为文档贡献内容，请遵循以下流程：

1. 从 `main` 分支创建新分支
2. 在 `content/docs/` 下添加或修改文档
3. 提交 Pull Request 并等待审查
4. 合并后你的贡献将出现在网站上

详细贡献指南请参考 [README](https://github.com/XuantianCTF/XuantianCTF.github.io#-参与贡献)。
