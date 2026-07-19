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
from Crypto.Util.number import long_to_bytes

e = 3
c = 12345678901234567890
m, exact = gmpy2.iroot(c, e)
if not exact:
    raise ValueError("c 不是完整的 e 次幂")
print(f"明文: {long_to_bytes(m)}")
```

#### 3. 共模攻击

同一明文 m 用相同的 n、不同的 e 加密。

```python
from Crypto.Util.number import long_to_bytes

def common_modulus_attack(c1, e1, c2, e2, n):
    import gmpy2
    # 扩展欧几里得：e1*s1 + e2*s2 = gcd(e1, e2) = 1
    g, s1, s2 = gmpy2.gcdext(e1, e2)
    if g != 1:
        raise ValueError("e1 与 e2 必须互素")

    def signed_pow(base, exponent):
        if exponent < 0:
            base = int(gmpy2.invert(base, n))
            exponent = -exponent
        return pow(base, int(exponent), n)

    m = signed_pow(c1, s1) * signed_pow(c2, s2) % n
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
        ed_minus_1 = e * d - 1
        if ed_minus_1 % k != 0:
            continue
        phi = ed_minus_1 // k
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
from Crypto.Util.number import long_to_bytes

d = wiener_attack(e, n)
if d is None:
    raise ValueError("未找到满足 Wiener 条件的私钥指数")
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
if p is None:
    raise ValueError("未找到接近的素因数")
phi = (p - 1) * (q - 1)
d = inverse(e, phi)
m = pow(c, d, n)
print(long_to_bytes(m))
```

#### 6. Boneh-Durfee 攻击

当私钥指数满足约 `d < n^0.292` 时，可以尝试 Boneh-Durfee 攻击。该攻击依赖 Coppersmith 小根方法和 LLL 格规约，不能用几行普通 Python 完整实现。

实际解题时应使用 SageMath，并参考 [RSA-and-LLL-attacks](https://github.com/mimoo/RSA-and-LLL-attacks) 中经过验证的实现。

#### 7. dp / dq 泄露

当 dp（或 dq）已知时，可以恢复私钥。

```python
from Crypto.Util.number import inverse, long_to_bytes

def recover_factor_from_dp(e, n, dp):
    """已知 dp = d mod (p-1)，恢复 p 和 q。"""
    value = e * dp - 1
    for k in range(1, e):
        if value % k != 0:
            continue
        p = value // k + 1
        if p > 1 and n % p == 0:
            return p, n // p
    raise ValueError("无法从 dp 恢复素因数")

def dp_leak_attack(c, e, n, dp):
    p, q = recover_factor_from_dp(e, n, dp)
    phi = (p - 1) * (q - 1)
    d = inverse(e, phi)
    m = pow(c, d, n)
    return long_to_bytes(m)

# qinv = q^(-1) mod p
def crt_decrypt(c, p, q, dp, dq, qinv):
    """使用泄露的 CRT 参数直接解密。"""
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
    P.<x> = PolynomialRing(Zmod(n))
    f1 = x^e - c1
    f2 = (a*x + b)^e - c2
    while f2:
        f1, f2 = f2, f1 % f2
    g = f1.monic()
    if g.degree() != 1:
        raise ValueError("未得到一次公因式")
    return int(-g[0])
```

#### 9. 低加密指数广播攻击

同一明文 `m` 使用相同的小指数 `e`，在至少 `e` 个两两互素的不同模数下加密时，可以使用 Hastad 广播攻击。先通过中国剩余定理恢复整数 `m^e`，再开 `e` 次方根。

```python
from math import gcd, prod
import gmpy2
from Crypto.Util.number import inverse, long_to_bytes

def crt(residues, moduli):
    if len(residues) != len(moduli):
        raise ValueError("密文与模数数量不一致")
    for i, n1 in enumerate(moduli):
        for n2 in moduli[i + 1:]:
            if gcd(n1, n2) != 1:
                raise ValueError("模数必须两两互素；存在公因数时应改用共享素数攻击")

    modulus_product = prod(moduli)
    result = 0
    for residue, modulus in zip(residues, moduli):
        partial = modulus_product // modulus
        result += residue * partial * inverse(partial, modulus)
    return result % modulus_product

def hastad_attack(ciphertexts, moduli, e):
    if len(ciphertexts) < e:
        raise ValueError("通常至少需要 e 组密文")
    powered_message = crt(ciphertexts, moduli)
    message, exact = gmpy2.iroot(powered_message, e)
    if not exact:
        raise ValueError("未得到完整的 e 次方根")
    return long_to_bytes(int(message))
```

#### 10. 素数幂模数

当题目给出：

$$
n=p^r,\qquad p\text{ 为素数},\quad r\ge 2
$$

此时 `n` 是素数幂，不存在两个不同的素因数。特别地，当 RSA 中 `p = q` 时，有 `n = p^2`。

欧拉函数为：

$$
\varphi(p^r)=p^r-p^{r-1}=p^{r-1}(p-1)
$$

因为小于等于 `p^r` 的整数中共有 `p^{r-1}` 个 `p` 的倍数，去掉它们后，剩余整数均与 `p^r` 互素。

```python
def prime_power_phi(p, r):
    if r < 1:
        raise ValueError("r 必须为正整数")
    return p**r - p**(r - 1)
```

#### 11. 多素数 RSA

如果 `n = p * q * r`，并且 `p`、`q`、`r` 是互不相同的素数，则：

$$
\varphi(n)=(p-1)(q-1)(r-1)
$$

更一般地，对于互不相同的素数列表，可以计算：

```python
from math import prod

def multi_prime_phi(primes):
    if len(primes) != len(set(primes)):
        raise ValueError("该公式要求素因数互不相同")
    return prod(p - 1 for p in primes)
```

#### 12. 共享素数攻击

两个 RSA 模数只要复用了同一个素因数，就可以通过最大公约数分解。该攻击不要求它们使用相同的明文或加密指数。

```python
from math import gcd

shared = gcd(n1, n2)
if shared in (1, n1, n2):
    raise ValueError("没有发现可利用的共享素因数")

p1, q1 = shared, n1 // shared
p2, q2 = shared, n2 // shared
```

#### 13. p 高位泄露（Coppersmith）

已知素数 `p` 的部分高位时，可以将未知低位建模为小根并恢复完整的 `p`。下面的 `p_high` 是未移位的高位整数，`unknown_bits` 是未知低位的位数。

```python
def recover_p_from_high_bits(n, p_high, unknown_bits):
    P.<x> = PolynomialRing(Zmod(n), implementation="NTL")
    known_part = p_high << unknown_bits
    f = x + known_part
    roots = f.monic().small_roots(X=2^unknown_bits, beta=0.5)
    for root in roots:
        p = int(known_part + root)
        if p > 1 and n % p == 0:
            return p, n // p
    raise ValueError("未找到满足条件的素因数")
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
#### SageMath

SageMath 集成了大整数、多项式环、格规约和小根算法。Coppersmith、Boneh-Durfee、Franklin-Reiter 等攻击通常需要在 SageMath 环境中运行，而不是直接使用普通 Python。

```bash
sage solve.sage
```


---

### 四、Python 脚本模板

```python
from Crypto.Util.number import long_to_bytes, inverse

def rsa_decrypt(c, e, p, q):
    """已知 RSA 的两个素因数时解密。"""
    n = p * q
    phi = (p - 1) * (q - 1)
    d = inverse(e, phi)
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
| 广播攻击 | 同 m、同 e、不同且两两互素的 n | CRT 后开 e 次方根 |
| 素数幂模数 | n = p^r | 使用 φ(p^r) |
| 多素数 RSA | n 由三个或更多素数组成 | 分解后计算各 (p_i - 1) 的乘积 |
| 共享素数 | gcd(n1, n2) > 1 | 最大公约数分解 |
| p 部分位泄露 | 已知 p 的部分高位或低位 | Coppersmith 小根攻击 |

---

### 六、练习平台

- [CryptoHack](https://cryptohack.org/)
- [BUUCTF Crypto 方向](https://buuoj.cn/)
