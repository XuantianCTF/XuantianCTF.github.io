+++
title = "古典密码"
description = "常见古典密码算法与破解方法。"
date = 2026-06-21T04:00:00.000Z
+++

## 古典密码

古典密码是基于替换和置换的加密方法，在 CTF 密码学入门题中常见。

---

### 一、凯撒密码（Caesar Cipher）

将每个字母按照固定位数进行偏移。

```
明文：HELLO
密钥：3
密文：KHOOR
```

**破解方法：**

```python
# 暴力破解
for shift in range(26):
    result = ""
    for c in ciphertext:
        if c.isalpha():
            base = ord('A') if c.isupper() else ord('a')
            result += chr((ord(c) - base - shift) % 26 + base)
        else:
            result += c
    print(f"Shift {shift}: {result}")
```

---

### 二、维吉尼亚密码（Vigenere Cipher）

多表替换密码，使用密钥控制每个字符的偏移。

```
明文：HELLO
密钥：KEY
密文：RIJVS
```

**破解方法：**

```python
# 已知密钥解密
def vigenere_decrypt(ciphertext, key):
    result = ""
    key_idx = 0
    for c in ciphertext:
        if c.isalpha():
            base = ord('A') if c.isupper() else ord('a')
            shift = ord(key[key_idx % len(key)].upper()) - ord('A')
            result += chr((ord(c) - base - shift) % 26 + base)
            key_idx += 1
        else:
            result += c
    return result
```

---

### 三、栅栏密码（Rail Fence Cipher）

将明文按行排列，按列读取。

```
明文：HELLO WORLD
栏数：3

H . . . O . . . L
. E . L . W . R . D
. . L . . . O . .

密文：HOLELWRDLOO
```

**破解方法：**

```python
def rail_fence_decrypt(cipher, rails):
    fence = [['\n' for _ in range(len(cipher))] for _ in range(rails)]
    idx, direction = 0, 1
    for i in range(len(cipher)):
        fence[idx][i] = '*'
        if idx == 0:
            direction = 1
        elif idx == rails - 1:
            direction = -1
        idx += direction
    
    pos = 0
    for i in range(rails):
        for j in range(len(cipher)):
            if fence[i][j] == '*':
                fence[i][j] = cipher[pos]
                pos += 1
    
    result = ""
    idx, direction = 0, 1
    for i in range(len(cipher)):
        result += fence[idx][i]
        if idx == 0:
            direction = 1
        elif idx == rails - 1:
            direction = -1
        idx += direction
    return result
```

---

### 四、培根密码（Bacon Cipher）

用 A 和 B 两种字符编码，每 5 个字符代表一个字母。

```
AABBA = A
AABBB = B
ABAAB = C
...
```

---

### 五、摩尔斯电码（Morse Code）

用点（.）和划（-）表示字符。

```
A: .-      B: -...    C: -.-.    D: -..
E: .       F: ..-.    G: --.     H: ....
I: ..      J: .---    K: -.-     L: .-..
M: --      N: -.      O: ---     P: .--.
Q: --.-    R: .-.     S: ...     T: -
U: ..-     V: ...-    W: .--     X: -..-
Y: -.--    Z: --..
```

---

### 六、栅栏与轮换组合

```python
# 网上搜题 CTF 经典组合
# Rot13
import codecs
result = codecs.encode(text, 'rot_13')
```

---

### 七、在线工具

| 工具 | 用途 |
|------|------|
| [CyberChef](https://gchq.github.io/CyberChef/) | 万能编解码工具 |
| [dCode.fr](https://www.dcode.fr/) | 古典密码破解大全 |
| [quipqiup](https://quipqiup.com/) | 替换密码破解 |

---

### 八、练习平台

- [CryptoHack](https://cryptohack.org/)
- [BUUCTF Crypto 方向](https://buuoj.cn/)
