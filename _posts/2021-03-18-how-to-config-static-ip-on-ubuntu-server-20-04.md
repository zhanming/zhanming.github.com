---
layout: post
title: Ubuntu Server 20.04 上设置静态 IP 地址 
categories: [Linux]
tags: [ubuntu, netplan]
summary: Ubuntu Server 20.04 上设置静态 IP 地址，记录一下配置的步骤。
---
## 前言
Ubuntu Server 20.04 上设置静态 IP 地址，记录一下配置的步骤。

### 环境说明
Ubuntu Server 20.04

```terminal
$ cat /etc/issue
Ubuntu 20.04.2 LTS \n \l
```

## 配置

Ubuntu Server 20.04 配置网络，默认使用 netplan 方式进行设置。

netplan 方式的配置为 yaml 格式

```terminal
$ sudo vi /etc/netplan/00-installer-config.yaml
```

插入如下设置

```terminal
# This file describes the network interfaces available on your system
# For more information, see netplan(5).
network:
  version: 2
  renderer: networkd
  ethernets:
    eno1:
     dhcp4: no
     addresses: [192.168.1.2/24]
     gateway4: 192.168.1.1
     nameservers:
       addresses: [114.114.114.114]
```

之后 `:wq`  保存并退出

启动服务

```terminal
$ sudo netplan apply
```

查看网络服务的状态

```terminal
$ networkctl status
```

## 测试

使用 ping 命令。

先 ping 内网的网关，确认内网是否通

```terminal
$ ping 192.168.1.1
```

再 ping 一下外网的 IP ，确认是否可以访问外网。

```terminal
$ ping 114.114.114.114
```

## 结束语

本例演示 Ubuntu Server 20.04 配置静态 IP 地址。

## 参考资料
[Ubuntu 20.04修改ip地址][1]    

[1]: https://blog.csdn.net/fansnn/article/details/105930009