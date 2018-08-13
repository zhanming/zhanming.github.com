---
layout: post
title: CentOS 7 下 yum 安装和配置 Nginx 
categories: [Linux]
tags: [centos, nginx]
summary: Nginx (engine x) 是一个高性能的 HTTP 和反向代理服务器，也是一个 IMAP/POP3/SMTP 服务器。 本例演示 CentOS 7 下安装和配置 Nginx 的基本步骤。
---
## 前言
Nginx (engine x) 是一个高性能的 HTTP 和反向代理服务器，也是一个 IMAP/POP3/SMTP 服务器。。 本例演示 CentOS 7 下安装和配置 Nginx 的基本步骤。

### 环境说明
CentOS 7（Minimal Install）

```terminal
$ cat /etc/redhat-release 
CentOS Linux release 7.5.1804 (Core) 
```

## 步骤

### 步骤 1: 添加 yum 源
Nginx 不在默认的 yum 源中，可以使用 epel 或者官网的 yum 源，本例使用官网的 yum 源。

```terminal
$ sudo rpm -ivh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
```

安装完 yum 源之后，可以查看一下。

```terminal
$ sudo yum repolist
Loaded plugins: fastestmirror, langpacks
Loading mirror speeds from cached hostfile
 * base: mirrors.aliyun.com
 * extras: mirrors.aliyun.com
 * updates: mirrors.aliyun.com
repo id                          repo name                          status
base/7/x86_64                    CentOS-7 - Base                    9,911
extras/7/x86_64                  CentOS-7 - Extras                    368
nginx/x86_64                     nginx repo                           108
updates/7/x86_64                 CentOS-7 - Updates                 1,041
repolist: 11,428
```

可以发现 `nginx repo` 已经安装到本机了。

### 步骤 2: 安装

yum 安装 Nginx，非常简单，一条命令。

```terminal
$ sudo yum install nginx
```

### 步骤 3: 配置 Nginx 服务

设置开机启动

```terminal
$ sudo systemctl enable nginx
```

启动服务

```terminal
$ sudo systemctl start nginx
```

停止服务

```terminal
$ sudo systemctl restart nginx
```

重新加载，因为一般重新配置之后，不希望重启服务，这时可以使用重新加载。

```terminal
$ sudo systemctl reload nginx
```

### 步骤 4: 打开防火墙端口

默认 CentOS7 使用的防火墙 firewalld 是关闭 http 服务的（打开 80 端口）。

```terminal
$ sudo firewall-cmd --zone=public --permanent --add-service=http
success
$ sudo firewall-cmd --reload
success
```

打开之后，可以查看一下防火墙打开的所有的服务

```terminal
$ sudo sudo firewall-cmd --list-service
ssh dhcpv6-client http
```

可以看到，系统已经打开了 http 服务。

### 步骤 4: 反向代理

Nginx 是一个很方便的反向代理，配置反向代理可以参考 [Module ngx_http_proxy_module][2] 。本文不做累述。

需要指出的是 CentOS 7 的 SELinux，使用反向代理需要打开网络访问权限。

```terminal
$ sudo setsebool httpd_can_network_connect 1 
```

打开网络权限之后，反向代理可以使用了。

## 结论
本文演示了 CentOS 7 下 yum 安装 Nginx，配置服务等。

## 参考资料
[Install Nginx Binary Releases][1]  
[Module ngx_http_proxy_module][2]  

 
[1]: https://www.nginx.com/resources/wiki/start/topics/tutorials/install/  
[2]: http://nginx.org/en/docs/http/ngx_http_proxy_module.html
