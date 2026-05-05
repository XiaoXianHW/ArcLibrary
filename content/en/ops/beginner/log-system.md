---
title: "Logs (journalctl & logrotate)"
description: "Where Linux logs hide, how to read them, how to rotate them — your first stop for triage."
icon: scroll-text
order: 2
chapter: shell
chapterTitle: "Shell & Troubleshooting"
chapterOrder: 2
tags: [Logs, journalctl, logrotate]
---

<KeyIdea>
**In one line**: modern Linux service logs default to **systemd-journal** (structured, indexed); legacy `/var/log/*.log` files still exist. **`journalctl -u service -f`** for live tail, **logrotate** to keep logs from filling the disk.
</KeyIdea>

## What it is

```
/var/log/syslog           # legacy system log (Debian / Ubuntu)
/var/log/messages         # same on RHEL family
/var/log/auth.log         # login / sudo
/var/log/nginx/           # app-managed directory
journalctl -u nginx       # the same service log via systemd
```

systemd-journal stores logs **structured** (with unit / pid / boot id) — many distros still forward to syslog for **dual storage**.

## Analogy

<Analogy>
Old logs = **a stack of handwritten diaries**, archived by month.
journal = **an indexed digital filing cabinet** — query by service, time, priority, or any field.
</Analogy>

## Key concepts

<Terms items={[
  { term: "Unit", en: "Service unit", def: "A service from systemd's view; corresponds to one log stream in journal." },
  { term: "Priority", en: "Priority", def: "0 emerg → 7 debug. `-p err` shows errors and above." },
  { term: "Boot ID", en: "Boot ID", def: "`-b` shows current boot; `-b -1` previous boot (handy for 'why did it reboot')." },
  { term: "logrotate", en: "Log rotation", def: "Splits, compresses, and deletes old logs. Configs in `/etc/logrotate.d/*`." },
  { term: "Structured fields", en: "Structured Fields", def: "`journalctl -o json`; filter by `_PID=` `_HOSTNAME=` etc." },
]} />

## Common commands

```bash
# journalctl
journalctl -u nginx -f                   # follow
journalctl -u nginx --since "10 min ago"
journalctl -u nginx --since today
journalctl -u nginx -p err               # error and above
journalctl -k                            # kernel
journalctl --disk-usage                  # journal disk use
journalctl --vacuum-time=7d              # keep last 7 days
journalctl --vacuum-size=500M

# Legacy / app-written
tail -f /var/log/nginx/error.log
zcat /var/log/nginx/access.log.2.gz | grep '500 '
less /var/log/auth.log

# logrotate
logrotate -d /etc/logrotate.conf         # dry-run
logrotate -f /etc/logrotate.d/nginx      # force rotation
```

## How it works

```mermaid
flowchart LR
    Svc[Service stdout/stderr] --> JD[systemd-journald]
    JD --> JF[/var/log/journal/]
    JD -.-> SL[syslog forwarder]
    SL --> File[/var/log/...]
    LR[logrotate cron] --> File
    LR -->|gzip + rename| Old[*.log.1.gz]
```

The journal has its own space cap (`SystemMaxUse`, default 10 % of disk) — no logrotate needed for it.

## Practical notes

- **Services should log to stdout/stderr** — systemd collects → journal. **Don't write your own /var/log file** (same rule for containers).
- **journal eating disk?** `journalctl --vacuum-size=500M` immediately, or set `SystemMaxUse=` in `/etc/systemd/journald.conf`.
- **logrotate sample**:

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

- **Production pattern**: app → stdout → journal → forward to central ELK / Loki; don't keep too much locally.
- **Beyond grep**: `rg` is faster; `lnav` is great for multi-log visualization.

## Easy confusions

<Compare
  leftTitle="journal"
  rightTitle="syslog / file logs"
  left={<>
    Structured, query by unit / priority.<br />
    Auto-rotates with a size cap.
  </>}
  right={<>
    Plain text, needs logrotate.<br />
    Friendly to legacy tooling.
  </>}
/>

## Further reading

- [systemd](/ops/beginner/systemd)
- [Backup & restore](/ops/advanced/backup-restore)
- [Loki](/ops/ecosystem/loki)
