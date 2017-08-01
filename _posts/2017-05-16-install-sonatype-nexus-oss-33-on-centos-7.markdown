---
layout: post
title: CentOS 7 下安装和配置 Sonatype Nexus 3.3
categories: [Linux]
tags: [centos, java, sonatype nexus]
summary: CentOS 7 下安装 Sonatype Nexus OSS 3.3，因为 3.1 以后，相比 3.0 配置文件发生了一些变化，记录一下大致的安装和配置过程。
---
## 前言
CentOS 7 下安装 Sonatype Nexus OSS 3.3 ，因为 3.1 以后，相比 3.0 配置文件发生了一些变化，记录一下大致的安装和配置过程。

Sonatype Nexus 一直是 Maven 仓库管理工具，Nexus 3.1 之后新增了很多功能。

安装参考 [How To Install Latest Sonatype Nexus 3 On Linux][1]  
配置参考 [Configuration and Data Directory Changes for Nexus Repository Manager 3.1.0][3]

本例操作系统为 CentOS 7，命令基本一致。

### 环境说明
CentOS 7（Minimal Install）

## 安装和配置步骤
1.更新系统

```terminal
$ sudo yum update
```

版本如下

```terminal
$ cat /etc/redhat-release 
CentOS Linux release 7.3.1611 (Core)
```

2.安装 OpenJDK 1.8

```terminal
$ sudo yum install java-1.8.0-openjdk.x86_64
```

检验一下

```terminal
$ java -version
openjdk version "1.8.0_131"
OpenJDK Runtime Environment (build 1.8.0_131-b11)
OpenJDK 64-Bit Server VM (build 25.131-b11, mixed mode)
```

3.创建目录，并且 cd 进入这个目录

```terminal
$ cd /opt
```

4.下载 Sonatype Nexus OSS 3（请根据实际情况下载最新版本）

```terminal
$ sudo curl -O https://sonatype-download.global.ssl.fastly.net/nexus/3/nexus-3.3.1-01-unix.tar.gz
```

5.解压

```terminal
$ sudo tar -xzvf nexus-3.3.1-01-unix.tar.gz
```

6.创建链接

```terminal
$ sudo ln -s nexus-3.3.1-01 nexus
```

7.创建 nexus 用户

```terminal
$ sudo useradd nexus
```

8.授权

```terminal
$ sudo chown -R nexus:nexus /opt/nexus
$ sudo chown -R nexus:nexus /opt/sonatype-work/
```

9.打开 `/opt/nexus/bin/nexus.rc` 文件, 去掉 `run_as_user` 变量的注释

```terminal
$ sudo vi /opt/nexus/bin/nexus.rc

run_as_user="nexus"
```

10.安装服务(本例以 systemd 为例)  
创建服务文件

```terminal
$ sudo vi /etc/systemd/system/nexus.service
```

添加如下内容

```conf
[Unit]
Description=nexus service
After=network.target
	
[Service]
Type=forking
ExecStart=/opt/nexus/bin/nexus start
ExecStop=/opt/nexus/bin/nexus stop
User=nexus
Restart=on-abort
	
[Install]
WantedBy=multi-user.target
```

安装并启动服务

```terminal
$ sudo systemctl daemon-reload
$ sudo systemctl enable nexus
$ sudo systemctl start nexus
```

11.查看服务

```terminal
$ sudo systemctl status nexus
```

12.添加防火墙规则

```terminal
$ sudo firewall-cmd --zone=public --permanent --add-port=8081/tcp
$ sudo firewall-cmd --reload 
```

13.访问测试  
访问地址： `http://ip:8081/`  
访问凭证(默认的用户名和密码)：

```conf
username: admin
password: admin123
```

14.更改 nexus 的 context path  
如需修改路径，编辑 `/opt/sonatype-work/nexus3/etc/nexus.properties` 文件即可

```terminal
$ sudo vi /opt/nexus/nexus/etc/nexus.properties
nexus-context-path=/nexus
```

重启服务

```terminal
$ sudo systemctl restart nexus
```

访问测试  
地址 `http://ip:8081/nexus`  

## 结束语
本例安装和配置 Sonatype Nexus 3.3，步骤比较简单。但是版本更新还是个问题，因为每次都手动安装就比较费时了，如果能 yum 安装就比较方便了。

## 参考资料
[How To Install Latest Sonatype Nexus 3 On Linux][1]  
[Nexus Repository OSS Server Installation][2]  
[Configuration and Data Directory Changes for Nexus Repository Manager 3.1.0][3]  
[Chapter 2. Installation and Running][4]
 
[1]: http://www.sonatype.org/nexus/2017/01/25/how-to-install-latest-sonatype-nexus-3-on-linux/
[2]: http://clusterfrak.com/sysops/app_installs/nexus_install/
[3]: https://support.sonatype.com/hc/en-us/articles/231749327-Configuration-and-Data-Directory-Changes-for-Nexus-Repository-Manager-3-1-0
[4]: https://books.sonatype.com/nexus-book/3.0/reference/install.html
