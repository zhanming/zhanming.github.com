---
layout: post
title: CentOS 7 下 yum 安装 Jenkins
categories: [Linux]
tags: [centos, java, jenkins]
summary: CentOS 7 下 yum 安装 Jenkins，记录一下大致的安装和配置过程。
---
## 前言
CentOS 7 下 yum 安装 Jenkins，记录一下大致的安装和配置过程。

Jenkins 是一个自动构建的工具（Jenkins Automation Server），很常用，也很好用。主要用于软件的自动构建。

参考 [Installing Jenkins on Red Hat distributions][1]  

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

```
$ java -version
openjdk version "1.8.0_131"
OpenJDK Runtime Environment (build 1.8.0_131-b11)
OpenJDK 64-Bit Server VM (build 25.131-b11, mixed mode)
```

3.安装(本例安装稳定版)

```terminal
$ cd /etc/yum.repos.d/
$ sudo curl -LO http://pkg.jenkins-ci.org/redhat-stable/jenkins.repo
$ sudo rpm --import https://jenkins-ci.org/redhat/jenkins-ci.org.key
$ sudo yum install jenkins
```

4.添加防火墙规则

```terminal
$ sudo firewall-cmd --zone=public --permanent --add-port=8080/tcp
$ sudo firewall-cmd --reload 
```

5.访问测试  
访问： `http://ip:8080`，第一次访问，需要输入密码

```terminal	
$ sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

接下来是选择要安装的插件，安装完成后，设置访问凭证信息（用户名，密码，邮箱等）。

6.修改访问路径, 如使用代理，希望将路径设置为 `http://ip:8080/jenkins`

```terminal
$ sudo vi /etc/sysconfig/jenkins
JENKINS_ARGS="--prefix=/jenkins"
```

访问测试: `http://ip:8080/jenkins`

7.更新

```terminal
$ sudo yum update jenkins
```

## 结束语
本例安装和配置 jenkins，步骤比较简单。而且更新方便，一条yum命令即可，这点很重要。

## 参考资料
[Installing Jenkins on Red Hat distributions][1]  

[1]: https://wiki.jenkins-ci.org/display/JENKINS/Installing+Jenkins+on+Red+Hat+distributions
