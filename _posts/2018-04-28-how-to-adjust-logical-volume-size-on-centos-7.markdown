---
layout: post
title: CentOS 7 调整逻辑卷大小 
categories: [Linux]
tags: [centos, lvm]
summary: CentOS 7 安装之后，默认使用 LVM （逻辑卷管理）管理磁盘，默认的 home 逻辑卷很大，但是 root 逻辑卷相对较小，有时需要调整一下分区，将 home 逻辑卷的空间挪一部分到 root 逻辑卷，由于使用 LVM，使调整变得非常简单。
---
## 前言
CentOS 7 安装之后，默认使用 LVM （逻辑卷管理）管理磁盘，默认的 home 逻辑卷很大，但是 root 逻辑卷相对较小，有时需要调整一下分区，将 home 逻辑卷的空间挪一部分到 root 逻辑卷，由于使用 LVM，使调整变得非常简单。

### 环境说明
CentOS 7（Minimal Install）

```terminal
# cat /etc/redhat-release 
CentOS Linux release 7.4.1708 (Core) 
```

本例服务器用户如下

| User     | Home         | Descprition   |
|----------|--------------|---------------|
| root     | /root        | root 用户目录  |
| admin    | /home/admin  | admin 用户目录 |

## 调整逻辑卷

### 查看逻辑卷大小
调整需要先 umount home 分区，所以需要使用 root 用户登录

```terminal
# df -h
Filesystem           Size  Used Avail Use% Mounted on
/dev/mapper/cl-root   50G  1.3G   49G   3% /
devtmpfs             486M     0  486M   0% /dev
tmpfs                497M     0  497M   0% /dev/shm
tmpfs                497M  6.6M  490M   2% /run
tmpfs                497M     0  497M   0% /sys/fs/cgroup
/dev/mapper/cl-home   75G   33M   75G   1% /home
/dev/sda1           1014M  211M  804M  21% /boot
tmpfs                100M     0  100M   0% /run/user/0
```

可以看到 root 逻辑卷（`cl-root`）的大小是 50G，home 逻辑卷（`cl-root`）的大小是 75G。

### 备份 /home 下的文件
```terminal
# cd ~
# cp -r /home ~/homebak
```

### 卸载 /home

```terminal
# umount /home
```

> **`注意`**
>
> 如果出现 home 存在进程，则需要先终止 home 下的进程，再卸载 /home

```terminal
# umount /home
mount: /home: target is busy.
        (In some cases useful info about processes that use
         the device is found by lsof(8) or fuser(1))
```

可以使用 lsof 或 fuser 命令查看，并终止进程，本例使用 fuser 命令。

CentOS 7（Minimal Install）默认没有安装 fuser 命令，需要安装一下。

```terminal
# yum install psmisc
# fuser -mvik /home/
                     USER        PID ACCESS COMMAND
/home:               root     kernel mount /home
                     root       1072 ..c.. bash
Kill process 1072 ? (y/N) y
# umount /home
```

此时再查看 `cl-home` 已经卸下了

```terminal
# df -h
Filesystem           Size  Used Avail Use% Mounted on
/dev/mapper/cl-root   50G  1.3G   49G   3% /
devtmpfs             486M     0  486M   0% /dev
tmpfs                497M     0  497M   0% /dev/shm
tmpfs                497M  6.6M  490M   2% /run
tmpfs                497M     0  497M   0% /sys/fs/cgroup
/dev/sda1           1014M  211M  804M  21% /boot
tmpfs                100M     0  100M   0% /run/user/0
```

### 删除 home 的逻辑卷

```terminal
# lvremove /dev/mapper/cl-home 
Do you really want to remove active logical volume cl/home? [y/n]: y
  Logical volume "home" successfully removed
```

### 增加 root 逻辑卷的大小
扩展 root 所在的逻辑卷，本例中 home 逻辑卷大小有 75G，本例移动 40G 到 root 逻辑卷。

```terminal
# lvextend -L +40G /dev/mapper/cl-root 
  Size of logical volume cl/root changed from 50.00 GiB (12800 extents) to 90.00 GiB (23040 extents).
  Logical volume cl/root successfully resized.
```

可以看到 root 逻辑卷大小有 50G 增加到 90G。

之后需要扩展 /root 文件系统:

```terminal
# xfs_growfs /dev/mapper/cl-root 
meta-data=/dev/mapper/cl-root    isize=512    agcount=4, agsize=3276800 blks
         =                       sectsz=512   attr=2, projid32bit=1
         =                       crc=1        finobt=0 spinodes=0
data     =                       bsize=4096   blocks=13107200, imaxpct=25
         =                       sunit=0      swidth=0 blks
naming   =version 2              bsize=4096   ascii-ci=0 ftype=1
log      =internal               bsize=4096   blocks=6400, version=2
         =                       sectsz=512   sunit=0 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
data blocks changed from 13107200 to 23592960
```

### 重建 home 的逻辑卷

`75 - 40 = 35`, 还有 35G 可用，全部用于 home 逻辑卷。

```terminal
# lvcreate -L 35G -n home cl
  Volume group "cl" has insufficient free space (8959 extents): 8960 required.
```

具体可能发现会差一点，如上显示：只有 8959，不够 8960。

剩余可以具体查看一下

```terminal
# vgdisplay
  --- Volume group ---
  VG Name               cl
  System ID             
  Format                lvm2
  Metadata Areas        1
  Metadata Sequence No  6
  VG Access             read/write
  VG Status             resizable
  MAX LV                0
  Cur LV                2
  Open LV               2
  Max PV                0
  Cur PV                1
  Act PV                1
  VG Size               <127.00 GiB
  PE Size               4.00 MiB
  Total PE              32511
  Alloc PE / Size       23552 / 92.00 GiB
  Free  PE / Size       8959 / <35.00 GiB
  VG UUID               6Rgcnh-0WVI-eyLd-clZ8-fkWA-qYe1-CW3QbJ
```

可以看到 `Free PE` 是可用的大小，算起来比较费劲，如果真要算：`8959 * 4 = 35836M`。

可以使用 `百分比` 设置全部使用

```terminal
# lvcreate -l 100%FREE -n home cl
  Logical volume "home" created.
```

之后创建文件系统
```terminal
# mkfs.xfs /dev/mapper/cl-home 
meta-data=/dev/mapper/cl-home    isize=512    agcount=4, agsize=2293504 blks
         =                       sectsz=512   attr=2, projid32bit=1
         =                       crc=1        finobt=0, sparse=0
data     =                       bsize=4096   blocks=9174016, imaxpct=25
         =                       sunit=0      swidth=0 blks
naming   =version 2              bsize=4096   ascii-ci=0 ftype=1
log      =internal log           bsize=4096   blocks=4479, version=2
         =                       sectsz=512   sunit=0 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
```

挂载 /home

```terminal
# mount /dev/mapper/cl-home /home
```

此时 /home 文件夹下是空的

### 恢复 home 下的文件

将开始备份的 `~/homebak` 下的文件恢复

```terminal
# mv ~/homebak/admin/ /home/
```

设置权限

> **`注意`**
>
> 请根据实际情况设置

```terminal
chown -R admin:admin /home/admin/
# ll /home/
total 0
drwx------. 2 admin admin 62 Apr 28 09:13 admin
``` 
此时权限设置完毕，admin 可以登录了。

### 查看最终结果

```terminal
# df -h
Filesystem           Size  Used Avail Use% Mounted on
/dev/mapper/cl-root   90G  1.3G   89G   2% /
devtmpfs             486M     0  486M   0% /dev
tmpfs                497M     0  497M   0% /dev/shm
tmpfs                497M  6.6M  490M   2% /run
tmpfs                497M     0  497M   0% /sys/fs/cgroup
/dev/sda1           1014M  211M  804M  21% /boot
tmpfs                100M     0  100M   0% /run/user/0
/dev/mapper/cl-home   35G   33M   35G   1% /home
```

## 参考资料
[centos7重新调整分区大小][1]  
[Linux : fuser command not found on CentOS/RHEL 7][2]  
 
[1]: https://blog.csdn.net/perfectzq/article/details/73606119
[2]: http://www.itechlounge.net/2016/11/linux-fuser-command-not-found-on-centos-rhel-7/
