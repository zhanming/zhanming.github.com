---
layout: post
title: CentOS 7 安装 FreeIPA 主从复制
categories: [Linux]
tags: [centos, freeipa]
summary: CentOS 7 配置 Free IPA，以前写过一篇，但是没有安装 DNS 服务，本次再写一次包含 DNS 服务的安装和配置过程。
---
## 前言
CentOS 7 配置 Free IPA，以前写过一篇 [CentOS 7 配置 Free IPA 主从复制（本地已有 DNS 服务）][1]，该文中没有包括安装 DNS 服务，本次写一篇安装 FreeIPA 带 DNS 服务的安装和配置过程。

因为使用 bind 进行 DNS 配置，每次配置都需要更改配置再重新加载服务，作为测试和少量部署还可以应付，但是如果内部很多服务器，管理起来相对费事，FreeIPA 自带 bind 支持，有 web 界面配置支持，比较方便。

如果您使用单独的 DNS 服务器，可以参考 [CentOS 7 配置 Free IPA 主从复制（本地已有 DNS 服务）][1]

顺便说一句：FreeIPA 中的 A 部分，也就是 Audit 部分还不是很完善，但是一直在改进中，I 和 P 部分做得很好，很适合作为企业内部的基础设施。

### 更新系统

```terminal
# yum update
```

### 环境说明
CentOS 7（Minimal Install）

```terminal
# cat /etc/centos-release
CentOS Linux release 7.6.1810 (Core)
```

配置说明如下 

| IP Addr        | Host                  | Descprition |
|----------------|-----------------------|-------------|
| 10.11.0.249/24 | ipa.corp.example.com  | 主服务器    |
| 10.11.0.250/24 | ipa2.corp.example.com | 复制服务器  |

`注意`  
- 内存至少 1.5 G 以上。  
- Host 列请改为您自己的主机名。  
- 本文都是以 root 用户进行操作，您可以使用其他有相应 sudo 权限的用户。  
- 建议使用三级域名，如本例为 `corp.example.com` 因为 `example.com` 一般为公网使用。  
- 本机 IP 的子网掩码不能是 `/32` (255.255.255.255), 至少是 `/24`(255.255.255.0) 或 `/16`(255.255.0.0)。  
- 启动防火墙，因为 LDAP 是非常重要的服务，安全性很重要。  

## 安装和配置

先要设置本机机器名,并配置 DNS，必须保障机器名正确, 因为需要使用 FQDN，两台机器都是一样。

这里以 `ipa.corp.example.com` 为例，`ipa2.corp.example.com` 请修改相应 IP 和 FQDN。

```terminal
# hostnamectl set-hostname ipa.corp.example.com
```

查看一下

```terminal
# hostname
ipa.corp.example.com
```

还要修改 hosts 文件

```terminal
# echo -e "10.11.0.249 ipa.corp.example.com ipa.corp.example.com" >> /etc/hosts
```

## FreeIPA 主服务器

### 安装

需要安装 `ipa-server` 和 `ipa-server-dns`

```terminal
# yum install ipa-server ipa-server-dns
```

接下来输入 FreeIPA 服务端安装命令，这将执行一系列脚本来配置并安装 FreeIPA。

`注意`，如果 corp.example.com 已经注册了外网域名，需要更改，不能重复。

```terminal
# ipa-server-install

The log file for this installation can be found in /var/log/ipaserver-install.log
==============================================================================
This program will set up the IPA Server.

This includes:
  * Configure a stand-alone CA (dogtag) for certificate management
  * Configure the Network Time Daemon (ntpd)
  * Create and configure an instance of Directory Server
  * Create and configure a Kerberos Key Distribution Center (KDC)
  * Configure Apache (httpd)
  * Configure the KDC to enable PKINIT

To accept the default shown in brackets, press the Enter key.

Do you want to configure integrated DNS (BIND)? [no]: yes # 配置 DNS

Enter the fully qualified domain name of the computer
on which you're setting up server software. Using the form
<hostname>.<domainname>
Example: master.example.com.


Server host name [ipa.corp.example.com]: # 回车

Warning: skipping DNS resolution of host ipa.corp.example.com
The domain name has been determined based on the host name.

Please confirm the domain name [corp.example.com]: # 回车

The kerberos protocol requires a Realm name to be defined.
This is typically the domain name converted to uppercase.

Please provide a realm name [CORP.EXAMPLE.COM]: # 回车
Certain directory server operations require an administrative user.
This user is referred to as the Directory Manager and has full access
to the Directory for system management tasks and will be added to the
instance of directory server created for IPA.
The password must be at least 8 characters long.

Directory Manager password: # 输入密码
Password (confirm): # 输入密码

The IPA server requires an administrative user, named 'admin'.
This user is a regular system account used for IPA server administration.

IPA admin password: # 输入密码
Password (confirm): # 输入密码

Checking DNS domain corp.example.com., please wait ...
Do you want to configure DNS forwarders? [yes]: # 回车
Following DNS servers are configured in /etc/resolv.conf: 202.106.0.20
Do you want to configure these servers as DNS forwarders? [yes]: # 回车
All DNS servers from /etc/resolv.conf were added. You can enter additional addresses now:
Enter an IP address for a DNS forwarder, or press Enter to skip: # 回车
Checking DNS forwarders, please wait ...
DNS server 202.106.0.20: answer to query '. SOA' is missing DNSSEC signatures (no RRSIG data)
Please fix forwarder configuration to enable DNSSEC support.
(For BIND 9 add directive "dnssec-enable yes;" to "options {}")
WARNING: DNSSEC validation will be disabled
Do you want to search for missing reverse zones? [yes]: # 回车

The IPA Master Server will be configured with:
Hostname:       ipa.corp.example.com
IP address(es): 10.11.0.248
Domain name:    corp.example.com
Realm name:     CORP.EXAMPLE.COM

BIND DNS server will be configured to serve IPA domain with:
Forwarders:       202.106.0.20
Forward policy:   only
Reverse zone(s):  No reverse zone

Continue to configure the system with these values? [no]: yes # 确认选择
```

接下来输出的是安装的日志

```
The following operations may take some minutes to complete.
Please wait until the prompt is returned.

Configuring NTP daemon (ntpd)
  [1/4]: stopping ntpd
  [2/4]: writing configuration
  [3/4]: configuring ntpd to start on boot
  [4/4]: starting ntpd
Done configuring NTP daemon (ntpd).
Configuring directory server (dirsrv). Estimated time: 30 seconds
  [1/44]: creating directory server instance
  [2/44]: enabling ldapi
  [3/44]: configure autobind for root
  [4/44]: stopping directory server
  [5/44]: updating configuration in dse.ldif
  [6/44]: starting directory server
  [7/44]: adding default schema
  [8/44]: enabling memberof plugin
  [9/44]: enabling winsync plugin
  [10/44]: configuring replication version plugin
  [11/44]: enabling IPA enrollment plugin
  [12/44]: configuring uniqueness plugin
  [13/44]: configuring uuid plugin
  [14/44]: configuring modrdn plugin
  [15/44]: configuring DNS plugin
  [16/44]: enabling entryUSN plugin
  [17/44]: configuring lockout plugin
  [18/44]: configuring topology plugin
  [19/44]: creating indices
  [20/44]: enabling referential integrity plugin
  [21/44]: configuring certmap.conf
  [22/44]: configure new location for managed entries
  [23/44]: configure dirsrv ccache
  [24/44]: enabling SASL mapping fallback
  [25/44]: restarting directory server
  [26/44]: adding sasl mappings to the directory
  [27/44]: adding default layout
  [28/44]: adding delegation layout
  [29/44]: creating container for managed entries
  [30/44]: configuring user private groups
  [31/44]: configuring netgroups from hostgroups
  [32/44]: creating default Sudo bind user
  [33/44]: creating default Auto Member layout
  [34/44]: adding range check plugin
  [35/44]: creating default HBAC rule allow_all
  [36/44]: adding entries for topology management
  [37/44]: initializing group membership
  [38/44]: adding master entry
  [39/44]: initializing domain level
  [40/44]: configuring Posix uid/gid generation
  [41/44]: adding replication acis
  [42/44]: activating sidgen plugin
  [43/44]: activating extdom plugin
  [44/44]: configuring directory to start on boot
Done configuring directory server (dirsrv).
Configuring Kerberos KDC (krb5kdc)
  [1/10]: adding kerberos container to the directory
  [2/10]: configuring KDC
  [3/10]: initialize kerberos container
  [4/10]: adding default ACIs
  [5/10]: creating a keytab for the directory
  [6/10]: creating a keytab for the machine
  [7/10]: adding the password extension to the directory
  [8/10]: creating anonymous principal
  [9/10]: starting the KDC
  [10/10]: configuring KDC to start on boot
Done configuring Kerberos KDC (krb5kdc).
Configuring kadmin
  [1/2]: starting kadmin 
  [2/2]: configuring kadmin to start on boot
Done configuring kadmin.
Configuring ipa-custodia
  [1/5]: Making sure custodia container exists
  [2/5]: Generating ipa-custodia config file
  [3/5]: Generating ipa-custodia keys
  [4/5]: starting ipa-custodia 
  [5/5]: configuring ipa-custodia to start on boot
Done configuring ipa-custodia.
Configuring certificate server (pki-tomcatd). Estimated time: 3 minutes
  [1/28]: configuring certificate server instance
  [2/28]: exporting Dogtag certificate store pin
  [3/28]: stopping certificate server instance to update CS.cfg
  [4/28]: backing up CS.cfg
  [5/28]: disabling nonces
  [6/28]: set up CRL publishing
  [7/28]: enable PKIX certificate path discovery and validation
  [8/28]: starting certificate server instance
  [9/28]: configure certmonger for renewals
  [10/28]: requesting RA certificate from CA
  [11/28]: setting audit signing renewal to 2 years
  [12/28]: restarting certificate server
  [13/28]: publishing the CA certificate
  [14/28]: adding RA agent as a trusted user
  [15/28]: authorizing RA to modify profiles
  [16/28]: authorizing RA to manage lightweight CAs
  [17/28]: Ensure lightweight CAs container exists
  [18/28]: configure certificate renewals
  [19/28]: configure Server-Cert certificate renewal
  [20/28]: Configure HTTP to proxy connections
  [21/28]: restarting certificate server
  [22/28]: updating IPA configuration
  [23/28]: enabling CA instance
  [24/28]: migrating certificate profiles to LDAP
  [25/28]: importing IPA certificate profiles
  [26/28]: adding default CA ACL
  [27/28]: adding 'ipa' CA entry
  [28/28]: configuring certmonger renewal for lightweight CAs
Done configuring certificate server (pki-tomcatd).
Configuring directory server (dirsrv)
  [1/3]: configuring TLS for DS instance
  [2/3]: adding CA certificate entry
  [3/3]: restarting directory server
Done configuring directory server (dirsrv).
Configuring ipa-otpd
  [1/2]: starting ipa-otpd 
  [2/2]: configuring ipa-otpd to start on boot
Done configuring ipa-otpd.
Configuring the web interface (httpd)
  [1/22]: stopping httpd
  [2/22]: setting mod_nss port to 443
  [3/22]: setting mod_nss cipher suite
  [4/22]: setting mod_nss protocol list to TLSv1.0 - TLSv1.2
  [5/22]: setting mod_nss password file
  [6/22]: enabling mod_nss renegotiate
  [7/22]: disabling mod_nss OCSP
  [8/22]: adding URL rewriting rules
  [9/22]: configuring httpd
  [10/22]: setting up httpd keytab
  [11/22]: configuring Gssproxy
  [12/22]: setting up ssl
  [13/22]: configure certmonger for renewals
  [14/22]: importing CA certificates from LDAP
  [15/22]: publish CA cert
  [16/22]: clean up any existing httpd ccaches
  [17/22]: configuring SELinux for httpd
  [18/22]: create KDC proxy config
  [19/22]: enable KDC proxy
  [20/22]: starting httpd
  [21/22]: configuring httpd to start on boot
  [22/22]: enabling oddjobd
Done configuring the web interface (httpd).
Configuring Kerberos KDC (krb5kdc)
  [1/1]: installing X509 Certificate for PKINIT
Done configuring Kerberos KDC (krb5kdc).
Applying LDAP updates
Upgrading IPA:. Estimated time: 1 minute 30 seconds
  [1/10]: stopping directory server
  [2/10]: saving configuration
  [3/10]: disabling listeners
  [4/10]: enabling DS global lock
  [5/10]: disabling Schema Compat
  [6/10]: starting directory server
  [7/10]: upgrading server
  [8/10]: stopping directory server
  [9/10]: restoring configuration
  [10/10]: starting directory server
Done.
Restarting the KDC
Configuring DNS (named)
  [1/11]: generating rndc key file
  [2/11]: adding DNS container
  [3/11]: setting up our zone
  [4/11]: setting up our own record
  [5/11]: setting up records for other masters
  [6/11]: adding NS record to the zones
  [7/11]: setting up kerberos principal
  [8/11]: setting up named.conf
  [9/11]: setting up server configuration
  [10/11]: configuring named to start on boot
  [11/11]: changing resolv.conf to point to ourselves
Done configuring DNS (named).
Restarting the web server to pick up resolv.conf changes
Configuring DNS key synchronization service (ipa-dnskeysyncd)
  [1/7]: checking status
  [2/7]: setting up bind-dyndb-ldap working directory
  [3/7]: setting up kerberos principal
  [4/7]: setting up SoftHSM
  [5/7]: adding DNSSEC containers
  [6/7]: creating replica keys
  [7/7]: configuring ipa-dnskeysyncd to start on boot
Done configuring DNS key synchronization service (ipa-dnskeysyncd).
Restarting ipa-dnskeysyncd
Restarting named
Updating DNS system records
Configuring client side components
Using existing certificate '/etc/ipa/ca.crt'.
Client hostname: ipa.corp.example.com
Realm: CORP.EXAMPLE.COM
DNS Domain: corp.example.com
IPA Server: ipa.corp.example.com
BaseDN: dc=corp,dc=example,dc=com

Skipping synchronizing time with NTP server.
New SSSD config will be created
Configured sudoers in /etc/nsswitch.conf
Configured /etc/sssd/sssd.conf
trying https://ipa.corp.example.com/ipa/json
[try 1]: Forwarding 'schema' to json server 'https://ipa.corp.example.com/ipa/json'
trying https://ipa.corp.example.com/ipa/session/json
[try 1]: Forwarding 'ping' to json server 'https://ipa.corp.example.com/ipa/session/json'
[try 1]: Forwarding 'ca_is_enabled' to json server 'https://ipa.corp.example.com/ipa/session/json'
Systemwide CA database updated.
Adding SSH public key from /etc/ssh/ssh_host_rsa_key.pub
Adding SSH public key from /etc/ssh/ssh_host_ecdsa_key.pub
Adding SSH public key from /etc/ssh/ssh_host_ed25519_key.pub
[try 1]: Forwarding 'host_mod' to json server 'https://ipa.corp.example.com/ipa/session/json'
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
```

### 打开防火墙端口

```terminal
# firewall-cmd --permanent --add-service={freeipa-ldap,freeipa-ldaps,dns}
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
  services: ssh dhcpv6-client freeipa-ldap freeipa-ldaps dns
  ports: 
  protocols: 
  masquerade: no
  forward-ports: 
  sourceports: 
  icmp-blocks: 
  rich rules: 
```

现在 FreeIPA 服务端已经安装完了，端口也开放了，我们需要测试一下

### 测试 FreeIPA 主服务器

查看服务状态

```terminal
# ipactl status
Directory Service: RUNNING
krb5kdc Service: RUNNING
kadmin Service: RUNNING
named Service: RUNNING
httpd Service: RUNNING
ipa-custodia Service: RUNNING
ntpd Service: RUNNING
pki-tomcatd Service: RUNNING
ipa-otpd Service: RUNNING
ipa-dnskeysyncd Service: RUNNING
ipa: INFO: The ipactl command was successful
```


#### 测试 Kerberos

我们需要 Kerberos 的 token

```terminal
# kinit admin
Password for admin@CORP.EXAMPLE.COM:
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
  Principal alias: admin@CORP.EXAMPLE.COM
  UID: 626400000
  GID: 626400000
  Account disabled: False
----------------------------
Number of entries returned 1
----------------------------
```

如果正确，会返回一条记录。

#### Web 服务测试

访问 `https://ipa.corp.example.com`

`注意`:默认使用 https 的证书是自签发的，因此是不被浏览器信任的。如果内部使用，可以不必理会，否则您可以购买该域名相应的证书并配置。

### 证书更新(可选)

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

## FreeIPA 复制服务器

### 先决条件
配置 FreeIPA 复制服务器，需要知道 FreeIPA 主服务器的版本，因为在 4.2（含） 版本以前，配置方式跟 4.3 以后是有区别的。

到`主服务器`上查看一下版本

```terminal
# ipa --version
VERSION: 4.6.4, API_VERSION: 2.230
```

确认一下 domain level

```terminal
# kinit admin
# ipa domainlevel-get
-----------------------
Current domain level: 1
-----------------------
```

本例使用的是 FreeIPA 4.6, 默认的 domain level 是 1 ，如果是 FreeIPA 4.2 以前的复制，不在本例范围。

> `注意`  
> 复制服务器的域名，为 `ipa2.corp.example.com`  
> 主服务器域名为 `ipa.corp.example.com`  

FreeIPA 4.3 版本以后，复制服务安装流程简化，只要两步

- 安装 FreeIPA 客户端
- 安装复制服务 

### 安装 FreeIPA 复制服务器

登录主服务器 Web UI: `https://ipa.corp.example.com` 

1. 选择: 网络服务 -> DNS 区域
2. 添加一个 10.11.0.0/24 的反向区域IP网络
3. 点击 DNS 区域的 corp.example.com 进去这个子域内
4. 增加一条 ipa2.corp.example.com 的 A 记录，并且在 Create reverse 打勾，添加 IP 地址的反向记录

登录复制服务器

1. 登录 `ipa2.corp.exmple.com` 服务器。
2. 设置本机的 DNS 为 ipa.corp.example.com 的 IP。

安装 bind-utils 验证域名

```terminal
# yum install bind-utils
```

验证域名的正向查找

```terminal
# dig +short ipa2.corp.example.com A
```

返回了 `your_replica_server_ipv4`，确认一下是否正确

验证域名的反向查找

```
# dig +short -x your_replica_server_ipv4
ipa2.corp.example.com
```

返回了域名 `ipa2.corp.example.com`，确认一下是否正确

### 安装 FreeIPA Client

安装 FreeIPA 客户端

```terminal
# yum install ipa-client
```

接下来执行 FreeIPA 客户端安装命令，带上参数 `--mkhomedir`(如果用户登录，默认会创建用户的家目录）

```
# ipa-client-install --mkhomedir
Discovery was successful!
Client hostname: ipa2.corp.example.com
Realm: CORP.EXAMPLE.COM
DNS Domain: corp.example.com
IPA Server: ipa.corp.example.com
BaseDN: dc=corp,dc=example,dc=com

Continue to configure the system with these values? [no]: yes # 确认配置
Synchronizing time with KDC...
Attempting to sync time using ntpd.  Will timeout after 15 seconds
User authorized to enroll computers: admin # 输入admin
Password for admin@CORP.EXAMPLE.COM: # 输入密码
Successfully retrieved CA cert
    Subject:     CN=Certificate Authority,O=CORP.EXAMPLE.COM
    Issuer:      CN=Certificate Authority,O=CORP.EXAMPLE.COM
    Valid From:  2019-04-28 13:48:38
    Valid Until: 2039-04-28 13:48:38

Enrolled in IPA realm CORP.EXAMPLE.COM
Created /etc/ipa/default.conf
New SSSD config will be created
Configured sudoers in /etc/nsswitch.conf
Configured /etc/sssd/sssd.conf
Configured /etc/krb5.conf for IPA realm CORP.CEDEX.CN
trying https://ipa.corp.example.com/ipa/json
[try 1]: Forwarding 'schema' to json server 'https://ipa.corp.example.com/ipa/json'
trying https://ipa.corp.example.com/ipa/session/json
[try 1]: Forwarding 'ping' to json server 'https://ipa.corp.example.com/ipa/session/json'
[try 1]: Forwarding 'ca_is_enabled' to json server 'https://ipa.corp.example.com/ipa/session/json'
Systemwide CA database updated.
Adding SSH public key from /etc/ssh/ssh_host_rsa_key.pub
Adding SSH public key from /etc/ssh/ssh_host_ecdsa_key.pub
Adding SSH public key from /etc/ssh/ssh_host_ed25519_key.pub
[try 1]: Forwarding 'host_mod' to json server 'https://ipa.corp.example.com/ipa/session/json'
SSSD enabled
Configured /etc/openldap/ldap.conf
NTP enabled
Configured /etc/ssh/ssh_config
Configured /etc/ssh/sshd_config
Configuring corp.example.com as NIS domain.
Client configuration complete.
The ipa-client-install command was successful
```

至此 FreeIPA 客户端安装完成，这个服务器受 FreeIPA 服务端管理了

### 安装和配置 FreeIPA Replica

安装 FreeIPA 服务端组件

```terminal
# yum install ipa-server ipa-server-dns
```

首先打开复制服务器防火墙端口

```terminal
# firewall-cmd --permanent --add-service={freeipa-ldap,freeipa-ldaps,freeipa-replication,dns}
success
# firewall-cmd --reload
success
```

查看防火墙打开的服务

```terminal
# firewall-cmd --list-all
public (active)
  target: default
  icmp-block-inversion: no
  interfaces: enp0s3
  sources: 
  services: ssh dhcpv6-client freeipa-ldap freeipa-ldaps freeipa-replication dns
  ports: 
  protocols: 
  masquerade: no
  forward-ports: 
  source-ports: 
  icmp-blocks: 
  rich rules:
```

执行 FreeIPA 复制服务的安装命令

```
# ipa-replica-install
Run connection check to master
Connection check OK
Configuring NTP daemon (ntpd)
  [1/4]: stopping ntpd
  [2/4]: writing configuration
  [3/4]: configuring ntpd to start on boot
  [4/4]: starting ntpd
Done configuring NTP daemon (ntpd).
Configuring directory server (dirsrv). Estimated time: 30 seconds
  [1/41]: creating directory server instance
  [2/41]: enabling ldapi
  [3/41]: configure autobind for root
  [4/41]: stopping directory server
  [5/41]: updating configuration in dse.ldif
  [6/41]: starting directory server
  [7/41]: adding default schema
  [8/41]: enabling memberof plugin
  [9/41]: enabling winsync plugin
  [10/41]: configuring replication version plugin
  [11/41]: enabling IPA enrollment plugin
  [12/41]: configuring uniqueness plugin
  [13/41]: configuring uuid plugin
  [14/41]: configuring modrdn plugin
  [15/41]: configuring DNS plugin
  [16/41]: enabling entryUSN plugin
  [17/41]: configuring lockout plugin
  [18/41]: configuring topology plugin
  [19/41]: creating indices
  [20/41]: enabling referential integrity plugin
  [21/41]: configuring certmap.conf
  [22/41]: configure new location for managed entries
  [23/41]: configure dirsrv ccache
  [24/41]: enabling SASL mapping fallback
  [25/41]: restarting directory server
  [26/41]: creating DS keytab
  [27/41]: ignore time skew for initial replication
  [28/41]: setting up initial replication
Starting replication, please wait until this has completed.
Update in progress, 9 seconds elapsed
Update succeeded

  [29/41]: prevent time skew after initial replication
  [30/41]: adding sasl mappings to the directory
  [31/41]: updating schema
  [32/41]: setting Auto Member configuration
  [33/41]: enabling S4U2Proxy delegation
  [34/41]: initializing group membership
  [35/41]: adding master entry
  [36/41]: initializing domain level
  [37/41]: configuring Posix uid/gid generation
  [38/41]: adding replication acis
  [39/41]: activating sidgen plugin
  [40/41]: activating extdom plugin
  [41/41]: configuring directory to start on boot
Done configuring directory server (dirsrv).
Configuring Kerberos KDC (krb5kdc)
  [1/5]: configuring KDC
  [2/5]: adding the password extension to the directory
  [3/5]: creating anonymous principal
  [4/5]: starting the KDC
  [5/5]: configuring KDC to start on boot
Done configuring Kerberos KDC (krb5kdc).
Configuring kadmin
  [1/2]: starting kadmin 
  [2/2]: configuring kadmin to start on boot
Done configuring kadmin.
Configuring directory server (dirsrv)
  [1/3]: configuring TLS for DS instance
  [2/3]: importing CA certificates from LDAP
  [3/3]: restarting directory server
Done configuring directory server (dirsrv).
Configuring the web interface (httpd)
  [1/22]: stopping httpd
  [2/22]: setting mod_nss port to 443
  [3/22]: setting mod_nss cipher suite
  [4/22]: setting mod_nss protocol list to TLSv1.0 - TLSv1.2
  [5/22]: setting mod_nss password file
  [6/22]: enabling mod_nss renegotiate
  [7/22]: disabling mod_nss OCSP
  [8/22]: adding URL rewriting rules
  [9/22]: configuring httpd
  [10/22]: setting up httpd keytab
  [11/22]: configuring Gssproxy
  [12/22]: setting up ssl
  [13/22]: configure certmonger for renewals
  [14/22]: importing CA certificates from LDAP
  [15/22]: publish CA cert
  [16/22]: clean up any existing httpd ccaches
  [17/22]: configuring SELinux for httpd
  [18/22]: create KDC proxy config
  [19/22]: enable KDC proxy
  [20/22]: starting httpd
  [21/22]: configuring httpd to start on boot
  [22/22]: enabling oddjobd
Done configuring the web interface (httpd).
Configuring ipa-otpd
  [1/2]: starting ipa-otpd 
  [2/2]: configuring ipa-otpd to start on boot
Done configuring ipa-otpd.
Configuring ipa-custodia
  [1/4]: Generating ipa-custodia config file
  [2/4]: Generating ipa-custodia keys
  [3/4]: starting ipa-custodia 
  [4/4]: configuring ipa-custodia to start on boot
Done configuring ipa-custodia.
Configuring certificate server (pki-tomcatd)
  [1/2]: configure certmonger for renewals
  [2/2]: Importing RA key
Done configuring certificate server (pki-tomcatd).
Configuring Kerberos KDC (krb5kdc)
  [1/1]: installing X509 Certificate for PKINIT
Done configuring Kerberos KDC (krb5kdc).
Applying LDAP updates
Upgrading IPA:. Estimated time: 1 minute 30 seconds
  [1/10]: stopping directory server
  [2/10]: saving configuration
  [3/10]: disabling listeners
  [4/10]: enabling DS global lock
  [5/10]: disabling Schema Compat
  [6/10]: starting directory server
  [7/10]: upgrading server
  [8/10]: stopping directory server
  [9/10]: restoring configuration
  [10/10]: starting directory server
Done.
Finalize replication settings
Restarting the KDC

WARNING: The CA service is only installed on one server (ipa.corp.example.com).
It is strongly recommended to install it on another server.
Run ipa-ca-install(1) on another master to accomplish this.
```

FreeIPA 复制服务，安装完成。

`注意`，FreeIPA 的复制属于主主复制，即两个服务器都是主节点，会将更改相互发送给其他节点。


### 安装 FreeIPA CA 复制服务

FreeIPA Replia 安装的最后，可以看到提示： CA 服务只装在一台服务器上，建议运行 `ipa-ca-install` 命令。

```terminal
# ipa-ca-install
Directory Manager (existing master) password: # 输入密码

Run connection check to master
Connection check OK
Configuring certificate server (pki-tomcatd). Estimated time: 3 minutes
  [1/26]: creating certificate server db
  [2/26]: setting up initial replication
Starting replication, please wait until this has completed.
Update in progress, 8 seconds elapsed
Update succeeded

  [3/26]: creating ACIs for admin
  [4/26]: creating installation admin user
  [5/26]: configuring certificate server instance
  [6/26]: exporting Dogtag certificate store pin
  [7/26]: stopping certificate server instance to update CS.cfg
  [8/26]: backing up CS.cfg
  [9/26]: disabling nonces
  [10/26]: set up CRL publishing
  [11/26]: enable PKIX certificate path discovery and validation
  [12/26]: destroying installation admin user
  [13/26]: starting certificate server instance
  [14/26]: Finalize replication settings
  [15/26]: setting audit signing renewal to 2 years
  [16/26]: restarting certificate server
  [17/26]: authorizing RA to modify profiles
  [18/26]: authorizing RA to manage lightweight CAs
  [19/26]: Ensure lightweight CAs container exists
  [20/26]: configure certificate renewals
  [21/26]: configure Server-Cert certificate renewal
  [22/26]: Configure HTTP to proxy connections
  [23/26]: restarting certificate server
  [24/26]: updating IPA configuration
  [25/26]: enabling CA instance
  [26/26]: configuring certmonger renewal for lightweight CAs
Done configuring certificate server (pki-tomcatd).
Updating DNS system records
```

至此，FreeIPA CA 复制服务安装完成。

查看服务状态

```terminal
# ipactl status
Directory Service: RUNNING
krb5kdc Service: RUNNING
kadmin Service: RUNNING
httpd Service: RUNNING
ipa-custodia Service: RUNNING
ntpd Service: RUNNING
pki-tomcatd Service: RUNNING
ipa-otpd Service: RUNNING
ipa: INFO: The ipactl command was successful
```

可以看到目前有 8 个服务启动，但是跟主服务器少了 `named Service` 和 `ipa-dnskeysyncd Service`, 接下来安装 dns 服务。


### 安装 FreeIPA DNS 复制服务

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

Do you want to configure DNS forwarders? [yes]: yes # 输入
Following DNS servers are configured in /etc/resolv.conf: 10.11.0.249
Do you want to configure these servers as DNS forwarders? [yes]: yes # 输入
All DNS servers from /etc/resolv.conf were added. You can enter additional addresses now:
Enter an IP address for a DNS forwarder, or press Enter to skip: # 输入回车
Checking DNS forwarders, please wait ...
DNS server 10.11.0.249: answer to query '. SOA' is missing DNSSEC signatures (no RRSIG data)
Please fix forwarder configuration to enable DNSSEC support.
(For BIND 9 add directive "dnssec-enable yes;" to "options {}")
DNS server 8.8.8.8: answer to query '. SOA' is missing DNSSEC signatures (no RRSIG data)
Please fix forwarder configuration to enable DNSSEC support.
(For BIND 9 add directive "dnssec-enable yes;" to "options {}")
WARNING: DNSSEC validation will be disabled
Do you want to search for missing reverse zones? [yes]: # 输入回车

The following operations may take some minutes to complete.
Please wait until the prompt is returned.

Configuring DNS (named)
  [1/8]: generating rndc key file
  [2/8]: setting up our own record
  [3/8]: adding NS record to the zones
  [4/8]: setting up kerberos principal
  [5/8]: setting up named.conf
  [6/8]: setting up server configuration
  [7/8]: configuring named to start on boot
  [8/8]: changing resolv.conf to point to ourselves
Done configuring DNS (named).
Restarting the web server to pick up resolv.conf changes
Configuring DNS key synchronization service (ipa-dnskeysyncd)
  [1/7]: checking status
  [2/7]: setting up bind-dyndb-ldap working directory
  [3/7]: setting up kerberos principal
  [4/7]: setting up SoftHSM
  [5/7]: adding DNSSEC containers
  [6/7]: creating replica keys
  [7/7]: configuring ipa-dnskeysyncd to start on boot
Done configuring DNS key synchronization service (ipa-dnskeysyncd).
Restarting ipa-dnskeysyncd
Restarting named
Updating DNS system records
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

查看服务状态

```terminal
# ipactl status
Directory Service: RUNNING
krb5kdc Service: RUNNING
kadmin Service: RUNNING
named Service: RUNNING
httpd Service: RUNNING
ipa-custodia Service: RUNNING
ntpd Service: RUNNING
pki-tomcatd Service: RUNNING
ipa-otpd Service: RUNNING
ipa-dnskeysyncd Service: RUNNING
ipa: INFO: The ipactl command was successful
```

可以看到，主服务器与复制服务器现在的服务都一致了，主要的三个服务(CA, DNS, NTP)都在进行复制。 

### 查看 FreeIPA 复制服务

可以登录主服务器 `https://ipa.corp.example.com` 之后进入 IPA Server 选项，之后进入 Topology 查看。可以看到 ca 和 domain 的复制都是再进行的。

同样的，可以登录 `https://ipa2.corp.example.com` 因为两个系统是同步的，所以内容是一样的。

或者使用命令行验证

登录主服务器 `ipa.corp.example.com`

```terminal
# ipa-replica-manage list
Directory Manager password: # 输入密码

ipa.corp.example.com: master
ipa2.corp.example.com: master
```

可以看到两个都是主节点。

接下来查看复制情况，先查看 `ipa.corp.example.com` 的复制情况

```terminal
# ipa-replica-manage list -v ipa.corp.example.com
ipa2.corp.example.com: replica
  last init status: Error (0) Total update succeeded
  last init ended: 2019-05-08 05:19:59+00:00
  last update status: Error (0) Replica acquired successfully: Incremental update succeeded
  last update ended: 2019-05-09 12:01:23+00:00
```

可以看到，`ipa2.corp.example.com` 是 `ipa.corp.example.com` 的复制节点。

再查看 `ipa2.corp.example.com` 的复制情况

```terminal
# ipa-replica-manage list -v ipa2.corp.example.com
ipa.corp.example.com: replica
  last init status: None
  last init ended: 1970-01-01 00:00:00+00:00
  last update status: Error (0) Replica acquired successfully: Incremental update succeeded
  last update ended: 2019-05-09 12:01:17+00:00
```
可以看到 `ipa.corp.example.com` 是 `ipa2.corp.example.com` 的复制节点。

说明两台服务器都是主节点，并且都是对方的复制节点。

## 其他

使用 Chrom 登录 Web UI 会碰到 2 次输入用户名和密码，自助服务时（如修改密码）这会迷惑用户。

解决方法如下：

登录 IPA 服务器

```terminal
# vi /etc/httpd/conf.d/ipa-rewrite.conf
```

在最后加上如下

```terminal
# The following disables the annoying kerberos popup for Chrome
RewriteCond %{HTTP_COOKIE} !ipa_session
RewriteCond %{HTTP_REFERER} ^(.+)/ipa/ui/$
RewriteRule ^/ipa/session/json$ - [R=401,L]
RedirectMatch 401 ^/ipa/session/login_kerberos
```

这样登录服务器的时候就不会有弹出窗口了。具体解释可以参考 [Fixing the annoying popup in FreeIPA][4] 

## 结束语

本例介绍 FreeIPA 的安装过程，主要包含了Kerberos，DNS, LDAP, NTP 等基础服务。

1. Auth-A 服务可以方便管理 CentOS 服务器的认证，FreeIPA 集成了 Kerberos，SSSD。
2. Auth-Z 服务可以方便管理 CentOS 服务器的授权，FreeIPA 集成了 Kerberos，SSSD。
3. CA 服务可以方便管理企业的证书，FreeIPA 集成了 Dogtag。
4. NTP 服务可以方便时间同步，FreeIPA 集成了 ntpd。
5. LDAP 服务可以同意管理用户名和密码以及与其他子系统集成， FreeIPA 集成了 389 Directory Server。
6. DNS 服务可以方便管理内部域名, FreeIPA 集成了 bind。

FreeIPA 有友好的 CLI 和 Web UI，使用起来非常方便。

## 参考资料
[CentOS 7 配置 Free IPA 主从复制（本地已有 DNS 服务）][1]  
[How to Install FreeIPA Server on CentOS 7][2]  
[FreeIPA Workshop][3]  
  
[1]: https://qizhanming.com/blog/2017/06/07/how-to-config-freeipa-server-and-replica-on-centos-7  
[2]: https://computingforgeeks.com/install-freeipa-server-centos-7/  
[3]: https://github.com/freeipa/freeipa-workshop  
[4]: http://jdshewey.blogspot.com/2017/08/fixing-annoying-popup-in-freeipa.html  
