---
layout: post
title: CentOS6下配置SFTP备忘
categories: [Linux]
tags: [centos, sftp, chroot, selinux]
---
#### 前言
SFTP

In computing, the SSH File Transfer Protocol (also Secure File Transfer Protocol, or SFTP) is a network protocol that provides file access, file transfer, and file management over any reliable data stream.

参见<https://en.wikipedia.org/wiki/SSH_File_Transfer_Protocol>

SFTP在Linux环境下搭建很简单，因为Linux一般默认支持SSH（SSH-2.0）协议。

搭建SFTP服务，安全的进行文件的传输，Chroot可以控制用户的访问目录。

#### 环境说明
CentOS 6.8

#### 配置
1.查看配置

	# ssh -V
	OpenSSH_5.3p1, OpenSSL 1.0.1e-fips 11 Feb 2013

注意，OpenSSH 4.8p1 及以上版本才支持Chroot。CentOS6默认安装OpenSSH 5.3p1，不用重新编辑即可设置Chroot

2.修改sshd_config

	# cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
	# vi /etc/ssh/sshd_config
	//注释掉下面这行
	# Subsystem	sftp	/usr/libexec/openssh/sftp-server
	
	//添加如下
	Subsystem	sftp	internal-sftp
	Match Group sftp
        ChrootDirectory /data/sftp/%u
        AllowTcpForwarding no
        X11Forwarding no
		ForceCommand internal-sftp

含义如下

	// 使用sftp服务使用系统自带的internal-sftp
	Subsystem	sftp	internal-sftp
	// 匹配sftp组的用户, 如果有多个组用逗号分割
	// 也可以使用 Match User username 匹配用户, 多个用户之间也是用逗号分割
	Match Group sftp
		// 用chroot将用户的根目录指定到/data/sftp/%u, %u代表用户名, %h表示用户根目录
        ChrootDirectory /data/sftp/%u
		// 禁止用户使用端口转发
        AllowTcpForwarding no
        X11Forwarding no
		ForceCommand internal-sftp

通过如上配置，即可将用户限定在`/data/sftp/%u`目录下。

3.创建用户和组

	// 创建目录，与sshd_config中的配置一致
	# mkdir -p /data/sftp
	// 新建组sftp
	# groupadd sftp
	// 新建用户，不需要ssh登录，不需要home目录
	# useradd -M -g sftp -s /sbin/nologin sftp1
	

4.配置目录和权限

	# mkdir -p /data/sftp/sftp1
	# chmod -R 755 /data/sftp
	# chown root:sftp /data/sftp

目录的权限设定有两个要点：

1.由ChrootDirectory指定的目录开始一直往上到系统根目录为止的目录拥有者都只能是root  
2.由ChrootDirectory指定的目录开始一直往上到系统根目录为止都不可以具有群组写入权限（最大权限755）

因为用了Chroot，所以/data/sftp/sftp1属主一定要是root，并且所属组不能有写入权限，如果上传需要写入在/data/sftp/sftp1下建立可写属主的文件夹供上传使用。

	# mkdir -p /data/sftp/sftp1/upload
	# chown sftp1:sftp /data/sftp/sftp1/upload

这样sftp1用户即可登录并上传文件到upload文件夹下。

5.SELinux

CentOS默认开启SELinux, 会导致Chroot不可用，需要进行如下设置。

	# setsebool -P ssh_chroot_full_access on

因为本例没有使用sshd_config中没有使用`%h`，即用户home目录，如果使用`%h`，SELinux进行如下设置

	# setsebool -P ssh_chroot_rw_homedirs on

6.测试

	# sftp sftp1@localhost
	Connecting to localhost...
	The authenticity of host 'localhost (::1)' can't be established.
	RSA key fingerprint is ....
	Are you sure you want to continue connecting (yes/no)? yes
	Warning: Permanently added 'localhost' (RSA) to the list of known hosts.
	sftp1@localhost's password: 
	sftp> ls
	upload
	sftp> quit


#### 参考资料
[CentOS 6配置SFTP][1]  
[SFTP Chroot on CentOS][2]  
[SFTP+OpenSSH+ChrootDirectory设置][3]  
 
[1]: https://www.zhukun.net/archives/7641
[2]: https://www.chriscowley.me.uk/blog/2012/11/19/sftp-chroot-on-centos/
[3]: http://www.cnblogs.com/buffer/p/3191540.html
