---
title: '玄天 CTF 实验室'
date: 2024-01-01
type: landing

sections:
  - block: hero
    content:
      title: "欢迎来到 **玄天 CTF 实验室**"
      text: "专注于网络安全攻防技术研究与实战训练。为 CTF 爱好者提供高质量的学习资源、靶场环境和技术交流空间。"
      primary_action:
        text: "开始学习"
        url: /docs/
        icon: book-open
      secondary_action:
        text: "最新动态"
        url: /blog/
        icon: newspaper
    design:
      spacing:
        padding: ["2rem", 0, "2rem", 0]
      css_class: ""
      background:
        color: ""

  - block: stats
    content:
      items:
        - statistic: "6+"
          description: |
            CTF 技术方向
        - statistic: "40+"
          description: |
            技术文档页面
        - statistic: "100+"
          description: |
            安全知识点

  - block: features
    id: directions
    content:
      title: "实验室方向"
      text: "涵盖 CTF 比赛六大核心方向，从入门到进阶的完整学习路径。"
      items:
        - name: "Web 安全"
          icon: globe-alt
          description: "SQL 注入、XSS、CSRF、文件上传漏洞等 Web 应用安全攻防技术。"
        - name: "逆向工程"
          icon: wrench-screwdriver
          description: "二进制分析、脱壳、调试、反混淆等逆向工程技术实战。"
        - name: "密码学"
          icon: key
          description: "古典密码、现代密码、哈希碰撞、侧信道攻击等密码学挑战。"
        - name: "PWN"
          icon: cpu-chip
          description: "栈溢出、堆利用、ROP、格式化字符串等二进制漏洞利用技术。"
        - name: "杂项"
          icon: puzzle-piece
          description: "隐写术、取证分析、流量分析、编码解码等综合技能挑战。"
        - name: "移动安全"
          icon: device-phone-mobile
          description: "Android/iOS 逆向、动态分析、脱机破解等移动端安全研究。"

  - block: cta-card
    content:
      title: "加入玄天 CTF 实验室"
      text: "无论你是刚入门的新手还是经验丰富的老手，都欢迎加入玄天 CTF 实验室。在这里，你可以与志同道合的伙伴一起学习、一起进步。"
      button:
        text: "查看文档"
        url: /docs/
    design:
      card:
        css_class: "bg-primary-700"
---
