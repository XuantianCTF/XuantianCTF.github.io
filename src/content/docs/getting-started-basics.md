---
title: 计算机基础
description: 寄存器、栈、堆、内存布局等 CTF 必备基础。
date: 2026-07-09T00:00:00.000Z
---


## 计算机基础

本章涵盖 CTF 中必备的计算机基础知识，理解这些概念是学习逆向工程和 PWN 的前提。

### 为什么需要这些基础？

CTF 中的许多方向（尤其是 Reverse 和 PWN）要求你对计算机的底层运行机制有清晰的认识。不理解寄存器的工作原理就无法理解汇编代码，不理解栈的布局就无法利用栈溢出漏洞。

---

### 一、数据表示

#### 1. 数制

```
十进制  二进制     十六进制
0       0000      0x0
1       0001      0x1
2       0010      0x2
...
9       1001      0x9
10      1010      0xA
11      1011      0xB
12      1100      0xC
13      1101      0xD
14      1110      0xE
15      1111      0xF
```

**常用转换：**

```python
# Python 转换
hex(255)    # '0xff'
bin(255)    # '0b11111111'
int('ff', 16)  # 255
int('1111', 2) # 15

# 快速换算（记忆即可）
# 0x1000 = 4096 (4KB)
# 0x100000 = 1048576 (1MB)
# 0x400000 = 4194304 (4MB)
```

#### 2. 数据宽度

| 名称 | 位数 | 字节数 | 范围 |
|------|------|--------|------|
| byte | 8 | 1 | 0 ~ 255 |
| word | 16 | 2 | 0 ~ 65535 |
| dword | 32 | 4 | 0 ~ 4294967295 |
| qword | 64 | 8 | 0 ~ 2^64-1 |

在汇编和逆向中，数据宽度前缀：

```
mov al,  0xff    # al 是 8 位（byte）
mov ax,  0xffff  # ax 是 16 位（word）
mov eax, 0xffffffff  # eax 是 32 位（dword）
mov rax, 0xffffffffffffffff  # rax 是 64 位（qword）
```

#### 3. 字节序（Endianness）

字节序指多字节数据在内存中的排列方式。

```
数值 0x12345678：

小端序（Little-Endian，x86/x64）：
内存地址 → 低 → 高
           78  56  34  12
           ^ 低位字节在低地址

大端序（Big-Endian，网络字节序）：
内存地址 → 低 → 高
           12  34  56  78
           ^ 高位字节在低地址
```

```python
# Python 查看字节序
import sys
sys.byteorder  # 'little' 或 'big'

# pwntools 转换
from pwn import *
p32(0x12345678)  # b'\x78\x56\x34\x12'（小端）
p64(0x12345678)  # b'\x78\x56\x34\x12\x00\x00\x00\x00'

# 大端
p32(0x12345678, endian='big')  # b'\x12\x34\x56\x78'
```

**为什么 CTF 中重要？**

当你在栈溢出中覆盖返回地址时，必须用小端序写入地址：

```python
# 正确：目标地址 0x0804863b
payload += p32(0x0804863b)  # 写入 \x3b\x86\x04\x08

# 错误：直接写入整数不会得到预期结果
payload += b'\x08\x04\x86\x3b'  # 这是大端序，地址会变成 0x3b860408
```

---

### 二、寄存器

寄存器是 CPU 内部的高速存储单元，用于暂存指令、数据和地址。

#### 1. x86 通用寄存器（32 位）

```
EAX - 累加寄存器（Accumulator），常用于算术运算和函数返回值
EBX - 基址寄存器（Base），常用于基地址寻址
ECX - 计数寄存器（Counter），用于循环计数
EDX - 数据寄存器（Data），辅助 EAX 进行运算

ESI - 源索引寄存器（Source Index），用于字符串操作
EDI - 目标索引寄存器（Destination Index），用于字符串操作

ESP - 栈指针寄存器（Stack Pointer），指向当前栈顶
EBP - 基址指针寄存器（Base Pointer），指向当前栈帧底部

EIP - 指令指针寄存器（Instruction Pointer），指向下一条要执行的指令
```

#### 2. x64 扩展（64 位）

```
RAX, RBX, RCX, RDX, RSI, RDI, RSP, RBP, RIP

新增寄存器（通用）：
R8, R9, R10, R11, R12, R13, R14, R15
```

**32 位与 64 位寄存器的关系：**

```
RAX（64 位）
├── EAX（32 位，RAX 的低 32 位）
│   ├── AX（16 位，EAX 的低 16 位）
│   │   ├── AH（8 位，AX 的高 8 位）
│   │   └── AL（8 位，AX 的低 8 位）
│   └── （EAX 的高 16 位无直接访问方式）
└── （RAX 的高 32 位无直接访问方式）
```

#### 3. 标志寄存器

```
EFLAGS/RFLAGS：

ZF（Zero Flag）   - 运算结果为 0 时置 1
CF（Carry Flag）  - 运算产生进位/借位时置 1
SF（Sign Flag）   - 运算结果为负时置 1
OF（Overflow Flag）- 有符号运算溢出时置 1
IF（Interrupt Flag）- 中断使能标志
DF（Direction Flag）- 字符串操作方向
```

```asm
; cmp 指令影响标志位
cmp eax, ebx
; 若 eax == ebx → ZF = 1
; 若 eax <  ebx → CF = 1
; 若 eax >  ebx → ZF = 0 且 CF = 0

; 条件跳转根据标志位决定
je  label  ; ZF = 1 时跳转
jne label  ; ZF = 0 时跳转
jg  label  ; ZF = 0 且 SF = OF 时跳转（有符号大于）
jl  label  ; SF != OF 时跳转（有符号小于）
ja  label  ; CF = 0 且 ZF = 0 时跳转（无符号大于）
jb  label  ; CF = 1 时跳转（无符号小于）
```

---

### 三、栈（Stack）

栈是程序运行时用于存储局部变量、函数参数和返回地址的内存区域。栈是一种"后进先出"（LIFO）的数据结构。

#### 1. 栈的特性

```
高地址
┌──────────────────┐
│    调用者栈帧      │
├──────────────────┤
│    函数参数        │
├──────────────────┤
│    返回地址        │  ← 函数返回时 EIP 从这里恢复
├──────────────────┤
│    保存的 EBP      │  ← 函数返回时 EBP 从这里恢复
├──────────────────┤
│    局部变量区域     │  ← 当前函数的局部变量
├──────────────────┤
│     ...           │
└──────────────────┘
低地址

关键：
- 栈向低地址方向生长（push 使 ESP 减小）
- ESP/RSP 指向栈顶（最低地址）
- EBP/RBP 指向栈帧底部（最高地址）
```

#### 2. 函数调用过程

```asm
; 调用前：参数已压栈
push arg3        ; 参数从右向左压栈（cdecl）
push arg2
push arg1
call func        ; 1. push 返回地址（当前 EIP 的下一条指令地址）
                 ; 2. jmp func 入口
```

```asm
; 函数入口
func:
    push ebp     ; 保存调用者的 EBP
    mov ebp, esp ; 设置当前函数的 EBP
    sub esp, 64  ; 分配 64 字节局部变量空间
```

```asm
; 函数返回
    mov esp, ebp ; 恢复 ESP
    pop ebp      ; 恢复调用者的 EBP
    ret          ; pop 返回地址 → EIP
```

#### 3. 函数调用约定

| 约定 | 参数传递 | 谁清理栈 | 返回值 |
|------|---------|----------|--------|
| cdecl | 从右向左压栈 | 调用者 | EAX |
| stdcall | 从右向左压栈 | 被调用者 | EAX |
| fastcall | ECX/EDX 传前两个，其余压栈 | 被调用者 | EAX |
| System V AMD64 | RDI, RSI, RDX, RCX, R8, R9 | 调用者 | RAX |
| MS x64 | RCX, RDX, R8, R9 | 调用者 | RAX |

**CTF 中的意义：**

```python
# 32 位传参：全部在栈上
# payload = padding + system_plt + ret_addr + arg1 + arg2

# 64 位传参：
# payload = padding + pop_rdi + arg1 + pop_rsi + arg2 + system_addr

# 原因：64 位 System V ABI 中，前 6 个参数通过寄存器传递
# rdi → 第 1 个参数
# rsi → 第 2 个参数
# rdx → 第 3 个参数
```

#### 4. 栈溢出原理

```c
void vulnerable() {
    char buf[16];  // 在栈上分配 16 字节
    gets(buf);     // 不检查长度，可以超出 16 字节
}

// 栈布局：
// ┌──────────────┐
// │   返回地址    │ ← 被覆盖
// ├──────────────┤
// │   saved EBP  │ ← 被覆盖
// ├──────────────┤
// │   buf[0~15]  │ ← 从这里开始写入
// └──────────────┘
```

---

### 四、堆（Heap）

堆是用于动态分配内存的区域，程序通过 `malloc`/`free` 或 `new`/`delete` 管理。

#### 1. 堆与栈的区别

| 特性 | 栈 | 堆 |
|------|-----|-----|
| 分配方式 | 自动（编译器管理） | 手动（程序员管理） |
| 生长方向 | 向低地址 | 向高地址 |
| 速度 | 快 | 慢 |
| 大小 | 有限（默认 1~8MB） | 大（取决于内存） |
| 碎片 | 无 | 有 |
| 作用域 | 函数级别 | 全局（直到主动释放） |

#### 2. 堆的基本结构

```
低地址
┌──────────────────────┐
│  chunk 1             │
│  ├── prev_size       │  ← 前一个 chunk 的大小（若前一个空闲）
│  ├── size            │  ← 当前 chunk 的大小（含标志位）
│  ├── fd              │  ← 空闲链表前向指针（仅在空闲时有效）
│  ├── bk              │  ← 空闲链表后向指针（仅在空闲时有效）
│  └── data            │  ← 用户数据
├──────────────────────┤
│  chunk 2             │
│  ...                 │
└──────────────────────┘
高地址
```

#### 3. 堆分配示例

```c
#include <stdlib.h>
#include <string.h>

void heap_example() {
    char *ptr1 = malloc(64);   // 在堆上分配 64 字节
    char *ptr2 = malloc(128);  // 在堆上分配 128 字节

    strcpy(ptr1, "Hello, Heap!");  // 写入数据

    free(ptr1);  // 释放 ptr1 指向的内存

    // 注意：释放后 ptr1 成为悬空指针（dangling pointer）
    // 若之后再使用 ptr1 则构成 Use-After-Free（UAF）
}
```

#### 4. CTF 中的堆漏洞

堆漏洞比栈溢出更复杂，常见类型：

```
Use-After-Free（UAF）     - 释放后继续使用指针
Double Free              - 同一内存区域释放两次
堆溢出（Heap Overflow）    - 写入数据超出 chunk 边界
Invalid Free             - 释放非法地址
```

堆利用在 CTF 的 PWN 方向属于进阶内容，需要理解不同分配器版本（glibc 2.23/2.27/2.31/2.35）的差异。

---

### 五、内存布局

#### 1. 进程内存结构

```
高地址 0xFFFFFFFF
┌──────────────────────┐
│     内核空间          │  ← 用户态不可访问
├──────────────────────┤
│     栈（向下生长）     │  ← 局部变量、函数参数、返回地址
├──────────────────────┤
│         ↓             │
│         ↑             │
├──────────────────────┤
│     堆（向上生长）     │  ← 动态分配的内存（malloc/new）
├──────────────────────┤
│     BSS 段            │  ← 未初始化的全局变量（bss）
├──────────────────────┤
│     数据段            │  ← 初始化的全局变量（data）
├──────────────────────┤
│     代码段 / .text    │  ← 程序指令（只读）
└──────────────────────┘
低地址 0x00000000
```

#### 2. 各段说明

```bash
# 查看 ELF 文件的段信息
readelf -S binary
readelf -l binary

# 常用段：
# .text   - 代码段，只读可执行
# .rodata - 只读数据（字符串常量等）
# .data   - 已初始化的全局变量
# .bss    - 未初始化的全局变量
# .got    - 全局偏移表（GOT）
# .plt    - 过程链接表（PLT）
```

```bash
# 查看运行时的内存映射
cat /proc/<pid>/maps

# pwntools 查看
from pwn import *
io = process('./binary')
io.proc.pid  # 查看 pid
# 然后 cat /proc/pid/maps
```

#### 3. PIE 与 ASLR

```
PIE（Position Independent Executable）
  - 程序代码段的基址随机化
  - ELF 文件类型为 DYN（Shared object file）
  - 绕过：需要信息泄露

ASLR（Address Space Layout Randomization）
  - 栈、堆、共享库基址随机化
  - 绕过：信息泄露、部分覆盖、爆破（32 位）
```

```bash
# 检查保护机制
checksec binary

# 输出示例
# Arch:     amd64-64-little
# RELRO:    Partial RELRO
# Stack:    Canary found
# NX:       NX enabled
# PIE:      PIE enabled

# 各保护的含义：
# RELRO  - GOT 保护（Full RELRO 禁止修改 GOT）
# Stack  - 栈金丝雀（Canary），检测栈溢出
# NX     - 栈不可执行
# PIE    - 位置无关可执行文件
```

---

### 六、指令与寻址

#### 1. 常见指令分类

```asm
; 数据传送
mov  dst, src   ; dst = src
push src        ; 压栈
pop  dst        ; 出栈
lea  dst, [mem] ; 计算有效地址（不访问内存）

; 算术运算
add  dst, src   ; dst += src
sub  dst, src   ; dst -= src
inc  dst        ; dst++
dec  dst        ; dst--
xor  dst, src   ; dst ^= src（常用于清零 xor eax, eax）
imul dst, src   ; dst *= src

; 逻辑运算
and  dst, src   ; dst &= src
or   dst, src   ; dst |= src
shl  dst, cnt   ; dst <<= cnt
shr  dst, cnt   ; dst >>= cnt

; 比较与跳转
cmp  a, b       ; 比较 a 和 b，设置标志位
test a, b       ; a & b，设置标志位（常用于检查是否为 0）
jmp  label      ; 无条件跳转
je   label      ; 相等则跳转（ZF=1）
jne  label      ; 不相等则跳转（ZF=0）
jg   label      ; 有符号大于则跳转
jl   label      ; 有符号小于则跳转

; 调用与返回
call func       ; push 返回地址; jmp func
ret             ; pop 返回地址 → EIP
```

#### 2. 寻址模式

```asm
; 立即数寻址
mov eax, 123    ; 直接把值 123 赋给 eax

; 寄存器寻址
mov eax, ebx    ; 把 ebx 的值赋给 eax

; 直接寻址
mov eax, [0x804a000]  ; 访问地址 0x804a000 处的内存

; 寄存器间接寻址
mov eax, [ebx]  ; 访问 ebx 指向的内存

; 基址加变址寻址
mov eax, [ebx + ecx*4]      ; 数组访问
mov eax, [ebp - 8]          ; 局部变量访问
mov eax, [ebx + ecx*4 + 16] ; 带偏移的数组访问
```

#### 3. IDA 伪代码解读

IDA 的 F5 反编译将汇编转为类 C 代码，理解映射关系很重要：

```c
// 汇编          →   C 伪代码
// mov eax, [ebp-4]   →   int var_4 = ...;
// cmp eax, 0         →   if (var_4 == 0)
// je label           →       goto label;
// mov eax, [ebp+8]   →   arg_0
// call [ebx+12]      →   vtable->func()
```

---

### 七、常用命令速查

```bash
# ---- 文件分析 ----
file binary          # 查看文件类型
strings binary       # 提取可打印字符串
hexdump -C file      # 十六进制查看
xxd file             # 十六进制查看（另一种）
readelf -h binary    # ELF 文件头
objdump -d binary    # 反汇编
objdump -t binary    # 符号表

# ---- 进程与内存 ----
ldd binary           # 查看动态链接库
cat /proc/pid/maps   # 查看进程内存映射
strace ./binary      # 系统调用追踪
ltrace ./binary      # 库函数调用追踪
gdb ./binary         # 启动调试

# ---- 网络 ----
netstat -tulpn       # 查看监听端口
ss -tulpn            # 更快的 netstat
nc -lvnp 4444        # 监听端口（反弹 shell 接收）
nc target 80         # 连接目标端口
curl http://target   # HTTP 请求

# ---- 杂项 ----
python3 -c "print('hello')"
base64 -d <<< "aGVsbG8="
echo "obfuscated" | rot13
```

--- 

### 附：ABI 参考文档

- [ABI 手册 (PDF)](/abi.pdf) — 包含 x86/x64 系统调用号、寄存器使用约定等参考信息。
