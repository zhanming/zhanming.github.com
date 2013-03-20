---
layout: post
title: VirtualBox配置CentOS备忘
categories: [Tutorial]
tags: [virtualbox, centos]
update: 2013年03月14日
---

#### 简介
[http://en.wikipedia.org/wiki/VirtualBox][0]

Oracle VM VirtualBox (formerly Sun VirtualBox, Sun xVM VirtualBox and innotek VirtualBox) is an x86 virtualization software package, created by software company Innotek GmbH, purchased in 2008 by Sun Microsystems, and now developed by Oracle Corporation as part of its family of virtualization products. 

本文以VirtualBox 4.2.8安装的CentOS 6.4_x86_64为例:  

#### 安装Guest Additions
安装依赖
    # yum install gcc kernel sources kernel-devel
    # ln -s /usr/src/kernels/2.6.32-358.0.1.el6.x86_64 /usr/src/linux
重启操作系统    
    # sh autorun.sh

#### 配置sudo命令
经常使用`su root -`比较麻烦，sudo比较好用。
    # chmod 740 /etc/sudoers
    # vi /etc/sudoers
编辑sudoers文件，添加sodoer。
    ## Allow root to run any commands anywhere
    root    ALL=(ALL)       ALL
    your_username        ALL=(ALL)       ALL
保存之后再将权限修改回去
    # chmod 440 /etc/sudoers

#### 安装Google Chrome
到[http://www.google.com/chrome/eula.html?hl=en][1]下载安装文件
    $ sudo rpm -Uvh google-chrome-stable_current_x86_64.rpm

#### 安装Git gui
使用git-gui，图形用户界面相对方便些
    $ sudo yum install git-gui
使用方法，cd到项目的git repo根目录
    $ git gui

#### 参考资料
[How to install Guest Additions in CentOS 5.1](https://forums.virtualbox.org/viewtopic.php?t=4960)。  

[0]: http://en.wikipedia.org/wiki/VirtualBox
[1]: http://www.google.com/chrome/eula.html?hl=en
[2]: http://qizhanming.com/blog/2012/04/27/go-intro-2-install-form-source/
