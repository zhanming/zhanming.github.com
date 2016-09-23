---
layout: post
title: CentOS6下Yum安装MySQL5.7备忘
categories: [Linux]
tags: [centos, mysql, yum]
---
#### 前言
MySQL 5.7

This document provides some basic instructions for using the MySQL Yum Repository to install MySQL.

参见<https://dev.mysql.com/doc/mysql-repo-excerpt/5.7/en/>

MySQL 5.7的安装与MySQL 5.6发生了一些变化，记录一下大致的安装和配置过程。

#### 环境说明
CentOS 6.8

#### 安装和配置步骤
1.配置yum源

去MySQL官网下载YUM的RPM安装包，<http://dev.mysql.com/downloads/repo/yum/>

	# 下载mysql源安装包
	shell> wget http://dev.mysql.com/get/mysql57-community-release-el6-9.noarch.rpm
	# 安装mysql源
	shell> yum localinstall mysql57-community-release-el6-9.noarch.rpm

检查YUM源是否安装成功

	shell> yum repolist enabled | grep "mysql.*-community.*"
	mysql-connectors-community           MySQL Connectors Community              21
	mysql-tools-community                MySQL Tools Community                   38
	mysql57-community                    MySQL 5.7 Community Server             130

如上所示，找到了mysql的安装包

2.选择版本

因为本例下载的5.7版本的repo，可以不用此步骤，如果想安装MySQL 5.6，可以这样做

	shell> sudo yum-config-manager --disable mysql57-community
	shell> sudo yum-config-manager --enable mysql56-community

也可以修改配置文件

	shell> cat /etc/yum.repos.d/mysql-community.repo
	...
	# Enable to use MySQL 5.6
	[mysql56-community]
	name=MySQL 5.6 Community Server
	baseurl=http://repo.mysql.com/yum/mysql-5.6-community/el/6/$basearch/
	# enabled=0 不使用这个repo
	enabled=0
	gpgcheck=1
	gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-mysql

	[mysql57-community]
	name=MySQL 5.7 Community Server
	baseurl=http://repo.mysql.com/yum/mysql-5.7-community/el/6/$basearch/
	# enable=1 使用这个repo
	enabled=1
	gpgcheck=1
	gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-mysql
	...

默认就是使用mysql57-community的repo。

3.启动服务

	shell> service mysqld start
	Starting mysqld:[ OK ]

查看MySQL服务状态

	shell> service mysqld status
	mysqld (pid  xxxx) is running...

4.开机启动

	shell> chkconfig mysqld on

5.修改root默认密码

MySQL 5.7启动后，在 `/var/log/mysqld.log` 文件中给root生成了一个默认密码。通过下面的方式找到root默认密码，然后登录mysql进行修改：

	shell> grep 'temporary password' /var/log/mysqld.log
	host: XXXXXXXX

登录MySQL并修改密码

	shell> mysql -uroot -p
	Enter password: 
	mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY 'MyNewPass4!';

注意：MySQL5.7默认安装了密码安全检查插件（validate_password），默认密码检查策略要求密码必须包含：大小写字母、数字和特殊符号，并且长度不能少于8位。

通过MySQL环境变量可以查看密码策略的相关信息：

	mysql> SHOW VARIABLES LIKE 'validate_password%';
	+--------------------------------------+--------+
	| Variable_name                        | Value  |
	+--------------------------------------+--------+
	| validate_password_check_user_name    | OFF    |
	| validate_password_dictionary_file    |        |
	| validate_password_length             | 8      |
	| validate_password_mixed_case_count   | 1      |
	| validate_password_number_count       | 1      |
	| validate_password_policy             | MEDIUM |
	| validate_password_special_char_count | 1      |
	+--------------------------------------+--------+
	7 rows in set (0.01 sec)

具体修改，参见<http://dev.mysql.com/doc/refman/5.7/en/validate-password-options-variables.html#sysvar_validate_password_policy>

指定密码校验策略

	shell> vi /etc/my.cnf
	# 添加如下键值对, 0=LOW, 1=MEDIUM, 2=STRONG
	validate_password_policy=0

禁用密码策略

	shell> vi /etc/my.cnf
	# 禁用密码校验策略
	validate_password = off

重启MySQL服务，使配置生效

	shell> service mysqld restart

6.添加远程登录用户

MySQL默认只允许root帐户在本地登录，如果要在其它机器上连接MySQL，必须修改root允许远程连接，或者添加一个允许远程连接的帐户，为了安全起见，本例添加一个新的帐户：

	mysql> GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%' IDENTIFIED BY 'secret' WITH GRANT OPTION;

7.配置默认编码为utf8
MySQL默认为latin1, 一般修改为UTF-8
	
	shell> vi /etc/my.cnf
	[mysqld]
	# 在myslqd下添加如下键值对
	character_set_server=utf8
	init_connect='SET NAMES utf8'


重启MySQL服务，使配置生效

	shell> service mysqld restart

查看字符集

	mysql> SHOW VARIABLES LIKE 'character%';
	+--------------------------+----------------------------+
	| Variable_name            | Value                      |
	+--------------------------+----------------------------+
	| character_set_client     | utf8                       |
	| character_set_connection | utf8                       |
	| character_set_database   | utf8                       |
	| character_set_filesystem | binary                     |
	| character_set_results    | utf8                       |
	| character_set_server     | utf8                       |
	| character_set_system     | utf8                       |
	| character_sets_dir       | /usr/share/mysql/charsets/ |
	+--------------------------+----------------------------+
	8 rows in set (0.00 sec

#### 参考资料
[Using the MySQL Yum Repository][1]  
[MySQL5.7安装与配置（YUM）][2]  
 
[1]: https://dev.mysql.com/doc/mysql-repo-excerpt/5.7/en/
[2]: http://blog.csdn.net/xyang81/article/details/51759200
