---
layout: post
title: VirtualBox 配置 CentOS 备忘
categories: [Tutorial]
tags: [virtualbox, centos]
update: 2013-03-14
summary: Oracle VM VirtualBox 配置 CentOS, 本文以 VirtualBox 4.2.8 安装的 CentOS 6.4_x86_64 为例。
---

## 简介
[http://en.wikipedia.org/wiki/VirtualBox][0]

Oracle VM VirtualBox (formerly Sun VirtualBox, Sun xVM VirtualBox and innotek VirtualBox) is an x86 virtualization software package, created by software company Innotek GmbH, purchased in 2008 by Sun Microsystems, and now developed by Oracle Corporation as part of its family of virtualization products. 

本文以 VirtualBox 4.2.8 安装的 CentOS 6.4_x86_64 为例:  

## 安装 Guest Additions
安装依赖

```terminal
# yum install gcc kernel sources kernel-devel
# ln -s /usr/src/kernels/2.6.32-358.0.1.el6.x86_64 /usr/src/linux
```

重启操作系统    

```terminal
# sh autorun.sh
```
### 配置sudo命令
经常使用 `su root -` 比较麻烦，sudo 比较好用。

```terminal
# chmod 740 /etc/sudoers
# vi /etc/sudoers
```

编辑 sudoers 文件，添加 sodoer。

```conf
## Allow root to run any commands anywhere
root    ALL=(ALL)       ALL
your_username        ALL=(ALL)       ALL
```

保存之后再将权限修改回去

```terminal
# chmod 440 /etc/sudoers
```

### 安装Google Chrome
到 [http://www.google.com/chrome/eula.html?hl=en][1] 下载安装文件

```terminal
$ sudo rpm -Uvh google-chrome-stable_current_x86_64.rpm
```

#### 安装 Git gui
使用 git-gui，图形用户界面相对方便些

```terminal
$ sudo yum install git-gui
```

使用方法，cd 到项目的 git repo 根目录

```terminal
$ git gui
```

## 参考资料
[How to install Guest Additions in CentOS 5.1](https://forums.virtualbox.org/viewtopic.php?t=4960)。  

[0]: http://en.wikipedia.org/wiki/VirtualBox
[1]: http://www.google.com/chrome/eula.html?hl=en
[2]: http://qizhanming.com/blog/2012/04/27/go-intro-2-install-form-source/
