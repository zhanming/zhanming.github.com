---
layout: post
title: CentOS 6.2 安装 VNC Server
categories: [Linux]
tags: [vncserver, centos]
summary: CentOS6.2 安装 VNC Server，具体安装和配置过程记录。
---
## 环境说明
CentOS 6.2 Minimal Desktop

## 安装并配置VNC Server
安装 tigervnc-server

```terminal
# yum -y install tigervnc-server
```

设置 VNC client 的密码

```terminal
# vncpasswd
Password:
Verify:
```

添加字体

```terminal
# yum -y install pixman libXfont
```

修改远程桌面的显示配置

```terminal
# vi /root/.vnc/xstartup
```

注释掉最后一行 `twm &` 并添加 gnome 显示

```conf
xterm -geometry 80x24+10+10 -ls -title "$VNCDESKTOP Desktop" &
#twm &
gnome-session & #set starting GNOME desktop
```

修改登录帐号，屏幕大小等参数

```terminal
# vi /etc/sysconfig/vncservers
```
在尾部添加

```conf
VNCSERVERS="1:root"
VNCSERVERARGS[1]="-geometry 1024x768 -alwaysshared -depth 24"
```

配置防火墙并添加 5901 端口

```terminal
# vi /etc/sysconfig/iptables
```

添加

```conf
-A INPUT -m state --state NEW -m tcp -p tcp --dport 5901 -j ACCEPT
```

最终的像这样

```conf
# Firewall configuration written by system-config-firewall
# Manual customization of this file is not recommended.
*filter
:INPUT ACCEPT [0:0]
:FORWARD ACCEPT [0:0]
:OUTPUT ACCEPT [0:0]
-A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
-A INPUT -p icmp -j ACCEPT
-A INPUT -i lo -j ACCEPT
-A INPUT -m state --state NEW -m tcp -p tcp --dport 22 -j ACCEPT
-A INPUT -m state --state NEW -m tcp -p tcp --dport 5901 -j ACCEPT
-A INPUT -j REJECT --reject-with icmp-host-prohibited
-A FORWARD -j REJECT --reject-with icmp-host-prohibited
COMMIT
```

重启 iptables 服务

```terminal
# service iptables restart
```

开启 vncserver 服务

```terminal
# service vncserver start
```

服务端配置完成了，可以使用远程登录到 root 帐号（生产系统建议不要使用 root）

### 下载安装客户端
推荐使用 [RealVNC][2]

服务器地址： ip:1, 之后确认，输入密码即可。

## 参考资料
[Install VNC Server][1]  

[1]: http://www.server-world.info/en/note?os=CentOS_6&p=x&f=2
[2]: http://www.realvnc.com/products/vnc/
