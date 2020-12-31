---
layout: post
title: CentOS 8 配置 VNC Server 
categories: [Linux]
tags: [centos, vnc]
summary: CentOS 8 配置 VNC Server， 使用户可以远程访问，本例介绍安装和配置流程。
---
## 前言
CentOS 8 配置 VNC Server， 使用户可以远程访问，本例介绍安装和配置流程。

### 环境说明
CentOS 8（Desktop Install）

因为使用图形用户界面，本例使用 GNOME 桌面环境。

```terminal
$ cat /etc/centos-release 
CentOS Linux release 8.3.2011 
```

本例中 Linux（CentOS 8) 系统用户有两个 root 和 admin，VNC Viewer 使用 admin 进行访问。 
## 安装

### 安装桌面环境
如果没有安装 Desktop 版本，需要先安装 X Windows。

> **`注意`**
>
> 安装桌面环境，未测试。
> 

```terminal
$ sudo dnf groupinstall "workstation"
$ sudo dnf groupinstall "Server with GUI"
```
设置默认启动图形界面

```terminal
$ sudo systemctl set-default graphical
```

重启服务器

```terminal
$ sudo reboot
```

重启之后，应该有 CentOS 8 的桌面环境了。

### 安装 VNC Server
yum 安装 tigervnc-server

```terminal
$ sudo dnf install tigervnc-server tigervnc-server-module
```

## 配置

VNC Server 支持多种配置，如：

- 单用户单界面配置（一个用户访问，使用一个界面）
- 多用户单界面配置（多个用户访问，使用同一个界面）
- 多用户多界面配置（多个用户访问，使用各自的界面）

本例比较简单，只介绍单用户单界面配置。

### 配置单用户单界面

可以查看一下帮助文档

>**`注意`**  
>CentOS 8 安装与 CentOS 7 不同，可以参考这个文档

```terminal
$ less /usr/share/doc/tigervnc/HOWTO.md
```
拷贝模板

```terminal
$ sudo cp /usr/lib/systemd/system/vncserver@.service /etc/systemd/system/vncserver@.service
```

不需要编辑这个模版，根据 `HOWTO.md` 的描述，直接编辑配置文件即可

重新加载 systemd

```terminal
$ sudo systemctl daemon-reload
```

编辑用户配置文件

```terminal
$ sudo vi /etc/tigervnc/vncserver.users
```

编辑后看起来是这样的

```terminal
# TigerVNC User assignment
#
# This file assigns users to specific VNC display numbers.
# The syntax is <display>=<username>. E.g.:
#
# :2=andrew
# :3=lisa
:1=admin
```

**说明**

1. `:1` 表示这个启动的端口为。5901，之后一次类推 `:2` 为 5902;  
2. `:1=admin` 表示 5901 为 admin 用户的远程连接;

`:wq` 保存

配置 Xvnc 选项

```terminal
$ sudo vi /etc/tigervnc/vncserver-config-defaults
```

本例如下

```terminal
## Default settings for VNC servers started by the vncserver service
#
# Any settings given here will override the builtin defaults, but can
# also be overriden by ~/.vnc/config and vncserver-config-mandatory.
#
# See the following manpages for more details: vncserver(1) Xvnc(1)
#
# Several common settings are shown below. Uncomment and modify to your
# liking.

# securitytypes=vncauth,tlsvnc
# desktop=sandbox
# geometry=2000x1200
# localhost
# alwaysshared

session=gnome
geometry=1024x768
```

**说明**  
1. `session=gnome` 表示为使用 gnome 桌面  
2. `geometry=1024x768` 表示桌面的分辨率

这样服务的主要配置就完成了

### 配置访问密码
本例使用 admin 用户的桌面环境，如果使用其他用户，请先切换到 admin 用户
```terminal
# su admin
$ vncpasswd
Password:
Verify:
Would you like to enter a view-only password (y/n)? n
```

### 开启服务

```terminal
$ sudo systemctl start vncserver@:1
```

这样就开启了第一个界面

**`注意`**
1. 服务的文件 `/etc/systemd/system/vncserver@.service`没有 `:1`  
2. `:1` 使当参数启动服务器，表示启动第一个界面

设置开机启动

```terminal
$ sudo systemctl enable vncserver@:1
```

### 打开防火墙

我们需要配置防火墙, 打开 VNC 服务

```terminal
$ sudo firewall-cmd --permanent --add-service vnc-server
success
$ sudo firewall-cmd --reload
success
```

### 客户端访问
下载 [VNC Viewer][2] 

设置如下：

VNC Server: YOUR_SERVER_IP:1  
Name: YOUR_Display_1

连接之后，输入 admin 的 vpnpasswd，既可看到界面了。

## 参考资料
[How to Install and Configure VNC Server on Centos 8 / RHEL 8][1]  
[VNC Viewer][2]  

[1]: https://www.linuxtechi.com/install-configure-vnc-server-centos8-rhel8/
[2]: https://www.realvnc.com/en/connect/download/viewer/