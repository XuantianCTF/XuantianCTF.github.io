---
title: Linux 基础
description: Linux 系统基础知识、常用命令与有趣的历史故事。
date: 2026-07-18T00:00:00.000Z
tags:
  - Linux
  - 基础
  - 历史
---


## Linux 基础

Linux 是 CTF 和网络安全领域最重要的操作系统之一。几乎所有安全工具都优先支持 Linux，大部分 CTF 比赛的服务端也运行在 Linux 上。掌握 Linux 基础是学习安全的第一步。

### 为什么安全工程师必须学 Linux？

- **服务器市场占有率超过 90%**：互联网上绝大多数服务器运行 Linux
- **安全工具的主战场**：Kali Linux、Burp Suite、Metasploit 等工具都以 Linux 为主
- **开源透明**：任何人都可以审查源代码，发现漏洞
- **强大的命令行**：一行命令就能完成复杂的操作

---

## 一、Linux 有趣的历史

### Linus 的一封邮件

1991 年 8 月 25 日，一个 21 岁的芬兰大学生在 Usenet 新闻组发了一封邮件：

> "我在做一个（免费的）操作系统（只是个爱好，不会像 GNU 那样大而专业）……"

这个大学生叫 **Linus Torvalds**，这个"小爱好"就是 Linux。谁也没想到，30 多年后它会运行在全球 90% 以上的服务器上，驱动着 Android 手机，甚至在国际空间站上运行。

### GNU 是什么？Linux 和 GNU 是什么关系？

很多人把 Linux 称为"Linux 操作系统"，但严格来说，Linux 只是一个**内核**（Kernel）——操作系统最核心的部分。

而我们日常使用的"Linux 系统"（如 Ubuntu、CentOS）实际上是 **GNU/Linux**：
- **GNU 项目**（由 Richard Stallman 发起）提供了大量基础工具：编译器（gcc）、shell（bash）、文件工具（ls、cp、rm）等
- **Linux 内核**（由 Linus Torvalds 开发）负责管理硬件和系统资源

所以完整的称呼应该是 **GNU/Linux**，Linus 本人也表示过这个名字更准确。

### Unix 的恩怨情仇

Linux 的故事要从 Unix 说起：

```
1969 年  → AT&T 贝尔实验室开发了 Unix
1970 年  → Unix 在大学中广泛传播
1983 年  → GNU 项目启动，目标是创建自由的类 Unix 系统
1991 年  → Linux 内核诞生
1992 年  → Linux 采用 GPL 协议，完全开源
1993 年  → Debian 发行版诞生
1994 年  → Linux 1.0 内核发布
2004 年  → Ubuntu 发行版诞生
2008 年  → Android（基于 Linux 内核）手机发布
```

### 安全领域的 Linux 故事

- **1988 年**：Morris 蠕虫利用 Unix 栈溢出漏洞，感染了当时互联网上 10% 的计算机——这是历史上第一个大规模网络攻击，也催生了"计算机应急响应小组"（CERT）
- **2003 年**：Knoppix 发行版首次将"Live CD"概念带入 Linux——不用安装就能运行完整系统，这成为后来 Kali Linux 的雏形
- **2013 年**：Kali Linux 发布，成为渗透测试和安全审计的标准工具集
- **2015 年**：Linux 内核中发现了 "Dirty COW"（脏牛）漏洞，一个存在了 9 年的竞态条件漏洞，影响了从 2.6.22 到 4.8 的所有内核版本

### 彩蛋：Linux 中的有趣彩蛋

**1. 命令 `sl`（蒸汽机车）**

```bash
# 安装
sudo apt install sl

# 运行
sl
# 会看到一辆蒸汽机车从屏幕开过！

# 用途：当你不小心把 ls 打成 sl 时的"惩罚"😂
```

**2. 命令 `cmatrix`（黑客帝国）**

```bash
# 安装
sudo apt install cmatrix

# 运行
cmatrix
# 满屏绿色字符雨，就像《黑客帝国》一样
```

**3. 命令 `figlet`（大字报）**

```bash
# 安装
sudo apt install figlet

# 运行
figlet "Hello CTF"
# 用 ASCII 字符画出大字
```

**4. 命令 `cowsay`（会说话的牛）**

```bash
# 安装
sudo apt install cowsay

# 运行
cowsay "I love CTF"
# 一头牛说出你的话

# 还有各种角色
cowsay -f dragon "Fire!"
cowsay -f tux "Linux!"    # 企鹅 Tux，Linux 吉祥物
```

**5. `man` 手册的彩蛋**

```bash
# 看看 `man` 的彩蛋
man 7 git

# 或者看看这些
man 7 intro
man 7 signal
```

**6. `apt` 的彩蛋**

```bash
# Ubuntu 上试试
apt list --all-versions | grep "-"
# 你会看到 `apt` 有时会输出有趣的描述

# 还有
apt moo
# 看看有没有奶牛 🐄
```

**7. `fortune`（每日一言）**

```bash
# 安装
sudo apt install fortune

# 运行
fortune
# 随机显示一句名言或笑话

# 搭配 cowsay
fortune | cowsay -f tux
```

---

## 二、文件系统基础

### Linux 目录结构

Linux 采用"一切皆文件"的设计哲学，所有东西都是文件，包括硬件设备。

```
/               ← 根目录，所有目录的起点
├── bin         ← 基本命令（ls、cp、mv、rm）
├── sbin        ← 系统管理命令（sudo、reboot）
├── etc         ← 配置文件（用户、网络、服务）
├── home        ← 普通用户的主目录
│   └── user    ← 用户 user 的主目录（~）
├── root        ← root 用户的主目录
├── var         ← 可变数据（日志、缓存、数据库）
│   └── log     ← 系统日志
├── tmp         ← 临时文件（重启可能清空）
├── usr         ← 用户程序和数据
│   ├── bin     ← 用户命令
│   ├── lib     ← 库文件
│   └── share   ← 共享数据
├── opt         ← 第三方软件
├── dev         ← 设备文件（硬盘、终端等）
├── proc        ← 进程信息（虚拟文件系统）
└── boot       ← 启动文件（内核、引导程序）
```

### 文件权限

每个文件都有三组权限：**所有者**、**所属组**、**其他用户**

```bash
ls -la
# -rw-r--r-- 1 user group 4096 Jan 01 00:00 file.txt
# │├─┤├─┤├─┤
# │ │   │  └── 其他用户：只读
# │ │   └───── 所属组：只读
# │ └───────── 所有者：读写
# └──────────── 文件类型（- 普通文件，d 目录）
```

**权限数字表示：**
- `r`（读）= 4
- `w`（写）= 2
- `x`（执行）= 1

```bash
chmod 755 file.txt   # 所有者 rwx，组 r-x，其他 r-x
chmod 644 file.txt   # 所有者 rw-，组 r--，其他 r--
chmod 777 file.txt   # 所有人 rwx（危险！）
```

### 路径知识

**绝对路径 vs 相对路径：**
```bash
# 绝对路径：从根目录 / 开始
/home/user/file.txt

# 相对路径：从当前目录开始
./file.txt          # 当前目录
../file.txt         # 上一级目录
~/file.txt          # 用户主目录（~ 是 /home/user 的快捷方式）
```

---

## 三、常用命令

### 文件操作

```bash
# 浏览
ls              # 列出文件
ls -la          # 列出所有文件（包括隐藏文件）及详细信息
tree            # 树形显示目录结构

# 切换目录
cd /path        # 切换到指定目录
cd ~            # 回到主目录
cd -            # 回到上一次的目录
pwd             # 显示当前目录

# 创建和删除
mkdir dir       # 创建目录
touch file      # 创建空文件
rm file         # 删除文件
rm -r dir       # 递归删除目录
rm -rf dir      # 强制递归删除（危险！）

# 复制和移动
cp src dst      # 复制文件
cp -r src dst   # 复制目录
mv src dst      # 移动/重命名

# 查看内容
cat file        # 显示文件全部内容
head -n 20 file # 显示前 20 行
tail -n 20 file # 显示后 20 行
less file       # 分页查看（按 q 退出）
wc -l file      # 统计行数
```

### 搜索和查找

```bash
# 查找文件
find / -name "*.conf"           # 按名称查找
find / -type f -size +100M      # 查找大于 100MB 的文件
find / -perm -4000              # 查找 SUID 文件（提权常用！）

# 搜索内容
grep "pattern" file             # 在文件中搜索
grep -r "pattern" /path         # 递归搜索目录
grep -i "flag" *                # 忽略大小写搜索
```

### 进程管理

```bash
ps aux                 # 查看所有进程
ps aux | grep nginx    # 查找特定进程
top                    # 实时监控进程
htop                   # 增强版 top（更友好）

kill PID               # 终止进程
kill -9 PID            # 强制终止
pkill process_name     # 按名称终止

# 后台运行
command &              # 后台运行
nohup command &        # 后台运行，退出终端也不停止
jobs                   # 查看后台任务
fg %1                  # 将任务调回前台
```

### 网络命令

```bash
# 查看网络
ifconfig               # 查看网络接口（旧）
ip addr                # 查看网络接口（新）
netstat -tlnp          # 查看监听端口
ss -tlnp               # 查看监听端口（更快）

# 连接测试
ping target            # 测试连通性
curl http://target     # 发送 HTTP 请求
wget http://target     # 下载文件

# 远程连接
ssh user@host          # SSH 登录
scp file user@host:/   # 远程复制文件
```

### 用户管理

```bash
whoami                  # 当前用户名
id                      # 查看用户信息
who                     # 查看登录用户

sudo command            # 以 root 权限执行
su -                    # 切换到 root
su - username           # 切换用户

passwd                  # 修改密码
useradd username        # 创建用户
usermod -aG sudo user   # 将用户加入 sudo 组
```

### 文本处理

```bash
# 排序
sort file               # 排序
sort -u file            # 排序并去重

# 统计
uniq -c file            # 统计重复行
awk '{print $1}' file   # 提取第一列
cut -d':' -f1 /etc/passwd  # 提取字段

# 替换
sed 's/old/new/g' file  # 替换文本
tr 'a-z' 'A-Z' < file  # 大小写转换
```

---

## 四、包管理

### apt（Debian/Ubuntu）

```bash
sudo apt update                # 更新软件源
sudo apt upgrade               # 升级已安装的软件
sudo apt install package       # 安装软件
sudo apt remove package        # 卸载软件
apt search keyword             # 搜索软件
apt show package               # 查看软件信息
```

### yum/dnf（CentOS/Fedora）

```bash
sudo yum update                # 更新
sudo yum install package       # 安装
sudo yum remove package        # 卸载
```

---

## 五、Shell 基础

### 什么是 Shell？

Shell 是用户和操作系统之间的"翻译官"。你输入的命令由 Shell 解释，然后传递给内核执行。

常见的 Shell：
- **bash**：最常用（Bourne Again Shell）
- **zsh**：macOS 默认 Shell，功能更丰富
- **sh**：最古老的 Shell

### 重定向和管道

**重定向：**
```bash
command > file        # 输出重定向（覆盖）
command >> file       # 输出重定向（追加）
command 2> file       # 错误输出重定向
command &> file       # 所有输出重定向
command < file        # 输入重定向
```

**管道：**
```bash
# 把一个命令的输出作为另一个命令的输入
cat file | grep "flag" | sort | uniq
# 读取文件 → 搜索 flag → 排序 → 去重

ls -la | wc -l        # 统计当前目录文件数
ps aux | grep nginx   # 查找 nginx 进程
```

### 通配符

```bash
*           # 匹配任意字符（0 个或多个）
?           # 匹配单个字符
[abc]       # 匹配 a、b 或 c
[a-z]       # 匹配任意小写字母
{a,b,c}     # 匹配 a、b 或 c

# 举例
ls *.txt          # 列出所有 .txt 文件
ls file?.txt      # 匹配 file1.txt、fileA.txt 等
```

---

## 六、CTF 中的 Linux 技巧

### 提权相关

```bash
# 查找 SUID 文件（最常见的提权方式）
find / -perm -4000 2>/dev/null

# 查找可写的敏感文件
find / -writable -type f 2>/dev/null | grep -E "etc/passwd|etc/shadow"

# 查看内核版本（检查已知提权漏洞）
uname -a

# 查看 sudo 权限
sudo -l
```

### 信息收集

```bash
# 系统信息
uname -a            # 内核版本
cat /etc/os-release # 发行版信息
id                  # 当前用户信息
env                 # 环境变量

# 网络信息
ip addr             # IP 地址
cat /etc/resolv.conf # DNS 配置
netstat -tlnp       # 监听端口

# 用户信息
cat /etc/passwd     # 所有用户
cat /etc/shadow     # 密码哈希（需要 root）
w                   # 登录用户
last                # 最近登录记录
```

### 文件查找

```bash
# 查找包含 flag 的文件
grep -r "flag{" / 2>/dev/null
grep -r "XTCTF{" / 2>/dev/null

# 查找最近修改的文件
find / -mmin -60 -type f 2>/dev/null
find / -mtime -1 -type f 2>/dev/null

# 查找隐藏文件
find / -name ".*" -type f 2>/dev/null
```

---

## 七、练习建议

1. **安装虚拟机**：使用 VirtualBox 或 VMware 安装 Ubuntu，创建一个安全的练习环境
2. **每天使用 Linux**：强迫自己用命令行完成日常操作
3. **阅读 `man` 手册**：`man command` 是最好的学习资料
4. **做 CTF 题目**：实战是最好的老师
5. **搭建靶场**：DVWA、Pikachu 等 Web 靶场都运行在 Linux 上

### 推荐资源

- [Linux 命令大全](https://www.runoob.com/linux/linux-command-manual.html)
- [Linux 少年](https://linux.cn/) - Linux 技术社区
- [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/) - 通过游戏学 Linux 命令
- [picoCTF](https://picoctf.org/) - 入门 CTF 平台
