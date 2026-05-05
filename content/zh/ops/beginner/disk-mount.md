---
title: "磁盘、文件系统与挂载"
description: "df、du、mount、fstab —— 看磁盘和挂分区的最少必要知识。"
icon: hard-drive
order: 5
chapter: linux
chapterTitle: "Linux 基础"
chapterOrder: 1
tags: [磁盘, 文件系统, 挂载]
---

<KeyIdea>
**一句话**：Linux 不分盘符 —— 所有存储都**挂载到根 `/` 之下的某个目录**。一块硬盘要先**分区 → 创建文件系统 → 挂载**才能用。
</KeyIdea>

## 是什么

```
磁盘 → 分区 → 文件系统 → 挂载点
/dev/nvme0n1
  └ /dev/nvme0n1p1  (EFI)
  └ /dev/nvme0n1p2  (ext4 → /)
  └ /dev/nvme0n1p3  (ext4 → /var)

新加一块盘 /dev/sdb：
  parted /dev/sdb mklabel gpt mkpart primary 0% 100%
  mkfs.ext4 /dev/sdb1
  mount /dev/sdb1 /mnt/data
```

## 打个比方

<Analogy>
磁盘像**仓库**：先把仓库**用墙隔成几个房间**（分区），每个房间**装上书架体系**（文件系统），最后给房间**钉上路牌**（挂载到 `/var/data`）。
</Analogy>

## 关键概念

<Terms items={[
  { term: "块设备", en: "Block Device", def: "/dev/sda /dev/nvme0n1 等。lsblk 可视化。" },
  { term: "分区表", en: "MBR / GPT", def: "GPT 是现代标准，支持 >2T 和无限分区。" },
  { term: "文件系统", en: "FS", def: "ext4（默认稳定）、xfs（大容量）、btrfs / zfs（快照），tmpfs（内存）。" },
  { term: "Inode", en: "索引节点", def: "存文件元数据 + 指向数据块。inode 用尽即使空间没满也不能新建。" },
  { term: "挂载点", en: "Mount Point", def: "目录，挂上之后访问该目录就是访问设备。" },
  { term: "fstab", en: "/etc/fstab", def: "开机自动挂载表。" },
  { term: "LVM", en: "逻辑卷管理", def: "在分区之上再抽象一层，方便扩容 / 快照。" },
]} />

## 常用命令

```bash
# 看
lsblk -f                    # 树状看磁盘 + 文件系统 + 挂载
df -hT                      # 已挂载分区的剩余空间和类型
du -sh /var/log/*           # 看某目录占用
ncdu /                      # 交互式磁盘占用

# 操作
mount /dev/sdb1 /mnt/data
umount /mnt/data
mount -o remount,ro /        # 改成只读挂载

# 新盘从零开始
sudo mkfs.ext4 -L data /dev/sdb1
sudo mkdir /data
echo 'LABEL=data /data ext4 defaults,noatime 0 2' | sudo tee -a /etc/fstab
sudo mount -a
```

## 怎么工作

```mermaid
flowchart LR
    App[应用 read/write] --> VFS[VFS 层]
    VFS --> FS["文件系统 ext4 / xfs / ..."]
    FS --> Block[块层 + IO 调度]
    Block --> Drv[驱动 NVMe/SCSI]
    Drv --> Disk[物理磁盘]
```

VFS 让应用看到统一接口；底层换什么文件系统都不感知。

## 实操要点

- **`fstab` 用 `UUID=` 或 `LABEL=`**，不要写 `/dev/sdb1` —— 设备名重启可能变。
- **`noatime`** 选项：禁用最后访问时间，**省一次写**，对 SSD 友好。
- **磁盘满了别只看 df**：`df -i` 看 inode 是不是也满了。
- **swap**：内存不够时换页到磁盘。云主机一般默认无 swap，可以用 swapfile 加：

  ```bash
  fallocate -l 4G /swapfile && chmod 600 /swapfile
  mkswap /swapfile && swapon /swapfile
  ```

- **`du -sh dir/* | sort -h`** 找占空间的目录。
- **磁盘满应急**：先清 `/var/log/*.log` 旧日志和 `/var/cache`，然后看 `journalctl --vacuum-size=200M`。
- **大文件被删但磁盘没释放**：进程还持有该文件 fd。`lsof | grep deleted` 找出来重启进程。

## 易混点

<Compare
  leftTitle="df"
  rightTitle="du"
  left={<>
    从**文件系统层**看可用空间。<br />
    瞬时、近实时。
  </>}
  right={<>
    递归累加**文件大小**。<br />
    慢，但精确知道**谁占的**。
  </>}
/>

## 延伸阅读

- [Linux 速通](/ops/beginner/linux-quickstart)
- [日志系统](/ops/beginner/log-system)
- [备份与恢复](/ops/advanced/backup-restore)
