---
title: "Linux 速通"
description: "搞清楚目录结构、最小命令集、shell 重定向 —— 进运维的第一道门槛。"
icon: terminal
order: 1
chapter: linux
chapterTitle: "Linux 基础"
chapterOrder: 1
tags: [Linux, Shell, 入门]
---

<KeyIdea>
**一句话**：Linux 哲学是「**一切皆文件 + 小工具组合**」。学会几十个命令 + 重定向 + 管道，**就能解决 90% 的日常运维**。
</KeyIdea>

## 目录结构（FHS）

```
/etc       全局配置（nginx.conf、systemd unit）
/var       变化数据（日志 /var/log、数据库 /var/lib）
/usr       发行版自带程序与库
/opt       第三方独立应用
/home      用户家目录
/root      root 用户家目录
/tmp       临时文件，重启会清
/proc /sys 内核虚拟文件系统（看进程 / 调内核参数）
```

任何文件 / 设备 / 网络 socket 在 Linux 里**都是文件路径** —— 这是「一切皆文件」。

## 打个比方

<Analogy>
Linux 像**积木盒**：每个命令是一块积木（`grep` / `sort` / `awk`），**用管道 `|` 拼起来**就成不同形状。Windows 倾向于"一个大型应用解决一切"。
</Analogy>

## 必会命令分类

<KV items={[
  { k: "查看 / 浏览", v: "ls / cat / less / tail / head / file" },
  { k: "导航", v: "cd / pwd / pushd / popd" },
  { k: "操作文件", v: "cp / mv / rm / mkdir / ln" },
  { k: "搜索", v: "find / grep / rg (ripgrep) / locate" },
  { k: "进程", v: "ps / top / htop / kill / pgrep" },
  { k: "权限", v: "chmod / chown / chgrp" },
  { k: "网络", v: "ip / ss / curl / dig" },
  { k: "归档", v: "tar / gzip / zstd / unzip" },
  { k: "文本处理", v: "sed / awk / cut / sort / uniq / wc" },
]} />

## 重定向与管道

```bash
cmd > file       # stdout 写到文件（覆盖）
cmd >> file      # 追加
cmd 2> err.log   # stderr 重定向
cmd > out 2>&1   # 都重定向到 out
cmd1 | cmd2      # cmd1 的 stdout 当作 cmd2 的 stdin
< file cmd       # stdin 来自 file
```

`|` 是 Linux 最强大的设计：

```bash
ps aux | grep nginx | awk '{print $2}' | xargs kill -9
```

## 怎么工作

```mermaid
flowchart LR
    User[Shell 进程] -->|fork| Sub[子进程]
    Sub -->|execve| Cmd[ls / grep / awk]
    Cmd -->|stdout| Pipe[管道]
    Pipe -->|stdin| Cmd2[下一个命令]
    Cmd2 -->|stdout| Term[终端]
```

每条命令都是 fork + exec 出来的进程，stdin / stdout / stderr 是它的"三根管子"。

## 实操要点

- **`man cmd` / `tldr cmd`**：man 是规范文档；[tldr](https://tldr.sh) 是最常用例子的速查卡。
- **善用 `xargs`**：把 stdin 转成参数。`find . -name '*.log' | xargs rm -f`。
- **谨慎 `rm -rf`**：尤其是带变量。**先 `echo` 一遍再执行**：`echo rm -rf "$DIR"/*`。
- **环境变量**：`export VAR=val` 当前 shell 生效；写进 `~/.bashrc` / `~/.zshrc` 持久化。
- **后台运行**：`cmd &` 后台执行；`nohup cmd > log 2>&1 &` 退出 shell 不挂。生产环境用 systemd。
- **历史搜索**：Ctrl+R 反向搜索历史命令，比 ↑ 找命令快得多。

## 易混点

<Compare
  leftTitle="bash"
  rightTitle="zsh"
  left={<>
    几乎所有发行版默认。<br />
    脚本兼容性最强。
  </>}
  right={<>
    macOS 默认，配 oh-my-zsh 体验更好。<br />
    脚本与 bash 略有差异。
  </>}
/>

## 延伸阅读

- [文件权限](/ops/beginner/file-permission)
- [进程与信号](/ops/beginner/process-signal)
- [Shell 脚本入门](/ops/beginner/shell-basics)
