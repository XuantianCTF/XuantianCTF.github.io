---
title: "从静态文件到反向代理：Web 架构与 HTTP 入门"
description: "从静态文件、CGI、PHP-FPM 到前后端分离、反向代理、负载均衡与 CDN，理解每一层设计解决的问题，以及一个请求最终如何落到磁盘上的文件。"
date: 2026-11-06
tags:
  - Web安全
  - CTF
  - HTTP
  - Apache
  - 架构
---

浏览器输入地址，按下回车，几百毫秒后页面出现。这中间通常经过 DNS、TCP/TLS、CDN 边缘、负载均衡、反向代理、应用进程，最后才轮到数据库或缓存。

Web 今天的复杂度不是一次性设计出来的，而是一层层叠加的结果。每一层都在解决上一阶段暴露的问题，同时也引入新的边界。这篇文章按「问题 → 方案 → 新问题」的顺序，把 Web 从静态文件讲到当前常见架构，再回到单机 Apache 与 HTTP 协议，最后看安全边界。

配套代码在 [XuantianCTF/ctf-web-lab](https://github.com/XuantianCTF/ctf-web-lab)：一套 Linux + Apache2 + PHP 的最小示例站点，只包含安全写法与观察工具，不含靶标和 flag。

---

## 一、最小起点：静态文件服务器

Web 最早的需求很简单：让不同机器上的文档可以互相访问。

解决方案是一个 HTTP 服务器加一条映射规则——把 URL 路径映射到磁盘路径，读出文件，加上响应头，写回连接。Apache 的 `DocumentRoot` 就是这条规则的起点：

```apache
DocumentRoot /var/www/ctf
```

请求 `/index.html` 时，服务器打开 `/var/www/ctf/index.html`。请求 `/` 时，按 `DirectoryIndex` 的顺序寻找首页：

```apache
DirectoryIndex index.php index.html
```

返回前还要确定 `Content-Type`，浏览器据此决定渲染方式：

| 扩展名 | 响应头 |
|---|---|
| `.html` | `text/html; charset=utf-8` |
| `.css` | `text/css` |
| `.js` | `application/javascript` |
| `.png` | `image/png` |
| `.json` | `application/json` |

这一层的设计假设是：内容固定、所有人看到同一份、服务器只读。它解决了文档共享，但解决不了「根据用户和输入生成不同内容」。

静态服务器的两个副产物，后来都成了常见的信息泄露来源：

- 目录没有首页时，`Options Indexes` 会让服务器列出目录内容；
- 文件按扩展名决定类型，服务器不关心内容是否真的是那个类型。

---

## 二、动态内容：CGI 与常驻进程

### 2.1 CGI：每个请求启动一个进程

要让服务器根据请求计算内容，最早的通路是 CGI（Common Gateway Interface）。服务器把请求参数放进环境变量，把请求体接到脚本的标准输入，脚本把响应写到标准输出。

```
浏览器 ── HTTP ──> Apache ── fork/exec ──> CGI 程序
                     ▲                        │
                     └────── stdout ──────────┘
```

一个 CGI 程序大致要处理这些环境变量：

| 变量 | 内容 |
|---|---|
| `REQUEST_METHOD` | `GET` / `POST` |
| `QUERY_STRING` | URL 中 `?` 之后的部分 |
| `CONTENT_TYPE` | 请求体的类型 |
| `CONTENT_LENGTH` | 请求体的长度 |
| `PATH_INFO` | URL 中脚本名之后的部分 |

CGI 的设计目标是把「Web 服务器」和「业务程序」解耦：脚本可以用 Perl、Python、C、Shell 写，服务器只负责传参和转发输出。进程级隔离也带来稳定性，脚本崩溃不会拖垮服务器。

代价是性能。每个请求都要 fork/exec 一次，解释器启动、模块加载、进程回收都是固定开销。并发一高，进程数就被压垮。

安全上的影响也来自这套传参方式：环境变量、查询串、路径信息全部是外部输入，而早期脚本习惯把它们直接拼进 shell 命令或文件路径。`/cgi-bin/` 因此长期是扫描器的重点目录。

### 2.2 模块化：把解释器嵌进服务器

省掉进程启动开销的直接办法，是让解释器常驻在 Web 服务器进程里。Apache 的 `mod_php` 就是这种设计：PHP 作为模块加载，请求到达后在 worker 进程内直接编译执行。

```
Apache worker (prefork)
 ├── 读取 .php 文件
 ├── 交给 libphp 编译执行
 └── 输出写回 socket
```

这种模式简单、部署成本低，至今仍大量存在于中小型项目。它有两个结构性限制：

- **与 MPM 绑定**：`mod_php` 要求 prefork（多进程）模型，无法使用 event MPM 的高并发能力；
- **与服务器同进程同权限**：应用代码、Web 服务器、文件读取都在同一个身份下完成，任何一处出问题都会互相影响。

### 2.3 FastCGI 与 PHP-FPM：进程池

更常见的现代做法是把应用运行时拆出来，用 FastCGI 协议通信。Nginx 负责连接与静态文件，PHP-FPM 维护一组常驻 worker，按需处理动态请求。

```
浏览器 → Nginx (TLS/静态/缓存) --FastCGI--> PHP-FPM worker
                                      └──> MySQL / Redis
```

FastCGI 与 CGI 的关键区别是进程常驻、连接复用，参数通过二进制协议传递，而不是每次启动进程。PHP-FPM 还负责 worker 数量、超时、进程回收和慢日志。

三种方式放在一起对比：

| 方式 | 进程模型 | 优点 | 局限 |
|---|---|---|---|
| CGI | 每请求一个进程 | 隔离彻底、语言无关 | 启动开销大、并发差 |
| `mod_php` | 服务器进程内 | 部署简单、无网络开销 | 与 MPM 绑定、耦合紧 |
| FastCGI / FPM | 常驻进程池 | 性能好、职责分离 | 多一层配置与协议 |

到这一步，「Web 服务器」和「应用服务器」已经是两个角色：前者处理连接、TLS、静态资源，后者执行代码。角色分离之后，下一步自然是把它们放到不同机器上。

---

## 三、职责分离：前端与后端

### 3.1 两个运行位置

页面变复杂之后，把所有 HTML 都放在服务端模板里越来越难维护。于是职责被拆成两部分：

- **前端**：运行在浏览器里的 HTML、CSS、JavaScript，负责结构、样式、交互与渲染；
- **后端**：运行在服务器上的程序，负责业务逻辑、数据读写、认证授权和输入校验。

两者通过 HTTP 接口通信，最常见的数据格式是 JSON：

```
GET /api/posts/1 HTTP/1.1
Host: example.com
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json

{"id":1,"title":"...","author":"..."}
```

这个边界一旦建立，前端就不再只是「页面」，而是一个可以独立部署、独立缓存、独立发版的客户端。同一个后端可以同时服务网页、移动端和小程序。

### 3.2 渲染发生在哪一侧

「前端」和「后端」经常和渲染方式混在一起，实际有三种常见组合：

| 模式 | HTML 在哪生成 | 特点 |
|---|---|---|
| SSR（服务端渲染） | 服务器 | 首屏快、利于 SEO，每次请求都要经过后端 |
| CSR / SPA（客户端渲染） | 浏览器执行 JS | 交互流畅、后端只提供 API，首屏依赖 JS |
| SSG（静态生成） | 构建时 | 最快、易缓存，适合内容不常变的站点 |

现代框架经常混合使用：首屏由服务端渲染，后续交互交给浏览器；或者构建时生成静态页，再由客户端补充动态数据。

### 3.3 边界带来的新问题

职责分离解决了维护性问题，也把信任边界画得更清楚：

- **前端代码完全公开**。浏览器里的校验、隐藏字段、注释、接口地址都能被看到，所以所有校验必须在后端重做；
- **跨域成为常态**。前端与 API 不同源时，需要 CORS 正确配置；配置过宽等于把接口开放给任意站点；
- **认证方式变化**。传统服务端会话用 Cookie，前后端分离后常用 Bearer Token 或 JWT，令牌的存储位置、过期与撤销都需要单独设计；
- **接口数量增长**。每个页面可能对应多个 API，版本管理、限流、错误码规范都成为架构的一部分。

这也解释了一个常见现象：同一个功能，网页端做了限制，直接调用 API 却能绕过。问题不在前端写得不好，而在后端把「前端已经校验过」当成了事实。

---

## 四、统一入口：正向代理与反向代理

### 4.1 两种代理，方向相反

「代理」本质上是中间人。区别在于它站在哪一侧、代表谁。

**正向代理**站在客户端一侧。客户端显式配置代理地址，请求先发给代理，再由代理转发到目标服务器。目标服务器看到的是代理的地址，而不是真实客户端。

```
客户端 ──配置代理──> 正向代理 ──> 目标服务器
```

常见用途：公司统一出口、VPN、访问控制、缓存、隐藏客户端来源。正向代理的关键特征是**客户端知道代理的存在，并且主动使用它**。

**反向代理**站在服务器一侧。客户端以为自己访问的就是源站，实际上请求先到达反向代理，再由它转发给后端。

```
客户端 ──> 反向代理 (Nginx) ──> 应用服务器
```

客户端不需要任何配置，也不知道后面有几台机器。反向代理的关键特征是**客户端无感，代理代表服务器**。

| 维度 | 正向代理 | 反向代理 |
|---|---|---|
| 站位 | 客户端 | 服务端 |
| 客户端是否感知 | 是，需显式配置 | 否 |
| 隐藏谁 | 客户端 | 服务器拓扑 |
| 典型产品 | Squid、公司出口、VPN | Nginx、HAProxy、Envoy、Apache |
| 主要目的 | 出网控制、缓存、匿名 | 入口统一、TLS、路由、防护 |

### 4.2 反向代理解决什么问题

把反向代理放在入口，一次解决多个问题：

- **TLS 终止**：证书只在代理上配置，后端只处理明文 HTTP；
- **路由**：按 `Host` 或路径把请求分给不同后端，例如 `/api` 给应用、`/static` 给对象存储；
- **静态资源与缓存**：静态文件由代理直接返回，动态请求才进入应用；
- **压缩与连接管理**：统一做 gzip/brotli、HTTP/2、长连接；
- **限流与防护**：在入口做速率限制、WAF、IP 黑白名单；
- **隐藏拓扑**：外部只知道代理地址，后端可以位于内网；
- **统一日志**：所有请求在入口留下记录。

一个最小的 Nginx 配置：

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate     /etc/ssl/example.com.pem;
    ssl_certificate_key /etc/ssl/example.com.key;

    root /var/www/static;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.3 代理引入的信任边界

反向代理之后，后端看到的 TCP 对端是代理，不是用户。为了传递真实来源，代理会加上 `X-Forwarded-For`、`X-Real-IP`、`X-Forwarded-Proto` 等头。

这些头是普通请求头，客户端也可以自己伪造。只有当请求确实来自可信代理，并且后端显式配置了信任时，它们才有意义：

- Nginx：`set_real_ip_from` + `real_ip_header`；
- Apache：`mod_remoteip` + `RemoteIPTrustedProxy`；
- Node/Express：`app.set('trust proxy', ...)`。

默认情况下，`REMOTE_ADDR` 仍然是连接的对端地址。把「取真实 IP」写成「直接读 `X-Forwarded-For` 的第一段」，等于把来源判断交给客户端。

代理还引入了另一类问题：**两套解析器**。代理和后端对路径规范化、百分号编码、重复斜杠、`..`、`PATH_INFO` 的理解可能不同。一个请求在代理看来是静态文件，在后端看来却可能匹配到动态脚本。请求走私、路径绕过、缓存投毒，很多都源于这类差异。

---

## 五、规模扩展：负载均衡与会话

### 5.1 从一台到多台

单实例的问题有两个：容量上限和单点故障。解决办法是横向扩展，前面加负载均衡。

```
            ┌── app-1 ──┐
客户端 → LB ─┼── app-2 ──┼── 共享存储 / Redis / DB
            └── app-3 ──┘
```

负载均衡可以工作在两个层次：

- **L4（传输层）**：按 TCP/UDP 连接转发，性能高，不理解 HTTP；
- **L7（应用层）**：解析 HTTP，按路径、Header、Cookie 路由，能做灰度与重写。

常见调度策略有轮询、加权轮询、最少连接、一致性哈希。健康检查决定一台实例何时被摘除。

### 5.2 会话放在哪里

多实例之后，用户的请求可能落到任意一台机器，会话不再天然绑定。常见三种方案：

| 方案 | 做法 | 优点 | 代价 |
|---|---|---|---|
| 粘性会话 | 负载均衡把同一用户固定到一台 | 改动小 | 故障切换差、负载不均 |
| 集中式会话 | 会话写入 Redis / 数据库 | 任意实例可处理 | 多一次网络依赖 |
| 无状态令牌 | 状态放进签名令牌（如 JWT） | 易扩展 | 撤销、续期、泄露处理更复杂 |

文件上传同样要处理：本地磁盘只对单实例可见，通常改为对象存储，或者挂共享文件系统。

### 5.3 多实例带来的差异

多实例不是简单复制。版本、配置、WAF 规则、上传目录、时区、依赖版本都可能在滚动发布时短暂不一致。攻击面往往就藏在这些差异里：一台机器修了、另一台没修；代理层拦了、后端没拦。

同时，内网服务之间的信任通常比对外接口宽松。健康检查、管理端口、内部 API 往往只校验「请求来自内网」，一旦有一个 SSRF，就可能沿内网横向。

---

## 六、速度与防护：CDN 与边缘

用户与服务器之间的物理距离、跨国链路、突发流量，靠增加后端机器解决不了。CDN 把内容推到离用户更近的边缘节点。

```
客户端 → CDN 边缘 → 回源 → 源站 (Nginx/Apache)
```

CDN 不只是缓存，通常还承担：

- TLS 终止与证书管理；
- 静态资源缓存与压缩；
- WAF、DDoS 清洗、Bot 管理；
- 动态加速与回源优化；
- 日志与访问分析。

缓存的核心是「缓存键」：哪些请求算同一个资源。缓存键漏掉 `Host`、查询串、`Cookie`、`Accept-Encoding` 中的任何一项，都可能让不同用户拿到彼此的内容。

CDN 也画出一条新的边界：**边缘与源站**。

- 缓存键设计不当会导致缓存投毒或缓存欺骗；
- 源站 IP 一旦泄露，就可以绕过 CDN 和 WAF 直连；
- 边缘与源站对 URL、`Host`、编码的理解差异，可能被用来绕过访问控制；
- 回源请求的来源 IP 通常是 CDN 节点，源站不能把它当成真实用户。

---

## 七、运行形态：容器与 Serverless

### 7.1 容器：把运行环境一起打包

「在我机器上是好的」是长期存在的部署问题。容器把应用和依赖打包成镜像，运行时由编排系统调度。

```
Ingress → Service → Pod (app)
                     ├── sidecar (日志/代理)
                     └── 依赖服务
```

容器解决的是环境一致性和交付效率，编排系统解决的是调度、扩缩容、服务发现和滚动发布。代价是配置复杂度上升：镜像、环境变量、ConfigMap、Secret、网络策略都成为需要维护的代码。

从安全角度看，容器的边界由镜像来源、运行时权限、网络策略和宿主机配置共同决定。云环境的元数据服务（如 `169.254.169.254`）往往保存实例凭证，因此成为 SSRF 的高价值目标。

### 7.2 Serverless：把进程也抽象掉

函数计算进一步隐藏服务器：代码按事件触发，平台负责扩缩容和计费。

```
事件源 → 函数运行时 → 依赖服务
```

适合事件驱动、流量波动大的任务。限制也很明确：运行时长、内存、临时存储、冷启动、无状态。权限通常通过角色授予，一旦函数权限过宽，一个注入点就可能调用云 API。

### 7.3 形态对比

| 形态 | 关注点 | 典型场景 | 主要代价 |
|---|---|---|---|
| 单机 / 虚拟机 | 简单直接 | 小站、内部系统、教学环境 | 扩展与故障恢复靠人工 |
| 容器 + 编排 | 一致性与弹性 | 微服务、持续交付 | 配置与运维复杂度 |
| Serverless | 免运维与按需计费 | 事件处理、定时任务、API | 运行时限制、冷启动 |

架构没有绝对优劣。单体应用在团队规模小、业务边界清晰时往往更高效；微服务解决的是组织与部署的耦合，同时引入分布式系统的复杂度。

---

## 八、当前典型架构全景

把前面的层叠起来，一个现代 Web 请求通常是这样走的：

```
Browser
  │ HTTPS
  ▼
CDN / WAF            边缘缓存、TLS、DDoS 清洗
  │
  ▼
Load Balancer        L4/L7，健康检查，流量分发
  │
  ▼
Reverse Proxy        Nginx / Envoy，路由、静态资源、限流
  ├── /static/*  → 对象存储 / CDN
  ├── /api/*     → 应用实例（PHP-FPM / Node / Java）
  └── /ws/*      → WebSocket 服务
                       │
                       ├── Redis        会话、缓存、限流
                       ├── MySQL/PG     持久化数据
                       └── MQ           异步任务
```

各层的职责可以概括为：

| 层 | 解决的问题 | 典型组件 |
|---|---|---|
| 边缘 | 距离、带宽、攻击流量 | CDN、WAF |
| 负载均衡 | 容量、可用性 | L4/L7 LB |
| 反向代理 | 统一入口、路由、TLS | Nginx、Envoy |
| 应用 | 业务逻辑 | PHP-FPM、Node、Java |
| 数据 | 持久化与共享状态 | MySQL、Redis、对象存储 |

本讲义后面的实验环境，是这张图的最小折叠版：把边缘、负载均衡、反向代理、应用服务器全部收进一台机器上的 Apache。这样做的目的不是模拟生产，而是让每一层的机制都能被单独观察——请求行、路由规则、文件映射、进程身份、权限与日志，在生产架构里同样存在，只是被更多层包裹。

---

## 九、回到单机：Apache2 部署

### 9.1 安装

以 Debian / Ubuntu 为例：

```bash
sudo apt update
sudo apt install -y apache2 libapache2-mod-php php php-cli curl net-tools

sudo systemctl enable --now apache2
systemctl status apache2 --no-pager
```

`libapache2-mod-php` 把 PHP 作为 Apache 模块加载，对应上一章的 `mod_php` 形态。

### 9.2 核心目录

| 路径 | 作用 |
|---|---|
| `/etc/apache2/apache2.conf` | 主配置 |
| `/etc/apache2/ports.conf` | 监听端口 |
| `/etc/apache2/sites-available/` | 可用站点配置 |
| `/etc/apache2/sites-enabled/` | 已启用站点（软链接） |
| `/etc/apache2/mods-available/`、`mods-enabled/` | 模块与启用状态 |
| `/etc/apache2/conf-available/`、`conf-enabled/` | 通用片段 |
| `/var/www/html/` | 默认站点根目录 |
| `/var/log/apache2/access.log` | 访问日志 |
| `/var/log/apache2/error.log` | 错误日志 |

启用与停用站点，本质是在 `sites-enabled/` 里创建或删除指向 `sites-available/` 的软链接：

```bash
sudo a2ensite mysite     # enable
sudo a2dissite mysite    # disable
sudo a2enmod rewrite     # 启用模块
ls -l /etc/apache2/sites-enabled/
```

### 9.3 一个最小虚拟主机

```apache
# /etc/apache2/sites-available/ctf.conf
<VirtualHost *:80>
    ServerName ctf.local
    DocumentRoot /var/www/ctf

    <Directory /var/www/ctf>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    DirectoryIndex index.php index.html

    ErrorLog  ${APACHE_LOG_DIR}/ctf_error.log
    CustomLog ${APACHE_LOG_DIR}/ctf_access.log combined
</VirtualHost>
```

各指令的作用：

| 指令 | 作用 |
|---|---|
| `VirtualHost *:80` | 该站点监听所有网卡的 80 端口 |
| `ServerName` | 与请求的 `Host` 头匹配；无匹配时落到默认站点 |
| `DocumentRoot` | URL 到文件的映射起点 |
| `<Directory>` | 对该目录的访问控制 |
| `Options Indexes` | 没有首页时列出目录内容 |
| `Options FollowSymLinks` | 允许跟随符号链接 |
| `AllowOverride All` | 允许 `.htaccess` 覆盖配置 |
| `DirectoryIndex` | 请求目录时按序寻找首页 |
| `CustomLog ... combined` | 日志包含 Referer 与 User-Agent |

启用并验证：

```bash
sudo a2ensite ctf
sudo a2dissite 000-default      # 默认站点会作为兜底抢走请求
sudo apache2ctl configtest      # 必须看到 Syntax OK
sudo systemctl reload apache2
```

### 9.4 三层自检

部署完不要只看浏览器，按三层各验证一次：

```bash
# 系统层：谁在监听 80
sudo ss -lntp | grep ':80'

# 服务层：加载了哪些站点与模块
apache2ctl -S
apache2ctl -M | grep -E 'php|rewrite|alias|headers|mpm'

# 协议层：报文长什么样
curl -v http://ctf.local/ 2>&1 | head -30
```

`apache2ctl -S` 会列出每个虚拟主机的端口、域名、`DocumentRoot`，以及默认站点。排错时这是第一条命令。

### 9.5 常见启动失败

```bash
sudo apache2ctl configtest                 # 语法
sudo systemctl status apache2 --no-pager   # 状态
sudo journalctl -u apache2 -n 50           # 服务日志
sudo tail -n 50 /var/log/apache2/error.log # 应用错误
sudo ss -lntp | grep ':80'                 # 检查端口占用
```

---

## 十、HTTP 协议

HTTP 是各层之间的共同语言。代理、负载均衡、CDN、应用服务器都按同一套报文格式理解请求。

### 10.1 请求报文

```
GET /info.php?a=1 HTTP/1.1        ← 请求行：方法 SP 目标 SP 版本
Host: ctf.local                    ← 请求头
User-Agent: curl/8.5.0
Accept: */*
Cookie: PHPSESSID=abc123
Content-Length: 0                  ← 空行：头部结束
                                   ← 请求体（GET 通常为空）
```

### 10.2 响应报文

```
HTTP/1.1 200 OK                    ← 状态行
Server: Apache/2.4.62 (Debian)     ← 响应头
Content-Type: text/html; charset=UTF-8
Content-Length: 1234
Set-Cookie: PHPSESSID=abc123; Path=/

<!doctype html> ...                ← 响应体
```

### 10.3 方法

| 方法 | 语义 | 幂等 | 常见用途 |
|---|---|---|---|
| `GET` | 获取资源 | 是 | 参数在 URL，会进日志与历史 |
| `HEAD` | 只要响应头 | 是 | 探测资源是否存在、看长度 |
| `POST` | 提交数据 | 否 | 参数在 body，`Content-Type` 决定解析方式 |
| `PUT` | 上传/替换 | 是 | 是否被错误地开放 |
| `DELETE` | 删除 | 是 | 同上 |
| `OPTIONS` | 查询支持的方法 | 是 | `Allow` 头泄露信息 |
| `TRACE` | 回显请求 | 是 | 历史上用于 XST，现多关闭 |
| `PATCH` | 局部修改 | 否 | 常被忽略的入口 |
| `CONNECT` | 建隧道 | 否 | 代理场景 |

很多访问控制只针对 `GET`，换个方法就可能绕过，所以排查时要把方法也当作变量。

### 10.4 状态码

| 段 | 含义 | 常见 |
|---|---|---|
| 1xx | 信息 | `100 Continue`、`101 Switching Protocols` |
| 2xx | 成功 | `200 OK`、`201 Created`、`204 No Content` |
| 3xx | 重定向 | `301` 永久、`302` 临时、`304` 未修改、`307/308` 保持方法 |
| 4xx | 客户端错误 | `400` 语法错误、`401` 未认证、`403` 禁止、`404` 不存在、`405` 方法不允许、`413` 体过大、`429` 限流 |
| 5xx | 服务端错误 | `500` 内部错误、`502` 网关错误、`503` 不可用、`504` 超时 |

`401` 表示身份尚未证明，`403` 表示身份已证明但不允许。`403` 与 `404` 的差异本身就是信息：路径存在但被拒绝，还是根本不存在，会影响下一步判断。

### 10.5 重要请求头

| 头 | 作用 | 说明 |
|---|---|---|
| `Host` | 目标虚拟主机 | HTTP/1.1 中必需；反向代理按它路由 |
| `Content-Type` | 请求体格式 | 决定服务端按表单、JSON 还是 multipart 解析 |
| `Content-Length` | 请求体字节数 | 与 `Transfer-Encoding` 同时出现时可能产生解析歧义 |
| `Cookie` | 会话凭证 | 认证、越权、JWT 都在这里 |
| `Authorization` | 认证凭据 | `Basic`、`Bearer` |
| `Referer` | 来源页 | 有些逻辑据此做来源校验，但并不可靠 |
| `Origin` | 跨域来源 | CORS 校验依据 |
| `X-Forwarded-For` 等 | 代理链信息 | 默认不可信，除非显式配置可信代理 |
| `User-Agent` | 客户端标识 | 常被日志记录，也常被业务逻辑判断 |

除了 `Host` 在 HTTP/1.1 中必需，其余请求头都由客户端自由填写。只靠请求头做的安全判断，都要打问号。

### 10.6 重要响应头

| 头 | 作用 |
|---|---|
| `Server`、`X-Powered-By` | 版本信息，常被建议关闭 |
| `Set-Cookie` | 下发会话；关注 `HttpOnly`、`Secure`、`SameSite` |
| `Location` | 重定向目标 |
| `Content-Type` | 浏览器如何渲染；`text/html` 与 `text/plain` 差异巨大 |
| `Content-Disposition` | 下载行为与文件名 |
| `Content-Security-Policy` | 前端脚本来源限制 |
| `Access-Control-Allow-Origin` | CORS 允许的来源 |

### 10.7 连接与长度

- HTTP/1.1 默认长连接，一个 TCP 连接可承载多个请求；
- 有响应体时，长度由 `Content-Length` 或 `Transfer-Encoding: chunked` 描述；
- 两者同时出现，或代理与后端理解不一致，就可能出现请求走私；
- HTTP/2 是二进制分帧，Apache 通过 `mod_http2` 支持，抓包不如 HTTP/1.1 直观。

### 10.8 URL 的结构

```
  https://user:pass@ctf.local:8443/a/b.php?x=1&y=2#frag
  └─┬─┘   └──┬──┘ └──┬───┘ └┬┘ └──┬──┘ └──┬──┘ └─┬─┘
  scheme   userinfo  host   port  path    query  fragment
```

- `#fragment` 不会发给服务器，只在前端使用；
- 路径与查询串使用百分号编码；查询串里的 `+` 常被解释为空格，路径里的 `+` 就是加号；
- `.` 与 `..` 的规范化发生在客户端、代理、服务器多处，任何一处处理不一致都可能成为绕过点。

### 10.9 用 `curl` 观察差异

```bash
curl -i http://ctf.local/                     # 含响应头
curl -sI http://ctf.local/                    # 只发 HEAD
curl -i -X OPTIONS http://ctf.local/          # 看 Allow
curl -i -X TRACE   http://ctf.local/          # 看是否被禁用
curl -i -H 'Host: other.local' http://127.0.0.1/   # 手动指定虚拟主机
curl -i --path-as-is 'http://ctf.local/a/../b'     # 不让 curl 归一化路径
curl -i 'http://ctf.local/%2e%2e/%2e%2e/etc/passwd' # 观察服务端如何解码
```

两个常见坑：

1. `curl` 默认会归一化 `..`，看到的路径可能已经被改写；用 `--path-as-is` 观察原始行为；
2. 用 IP 访问时 `Host` 是 IP，可能落到默认站点；用 `-H 'Host: ...'` 或 `/etc/hosts` 指定域名。

### 10.10 Cookie 与会话

```
HTTP/1.1 200 OK
Set-Cookie: PHPSESSID=abc123; Path=/; HttpOnly; Secure; SameSite=Lax
```

- 服务端在会话里保存状态，客户端只持有标识；
- `HttpOnly` 阻止 JS 读取，降低 XSS 窃取会话的危害；
- `Secure` 仅通过 HTTPS 发送；
- `SameSite` 限制跨站携带，缓解 CSRF；
- 如果服务端把状态直接放进 Cookie（如 JWT），必须校验签名，否则等于把数据交给用户修改。

---

## 十一、URL 到文件：Apache2 的映射与配置

核心问题是：请求 `GET /a/b.php?x=1` 之后，服务器最终打开哪个文件，以什么身份打开，中间经过哪些判断。

### 11.1 映射链

```
URL
 │ 1. 选定虚拟主机（按 IP:端口 + Host）
 ▼
DocumentRoot 拼接        /a/b.php → /var/www/ctf/a/b.php
 │ 2. Alias / ScriptAlias 可能覆盖前缀
 ▼
mod_rewrite 改写          URL 可能被重写成别的路径
 │ 3. DirectoryIndex 补全目录请求
 ▼
扩展名 → handler         .php 交给 mod_php，.cgi 交给 CGI
 │ 4. <Directory>/<Files>/<Location> + .htaccess 鉴权
 ▼
最终文件 + 是否允许访问 → 200 / 403 / 404 / 500
```

这条链上每一步都可能出问题。排查的第一步通常是：

```bash
apache2ctl -S
tail -n 20 /var/log/apache2/ctf_access.log
```

### 11.2 DocumentRoot

```apache
DocumentRoot /var/www/ctf
```

它只是前缀替换，不是沙箱。`..` 是否被允许，取决于路径规范化与 `Options` 配置。修改后必须 `apache2ctl configtest && systemctl reload apache2`。

### 11.3 DirectoryIndex

```apache
DirectoryIndex index.php index.html
```

请求 `/` 时按顺序查找。若都不存在且开启了 `Indexes`，返回目录列表；关闭则 `403`。

### 11.4 Alias

```apache
Alias /shared /var/www/shared
<Directory /var/www/shared>
    Require all granted
</Directory>
```

`/shared/x.txt` 映射到 `/var/www/shared/x.txt`。目录级权限要单独写，Alias 不会自动继承 `DocumentRoot` 的 `<Directory>` 配置。

### 11.5 mod_rewrite

```apache
RewriteEngine On
RewriteRule ^/old/(.*)$ /new/$1 [L]
```

规则按顺序匹配，`[L]` 表示停止。重写可能造成鉴权绕过、循环重写、把不可达路径映射到可达路径。调试可用 `LogLevel alert rewrite:trace3`。

### 11.6 handler：`.php` 如何被执行

静态文件由 Apache 直接读盘返回；动态文件需要交给处理器：

```apache
# 简化示意
<FilesMatch "\.php$">
    SetHandler application/x-httpd-php
</FilesMatch>
```

只要文件落在会被该 handler 匹配的路径下，就会被当作 PHP 执行。由此可以推出：

- 上传目录位于 `DocumentRoot` 内且未禁用 PHP 时，上传的 `.php` 能执行；
- 把上传目录移出站点根目录，或在目录内禁用 handler，风险立刻下降；
- 多后缀、大小写、`.phtml` 等差异，取决于 handler 的匹配规则。

### 11.7 访问控制

```apache
# 只允许本机
<Directory /var/www/ctf/private>
    Require ip 127.0.0.1 ::1
</Directory>
```

`Require ip` 判断 TCP 连接的对端地址，与 `X-Forwarded-For` 无关。只有前面存在反向代理、且显式启用 `mod_remoteip` 并配置可信代理时，才会使用转发头。

`.htaccess` 是目录级配置：

```apache
# /var/www/ctf/private/.htaccess
Require ip 127.0.0.1 ::1
```

生效前提是主配置里 `AllowOverride All`（或至少 `AuthConfig`）。设为 `None` 时，`.htaccess` 会被完全忽略。看到 `.htaccess` 不代表限制生效。

### 11.8 目录列表

```apache
Options Indexes      # 允许列目录
Options -Indexes     # 禁止
```

目录列表会暴露文件名，而文件名常常泄露技术栈、备份习惯和隐藏路径。生产环境建议关闭。

### 11.9 日志

```apache
CustomLog ${APACHE_LOG_DIR}/ctf_access.log combined
```

`combined` 格式：

```
%h %l %u %t "%r" %>s %O "%{Referer}i" "%{User-Agent}i"
```

| 字段 | 含义 |
|---|---|
| `%h` | 客户端地址 |
| `%t` | 时间 |
| `%r` | 请求行（方法 + 路径 + 版本） |
| `%>s` | 最终状态码 |
| `%O` | 响应字节数 |
| Referer / User-Agent | 客户端可控内容 |

日志是排查的第一手证据，也是理解「请求 → 文件」链路的实锤。

---

## 十二、进程、权限、日志

### 12.1 进程模型

Apache 常见两种 MPM：

| MPM | 模型 | 说明 |
|---|---|---|
| `prefork` | 多进程 | `mod_php` 只能用它 |
| `event` | 多进程 + 异步连接 | 现代默认，性能更好，但不能配 `mod_php` |

典型结构：

```
root  ── apache2 (master，绑定 80 端口)
          ├── www-data  worker
          ├── www-data  worker
          └── www-data  worker
```

master 以 root 启动，才能绑定 1024 以下端口；worker 降权为 `www-data`，所有业务代码都以这个身份运行。能不能读文件、能不能写目录，完全由 `www-data` 的权限决定。

```bash
ps -eo pid,user,cmd | grep '[a]pache2'
grep -E '^(Uid|Gid)' /proc/$(pgrep -o apache2)/status
sudo ss -lntp | grep ':80'
sudo lsof -p "$(pgrep -o apache2)" | head -20
```

### 12.2 文件权限

```bash
ls -ld /var/www/ctf
# drwxr-xr-x  root root  ... /var/www/ctf
```

`rwx` 对文件和目录的含义不同：

| 位 | 对文件 | 对目录 |
|---|---|---|
| `r` | 读内容 | 列出条目名 |
| `w` | 改内容 | 创建/删除条目 |
| `x` | 执行 | 进入/穿越（能否访问其中的文件） |

目录没有 `x`，里面的文件即使可读也访问不到。

几个常见误区：

- 「`chmod 777` 才能上传」不成立。Web 进程只要能写该目录即可；目录属主设为 `www-data`、权限 `755`，比 `777` 更安全也足够用；
- 「文件是 `644` 所以安全」不成立。父目录可写时，攻击者可以删除并替换它；
- 「属主是 root 就安全」不成立。要看运行进程的身份与目录的 `w` / `x`。

### 12.3 日志提供的证据

```bash
sudo tail -f /var/log/apache2/ctf_access.log
sudo tail -f /var/log/apache2/ctf_error.log
```

日志可以确认：

- 请求是否到达服务器；
- 状态码的来源：应用返回的 404，还是 Apache 返回的 404；
- URL 在到达文件前是否被解码或重写；
- 客户端声明的身份信息（UA、Referer）。

结合 `error.log` 还能看到 PHP 致命错误、权限拒绝、重写循环等。

---

## 十三、安全：边界失效的地方

前面的架构每一层都画了一条边界。安全问题通常不是「某个函数危险」，而是**数据跨过边界时，校验没有跟上**。

统一分析模板：

> 输入从哪来 → 经过什么处理 → 最终到达哪个敏感操作 → 缺了哪一层校验 → 最小修复是什么

### 13.1 输入边界：客户端数据

HTTP 请求里的路径、查询串、请求头、Cookie、请求体，全部由客户端控制。`$_SERVER` 中以 `HTTP_` 开头的字段，本质上都是用户输入。

```php
<?php
// 观察页：所有字段都可能被伪造
printf("host : %s\n", $_SERVER['HTTP_HOST'] ?? '');
printf("ua   : %s\n", $_SERVER['HTTP_USER_AGENT'] ?? '');
printf("xff  : %s\n", $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '');
printf("remote: %s\n", $_SERVER['REMOTE_ADDR']);
```

`REMOTE_ADDR` 来自连接本身，其余请求头来自客户端。这个区别决定了哪些值可以用来做访问控制。

### 13.2 路径边界：路径穿越

**危险写法**

```php
<?php
$base = __DIR__ . '/files/';
readfile($base . $_GET['file']);   // file=../../etc/passwd
```

拼接后没有规范化，`..` 可以跳出 `$base`。

**安全写法**

```php
<?php
$base = realpath(__DIR__ . '/files');
$name = basename($_GET['file'] ?? '');
$path = realpath($base . '/' . $name);

if ($path === false || !str_starts_with($path, $base . DIRECTORY_SEPARATOR)) {
    http_response_code(400);
    exit('invalid file');
}
readfile($path);
```

三层校验：`basename` 去掉目录部分，`realpath` 规范化，前缀比对确认仍在基目录内。更严格的做法是白名单映射（ID → 固定文件名）。

配置层面同样有边界问题：即使代码没问题，`DocumentRoot` 里也不该放备份文件、`.git`、数据库导出。

### 13.3 执行边界：文件包含

```php
<?php
include($_GET['page']);   // 用户控制包含哪个文件
```

危险在于可以包含非预期文件（系统文件、日志、上传的临时文件），把「读」升级为「执行」。

**安全写法：白名单**

```php
<?php
$pages = [
    'about' => __DIR__ . '/files/about.php',
    'help'  => __DIR__ . '/files/help.php',
];
$key = $_GET['page'] ?? 'about';

if (!isset($pages[$key])) {
    http_response_code(404);
    exit('not found');
}
include $pages[$key];
```

用户输入只用于查表，不参与路径拼接。再配合 `open_basedir`、关闭 `allow_url_include` 做纵深防御。

### 13.4 存储边界：文件上传

上传安全的完整链条：

```
① 扩展名 / MIME / 文件头校验
② 重命名为随机名（不信任原文件名）
③ 存储目录移出 DocumentRoot，或明确禁用该目录的脚本解析
④ 限制大小与类型，隔离存储
```

**安全写法（要点）**

```php
<?php
$allow = ['image/jpeg' => 'jpg', 'image/png' => 'png'];
$mime  = mime_content_type($_FILES['f']['tmp_name']);

if (!isset($allow[$mime])) { http_response_code(400); exit('bad type'); }
if ($_FILES['f']['size'] > 2 * 1024 * 1024) { http_response_code(413); exit('too large'); }

$name = bin2hex(random_bytes(16)) . '.' . $allow[$mime];
move_uploaded_file($_FILES['f']['tmp_name'], '/var/www/uploads/' . $name);
```

`mime_content_type` 依据文件内容，但仍可被精心构造的文件欺骗。最终防线是「存储目录不可执行」。配套仓库在 `html/uploads/.htaccess` 中给出了禁用 PHP 解析的写法。

### 13.5 数据到命令：命令注入

```php
<?php
system('ping -c 1 ' . $_GET['ip']);   // ip=127.0.0.1;id
```

shell 会解释 `;`、`|`、`&&`、`$()`、反引号。修复优先级：

1. 能不用 shell 就不用，改用语言内置函数或库；
2. 必须调用外部程序时，使用参数数组而不是拼接字符串；
3. 使用 `escapeshellarg()` / `escapeshellcmd()`；
4. 限制可执行命令白名单、降低进程权限、容器隔离。

### 13.6 服务端信任边界：SSRF

服务端替用户发请求时，如果目标地址不受限，就可能访问内网、回环地址、云元数据服务。

校验要点：

- 协议白名单：只允许 `http` / `https`；
- 解析域名后校验 IP：拒绝私有网段、回环、链路本地、`0.0.0.0`；
- 关闭或严格限制重定向，避免 302 跳到内网；
- 出网走统一代理并记录日志。

```php
<?php
$url = $_GET['url'] ?? '';
$p = parse_url($url);

if (!in_array($p['scheme'] ?? '', ['http', 'https'], true)) {
    exit('scheme not allowed');
}
$ip = gethostbyname($p['host'] ?? '');
if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
    exit('address not allowed');
}
```

这段代码只覆盖了最简单的情况，DNS 重绑定、解析结果变化、IPv6、十进制 IP 仍需额外处理。安全校验要「解析后校验、连接时再校验」。

### 13.7 输出边界：XSS 与 SQL

数据从服务端回到浏览器或数据库时，同样要区分「数据」和「代码」：

- 拼接 HTML 时转义，使用模板引擎的自动转义，配合 CSP；
- 拼接 SQL 时使用预编译参数，不把用户输入当语法；
- 返回 JSON 时设置正确的 `Content-Type`，避免浏览器按 HTML 解析。

### 13.8 默认配置与信息泄露

| 来源 | 配置 / 习惯 | 处理 |
|---|---|---|
| 目录列表 | `Options Indexes` | 关闭 |
| 版本信息 | `ServerSignature On`、`X-Powered-By` | 关闭或最小化 |
| 状态页 | `mod_status` 对公网开放 | 仅本机或删除 |
| 备份文件 | `index.php.bak`、`www.zip` | 禁止放在站点根目录 |
| 版本库 | `.git/`、`.svn/` | 部署时排除 |
| 报错详情 | `display_errors = On` | 生产环境关闭，错误写日志 |

### 13.9 一张表收束全章

| 风险 | 失效的边界 | 最小修复 |
|---|---|---|
| 路径穿越 | 路径 | 规范化 + 前缀校验 / 白名单 |
| 文件包含 | 执行 | 映射表，输入不参与路径 |
| 上传 getshell | 存储 + 执行 | 类型校验 + 随机名 + 目录禁解析 |
| 命令注入 | 数据 → 命令 | 不用 shell / 参数数组 / 转义 |
| SSRF | 服务端信任 | 协议白名单 + IP 校验 + 禁跳转 |
| XSS | 输出 | 转义 + CSP |
| SQL 注入 | 输出 → SQL | 预编译 |
| 目录列表 / 备份泄露 | 配置默认值 | `-Indexes`、部署排除 |

---

## 十四、工具与排错

### 14.1 curl 速查

| 目的 | 命令 |
|---|---|
| 看完整报文 | `curl -v -i URL` |
| 只看响应头 | `curl -sI URL` |
| 指定方法 | `curl -X PUT URL` |
| 加请求头 | `curl -H 'X-Test: 1' URL` |
| 发 Cookie | `curl -b 'a=1; b=2' URL` |
| 表单 POST | `curl -d 'a=1&b=2' URL` |
| JSON POST | `curl -H 'Content-Type: application/json' -d '{"a":1}' URL` |
| 上传文件 | `curl -F 'f=@file.txt' URL` |
| 只看状态码 | `curl -s -o /dev/null -w '%{http_code}' URL` |
| 跟随重定向 | `curl -L URL` |
| 不归一化路径 | `curl --path-as-is URL` |
| 指定 Host | `curl -H 'Host: ctf.local' http://127.0.0.1/` |

### 14.2 nc：手写报文

```bash
printf 'GET /info.php HTTP/1.1\r\nHost: ctf.local\r\nConnection: close\r\n\r\n' | nc 127.0.0.1 80
```

没有浏览器、没有 curl 的自动补全与归一化，只有写出来的字节。理解协议时，这是最快的方式。

### 14.3 抓包

```bash
sudo tcpdump -i lo -A 'tcp port 80'
```

用于确认请求是否真的发出、代理改了什么。HTTPS 需要密钥才能解密，入门阶段先用 HTTP。

### 14.4 系统侧

```bash
sudo ss -lntp                  # 端口与进程
sudo lsof -p <pid>             # 进程打开的文件与连接
sudo strace -f -p <pid>        # 系统调用
apache2ctl -S / -M             # 站点 / 模块
```

### 14.5 排错顺序

```
1. 确认请求已发出：        curl -v / tcpdump
2. 确认请求已到达：        日志中是否有对应行
3. 确认落到的站点与文件：  apache2ctl -S / SCRIPT_FILENAME
4. 确认被拒的原因：        403 / 404 / error.log
5. 确认程序错误：          error.log / display_errors
6. 确认运行身份与权限：    id / ls -l / sudo -u www-data
```

---

## 十五、小结与延伸

Web 的每一层都在回答一个具体问题：

- 静态文件服务器解决「怎么共享文档」；
- CGI 解决「怎么按请求计算」；
- 模块化与 FastCGI 解决「计算太慢」；
- 前后端分离解决「界面与业务耦合」；
- 反向代理解决「多后端、TLS、统一入口」；
- 负载均衡解决「单机容量与可用性」；
- CDN 解决「距离与攻击流量」；
- 容器与 Serverless 解决「交付一致性与运维成本」。

理解这些「为什么」，比记住某个组件的配置更有用。安全同理：路径穿越、文件包含、上传、命令注入、SSRF，本质上都是某条边界上的校验缺失。能指出数据从哪来、要到哪里去，就能判断该在哪一层加约束。

### 延伸练习

1. 把站点端口从 80 改为 8080，说明需要改哪些文件；
2. 新增一个虚拟主机，让它与默认站点指向不同目录；
3. 用 `nc` 构造一个带 Cookie 的 `POST` 请求，并在日志中找到它；
4. 写一个页面输出 `$_SERVER` 的关键字段，解释每一行的来源；
5. 把 `uploads/` 移出 `DocumentRoot`，说明这样能降低上传风险的原因；
6. 用 Nginx 做一次反向代理，把 `X-Forwarded-For` 传给后端，并验证 `REMOTE_ADDR` 的变化。

### 推荐资源

- **协议**：RFC 9110（HTTP 语义）、RFC 9112（HTTP/1.1）
- **服务**：Apache HTTP Server 文档、Nginx 文档（`proxy_pass`、`real_ip`）
- **架构**：AWS / Cloudflare 的架构白皮书，MDN 的 Web 入门
- **安全**：OWASP Top 10、OWASP Cheat Sheet Series
- **靶场**：PortSwigger Web Security Academy、picoCTF、HTB Starting Point、本地 DVWA
- **习惯**：每做一个功能，先画出请求经过了哪些层

---

## 附：速查表

### 常用命令

```bash
# 服务
sudo systemctl start|stop|restart|reload apache2
sudo apache2ctl configtest
apache2ctl -S
apache2ctl -M

# 站点 / 模块
sudo a2ensite NAME && sudo a2dissite NAME
sudo a2enmod MODULE && sudo a2dismod MODULE

# 观察
curl -v -i URL
printf 'GET / HTTP/1.1\r\nHost: x\r\n\r\n' | nc 127.0.0.1 80
sudo ss -lntp
sudo lsof -p PID
sudo tcpdump -i lo -A 'tcp port 80'

# 日志
sudo tail -f /var/log/apache2/access.log
sudo tail -f /var/log/apache2/error.log
```

### 术语

| 术语 | 含义 |
|---|---|
| MPM | 多处理模块，决定 Apache 的进程/线程模型 |
| CGI / FastCGI | 服务器与外部程序之间的调用协议 |
| DocumentRoot | URL 映射的根目录 |
| Alias | 把某个 URL 前缀映射到另一个目录 |
| handler | 处理某类文件的模块（如 PHP） |
| 反向代理 | 位于服务端、代表服务器接收请求的代理 |
| 正向代理 | 位于客户端、代表客户端出网的代理 |
| CDN | 内容分发网络，把内容缓存到边缘节点 |
| SSRF | 服务端请求伪造 |
| CORS | 跨域资源共享策略 |

---

> 架构会继续变化，但请求仍然由「客户端 → 若干中间层 → 应用 → 数据」组成。看清每一层替下一层挡掉了什么问题，就能在遇到新组件时快速定位它所在的位置。

配套仓库：[XuantianCTF/ctf-web-lab](https://github.com/XuantianCTF/ctf-web-lab)
