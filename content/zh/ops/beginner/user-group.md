---
title: "用户、组与 sudo"
description: "运维第一原则：每个服务跑在自己的非特权用户下。"
icon: users
order: 4
chapter: linux
chapterTitle: "Linux 基础"
chapterOrder: 1
tags: [用户, sudo, 权限]
---

<KeyIdea>
**一句话**：Linux 通过 **uid/gid** 区分用户和组；**sudo** 让普通用户**临时**借用 root 权限做特定操作。**生产服务永远不要直接以 root 运行**。
</KeyIdea>

## 是什么

```
/etc/passwd        # 用户名 → uid，登录 shell，家目录
/etc/shadow        # 加密后的密码（root 才能读）
/etc/group         # 组名 → gid 和成员
/etc/sudoers       # 谁能 sudo，能 sudo 哪些命令
```

每个进程绑定一对 (uid, gid)；可以属于多个 group（supplementary groups）。

## 打个比方

<Analogy>
**uid** 像员工工号；**group** 像部门。  
**root（uid 0）** 是**总经理**：全公司哪都能进。  
**sudo** 像「**借总经理钥匙办一件事**」 —— 用完归还、还有日志。
</Analogy>

## 关键概念

<Terms items={[
  { term: "root", en: "uid 0", def: "超级用户，绕过权限检查。生产环境慎用。" },
  { term: "服务用户", en: "service user", def: "shell 通常是 /sbin/nologin，不能登录但能跑服务（www-data、nginx、postgres）。" },
  { term: "primary group", en: "主组", def: "用户登录时默认 gid，新建文件归属此组。" },
  { term: "supplementary groups", en: "附加组", def: "`groups` 命令查看。docker 组很常见。" },
  { term: "sudo", en: "switch user do", def: "默认 sudo 到 root；可以 `sudo -u other cmd` 切到任意用户。" },
  { term: "passwordless sudo", en: "免密 sudo", def: "`alice ALL=(ALL) NOPASSWD:ALL` —— 自动化场景常用，但要严格限定命令。" },
]} />

## 常用命令

```bash
# 用户
useradd -m -s /bin/bash alice    # 创建用户 alice
usermod -aG docker alice         # 把 alice 加到 docker 组
passwd alice                     # 改密码
userdel -r alice                 # 删用户连同家目录

# 组
groupadd devs
gpasswd -a alice devs            # alice 加入 devs

# 切换身份
su - alice                       # 完整登录环境
sudo -i                          # 完整 root 环境
sudo cmd                         # 单条命令
sudo -u postgres psql            # 以指定用户跑命令

# 当前身份
id
whoami
groups
```

## 怎么工作

```mermaid
flowchart LR
    Login[登录 / SSH] --> Auth[/etc/shadow PAM]
    Auth -->|成功| Sh[shell 进程<br/>uid=alice]
    Sh -->|sudo cmd| Sudo[sudo 验证]
    Sudo -->|查 /etc/sudoers| OK[setuid 0]
    OK --> Cmd[cmd 进程<br/>uid=root]
    Cmd -->|结束| Sh
```

整个 sudo 调用路径都被记录到日志（`/var/log/auth.log` / `journalctl -u sudo`）。

## 实操要点

- **绝对不要随便 `chmod 4755` 别人写的程序**：SUID 加 root 等于把后门开给整台机。
- **配 sudoers 永远用 `visudo`**：错了它会拒绝保存，不会让你自己关上后门。
- **细粒度 sudo**：`alice ALL=(ALL) NOPASSWD:/usr/bin/systemctl restart nginx`。
- **服务部署**：用 systemd 的 `User=`、`Group=`、`DynamicUser=` 把服务跑在专属用户下。
- **`sudo -k`** 强制下次再要密码（避开 5 分钟缓存）。
- **审计**：`sudoreplay` 可以回放 sudo 会话录像（前提开了 `Defaults log_input,log_output`）。

## 易混点

<Compare
  leftTitle="su"
  rightTitle="sudo"
  left={<>
    **切换**到目标用户的 shell。<br />
    需要目标用户的密码。
  </>}
  right={<>
    以**目标用户身份**执行一条命令。<br />
    需要**自己**的密码 + sudoers 授权。
  </>}
/>

## 延伸阅读

- [文件权限](/ops/beginner/file-permission)
- [SSH](/ops/beginner/ssh)
- [systemd](/ops/beginner/systemd)
