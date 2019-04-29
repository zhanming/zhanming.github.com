---
layout: post
title: CentOS 7 配置 Free IPA 主从复制（本地已有 DNS 服务）
categories: [Linux]
tags: [centos, freeipa]
summary: CentOS 7 配置 Free IPA 主从复制（本地已有 DNS 服务），记录一下大致的安装和配置过程。
---
## 前言

CentOS 7 配置 Free IPA 主从复制（本地已有 DNS 服务），记录一下大致的安装和配置过程。

域控制器，主要作用是很好的管理计算机，统一身份认证。 Microsoft Windows 的产品 Active Directory 是 Windows 下常用的域管理。本文介绍一下 CentOS 7 下域控制器 FreeIPA 的安装和配置。

FreeIPA 为 **Free** **I**dentity **P**olicy **A**udit.

域控制器主要分为两部分：服务端和客户端，本文主要介绍 FreeIPA 服务端和复制服务的安装和配置。

> `注意`: FreeIPA 有 CentOS 7， Fedora 和 Ubuntu 14.04/16.04 的客户端，如果使用其他 Linux 发行版或其他应用程序，虽然没有直接的工具，但是可以使用 FreeIPA 的 SSSD 服务或 LDAP 服务进行认证和授权服务。

主要参考: [How To Set Up Centralized Linux Authentication with FreeIPA on CentOS 7][1]

## 环境说明
CentOS 7（Minimal Install）

### 更新系统

```terminal
$ sudo yum update
```

版本如下

```terminal
$ cat /etc/redhat-release
CentOS Linux release 7.3.1611 (Core)
```
IP 如下 
	
	10.11.0.198 ipa.example.com         # FreeIPA Server
	10.11.0.199 ipa2.example.com        # FreeIPA Replica Server
	10.11.0.10  ipaclient.example.com   # FreeIPA Client

## 安装和配置 FreeIPA 主服务器
### 前提条件
- 至少 1G 的内存
- 防火墙启动，因为 LDAP 是非常重要的服务，所以安全性很重要。
- 需要有 DNS 服务器，参考 [CentOS 7 使用 bind 配置私有网络的 DNS][2]
	- FreeIPA 自带有 DNS 服务的安装，但是不在本文样例范围以内。
- DNS 服务中添加下面的 DNS 记录，因为 FreeIPA 要求使用 fully qualified domain name (FQDN)
	- A 记录，用于正向查找
	- PTR 记录，用于反向查找

### 准备 IPA 服务
设置机器名，必须保障机器名正确,与 FQDN 一致，本例以 `ipa.example.com` 为例。

查看当前机器名

```terminal
# hostname
```

设置机器名

```terminal
# nmtui
```

选择第三项 `Set system name`,设置之后，保存并退出。

> `注意`, 本机 IP 的子网掩码不能是 `/32` (255.255.255.255), 至少是 `/24`(255.255.255.0) 或 `/16`(255.255.0.0)。

测试 DNS 服务,安装 bind-utils

```terminal
# yum install bind-utils
```

正向域测试

```terminal
# dig +short ipa.example.com A
```

这应该返回 `your_server_ipv4`

反向域测试

```terminal
# dig +short -x your_server_ipv4
```

这应该返回 `ipa.example.com`

因为 FreeIPA 依赖 DNS 非常严重，我们必须保障 DNS 设置正确，接下来设置 DNS。
### 设置 DNS
所有的使用 FreeIPA 的服务器，必须有 fully qualified domain names (FQDNs)作为机器名。

修改 hosts 文件

```terminal
# vi /etc/hosts
```
添加如下内容

```conf
your_server_ipv4 ipa.example.com ipa.example.com
127.0.0.1 localhost.localdomain localhost
```

保存并退出 `:wq`

接下来，我们配置随机数生成工具。

### 配置随机数生成工具
安装 FreeIPA 的加密操作需要很多随机数，我们使用 `rngd`。

安装

```terminal
# yum install rng-tools
```
启动程序

```terminal
# systemctl start rngd
```

开机启动

```terminal
# systemctl enable rngd
```

最后，查看一下服务状态

```terminal
# systemctl status rngd
```

### 安装 FreeIPA 服务端
安装 `ipa-server` 这个是 FreeIPA 服务包

```terminal
# yum install ipa-server
```

接下来输入 FreeIPA 服务端安装命令，这将执行一系列脚本来配置并安装 FreeIPA。

```terminal
# ipa-server-install
```

> `注意`： 默认安装过程会安装 DNS 服务到本机，本例使用其他内网 DNS 服务，所以不需要安装。

```terminal
The log file for this installation can be found in /var/log/ipaserver-install.log
==============================================================================
This program will set up the IPA Server.
	
This includes:
  * Configure a stand-alone CA (dogtag) for certificate management
  * Configure the Network Time Daemon (ntpd)
  * Create and configure an instance of Directory Server
  * Create and configure a Kerberos Key Distribution Center (KDC)
  * Configure Apache (httpd)
	
To accept the default shown in brackets, press the Enter key.
	
Do you want to configure integrated DNS (BIND)? [no]: no #输入 no 不安装 dns 服务

Enter the fully qualified domain name of the computer
on which you're setting up server software. Using the form
<hostname>.<domainname>
Example: master.example.com.
	
	
Server host name [ipa.example.com]:  #回车
	
The domain name has been determined based on the host name.
	
Please confirm the domain name [example.com]: #回车
	
The kerberos protocol requires a Realm name to be defined.
This is typically the domain name converted to uppercase.
	
Please provide a realm name [EXAMPLE.COM]: #回车
Certain directory server operations require an administrative user.
This user is referred to as the Directory Manager and has full access
to the Directory for system management tasks and will be added to the
instance of directory server created for IPA.
The password must be at least 8 characters long.
	
Directory Manager password: ****** #输入密码
Password (confirm): ****** #输入密码

The IPA server requires an administrative user, named 'admin'.
This user is a regular system account used for IPA server administration.
	
IPA admin password: ****** #输入密码
Password (confirm): ****** #输入密码

The IPA Master Server will be configured with:
Hostname:       ipa.example.com
IP address(es): 10.11.0.198
Domain name:    example.com
Realm name:     EXAMPLE.COM
```

接下来配置

```terminal
Continue to configure the system with these values? [no]: yes  #输入 yes 确认配置
	
The following operations may take some minutes to complete.
Please wait until the prompt is returned.
	
...
...
...
==============================================================================
Setup complete
	
Next steps:
	1. You must make sure these network ports are open:
		TCP Ports:
		  * 80, 443: HTTP/HTTPS
		  * 389, 636: LDAP/LDAPS
		  * 88, 464: kerberos
		UDP Ports:
		  * 88, 464: kerberos
		  * 123: ntp
	
	2. You can now obtain a kerberos ticket using the command: 'kinit admin'
	   This ticket will allow you to use the IPA tools (e.g., ipa user-add)
	   and the web user interface.
	
Be sure to back up the CA certificates stored in /root/cacert.p12
These files are required to create replicas. The password for these
files is the Directory Manager password
```

#### 打开防火墙端口
> `注意`: 本例中 FreeIPA Server 没有安装 dns 服务，最后的提示中也就没有 打开 53 端口的 tcp 和 udp。

```terminal
# firewall-cmd --permanent --add-service={ntp,http,https,ldap,ldaps,kerberos,kpasswd}
success
# firewall-cmd --reload
success
```

查看一下防火墙开放的服务

```terminal
# firewall-cmd --list-all
public (active)
  target: default
  icmp-block-inversion: no
  interfaces: enp0s3
  sources: 
  services: dhcpv6-client http https kerberos kpasswd ldap ldaps ntp ssh
  ports: 
  protocols: 
  masquerade: no
  forward-ports: 
  sourceports: 
  icmp-blocks: 
  rich rules: 
```

现在 FreeIPA 服务端已经安装完了，端口也开放了，我们需要测试一下

### 测试 FreeIPA 服务端

#### 测试 Kerberos
我们需要 Kerberos 的 token

```terminal
# kinit admin
Password for admin@EXAMPLE.COM:
```

输入 admin 的密码，如果成功，表明 Kerberos 安装正确。

#### 测试 IPA 服务
得到 token之后，输入如下命令

```terminal
# ipa user-find admin
--------------
1 user matched
--------------
  User login: admin
  Last name: Administrator
  Home directory: /home/admin
  Login shell: /bin/bash
  Principal alias: admin@EXAMPLE.COM
  UID: 626400000
  GID: 626400000
  Account disabled: False
----------------------------
Number of entries returned 1
----------------------------
```

如果正确，会返回一条记录。

#### Web 服务测试
访问 `http://ipa.example.com`

> `注意`:默认使用 https 的证书是自签发的，因此是不被浏览器信任的。如果内部使用，可以不必理会，否则您可以购买该域名(本例为 `ipa.example.com`)的证书并配置。

一般有 3 个文件

- ca.crt（CA 证书）
- your_domain.crt（域名的公钥证书）
- your_domain.key（域名的私钥证书）

通过如下命令配置，这个命令不会将密码保存到 shell 的历史中，更安全。

```terminal
# ipa-cacert-manage -p your_directory_manager_password -n httpcrt -t C,, install ca.crt
```

安装站点的公钥和私钥

```terminal
# ipa-server-certinstall -w -d your_domain.key your_domain.crt
```

访问 Web 地址，输入 admin 的用户名和密码，之后登录 FreeIPA 服务端的 Web 系统。

## 安装和配置 FreeIPA 复制服务器

### 先决条件
配置 FreeIPA 复制服务器，需要知道 FreeIPA 主服务器的版本，因为在 4.2（含） 版本以前，配置方式跟 4.3 以后是有区别的。

查看一下版本

```terminal
# ipa --version
VERSION: 4.4.0, API_VERSION: 2.213
```

确认一下 domain level

```terminal
# kinit admin
# ipa domainlevel-get
-----------------------
Current domain level: 1
-----------------------
```

本例使用的是 FreeIPA 4.4, 默认的 domain level 是 1 ，如果是 FreeIPA 4.2 以前的复制，不在本例范围。

> `注意`  
> 复制服务器的域名，为 `ipa2.example.com`  
> 主服务器域名为 `ipa.example.com`

FreeIPA 4.3 版本以后，复制服务安装流程简化

- 安装 FreeIPA 客户端
- 安装复制服务 

### 安装 FreeIPA 复制服务器
登录 `ipa2.exmple.com` 服务器

安装 bind-utils 验证域名

```terminal
# yum install bind-utils
```

验证域名的正向查找

```terminal
# dig +short ipa2.example.com A
```

返回了 `your_replica_server_ipv4`，确认一下是否正确

验证域名的反向查找

```
# dig +short -x your_replica_server_ipv4
ipa2.example.com
```

返回了域名 `ipa2.example.com`，确认一下是否正确

### 安装 FreeIPA 客户端

安装 FreeIPA 客户端

```terminal
# yum install freeipa-client
```

执行 FreeIPA 客户端安装命令

```
# ipa-client-install
DNS discovery failed to determine your DNS domain
Provide the domain name of your IPA server (ex: example.com): example.com #输入
Provide your IPA server name (ex: ipa.example.com): ipa.example.com #输入
The failure to use DNS to find your IPA server indicates that your resolv.conf file is not properly configured.
Autodiscovery of servers for failover cannot work with this configuration.
If you proceed with the installation, services will be configured to always access the discovered server for all operations and will not fail over to other servers in case of failure.
Proceed with fixed values and no DNS discovery? [no]: yes #输入
Client hostname: ipa2.example.com
Realm: EXAMPLE.COM
DNS Domain: example.com
IPA Server: ipa.example.com
BaseDN: dc=example,dc=com
	
Continue to configure the system with these values? [no]: yes #输入
Synchronizing time with KDC...
Attempting to sync time using ntpd.  Will timeout after 15 seconds
User authorized to enroll computers: admin #输入
Password for admin@EXAMPLE.COM: **** #输入密码
...
...
Configuring example.com as NIS domain.
Client configuration complete.
```

至此 FreeIPA 客户端安装完成，这个服务器受 FreeIPA 服务端管理了

### 安装和配置 FreeIPA 复制服务

安装 FreeIPA 服务端

```terminal
# yum install ipa-server
```

打开复制服务器防火墙端口

```terminal
# firewall-cmd --permanent --add-service={ntp,http,https,ldap,ldaps,kerberos,kpasswd}
success
# firewall-cmd --reload
success
```

执行 FreeIPA 复制服务的安装命令

```
# ipa-replica-install
Password for admin@EXAMPLE.COM: ****** #输入密码
Run connection check to master
Connection check OK
Configuring NTP daemon (ntpd)
  [1/4]: stopping ntpd
  [2/4]: writing configuration
  [3/4]: configuring ntpd to start on boot
  [4/4]: starting ntpd
Done configuring NTP daemon (ntpd).
Configuring directory server (dirsrv). Estimated time: 1 minute
  [1/44]: creating directory server user
  [2/44]: creating directory server instance
  [3/44]: updating configuration in dse.ldif
  [4/44]: restarting directory server
  [5/44]: adding default schema
  [6/44]: enabling memberof plugin
  [7/44]: enabling winsync plugin
  [8/44]: configuring replication version plugin
  [9/44]: enabling IPA enrollment plugin
  [10/44]: enabling ldapi
  [11/44]: configuring uniqueness plugin
  [12/44]: configuring uuid plugin
  [13/44]: configuring modrdn plugin
  [14/44]: configuring DNS plugin
  [15/44]: enabling entryUSN plugin
  [16/44]: configuring lockout plugin
  [17/44]: configuring topology plugin
  [18/44]: creating indices
  [19/44]: enabling referential integrity plugin
  [20/44]: configuring certmap.conf
  [21/44]: configure autobind for root
  [22/44]: configure new location for managed entries
  [23/44]: configure dirsrv ccache
  [24/44]: enabling SASL mapping fallback
  [25/44]: restarting directory server
  [26/44]: creating DS keytab
  [27/44]: retrieving DS Certificate
  [28/44]: restarting directory server
  [29/44]: setting up initial replication
Starting replication, please wait until this has completed.
Update in progress, 8 seconds elapsed
Update succeeded
	
  [30/44]: adding sasl mappings to the directory
  [31/44]: updating schema
  [32/44]: setting Auto Member configuration
  [33/44]: enabling S4U2Proxy delegation
  [34/44]: importing CA certificates from LDAP
  [35/44]: initializing group membership
  [36/44]: adding master entry
  [37/44]: initializing domain level
  [38/44]: configuring Posix uid/gid generation
  [39/44]: adding replication acis
  [40/44]: enabling compatibility plugin
  [41/44]: activating sidgen plugin
  [42/44]: activating extdom plugin
  [43/44]: tuning directory server
  [44/44]: configuring directory to start on boot
Done configuring directory server (dirsrv).
Configuring ipa-custodia
  [1/5]: Generating ipa-custodia config file
  [2/5]: Generating ipa-custodia keys
  [3/5]: Importing RA Key
/usr/lib/python2.7/site-packages/urllib3/connection.py:251: SecurityWarning: Certificate has no `subjectAltName`, falling back to check for a `commonName` for now. This feature is being removed by major browsers and deprecated by RFC 2818. (See https://github.com/shazow/urllib3/issues/497 for details.)
  SecurityWarning
  [4/5]: starting ipa-custodia 
  [5/5]: configuring ipa-custodia to start on boot
Done configuring ipa-custodia.
Configuring Kerberos KDC (krb5kdc). Estimated time: 30 seconds
  [1/4]: configuring KDC
  [2/4]: adding the password extension to the directory
  [3/4]: starting the KDC
  [4/4]: configuring KDC to start on boot
Done configuring Kerberos KDC (krb5kdc).
Configuring kadmin
  [1/2]: starting kadmin 
  [2/2]: configuring kadmin to start on boot
Done configuring kadmin.
Configuring ipa_memcached
  [1/2]: starting ipa_memcached 
  [2/2]: configuring ipa_memcached to start on boot
Done configuring ipa_memcached.
Configuring the web interface (httpd). Estimated time: 1 minute
  [1/20]: setting mod_nss port to 443
  [2/20]: setting mod_nss cipher suite
  [3/20]: setting mod_nss protocol list to TLSv1.0 - TLSv1.2
  [4/20]: setting mod_nss password file
  [5/20]: enabling mod_nss renegotiate
  [6/20]: adding URL rewriting rules
  [7/20]: configuring httpd
  [8/20]: configure certmonger for renewals
  [9/20]: setting up httpd keytab
  [10/20]: setting up ssl
  [11/20]: importing CA certificates from LDAP
  [12/20]: publish CA cert
  [13/20]: clean up any existing httpd ccache
  [14/20]: configuring SELinux for httpd
  [15/20]: create KDC proxy user
  [16/20]: create KDC proxy config
  [17/20]: enable KDC proxy
  [18/20]: restarting httpd
  [19/20]: configuring httpd to start on boot
  [20/20]: enabling oddjobd
Done configuring the web interface (httpd).
Applying LDAP updates
Upgrading IPA:
  [1/9]: stopping directory server
  [2/9]: saving configuration
  [3/9]: disabling listeners
  [4/9]: enabling DS global lock
  [5/9]: starting directory server
  [6/9]: upgrading server
  [7/9]: stopping directory server
  [8/9]: restoring configuration
  [9/9]: starting directory server
Done.
Configuring ipa-otpd
  [1/2]: starting ipa-otpd 
  [2/2]: configuring ipa-otpd to start on boot
Done configuring ipa-otpd.
```

这样 FreeIPA Replica 服务搭建完成。

### 查看 FreeIPA 复制服务

可以登录 `http://ipa.example.com` 之后进入 IPA Server 选项，之后进入 Topology 查看。

同样的，可以登录 `http://ipa2.example.com` 因为两个系统是同步的，所以内容是一样的。

## 结束语
本例介绍 FreeIPA 的安装（主服务器和复制服务器）的安装。

## 参考资料
[How To Set Up Centralized Linux Authentication with FreeIPA on CentOS 7][1]  
[CentOS 7 使用 bind 配置私有网络的 DNS][2]  
  
[1]: https://www.digitalocean.com/community/tutorials/how-to-set-up-centralized-linux-authentication-with-freeipa-on-centos-7
[2]: http://qizhanming.com/blog/2017/05/27/how-to-configure-bind-as-a-private-network-dns-server-on-centos-7

