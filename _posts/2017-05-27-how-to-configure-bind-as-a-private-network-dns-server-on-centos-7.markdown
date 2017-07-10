---
layout: post
title: CentOS 7 使用 bind 配置私有网络的 DNS
categories: [Linux]
tags: [centos, bind, DNS]
summary: CentOS 7 使用 bind 配置私有网络的 DNS，记录一下大致的安装和配置过程。
---
## 前言

CentOS 7 使用 bind 配置私有网络的 DNS，记录一下大致的安装和配置过程。

DNS (Domain Name Service) 域名服务是计算机网络很基础的服务，一般如果局域网内计算机多了，可以考虑搭建一个内网 DNS，将 IP 地址转换为名字，这样记起来更容易。

参考 [How To Configure BIND as a Private Network DNS Server on CentOS 7][1]  

## 环境说明
CentOS 7（Minimal Install）

### 样例说明

本例需要 4 台服务器

	10.11.0.199 ns1
	10.11.0.209 ns2
	10.11.0.101 host1
	10.11.0.102 host2

ns1 为主 DNS，ns2 为次 DNS，host1，host2 分别为注册的主机（`注意: host1, host2 不是机器名，因为机器名跟 DNS 没关系，host1, host2 是 DNS 里配置的`）

具体说明如下：

- 我们使用 2 个服务器 host1  和 host2
- 服务器在一个机房内，本例为北京机房(bj1 datacenter)
- 机房内的服务器网络是相互联通的（本例都在 10.11.0.0/16 子网内）
- 本机房使用 example.com 这个域名（`实际情况请自行更改，注意最好使用自己的域名，这样可以保障不会出现重复等冲突`）

| Host | Role  | Private FQDN         | Private IP Address |
|------|-------|----------------------|--------------------|
| host1| Host  |host1.bj1.example.com |10.11.0.101         |
| host2| Host  |host2.bj1.example.com |10.11.0.102         |

注意：请根据实际情况更改域名和 IP 。
## 目的说明
我们最终搭建主 DNS 服务器 ns1 和次 DNS服务器 ns2。

列表如下：

| Host | Role           | Private FQDN         | Private IP Address |
|------|----------------|----------------------|--------------------|
| ns1  | Primary DNS    |ns1.bj1.example.com   |10.11.0.199         |
| ns2  | Secondary DNS  |ns2.bj1.example.com   |10.11.0.209         |


## 安装和配置
### 更新系统

```terminal
$ sudo yum update
```

版本如下

```terminal
$ cat /etc/redhat-release
CentOS Linux release 7.3.1611 (Core)
```

### 安装 bind
DNS 服务器都需要安装 bind。

```terminal
$ sudo yum install bind bind-utils
```

安装之后，开始配置主 DNS 服务器。

### 配置主 DNS 服务器
BIND 包含很多配置文件，在 named.conf 中配置。这些配置文件都是以 "named" 开头，这样 BIND 程序要求的。

#### 配置 bind
BIND 进程名叫 named。 所以，很多文件名都是 named 而不是 bind。

进入 ns1 服务器，编辑 named.conf

```terminal
$ sudo vi /etc/named.conf
```

在 options 块前面，创建一个 ACL（Access Control List） 块,名称为 “trusted”。我们使用这个控制局域网内哪些计算机可以使用我们这个域名服务进行递归域名查询。本例将添加 ns1, ns2, host1, host2作为信任的客户机。

```conf
acl "trusted" {
	10.11.0.199;  # ns1 - can be set to localhost
	10.11.0.209;  # ns2
	10.11.0.101;  # host1
	10.11.0.102;  # host2
};
```

现在我们有了信任列表，需要修改 options 块，添加 ns1 的私有 IP 地址到 `listen-on port 53`，注释掉 `listen-on-v6` 这行.

```conf
options {
	listen-on port 53 { 127.0.0.1; 10.11.0.199; };
#	 listen-on-v6 port 53 { ::1; };
...
```

在下面的条目下，我们还要添加 `allow-transfer` 条目，设置为 ns2 的地址。修改 `allow-query` 从 localhost 改为 trusted。

```conf
...
options {
...
	allow-transfer { 10.11.0.209; };      # disable zone transfers by default
...
	allow-query { trusted; };  # allows queries from "trusted" clients
...
```

在文件的最后，添加这一行

```conf
include "/etc/named/named.conf.local";
```

保存 `:wq` 之后，看起来是这样的

```conf
acl "trusted" {
	10.11.0.199;    # ns1 - can be set to localhost
	10.11.0.209;    # ns2
	10.11.0.101;    # host1
	10.11.0.102;    # host2
};
options {
	listen-on port 53 { 127.0.0.1; 10.11.0.199; };
	# listen-on-v6 port 53 { ::1; };
	directory 	"/var/named";
	dump-file 	"/var/named/data/cache_dump.db";
	statistics-file "/var/named/data/named_stats.txt";
	memstatistics-file "/var/named/data/named_mem_stats.txt";
	allow-transfer	{ 10.11.0.209; }; # disable zone transfers by default
	allow-query     { trusted; }; # allows queries from "trusted" clients

	recursion yes;
	dnssec-enable yes;
	dnssec-validation yes;
	bindkeys-file "/etc/named.iscdlv.key";

	managed-keys-directory "/var/named/dynamic";

	pid-file "/run/named/named.pid";
	session-keyfile "/run/named/session.key";
};

logging {
	channel default_debug {
		file "data/named.run";
		severity dynamic;
	};
};

zone "." IN {
	type hint;
	file "named.ca";
};

include "/etc/named.rfc1912.zones";
include "/etc/named.root.key";
include "/etc/named/named.conf.local";
```

接下来，我们需要新建 named.conf.local 配置 DNS 域

#### 配置本地文件
在 ns1 服务器，配置 named.conf.local

```terminal
$ sudo vi /etc/named/named.conf.local
```

我们将本地配置都放到 `/etc/named` 文件夹下，在这个配置中指定正向和反向的域。

添加正向域

```conf
zone "bj1.example.com" {
	type master;
	file "/etc/named/zones/db.bj1.example.com"; # zone file path
};
```

假设我们的私有子网为 10.11.0.0/16 则需要添加如下反向配置(`注意` 我们的反向域的名称以 11.10 开始，这正好是 10.11 八进制反过来)

```conf
zone "11.10.in-addr.arpa" {
    type master;
    file "/etc/named/zones/db.10.11";  # 10.11.0.0/16 subnet
};
```

保存 `:wq` 之后，这个文件看起来是这样的

```conf
zone "bj1.example.com" {
    type master;
    file "/etc/named/zones/db.bj1.example.com"; # zone file path
};
zone "11.10.in-addr.arpa" {
    type master;
    file "/etc/named/zones/db.10.11";  # 10.11.0.0/16 subnet
};
```

如果还有其他子网，则将每个网段都加入到这个文件中，在添加其他域 `zone` 的配置。

现在域文件指定了，我们就按照这个配置，新建正向域和反向域的文件。

#### 创建正向域文件
正向域文件会定义正向的 DNS 查找（即：根据域名查找 IP， 如 DNS 收到查找 host1.bj1.example.com 的请求，进行查找，之后返回 host1 的 IP 地址）。

根据配置文件，需要新建 `/etc/named/zones` 文件夹

```terminal
$ sudo chmod 755 /etc/named
$ sudo mkdir /etc/named/zones
```

我们开始编辑正向域文件

```terminal
$ sudo vi /etc/named/zones/db.bj1.example.com
```

首先，要添加一条 SOA 记录 （起始授权机构）。***注意替换为您自己的域名***，每次编辑文件，请增加 Serial 的值，之后再重启 named 服务，因为如果数字不增加，次 DNS 不会同步更新配置，本例中 Serial 的值为 3 (RFC1912 2.2建议的格式为YYYYMMDDnn 其中nn为修订号;)。

```conf
$TTL	604800
@       IN      SOA     ns1.bj1.example.com. admin.bj1.example.com. (
		      3     ; Serial
		 604800     ; Refresh
		  86400     ; Retry
		2419200     ; Expire
		 604800 )   ; Negative Cache TTL
```

之后，我们需要添加 NS 记录。

```conf
; name servers - NS records
	IN      NS      ns1.bj1.example.com.
	IN      NS      ns2.bj1.example.com.
```

之后，我们添加 A 记录，进行域名和 IP 地址的映射

```conf
; name servers - A records
ns1.bj1.example.com.          IN      A      10.11.0.199
ns2.bj1.example.com.          IN      A      10.11.0.209

; 10.11.0.0/16 - A records
host1.bj1.example.com.        IN      A      10.11.0.101
host2.bj1.example.com.        IN      A      10.11.0.102
```

保存 `:wq` 之后，这个文件 `db.bj1.example.com` 看起来是这样的

```conf
$TTL	604800
@       IN      SOA     ns1.bj1.example.com. admin.bj1.example.com. (
		      3     ; Serial
		 604800     ; Refresh
		  86400     ; Retry
		2419200     ; Expire
		 604800 )   ; Negative Cache TTL

; name servers - NS records
		IN      NS      ns1.bj1.example.com.
		IN      NS      ns2.bj1.example.com.

; name servers - A records
ns1.bj1.example.com.          IN      A      10.11.0.199
ns2.bj1.example.com.          IN      A      10.11.0.209

; 10.11.0.0/16 - A records
host1.bj1.example.com.        IN      A      10.11.0.101
host2.bj1.example.com.        IN      A      10.11.0.102
```

#### 创建反向域文件
反向域文件，主要是 DNS 中的 PTR 记录进行 DNS 查找（即通过 IP 查找域名， 如本例中，DNS 收到查找 `10.11.0.101` 的请求，进行查找，返回 `host1.bj1.example.com` 这个域名）

本例在 `named.conf.local` 配置文件中，只配置了一个 IP 地址段，所以，只建立一个反向域文件示例。

```conf
$ sudo vi /etc/named/zones/db.10.11
```

与正向域文件一样，要添加一条 SOA 记录 （起始授权机构）。***注意替换为您自己的域名***，每次编辑文件，请增加 Serial 的值，之后再重启 named 服务。

```conf
$TTL	604800
@       IN      SOA     ns1.bj1.example.com. admin.bj1.example.com. (
		      3         ; Serial
		 604800         ; Refresh
		  86400         ; Retry
		2419200         ; Expire
		 604800 )       ; Negative Cache TTL
```

之后，添加 NS 记录

```conf
; name servers - NS records
      IN      NS      ns1.bj1.example.com.
      IN      NS      ns2.bj1.example.com.
```

之后，添加 PTR 记录，注意第一列的 2 个字节是内网地址后两位的反向顺序。

```conf
; PTR Records
199.0 IN      PTR     ns1.bj1.example.com.    ; 10.11.0.199
209.0 IN      PTR     ns2.bj1.example.com.    ; 10.11.0.209
101.0 IN      PTR     host1.bj1.example.com.  ; 10.11.0.101
102.0 IN      PTR     host2.bj1.example.com.  ; 10.11.0.102
```

保存 `:wq` 之后，这个文件 `db.10.11` 看起来是这样的

```conf
$TTL	604800
@       IN      SOA     ns1.bj1.example.com. admin.bj1.example.com. (
	      3         ; Serial
	 604800         ; Refresh
	  86400         ; Retry
	2419200         ; Expire
	 604800 )       ; Negative Cache TTL

; name servers - NS records
			IN      NS      ns1.bj1.example.com.
			IN      NS      ns2.bj1.example.com.

; PTR Records
199.0 IN      PTR     ns1.bj1.example.com.    ; 10.11.0.199
209.0 IN      PTR     ns2.bj1.example.com.    ; 10.11.0.209
101.0 IN      PTR     host1.bj1.example.com.  ; 10.11.0.101
102.0 IN      PTR     host2.bj1.example.com.  ; 10.11.0.102
```

#### 检查 bind 配置
使用 `named-checkconf` 命令检查 `named.conf*` 文件

```terminal
$ sudo named-checkconf
```

如果有错误，会返回错误的提示，请根据提示进行查找问题和修正。

使用 `named-checkzone` 命令检查域文件语法是否错误

例如，检查正向域文件配置

```terminal
$ sudo named-checkzone bj1.example.com /etc/named/zones/db.bj1.example.com
```

检查反向域文件配置

```terminal
$ sudo named-checkzone 11.10.in-addr.arpa /etc/named/zones/db.10.11
```

如果检查没有问题，可以重启 bind 服务

#### 启动 bind 服务
启动

```terminal
$ sudo systemctl start named
```

设置开机启动

```terminal
$ sudo systemctl enable named
```

#### 防火墙开放端口
BIND 默认使用 53 端口，使用 TCP 和 UDP 协议，我们需要再防火墙开放这两个端口。

```terminal
$ sudo firewall-cmd --zone=public --permanent --add-port=53/tcp
$ sudo firewall-cmd --zone=public --permanent --add-port=53/udp
$ sudo firewall-cmd --reload
```

查看端口开放

```terminal
$ sudo firewall-cmd --list-ports
53/udp 53/tcp
```

到此为止，主 DNS 服务器已经配置完成，我们开始配置次 DNS 服务器

### 配置次 DNS 服务器
大多数情况下，如果主 DNS 不可用，次 DNS 负责响应，会很好的保障网络稳定性。次 DNS 非常容易配置。

在 ns2 服务器上，编辑 `named.conf` 配置文件

在 options 块前，插入 ACL 块进行访问控制。

```conf
acl "trusted" {
	10.11.0.199;  # ns1 - can be set to localhost
	10.11.0.209;  # ns2
	10.11.0.101;  # host1
	10.11.0.102;  # host2
};
```

之后，编辑 options 块，添加 ns2 的 IP 地址，注释掉 IP v6 的条目。

```conf
options {
	listen-on port 53 { 127.0.0.1; 10.11.0.209; };
# 	 listen-on-v6 port 53 { ::1; };
...
```

更改 `allow-query` 条目，由 localhost 改为 trusted。

```conf
...
options {
...
	allow-query { trusted; }; # allows queries from "trusted" clients
...
```

在配置最后，添加本地配置文件

```conf
include "/etc/named/named.conf.local";
```

保存 `:wq` 之后，编辑 `named.conf.local` 文件

```terminal
$ sudo chmod 755 /etc/named
$ sudo vi /etc/named/named.conf.local
```

设置 slave 类型，主 DNS 服务的 IP 地址，如果设置了多个反向域，需要全部添加在这里。

```conf
zone "bj1.example.com" {
    type slave;
    file "slaves/db.bj1.example.com";
    masters { 10.11.0.199; };  # ns1 private IP
};

zone "11.10.in-addr.arpa" {
    type slave;
    file "slaves/db.10.11";
    masters { 10.11.0.199; };  # ns1 private IP
};
```

保存 `:wq` 之后，校验一下 `named.conf.local`

```terminal
$ sudo named-checkconf
```

如果没问题，开始启动服务

```terminal
$ sudo sudo systemctl start named
```

设置开机启动

```terminal
$ sudo systemctl enable named
```

开启防火墙端口

```terminal
$ sudo firewall-cmd --zone=public --permanent --add-port=53/tcp
$ sudo firewall-cmd --zone=public --permanent --add-port=53/udp
$ sudo firewall-cmd --reload
```

现在已经设置好了 DNS 服务，还需要在 host1 host2 上配置上这些 DNS 地址，才能使用私有的域名服务。

### 配置 DNS 客户端

在 CentOS, RedHat, and Fedora Linux VPS, 编辑 resolv.conf 文件。

在 host1 host2 服务器上分别设置：

```terminal
$ sudo vi /etc/resolv.conf
```

添加如下配置

```conf
search bj1.example.com  # your private domain
nameserver 10.11.0.199  # ns1 private IP address
nameserver 10.11.0.209  # ns2 private IP address
```

保存 `:wq` 之后, host1 host2 可以使用域名服务访问内网 IP 地址了。

### 测试
使用 nslookup 工具，在 CentOS 7 中，这个工具在 bind-utils 内。本例测试对 host2 进行正向查找和反向查找。

在 host1 上安装 bind-utils

```terminal
$ sudo yum install bind-utils
```

#### 正向查找
例如根据 host2 查找到该服务器的 IP 地址为 10.11.0.102

```terminal
$ sudo nslookup host2
Server:		10.11.0.199
Address:	10.11.0.199#53

Name:	host2.bj1.example.com
Address: 10.11.0.102
```

输入的是 host2 会扩展为 host2.bj1.example.com 其中 `bj1.example.com` 是在 resolv.conf 中 `search` 设置的。

也可以查找 FQDN (Fully-Qualified Domain Name)

```
$ sudo nslookup host2.bj1.example.com
Server:		10.11.0.199
Address:	10.11.0.199#53

Name:	host2.bj1.example.com
Address: 10.11.0.102
```

#### 反向查找
例如根据 host2 的 IP 地址 10.11.0.102，查找出对应的域名

```terminal
$ nslookup 10.11.0.102
Server:		10.11.0.199
Address:	10.11.0.199#53

102.0.11.10.in-addr.arpa	name = host2.bj1.example.com.
```

这表示 DNS 服务配置正常，恭喜！

## 维护 DNS 记录
如果使用私有 DNS 服务，难免需要增加，修改和删除机器，那么也要相应的维护 DNS 中的记录。

### 添加主机到 DNS 中

**主 DNS 服务器设置**
- 正向域添加 A 记录，增加 Serial 的值
- 反向域添加 PTR 记录，增加 Serial 的值
- 添加新主机的 IP 地址到 trusted ACL 中,在 `named.conf` 配置文件中添加

重启 bind 服务

```terminal
$ sudo systemctl reload named
```

**次 DNS 服务器设置**
- 添加新主机的 IP 地址到 trusted ACL 中,在 `named.conf` 配置文件中添加

重启 bind 服务

```terminal
$ sudo systemctl reload named
```

**配置新主机的 DNS**
- 配置 `resolv.conf`
- 使用 nslookup 工具测试

### 从 DNS 中移除主机
- 从信任列表删除
- 删除正向域的 A 记录，增加 Serial 的值
- 删除反向域的 PTR 记录，增加 Serial 的值

重启 bind 服务

```terminal
$ sudo systemctl reload named
```

### 转发
有时，需要访问外网服务，这就需要用到 bind 的转发功能，在 `named.conf` 配置的 options 块中，添加 forwarders 条目

```terminal
...
options {
...
	forwarders {
		8.8.8.8; # 本例使用 Google 的DNS，配置外网的 DNS，请根据实际情况配置
		8.8.4.4;
	};
...
```

这样，内网 DNS 查找可以使用，也可以进行外网 DNS 正向查找跟反向查找了。

## 结束语
本例使用 bind 安装和配置主 DNS 服务器和次 DNS 服务器。
- 配置主 DNS 服务器
- 配置次 DNS 服务器
- 测试 DNS 服务
- 维护 DNS 服务

## 参考资料
[How To Configure BIND as a Private Network DNS Server on CentOS 7][1]  

[1]: https://www.digitalocean.com/community/tutorials/how-to-configure-bind-as-a-private-network-dns-server-on-centos-7
