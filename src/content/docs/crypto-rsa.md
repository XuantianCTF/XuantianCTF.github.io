---
title: RSA 入门
description: RSA 加密算法原理与常见攻击。
date: 2026-06-21T05:00:00.000Z
---


## RSA 加密

RSA 是一种非对称加密算法，基于大数分解的困难性。在 CTF 密码学方向中非常常见。

### 什么是 RSA？

RSA 是 Rivest-Shamir-Adleman 算法的缩写，是当今最广泛使用的公钥加密算法之一。它之所以安全，是因为将两个大素数相乘很容易，但将乘积分解回素数却极其困难。

RSA 的安全性依赖于"大数分解"这个数学难题——目前没有已知的多项式时间算法可以分解足够大的整数。

### RSA 的应用

- **HTTPS**：保护网站通信安全
- **数字签名**：验证软件来源
- **SSH**：远程服务器登录
- **PGP/GPG**：加密邮件和文件

---

### 一、基本原理

#### 密钥生成

1. 选择两个大素数 p 和 q
2. 计算 n = p × q
3. 计算 φ(n) = (p-1)(q-1)
4. 选择 e，满足 1 < e < φ(n) 且 gcd(e, φ(n)) = 1
5. 计算 d，满足 e × d ≡ 1 (mod φ(n))

- **公钥**：(n, e)
- **私钥**：(n, d)

#### 加密与解密

```
加密：c = m^e mod n
解密：m = c^d mod n
```

---

### 二、常见攻击

#### 1. 直接分解 n

当 n 较小时，直接分解得到 p 和 q。

```python
from Crypto.Util.number import *
from factordb.factordb import FactorDB

n = 123456789012345678901234567890
f = FactorDB(n)
f.connect()
factors = f.get_factor_list()
p, q = factors[0], factors[1]
```

#### 2. 小指数攻击

当 e 很小时（e=3），可以尝试直接开 e 次方根。

```python
import gmpy2

e = 3
c = 12345678901234567890
m, exact = gmpy2.iroot(c, e)
if exact:
    print(f"明文: {m}")
```

#### 3. 共模攻击

同一明文用同一公钥的不同 e 加密。

```
c1 = m^e1 mod n
c2 = m^e2 mod n
```

#### 4. Wiener 攻击

当 d 较小时，可以使用连分数攻击。

```python
from Crypto.PublicKey import RSA
from wiener import wiener_attack

key = RSA.import_key(open('pub.pem').read())
d = wiener_attack(key.e, key.n)
```

#### 5. Coppersmith 攻击

已知明文的部分信息时使用。

#### 6. Boneh-Durfee 攻击

d 较小时的改进攻击。

---

### 三、解题工具

#### RsaCtfTool

```bash
# 公钥解密
python3 RsaCtfTool.py --publickey pub.pem --private

# 已知 p, q
python3 RsaCtfTool.py --publickey pub.pem --p 123 --q 456

# 已知私钥
python3 RsaCtfTool.py --publickey pub.pem --privkey priv.pem --uncipher 123456
```

#### yafu（大数分解）

```bash
yafu "factor(12345678901234567890)"
```

#### factordb

```python
from factordb.factordb import FactorDB
f = FactorDB(n)
f.connect()
print(f.get_factor_list())
```

---

### 四、Python 脚本模板

```python
from Crypto.Util.number import long_to_bytes, inverse

def rsa_decrypt(c, e, n):
    # 简单的 RSA 解密（需要知道 d）
    d = inverse(e, n - 1)  # 假设 n 是素数
    m = pow(c, d, n)
    return long_to_bytes(m)

# 读取公钥
from Crypto.PublicKey import RSA
key = RSA.import_key(open('pub.pem').read())
print(f"n = {key.n}")
print(f"e = {key.e}")
```

---

### 五、CTF 常见变形

| 类型 | 条件 | 方法 |
|------|------|------|
| 直接分解 | n 较小 | factordb / yafu |
| 小指数 | e=3 | 开立方根 |
| 共模攻击 | 同 n 不同 e | 扩展欧几里得 |
| Wiener | d 较小 | 连分数 |
| p 接近 q | p, q 接近 | Fermat 分解 |
| dp 泄露 | 已知 dp | 计算 d |

---

### 六、练习平台

- [CryptoHack](https://cryptohack.org/)
- [BUUCTF Crypto 方向](https://buuoj.cn/)
