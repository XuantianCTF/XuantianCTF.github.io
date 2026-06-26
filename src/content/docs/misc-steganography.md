---
title: 隐写术
description: 常见隐写技术与检测方法。
date: 2026-06-21T07:00:00.000Z
---


## 隐写术

隐写术是将信息隐藏在其他文件（如图片、音频、视频）中的技术，是 CTF 杂项方向的常见题型。

### 什么是隐写术？

隐写术（Steganography）源于希腊语，意为"隐藏书写"。与加密不同，隐写术不改变信息本身，而是将信息隐藏在其他看似正常的载体中。

隐写术的核心思想是"隐藏于众目睽睽之下"——信息就藏在那里，但你可能根本注意不到。

### 隐写 vs 加密

| 特性 | 隐写术 | 加密 |
|------|--------|------|
| 信息形态 | 信息本身不变 | 信息被改变 |
| 可见性 | 载体看起来正常 | 密文是乱码 |
| 目的 | 隐藏信息的存在 | 隐藏信息的内容 |
| 检测难度 | 需要专门工具 | 可以识别是密文 |

---

### 一、图片隐写

#### 1. LSB 隐写

修改像素的最低有效位（Least Significant Bit），对视觉影响极小。

**检测方法：**
- Stegsolve 查看各通道
- zsteg 工具检测

**破解：**

```bash
# zsteg 分析 PNG/BMP
zsteg image.png

# 指定 LSB 隐写方式
zsteg image.png -b 1          # LSB 1
zsteg image.png -b 1 -c       # 颜色通道
```

#### 2. 文件附加

在图片文件末尾附加数据。

```bash
# binwalk 检测
binwalk image.png

# 分离文件
binwalk -e image.png
# 或
foremost image.png
```

#### 3. EXIF 信息

查看图片元数据。

```bash
# exiftool
exiftool image.jpg

# 图片右键 → 属性 → 详细信息
```

#### 4. 盲水印

在频域隐藏信息。

```bash
# BlindWaterMark
python bwm.py decode original.png watermarked.png output.png
```

#### 5. PNG CRC 校验

PNG 文件头包含 CRC 校验值，可以利用此推断隐藏的数据长度。

```python
import zlib

# 读取 PNG IHDR 块
with open('image.png', 'rb') as f:
    data = f.read()

# 暴力破解隐藏的宽度/高度
for width in range(1, 1000):
    # 构造 IHDR 数据
    ihdr_data = data[12:16] + width.to_bytes(4, 'big') + data[20:]
    if zlib.crc32(ihdr_data) & 0xffffffff == int.from_bytes(data[29:33], 'big'):
        print(f"Width: {width}")
```

---

### 二、音频隐写

#### 1. 波形分析

用 Audacity 查看波形，隐藏的信息可能以视觉方式呈现。

#### 2. 频谱分析

查看频谱图，信息可能隐藏在特定频率中。

```bash
# sonic-visualiser
# 或 Audacity → 分析 → 频谱图
```

#### 3. SSTV（慢扫描电视）

模拟信号传输的图片。

```bash
# QSSTV 解码
qsstv
```

---

### 三、视频隐写

#### 1. 帧分离

```bash
# ffmpeg 分离帧
ffmpeg -i video.mp4 frames/%d.png

# 逐帧查看
```

#### 2. 逐帧对比

使用工具对比相邻帧的差异。

---

### 四、压缩包隐写

#### 1. 密码爆破

```bash
# fcrackzip
fcrackzip -u -D -p wordlist.txt archive.zip

# john
zip2john archive.zip > hash.txt
john hash.txt
```

#### 2. ZIP 伪加密

修改文件头中的加密标志位。

#### 3. ZIP 明文攻击

已知压缩包中某个文件的内容。

```bash
# pkcrack
pkcrack -C encrypted.zip -c known.txt -P plain.zip -p known.txt
```

---

### 五、工具汇总

| 工具 | 用途 |
|------|------|
| Stegsolve | 图片通道分析 |
| binwalk | 文件分析与分离 |
| zsteg | PNG/BMP 隐写检测 |
| steghide | JPEG 隐写提取 |
| exiftool | 元数据查看 |
| foremost | 文件分离 |
| CyberChef | 编解码工具箱 |

---

### 六、常用命令

```bash
# binwalk
binwalk -e image.png

# steghide
steghide extract -sf image.jpg
steghide info image.jpg

# strings
strings image.png | grep flag

# hexdump
xxd image.png | head
```

---

### 七、练习平台

- [steganography](https://stegonline.georgeom.net/)
- [BUUCTF Misc 方向](https://buuoj.cn/)
- [CTFtime](https://ctftime.org/)
