---
layout: post
title: CentOS 6.2 下开发环境搭建 - 安装
categories: [Linux]
tags: [centos, nginx, redmine, java, gerrit, maven, nexus, jenkins]
summary: 这几天看到一篇博文：http://blog.j12r.com/2011/11/development-environment/,他主要在 Ubuntu 下使用的，我主要用 CentOS，就也做了一些配置，记录一下配置过程。使用的软件也略有不同。
---

## 简介
这几天看到一篇博文：http://blog.j12r.com/2011/11/development-environment/,他主要在 Ubuntu 下使用的，我主要用 CentOS，就也做了一些配置，记录一下配置过程。使用的软件也略有不同。

原文如下：  
This series of posts explains in detail how I configured my development environment at [j12r.com](http://j12r.com).

尽可能多的使用开源软件。完成一个基本的软件开发过程。
### 引文
本文是在 CentOS 6.2 下进行，下面的软件将被安装，并使之一起工作 :  
1. [Nginx](http://nginx.org): 代理http服务软件 `http://localhost`  
2. [MySQL](http://www.mysql.com): 数据库软件  
3. [Redmine](http://redmine.org): bug跟踪软件 `http://localhost/redmine`  
4. [Git](http://git-scm.org): 源代码管理软件  
5. [Java](http://java.sun.com): java编程语言  
6. [Maven](http://maven.apache.org): java项目管理工具  
7. [Nexus](http://nexus.sonatype.org): Maven仓库管理器 `http://localhost/nexus`  
8. [Jenkins](http://jenkins-ci.org): 持续集成软件 `http://localhost/jenkins`  
9. [Gerrit](http://code.google.com/p/gerrit): 代码审查软件 `http://localhost/gerrit`  
安装之前，先安装 gcc

```terminal
# yum install gcc
```

### 1. Nginx
#### 安装
本文使用 Nginx-1.2.0

```terminal
# rpm -ivh http://nginx.org/packages/centos/6/x86_64/RPMS/nginx-1.2.0-1.el6.ngx.x86_64.rpm
```

查看安装的 Nginx 的属性

```terminal
# nginx -V
```

设置为服务

```
# chkconfig nginx on
```
 
#### 测试

```terminal
# service nginx start
Starting nginx:                                            [  OK  ]
```

访问：`http://localhost`
### 2. MySQL
#### 安装
本文使用 yum 安装

```terminal
# yum install mysql-server
# chkconfig mysqld on
# service mysqld start
```

修改 root 的密码为 ‘root’ (本文为演示，请自行设置您的密码)

```terminal
# /usr/bin/mysqladmin -u root password 'root'
```

#### 测试

```terminal
# mysql -u root -p
Enter password: 
    
mysql> exit;
Bye
```

### 3. Redmine
#### 安装
redmine 需要安装一些头文件

```terminal
# yum install mysql-devel ImageMagick ImageMagick-devel
```

安装 ruby

```
# yum install ruby ruby-devel rubygems
```
查看一下版本

```terminal
# ruby --version
ruby 1.8.7 (2011-06-30 patchlevel 352) [x86_64-linux]
# gem --version
1.3.7
```

Redmin 1.4.1 使用 bundler 安装

```terminal
# gem install bundler
```

查看一下 gem 包

```terminal
# gem list --local
    
*** LOCAL GEMS ***
    
bundler (1.1.3)
```

安装 Redmine

```terminal
# wget http://rubyforge.org/frs/download.php/76033/redmine-1.4.1.tar.gz
# cp redmine-1.4.1.tar.gz /usr/local
# cd /usr/local
# tar zxvf redmine-1.4.1.tar.gz
```

建立一个链接

```terminal
# ln -s /usr/local/redmine-1.4.1 /usr/local/redmine
# cd /usr/local/redmine
```

使用 bundle 安装(本文不是用 development, test 模式，postgresql, sqlite 数据库)

```terminal
# bundle install --without development test postgresql sqlite
```

建立数据库

```terminal
# mysql -u root -p
mysql> create database redmine character set utf8;
mysql> create user 'redmine'@'localhost' identified by 'my_password';
mysql> grant all privileges on redmine.* to 'redmine'@'localhost';
mysql> exit;
```

修改数据库配置文件

```terminal
# cd /usr/local/redmine/config
# cp database.yml.example database.yml
# vi database.yml
```

主要修改 production 部分(数据库的用户名和密码)

```conf
production:
  adapter: mysql
  database: redmine
  host: localhost
  username: redmine
  password: my_password
  encoding: utf8
```

生成会话存储

```terminal
# rake generate_session_store
Please install RDoc 2.4.2+ to generate documentation.
```

可以忽略这句: Please install RDoc 2.4.2+ to generate documentation.  
创建数据库结构

```terminal
# RAILS_ENV=production rake db:migrate
```

初始化数据库

```terminal
# RAILS_ENV=production rake redmine:load_default_data
```

#### 测试

```terminal
ruby script/server webrick -e production
```
    
访问 `http://localhost:3000`
#### Nginx 代理
为使 nginx 能够代理，需要修改 redmine 的 environment.rb

```terminal
# vi /usr/local/redmine/config/environment.rb
```

在最下面添加如下代码

```ruby
Redmine::Utils::relative_url_root = "/redmine"
```

而且还要建立链接(配置时未找到好的解决办法)，否则 javascript, css 文件会找不到

```terminal
ln -s /usr/local/redmine/public /usr/local/redmine/public/redmine
```

更改 nginx 配置

```
# vi /etc/nginx/conf.d/default.conf

location /redmine/ {
    proxy_pass http://127.0.0.1:3000;
}
```
    
#### 测试
访问：`http://localhost/redmine`

#### 参考
[HowTo Install Redmine in a sub-URI](http://www.redmine.org/projects/redmine/wiki/HowTo_Install_Redmine_in_a_sub-URI)    
[Redmine 1.1.0 + Apache + Passenger installation on Red Hat to a sub-URI](http://www.redmine.org/projects/redmine/wiki/Redmine+Apache+Passenger_InstallOnRedHat)  
[How to install Redmine 1.4 (CentOS 5.8)](http://www.bilot.com/?p=917)

### 4. Java
#### 安装
到 [Oracle官方网站](http://java.sun.com)下载 JDK (本文下载的是 rpm 包)

```terminal
# rpm -ivh jdk-7u4-linux-x64.rpm 
Preparing...                ########################################### [100%]
   1:jdk                    ########################################### [100%]
Unpacking JAR files...
	    rt.jar...
    jsse.jar...
    charsets.jar...
    tools.jar...
    localedata.jar...
```

默认安装位置为 `/usr/java`

```terminal
# cd /usr/java/
# ll
total 4
lrwxrwxrwx. 1 root root   16 May  6 10:06 default -> /usr/java/latest
drwxr-xr-x. 8 root root 4096 May  6 10:06 jdk1.7.0_04
lrwxrwxrwx. 1 root root   21 May  6 10:06 latest -> /usr/java/jdk1.7.0_04
```

#### 设置环境变量

```terminal
# update-alternatives --install /usr/bin/java java /usr/java/default/bin/java 2
# update-alternatives --config java
    
There are 2 programs which provide 'java'.
    
  Selection    Command
-----------------------------------------------
*+ 1           /usr/lib/jvm/jre-1.6.0-openjdk.x86_64/bin/java
   2           /usr/java/default/bin/java
    
Enter to keep the current selection[+], or type selection number: 2
# java -version
java version "1.7.0_04"
Java(TM) SE Runtime Environment (build 1.7.0_04-b20)
Java HotSpot(TM) 64-Bit Server VM (build 23.0-b21, mixed mode)
```

有时需要设置 `JAVA_HOME`，可以放到系统环境变量中，创建 shell 脚本(两种)  
Create the Bourne script in /etc/profile.d/java.sh

```terminal
    # vi /etc/profile.d/jdk.sh
```

脚本如下：

```shell
# Oracle jdk
    
if [ -d /usr/java/default ]; then
    JAVA_HOME=/usr/java/default
    PATH=$JAVA_HOME/bin:$PATH
    export JAVA_HOME PATH
fi
```

Create the C-shell script in /etc/profile.d/java.csh

```terminal
# vi /etc/profile.d/jdk.csh
```

脚本如下：

```shell
# Oracle jdk
    
if ( -d /usr/java/default ) then
    setenv JAVA_HOME "/usr/java/default"
    setenv PATH "$JAVA_HOME/bin:$PATH"
endif
```

使之立即生效

```terminal
# source /etc/profile
```

#### 测试

```terminal
# echo $JAVA_HOME
/usr/java/default
```

### 5. Jenkins
#### 安装
本文使用 yum 安装

```terminal
# wget -O /etc/yum.repos.d/jenkins.repo http://pkg.jenkins-ci.org/redhat/jenkins.repo
# rpm --import http://pkg.jenkins-ci.org/redhat/jenkins-ci.org.key
# yum install jenkins
```

安装的文件信息在 `/etc/init.d/jenkins` 中可以找到,需要修改配置,默认是 `JENKINS_JAVA_CMD=""`，jenkins 会查找 `/usr/bin/java`，正常是可能能找到的，但是我在安装时，始终出错，改为绝对路径就 OK 了。

```terminal
# vi /etc/sysconfig/jenkins
```

修改 `JENKINS_JAVA_CMD` 这个变量

```conf
JENKINS_JAVA_CMD="/usr/java/default/bin/java"
```
 
#### 测试

```terminal
# service jenkins start
```
    
访问：`http://localhost:8080`  
#### Nginx 代理
为使 nginx 代理，也要修改一下配置

```terminal
# vi /etc/sysconfig/jenkins
JENKINS_ARGS="--prefix=/jenkins"
```

此时，jenkins 的入口地址为：`http://localhost:8080/jenkins`

```terminal
# vi /etc/nginx/conf.d/default.conf

location /jenkins/ {
    proxy_pass http://127.0.0.1:8080;
}
```

重新加载 nginx 配置

```terminal
# service nginx reload
```
#### 测试
访问：`http://localhost/jenkins`
#### 参考
[Installing Jenkins on RedHat distributions](https://wiki.jenkins-ci.org/display/JENKINS/Installing+Jenkins+on+RedHat+distributions)  
[RedHat Linux RPM packages for Jenkins](http://pkg.jenkins-ci.org/redhat/)  
[CentOS に Jenkins と Maven](http://d.hatena.ne.jp/sardine/20110602)  
[Running Jenkins behind Apache](https://wiki.jenkins-ci.org/display/JENKINS/Running+Jenkins+behind+Apache)

### 6. Maven
#### 安装
到[maven.apache.org](http://maven.apache.org)找一个镜像进行下载。

```terminal
# wget http://labs.renren.com/apache-mirror/maven/binaries/apache-maven-3.0.4-bin.tar.gz
# cp apache-maven-3.0.4-bin.tar.gz /usr/local
# cd /usr/local
# tar -xzvf apache-maven-3.0.4-bin.tar.gz
# ln -s /usr/local/apache-maven-3.0.4 /usr/local/maven
# rm -f apache-maven-3.0.4-bin.tar.gz
```

添加到系统环境变量

```
# vi /etc/profile.d/maven.sh
```
添加如下内容

```shell
# Maven Path

if [ -d /usr/local/maven ]; then
    M2_HOME=/usr/local/maven
    PATH=$PATH:$M2_HOME/bin
    export M2_HOME PATH
fi
```

使之生效

```terminal
# source /etc/profile
```

#### 测试

```terminal
# mvn -version
Apache Maven 3.0.4 (r1232337; 2012-01-17 16:44:56+0800)
Maven home: /usr/local/maven
Java version: 1.7.0_04, vendor: Oracle Corporation
Java home: /usr/java/jdk1.7.0_04/jre
Default locale: en_US, platform encoding: UTF-8
OS name: "linux", version: "2.6.32-220.13.1.el6.x86_64", arch: "amd64", family: "unix"
```

### 7. Nexus
#### 安装
到[Sonatype的官方网站](http://www.sonatype.org)下载

```terminal
# wget http://www.sonatype.org/downloads/nexus-2.0.4-1-bundle.tar.gz
# cp nexus-2.0.4-1-bundle.tar.gz /usr/local
# cd /usr/local
# tar zxvf nexus-2.0.4-1-bundle.tar.gz
# ln -s /usr/local/nexus-2.0.4-1 /usr/local/nexus
# rm -rf nexus-2.0.4-1-bundle.tar.gz
```

#### 设置为服务

```terminal
# cp /usr/local/nexus/bin/nexus /etc/init.d
# vi /etc/init.d/nexus
```

主要修改如下几项：

```conf
NEXUS_HOME="/usr/local/nexus"
RUN_AS_USER=root
PIDDIR="/var/run"
```
 
修改权限

```terminal
# chmod 755 /etc/init.d/nexus
```

启动服务

```terminal
# service nexus start
```

访问：http://localhost:8081/nexus
#### Nginx代理

```terminal
# vi /etc/nginx/conf.d/default.conf

location /nexus/ {
    proxy_pass http://127.0.0.1:8081;
}
```

注: nexus默认使用8081端口，相关配置信息在`$NEXUS_HOME/bin/nexus.properties`中；

重新加载nginx配置

```terminal
# service nginx reload
```

#### 测试
访问：http://localhost/nexus
#### 参考
[Installing Nexus OSS](http://kb.sonatype.org/entries/20673251-installing-nexus-oss)  
[Repository Management with Nexus](http://www.sonatype.com/books/nexus-book/reference/install-sect-service.html)  
[How do I change the port or address that Nexus binds to?](http://kb.sonatype.org/entries/21159382-how-do-i-change-the-port-or-address-that-nexus-binds-to)
### 8. Git
#### 安装
本文使用yum安装

```terminal
# yum install git
```

如果想使用图形化用户界面，可以安装默认的git-gui程序

```terminal
# yum install git-gui
```

### 9. Gerrit
#### 安装
下载安装包，访问http://code.google.com/p/gerrit，本文下载的是gerrit-2.3.war
创建数据库(本文以MySQL为例)

```terminal
# mysql -u root -p
mysql> CREATE USER 'gerrit2'@'localhost' IDENTIFIED BY 'gerrit2';
mysql> CREATE DATABASE reviewdb;
mysql> ALTER DATABASE reviewdb charset=latin1;
mysql> GRANT ALL ON reviewdb.* TO 'gerrit2'@'localhost';
mysql> FLUSH PRIVILEGES;
```

安装gerrit

```terminal
# cp gerrit-2.3.war /usr/local
# cd /usr/local
# java -jar gerrit-2.3.war init -d review_site
```

安装过程一般直接回车即可，主要注意一下地方：
数据库(本文是用MySQL,默认为H2)

```terminal
*** SQL Database
*** 

Database server type           [H2/?]: mysql
```

认证类型(本文使用http,默认为OPENID)

```terminal
Authentication method          [OPENID/?]: http
```

端口(本文使用8082，因为前面安装nexus已经使用了8081端口)

```terminal
*** HTTP Daemon
*** 

Behind reverse proxy           [y/N]? y
Proxy uses SSL (https://)      [y/N]? 
Subdirectory on proxy server   [/]: /gerrit        
Listen on address              [*]: 
Listen on port                 [8081]: 
Canonical URL                  [http://localhost/gerrit]: 

Initialized /usr/local/gerrit
Executing /usr/local/gerrit/bin/gerrit.sh start
Starting Gerrit Code Review: OK
Waiting for server to start ... OK
Opening browser ...
No protocol specified
```

新建passwd文件

```terminal
# mkdir /etc/nginx/passwd
# htpasswd -c /etc/nginx/passwd/gerrit2.passwd gerrit2
New password: 
Re-type new password: 
Adding password for user gerrit2
```

查看gerrit的配置文件，整个配置文件是这样的

```terminal
# vi /usr/local/gerrit/etc/gerrit.config

[gerrit]
        basePath = git
        canonicalWebUrl = http://localhost/gerrit/
[database]
        type = MYSQL
        hostname = localhost
        database = reviewdb
        username = gerrit2
[auth]
        type = HTTP
[sendemail]
        smtpServer = localhost
[container]
        user = root
        javaHome = /usr/java/jdk1.7.0_04/jre
[sshd]
        listenAddress = *:29418
[httpd]
        listenUrl = proxy-http://*:8082/gerrit/
[cache]
        directory = cache
```

启动服务

```terminal
# /usr/local/gerrit/bin/gerrit.sh start
```

其他命令，如stop, restart等，可参考[Gerrit](http://code.google.com/p/gerrit)的文档说明  
访问：http://localhost:8082/gerrit
#### Nginx代理
编辑nginx配置

```terminal
# vi /etc/nginx/conf.d/default.conf

location /gerrit/ {
    proxy_pass        http://127.0.0.1:8082;
    proxy_set_header  X-Forwarded-For $remote_addr;
    proxy_set_header  Host $host;
    auth_basic        "Gerrit Code Review";
    auth_basic_user_file /etc/nginx/passwd/gerrit2.passwd;
}
```

#### 测试
访问：http://localhost/gerrit/  
输入用户名`gerrit2`，密码为刚才设置的密码(本文设为`gerrit2`);
#### 参考
[Gerrit Code Review for Git](http://gerrit-documentation.googlecode.com/svn/Documentation/2.3/index.html)  
[Invalid redirects to change pages when using proxy-https](http://code.google.com/p/gerrit/issues/detail?id=905)

