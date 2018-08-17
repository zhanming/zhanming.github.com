---
layout: post
title: CentOS 7 配置 MySQL 5.7 主从复制
categories: [Linux]
tags: [centos, mysql, replication]
update: 2018-08-17
summary: CentOS 7 配置 MySQL 5.7 主从复制（Master Slave Replication ），记录一下大致的安装和配置过程。
---
## 前言
MySQL 的复制有很多种，复制主要解决的基本问题是让一台服务器的数据与其他数据库保持同步，主从复制，主主复制，一主多从复制等,本例主要演示主从复制。

MySQL复制有两种方式：基于语句的复制和基于行的复制，一般使用基于行的复制。

基于行的复制一般分为 3 步：

- 在主库上把数据更改记录到二进制日志 (Binary Log) 中；
- 从库将主库的日志复制到自己的中继日志 (Relay Log) 中；
- 从库读取中继日志的时间，将其重放到从库的数据库中；

参考 [How To Set Up Master Slave Replication in MySQL][1]

### 环境说明
CentOS 7（Minimal Install）

```terminal
$ cat /etc/redhat-release 
CentOS Linux release 7.3.1611 (Core)
```
两台 MySQL 服务器

| Host     | Role   | Descprition | Private IP Address |
|----------|--------|-------------|--------------------|
| mysql101 | Master | 主服务器     | 10.0.0.101         |
| mysql102 | Slave  | 从服务器     | 10.0.0.102         |

## 安装和配置
两台 MySQL 服务器的版本需要一致。

### 安装 MySQL

安装过程略过，请参考 [CentOS 7 下 Yum 安装 MySQL 5.7][2]

### 创建复制账号

在两台 MySQL 服务器上创建复制账号：

```terminal
$ mysql -u root -p
Enter password: ****
mysql> GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO repl@'10.0.0.%' IDENTIFIED BY 'password';
```

其实，复制账户只需要有主库上的 REPLICATION SLAVE 权限，不需要 REPLICATION CLIENT 权限，之所以这么做，有两个原因：

- 监控和管理复制账号，需要 REPLICATION CLIENT 权限；
- 如果发生意外，有时需要从库变为主库，这样做以后会非常方便切换；

### 配置主库

主库 mysql101 上开启设置

```terminal
$ sudo vi /etc/my.cnf
```
[mysqld] 这个部分添加如下内容

```conf
server_id=101
log_bin=/var/log/mysql/mysql-bin
```

`log_bin` 参数必须唯一, 本例主库设置为 101 ，从库设置为 102；

其他参数：`binlog_do_db` 参数是复制指定的数据库。如果需要，可以这样设置：

```conf
binlog_do_db=db1
binlog_do_db=db2
binlog_do_db=db3
```

`:wq` 保存

本例设置的二进制日志文件的目录不是默认的，需要新建一下

```terminal
$ sudo mkdir /var/log/mysql
```

分配权限

```terminal
$ sudo chown mysql:mysql /var/log/mysql
```

重启主库的 MySQL 服务

```terminal
$ sudo systemctl restart mysqld
```

确认一下配置是否成功，登录 MySQL:

```terminal
$ mysql -u root -p
```
使用 SHOW MASTER STATUS 命令查看

```terminal
mysql> SHOW MASTER STATUS;
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000001 |      154 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
1 row in set (0.00 sec)
```

从结果看到， File 字段有值，并且前面与配置文件一致，说明配置正确。后面的 `000001` 说明是第一次，如果 MySQL 从启服务，这个值会递增为 `mysql-bin.000002`

### 配置从库

从库 mysql102 上配置

```terminal
$ sudo vi /etc/my.cnf
```

添加如下内容

```conf
server_id=102
log_bin=/var/log/mysql/mysql-bin.log
relay_log=/var/log/mysql/mysql-relay-bin.log
read_only=1
```
> 从库使用 `read_only=1`，这样会将从库设为只读的，如果有其他需求（如在从库上需要建表），请去掉这个配置选项。
> 
> `log_slave_updates=1`，这个配置一般在 MySQL 5.6 以前使用， MySQL 5.7 以后可以不使用，本例就没有写这个参数。

跟主库一样，从库设置的二进制日志文件的目录不是默认的，需要新建一下

```terminal
$ sudo mkdir /var/log/mysql
```
分配权限

```terminal
$ sudo chown mysql:mysql /var/log/mysql
```

重启从库的 MySQL 服务

```terminal
$ sudo systemctl restart mysqld
```

设置从库的复制参数，登录 MySQL

```terminal
$ sudo mysql -u root -p
Enter password: ****
```
设置

```terminal
mysql> CHANGE MASTER TO MASTER_HOST='10.0.0.101',
    -> MASTER_USER='repl',
    -> MASTER_PASSWORD='password',
    -> MASTER_LOG_FILE='mysql-bin.000001',
    -> MASTER_LOG_POS=0;
```
 
> `MASTER_LOG_POS` 设置为 0，因为要从日志的开头读起。 可以通过 SHOW SLAVE STATUS\G 查看复制是否执行正确
> 
> `MASTER_LOG_FILE` 设置为 mysql-bin.000001 ，此选项初始化设置时需要跟主库中的一致。设置好后，如果主库发生重启等，不需再次设置，从库会跟着更新。

查看从库状态

```terminal
mysql> SHOW SLAVE STATUS \G
*************************** 1. row ***************************
               Slave_IO_State: 
                  Master_Host: 10.0.0.101
                  Master_User: repl
                  Master_Port: 3306
                Connect_Retry: 60
              Master_Log_File: mysql-bin.000001
          Read_Master_Log_Pos: 4
               Relay_Log_File: mysql-relay-bin.000001
                Relay_Log_Pos: 4
        Relay_Master_Log_File: mysql-bin.000001
             Slave_IO_Running: No
            Slave_SQL_Running: No
                               ...
                               ...
                               ...
1 row in set (0.00 sec)
```

从 `Slave_IO_State`, `Slave_IO_Running: No`, `Slave_SQL_Running: No` 表明当前从库的复制服务还没有启动。

运行如下命令，开始复制

```terminal
mysql> START SLAVE;
```

再次查看状态

```terminal
mysql> SHOW SLAVE STATUS\G
*************************** 1. row ***************************
               Slave_IO_State: Waiting for master to send event
                  Master_Host: 10.0.0.101
                  Master_User: repl
                  Master_Port: 3306
                Connect_Retry: 60
              Master_Log_File: mysql-bin.000001
          Read_Master_Log_Pos: 154
               Relay_Log_File: mysql-relay-bin.000003
                Relay_Log_Pos: 367
        Relay_Master_Log_File: mysql-bin.000001
             Slave_IO_Running: Yes
            Slave_SQL_Running: Yes
                               ...
                               ...
                               ...
        Seconds_Behind_Master: 0
Master_SSL_Verify_Server_Cert: No
                Last_IO_Errno: 0
                Last_IO_Error: 
               Last_SQL_Errno: 0
               Last_SQL_Error: 
  Replicate_Ignore_Server_Ids: 
             Master_Server_Id: 101
                  Master_UUID: dfa5774e-555e-11e7-a079-080027783c42
             Master_Info_File: /var/lib/mysql/master.info
                    SQL_Delay: 0
          SQL_Remaining_Delay: NULL
      Slave_SQL_Running_State: Slave has read all relay log; waiting for more updates
           Master_Retry_Count: 86400
                               ...
                               ...
                               ...
1 row in set (0.00 sec)
```

从 `Slave_IO_State`, `Slave_IO_Running`, `Slave_SQL_Running` 的值，可以看出复制已经运行。

### 切换

如果遇到突发情况（如主库计算机硬件异常等），需要将从库改为主库。

登录到从库服务器 mysql102 进行配置

关闭复制

```terminal
mysql> STOP SLAVE;
```

重置，清除复制信息，这样再启动时就不会进行复制了。

```terminal
mysql> RESET SLAVE ALL;
```

更改从库的 MySQL 配置

```terminal
$ sudo vi /etc/my.cnf
```

注释掉 `read_only` 选项，这样使从库变为可读也可写。

```conf
# read_only=1
```

最后，重启 MySQL 服务

```terminal
$ sudo systemctl restart mysqld
```

注意，本例使用 IP 进行 MySQL 主从服务的配置，如果主库发生异常，应用程序需要更改访问从库的连接，更好的办法是使用 DNS 服务，只要更新 DNS ，并删除 DNS 的缓存即可，不需要更改程序的配置。 DNS 设置可以参考 [CentOS 7 使用 bind 配置私有网络的 DNS][3]

## 从另一个服务器开始复制

本例之前的内容，演示的是 MySQL 实例初始化后的复制配置。一般的情况是：已经有数据库了，新建复制数据库，这就需要先使两个 MySQL 实例的内容一致，之后在进行复制配置

#### 主库操作

设置锁

```terminal
mysql> flush tables with read lock;
```

查看 binlog 的偏移量（`注意` Position 字段的值，后面复制需要用到）

```terminal
mysql> SHOW MASTER STATUS;
+------------------+----------+--------------+------------------+-------------------+
| File             | Position | Binlog_Do_DB | Binlog_Ignore_DB | Executed_Gtid_Set |
+------------------+----------+--------------+------------------+-------------------+
| mysql-bin.000001 |      184 |              |                  |                   |
+------------------+----------+--------------+------------------+-------------------+
1 row in set (0.00 sec)
```

备份数据库

```terminal
$ mysqldump db1 > db1.sql
```

解锁

```terminal
mysql> unlock tables;
```
### 从库设置

将备份上传至从库，并在从库还原数据库

```terminal
mysql> source db1.sql;
```

如果主库的表有使用 blob 等存储二进制数据类型的字段，需要设置从库的 `max_allowed_packet` 参数，之后再导入数据库。

```terminal
$ sudo vi /etc/my.cnf
```

添加如下参数

```terminal
max_allowed_packet=100M
net_buffer_length=8K
bulk_insert_buffer_size=128M
```

> **`注意`**  
>
> 以上字段的值，请根据实际情况修改。

其他设置都一样，此处不再重复说明，主要是设置从库的复制参数

```terminal
mysql> CHANGE MASTER TO MASTER_HOST='10.0.0.101',
    -> MASTER_USER='repl',
    -> MASTER_PASSWORD='password',
    -> MASTER_LOG_FILE='mysql-bin.000001',
    -> MASTER_LOG_POS=184;
```

注意这个 `184` 即，日志的偏移量要保持一致，这样从库就开始从 184 开始进行，保证与主库执行同样的操作。

这样，复制基本完成。

## 结束语

MySQL 复制有多种方式，复制的是构建大规模，高性能的基础，实现“水平扩展”。

## 参考资料
[How To Set Up Master Slave Replication in MySQL][1]  
[CentOS 7 下 Yum 安装 MySQL 5.7][2]  
 
[1]: https://www.digitalocean.com/community/tutorials/how-to-set-up-master-slave-replication-in-mysql
[2]: http://qizhanming.com/blog/2017/05/10/centos-7-yum-install-mysql-57
[3]: http://qizhanming.com/blog/2017/05/27/how-to-configure-bind-as-a-private-network-dns-server-on-centos-7