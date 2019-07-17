---
layout: post
title: CentOS 7 配置 VNC Server 
categories: [Linux]
tags: [centos, vnc]
summary: CentOS 7 桌面版安装之后，可以安装 VNC Server, 使用户可以远程访问。
---
## 前言
有时服务器是测试使用，安装 Linux 之后，再安装 Virtual Box 运行虚拟机进行使用，虽然 Virtual Box 可以使用命令行，但是使用图形用户界面还是相对方便一些，此时服务器需要安装 VNC Server，本例介绍安装和配置流程。

### 环境说明
CentOS 7（Desktop Install）

因为使用图形用户界面，本例使用 GNOME 桌面环境。

```terminal
$ cat /etc/redhat-release 
CentOS Linux release 7.4.1708 (Core) 
```

本例中 Linux（CentOS 7) 系统用户有两个 root 和 admin，VNC Viewer 使用 admin 进行访问。 
## 安装

### 安装桌面环境
如果没有安装 Desktop 版本，需要先安装 X Windows。

> **`注意`**
>
> 安装桌面环境，未测试。
> 

```terminal
$ sudo yum check-update
$ sudo yum groupinstall "X Window System"
$ sudo yum install gnome-classic-session gnome-terminal nautilus-open-terminal control-center liberation-mono-fonts
```
设置默认启动图形界面

```terminal
$ sudo unlink /etc/systemd/system/default.target
$ sudo ln -sf /lib/systemd/system/graphical.target /etc/systemd/system/default.target
```

重启服务器

```terminal
$ sudo reboot
```

重启之后，应该有 CentOS 7 的桌面环境了。

### 安装 VNC Server
yum 安装 tigervnc-server

```terminal
$ sudo yum install tigervnc-server
```

## 配置

VNC Server 支持多种配置，如：

- 单用户单界面配置（一个用户访问，使用一个界面）
- 多用户单界面配置（多个用户访问，使用同一个界面）
- 多用户多界面配置（多个用户访问，使用各自的界面）

本例比较简单，只介绍单用户单界面配置。其他类型的配置，可以参考 [CHAPTER 12. TIGERVNC - RedHat Customer Portal][3]。

### 配置单用户单界面

拷贝模板

```terminal
$ sudo cp /usr/lib/systemd/system/vncserver@.service /etc/systemd/system/vncserver@.service
```

网上其他资料，拷贝的文件名为 vncserver@:1.service，没有必要，后续说明。

编辑配置文件

```terminal
$ sudo vi /etc/systemd/system/vncserver@.service
```

编辑后看起来是这样的

```terminal
# The vncserver service unit file
#
# Quick HowTo:
# 1. Copy this file to /etc/systemd/system/vncserver@.service
# 2. Replace <USER> with the actual user name and edit vncserver
#    parameters appropriately
#   ("User=<USER>" and "/home/<USER>/.vnc/%H%i.pid")
# 3. Run `systemctl daemon-reload`
# 4. Run `systemctl enable vncserver@:<display>.service`
#
# DO NOT RUN THIS SERVICE if your local area network is
# untrusted!  For a secure way of using VNC, you should
# limit connections to the local host and then tunnel from
# the machine you want to view VNC on (host A) to the machine
# whose VNC output you want to view (host B)
#
# [user@hostA ~]$ ssh -v -C -L 590N:localhost:590M hostB
#
# this will open a connection on port 590N of your hostA to hostB's port 590M
# (in fact, it ssh-connects to hostB and then connects to localhost (on hostB).
# See the ssh man page for details on port forwarding)
#
# You can then point a VNC client on hostA at vncdisplay N of localhost and with
# the help of ssh, you end up seeing what hostB makes available on port 590M
#
# Use "-nolisten tcp" to prevent X connections to your VNC server via TCP.
#
# Use "-localhost" to prevent remote VNC clients connecting except when
# doing so through a secure tunnel.  See the "-via" option in the
# `man vncviewer' manual page.


[Unit]
Description=Remote desktop service (VNC)
After=syslog.target network.target

[Service]
Type=forking
User=root

# Clean any existing files in /tmp/.X11-unix environment
ExecStartPre=/bin/sh -c '/usr/bin/vncserver -kill %i > /dev/null 2>&1 || :'
ExecStart=/usr/sbin/runuser -l admin -c "/usr/bin/vncserver %i -geometry 1280x1024"
PIDFile=/home/admin/.vnc/%H%i.pid
ExecStop=/bin/sh -c '/usr/bin/vncserver -kill %i > /dev/null 2>&1 || :'

[Install]
WantedBy=multi-user.target
``` 

**`注意`**

1. 启动服务的用户为 root，添加 `User=root`, 这样 VNC Client 访问时可以看到菜单栏(Menu bar);  
2. 将 `<USER>` 替换为 admin (本机的非 root 用户), 这样用户登录到 admin 的界面;

`:wq` 保存配置之后，重启 systemd

```terminal
$ sudo systemctl daemon-reload
```

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


### 打开防火墙

我们需要配置防火墙, 打开 VNC 服务

```terminal
$ sudo firewall-cmd --permanent --add-service vnc-server
success
$ sudo firewall-cmd --reload
success
```

### 客户端访问
下载 [VNC Viewer][4] 

设置如下：

VNC Server: YOUR_SERVER_IP:1  
Name: YOUR_Display_1

连接之后，输入 admin 的 vpnpasswd，既可看到界面了。

## 参考资料
[怎样在 CentOS 7.0 上安装和配置 VNC 服务器][1]  
[How To Install / Configure VNC Server On CentOS 7.0][2]  
[CHAPTER 12. TIGERVNC - RedHat Customer Portal][3]  
[VNC Viewer][4]  

[1]: https://linux.cn/article-5335-1.html
[2]: https://linoxide.com/linux-how-to/install-configure-vnc-server-centos-7-0/
[3]: https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux/7/html/System_Administrators_Guide/ch-TigerVNC.html  
[4]: https://www.realvnc.com/en/connect/download/viewer/