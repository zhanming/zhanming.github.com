---
layout: post
title: CentOS 8 配置 ProxySQL Cluster
categories: [Linux]
tags: [centos, mysql, proxysql, galera, pxc]
summary: CentOS 8 配置 ProxySQL Cluster，记录一下安装过程。
---

## 前言

CentOS 8 配置 ProxySQL Cluster，记录一下安装过程。

### 环境说明
CentOS 8（Minimal Install）

```terminal
$ cat /etc/centos-release
CentOS Linux release 8.2.2004 (Core)
```

配置如下

| Node   | Host      | IP Addr      | Descprition |
| ------ | --------- | ------------ | ----------- |
| Node1  | pxc1      | 10.0.0.81/24 | 集群节点1    |
| Node2  | pxc2      | 10.0.0.82/24 | 集群节点2    |
| Node3  | pxc3      | 10.0.0.83/24 | 集群节点3    |
| Proxy1 | proxysqll | 10.0.0.71/24 | 代理节点1    |
| Proxy2 | proxysql2 | 10.0.0.72/24 | 代理节点2    |
| Proxy3 | proxysql3 | 10.0.0.73/24 | 代理节点3    |
| VIP    | n/a       | 10.0.0.61/24 | 虚拟IP节点   |

结构图如下

```terminal
Diagram:

o--------o      o-----------------------------------------o      o-----------------------------------------o
| MySQL  |--+   |           o---------------o             |      |           o---------------o             |
| Client1|  |   |           | IP: 10.0.0.71 |             |      |           | IP: 10.0.0.81 |             |
o--------o  |   |           | ProxySQL      |             |      |           | PXC1 (master) |             |
o--------o  |   |           o---------------o             |      |           o---------------o             |
| MySQL  |--+-->| VIP: 10.0.0.61 /        \               |----->|              /          \               |
| Client2|  |   |               /          \              |      |             /            \              |    
o--------o  |   | o---------------o     o---------------o |      | o---------------o     o---------------o |
o--------o  |   | | IP: 10.0.0.72 | --- | IP: 10.0.0.73 | |      | | IP: 10.0.0.82 | --- | IP: 10.0.0.83 | |
| MySQL  |--+   | | ProxySQL      |     | ProxySQL      | |      | | PXC2 (master) |     | PXC3 (master) | |
| Client3|      | o---------------o     o---------------o |      | o---------------o     o---------------o |
o--------o      o-----------------------------------------o      o-----------------------------------------o
```

## 安装

### 先决条件

PXC 集群需要提前安装好。可以参考 [CentOS 8 安装 Percona XtraDB Cluster 8.0][2]

### 安装 Keepalived

Keepalived 主要是为了让客户端不需要更改配置。

在 `proxysql1`, `proxysql2` , `proxysql3` 节点上安装 keepalived，请参考 [CentOS 7 配置 Keepalived 实现双机热备][4]

```terminal
$ sudo dnf install keepalived
```

配置如下 

```terminal
$ sudo vi /etc/keepalived.conf 
```

`proxysql1` 中的 keepalive 配置样例如下：

```terminal
global_defs {
    no_email_faults
    router_id proxysql1 # 本机ID
}

# Script used to check if ProxySQL is running
vrrp_script check_proxysql {
    script "pidof proxysql"
    interval 2 # 轮训间隔 2 秒
    weight 3 # 权重，如果成功，本机权重为 101 + 3 = 104
}

vrrp_instance proxysql161 {
    state MASTER # 备节点为 BACKUP
    interface enp0s3 # 网卡ID
    virtual_router_id 161 # 虚拟路由ID
    priority 101 # 默认权重
    advert_int 1
    unicast_src_ip 10.0.0.171 # 单点广播
    unicast_peer {
        10.0.0.172
        10.0.0.173
    }
    authentication {
        auth_type PASS
        auth_pass 1111
    }
    virtual_ipaddress { # 虚拟IP
        10.0.0.161/24 brd 10.0.0.255
    }
    track_script { # 健康检查脚本
        check_proxysql
    }
}
```

本例添加了 `check_proxysql` 使用 `pidof` 命令判断 proxysql 进程是否存在，进而达到 IP 地址漂移的目的。

由于是 3 个节点，所以 check_proxysql 中设置的权重为 3 `weight 3`

`proxysql2` 和 `proxysql3` 需要配置，请注意相应变化点，本例不做过多说明。

### 安装 ProxySQL2

配置 yum 源如下

```terminal
$ sudo dnf install https://repo.percona.com/yum/percona-release-latest.noarch.rpm
```

安装 proxysql2 的包

```terminal
$ sudo yum install proxysql2
```

安装之后，可以查看一下版本

```terminal
$ proxysql --version
ProxySQL version 2.0.12-percona-1.1, codename Truls
```

启动服务并设置开机启动

```terminal
$ sudo systemctl enable --now proxysql
```

## 配置 

>`注意`：`proxysql1` 和 `proxysql2` 这两个节点的都要这样配置

配置 ProxySQL 官方推荐使用 `Admin interface`，在线修改，不需要重启 ProxySQL 服务，本例也是使用这种方式。

### 登录到 Admin 接口

管理接口需要 MySQL 客户端，由于本例已经安装了 Percona 的 yum 源，客户端也使用 Percona 的。

```terminal
$ sudo percona-release setup pxc80
$ sudo dnf install percona-xtradb-cluster-client
```

由于 MySQL 8.0 的密码模块升级，但是 ProxySQL 目前还没有全部支持，所以需要修改一下配置，可以参考 [ProxySQL Support for MySQL 8.0][6]

默认的安装没有 `/etc/my.cnf`，需要新建一下这个配置文件。

```terminal
$ sudo vi /etc/my.cnf
```

加入 `default-auth=mysql_native_password` 到 `[mysqld]` 中

```terminal
[mysqld]
default_authentication_plugin=mysql_native_password
```

安装完成之后，使用如下命令登入管理接口，默认的用户名和密码都是 `admin`

```terminal
$ mysql -u admin -p -h 127.0.0.1 -P6032 --prompt='Admin> '
Enter password: # 输入密码 admin
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 1
Server version: 5.5.30 (ProxySQL Admin Module)

Copyright (c) 2009-2020 Percona LLC and/or its affiliates
Copyright (c) 2000, 2020, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

Admin>
```

登录成功之后，可以查看一下数据库。

```terminal
Admin> show databases;
+-----+---------------+-------------------------------------+
| seq | name          | file                                |
+-----+---------------+-------------------------------------+
| 0   | main          |                                     |
| 2   | disk          | /var/lib/proxysql/proxysql.db       |
| 3   | stats         |                                     |
| 4   | monitor       |                                     |
| 5   | stats_history | /var/lib/proxysql/proxysql_stats.db |
+-----+---------------+-------------------------------------+
5 rows in set (0.00 sec)

```

ProxySQL 主要使用 5 个数据库.
1. main库：内存配置数据库，即 memory，表里面存放后端 db 实例、用户验证、路由规则等信息。
2. disk库：持久化磁盘的配置。
3. stats库：统计信息的汇总。
4. monitor库：一些监控的收集信息，包括数据库的健康状态等。
5. stats_history 统计信息历史库

配置主要使用 `main` 数据库，可以查看一下

```terminal
Admin> show tables from main;
+----------------------------------------------------+
| tables                                             |
+----------------------------------------------------+
| global_variables                                   |
| ...                                                |
| mysql_galera_hostgroups                            |
| ...                                                |
| mysql_servers                                      |
| mysql_users                                        |
| proxysql_servers                                   |
| restapi_routes                                     |
| runtime_checksums_values                           |
| runtime_global_variables                           |
| ...                                                |
| runtime_mysql_galera_hostgroups                    |
| ...                                                |
| runtime_mysql_servers                              |
| runtime_mysql_users                                |
| runtime_proxysql_servers                           |
| ...                                                |
+----------------------------------------------------+
32 rows in set (0.00 sec)

```

### 配置集群参数

先要设置集群配置，执行如下 SQL 语句，主要是更改 `global_variable` 表)：

```terminal
Admin>
update global_variables set variable_value='admin:admin;cluster1:clusterpass' where variable_name='admin-admin_credentials';

update global_variables set variable_value='cluster1' where variable_name='admin-cluster_username';
update global_variables set variable_value='clusterpass' where variable_name='admin-cluster_password';
update global_variables set variable_value=200 where variable_name='admin-cluster_check_interval_ms';
update global_variables set variable_value=100 where variable_name='admin-cluster_check_status_frequency';

update global_variables set variable_value='true' where variable_name='admin-cluster_mysql_query_rules_save_to_disk';
update global_variables set variable_value='true' where variable_name='admin-cluster_mysql_servers_save_to_disk';
update global_variables set variable_value='true' where variable_name='admin-cluster_mysql_users_save_to_disk';
update global_variables set variable_value='true' where variable_name='admin-cluster_proxysql_servers_save_to_disk';

update global_variables set variable_value=3 where variable_name='admin-cluster_mysql_query_rules_diffs_before_sync';
update global_variables set variable_value=3 where variable_name='admin-cluster_mysql_servers_diffs_before_sync';
update global_variables set variable_value=3 where variable_name='admin-cluster_mysql_users_diffs_before_sync';
update global_variables set variable_value=3 where variable_name='admin-cluster_proxysql_servers_diffs_before_sync';

load admin variables to runtime;
save admin variables to disk;
```

### 配置集群节点

添加 ProxySQL 节点信息到 `proxysql_servers` 表中

```terminal
insert into proxysql_servers (hostname,port,weight,comment) VALUES ('10.0.0.71',6032,100,'PRIMARY');
insert into proxysql_servers (hostname,port,weight,comment) VALUES ('10.0.0.72',6032,100,'SECONDARY');
insert into proxysql_servers (hostname,port,weight,comment) VALUES ('10.0.0.73',6032,100,'SECONDARY');

load proxysql servers to runtime;
save proxysql servers to disk;
```

### 添加 PXC 配置

因为后端 pxc 使用的是 galera 

本例设置主机组如下

| hostgroup_id | hostgroup     |
| ------------ | ------------- |
| 1            | Writer        |
| 2            | Backup Writer |
| 3            | Reader        |
| 4            | Offline       |

增加 `galera_hostgroup` 的配置

```terminal
Admin> insert into mysql_galera_hostgroups (writer_hostgroup, backup_writer_hostgroup, reader_hostgroup, offline_hostgroup, active, max_writers, writer_is_also_reader, max_transactions_behind) values (1, 2, 3, 4, 1, 1, 1, 100);
```

查看一下

```terminal
Admin> select * from mysql_galera_hostgroups;
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
| writer_hostgroup | backup_writer_hostgroup | reader_hostgroup | offline_hostgroup | active | max_writers | writer_is_also_reader | max_transactions_behind | comment |
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
| 1                | 2                       | 3                | 4                 | 1      | 1           | 1                     | 100                     | NULL    |
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
1 row in set (0.00 sec)
```

使用 load 命令加载配置到运行时，使用 save 命令保存到磁盘

```terminal
Admin> load mysql servers to runtime;
Admin> save mysql servers to disk;
```

接下来查看一下运行时的表 `runtime_mysql_galera_hostgroups`

```terminal
Admin> select * from runtime_mysql_galera_hostgroups;
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
| writer_hostgroup | backup_writer_hostgroup | reader_hostgroup | offline_hostgroup | active | max_writers | writer_is_also_reader | max_transactions_behind | comment |
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
| 1                | 2                       | 3                | 4                 | 1      | 1           | 1                     | 100                     | NULL    |
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
1 row in set (0.00 sec)
```


接下来将 pxc 的信息插入 `mysql_servers` 表，如下：

```terminal
Admin> insert into mysql_servers (hostname, port, weight) values ('10.0.0.81', 3306, 100);
Admin> insert into mysql_servers (hostname, port, weight) values ('10.0.0.82', 3306, 100);
Admin> insert into mysql_servers (hostname, port, weight) values ('10.0.0.83', 3306, 100);
```

使用 load 命令加载配置到运行时，使用 save 命令保存到磁盘

```terminal
Admin> load mysql servers to runtime;
Admin> save mysql servers to disk;
```

查看一下

```terminal
Admin> select * from mysql_servers;
+--------------+-----------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
| hostgroup_id | hostname  | port | gtid_port | status | weight | compression | max_connections | max_replication_lag | use_ssl | max_latency_ms | comment |
+--------------+-----------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
| 1            | 10.0.0.83 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
| 3            | 10.0.0.82 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
| 3            | 10.0.0.81 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
| 3            | 10.0.0.83 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
| 2            | 10.0.0.82 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
| 2            | 10.0.0.81 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
+--------------+-----------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
6 rows in set (0.00 sec)
```

接下来，查看一下运行时的表 `runtime_mysql_servers`

```terminal
Admin> select * from runtime_mysql_servers;
+--------------+--------------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
| hostgroup_id | hostname     | port | gtid_port | status | weight | compression | max_connections | max_replication_lag | use_ssl | max_latency_ms | comment |
+--------------+--------------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
| 1            | 10.0.0.83 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
| 2            | 10.0.0.81 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
| 2            | 10.0.0.82 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
| 3            | 10.0.0.81 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
| 3            | 10.0.0.82 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
| 3            | 10.0.0.83 | 3306 | 0         | ONLINE | 1      | 0           | 1000            | 0                   | 0       | 0              |         |
+--------------+--------------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
6 rows in set (0.01 sec)
```

可以看到，`pxc3` 为可读可写组，`pxc1`, `pxc2` 为备写组，`pxc1`, `pxc2`, `pxc3` 都为可读组

查看一下连接情况

```terminal
Admin> select hostgroup,srv_host,status,ConnUsed,MaxConnUsed,Queries,Latency_us from stats.stats_mysql_connection_pool order by srv_host;
+-----------+------------+--------+----------+-------------+---------+------------+
| hostgroup | srv_host   | status | ConnUsed | MaxConnUsed | Queries | Latency_us |
+-----------+------------+--------+----------+-------------+---------+------------+
| 2         | 10.0.0.81 | ONLINE | 0        | 0           | 0       | 1305       |
| 3         | 10.0.0.81 | ONLINE | 0        | 0           | 0       | 1305       |
| 2         | 10.0.0.82 | ONLINE | 0        | 0           | 0       | 943        |
| 3         | 10.0.0.82 | ONLINE | 0        | 0           | 0       | 943        |
| 1         | 10.0.0.83 | ONLINE | 0        | 0           | 0       | 1472       |
| 3         | 10.0.0.83 | ONLINE | 0        | 0           | 0       | 1180       |
+-----------+------------+--------+----------+-------------+---------+------------+
6 rows in set (0.01 sec)
```

### 更改 Global Variables

接下来，更改 `global_variables` 的配置，各字段的详细说明请参考 [ProxySQL Global Variables][3]，本例只更改以下几个：

设置 monitor 的用户名和密码

`mysql-monitor_username` 和 `mysql-monitor_password`，是监控后台数据库的状态，需要现在后台数据库（PXC 集群）建立用户和赋予权限

PXC 集群中，只登录其中一台更改即可，本例以 `pxc1`为例

先登入到 MySQL
```terminal
[admin@pxc1 ~]$ mysql -u root -p
```

新建用户命令如下，请将 `monitor` 替换为您的用户名和密码

```terminal
mysql@pxc1> create user 'monitor'@'%' identified with mysql_native_password by 'monitor';
mysql@pxc1> grant all on *.* to 'monitor'@'%';
mysql@pxc1> flush privileges;
```

> `注意` 使用的是 `mysql_native_password` 身份验证插件

本例 `pxc1` 新建的用户为 `monitor`，也是 ProxySQL 默认的，如果不一致，请更新相应的字段，如下为例

```terminal
Admin> UPDATE global_variables SET variable_value='monitor' WHERE variable_name='mysql-monitor_username';
Admin> UPDATE global_variables SET variable_value='monitor' WHERE variable_name='mysql-monitor_password';
```

最后，使用 load 命令加载配置到运行时，使用 save 命令保存到磁盘。

```terminal
Admin> load mysql variables to runtime;
Admin> save mysql variables to disk;
```

为确保监控已经加载，可以查看一下监控日志

先查看连接日志表 `monitor.mysql_server_connect_log`

```terminal
Admin> SELECT * FROM monitor.mysql_server_connect_log ORDER BY time_start_us DESC LIMIT 6;
+-----------+------+------------------+-------------------------+---------------+
| hostname  | port | time_start_us    | connect_success_time_us | connect_error |
+-----------+------+------------------+-------------------------+---------------+
| 10.0.0.83 | 3306 | 1592979435256476 | 3861                    | NULL          |
| 10.0.0.81 | 3306 | 1592979434681743 | 2552                    | NULL          |
| 10.0.0.83 | 3306 | 1592979434107190 | 9074                    | NULL          |
| 10.0.0.81 | 3306 | 1592979375283753 | 2342                    | NULL          |
| 10.0.0.83 | 3306 | 1592979374693727 | 4042                    | NULL          |
| 10.0.0.82 | 3306 | 1592979374103852 | 3574                    | NULL          |
+--------------+------+------------------+-------------------------+---------------+
6 rows in set (0.00 sec)
```
可以看到 `connect_error` 为 NULL 表示，没有问题。

再查看一下 ping 日志表 `monitor.mysql_server_ping_log`

```terminal
Admin> SELECT * FROM monitor.mysql_server_ping_log ORDER BY time_start_us DESC LIMIT 6;
+-----------+------+------------------+----------------------+------------+
| hostname  | port | time_start_us    | ping_success_time_us | ping_error |
+-----------+------+------------------+----------------------+------------+
| 10.0.0.83 | 3306 | 1592979544343950 | 982                  | NULL       |
| 10.0.0.81 | 3306 | 1592979544229178 | 698                  | NULL       |
| 10.0.0.82 | 3306 | 1592979544114590 | 1347                 | NULL       |
| 10.0.0.82 | 3306 | 1592979534332171 | 890                  | NULL       |
| 10.0.0.83 | 3306 | 1592979534223308 | 1020                 | NULL       |
| 10.0.0.81 | 3306 | 1592979534114368 | 1325                 | NULL       |
+-----------+------+------------------+----------------------+------------+
6 rows in set (0.00 sec)
```

可以看到 `ping_error` 为 NULL, 表示没有问题

ProxySQL 默认的客户端连接端口是 `6033` 可以修改为 MySQL 默认的 `3306`

```terminal
Admin> update global_variables set variable_value='0.0.0.0:3306' where variable_name='mysql-interfaces';
```

然后要保存到磁盘

```terminal
Admin> save mysql variables to disk;
Admin> exit
```

之后重启一下 proxysql

```terminal
$ sudo systemctl restart proxysql
```

这样客户端就可以使用 MySQL 的默认端口访问了。

### 添加客户端用户

目前 ProxySQL 已经可以连接到后端集群，并且监控集群情况。接下来，我们要添加一个数据库用户，给客户端使用，主要用到 `mysql_users` 表。

先在 pxc 集群的任意节点上创建一个用户，本例以 `pxc1` 为例。

先登入到 MySQL
```terminal
[admin@pxc1 ~]$ mysql -u root -p
```

新建用户命令如下，请将 `dev` 替换为您的用户名和密码，授权请根据自己的实际情况，不在本例讨论范围。

```terminal
mysql@pxc1> create user 'dev'@'%' identified with mysql_native_password by 'dev';
mysql@pxc1> grant all on *.* to 'dev'@'%';
mysql@pxc1> flush privileges;
```

> `注意` 使用的是 `mysql_native_password` 身份验证插件

然后回到 ProxySQL，设置 `mysql_uers` 表。

```terminal
Admin> insert into mysql_users(username, password, default_hostgroup, transaction_persistent) values('dev', 'dev', 1, 1);
```

查询一下

```terminal
Admin> select * from mysql_users;
+----------+----------+--------+---------+-------------------+----------------+---------------+------------------------+--------------+---------+----------+-----------------+---------+
| username | password | active | use_ssl | default_hostgroup | default_schema | schema_locked | transaction_persistent | fast_forward | backend | frontend | max_connections | comment |
+----------+----------+--------+---------+-------------------+----------------+---------------+------------------------+--------------+---------+----------+-----------------+---------+
| dev      | dev      | 1      | 0       | 1                 | NULL           | 0             | 1                      | 0            | 1       | 1        | 10000           |         |
+----------+----------+--------+---------+-------------------+----------------+---------------+------------------------+--------------+---------+----------+-----------------+---------+
1 row in set (0.00 sec)
```

最后，使用 load 命令加载配置到运行时，使用 save 命令保存到磁盘。

```terminal
Admin> load mysql users to runtime;
Admin> save mysql users to disk;
```

使用用户访问 PXC 集群, ProxySQL 默认使用 `6033` 端口进行代理，本例前面已经改为 `3306`

```terminal
$ mysql -u dev -p -h 127.0.0.1
Enter password: # 输入密码
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 9
Server version: 5.5.30 (ProxySQL)

Copyright (c) 2009-2019 Percona LLC and/or its affiliates
Copyright (c) 2000, 2019, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> 
mysql> select @@server_id;
+-------------+
| @@server_id |
+-------------+
|           1 |
+-------------+
1 row in set (0.00 sec)

```

这样，客户端就可以访问数据库，并进行数据库操作了。

### 其他

开放防火墙端口，本例设置的 mysql 默认端口

```terminal
$ sudo firewall-cmd --permanent --add-service=mysql
success
$ sudo firewall-cmd --reload
```

查看日志，位置为 `/var/lib/proxysql/proxysql.log`

```terminal
$ sudo tail -f /var/lib/proxysql/proxysql.log
```

## 结束语

本例演示 ProxySQL 集群的配置过程。

## 参考资料
[The proxysql-admin Tool with ProxySQL v2][1]  
[CentOS 8 安装 Percona XtraDB Cluster 8.0][2]  
[ProxySQL - Global Variables][3]  
[Native Galera Support In ProxySQL][5]  
[ProxySQL Support for MySQL 8.0][6]  
[ProxySQL Experimental Feature: Native ProxySQL Clustering][7]  

[1]: https://www.percona.com/doc/percona-xtradb-cluster/8.0/howtos/proxysql-v2.html
[2]: {% post_url 2020-06-22-how-to-install-percona-xtradb-cluster-on-centos-8 %}  
[3]: https://github.com/sysown/proxysql/blob/master/doc/global_variables.md
[4]: {% post_url 2018-05-17-how-to-config-keepalived-on-centos-7 %}  
[5]: https://proxysql.com/blog/proxysql-native-galera-support
[6]: https://github.com/sysown/proxysql/wiki/MySQL-8.0
[7]: https://www.percona.com/blog/2018/06/11/proxysql-experimental-feature-native-clustering/

