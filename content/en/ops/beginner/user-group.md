---
title: "Users, Groups & sudo"
description: "Ops rule #1: every service runs under its own non-privileged user."
icon: users
order: 4
chapter: linux
chapterTitle: "Linux Basics"
chapterOrder: 1
tags: [Users, sudo, Permissions]
---

<KeyIdea>
**In one line**: Linux distinguishes principals via **uid/gid**; **sudo** lets a normal user **temporarily** borrow root privilege for specific actions. **Production services should never run as root directly.**
</KeyIdea>

## What it is

```
/etc/passwd        # username → uid, login shell, home dir
/etc/shadow        # encrypted passwords (root-readable only)
/etc/group         # group name → gid and members
/etc/sudoers       # who can sudo to what
```

Every process is bound to a (uid, gid) pair; users can belong to many supplementary groups.

## Analogy

<Analogy>
**uid** is the employee number; **group** is the department.
**root (uid 0)** is the **CEO** — has access to every room.
**sudo** is "**borrowing the CEO's key for one task**" — return it after, and there's a log.
</Analogy>

## Key concepts

<Terms items={[
  { term: "root", en: "uid 0", def: "Superuser, bypasses permission checks. Use sparingly in prod." },
  { term: "Service user", en: "Service User", def: "Shell typically `/sbin/nologin` — can't log in but can run services (www-data, nginx, postgres)." },
  { term: "Primary group", en: "Primary Group", def: "Default gid at login; new files are owned by this group." },
  { term: "Supplementary groups", en: "Supplementary Groups", def: "List with `groups`. The `docker` group is a common one." },
  { term: "sudo", en: "switch user do", def: "Default target is root; `sudo -u other cmd` switches to any user." },
  { term: "Passwordless sudo", en: "NOPASSWD", def: "`alice ALL=(ALL) NOPASSWD:ALL` — useful for automation but **scope it tightly**." },
]} />

## Common commands

```bash
# Users
useradd -m -s /bin/bash alice    # create user alice
usermod -aG docker alice         # add alice to docker group
passwd alice                     # change password
userdel -r alice                 # delete user with home dir

# Groups
groupadd devs
gpasswd -a alice devs            # add alice to devs

# Switch identity
su - alice                       # full login environment
sudo -i                          # full root environment
sudo cmd                         # single command
sudo -u postgres psql            # run as a specific user

# Current identity
id
whoami
groups
```

## How it works

```mermaid
flowchart LR
    Login[Login / SSH] --> Auth[/etc/shadow PAM]
    Auth -->|success| Sh[shell process - uid=alice]
    Sh -->|sudo cmd| Sudo[sudo validation]
    Sudo -->|reads /etc/sudoers| OK[setuid 0]
    OK --> Cmd[cmd process - uid=root]
    Cmd -->|exit| Sh
```

The full sudo call path is logged (`/var/log/auth.log` / `journalctl -u sudo`).

## Practical notes

- **Never blindly `chmod 4755` a third-party binary** — adding SUID root is like opening a back door.
- **Edit sudoers via `visudo`** — it refuses to save broken syntax, so you don't lock yourself out.
- **Fine-grained sudo**: `alice ALL=(ALL) NOPASSWD:/usr/bin/systemctl restart nginx`.
- **Service deploys**: use systemd's `User=`, `Group=`, or `DynamicUser=` to confine services.
- **`sudo -k`** forces re-prompt (bypasses the 5-min cache).
- **Audit**: `sudoreplay` can replay a sudo session recording — requires `Defaults log_input,log_output`.

## Easy confusions

<Compare
  leftTitle="su"
  rightTitle="sudo"
  left={<>
    **Switches to** target user's shell.<br />
    Requires the target's password.
  </>}
  right={<>
    Executes one command **as** the target.<br />
    Requires **your** password + sudoers permission.
  </>}
/>

## Further reading

- [File permissions](/ops/beginner/file-permission)
- [SSH](/ops/beginner/ssh)
- [systemd](/ops/beginner/systemd)
