---
layout: post
title: CentOS 6 下配置 SFTP 备忘
categories: [Linux]
tags: [centos, sftp, chroot, selinux]
summary: SFTP 在Linux环境下搭建很简单，因为 Linux 一般默认支持 SSH（SSH-2.0）协议。搭建 SFTP 服务，安全的进行文件的传输，Chroot 可以控制用户的访问目录。
---
## 前言

SFTP 在 Linux 环境下搭建很简单，因为 Linux 一般默认支持 SSH（SSH-2.0）协议。

搭建 SFTP 服务，安全的进行文件的传输，Chroot 可以控制用户的访问目录。

参见 <https://en.wikipedia.org/wiki/SSH_File_Transfer_Protocol>

### 环境说明
CentOS 6.8

## 配置步骤
1.查看配置

```terminal
# ssh -V
OpenSSH_5.3p1, OpenSSL 1.0.1e-fips 11 Feb 2013
```

注意，OpenSSH 4.8p1 及以上版本才支持 Chroot。CentOS 6 默认安装 OpenSSH 5.3p1，不用重新编辑即可设置 Chroot

2.修改 sshd_config

```terminal
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
```

含义如下

```conf
// 使用 sftp 服务使用系统自带的 internal-sftp
Subsystem	sftp	internal-sftp
// 匹配sftp组的用户, 如果有多个组用逗号分割
// 也可以使用 Match User username 匹配用户, 多个用户之间也是用逗号分割
Match Group sftp
    // 用 chroot 将用户的根目录指定到 /data/sftp/%u, %u 代表用户名, %h 表示用户根目录
    ChrootDirectory /data/sftp/%u
    // 禁止用户使用端口转发
    AllowTcpForwarding no
    X11Forwarding no
    ForceCommand internal-sftp
```

通过如上配置，即可将用户限定在 `/data/sftp/%u` 目录下。

3.创建用户和组

```terminal
// 创建目录，与 sshd_config 中的配置一致
# mkdir -p /data/sftp
// 新建组 sftp
# groupadd sftp
// 新建用户，不需要 ssh 登录，不需要 home 目录
# useradd -M -g sftp -s /sbin/nologin sftp1
```

4.配置目录和权限

```terminal
# mkdir -p /data/sftp/sftp1
# chmod -R 755 /data/sftp
# chown root:sftp /data/sftp
```

目录的权限设定有两个要点：

1.由 ChrootDirectory 指定的目录开始一直往上到系统根目录为止的目录拥有者都只能是 root  
2.由 ChrootDirectory 指定的目录开始一直往上到系统根目录为止都不可以具有群组写入权限（最大权限755）

因为用了 Chroot，所以 `/data/sftp/sftp1` 属主一定要是 root，并且所属组不能有写入权限，如果上传需要写入在 `/data/sftp/sftp1` 下建立可写属主的文件夹供上传使用。

```terminal
# mkdir -p /data/sftp/sftp1/upload
# chown sftp1:sftp /data/sftp/sftp1/upload
```

这样 sftp1 用户即可登录并上传文件到 upload 文件夹下。

5.SELinux

CentOS 默认开启 SELinux, 会导致 Chroot 不可用，需要进行如下设置。

```terminal
# setsebool -P ssh_chroot_full_access on
```

因为本例没有使用 sshd_config 中没有使用 `%h`，即用户 home 目录，如果使用 `%h`，SELinux 进行如下设置

```terminal
# setsebool -P ssh_chroot_rw_homedirs on
```

6.测试

```terminal
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
```

## 参考资料
[CentOS 6 配置 SFTP][1]  
[SFTP Chroot on CentOS][2]  
[SFTP+OpenSSH+ChrootDirectory设置][3]  
 
[1]: https://www.zhukun.net/archives/7641
[2]: https://www.chriscowley.me.uk/blog/2012/11/19/sftp-chroot-on-centos/
[3]: http://www.cnblogs.com/buffer/p/3191540.html
