---
layout: post
title: CentOS 7 在新磁盘上配置 LVM
categories: [Linux]
tags: [centos, partition, lvm]
summary: LVM 是 Logical Volume Manager(逻辑卷管理)的简写，本文介绍创建 LVM 的简单过程。
---
## 前言
LVM 是 Logical Volume Manager(逻辑卷管理)的简写，本文介绍创建 LVM 的简单过程。

本例其实是为测试 glusterfs 的，但是官方文档没有使用 lvm，本例记录一下。

### 环境说明
CentOS 7（Minimal Install）

```terminal
$ cat /etc/centos-release
CentOS Linux release 7.6.1810 (Core)
```

本例情况：服务器有两个磁盘 `sda` 和 `sdb`，`sda` 已经安装操作系统(CentOS 7)，本文针对新增的 `sdb` 磁盘进行操作。

本文目的是新增一个 lvm 分区，来单独管理数据。

## 配置

### 查看磁盘信息

首先查看一下磁盘当前的格式化情况

```terminal
sudo fdisk -l /dev/sdb 

Disk /dev/sdb: 8589 MB, 8589934592 bytes, 16777216 sectors
Units = sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
```

也可以使用 `lsblk` 命令查看硬盘情况，更直观一些。

```terminal
$ lsblk
NAME            MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda               8:0    0  128G  0 disk 
├─sda1            8:1    0    1G  0 part /boot
└─sda2            8:2    0  127G  0 part 
  ├─centos-root 253:0    0   50G  0 lvm  /
  ├─centos-swap 253:1    0    2G  0 lvm  [SWAP]
  └─centos-home 253:2    0   75G  0 lvm  /home
sdb               8:16   0    8G  0 disk 
sr0              11:0    1 1024M  0 rom 
```

可以看到 `sdb` 有 8 GB，本次实验针对 `sdb` 进行创建

接下来创建分区，本例只创建一个分区 `sdb1`

```terminal
$ sudo fdisk /dev/sdb 
Welcome to fdisk (util-linux 2.23.2).

Changes will remain in memory only, until you decide to write them.
Be careful before using the write command.

Device does not contain a recognized partition table
Building a new DOS disklabel with disk identifier 0xa6bc9924.

Command (m for help): m # 查看一下命令
Command action
   a   toggle a bootable flag
   b   edit bsd disklabel
   c   toggle the dos compatibility flag
   d   delete a partition
   g   create a new empty GPT partition table
   G   create an IRIX (SGI) partition table
   l   list known partition types
   m   print this menu
   n   add a new partition
   o   create a new empty DOS partition table
   p   print the partition table
   q   quit without saving changes
   s   create a new empty Sun disklabel
   t   change a partition's system id
   u   change display/entry units
   v   verify the partition table
   w   write table to disk and exit
   x   extra functionality (experts only)

Command (m for help): n # n 表示添加新分区
Partition type:
   p   primary (0 primary, 0 extended, 4 free)
   e   extended
Select (default p): # 一个硬盘可以有4个主分区，多个扩展分区，使用默认即可
Using default response p
Partition number (1-4, default 1): # 默认创建第一个主分区，默认即可
First sector (2048-16777215, default 2048): # 第一个主分区的开始扇区，默认即可
Using default value 2048
Last sector, +sectors or +size{K,M,G} (2048-16777215, default 16777215): # 第一个主分区的结束扇区，默认即可
Using default value 16777215
Partition 1 of type Linux and of size 8 GiB is set

Command (m for help): p # 打印一下分区表的信息，确认一下

Disk /dev/sdb: 8589 MB, 8589934592 bytes, 16777216 sectors
Units = sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk label type: dos
Disk identifier: 0xa6bc9924

   Device Boot      Start         End      Blocks   Id  System
/dev/sdb1            2048    16777215     8387584   83  Linux

Command (m for help): w # 将分区表写入磁盘并退出
The partition table has been altered!

Calling ioctl() to re-read partition table.
Syncing disks.
```

至此分区结束，可以再次查看一下

```terminal
$ lsblk
NAME            MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda               8:0    0  128G  0 disk 
├─sda1            8:1    0    1G  0 part /boot
└─sda2            8:2    0  127G  0 part 
  ├─centos-root 253:0    0   50G  0 lvm  /
  ├─centos-swap 253:1    0    2G  0 lvm  [SWAP]
  └─centos-home 253:2    0   75G  0 lvm  /home
sdb               8:16   0    8G  0 disk 
└─sdb1            8:17   0    8G  0 part 
sr0              11:0    1 1024M  0 rom
```

可以看到 `sdb` 磁盘下有了新建的 `sdb1` 分区。

### 创建 PV 物理卷

将新添加的磁盘进行整盘 PV 创建，也可以根据需要将磁盘分区后，选择性进行 PV 创建。本次实验将对整盘进行 PV 创建。

```terminal
sudo pvcreate /dev/sdb1 
  Physical volume "/dev/sdb1" successfully created.
```

查看一下

```terminal
$ sudo pvs
  PV         VG     Fmt  Attr PSize    PFree
  /dev/sda2  centos lvm2 a--  <127.00g 4.00m
  /dev/sdb1         lvm2 ---    8.00g 8.00g
```

这样 PV 创建完成。

### 创建 VG 卷组

卷组是用来管理物理卷的集合，用命令 `vgcreate`

使用如下命令创建 

```terminal
$ sudo vgcreate data /dev/sdb1
  Volume group "data" successfully created
```

创建了 data 卷组

本例中 `lsblk` 可以看到，已经有 vg 卷组了,现在查看会看到增加了 data 卷组

```terminal
$ sudo vgs
  VG     #PV #LV #SN Attr   VSize    VFree 
  centos   1   3   0 wz--n- <127.00g  4.00m
  data     1   0   0 wz--n-   <8.00g <8.00g
```

可以看到 data 生于卷组剩余 8 GB 可以使用，接下来在 data 卷组上创建 LV 逻辑卷。

### 创建 LV 逻辑卷

我们将使用全部的空间 (100%FREE)，卷组名称为 glusterfs。

```terminal
$ sudo lvcreate -l 100%FREE -n glusterfs data
  Logical volume "glusterfs" created.
```

此时再次查看卷组

```terminal
$ sudo vgs
  VG     #PV #LV #SN Attr   VSize    VFree
  centos   1   3   0 wz--n- <127.00g 4.00m
  data     1   1   0 wz--n-   <8.00g    0 
```

可以看到 data 卷组的 VFree 为 0，表示已经全部使用了。

接下来查看一下 LV 逻辑卷

```terminal
$ sudo lvs
  LV        VG     Attr       LSize  Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  home      centos -wi-ao---- 74.99g                                                    
  root      centos -wi-ao---- 50.00g                                                    
  swap      centos -wi-ao----  2.00g                                                    
  glusterfs data   -wi-a----- <8.00g
```

### 创建逻辑卷(LV)的文件系统

创建文件系统，就是要格式化，本例使用 xfs 格式

```terminal
$ sudo mkfs.xfs -i size=512 /dev/mapper/data-glusterfs
```

格式化之后，我们需要创建挂载点文件夹，并将 glusterfs 逻辑卷挂载到挂载点

```terminal
$ sudo mkdir -p /bricks/brick1
$ sudo vi /etc/fstab
```

在文件追加如下

```terminal
/dev/mapper/data-glusterfs /bricks/brick1 xfs defaults 1 2
```

`:wq` 保存退出后，重新挂载

```terminal
$ sudo mount -a && mount
```

可以查看一下，使用 `lsblk` 命令

```terminal
$ lsblk
NAME               MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda                  8:0    0  128G  0 disk 
├─sda1               8:1    0    1G  0 part /boot
└─sda2               8:2    0  127G  0 part 
  ├─centos-root    253:0    0   50G  0 lvm  /
  ├─centos-swap    253:1    0    2G  0 lvm  [SWAP]
  └─centos-home    253:2    0   75G  0 lvm  /home
sdb                  8:16   0    8G  0 disk 
└─sdb1               8:17   0    8G  0 part 
  └─data-glusterfs 253:3    0    8G  0 lvm  /bricks/brick1
sr0                 11:0    1 1024M  0 rom  
```

可以看到 `/bricks/brick1` 已经挂载到了 `data-glusterfs` 逻辑卷上。

至此，lvm 创建完成，挂载完成。

## 结束语

本文创建 lvm 为例，方便以后的管理磁盘，如扩大，缩小等操作。

## 参考资料
[Gluster Quick start guide][1]  
[CentOS 7 环境 LVM 逻辑卷创建与管理][2]  
  
[1]: https://wiki.centos.org/SpecialInterestGroup/Storage/gluster-Quickstart  
[2]: https://www.linuxidc.com/Linux/2018-08/153689.htm  
