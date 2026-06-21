+++
title = "SQL 注入"
description = "SQL 注入基础与进阶技巧。"
date = 2026-06-21T00:00:00.000Z
+++

## SQL 注入

SQL 注入（SQL Injection）是一种常见的 Web 安全漏洞，攻击者通过在输入中插入恶意 SQL 语句，实现对数据库的非法操作。

### 注入类型

- **联合查询注入**：使用 `UNION SELECT` 获取数据
- **布尔盲注**：通过页面返回的 True/False 判断数据
- **时间盲注**：通过响应时间差异判断数据
- **报错注入**：利用数据库报错信息获取数据
- **堆叠注入**：执行多条 SQL 语句

### 常用工具

- sqlmap：自动化注入工具
- Burp Suite：抓包与重放请求
- HackBar：浏览器插件

### 练习题目

建议从以下平台开始练习：

- [SQLi-labs](https://github.com/Audi-1/sqli-labs)
- [BUUCTF Web 方向](https://buuoj.cn/)
