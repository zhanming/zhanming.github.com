---
layout: post
title: CentOS 7 下 MySQL 5.7 删除大表更快的方法 
categories: [Linux]
tags: [centos, mysql]
summary: MySQL 删除大表速度相对很慢，而且在 drop table 的时候，所有进程不管是 DDL 还是 DML 都被挂起，直到 drop table 结束才继续执行，这严重影响线上应用的使用，本次介绍使用硬链接快速删除大表的步骤。
---
## 前言
MySQL 删除大表速度相对很慢，而且在 drop table 的时候，所有进程不管是 DDL 还是 DML 都被挂起，直到 drop table 结束才继续执行，这严重影响线上应用的使用。

这是因为 InnoDB 会维护一个全局独占锁（在table cache上面），直到 drop table 完成才释放。而且如果表文件过大，直接删除会瞬时占用大量IO，造成IO阻塞。

下面我们介绍一个快速 drop table 的方法，不管多大的表，InnoDB 都可以很快返回，表删除完成。主要是使用硬链接快速删除大表的步骤。

### 环境说明
CentOS 7（Minimal Install）

```terminal
$ cat /etc/redhat-release 
CentOS Linux release 7.5.1804 (Core) 
```

MySQL 版本为 5.7

```terminal
$ mysql -u root -p
mysql> select @@version;
+------------+
| @@version  |
+------------+
| 5.7.23-log |
+------------+
1 row in set (0.00 sec)

mysql> exit
Bye
```
## 步骤

### 步骤 1: 确认数据目录
查看 MySQL 数据库目录

```terminal
$ mysql -u root -p
mysql> select @@datadir;
+-----------------+
| @@datadir       |
+-----------------+
| /var/lib/mysql/ |
+-----------------+
1 row in set (0.00 sec)

mysql> exit
Bye
```

使用 root 用户到 MySQL 的 datadir 目录下，

```terminal
$ sudo su root -
Password: 
# cd /var/lib/mysql/yourdatabase
```

> **`注意`**  
>
> 请将 `yourdatabase` 替换为您的数据库名称 

### 步骤 2: 建立硬链接

先找到要删除的大表

```terminal
# ls -lhSr mybigtable*
-rw-r-----. 1 mysql mysql   30K Aug 16 08:46 mybigtable.frm
-rw-r-----. 1 mysql mysql 99.2G Aug 16 08:46 mybigtable.ibd
```

然后建立硬链接，本例添加 hdlk 后缀，后缀可任意修改。

```terminal
# ln mybigtable.ibd mybigtable.ibd.hdlk
```

再次查看

```terminal
# ls -lhSr mybigtable*
-rw-r-----. 1 mysql mysql   30K Aug 16 08:46 mybigtable.frm
-rw-r-----. 2 mysql mysql 99.2G Aug 16 08:46 mybigtable.ibd
-rw-r-----. 2 mysql mysql 99.2G Aug 16 08:46 mybigtable.ibd.hdlk
```

> **`注意`**  
>
> 可以看到此时 `mybigtable.ibd` 的文件引用数由 1 变为 2。

### 步骤 3: 删除大表

进入 MySQL， 删除大表

```terminal
$ mysql -u root -p
Enter password:
mysql> drop table mybigtable;
Query Ok, 0 rows affacted(0.02 sec)
```

我们会发现删除得非常快，因为其直接的物理文件块没有被删除.只是删除了一个指针而已，当 INODE 的引用数 N=1 时, 删除文件需要去把这个文件相关的所有数据块清除,所以会比较耗时。

> **`注意`**  
>
> 有时数据库使用外键约束，造成删除不成功。  
> Cannot delete or update a parent row: a foreign key constraint fails

先确认表肯定要删除，确认之后，在本次会话设置 `FOREIGN_KEY_CHECKS` 变量来避免这种情况。

```terminal
mysql> SET FOREIGN_KEY_CHECKS = 0;
Query OK, 0 rows affected (0.01 sec)

mysql> drop table mybigtable;
Query Ok, 0 rows affacted(0.02 sec)

mysql> SET FOREIGN_KEY_CHECKS = 1;
Query OK, 0 rows affected (0.00 sec)

mysql> exit
Bye
```

此时再去 MySQL 的 datadir 目录查看

```terminal
# cd /var/lib/mysql/yourdatabase
# ls -lhSr mybigtable*
-rw-r-----. 1 mysql mysql 99.2G Aug 16 08:46 mybigtable.ibd.hdlk
```

发现 `mybigtable.ibd` 已经被删除，同时文件引用数变为 1。

此时，我们删除这个大文件即可。

```terminal
# rm mybigtable.ibd.hdlk
```

至此，MySQL 5.7 删除了大表，而且非常快。

## 结论
本文演示了 CentOS 7 下 MySQL 5.7 快速删除大表的方法。

## 参考资料
[mysql删除大表更快的drop table办法][1]  
[mysql删除报错Cannot delete or update a parent row][2]  

 
[1]: https://blog.csdn.net/anzhen0429/article/details/76284320  
[2]: http://blog.sina.com.cn/s/blog_8f31e5b1010156l1.html
