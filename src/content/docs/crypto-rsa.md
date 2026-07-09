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

# 解密
phi = (p - 1) * (q - 1)
d = inverse(e, phi)
m = pow(c, d, n)
print(long_to_bytes(m))
```

#### 2. 小指数攻击（e=3）

当 e 很小且明文较短时，`m^e < n`，可以直接开 e 次方根。

```python
import gmpy2

e = 3
c = 12345678901234567890
m, exact = gmpy2.iroot(c, e)
if exact:
    print(f"明文: {long_to_bytes(m)}")

# e=3 广播攻击（Hastad）：同一明文用不同 n 加密 3 次，用 CRT 恢复
def hastad_attack(c1, n1, c2, n2, c3, n3, e=3):
    import gmpy2
    # CRT 合并
    N = n1 * n2 * n3
    N1 = N // n1
    N2 = N // n2
    N3 = N // n3
    t1 = gmpy2.invert(N1, n1)
    t2 = gmpy2.invert(N2, n2)
    t3 = gmpy2.invert(N3, n3)
    c = (c1 * N1 * t1 + c2 * N2 * t2 + c3 * N3 * t3) % N
    m, exact = gmpy2.iroot(c, e)
    if exact:
        return long_to_bytes(m)
    return None
```

#### 3. 共模攻击

同一明文 m 用相同的 n、不同的 e 加密。

```python
def common_modulus_attack(c1, e1, c2, e2, n):
    import gmpy2
    # 扩展欧几里得：e1*s1 + e2*s2 = gcd(e1, e2) = 1
    g, s1, s2 = gmpy2.gcdext(e1, e2)
    if s1 < 0:
        s1 = -s1
        c1 = gmpy2.invert(c1, n)
    if s2 < 0:
        s2 = -s2
        c2 = gmpy2.invert(c2, n)
    m = (pow(c1, s1, n) * pow(c2, s2, n)) % n
    return long_to_bytes(m)
```

#### 4. Wiener 攻击

当私钥指数 d 较小时（约 `d < n^0.25`），通过连分数逼近。

```python
def wiener_attack(e, n):
    """Wiener 攻击的完整实现"""
    def continued_fraction(num, den):
        cf = []
        while den:
            q = num // den
            cf.append(q)
            num, den = den, num - q * den
        return cf

    def convergents(cf):
        conv = []
        h_prev, k_prev = 0, 1
        h_curr, k_curr = 1, 0
        for a in cf:
            h_next = a * h_curr + h_prev
            k_next = a * k_curr + k_prev
            conv.append((h_next, k_next))
            h_prev, k_prev = h_curr, k_curr
            h_curr, k_curr = h_next, k_next
        return conv

    cf = continued_fraction(e, n)
    for k, d in convergents(cf):
        if k == 0:
            continue
        # φ(n) ≈ (e*d - 1) / k
        phi = (e * d - 1) // k
        # 解方程 x^2 - (n - phi + 1)x + n = 0
        a = 1
        b = -(n - phi + 1)
        c = n
        delta = b*b - 4*a*c
        if delta < 0:
            continue
        import gmpy2
        sqrt_delta, exact = gmpy2.iroot(delta, 2)
        if not exact:
            continue
        p = (-b + sqrt_delta) // 2
        q = (-b - sqrt_delta) // 2
        if p * q == n:
            return d
    return None

# 使用
d = wiener_attack(e, n)
m = pow(c, d, n)
print(long_to_bytes(m))
```

#### 5. Fermat 分解（p、q 接近）

当 p 和 q 非常接近时，可以用 Fermat 分解。

```python
def fermat_factor(n):
    import gmpy2
    a = gmpy2.isqrt(n)
    if a * a < n:
        a += 1
    b2 = a * a - n
    while b2 >= 0:
        b = gmpy2.isqrt(b2)
        if b * b == b2:
            p = a + b
            q = a - b
            if p * q == n:
                return p, q
        a += 1
        b2 = a * a - n
    return None

p, q = fermat_factor(n)
phi = (p - 1) * (q - 1)
d = inverse(e, phi)
m = pow(c, d, n)
print(long_to_bytes(m))
```

#### 6. Boneh-Durfee 攻击

当 d 小于 `n^0.292` 时使用，基于格归约（LLL）。

```python
# 需要安装 pycryptodome
# pip install pycryptodome

def boneh_durfee_attack(e, n):
    """
    Boneh-Durfee 攻击简化实现。
    实际 CTF 中推荐使用 RsaCtfTool 或直接调用
    https://github.com/mimoo/RSA-and-LLL-attacks
    """
    # 参数
    delta = 0.292  # 理论界限
    M = int(n**delta)  # d 的上界
    # ... 格构造和 LLL 规约（实现较复杂）
    # 实际使用推荐 RsaCtfTool
    pass
```

#### 7. dp / dq 泄露

当 dp（或 dq）已知时，可以恢复私钥。

```python
def dp_leak_attack(c, e, n, dp):
    """已知 dp = d mod (p-1)"""
    from Crypto.Util.number import long_to_bytes
    # 通过 dp 恢复 p
    for k in range(1, e + 1):
        p = (dp * e - 1) // k + 1
        if n % p == 0:
            q = n // p
            break
    phi = (p - 1) * (q - 1)
    d = inverse(e, phi)
    m = pow(c, d, n)
    return long_to_bytes(m)

# dp + dq + qinv 全部泄露
def full_key_leak(c, e, n, dp, dq, qinv):
    """利用中国剩余定理加速解密"""
    p = dp_leak_attack(0, e, n, dp)  # 先恢复 p
    # 实际不需重算，从 dp 泄露即可恢复
    q = n // p
    m1 = pow(c, dp, p)
    m2 = pow(c, dq, q)
    h = (qinv * (m1 - m2)) % p
    m = m2 + h * q
    return long_to_bytes(m)
```

#### 8. Franklin-Reiter 相关消息攻击

同一公钥加密两条线性相关的明文。

```python
def franklin_reiter_attack(c1, c2, e, n, a, b):
    # SageMath 实现，非 Python
    # P.<x> = PolynomialRing(Zmod(n))
    # g1 = x^e - c1
    # g2 = (a*x + b)^e - c2
    # g = gcd(g1, g2)
    # m1 = -g.monic().coefficients()[0]
    # return m1
    pass
```

#### 9. p 高位泄露（Coppersmith）

已知 p 的部分高位比特时恢复完整 p。

```python
def partial_p_attack(n, e, c, p_high, bits):
    """
    p_high: p 的高位部分
    bits: 已知的位数
    """
    # 使用 sage 实现
    # PR.<x> = PolynomialRing(Zmod(n))
    # f = x + p_high
    # roots = f.small_roots(X=2^(512-bits), beta=0.4)
    # if roots:
    #     p = int(p_high + roots[0])
    #     q = n // p
    #     phi = (p-1)*(q-1)
    #     d = inverse(e, phi)
    #     m = pow(c, d, n)
    #     return long_to_bytes(m)
    pass
```

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
