---
layout: post
title: CentOS 7 下 yum 安装和配置 NFS 
categories: [Linux]
tags: [centos, nfs]
summary: NFS 是 Network File System 的缩写，即网络文件系统。功能是让客户端通过网络访问不同主机上磁盘里的数据，主要用在类Unix系统上实现文件共享的一种方法。 本例演示 CentOS 7 下安装和配置 NFS 的基本步骤。
---
## 前言
NFS 是 Network File System 的缩写，即网络文件系统。功能是让客户端通过网络访问不同主机上磁盘里的数据，主要用在类Unix系统上实现文件共享的一种方法。 本例演示 CentOS 7 下安装和配置 NFS 的基本步骤。

### 环境说明
CentOS 7（Minimal Install）

```terminal
$ cat /etc/redhat-release 
CentOS Linux release 7.5.1804 (Core) 
```

本例演示环境如下

| Name     | IP Addr        | Descprition   |
|----------|----------------|---------------|
| Server   | 192.169.0.101  | 服务端 IP      |
| Client   | 192.168.0.100  | 客户端 IP      |

根据官网说明 [Chapter 8. Network File System (NFS) - Red Hat Customer Portal][2]，CentOS 7.4 以后，支持 NFS v4.2 不需要 rpcbind 了，但是如果客户端只支持 NFC v3 则需要 rpcbind 这个服务。

## 服务端

### 步骤 1: 服务端安装
使用 yum 安装 NFS 安装包。

```terminal
$ sudo yum install nfs-utils
```
> **`注意`**  
>
> 只安装 nfs-utils 即可，rpcbind 属于它的依赖，也会安装上。 

### 步骤 2: 服务端配置

设置 NFS 服务开机启动

```terminal
$ sudo systemctl enable rpcbind
$ sudo systemctl enable nfs
```

启动 NFS 服务

```terminal
$ sudo systemctl start rpcbind
$ sudo systemctl start nfs
```

防火墙需要打开 rpc-bind 和 nfs 的服务

```terminal
$ sudo firewall-cmd --zone=public --permanent --add-service=rpc-bind
success
$ sudo firewall-cmd --zone=public --permanent --add-service=mountd
success
$ sudo firewall-cmd --zone=public --permanent --add-service=nfs
success
$ sudo firewall-cmd --reload
success
```
### 步骤 3: 配置共享目录

服务启动之后，我们在服务端配置一个共享目录

```terminal
$ sudo mkdir /data
$ sudo chmod 755 /data
```

根据这个目录，相应配置导出目录

```terminal
$ sudo vi /etc/exports
```

添加如下配置

```terminal
/data/     192.168.0.0/24(rw,sync,no_root_squash,no_all_squash)
```

1. `/data`: 共享目录位置。
2. `192.168.0.0/24`: 客户端 IP 范围，`*` 代表所有，即没有限制。
3. `rw`: 权限设置，可读可写。
4. `sync`: 同步共享目录。
5. `no_root_squash`: 可以使用 root 授权。
6. `no_all_squash`: 可以使用普通用户授权。

`:wq` 保存设置之后，重启 NFS 服务。

```terminal
$ sudo systemctl restart nfs
```

可以检查一下本地的共享目录

```terminal
$ showmount -e localhost
Export list for localhost:
/data 192.168.0.0/24
```

这样，服务端就配置好了，接下来配置客户端，连接服务端，使用共享目录。

## 客户端

### 步骤 1: 客户端安装

与服务端类似

```terminal
$ sudo yum install nfs-utils
```

### 步骤 2: 客户端配置

设置 rpcbind 服务的开机启动

```terminal
$ sudo systemctl enable rpcbind
```

启动 NFS 服务

```terminal
$ sudo systemctl start rpcbind
```

> **`注意`**  
>
> 客户端不需要打开防火墙，因为客户端时发出请求方，网络能连接到服务端即可。   
> 客户端也不需要开启 NFS 服务，因为不共享目录。
  

### 步骤 3: 客户端连接 NFS

先查服务端的共享目录

```terminal
$ showmount -e 192.168.0.101
Export list for 192.168.0.101:
/data 192.168.0.0/24
```

在客户端创建目录

```terminal
$ sudo mkdir /data
```

挂载

```terminal
$ sudo mount -t nfs 192.168.0.101:/data /data
```

挂载之后，可以使用 `mount` 命令查看一下

```terminal
$ mount
...
...
192.168.0.101:/data on /data type nfs4 (rw,relatime,sync,vers=4.1,rsize=131072,wsize=131072,namlen=255,hard,proto=tcp,port=0,timeo=600,retrans=2,sec=sys,clientaddr=192.168.0.100,local_lock=none,addr=192.168.0.101)
```

这说明已经挂载成功了。

### 步骤 5: 测试 NFS

测试一下，在客户端向共享目录创建一个文件

```terminal
$ cd /data
$ sudo touch a
```

之后取 NFS 服务端 `192.168.0.101` 查看一下

```terminal
$ cd /data
$ ll
total 0
-rw-r--r--. 1 root root 0 Aug  8 18:46 a
```

可以看到，共享目录已经写入了。

### 步骤 6: 客户端自动挂载

自动挂载很常用，客户端设置一下即可。

```terminal
$ sudo vi /etc/fstab
```

在结尾添加类似如下配置

```terminal

#
# /etc/fstab
# Created by anaconda on Thu May 25 13:11:52 2017
#
# Accessible filesystems, by reference, are maintained under '/dev/disk'
# See man pages fstab(5), findfs(8), mount(8) and/or blkid(8) for more info
#
/dev/mapper/cl-root     /                       xfs     defaults        0 0
UUID=414ee961-c1cb-4715-b321-241dbe2e9a32 /boot                   xfs     defaults        0 0
/dev/mapper/cl-home     /home                   xfs     defaults        0 0
/dev/mapper/cl-swap     swap                    swap    defaults        0 0
192.168.0.101:/data      /data                   nfs     defaults        0 0

```

由于修改了 `/etc/fstab`，需要重新加载 `systemctl`。

```terminal
$ sudo systemctl daemon-reload
```

之后查看一下

```terminal
$ mount
...
...
192.168.0.101:/data on /data type nfs4 (rw,relatime,vers=4.1,rsize=131072,wsize=131072,namlen=255,hard,proto=tcp,port=0,timeo=600,retrans=2,sec=sys,clientaddr=192.168.0.100,local_lock=none,addr=192.168.0.101)
```

此时已经启动好了。如果实在不放心，可以重启一下客户端的操作系统，之后再查看一下。

## 结论
本文演示了 CentOS 7 下 yum 安装和配置 NFS，以及服务端和客户端的配置。

## 参考资料
[Setting Up NFS Server And Client On CentOS 7][1]  
[Chapter 8. Network File System (NFS) - Red Hat Customer Portal][2]  

 
[1]: https://www.unixmen.com/setting-nfs-server-client-centos-7/  
[2]: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/storage_administration_guide/ch-nfs
