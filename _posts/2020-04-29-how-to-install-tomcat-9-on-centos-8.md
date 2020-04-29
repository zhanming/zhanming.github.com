---
layout: post
title: CentOS 8 安装 Tomcat 9 
categories: [Linux]
tags: [centos, tomcat]
update: 2020-04-29
summary: Apache Tomcat 是一个 Java 应用程序的 Web 服务器和 servlet 容器。Tomcat 是由 Apache Software Foundation 发布的 Java Servlet 和 Java Server Pages 技术的开源实现。本教程介绍了 CentOS 8 服务器上 Tomcat 9 版本的基本安装和一些配置。
---
## 前言
Apache Tomcat 是一个 Java 应用程序的 Web 服务器和 servlet 容器。Tomcat 是由 Apache Software Foundation 发布的 Java Servlet 和 Java Server Pages 技术的开源实现。本教程介绍了 CentOS 8 服务器上 Tomcat 9 版本的基本安装和一些配置。

### 环境说明
CentOS 8（Minimal Install）

```terminal
$ cat /etc/system-release
CentOS Linux release 8.1.1911 (Core)
```


## 安装 JDK

使用 dnf 安装 OpenJDK 1.8.0
```terminal
$ sudo dnf install java-1.8.0-openjdk
```
安装完之后测试一下

```terminal
$ java -version
openjdk version "1.8.0_252"
OpenJDK Runtime Environment (build 1.8.0_252-b09)
OpenJDK 64-Bit Server VM (build 25.252-b09, mixed mode)
```

## 安装 Tomcat

### 创建 Tomcat 用户

```terminal
$ sudo useradd -r tomcat
```

### 下载二进制包

去官方网站 [Tomcat 9 Software Downloads][1] 找到最新的 Tomcat 9 下载地址。

```terminal
$ cd ~
```

使用  curl 进行下载

```terminal
$ curl -O https://mirrors.tuna.tsinghua.edu.cn/apache/tomcat/tomcat-9/v9.0.34/bin/apache-tomcat-9.0.34.tar.gz
```

我们将把 tomcat 安装到 `/opt/tomcat` 目录下，先创建目录，然后再将压缩包解压到这个目录，命令如下

```terminal
$ sudo mkdir -p /opt/tomcat
```

CentOS 8 默认没有安装 tar 命令，需要先安装一下

```terminal
$ sudo dnf install tar
$ sudo tar xvf apache-tomcat-9*tar.gz -C /opt/tomcat --strip-components=1
```

### 更新权限

```terminal
$ sudo chown -R tomcat:tomcat /opt/tomcat
```

### 安装服务

如果希望将 tomcat 作为服务，需要添加到系统服务中

```terminal
$ sudo vi /etc/systemd/system/tomcat.service
```

拷贝如下内容

```terminal
# Systemd unit file for tomcat
[Unit]
Description=Apache Tomcat Web Application Container
After=syslog.target network.target

[Service]
Type=forking

Environment=JAVA_HOME=/usr/lib/jvm/jre
Environment=CATALINA_PID=/opt/tomcat/temp/tomcat.pid
Environment=CATALINA_HOME=/opt/tomcat
Environment=CATALINA_BASE=/opt/tomcat
Environment='CATALINA_OPTS=-Xms512M -Xmx1024M -server -XX:+UseParallelGC'
Environment='JAVA_OPTS=-Djava.awt.headless=true -Djava.security.egd=file:/dev/./urandom'

ExecStart=/opt/tomcat/bin/startup.sh
ExecStop=/bin/kill -15 $MAINPID

User=tomcat
Group=tomcat
UMask=0007
RestartSec=10
Restart=always

[Install]
WantedBy=multi-user.target
```

保存之后，需要重新加载一下 Systemd

 ```terminal
$ sudo systemctl daemon-reload
 ```

启动服务

```terminal
$ sudo systemctl start tomcat
```

查看服务

```terminal
$ sudo systemctl status tomcat
```

关闭服务

```terminal
$ sudo systemctl stop tomcat
```

设置开机启动

```terminal
$ sudo systemctl enable tomcat
```

### 防火墙端口

被其他客户端访问，需要开启防火墙端口，tomcat 的 http 默认端口是 8080

```terminal
$ sudo firewall-cmd --zone=public --permanent --add-port=8080/tcp
success
$ sudo firewall-cmd --reload
success
```

`注意`： 正常的情况应该使用 http 代理服务器，只开放 http 的默认 80 端口，这不在本文范围。 

### 测试

使用 Web 浏览器访问 `http://ip:8080`

## 参考资料

[Tomcat 9 Software Downloads][1]  
[How To Install Apache Tomcat 8 on CentOS 7][2]  
[How to Install Tomcat 9 on CentOS 8][3]  

[1]: https://tomcat.apache.org/download-90.cgi
[2]: https://www.digitalocean.com/community/tutorials/how-to-install-apache-tomcat-8-on-centos-7
[3]: https://www.liquidweb.com/kb/how-to-install-tomcat-9-on-centos-8/