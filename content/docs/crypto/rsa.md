+++
title = "RSA 入门"
description = "RSA 加密算法基础。"
date = 2026-06-21T00:00:00.000Z
+++

## RSA 加密

RSA 是一种非对称加密算法，广泛应用于 CTF 密码学方向。

### 基本原理

- 公钥 (n, e)
- 私钥 (n, d)
- 加密：c = m^e mod n
- 解密：m = c^d mod n

### 常见攻击

- 共模攻击
- 小指数攻击
- 因数分解（n 较小时）
- Wiener 攻击（d 较小时）
- 共享素数攻击

### 工具

- RsaCtfTool
- yafu（大数分解）
