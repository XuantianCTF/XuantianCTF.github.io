---
title: 内存取证
description: 内存取证基础与 Volatility 工具使用。
date: 2026-06-21T10:00:00.000Z
---


## 内存取证

内存取证是数字取证的重要分支，通过分析计算机内存转储（Memory Dump）来提取关键信息。在 CTF 杂项方向中，内存取证是常见且重要的题型。

### 什么是内存取证？

内存取证是指从计算机内存（RAM）中提取和分析数据的过程。与磁盘取证不同，内存取证关注的是系统运行时的临时数据，这些数据在关机后会立即消失。

内存中保存着大量敏感信息：
- 运行中的进程和命令
- 网络连接和通信数据
- 登录凭证和密码
- 加密密钥
- 注册表信息
- 剪贴板内容

### 为什么内存取证重要？

1. **实时数据**：内存保存着系统运行时的真实状态
2. **加密密钥**：即使磁盘加密，密钥可能仍在内存中
3. **反取证对抗**：攻击者可能清除磁盘痕迹，但内存难以完全清理
4. **恶意软件分析**：分析内存中的恶意代码行为

---

### 一、内存转储格式

常见的内存转储格式：

| 格式 | 说明 |
|------|------|
| .raw / .mem | 原始内存转储 |
| .vmem | VMware 虚拟机内存 |
| .vmsn | VMware 快照 |
| .vmss | VMware 挂起文件 |
| .lime | Linux 内存转储 |
| .elf | ELF 格式内存转储 |
| .dmp | Windows 内存转储 |
| .bin | 通用二进制格式 |

---

### 二、Volatility 工具

Volatility 是最流行的内存取证框架，支持多种操作系统和文件格式。

#### 安装

```bash
# Volatility 2
pip install volatility

# Volatility 3
pip install volatility3
```

#### 基本用法

```bash
# 查看内存转储信息
volatility -f memory.raw imageinfo

# 列出进程
volatility -f memory.raw --profile=Win7SP1x64 pslist

# 查看命令行历史
volatility -f memory.raw --profile=Win7SP1x64 cmdline

# 查看网络连接
volatility -f memory.raw --profile=Win7SP1x64 netscan

# 提取文件
volatility -f memory.raw --profile=Win7SP1x64 filescan
volatility -f memory.raw --profile=Win7SP1x64 dumpfiles -Q <物理地址> -D output/
```

#### 常用插件

| 插件 | 功能 |
|------|------|
| pslist | 列出所有进程 |
| pstree | 进程树 |
| cmdline | 命令行参数 |
| netscan | 网络连接 |
| filescan | 扫描文件 |
| dumpfiles | 提取文件 |
| memdump | 转储进程内存 |
| procdump | 转储可执行文件 |
| hivelist | 注册表 hive |
| hashdump | 提取密码哈希 |
| mftparser | MFT 记录 |
| clipboard | 剪贴板内容 |
| screenshot | 屏幕截图 |
| apihooks | API 钩子检测 |
| ldrmodules | 加载的模块 |
| handles | 句柄信息 |

---

### 三、Linux 内存取证

```bash
# 查看进程
volatility -f linux.mem --profile=LinuxProfile linux_pslist

# 查看命令历史
volatility -f linux.mem --profile=LinuxProfile linux_bash

# 查看网络连接
volatility -f linux.mem --profile=LinuxProfile linux_netstat

# 查看文件
volatility -f linux.mem --profile=LinuxProfile linux_ls
```

---

### 四、分析流程

1. **识别格式**：使用 `imageinfo` 确定操作系统和配置
2. **列出进程**：使用 `pslist` 查看运行中的程序
3. **检查网络**：使用 `netscan` 查看网络连接
4. **提取文件**：使用 `dumpfiles` 提取可疑文件
5. **分析内容**：使用 `strings` 或其他工具分析提取的数据

---

### 五、常见题型

| 类型 | 方法 |
|------|------|
| 查找进程 | pslist + pstree |
| 提取密码 | hashdump / lsadump |
| 网络分析 | netscan + connscan |
| 文件提取 | filescan + dumpfiles |
| 命令历史 | cmdline + bash_history |
| 注册表分析 | hivelist + printkey |
| 恶意进程 | malfind + apihooks |

---

### 六、Volatility 3 示例

```bash
# Volatility 3 基本用法
volatility3 -f memory.raw windows.info
volatility3 -f memory.raw windows.pslist
volatility3 -f memory.raw windows.cmdline
volatility3 -f memory.raw windows.netscan
volatility3 -f memory.raw windows.filescan
```

---

### 七、Windows 注册表分析

注册表是 Windows 的核心数据库，包含系统和应用的配置信息。

#### 注册表 Hive 文件

```bash
# 常见注册表 hive 文件位置
C:\Windows\System32\config\SYSTEM      # HKLM\SYSTEM
C:\Windows\System32\config\SOFTWARE    # HKLM\SOFTWARE
C:\Windows\System32\config\SAM         # HKLM\SAM（用户密码哈希）
C:\Windows\System32\config\SECURITY    # HKLM\SECURITY
C:\Windows\System32\config\DEFAULT     # HKU\.DEFAULT
%USERPROFILE%\NTUSER.DAT              # HKCU（每个用户）

# 离线分析 hive 文件
python3 vol.py -f memory.raw --profile=Win7SP1x64 hivelist
python3 vol.py -f memory.raw --profile=Win7SP1x64 printkey -K "ControlSet001\Control\ComputerName\ComputerName"
```

#### 注册表取证关键位置

```bash
# 自动运行程序
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
HKCU\Software\Microsoft\Windows\CurrentVersion\Run

# 服务信息
HKLM\SYSTEM\CurrentControlSet\Services

# 网络历史
HKLM\SOFTWARE\Microsoft\WindowsNT\CurrentVersion\NetworkList

# USB 设备历史
HKLM\SYSTEM\CurrentControlSet\Enum\USBSTOR
HKLM\SYSTEM\CurrentControlSet\Enum\USB

# 用户最近打开的文件
HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\RecentDocs

# MRU（最近使用的程序）
HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\RunMRU
```

#### Volatility 注册表分析

```bash
# 列出注册表 hive
volatility -f memory.raw --profile=Win7SP1x64 hivelist

# 打印注册表键值
volatility -f memory.raw --profile=Win7SP1x64 printkey -K "ControlSet001\Control\ComputerName\ComputerName"

# 打印子键
volatility -f memory.raw --profile=Win7SP1x64 printkey -K "ControlSet001\Services\Tcpip\Parameters" -r

# 提取密码哈希
volatility -f memory.raw --profile=Win7SP1x64 hashdump
volatility -f memory.raw --profile=Win7SP1x64 lsadump  # LSA 密钥

# 提取缓存的域凭据
volatility -f memory.raw --profile=Win7SP1x64 cachedump
```

---

### 八、Prefetch 文件分析

Prefetch（预读取）文件记录程序的执行历史，用于取证分析。

#### Prefetch 文件位置

```bash
C:\Windows\Prefetch\*.pf
C:\Windows\Prefetch\ReadyBoot\*.pf
```

#### 分析工具

```bash
# PECmd（Eric Zimmerman 工具）
PECmd.exe -f C:\Windows\Prefetch\CALC.EXE-12345678.pf
PECmd.exe -d C:\Windows\Prefetch\ --csv output.csv

# Volatility 提取 Prefetch
volatility -f memory.raw --profile=Win7SP1x64 prefetchparser
volatility -f memory.raw --profile=Win7SP1x64 prefetchparser -D output/

# 使用 python 解析
python3 prefetch.py -f CALC.EXE-12345678.pf
```

#### Prefetch 包含的信息

| 字段 | 说明 |
|------|------|
| 执行次数 | 该程序的运行次数 |
| 最后执行时间 | 上次运行的时间戳 |
| 文件引用 | 程序加载的所有文件路径 |
| 运行次数 | 总共执行了多少次 |
| Volumes | 涉及的文件卷信息 |

#### 取证价值

```bash
# 1. 查找恶意软件执行痕迹
ls C:\Windows\Prefetch\ | grep -i "mimikatz\|nc\|psExec\|malware"

# 2. 分析程序执行时间线
PECmd.exe -d C:\Windows\Prefetch\ --csv timeline.csv

# 3. 发现已删除但曾执行的程序
# Prefetch 文件不会随程序删除而自动清除
```

---

### 九、Shimcache 与 Amcache 分析

#### Shimcache（应用程序兼容性缓存）

Shimcache 记录系统中所有已执行的可执行文件路径和最后修改时间。

```bash
# Shimcache 位置
HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\AppCompatCache

# Volatility 提取
volatility -f memory.raw --profile=Win7SP1x64 shimcache

# Shimcache 包含：
# - 完整文件路径
# - 最后修改时间（$STANDARD_INFORMATION）
# - 文件大小
# - 执行标志（是否被执行过）
```

#### Amcache

Amcache 是 Windows 8+ 的程序执行缓存，记录更详细的信息。

```bash
# Amcache 位置
%SystemRoot%\appcompat\Programs\Amcache.hve

# 分析工具
python3 vol.py -f memory.raw --profile=Win81x64 amcache

# 提取的信息
# - 文件路径和名称
# - SHA1 哈希值
# - 产品名称和版本
# - 文件大小和修改时间
# - 安装和执行时间
```

#### 对比表

| 特性 | Shimcache | Amcache |
|------|-----------|---------|
| Windows 版本 | XP+ | 8+ |
| 存储位置 | 注册表 | Amcache.hve |
| 信息详细度 | 低 | 高（含哈希、版本） |
| 记录数量 | 有限（最多 1024） | 几乎无限制 |
| 是否可清除 | 不清除（历史永久） | 可被清理 |

---

### 十、MFT 与 USN Journal 分析

#### MFT（Master File Table）

MFT 是 NTFS 文件系统的核心，记录所有文件和目录的元数据。

```bash
# MFT 位置
\$MFT

# 提取 MFT
volatility -f memory.raw --profile=Win7SP1x64 mftparser > mft.txt
volatility -f memory.raw --profile=Win7SP1x64 mftparser -D mft_output/

# 分析工具
MFTExplorer.exe -f \$MFT
MFTDump.exe -f \$MFT --csv output.csv
```

#### MFT 关键属性

| 属性类型 | 说明 |
|---------|------|
| $STANDARD_INFORMATION | 标准信息（创建、修改、访问时间） |
| $FILE_NAME | 文件名（含删除前的原始名称） |
| $DATA | 文件数据 |
| $INDEX_ROOT / $INDEX_ALLOCATION | 目录索引 |
| $OBJECT_ID | 对象 ID |

#### USN Journal（Update Sequence Number Journal）

记录文件系统的所有变更操作。

```bash
# USN Journal 位置
\$UsnJrnl\$J
\$UsnJrnl\$Max

# Volatility 提取
volatility -f memory.raw --profile=Win7SP1x64 usnparser

# 分析工具
USNJournalExplorer.exe -f \$UsnJrnl\$J

# USN 记录包含的信息
# - 文件名
# - 操作类型（创建、删除、修改、重命名）
# - 时间戳
# - 原因（数据扩展、属性修改等）
```

#### 取证流程

```bash
# 1. 提取 MFT
volatility -f memory.raw --profile=Win7SP1x64 mftparser -D mft_out/

# 2. 查找已删除的文件（$FILE_NAME 属性仍存在）
grep -A 10 "Deleted" mft.txt

# 3. 分析文件时间线
# $STANDARD_INFORMATION 可被修改（时间戳伪造）
# $FILE_NAME 难以修改（更可靠的证据）
# 对比两者差异可以检测时间戳伪造

# 4. 提取特定文件
icat -r raw.dd 45-128-3 > recovered.png
```

---

### 十一、浏览器痕迹分析

#### Chrome 取证

```bash
# 浏览器数据位置
%USERPROFILE%\AppData\Local\Google\Chrome\User Data\Default\

# 关键文件
# History       - SQLite 数据库（访问历史）
# Bookmarks     - JSON 文件（书签）
# Cookies       - SQLite 数据库（Cookie）
# Login Data    - SQLite 数据库（保存的密码）
# Current Session - 当前会话
# Current Tabs  - 当前标签页
# Downloads     - SQLite 数据库（下载历史）
# Favicons      - 网站图标
```

```bash
# 使用 sqlite3 分析 Chrome 历史
sqlite3 History ".headers on"
sqlite3 History "SELECT url, title, last_visit_time FROM urls ORDER BY last_visit_time DESC LIMIT 10;"

# Chrome 时间戳转换（1601-01-01 为起点）
python3 -c "
import datetime, sqlite3
conn = sqlite3.connect('History')
for row in conn.execute('SELECT url, last_visit_time FROM urls ORDER BY last_visit_time DESC LIMIT 5'):
    ts = row[1] / 1000000 - 11644473600
    dt = datetime.datetime.fromtimestamp(ts)
    print(f'{dt}: {row[0]}')
"
```

#### Firefox 取证

```bash
%USERPROFILE%\AppData\Roaming\Mozilla\Firefox\Profiles\*.default\

# places.sqlite  - 书签和访问历史
# cookies.sqlite - Cookie
# logins.json    - 保存的密码（加密）
# key4.db        - 解密密钥
# downloads.sqlite - 下载历史
# sessionstore.jsonlz4 - 会话恢复（含打开标签页的 URL）
```

---

### 十二、其他工具

| 工具 | 用途 |
|------|------|
| Rekall | Google 开发的内存取证框架 |
| LiME | Linux 内存提取工具 |
| WinPmem | Windows 内存提取工具 |
| Belkasoft RAM Capturer | 内存转储工具 |
| Magnet RAM Capture | 内存获取工具 |
| PECmd | Prefetch 分析工具 |
| MFTExplorer | MFT 分析工具 |
| MFTDump | MFT 导出工具 |
| Eric Zimmerman Tools | 取证工具合集 |

---

### 十三、练习平台

- [Volatility Labs](https://www.volatility-labs.org/)
- [CTFtime Misc 方向](https://ctftime.org/)
- [Forensics Wiki](https://forensics.wiki/)
