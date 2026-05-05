---
title: "Disks, Filesystems & Mounts"
description: "df, du, mount, fstab — minimum knowledge to inspect disks and add partitions."
icon: hard-drive
order: 5
chapter: linux
chapterTitle: "Linux Basics"
chapterOrder: 1
tags: [Disk, Filesystem, Mount]
---

<KeyIdea>
**In one line**: Linux has no drive letters — every storage device is **mounted under `/`** at some directory. To use a new disk, you **partition it → create a filesystem → mount it**.
</KeyIdea>

## What it is

```
disk → partition → filesystem → mount point
/dev/nvme0n1
  └ /dev/nvme0n1p1  (EFI)
  └ /dev/nvme0n1p2  (ext4 → /)
  └ /dev/nvme0n1p3  (ext4 → /var)

Adding /dev/sdb:
  parted /dev/sdb mklabel gpt mkpart primary 0% 100%
  mkfs.ext4 /dev/sdb1
  mount /dev/sdb1 /mnt/data
```

## Analogy

<Analogy>
A disk is a **warehouse**: first **wall it off into rooms** (partitions), then **install a shelving system** in each (filesystem), finally **nail a sign on the door** (mount it under `/var/data`).
</Analogy>

## Key concepts

<Terms items={[
  { term: "Block device", en: "Block Device", def: "/dev/sda, /dev/nvme0n1, etc. Visualize with lsblk." },
  { term: "Partition table", en: "MBR / GPT", def: "GPT is the modern standard — supports >2 T and unlimited partitions." },
  { term: "Filesystem", en: "FS", def: "ext4 (default, stable), xfs (large volumes), btrfs / zfs (snapshots), tmpfs (RAM)." },
  { term: "Inode", en: "Inode", def: "File metadata + pointers to data blocks. Run out of inodes and you can't create files even with free space." },
  { term: "Mount point", en: "Mount Point", def: "A directory; once mounted, accessing the directory accesses the device." },
  { term: "fstab", en: "/etc/fstab", def: "Mounts to apply at boot." },
  { term: "LVM", en: "Logical Volume Manager", def: "Adds an abstraction layer above partitions for easy resize / snapshots." },
]} />

## Common commands

```bash
# View
lsblk -f                    # tree of disks + filesystems + mounts
df -hT                      # mounted partitions, free space, type
du -sh /var/log/*           # directory usage
ncdu /                      # interactive disk usage

# Operate
mount /dev/sdb1 /mnt/data
umount /mnt/data
mount -o remount,ro /        # remount read-only

# New disk from scratch
sudo mkfs.ext4 -L data /dev/sdb1
sudo mkdir /data
echo 'LABEL=data /data ext4 defaults,noatime 0 2' | sudo tee -a /etc/fstab
sudo mount -a
```

## How it works

```mermaid
flowchart LR
    App[App read/write] --> VFS[VFS layer]
    VFS --> FS["Filesystem ext4 / xfs / ..."]
    FS --> Block[Block layer + I/O scheduler]
    Block --> Drv[Driver NVMe/SCSI]
    Drv --> Disk[Physical disk]
```

VFS exposes a uniform interface; apps don't see what FS is underneath.

## Practical notes

- **Use `UUID=` or `LABEL=`** in `/etc/fstab` — never `/dev/sdb1` (device names can change on reboot).
- **`noatime`** disables last-access timestamps — **saves a write**, friendly to SSDs.
- **Disk full? Check inodes too**: `df -i` shows inode usage.
- **Swap**: paging file when RAM is exhausted. Cloud VMs often ship without swap; add a swapfile:

  ```bash
  fallocate -l 4G /swapfile && chmod 600 /swapfile
  mkswap /swapfile && swapon /swapfile
  ```

- **`du -sh dir/* | sort -h`** to find the biggest directories.
- **Emergency cleanup**: clear old `/var/log/*.log` and `/var/cache`, then `journalctl --vacuum-size=200M`.
- **Big file deleted, disk still full?** A process still holds an fd. `lsof | grep deleted` then restart it.

## Easy confusions

<Compare
  leftTitle="df"
  rightTitle="du"
  left={<>
    Reports free space at the **filesystem level**.<br />
    Instant.
  </>}
  right={<>
    Recursively sums **file sizes**.<br />
    Slower but tells you **who's using the space**.
  </>}
/>

## Further reading

- [Linux speedrun](/ops/beginner/linux-quickstart)
- [Log system](/ops/beginner/log-system)
- [Backup & restore](/ops/advanced/backup-restore)
