+++
title = "Android 逆向"
description = "Android APK 逆向分析技术。"
date = 2026-06-21T09:00:00.000Z
+++

## Android 逆向

Android 逆向是对 Android 应用程序进行反编译和分析的技术，是 CTF 逆向方向的重要组成部分。

---

### 一、APK 结构

```
app.apk
├── AndroidManifest.xml    # 应用配置
├── classes.dex           # Dalvik 字节码
├── resources.arsc        # 资源映射表
├── res/                  # 资源文件
├── lib/                  # Native 库 (.so)
├── assets/               # 原始资源文件
└── META-INF/             # 签名信息
```

---

### 二、分析工具

#### 1. jadx（反编译）

```bash
# 命令行反编译
jadx -d output_dir app.apk

# 直接打开
jadx-gui app.apk
```

#### 2. apktool（解包）

```bash
# 解包
apktool d app.apk -o output_dir

# 重打包
apktool b output_dir -o new.apk

# 签名
jarsigner -keystore keystore.jks new.apk alias
```

#### 3. dex2jar

```bash
# dex 转 jar
d2j-dex2jar.sh app.apk -o output.jar
```

#### 4. JD-GUI

Java 反编译查看器，用于查看 jar 文件。

---

### 三、动态分析

#### Frida

```javascript
// Hook Java 方法
Java.perform(function() {
    var MainActivity = Java.use("com.example.app.MainActivity");
    MainActivity.checkFlag.implementation = function(input) {
        console.log("Input: " + input);
        var result = this.checkFlag(input);
        console.log("Output: " + result);
        return result;
    };
});

// Hook Native 函数
Interceptor.attach(Module.findExportByName("libnative.so", "check"), {
    onEnter: function(args) {
        console.log("arg0: " + Memory.readUtf8String(args[0]));
    },
    onLeave: function(retval) {
        console.log("retval: " + retval);
    }
});
```

```bash
# 运行 Frida
frida -U -f com.example.app -l hook.js --no-pause
```

#### Objection

```bash
# 启动 objection
objection -g com.example.app explore

# 常用命令
android hooking list activities
android hooking list classes
android hooking watch class com.example.MainActivity
```

---

### 四、常见保护与绕过

#### 1. 代码混淆（ProGuard）

- 类名、方法名被混淆
- 保留 `MainActivity` 等入口类
- 通过字符串和逻辑推断功能

#### 2. 加壳保护

**检测：**
```bash
# 检查 dex 文件大小
ls -la classes.dex
# 如果只有几 KB，可能被壳保护

# 查看 AndroidManifest.xml
# 是否有 application 属性异常
```

**脱壳方法：**
- FDex2
- DexDump
- FRIDA-DEXDump

#### 3. 反调试检测

```javascript
// 绕过反调试
Java.perform(function() {
    var Thread = Java.use("java.lang.Thread");
    Thread.checkAccess.implementation = function() {
        return true;
    };
});
```

#### 4. 完整性校验

```javascript
// 绕过签名校验
Java.perform(function() {
    var PackageManager = Java.use("android.app.ApplicationContext");
    PackageManager.getPackageManager.implementation = function() {
        return null;
    };
});
```

---

### 五、Native 逆向

#### IDA Pro 分析 .so

1. 打开 .so 文件
2. 定位关键函数
3. 分析汇编代码
4. 理解算法逻辑

#### 常见算法识别

```c
// 简单异或加密
for (int i = 0; i < len; i++) {
    buf[i] ^= key[i % key_len];
}

// Base64
// libcrypto.so 中的 EVP_EncodeBlock
```

---

### 六、解题流程

1. **获取 APK**：下载或从设备提取
2. **静态分析**：jadx 反编译查看代码
3. **定位关键**：搜索 flag、check 等关键词
4. **分析逻辑**：理解验证算法
5. **动态调试**：Frida Hook 获取运行时数据
6. **编写脚本**：逆向算法得到 flag

---

### 七、常用命令

```bash
# 查看 APK 信息
aapt dump badging app.apk

# 查看 Activity
aapt dump xmltree app.apk AndroidManifest.xml

# adb 安装
adb install app.apk

# Frida 枚举类
frida-ps -U | grep app
```

---

### 八、练习平台

- [diva-android](https://github.com/intoHere/diva-android)
- [MSTG](https://github.com/OWASP/owasp-mstg)
- [BUUCTF Reverse 方向](https://buuoj.cn/)
