---
layout: post
title: VirtualBox配置CentOS备忘
categories: [Tutorial]
tags: [virtualbox, centos]
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

#### 安装Google Chrome
到[http://www.google.com/chrome/eula.html?hl=en][1]下载安装文件
	# rpm -Uvh google-chrome-stable_current_x86_64.rpm

#### 参考资料
[How to install Guest Additions in CentOS 5.1](https://forums.virtualbox.org/viewtopic.php?t=4960)。  

[0]: http://en.wikipedia.org/wiki/VirtualBox
[1]: http://www.google.com/chrome/eula.html?hl=en
