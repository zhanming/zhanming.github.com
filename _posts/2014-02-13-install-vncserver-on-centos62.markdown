---
layout: post
title: CentOS 6.2安装VNC Server
categories: [Linux]
tags: [vncserver, centos]
---
#### 环境说明
CentOS 6.2 Minimal Desktop

#### 安装并配置VNC Server
安装tigervnc-server
    # yum -y install tigervnc-server
设置VNC client的密码
    # vncpasswd
    Password:
    Verify:
添加字体
    # yum -y install pixman libXfont

修改远程桌面的显示配置
    # vi /root/.vnc/xstartup
注释掉最后一行`twm &`并添加gnome显示
<pre class="prettyprint linenums">
xterm -geometry 80x24+10+10 -ls -title "$VNCDESKTOP Desktop" &
#twm &
gnome-session & #set starting GNOME desktop
</pre>

修改登录帐号，屏幕大小等参数
    # vi /etc/sysconfig/vncservers
在尾部添加
<pre class="prettyprint linenums">
VNCSERVERS="1:root"
VNCSERVERARGS[1]="-geometry 1024x768 -alwaysshared -depth 24"
</pre>

配置防火墙并添加5901端口
    # vi /etc/sysconfig/iptables
添加
    -A INPUT -m state --state NEW -m tcp -p tcp --dport 5901 -j ACCEPT
最终的像这样
<pre class="prettyprint linenums">
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
</pre>

重启iptables服务
    # service iptables restart

开启vncserver服务
    # service vncserver start

服务端配置完成了，可以使用远程登录到root帐号（生产系统建议不要使用root）

#### 下载安装客户端
推荐使用RealVNC<http://www.realvnc.com/products/vnc/>

服务器地址： ip:1, 之后确认，输入密码即可。

#### 参考资料
[Install VNC Server][1]  

[1]: http://www.server-world.info/en/note?os=CentOS_6&p=x&f=2
