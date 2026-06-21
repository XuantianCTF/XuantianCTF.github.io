+++
title = "Android 逆向"
description = "Android APK 逆向分析。"
date = 2026-06-21T00:00:00.000Z
+++

## Android 逆向

Android 逆向是对 Android 应用程序进行反编译和分析的技术。

### 基本流程

1. 获取 APK 文件
2. 反编译（jadx、apktool）
3. 分析代码逻辑
4. 修改与重打包

### 常用工具

- **jadx**：Java 反编译器
- **apktool**：APK 解包工具
- **dex2jar**：dex 转 jar
- **JD-GUI**：Java 反编译查看器
- **Frida**：动态 Hook 框架

### 常见保护

- 代码混淆（ProGuard）
- 加壳保护
- 反调试检测
- 完整性校验
