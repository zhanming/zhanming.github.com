---
layout: post
title: CentOS 7 更改 MySQL 数据目录 
categories: [Linux]
tags: [centos, mysql]
summary: CentOS 7 安装 MySQL 后，数据库文件随着使用会逐渐变大，有时根据需求，需要更改数据库的默认数据目录。
---
## 前言
数据库文件随着使用会逐渐变大，有时根据需求，需要更改数据库的默认数据目录。

### 环境说明
CentOS 7（Minimal Install）

```terminal
$ cat /etc/redhat-release 
CentOS Linux release 7.4.1708 (Core) 
```

1. CentOS 7 安装 MySQL，请参考 [CentOS 7 下 Yum 安装 MySQL 5.7](/blog/2017/05/10/centos-7-yum-install-mysql-57) 

本例演示如下

| MySQL    | Directory      | Descprition   |
|----------|----------------|---------------|
| old      | /var/lib/mysql | 旧的目录       |
| new      | /data/mysql    | 新的目录       |

## 步骤

### 步骤 1：移动数据文件
准备移动数据文件之前，需要做一些准备工作，先检查一下当前文件目录的位置。

登录 MySQL
```terminal
$ mysql -u root -p
```

输入 root 的密码，登录 MySQL。之后出现 mysql 的提示符，然后进行查看。

```terminal
mysql> select @@datadir;
+-----------------+
| @@datadir       |
+-----------------+
| /var/lib/mysql/ |
+-----------------+
1 row in set (0.00 sec)
```

这表示 MySQL 现在使用的是默认的目录 `/var/lib/mysql`。

我们需要退出 MySQL

```terminal
mysql> exit
```

为了确保移动数据的完整性，我们需要再判断一下服务是否停止。

```terminal
$ sudo systemctl stop mysqld
```

之后查看一下状态

```terminal
$ sudo systemctl status mysqld
. . .
May 10 10:14:10 localhost.localdomain systemd[1]: Stopped MySQL Community Server.
```

可以看到服务都停止了，我们需要使用 `rsync` 命令，拷贝数据目录到新的地方，使用 `-a` 参数保留权限和其他目录的属性，使用 `-v` 参数跟踪拷贝进度。

> **`注意`**
>
> 确保最后没有斜杠，有时使用 tab 容易带出斜杠

```terminal
$ sudo mkdir /data
$ sudo rsync -av /var/lib/mysql /data/mysql
```

拷贝完成之后，我们将默认目录名进行更改，以防出错可以再次使用，成功之后再删除。

```terminal
$ sudo mv /var/lib/mysql /var/lib/mysql.bak
```

这样文件移动完成，接下来开始更改配置

### 步骤 2：配置
MySQL 默认的目录配置在 `/etc/my.cnf` 中

```terminal
$ sudo vi /etc/my.cnf
```

我们需要更改 `[mysqld]` 块，更改 `datadir` 参数和 `socket` 参数。

```terminal
[mysqld]
. . .
datadir=/data/mysql
socket=/data/mysql/mysql.sock
. . .
```

我们还需要更改 `[client]` 块的内容，默认是没有 `[client]` 块的配置的，需要添加上。

```terminal
[client]
port=3306
socket=/data/mysql/mysql.sock
```

这样设置就完成了，`:wq` 保存并退出，

### 步骤 3：重启 MySQL 服务

现在我们更改了数据目录的配置，让我们来验证一下。

```terminal
$ sudo systemctl start mysqld
$ sudo systemctl status mysqld
```
服务启动没有问题之后，我们登录到 MySQL中

```terminal
$ mysql -u root -p
```
输入 root 的密码之后，我们输入如下语句查看：

```terminal
mysql> select @@datadir;
+----------------------------+
| @@datadir                  |
+----------------------------+
| /data/mysql/               |
+----------------------------+
1 row in set (0.01 sec)
```

请查看一下数据库，确认一下没有问题之后，可以删除以前的备份。

> **`注意`**
>
> 如果怕有问题，而且又有空间，可以不删除。
> 

```terminal
$ sudo rm -Rf /var/lib/mysql.bak
```

## 结论
本文演示了 MySQL 更改数据目录，MySQL 还有其他方式更改目录。

可以参考: 

- [The MySQL Data Directory][2]
- [Setting Up Multiple Data Directories][3]

## 参考资料
[How to Change a MySQL Data Directory to a New Location on CentOS 7][1]  

 
[1]: https://www.digitalocean.com/community/tutorials/how-to-change-a-mysql-data-directory-to-a-new-location-on-centos-7
[2]: https://dev.mysql.com/doc/refman/5.7/en/data-directory.html  
[3]: https://dev.mysql.com/doc/refman/5.7/en/multiple-data-directories.html
