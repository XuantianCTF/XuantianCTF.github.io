---
title: Linux 基础
description: Linux 系统基础、常用命令与 CTF 实战技巧。
date: 2026-07-18T00:00:00.000Z
tags:
  - Linux
  - 基础
---


## Linux 基础

CTF 的服务器基本都跑在 Linux 上，安全工具也优先支持 Linux，学这行绕不开它。不过讲命令之前，先讲个关于它怎么来的故事。

### 一切从一封邮件开始

1991 年 8 月 25 日，一个 21 岁的芬兰大学生在 Usenet 的 minix 新闻组里发了一封邮件，开头是这样的：

> "Hello everybody out there using minix - I'm doing a (free) operating system (just a hobby, won't be big and professional like gnu) for 386(486) AT clones."

翻译过来是：我在做一个免费操作系统，只是爱好，不会像 GNU 那样大而专业。

发帖的人叫 Linus Torvalds，当时还在赫尔辛基大学读书。他嫌学校教学用的 minix 不够好用，想自己写个内核试试，没打算改变世界，邮件里还特意声明这只是一时兴起。

结果这东西越滚越大。三十多年后，它跑在全世界的服务器上、Android 手机上，甚至空间站里。当年那封"只是爱好"的邮件，成了计算机史上最有名的一封。

### Linux 是什么

严格来说 Linux 只是一个内核（Kernel），负责管硬件和系统资源。平时用的 Ubuntu、CentOS 是把它和 GNU 项目的一堆工具（gcc、bash、ls）打包起来的完整系统，所以叫 GNU/Linux 更准确。

如今服务器、Android 手机都跑着它，吉祥物是一只叫 Tux 的企鹅。

### 一切皆文件

Linux 的思路是"一切皆文件"。设备、进程在它眼里都是文件，/dev 下面是设备，/proc 下面是进程信息，系统的绝大多数操作最后都是读写文件。

### Shell 是什么

Shell 是你和系统之间的翻译。你敲的命令由它解释，再交给内核执行。常见的有 bash、zsh（macOS 默认）、sh（最老的）。

---

### 一、目录结构

目录是约定俗成的，不用硬记，用多了自然熟：

```
/               ← 根目录
├── bin         ← 基本命令（ls、cp、mv）
├── sbin        ← 系统管理命令（sudo、reboot）
├── etc         ← 配置文件
├── home        ← 普通用户主目录
├── root        ← root 用户主目录
├── var         ← 常变的数据（日志、缓存）
├── tmp         ← 临时文件
├── usr         ← 用户程序和库
├── opt         ← 第三方软件
├── dev         ← 设备文件
├── proc        ← 进程信息
└── boot        ← 启动文件
```

几个名字有来历：etc 是 "et cetera"（还有其他），bin 是 binary（二进制），lib 是 library（库），tmp 是 temporary（临时）。

### 二、文件权限

每个文件有三组权限：所有者、所属组、其他用户。

```
ls -la
-rw-r--r-- 1 user group 4096 Jan 01 00:00 file.txt
│├─┤├─┤├─┤
│ │   │  └── 其他用户：只读
│ │   └───── 所属组：只读
│ └───────── 所有者：读写
└──────────── 文件类型（- 文件，d 目录）
```

权限用数字算：r（读）=4，w（写）=2，x（执行）=1。

```bash
chmod 755 file.txt   # 所有者 rwx，组 r-x，其他 r-x
chmod 644 file.txt   # 所有者 rw-，组 r--，其他 r--
chmod 777 file.txt   # 所有人 rwx，危险
```

### 三、常用命令

按用途挑 CTF 里最常碰到的列。

文件操作：

```bash
ls -la          # 列出所有文件（含隐藏文件）
cd /path        # 切换目录
pwd             # 当前目录
mkdir dir       # 创建目录
touch file      # 创建空文件
rm -rf dir      # 强制递归删除，危险
cp -r src dst   # 复制目录
mv src dst      # 移动或重命名
cat file        # 查看文件
head -n 20 file # 前 20 行
tail -n 20 file # 后 20 行
less file       # 分页查看，q 退出
wc -l file      # 统计行数
```

搜索和查找：

```bash
find / -name "*.conf"       # 按名称找
find / -perm -4000          # 找 SUID 文件，提权常用
grep -r "pattern" /path     # 递归搜内容
grep -i "flag" *            # 忽略大小写
```

进程管理：

```bash
ps aux | grep nginx   # 找进程
top                   # 实时监控
kill -9 PID           # 强杀
nohup command &       # 后台跑，退出终端也不停
```

网络：

```bash
ip addr               # 查看网卡
ss -tlnp              # 监听端口
ping target           # 连通性
curl http://target    # 发 HTTP 请求
ssh user@host         # SSH 登录
```

用户与权限：

```bash
whoami     # 当前用户
id         # 用户信息
sudo cmd   # 以 root 执行
su -       # 切到 root
passwd     # 改密码
```

文本处理：

```bash
sort -u file             # 排序去重
uniq -c file             # 统计重复行
awk '{print $1}' file    # 取第一列
cut -d':' -f1 file       # 按分隔符取字段
sed 's/old/new/g' file   # 替换
tr 'a-z' 'A-Z' < file    # 大小写转换
```

### 四、Shell 技巧

重定向把输出送进文件：

```bash
command > file    # 覆盖写入
command >> file   # 追加
command 2> file   # 错误输出
command < file    # 输入重定向
```

管道把一个命令的输出交给下一个命令当输入，是命令行里最顺手的组合方式：

```bash
cat file | grep "flag" | sort | uniq
ps aux | grep nginx
```

通配符：

```bash
*      # 任意字符
?      # 单个字符
[a-z]  # 区间
ls *.txt
```

### 五、包管理

Debian/Ubuntu 用 apt，CentOS/Fedora 用 yum 或 dnf：

```bash
sudo apt update              # 更新软件源
sudo apt install package     # 安装
sudo apt remove package      # 卸载
```

### 六、CTF 里常碰到的

在靶机上无非三类事：找提权点、收集信息、找 flag。

```bash
# 找 SUID 文件，最常见的提权路径
find / -perm -4000 2>/dev/null

# 内核版本和 sudo 权限，对照已知漏洞
uname -a
sudo -l

# 系统信息
cat /etc/os-release
env

# 用户信息
cat /etc/passwd
cat /etc/shadow        # 密码哈希，要 root

# 找 flag
grep -r "flag{" / 2>/dev/null
grep -r "XTCTF{" / 2>/dev/null
find / -mmin -60 -type f 2>/dev/null   # 最近 60 分钟动过的文件
```

### 练习建议

装个虚拟机或直接开个 VPS，把它当日常系统用，命令敲熟了比看教程管用。想边玩边学可以打 [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/)，它把 Linux 命令做成了过关游戏。入门资料可以翻 [Linux 命令大全](https://www.runoob.com/linux/linux-command-manual.html)，刷题找 [picoCTF](https://picoctf.org/)。
