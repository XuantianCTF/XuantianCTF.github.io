+++
title = "XSS"
description = "跨站脚本攻击原理与利用。"
date = 2026-06-21T00:00:00.000Z
+++

## XSS（跨站脚本攻击）

XSS（Cross-Site Scripting）是一种将恶意脚本注入到网页中的攻击方式。

### 类型

- **反射型 XSS**：恶意代码通过 URL 参数注入
- **存储型 XSS**：恶意代码被存储到服务器
- **DOM 型 XSS**：在客户端 DOM 中执行恶意代码

### 利用方式

```html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
```

### 防御措施

- 输入过滤与转义
- Content Security Policy（CSP）
- HttpOnly Cookie
