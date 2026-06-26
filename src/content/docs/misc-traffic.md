---
title: 流量分析
description: 网络流量包分析技术。
date: 2026-06-21T08:00:00.000Z
---


## 流量分析

流量分析是 CTF 杂项方向的常见题型，需要从网络抓包文件（.pcap/.pcapng）中提取信息。

### 什么是流量分析？

流量分析是指捕获和分析网络通信数据包的过程。通过分析流量包，你可以看到网络中传输的所有数据，包括 HTTP 请求、DNS 查询、文件传输等。

在 CTF 中，流量分析题目通常要求你从捕获的流量中提取隐藏的 flag、密码、文件等信息。

### 流量分析的应用

- **网络安全监控**：检测异常流量和攻击行为
- **故障排查**：诊断网络连接问题
- **数字取证**：分析网络攻击过程
- **协议逆向**：理解未知协议的结构

---

### 一、Wireshark 基础

#### 常用过滤器

```bash
# 协议过滤
http
tcp
dns
icmp

# IP 过滤
ip.addr == 192.168.1.1
ip.src == 192.168.1.1
ip.dst == 192.168.1.1

# 端口过滤
tcp.port == 80
tcp.dstport == 443

# HTTP 过滤
http.request.method == "POST"
http.request.uri contains "flag"
http.response.code == 200

# DNS 过滤
dns.qry.name == "example.com"

# 内容搜索
frame contains "flag"
```

#### 常用操作

1. **追踪 TCP 流**：右键 → Follow → TCP Stream
2. **导出 HTTP 对象**：File → Export Objects → HTTP
3. **查看会话**：Statistics → Conversations

---

### 二、常见协议分析

#### 1. HTTP

```bash
# 过滤 HTTP 请求
http.request.method == "POST"

# 导出上传的文件
File → Export Objects → HTTP → Save All
```

#### 2. FTP

```bash
# 追踪 FTP 会话
ftp.request.command == "PASS"
ftp.request.command == "RETR"
```

#### 3. DNS

```bash
# DNS 隧道检测
dns.qry.name contains "flag"
dns.txt.len > 50

# 手动解析
# 统计 → DNS → 查看查询名称
```

#### 4. ICMP

```bash
# ICMP 隧道
icmp.type == 8   # Echo Request
icmp.type == 0   # Echo Reply

# 提取 ICMP 数据
tshark -r capture.pcap -Y "icmp" -T fields -e data
```

---

### 三、命令行分析

#### tshark

```bash
# 基本用法
tshark -r capture.pcap

# 过滤
tshark -r capture.pcap -Y "http.request"

# 显示特定字段
tshark -r capture.pcap -T fields -e http.request.uri

# 统计 HTTP 请求
tshark -r capture.pcap -q -z http,tree

# 提取 HTTP 对象
tshark -r capture.pcap --export-objects http,./output

# 提取文件
tshark -r capture.pcap -Y "tcp.port==21" --export-objects ftp-data,./ftp_files
```

#### tcpdump

```bash
# 读取 pcap
tcpdump -r capture.pcap

# 过滤
tcpdump -r capture.pcap 'tcp port 80'

# 显示 ASCII
tcpdump -r capture.pcap -A 'http'
```

---

### 四、流量分析脚本

```python
from scapy.all import *

# 读取 pcap
packets = rdpcap('capture.pcap')

# 提取 HTTP 数据
for pkt in packets:
    if pkt.haslayer(Raw):
        if b"flag" in pkt[Raw].load:
            print(pkt[Raw].load)

# 提取 ICMP 数据
for pkt in packets:
    if pkt.haslayer(ICMP):
        if pkt[ICMP].type == 8:  # Echo Request
            print(pkt[Raw].load)
```

---

### 五、Wireshark 分析流程

1. **统计概览**：Statistics → Capture File Properties
2. **协议分布**：Statistics → Protocol Hierarchy
3. **会话分析**：Statistics → Conversations
4. **DNS 查询**：Statistics → DNS
5. **HTTP 请求**：Statistics → HTTP → Requests

---

### 六、常见题型

| 类型 | 特征 | 方法 |
|------|------|------|
| HTTP 文件提取 | 上传/下载文件 | Export Objects |
| FTP 密码 | FTP 登录信息 | Follow TCP Stream |
| DNS 隧道 | 异常 DNS 查询 | 解析 DNS 数据 |
| ICMP 隧道 | ICMP 数据异常 | 提取 ICMP payload |
| 密码嗅探 | 明文传输 | Follow Stream |

---

### 七、练习平台

- [Wireshark Samples](https://www.wireshark.org/sample.html)
- [BUUCTF Misc 方向](https://buuoj.cn/)
- [Malware Traffic Analysis](http://www.malware-traffic-analysis.net/)
