+++
title = "移动安全"
+++

移动安全方向专注于 Android 和 iOS 应用的安全分析与逆向工程。随着移动互联网的普及，移动安全已成为网络安全领域的重要组成部分。

### 什么是移动安全？

移动安全研究的是移动设备（手机、平板）及其应用程序的安全性。与传统 Web 安全不同，移动安全需要考虑设备特性、操作系统限制和应用商店审核机制。

Android 系统由于其开源特性，更容易进行逆向分析；而 iOS 系统相对封闭，但越狱技术为安全研究提供了可能。

### 为什么学习移动安全？

1. **市场需求大**：移动应用数量超过 500 万，安全问题频发
2. **技术综合性强**：需要掌握逆向、动态分析、网络协议等多方面技能
3. **漏洞赏金高**：移动应用漏洞赏金通常比 Web 漏洞更高
4. **发展空间广**：物联网、车载系统等新兴领域都需要移动安全技术

### 核心知识点

| 知识领域 | 内容 |
|----------|------|
| Android 基础 | APK 结构、Dalvik/ART 虚拟机、四大组件 |
| 逆向工具 | jadx、apktool、dex2jar、JD-GUI |
| 动态分析 | Frida、Objection、Xposed |
| 系统机制 | 权限模型、Intent、ContentProvider |
| 加固技术 | 混淆、加壳、反调试、完整性校验 |

### 学习路线

1. 了解 Android 系统架构和 APK 结构
2. 掌握 jadx、apktool 等静态分析工具
3. 学习 Frida 动态 Hook 框架
4. 了解常见保护机制（混淆、加壳、反调试）
5. 在靶场中练习 Android 逆向实战

### 推荐资源

- [OWASP Mobile Top 10](https://owasp.org/www-project-mobile-top-10/) - 移动应用安全风险
- [diva-android](https://github.com/intoHere/diva-android) - Android 安全靶场
- [MobSF](https://github.com/MobSF/Mobile-Security-Framework-MobSF) - 移动安全框架
