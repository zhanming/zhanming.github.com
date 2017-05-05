---
layout: post
title: CentOS 7 下配置 HAProxy 和 Let's Encrypt
categories: [Linux]
tags: [centos, haproxy, let's encrypt, security]
summary: CenOS 7 下配置 HAProxy 和 Let's Encrypt，记录一下大致的安装和配置过程。主要是为了使用 HAProxy，查到了 How To Secure HAProxy with Let's Encrypt on CentOS 7，里面写的很详细，基本没有问题，但是再记录一下。
---
#### 介绍
CenOS 7 下配置 HAProxy 和 Let's Encrypt，记录一下安装和配置过程。

主要是为了使用 HAProxy，查到了 [How To Secure HAProxy with Let's Encrypt on CentOS 7][3]，里面写的很详细，基本没有问题，但是再记录一下。

[HAProxy - The Reliable, High Performance TCP/HTTP Load Balancer][1]  
HAProxy 是可靠的，高性能的 TCP/HTTP 负载均衡软件，实现了 8 种负载均衡算法。

[Let's Encrypt - Free SSL/TLS Certificates][2]  
Let' Encrypt 能够发放免费的 TLS/SSL 证书，并且 Let's Encrypt已经得了 IdenTrust 的交叉签名, 浏览器都会信任。

#### 环境说明
CentOS 7 (Minimal 安装)

本例使用 3 个 服务器，IP 地址及网络图如下：

HAProxy1: 10.0.0.3  
Nginx1: 10.0.0.11  
Nginx2: 10.0.0.12  

    o----------o               o------------------------------o       o-------------------o
    |          |               |  o------------------------o  |       |                   | 
    | User     |---TLS/SSL---->|  |HTTPS(443)              |  |---+-->| Nginx 1           |
    |          |            +--|--|HTTP(80) to HTTPS       |  |   |   | IP: 10.0.0.11     |
    o----------o            |  |  o------------------------o  |   |   o-------------------o 
                            |  |      |                       |   |
                            |  |      |                       |   |
                            |  |  o-------o  o-------------o  |   |
                            |  |  | HTTP  |--|Let's Encrypt|  |   |
    o----------o            |  |  |(54321)|  |ACME Client  |  |   |   o-------------------o
    | Let's    | auto-renew |  |  o-------o  o-------------o  |   |   |                   |
    | Encrypt  |<-----------+  |  HAProxy Server              |   +-->| Nginx 2           |
    | CA       |               |  IP: 10.0.0.3                |       | IP: 10.0.0.12     |
    o----------o               o------------------------------o       o-------------------o
      https://letsencrypt.org     https://example.com

本例外网域名以 `example.com` 为例，使用 HAProxy 对后面 2 台 Nginx 服务器进行负载均衡。

#### 前提

1.需要有这三个服务器的 `sudo` 权限，因为需要有安装和配置软件权限。

2.必须拥有或控制你的域名管理权限，因为 Let's Encrypt 需要域名才可以使用，本例中实例域名 `exmaple.com` 需要最终需要指向内网地址 `10.0.0.3`

3.域名管理中，映射 WAN 网 IP 地址，防火墙里面 NAT 以及端口映射到内网服务器 `10.0.0.3` 的 80， 443 端口，此处不详细说明。

满足已上前提之后，即可进行配置。

#### 配置前准备
1.配置网络

需要将 HAProxy1, Nginx1, Nginx2 的 IP 和网络设置号，此处不做细节说明。

配置网络(IP地址，网管，子网掩码，DNS等)

    $ sudo nmtui

网络配置好之后，重启一下服务

    $ sudo systemctl restart network.service 

测试一下网络是否联通

    $ sudo ping www.centos.org
    PING www.centos.org (85.12.30.226) 56(84) bytes of data.
    64 bytes from 85.12.30.226 (85.12.30.226): icmp_seq=1 ttl=46 time=244 ms
    64 bytes from 85.12.30.226 (85.12.30.226): icmp_seq=2 ttl=46 time=243 ms
    ^C
    --- www.centos.org ping statistics ---
    2 packets transmitted, 2 received, 0% packet loss, time 1000ms
    rtt min/avg/max/mdev = 243.971/244.051/244.131/0.080 ms

2.更新系统软件包（此步骤不是必须的）

    $ sudo yum update

### 配置 Nginx1 和 Nginx2 服务器

两个服务器使用相同的命令，安装 Nginx, 供以后测试使用。

#### 配置 yum 源
使用官方的 yum 源, 参考 [Install Nginx Binary Releases][5] 。

    $ vi /etc/yum.repos.d/nginx.repo

加入如下内容

    [nginx]
    name=nginx repo
    baseurl=http://nginx.org/packages/centos/7/$basearch/
    gpgcheck=0
    enabled=1

安装 Nginx

	$ sudo yum install nginx

设置服务

	$ sudo systemctl enable nginx.service

启动服务

	$ sudo systemctl start nginx.service

开放端口

	$ sudo firewall-cmd --permanent --zone=public --add-service=http
	$ sudo firewall-cmd --reload

测试服务

使用浏览器访问 `http://10.0.0.11` 和 `http://10.0.0.12` 。

### 配置 HAProxy1 服务器 

#### 第一步，安装 Let's Encrypt Client
1.在防火墙上开放 `80` 和 `443` 端口，安装 Let's Encrypt Client 需要使用。

    $ sudo firewall-cmd --permanent --zone=public --add-service=http
    $ sudo firewall-cmd --permanent --zone=public --add-service=https
    $ sudo firewall-cmd --reload

2.目前安装 `letsencrypt` 比较好的方法是从 GitHub 上克隆 。

安装 Git 和 Bc

    $ sudo yum install git bc

3.克隆 Let's Encrypt

    $ sudo git clone https://github.com/letsencrypt/letsencrypt /opt/letsencrypt
	Cloning into '/opt/letsencrypt'...
	remote: Counting objects: 45465, done.
	remote: Compressing objects: 100% (36/36), done.
	remote: Total 45465 (delta 11), reused 0 (delta 0), pack-reused 45429
	Receiving objects: 100% (45465/45465), 13.62 MiB | 1.43 MiB/s, done.
	Resolving deltas: 100% (32535/32535), done.


克隆完成之后 `letsencrypt` 已经下载到 `/opt/letsencrypt` 文件夹中。

#### 第二步，获得一个证书
Let's Encrypt 有很多种方式获得证书，本例中使用 Standalone plugin 方式获得一个证书。

1.保证 `443` 端口开放

因为 Let's Encrypt 使用 Standalone plugin 方式会临时使用一个 Web Server, 会用到 `443` 端口。

因为刚才已经在防火墙打开了 `443` 端口，现在可以检测一下是否被使用，要确保 `443` 端口开放并且不被别的程序使用。

    $ sudo ss -lnp|grep 443

`ss` 命令会查询包含 `443` 的进程，如果出现类似如下结果，表明已经占用，请自行查找原因，停止服务，保证 `443` 端口开放，但不被使用。

    tcp    LISTEN     0      128       *:443                    *:* ......

2.运行 Let's Encrypt

    $ cd /opt/letsencrypt

使用 Standalone plugin 进行安装

    $ sudo ./letsencrypt-auto certonly --standalone

此命令会下载 Let's Encrypt ACME Client 所需的组件, 并且开始安装，过程如下：

	Bootstrapping dependencies for RedHat-based OSes... (you can skip this with --no-bootstrap)
	yum is /bin/yum
	Loaded plugins: fastestmirror
	Loading mirror speeds from cached hostfile
    ......
    ......
	Complete!
	Creating virtual environment...
	Installing Python packages...
	Installation succeeded.
	Saving debug log to /var/log/letsencrypt/letsencrypt.log
	Enter email address (used for urgent renewal and security notices) (Enter 'c' to
	cancel):foo@example.com
	
	-------------------------------------------------------------------------------
	Please read the Terms of Service at
	https://letsencrypt.org/documents/LE-SA-v1.1.1-August-1-2016.pdf. You must agree
	in order to register with the ACME server at
	https://acme-v01.api.letsencrypt.org/directory
	-------------------------------------------------------------------------------
	(A)gree/(C)ancel: A
	
	-------------------------------------------------------------------------------
	Would you be willing to share your email address with the Electronic Frontier
	Foundation, a founding partner of the Let's Encrypt project and the non-profit
	organization that develops Certbot? We'd like to send you email about EFF and
	our work to encrypt the web, protect its users and defend digital rights.
	-------------------------------------------------------------------------------
	(Y)es/(N)o: N
	Please enter in your domain name(s) (comma and/or space separated)  (Enter 'c'
	to cancel):example.com
	Obtaining a new certificate
	Performing the following challenges:
	tls-sni-01 challenge for example.com
	Waiting for verification...
	Cleaning up challenges
	Generating key (2048 bits): /etc/letsencrypt/keys/0000_key-certbot.pem
	Creating CSR: /etc/letsencrypt/csr/0000_csr-certbot.pem
	
	IMPORTANT NOTES:
	 - Congratulations! Your certificate and chain have been saved at
	   /etc/letsencrypt/live/example.com/fullchain.pem. Your cert will
	   expire on 2017-08-02. To obtain a new or tweaked version of this
	   certificate in the future, simply run letsencrypt-auto again. To
	   non-interactively renew *all* of your certificates, run
	   "letsencrypt-auto renew"
	 - Your account credentials have been saved in your Certbot
	   configuration directory at /etc/letsencrypt. You should make a
	   secure backup of this folder now. This configuration directory will
	   also contain certificates and private keys obtained by Certbot so
	   making regular backups of this folder is ideal.
	 - If you like Certbot, please consider supporting our work by:
	
	   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
	   Donating to EFF:                    https://eff.org/donate-le


看到 `Congratulations!` 表示安装成功了。

#### 证书文件
获得证书之后，你将有如下 PEM 格式的文件：

- cert.pem: 域名的证书
- chain.pem: Let's Encrypt 证书链
- fullchain.pem: `cert.pem` 和 `chain.pem` 组合
- privkey.pem: 证书的私钥

这些文件的位置是在 `/etc/letsencrypt/archive`, 但是 Let's Encrypt 将最近的证书创建了符号连接, 放到 `/etc/letsencrypt/live/your_domain_name` 目录。

你可以检查一下这些文件

	$ sudo ls /etc/letsencrypt/live/your_domain_name
	cert.pem  chain.pem  fullchain.pem  privkey.pem  README

#### 组合 Fullchain.pem 和 Privkey.pem
当配置 HAProxy 使用 SSL，它将加密自己与用户之间的传输通道，所以必须将 `fullchain.pem` 和 `privkey.pem` 结合到一个文件中。

1.创建目录

	 $ sudo mkdir -p /etc/haproxy/certs

2.使用 cat 命令结合文件。（请将 `example.com` 替换成您自己的域名）

	$ DOMAIN='example.com' sudo -E bash -c 'cat /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/letsencrypt/live/$DOMAIN/privkey.pem > /etc/haproxy/certs/$DOMAIN.pem'

3.更改目录权限，保障私钥安全

	$ sudo chmod -R go-rwx /etc/haproxy/certs

#### 第三步，安装 HAProxy
使用　yum 安装

	$ sudo yum install haproxy

#### 第四步，配置 HAProxy
这一步将配置基本的 HAProxy 和 SSL, 并且配置 Let's Encrypt 的 auto-renew

	$ sudo vi /etc/haproxy/haproxy.cfg

最后编辑基本如下

	#---------------------------------------------------------------------
	# Example configuration for a possible web application.  See the
	# full configuration options online.
	#
	#   http://haproxy.1wt.eu/download/1.4/doc/configuration.txt
	#
	#---------------------------------------------------------------------
	
	#---------------------------------------------------------------------
	# Global settings
	#---------------------------------------------------------------------
	global
	    # to have these messages end up in /var/log/haproxy.log you will
	    # need to:
	    #
	    # 1) configure syslog to accept network log events.  This is done
	    #    by adding the '-r' option to the SYSLOGD_OPTIONS in
	    #    /etc/sysconfig/syslog
	    #
	    # 2) configure local2 events to go to the /var/log/haproxy.log
	    #   file. A line like the following can be added to
	    #   /etc/sysconfig/syslog
	    #
	    #    local2.*                       /var/log/haproxy.log
	    #
	    log         127.0.0.1 local2
	
	    chroot      /var/lib/haproxy
	    pidfile     /var/run/haproxy.pid
	    maxconn     4000
	    user        haproxy
	    group       haproxy
	    daemon
	
	    # turn on stats unix socket
	    stats socket /var/lib/haproxy/stats
	
	    # 密钥协商算法的临时 DHE key 的最大值
	    tune.ssl.default-dh-param 2048
	#---------------------------------------------------------------------
	# common defaults that all the 'listen' and 'backend' sections will
	# use if not designated in their block
	#---------------------------------------------------------------------
	defaults
	    mode                    http
	    log                     global
	    option                  httplog
	    option                  dontlognull
	    option http-server-close
	    option forwardfor       except 127.0.0.0/8
	    option                  redispatch
	    retries                 3
	    timeout http-request    10s
	    timeout queue           1m
	    timeout connect         10s
	    timeout client          1m
	    timeout server          1m
	    timeout http-keep-alive 10s
	    timeout check           10s
	    maxconn                 3000
	
	#---------------------------------------------------------------------
	# main frontend which proxys to the backends
	#---------------------------------------------------------------------
	
	# 这里是配置 80 端口的负载均衡
	frontend www-http
	   bind *:80
	   reqadd X-Forwarded-Proto:\ http
	   default_backend www-backend
	
	# 这里是配置 443 端口的负载均衡
	frontend www-https
	   bind *:443 ssl crt /etc/haproxy/certs/example.com.pem
	   reqadd X-Forwarded-Proto:\ https
	   acl letsencrypt-acl path_beg /.well-known/acme-challenge/
	   use_backend letsencrypt-backend if letsencrypt-acl
	   default_backend www-backend
	#---------------------------------------------------------------------
	# static backend for serving up images, stylesheets and such
	#---------------------------------------------------------------------
	# 后台的实际的机器（将 http 重定向到 https）
	backend www-backend
	   redirect scheme https if !{ ssl_fc }
	   server www-1 10.0.0.11:80 check
	   server www-2 10.0.0.12:80 check
	
	backend letsencrypt-backend
	   server letsencrypt 127.0.0.1:54321

注册并启动　haproxy 服务

	$ sudo systemctl enable haproxy.service
	$ sudo systemctl start haproxy.service

测试一下

浏览器访问　`http://example.com` 会自动转到 `https://example.com`

本例使用的默认的轮训负载均衡算法 `roundrobin`，会交替访问后端的两个服务器，如果想改变算法，请自行查找 HAProxy 使用的负载均衡算法: `roundrobin`, `leastconn`, `static-rr`, `source`, `uri`, `url_param`, `hdr(name)`, `rdp-cookie（name）`

#### 第五步，安装证书的自动更新（Auto Renewal）
Standalone plugin 默认使用 `80` 或 `443` 作为默认端口

	--tls-sni-01-port TLS_SNI_01_PORT
                        Port number to perform tls-sni-01 challenge. Boulder
                        in testing mode defaults to 5001. (default: 443)
	--http-01-port HTTP01_PORT
                        Port used in the SimpleHttp challenge. (default: 80)

本例使用 `54321` ，以免与HAProxy冲突，需要先在防火墙上开放端口：

	$ sudo firewall-cmd --permanent --zone=public --add-port=54321/tcp
	$ sudo firewall-cmd --reload

然后执行如下命令(注意！替换 `exmaple.com` 为您自己的域名)

	$ cd /opt/letsencrypt
	$ sudo ./letsencrypt-auto certonly --agree-tos --renew-by-default --standalone-supported-challenges http-01 --http-01-port 54321 -d example.com

成功之后，需要创建一个新的结合证书文件(注意！替换 `exmaple.com` 为您自己的域名)

	$ sudo DOMAIN='example.com' sudo -E bash -c 'cat /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/letsencrypt/live/$DOMAIN/privkey.pem > /etc/haproxy/certs/$DOMAIN.pem'

然后重启 HAProxy 服务，应用新证书

	$ sudo service haproxy reload

现在，我们知道了如何 renew 我们的证书，我们可以自动化这一过程，使用一些脚本和 cron 作业

#### 创建一个 Let's Encrypt 配置文件
使用 Let's Encrypt 的样例文件，放到 `/usr/local/etc/le-renew-haproxy.ini`

	$ sudo cp /opt/letsencrypt/examples/cli.ini /usr/local/etc/le-renew-haproxy.ini

编辑这个文件

	$ sudo vi /usr/local/etc/le-renew-haproxy.ini

修改如下部分(注意！替换 `exmaple.com` 为您自己的域名)

	# Use a 4096 bit RSA key instead of 2048
	rsa-key-size = 4096
	
	# Uncomment and update to register with the specified e-mail address
	email = foo@example.com
	domains = example.com

	# Uncomment to use the standalone authenticator on port 443
	# authenticator = standalone
	# standalone-supported-challenges = tls-sni-01
	standalone-supported-challenges = http-01

现在我们可以根据配置文件 renew 证书，跟刚才使用域名变量 `DOMAIN='example.com'` 是一样的

	$ cd /opt/letsencrypt
	$ sudo ./letsencrypt-auto certonly --renew-by-default --config /usr/local/etc/le-renew-haproxy.ini --http-01-port 54321

我们要创建一个脚本，进行证书的 renew

#### 创建证书的 renew 脚本和 cron 作业
脚本会检查证书的过期日期是否小于30天，cron 作业每星期执行一次。

首先，下载这个脚本，并且使它可以执行。您也可以更改此脚本，满足自己的需求。

	$ sudo curl -L -o /usr/local/sbin/le-renew-haproxy https://gist.githubusercontent.com/thisismitch/7c91e9b2b63f837a0c4b/raw/700cfe953e5d5e71e528baf20337198195606630/le-renew-haproxy
	$ sudo chmod +x /usr/local/sbin/le-renew-haproxy

如果网络有问题，脚本内容如下，如果跟您本地情况不符(如，端口号不想使用 `54321`)，可以自行更改。

	#!/bin/bash

	web_service='haproxy'
	config_file='/usr/local/etc/le-renew-haproxy.ini'
	domain=`grep "^\s*domains" $config_file | sed "s/^\s*domains\s*=\s*//" | sed 's/(\s*)\|,.*$//'`
	http_01_port='54321'
	combined_file="/etc/haproxy/certs/${domain}.pem"
	
	le_path='/opt/letsencrypt'
	exp_limit=30;
	
	if [ ! -f $config_file ]; then
	        echo "[ERROR] config file does not exist: $config_file"
	        exit 1;
	fi
	
	cert_file="/etc/letsencrypt/live/$domain/fullchain.pem"
	key_file="/etc/letsencrypt/live/$domain/privkey.pem"
	
	if [ ! -f $cert_file ]; then
		echo "[ERROR] certificate file not found for domain $domain."
	fi
	
	exp=$(date -d "`openssl x509 -in $cert_file -text -noout|grep "Not After"|cut -c 25-`" +%s)
	datenow=$(date -d "now" +%s)
	days_exp=$(echo \( $exp - $datenow \) / 86400 |bc)
	
	echo "Checking expiration date for $domain..."
	
	if [ "$days_exp" -gt "$exp_limit" ] ; then
		echo "The certificate is up to date, no need for renewal ($days_exp days left)."
		exit 0;
	else
		echo "The certificate for $domain is about to expire soon. Starting Let's Encrypt (HAProxy:$http_01_port) renewal script..."
		$le_path/letsencrypt-auto certonly --agree-tos --renew-by-default --config $config_file --http-01-port $http_01_port
	
		echo "Creating $combined_file with latest certs..."
		sudo bash -c "cat /etc/letsencrypt/live/$domain/fullchain.pem /etc/letsencrypt/live/$domain/privkey.pem > $combined_file"
	
		echo "Reloading $web_service"
		/usr/sbin/service $web_service reload
		echo "Renewal process finished for domain $domain"
		exit 0;
	fi

这个脚本会自动检查日期，如果没有到期，只会输出还有多久到期

	$ sudo /usr/local/sbin/le-renew-haproxy

将得到如下结果

	......
	Checking expiration date for example.com...
	The certificate is up to date, no need for renewal (89 days left).

接下来，我们将编辑一个 crontab 来创建一个作业，每星期执行一次

	$ sudo crontab -e

填写内容如下（注意，要在一行）

	30 2 * * 1 /usr/local/sbin/le-renew-haproxy >> /var/log/le-renewal.log

保存并且退出 `:wq` ，这个作业将每星期一的早晨 `2:30` 执行一次，并将日志写入 `/var/log/le-renewal.log` 中。

#### 结束语
至此，HAProxy 使用 Let's Encrypt 进行 TLS/SSL 证书进行HTTPS传输。

1. 使用 HAProxy 进行负载均衡
2. 使用 Let's Encrypt 的证书进行HTTPS
3. HTTP 转 HTTPS
4. 作业调度自动更新证书

#### 参考资料
[How To Secure HAProxy with Let's Encrypt on CentOS 7][3]  
[如何使用让我们在 CentOS 7 加密安全 HAProxy 的][4]  
[Install Nginx Binary Releases][5]  
 
[1]: http://www.haproxy.org/
[2]: https://letsencrypt.org/
[3]: https://www.digitalocean.com/community/tutorials/how-to-secure-haproxy-with-let-s-encrypt-on-centos-7
[4]: https://www.howtoing.com/how-to-secure-haproxy-with-let-s-encrypt-on-centos-7/
[5]: https://www.nginx.com/resources/wiki/start/topics/tutorials/install/