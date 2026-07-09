---
title: Android 逆向
description: Android APK 逆向分析技术。
date: 2026-06-21T09:00:00.000Z
---


## Android 逆向

Android 逆向是对 Android 应用程序进行反编译和分析的技术，是 CTF 逆向方向的重要组成部分。

### 什么是 Android 逆向？

Android 逆向是指将编译后的 Android 应用（APK）还原为可读的代码和资源，分析其内部逻辑和行为的过程。

与桌面逆向不同，Android 逆向需要考虑移动设备的特殊性，如 Android 系统架构、Dalvik/ART 虚拟机、应用沙箱等。

### Android 逆向的应用

- **安全审计**：检查应用是否存在安全漏洞
- **恶意软件分析**：分析病毒、木马的行为
- **竞品分析**：了解竞争对手的技术实现
- **隐私保护**：检查应用是否过度收集用户数据

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

### 五、Xposed 框架 Hook

Xposed 通过替换 app_process 实现全局 Hook，修改后无需重启应用。

#### 基础 Hook 模块

```java
// Xposed 模块入口
public class MainHook implements IXposedHookLoadPackage {
    public void handleLoadPackage(XC_LoadPackage.LoadPackageParam lpparam) {
        if (!lpparam.packageName.equals("com.example.app"))
            return;

        // Hook 方法
        XposedHelpers.findAndHookMethod(
            "com.example.app.MainActivity",
            lpparam.classLoader,
            "checkFlag",
            String.class,
            new XC_MethodHook() {
                @Override
                protected void beforeHookedMethod(MethodHookParam param) {
                    String input = (String) param.args[0];
                    XposedBridge.log("Input: " + input);
                }

                @Override
                protected void afterHookedMethod(MethodHookParam param) {
                    XposedBridge.log("Result: " + param.getResult());
                    // 直接返回 true
                    param.setResult(true);
                }
            }
        );
    }
}
```

#### Hook 构造函数与字段

```java
// Hook 构造函数
XposedHelpers.findAndHookConstructor(
    "com.example.app.UserData",
    lpparam.classLoader,
    String.class, int.class,
    new XC_MethodHook() {
        @Override
        protected void beforeHookedMethod(MethodHookParam param) {
            param.args[0] = "admin";  // 修改构造参数
        }
    }
);

// 读写字段
Class<?> clazz = XposedHelpers.findClass("com.example.app.Config", lpparam.classLoader);
Object instance = XposedHelpers.getObjectField(param.thisObject, "config");
XposedHelpers.setStaticBooleanField(clazz, "isPremium", true);
```

#### Frida vs Xposed

| 特性 | Frida | Xposed |
|------|-------|--------|
| 实现方式 | 动态注入 | 框架替换 |
| 需 root | 是 | 是 |
| 即时生效 | 是（无需重启） | 需要重启 system_server |
| 语言 | JS/Python | Java/Kotlin |
| 绕过反检测 | 较困难 | 较容易 |
| 系统级 Hook | 较困难 | 原生支持 |

---

### 六、SSL Pinning 绕过

HTTPS 证书绑定（SSL Pinning）是常见的安全措施，防止中间人攻击。

#### 方案一：Objection 一键绕过

```bash
# objection 自动绕过 pinning
objection -g com.example.app explore

# 在 objection shell 中
android sslpinning disable
```

#### 方案二：Frida 脚本绕过

```javascript
// 通用 SSL Pinning 绕过
Java.perform(function() {
    // TrustManager 绕过
    var TrustManager = Java.registerClass({
        name: 'com.example.TrustManager',
        implements: [javax.net.ssl.X509TrustManager],
        methods: {
            checkClientTrusted: function(chain, authType) {},
            checkServerTrusted: function(chain, authType) {},
            getAcceptedIssuers: function() { return []; }
        }
    });

    // Hook SSLContext.init 使用自定义 TrustManager
    var SSLContext = Java.use('javax.net.ssl.SSLContext');
    SSLContext.init.implementation = function(km, tm, rm) {
        var trustAll = Java.array('javax.net.ssl.TrustManager', [TrustManager.$new()]);
        this.init(km, trustAll, rm);
    };

    // Hook HostnameVerifier
    var HostnameVerifier = Java.use('javax.net.ssl.HostnameVerifier');
    HostnameVerifier.verify.implementation = function(hostname, session) {
        return true;
    };

    // 针对 OkHttp 的绕过
    var CertificatePinner = Java.use('okhttp3.CertificatePinner');
    CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function() {
        return;
    };
});
```

#### 方案三：JustTrustMe（Xposed 模块）

```bash
# 安装 JustTrustMe 模块
# Xposed Installer → 下载 → JustTrustMe → 启用
# 重启后自动绕过所有已知的 SSL Pinning
```

#### 方案四：抓包配置

```bash
# 安装抓包证书到系统分区
adb root
adb remount
adb push burp-ca.der /system/etc/security/cacerts/
adb shell chmod 644 /system/etc/security/cacerts/9a5ba575.0

# 或使用 Frida 将用户证书复制到系统目录
frida -U -f com.example.app -l install-cert.js
```

---

### 七、Common Android 漏洞分析

#### 1. WebView RCE

```java
// 危险配置：启用 JavaScript 并暴露接口
webView.getSettings().setJavaScriptEnabled(true);
webView.addJavascriptInterface(new Bridge(), "bridge");  // 危险！
webView.loadUrl("file:///android_asset/page.html");

// 利用：通过 JavaScript 调用 Java 方法
// <script>bridge.getClass().forName("java.lang.Runtime").getMethod("exec", String.class).invoke(null, ["id"])</script>
```

#### 2. Intent Redirection

```java
// 危险代码：从 intent 中取出数据并直接启动
Intent intent = getIntent();
String action = intent.getStringExtra("target_action");
startActivity(new Intent(action));  // 可被任意 Intent 劫持
```

#### 3. PendingIntent 劫持

```java
// 危险：隐式 Intent 的 PendingIntent
PendingIntent pi = PendingIntent.getActivity(
    this, 0,
    new Intent("com.example.ACTION"),  // 隐式 intent
    PendingIntent.FLAG_UPDATE_CURRENT
);
// 攻击者可以拦截此 Intent
```

#### 4. Content Provider 任意文件读取

```java
// 攻击：通过 Content Provider 读取文件
content://com.example.FileProvider/../../../../../etc/hosts

// 防御检查路径遍历
public ParcelFileDescriptor openFile(Uri uri, String mode) {
    String path = uri.getLastPathSegment();
    if (path.contains("..")) {
        throw new SecurityException("Path traversal detected");
    }
    // ...
}
```

#### 5. 不安全的本地存储

```bash
# 检查 APK 中的数据存储位置
adb shell
run-as com.example.app
cat /data/data/com.example.app/shared_prefs/config.xml
cat /data/data/com.example.app/databases/secret.db
ls -la /data/data/com.example.app/files/

# 常见的危险存储方式
# - SharedPreferences（明文）
# - SQLite 数据库（未加密）
# - 内部文件（权限错误）
# - 日志输出（Log.d/dump）
```

#### 6. Android Backup 泄露

```bash
# 备份应用数据
adb backup -f backup.ab -noapk com.example.app

# 解压备份文件
dd if=backup.ab bs=1 skip=24 | openssl zlib -d > backup.tar
tar xvf backup.tar

# 分析 apps/com.example.app/ 目录下所有文件
```

---

### 八、Magisk + Zygisk 与 Root 隐藏

```bash
# Magisk 模块位置
/data/adb/modules/

# Shamiko：隐藏 root 检测
# 在 denylist 中添加目标应用

# Zygisk 模块开发
# /data/adb/modules/myhook/
# ├── zygisk/
# │   └── myhook.so      # Native Zygisk 模块
# ├── module.prop
# └── post-fs-data.sh

# 检测是否被 Magisk Hook
Java.perform(function() {
    var System = Java.use('java.lang.System');
    System.getProperty.overload('java.lang.String').implementation = function(key) {
        if (key.equals('java.vm.version'))
            return this.getProperty(key);  // 返回原始值绕过检测
        return this.getProperty(key);
    };
});
```

---

### 九、Native 逆向

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
