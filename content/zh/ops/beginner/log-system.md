---
title: "日志系统（journalctl 与 logrotate）"
description: "Linux 日志藏在哪、怎么看、怎么轮转 —— 排障第一站。"
icon: scroll-text
order: 2
chapter: shell
chapterTitle: "Shell 与排查"
chapterOrder: 2
tags: [日志, journalctl, logrotate]
---

<KeyIdea>
**一句话**：现代 Linux 服务日志默认走 **systemd-journal**（结构化、可索引），传统 `/var/log/*.log` 仍存在。**`journalctl -u service -f`** 实时跟踪，**logrotate** 防止日志撑爆磁盘。
</KeyIdea>

## 是什么

```
/var/log/syslog           # 传统系统日志（Debian / Ubuntu）
/var/log/messages         # 同上 RHEL 系
/var/log/auth.log         # 登录 / sudo
/var/log/nginx/           # 应用自管的目录
journalctl -u nginx       # systemd 收集的同一份服务日志
```

systemd-journal 把日志**结构化存储**（带 unit / pid / boot id），但有些发行版同时还转给 syslog，**双份留底**。

## 打个比方

<Analogy>
旧日志 = 一沓**手写日记本**，按月份归档。  
journal = 一台**带索引的电子档案柜** —— 可以按服务、按时间、按优先级、按字段查。
</Analogy>

## 关键概念

<Terms items={[
  { term: "Unit", en: "服务单元", def: "systemd 视角下的一个服务，对应 journal 里的一段日志流。" },
  { term: "Priority", en: "优先级", def: "0 emerg → 7 debug。`-p err` 只看错误及以上。" },
  { term: "Boot ID", en: "本次启动 ID", def: "`-b` 看当次启动；`-b -1` 看上一次（适合查为啥重启）。" },
  { term: "logrotate", en: "日志轮转", def: "按大小 / 时间切割旧日志、压缩、删除超期。/etc/logrotate.d/*。" },
  { term: "结构化字段", en: "Structured Fields", def: "`journalctl -o json` 看；可以 `_PID=` `_HOSTNAME=` 字段过滤。" },
]} />

## 常用命令

```bash
# journalctl
journalctl -u nginx -f                   # 实时跟随
journalctl -u nginx --since "10 min ago"
journalctl -u nginx --since today
journalctl -u nginx -p err               # 只看 error 以上
journalctl -k                            # 内核日志
journalctl --disk-usage                  # journal 占用
journalctl --vacuum-time=7d              # 只保留 7 天
journalctl --vacuum-size=500M

# 老派 / 应用自己写的
tail -f /var/log/nginx/error.log
zcat /var/log/nginx/access.log.2.gz | grep '500 '
less /var/log/auth.log

# logrotate
logrotate -d /etc/logrotate.conf         # 调试看会做什么
logrotate -f /etc/logrotate.d/nginx      # 强制立即轮转
```

## 怎么工作

```mermaid
flowchart LR
    Svc[服务 stdout/stderr] --> JD[systemd-journald]
    JD --> JF[/var/log/journal/]
    JD -.-> SL[syslog 转发]
    SL --> File[/var/log/...]
    LR[logrotate cron] --> File
    LR -->|gzip + 重命名| Old[*.log.1.gz]
```

journal 自己有空间限制（`SystemMaxUse` / 默认 10% 磁盘），不需要 logrotate。

## 实操要点

- **服务日志走 stdout/stderr**：systemd 自动收集 → journal。**不要再自己写 /var/log 文件**（容器化也是这条原则）。
- **journal 太占盘**：`journalctl --vacuum-size=500M` 立即收，或改 `/etc/systemd/journald.conf` 的 `SystemMaxUse=`。
- **logrotate 配置示例**：

  ```
  /var/log/nginx/*.log {
      daily
      rotate 14
      compress
      missingok
      notifempty
      sharedscripts
      postrotate
          nginx -s reopen
      endscript
  }
  ```

- **生产建议**：app → stdout → journal → 转发到中央 ELK / Loki，本地不保留太久。
- **`grep` 之外**：`rg` 速度更快，`lnav` 可视化看多日志。

## 易混点

<Compare
  leftTitle="journal"
  rightTitle="syslog / 文件日志"
  left={<>
    结构化、按 unit / 优先级查。<br />
    重启自动旋转、有空间上限。
  </>}
  right={<>
    纯文本，依赖 logrotate。<br />
    传统工具栈友好。
  </>}
/>

## 延伸阅读

- [systemd](/ops/beginner/systemd)
- [备份与恢复](/ops/advanced/backup-restore)
- [Loki](/ops/ecosystem/loki)
