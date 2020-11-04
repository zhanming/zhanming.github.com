---
layout: post
title: CentOS 8 安装 FreeIPA 主从复制
categories: [Linux]
tags: [centos, ldap, freeipa]
update: 2020-11-04
summary: FreeIPA 4.7 之后，默认支持从 RHEL 8 开始，本次写一篇 CentOS 8 中 FreeIPA 的安装和配置过程。
---
## 前言
以前写过一篇 [CentOS 7 安装 FreeIPA 主从复制](https://qizhanming.com/blog/2019/04/29/how-to-install-freeipa-server-and-replica-on-centos-7)，因为 FreeIPA 4.7 之后，默认支持  RHEL 8 开始，本次写一篇 CentOS 8 中 FreeIPA 的安装和配置过程。

### 更新系统

```terminal
# sudo dnf update
```

### 环境说明

CentOS 8（Minimal Install）

```terminal
# cat /etc/system-release
CentOS Linux release 8.1.1911 (Core) 
```

本例演示环境如下

| IP Add    | HostName | DNS|Descprition         |
|----------------|-------------|---------------------|---------------------|
| 10.11.0.247/24 | idm.corp.example.com | 114.114.114.114 |主服务器        |
| 10.11.0.227/24 | Idm2.corp.example.com | 10.11.0.247 |复制服务器       |

`注意`  

- 内存推荐 3 G 以上，硬件配置可以参考官方文档 [1.1. Hardware recommendations][1]。  
- Host 列请改为您自己的主机名。  
- 本文以有 root 用户进行操作，您也可以使用有 sudo 权限的账户进行。  
- 建议使用三级域名，如本例为 `corp.example.com` 因为 `example.com` 一般为公网使用。  
- 本机 IP 的子网掩码不能是 `/32` (255.255.255.255), 至少是 `/24`(255.255.255.0) 或 `/16`(255.255.0.0)。  
- 默认请启动防火墙，因为 LDAP 是非常重要的服务，安全性很重要。

## 前提条件

先要设置本机机器名，并配置 DNS，必须保障机器名正确, 因为需要使用 FQDN，两台机器都是一样。

这里以 `idm.corp.example.com` 为例，`idm2.corp.example.com` 请修改相应 IP 和 FQDN。

```terminal
# hostnamectl set-hostname idm.corp.example.com
```

查看一下

```terminal
# hostname
idm.corp.example.com
```

还要修改 hosts 文件

```terminal
# echo -e "10.11.0.247 idm.corp.example.com" >> /etc/hosts
```

## 主服务器

### 安装

CentOS 8 中 FreeIPA 服务端和客户端的安装包是在 AppStream 仓库中的，我们可以先查看一下

```terminal
# dnf module list idm
CentOS-8 - AppStream
Name Stream     Profiles                                 Summary
idm  DL1        common [d], adtrust, client, dns, server The Red Hat Enterprise Linu
                                                         Identity Management system module
idm  client [d] common [d]                               RHEL IdM long term support client
                                                         module

Hint: [d]efault, [e]nabled, [x]disabled, [i]nstalled
```

可以查看一下这个模块的具体信息

```terminal
# dnf module info idm:DL1
```

安装 FreeIPA 服务端需要使用 `idm:DL1` 这个模块，如下命令

```terminal
# dnf module enable idm:DL1
```

`注意` 两台服务器都要激活这个模块

再更新一下模块

```terminal
# dnf distro-sync
```

接下来开始主服务器的安装。

本例安装 `ipa-server` 和 `ipa-server-dns`

```terminal
# dnf install ipa-server ipa-server-dns
```
接下来输入 FreeIPA 服务端安装命令，这将执行一系列脚本来配置并安装 FreeIPA。

`注意`，如果 corp.example.com 已经注册了外网域名，需要更改，不能重复。

```terminal
# ipa-server-install --setup-dns

The log file for this installation can be found in /var/log/ipaserver-install.log
==============================================================================
This program will set up the IPA Server.
Version 4.8.0

This includes:
  * Configure a stand-alone CA (dogtag) for certificate management
  * Configure the NTP client (chronyd)
  * Create and configure an instance of Directory Server
  * Create and configure a Kerberos Key Distribution Center (KDC)
  * Configure Apache (httpd)
  * Configure DNS (bind)
  * Configure the KDC to enable PKINIT

To accept the default shown in brackets, press the Enter key.

Enter the fully qualified domain name of the computer
on which you're setting up server software. Using the form
<hostname>.<domainname>
Example: master.example.com.


Server host name [idm.corp.example.com]: # 确认主机名

Warning: skipping DNS resolution of host idm.corp.example.com
The domain name has been determined based on the host name.

Please confirm the domain name [corp.example.com]: # 确认域名

The kerberos protocol requires a Realm name to be defined.
This is typically the domain name converted to uppercase.

Please provide a realm name [CORP.EXAMPLE.COM]: # 确认 kerberos 的领域名称
Certain directory server operations require an administrative user.
This user is referred to as the Directory Manager and has full access
to the Directory for system management tasks and will be added to the
instance of directory server created for IPA.
The password must be at least 8 characters long.

Directory Manager password: # 输入目录服务管理员的密码
Password (confirm): # 确认密码

The IPA server requires an administrative user, named 'admin'.
This user is a regular system account used for IPA server administration.

IPA admin password: # 输入 IPA 服务的管理员密码
Password (confirm): # 确认密码

Checking DNS domain corp.example.com., please wait ...
Do you want to configure DNS forwarders? [yes]: # 配置 DNS 转发
Following DNS servers are configured in /etc/resolv.conf: 114.114.114.114
Do you want to configure these servers as DNS forwarders? [yes]: # 再添加其他的 DNS 转发
All DNS servers from /etc/resolv.conf were added. You can enter additional addresses now:
Enter an IP address for a DNS forwarder, or press Enter to skip: # 确认
Checking DNS forwarders, please wait ...
DNS server 114.114.114.114 does not support DNSSEC: answer to query '. SOA' is missing DNSSEC signatures (no RRSIG data)
Please fix forwarder configuration to enable DNSSEC support.
(For BIND 9 add directive "dnssec-enable yes;" to "options {}")
DNS server 114.114.114.114: answer to query '. SOA' is missing DNSSEC signatures (no RRSIG data)
Please fix forwarder configuration to enable DNSSEC support.
(For BIND 9 add directive "dnssec-enable yes;" to "options {}")
WARNING: DNSSEC validation will be disabled
Do you want to search for missing reverse zones? [yes]: # 搜索 DNS 反向区域
Checking DNS domain 0.11.10.in-addr.arpa., please wait ...
Do you want to create reverse zone for IP 10.11.0.247 [yes]: # 确认
Please specify the reverse zone name [0.11.10.in-addr.arpa.]: # 确认
Checking DNS domain 0.11.10.in-addr.arpa., please wait ...
DNS check for domain 0.11.10.in-addr.arpa. failed: The DNS operation timed out after 30.00145673751831 seconds.
Using reverse zone(s) 0.11.10.in-addr.arpa.
Do you want to configure chrony with NTP server or pool address? [no]: # 是否配置时间戳服务器

The IPA Master Server will be configured with:
Hostname:       idm.corp.example.com
IP address(es): 10.11.0.247
Domain name:    corp.exmaple.com
Realm name:     CORP.EXAMPLE.COM

The CA will be configured with:
Subject DN:   CN=Certificate Authority,O=CORP.EXAMPLE.COM
Subject base: O=CORP.EXAMPLE.COM
Chaining:     self-signed

BIND DNS server will be configured to serve IPA domain with:
Forwarders:       114.114.114.114
Forward policy:   only
Reverse zone(s):  0.11.10.in-addr.arpa.

WARNING: Realm name does not match the domain name.
You will not be able to establish trusts with Active Directory unless
the realm name of the IPA server matches its domain name.


Continue to configure the system with these values? [no]: yes # 确认以上所有的配置
```

接下来输出的是安装的日志

```terminal
The following operations may take some minutes to complete.
Please wait until the prompt is returned.

...
...
...

Using existing certificate '/etc/ipa/ca.crt'.
Client hostname: idm.corp.example.com
Realm: CORP.EXAMPLE.COM
DNS Domain: corp.example.com
IPA Server: idm.corp.example.com
BaseDN: dc=corp,dc=example,dc=com

Configured sudoers in /etc/authselect/user-nsswitch.conf
Configured /etc/sssd/sssd.conf
Systemwide CA database updated.
Adding SSH public key from /etc/ssh/ssh_host_ed25519_key.pub
Adding SSH public key from /etc/ssh/ssh_host_ecdsa_key.pub
Adding SSH public key from /etc/ssh/ssh_host_rsa_key.pub
WARNING: The configuration pre-client installation is not managed by authselect and cannot be backed up. Uninstallation may not be able to revert to the original state.
SSSD enabled
Configured /etc/openldap/ldap.conf
Configured /etc/ssh/ssh_config
Configured /etc/ssh/sshd_config
Configuring corp.example.com as NIS domain.
Client configuration complete.
The ipa-client-install command was successful

==============================================================================
Setup complete

Next steps:
	1. You must make sure these network ports are open:
		TCP Ports:
		  * 80, 443: HTTP/HTTPS
		  * 389, 636: LDAP/LDAPS
		  * 88, 464: kerberos
		  * 53: bind
		UDP Ports:
		  * 88, 464: kerberos
		  * 53: bind
		  * 123: ntp

	2. You can now obtain a kerberos ticket using the command: 'kinit admin'
	   This ticket will allow you to use the IPA tools (e.g., ipa user-add)
	   and the web user interface.

Be sure to back up the CA certificates stored in /root/cacert.p12
These files are required to create replicas. The password for these
files is the Directory Manager password
The ipa-server-install command was successful
```

看到最后的 `The ipa-server-install command was successful` 表示已经安装成功。

### 防火墙设置

接下来在防火墙中开启服务端口

```terminal
# firewall-cmd --permanent --add-service={freeipa-4,dns,ntp}
success
# firewall-cmd --reload
success
```

`注意` 系统默认的防火墙服务端口可以查看一下

```terminal
$ cd /usr/lib/firewalld/services
$ less freeipa-4.xml
```

可以看到，`freeipa-4.xml` 包含了 `http`,` https`, `kerberos`, `kpasswd`, `ldap`, `ldaps` 的服务。

查看一下防火墙开放的服务

```terminal
# firewall-cmd --list-all
public (active)
  target: default
  icmp-block-inversion: no
  interfaces: enp0s3
  sources:
  services: cockpit dhcpv6-client dns freeipa-4 ntp ssh
  ports:
  protocols:
  masquerade: no
  forward-ports:
  source-ports:
  icmp-blocks:
  rich rules:
```

### 命令行测试

查看服务状态

```terminal
# ipactl status
Directory Service: RUNNING
krb5kdc Service: RUNNING
kadmin Service: RUNNING
named Service: RUNNING
httpd Service: RUNNING
ipa-custodia Service: RUNNING
pki-tomcatd Service: RUNNING
ipa-otpd Service: RUNNING
ipa-dnskeysyncd Service: RUNNING
ipa: INFO: The ipactl command was successful
```

生成 kerberos 票据

```terminal
# kinit admin
Password for admin@EXAMPLE.COM: # 输入 admin 的密码
```

查看一下已经生成的票据

```terminal
# klist
Ticket cache: KCM:0
Default principal: admin@EXAMPLE.COM

Valid starting       Expires              Service principal
04/28/2020 10:18:35  04/29/2020 10:18:29  krbtgt/EXAMPLE.COM@EXAMPLE.COM
```

可以看到有效期默认是 1 天。

### Web UI 测试

找一台客户端，将客户端的 DNS 设置为 FreeIPA 服务器的 IP，本例为 `10.11.0.247`

使用浏览器访问 `https://idm.corp.example.com`

`注意`：默认使用 https 的证书是自签发的，因此是不被浏览器信任的。如果内部使用，可以不必理会，否则您可以购买该域名相应的证书并配置。

### 证书更新(可选)

一般有 3 个文件

- ca.crt（CA 证书）
- your_domain.crt（域名的公钥证书）
- your_domain.key（域名的私钥证书）

通过如下命令配置，这个命令不会将密码保存到 shell 的历史中，更安全。

```
# ipa-cacert-manage -p your_directory_manager_password -n httpcrt -t C,, install ca.crt
```

安装站点的公钥和私钥

```
# ipa-server-certinstall -w -d your_domain.key your_domain.crt
```

访问 Web 地址，输入 admin 的用户名和密码，之后登录 FreeIPA 服务端的 Web 系统。

## 复制服务器

### 启用模块

```terminal
# dnf module enable idm:DL1
```

```terminal
# dnf distro-sync
```

### 安装客户端

```terminal
# dnf install ipa-client
```

接下来执行客户端安装命令，带上参数 `--mkhomedir`(如果用户登录，默认会创建用户的家目录）

```terminal
# ipa-client-install --mkhomedir
This program will set up IPA client.
Version 4.8.0

Discovery was successful!
Do you want to configure chrony with NTP server or pool address? [no]: # 确认
Client hostname: idm2.corp.example.com
Realm: CORP.EXAMPLE.COM
DNS Domain: corp.example.com
IPA Server: idm.corp.example.com
BaseDN: dc=corp,dc=example,dc=com

Continue to configure the system with these values? [no]: yes # 确认配置
Synchronizing time
No SRV records of NTP servers found and no NTP server or pool address was provided.
Using default chrony configuration.
Attempting to sync time with chronyc.
Time synchronization was successful.
User authorized to enroll computers: admin # 输入授权人用户名
Password for admin@CORP.EXAMPLE.COM: # 输入授权人密码
Successfully retrieved CA cert
    Subject:     CN=Certificate Authority,O=CORP.EXAMPLE.COM
    Issuer:      CN=Certificate Authority,O=CORP.EXAMPLE.COM
    Valid From:  2020-04-29 01:43:30
    Valid Until: 2040-04-29 01:43:30

Enrolled in IPA realm CORP.EXAMPLE.COM
Created /etc/ipa/default.conf
Configured sudoers in /etc/authselect/user-nsswitch.conf
Configured /etc/sssd/sssd.conf
Configured /etc/krb5.conf for IPA realm CORP.EXAMPLE.COM
Systemwide CA database updated.
Adding SSH public key from /etc/ssh/ssh_host_ed25519_key.pub
Adding SSH public key from /etc/ssh/ssh_host_ecdsa_key.pub
Adding SSH public key from /etc/ssh/ssh_host_rsa_key.pub
WARNING: The configuration pre-client installation is not managed by authselect and cannot be backed up. Uninstallation may not be able to revert to the original state.
SSSD enabled
Configured /etc/openldap/ldap.conf
Configured /etc/ssh/ssh_config
Configured /etc/ssh/sshd_config
Configuring corp.example.com as NIS domain.
Client configuration complete.
The ipa-client-install command was successful
```
如果看到 `The ipa-client-install command was successful` 表示安装客户端成功。

###  复制服务

安装 FreeIPA 服务端组件

```terminal
# dnf install ipa-server ipa-server-dns
```

首先打开复制服务器防火墙端口

```terminal
# firewall-cmd --permanent --add-service={freeipa-4,dns,ntp}
success
# firewall-cmd --reload
success
```

执行 FreeIPA 复制服务的安装命令

```terminal
# ipa-replica-install
Password for admin@CORP.EXAMPLE.COM:
Lookup failed: Preferred host idm2.corp.example.com does not provide DNS.
Run connection check to master
Connection check OK

...
...
...

Finalize replication settings
Restarting the KDC

WARNING: The CA service is only installed on one server (idm.corp.example.com).
It is strongly recommended to install it on another server.
Run ipa-ca-install(1) on another master to accomplish this.

The ipa-replica-install command was successful
```

复制服务，安装完成。

`注意`，FreeIPA 的复制属于主主复制，即两个服务器都是主节点，会将更改相互发送给其他节点。

最后的告警可以看到，建议使用 `ipa-ca-install` 进行  CA 复制，接下来进行安装。

### CA 复制服务

FreeIPA Replia 安装的最后，可以看到提示： CA 服务只装在一台服务器上，建议运行 `ipa-ca-install` 命令。

```terminal
# ipa-ca-install
Directory Manager (existing master) password:

Run connection check to master
Connection check OK

...
...

Updating DNS system records
```

### DNS 复制服务

```terminal
# ipa-dns-install

The log file for this installation can be found in /var/log/ipaserver-install.log
==============================================================================
This program will setup DNS for the IPA Server.

This includes:
  * Configure DNS (bind)
  * Configure SoftHSM (required by DNSSEC)
  * Configure ipa-dnskeysyncd (required by DNSSEC)

NOTE: DNSSEC zone signing is not enabled by default


To accept the default shown in brackets, press the Enter key.

Do you want to configure DNS forwarders? [yes]: # 确认
Following DNS servers are configured in /etc/resolv.conf: 10.11.0.247
Do you want to configure these servers as DNS forwarders? [yes]: # 确认
All DNS servers from /etc/resolv.conf were added. You can enter additional addresses now:
Enter an IP address for a DNS forwarder, or press Enter to skip: # 确认
Checking DNS forwarders, please wait ...
DNS server 10.11.0.247: answer to query '. SOA' is missing DNSSEC signatures (no RRSIG data)
Please fix forwarder configuration to enable DNSSEC support.
(For BIND 9 add directive "dnssec-enable yes;" to "options {}")
WARNING: DNSSEC validation will be disabled
Do you want to search for missing reverse zones? [yes]: # 确认
Adding [10.11.0.227 idm2.corp.example.com] to your /etc/hosts file

The following operations may take some minutes to complete.
Please wait until the prompt is returned.

...
...

==============================================================================
Setup complete

Global DNS configuration in LDAP server is empty
You can use 'dnsconfig-mod' command to set global DNS options that
would override settings in local named.conf files


	You must make sure these network ports are open:
		TCP Ports:
		  * 53: bind
		UDP Ports:
		  * 53: bind
```

至此，DNS 复制服务安装完成，由于开始已经打开防火墙中的 dns 端口，所以这里不用使用命令打开。

### 查看状态

```terminal
# ipactl status
Directory Service: RUNNING
krb5kdc Service: RUNNING
kadmin Service: RUNNING
named Service: RUNNING
httpd Service: RUNNING
ipa-custodia Service: RUNNING
pki-tomcatd Service: RUNNING
ipa-otpd Service: RUNNING
ipa-dnskeysyncd Service: RUNNING
ipa: INFO: The ipactl command was successful
```

可以看到 9 个服务都在运行，与主服务器一致

### 删除复制服务

如果想要删除复制服务器，如下步骤

先在主服务器上执行初始化会话

```terminal
# kinit admin
Password for admin@CORP.EXAMPLE.COM: # 输入密码
```

查看一下主服务器

```terminal
# klist
Ticket cache: KCM:0
Default principal: admin@CORP.EXAMPLE.COM

Valid starting     Expires            Service principal
11/04/20 17:58:25  11/05/20 17:58:22  krbtgt/CORP.EXAMPLE.COM@CORP.EXAMPLE.COM
```

查看一下有复制服务器信息

```terminal
# ipa-replica-manage list
idm.corp.example.com: master
idm2.corp.example.com: master
```

之后删除复制服务器，本例 `idm2.corp.example.com` 为例

```terminal
# ipa-replica-manage del idm2.corp.example.com
Updating DNS system records
------------------------------------------
Deleted IPA server "idm2.corp.example.com"
------------------------------------------
```

这样主服务器已经删除了配置。

还需要去复制服务器卸载，命令如下

```terminal
[root@idm2]# ipa-server-install --uninstall
```

至此，复制服务器已经删除。

## 结束语

本例介绍 FreeIPA 的安装过程，主要包含了Kerberos，DNS，LDAP，NTP 等基础服务。

1. Auth-A 服务可以方便管理 CentOS 服务器的认证，FreeIPA 集成了 Kerberos，SSSD。
2. Auth-Z 服务可以方便管理 CentOS 服务器的授权，FreeIPA 集成了 Kerberos，SSSD。
3. CA 服务可以方便管理企业的证书，FreeIPA 集成了 Dogtag。
4. NTP 服务可以方便时间同步，FreeIPA 集成了 chromed。
5. LDAP 服务可以同意管理用户名和密码以及与其他子系统集成， FreeIPA 集成了 389 Directory Server。
6. DNS 服务可以方便管理内部域名, FreeIPA 集成了 bind。

FreeIPA 有友好的 CLI 和 Web UI，使用起来非常方便。

## 参考资料

[1.1. Hardware recommendations][1]  
[Install and Setup FreeIPA Server on CentOS 8][2]  
[CentOS 7 安装 FreeIPA 主从复制][3]  

[1]: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/installing_identity_management/preparing-the-system-for-ipa-server-installation_installing-identity-management
[2]: https://kifarunix.com/install-and-setup-freeipa-server-on-centos-8/
[3]: {{ site.baseurl }}{% post_url 2019-04-29-how-to-install-freeipa-server-and-replica-on-centos-7 %}