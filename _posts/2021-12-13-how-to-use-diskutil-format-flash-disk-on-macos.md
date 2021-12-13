---
layout: post
title: macOS 使用 diskutil 命令格式化 U 盘 
categories: [macOS]
tags: [macOS, diskutil]
summary: macOS 使用 diskutil 命令格式化 U 盘，记录一下操作步骤。
---
## 前言
macOS 使用 diskutil 命令格式化 U 盘，记录一下操作步骤。

### 环境说明
macOS

```terminal
% sw_vers
ProductName:	macOS
ProductVersion:	12.0.1
BuildVersion:	21A55
```

diskutil 命令如下

```bash
% diskutil
Disk Utility Tool
Utility to manage local disks and volumes
Most commands require an administrator or root user

WARNING: Most destructive operations are not prompted

Usage:  diskutil [quiet] <verb> <options>, where <verb> is as follows:

     list                 (List the partitions of a disk)
     info[rmation]        (Get information on a specific disk or partition)
     listFilesystems      (List file systems available for formatting)
     listClients          (List all current disk management clients)
     activity             (Continuous log of system-wide disk arbitration)

     u[n]mount            (Unmount a single volume)
     unmountDisk          (Unmount an entire disk (all volumes))
     eject                (Eject a disk)
     mount                (Mount a single volume)
     mountDisk            (Mount an entire disk (all mountable volumes))

     enableJournal        (Enable HFS+ journaling on a mounted HFS+ volume)
     disableJournal       (Disable HFS+ journaling on a mounted HFS+ volume)
     moveJournal          (Move the HFS+ journal onto another volume)
     enableOwnership      (Exact on-disk User/Group IDs on a mounted volume)
     disableOwnership     (Ignore on-disk User/Group IDs on a mounted volume)

     rename[Volume]       (Rename a volume)

     verifyVolume         (Verify the file system data structures of a volume)
     repairVolume         (Repair the file system data structures of a volume)
     verifyDisk           (Verify the components of a partition map of a disk)
     repairDisk           (Repair the components of a partition map of a disk)
     resetFusion          (Reset the components of a machine's Fusion Drive)

     eraseDisk            (Erase an existing disk, removing all volumes)
     eraseVolume          (Erase an existing volume)
     reformat             (Erase an existing volume with same name and type)
     eraseOptical         (Erase optical media (CD/RW, DVD/RW, etc.))
     zeroDisk             (Erase a disk, writing zeros to the media)
     randomDisk           (Erase a disk, writing random data to the media)
     secureErase          (Securely erase a disk or freespace on a volume)

     partitionDisk        ((re)Partition a disk, removing all volumes)
     addPartition         (Create a new partition to occupy free space)
     splitPartition       (Split an existing partition into two or more)
     mergePartitions      (Combine two or more existing partitions into one)
     resizeVolume         (Resize a volume, increasing or decreasing its size)

     appleRAID <verb>     (Perform additional verbs related to AppleRAID)
     coreStorage <verb>   (Perform additional verbs related to CoreStorage)
     apfs <verb>          (Perform additional verbs related to APFS)

diskutil <verb> with no options will provide help on that verb
```

diskutil 命令可以进行很多磁盘操作，本例只为格式化 U 盘。

## 步骤

### 查看

先插入 U 盘，使用 list 子命令查看一下是 disk 号

```terminal
% diskutil list
/dev/disk0 (internal, physical):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      GUID_partition_scheme                        *1.0 TB     disk0
   1:                        EFI EFI                     314.6 MB   disk0s1
   2:                 Apple_APFS Container disk1         1.0 TB     disk0s2

/dev/disk1 (synthesized):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      APFS Container Scheme -                      +1.0 TB     disk1
                                 Physical Store disk0s2
   1:                APFS Volume Macintosh HD - Data     617.4 GB   disk1s1
   2:                APFS Volume Preboot                 534.6 MB   disk1s2
   3:                APFS Volume Recovery                1.1 GB     disk1s3
   4:                APFS Volume VM                      20.5 KB    disk1s4
   5:                APFS Volume Macintosh HD            15.7 GB    disk1s5
   6:              APFS Snapshot com.apple.os.update-... 15.7 GB    disk1s5s1

/dev/disk2 (external, physical):
   #:                       TYPE NAME                    SIZE       IDENTIFIER
   0:      GUID_partition_scheme                        *16.0 GB    disk2
   1:       Microsoft Basic Data                         217.1 KB   disk2s1
   2:                        EFI NO NAME                 2.9 MB     disk2s2
   3:                  Apple_HFS PVE                     1.0 GB     disk2s3
   4:       Microsoft Basic Data                         307.2 KB   disk2s4
```

可以看到， `/dev/disk2` 这个 U 盘的大小为 `16 GiB`，本例就已格式化 `/dev/disk2` 为例。

### 取消 U 盘挂载

使用 umountDisk 子命令

```terminal
% sudo diskutil umountDisk /dev/disk2
Unmount of all volumes on disk2 was successful
```

### 覆盖所有扇区

使用 zeroDisk 子命令

```terminal
% sudo diskutil zeroDisk /dev/disk2
Started erase on disk2
#此处会有进度条
Finished erase on disk2
```

### 格式化 U 盘

使用 eraseDisk 子命令，注意，本例将 U 盘格式化为 `ExFAT` 格式，并且将名字设置为 `Extreme` 

```terminal
% sudo diskutil eraseDisk ExFAT Extreme /dev/disk2
Password:
Started erase on disk2
Unmounting disk
Creating the partition map
Waiting for partitions to activate
Formatting disk2s2 as ExFAT with name Extreme
Volume name      : Extreme
Partition offset : 411648 sectors (210763776 bytes)
Volume size      : 30865408 sectors (15803088896 bytes)
Bytes per sector : 512
Bytes per cluster: 32768
FAT offset       : 2048 sectors (1048576 bytes)
# FAT sectors    : 4096
Number of FATs   : 1
Cluster offset   : 6144 sectors (3145728 bytes)
# Clusters       : 482176
Volume Serial #  : 61b6d68b
Bitmap start     : 2
Bitmap file size : 60272
Upcase start     : 4
Upcase file size : 5836
Root start       : 5
Mounting disk
Finished erase on disk2
```

这样完成格式化 U 盘了。

## 参考资料

[Mac 使用终端彻底格式化U盘][1]  

[1]: https://blog.csdn.net/chenhao_c_h/article/details/102552874