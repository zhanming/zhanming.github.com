---
layout: post
title: CentOS 7 配置 ProxySQL 2 集成 Percona XtraDB Cluster
categories: [Linux]
tags: [centos, mysql, proxysql, galera]
summary: CentOS 7 配置 ProxySQL 2 集成 Percona XtraDB Cluster，记录一下安装过程。
---
## 前言
CentOS 7 配置 ProxySQL 2 集成 Percona XtraDB Cluster，记录一下安装过程。

### 环境说明
CentOS 7（Minimal Install）

```terminal
$ cat /etc/centos-release
CentOS Linux release 7.6.1810 (Core)
```

配置如下

| Node   | Host      | IP Addr       | Descprition |
|--------|-----------|---------------|-------------|
| Node1  | pxc1      | 10.11.0.81/24 | 集群节点1   |
| Node2  | pxc2      | 10.11.0.82/24 | 集群节点2   |
| Node3  | pxc3      | 10.11.0.83/24 | 集群节点3   |
| Proxy1 | proxysql  | 10.11.0.84/24 | 代理节点1   |

## 安装

### 先决条件

PXC 集群已经安装好，并且可以访问。可以参考 [CentOS 7 安装 Percona XtraDB Cluster 5.7][2]

### 从 Percona 仓库安装

配置 yum  源如下

```terminal
$ sudo yum install https://repo.percona.com/yum/percona-release-latest.noarch.rpm
```

`注意` 本文使用时，yum 安装的版本为 `percona-release-1.0-11.noarch`，默认启用了 `Percona Original repository`，为 MySQL 5.7 的版本。

安装 proxysql2 的包

```terminal
$ sudo yum install proxysql2
```

安装之后，可以查看一下版本

```terminal
$ proxysql --version
ProxySQL version 2.0.6-percona-1.1, codename Truls
```

### 配置 ProxySQL 服务

安装好之后，启动服务，并配置开机启动

```terminal
$ sudo systemctl start proxysql
```

设置开机启动

```terminal
$ sudo systemctl enable proxysql
```

## 配置 

配置 ProxySQL 官方推荐使用 `Admin interface`，在线修改，不需要重启 ProxySQL 服务，本例也是使用这种方式。

另外一种是修改配置文件（需要重启）

### 登录到 Admin 接口

管理接口需要 MySQL 客户端，由于本例已经安装了 Percona 的 yum 源，客户端也使用 Percona 的，直接安装即可。

```terminal
$ sudo yum install Percona-XtraDB-Cluster-client-57
```

安装完成之后，使用如下命令登入管理接口，默认的用户名和密码都是 `admin`

```terminal
$ mysql -u admin -p -h 127.0.0.1 -P6032 --prompt='Admin> '
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 3
Server version: 5.7.0 (ProxySQL Admin Module)

Copyright (c) 2009-2019 Percona LLC and/or its affiliates
Copyright (c) 2000, 2019, Oracle and/or its affiliates. All rights reserved.

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
+--------------------------------------------+
| tables                                     |
+--------------------------------------------+
| global_variables                           |
| mysql_aws_aurora_hostgroups                |
| mysql_collations                           |
| mysql_galera_hostgroups                    |
| mysql_group_replication_hostgroups         |
| mysql_query_rules                          |
| mysql_query_rules_fast_routing             |
| mysql_replication_hostgroups               |
| mysql_servers                              |
| mysql_users                                |
| proxysql_servers                           |
| runtime_checksums_values                   |
| runtime_global_variables                   |
| runtime_mysql_aws_aurora_hostgroups        |
| runtime_mysql_galera_hostgroups            |
| runtime_mysql_group_replication_hostgroups |
| runtime_mysql_query_rules                  |
| runtime_mysql_query_rules_fast_routing     |
| runtime_mysql_replication_hostgroups       |
| runtime_mysql_servers                      |
| runtime_mysql_users                        |
| runtime_proxysql_servers                   |
| runtime_scheduler                          |
| scheduler                                  |
+--------------------------------------------+
24 rows in set (0.00 sec)

```

### 添加集群配置

添加 pxc 的信息到 `mysql_servers` 表中

本例设置主机分组如下

| hostgroup_id | hostgroup     |
|--------------|---------------|
| 1            | Offline       |
| 2            | Writer        |
| 3            | Reader        |
| 4            | Backup Writer |

插入 `mysql_servers` 表，如下：

```terminal
Admin> insert into mysql_servers (hostgroup_id, hostname, port, weight) values (2, '10.11.0.81', 3306, 1000);
Admin> insert into mysql_servers (hostgroup_id, hostname, port, weight) values (3, '10.11.0.82', 3306, 100);
Admin> insert into mysql_servers (hostgroup_id, hostname, port, weight) values (3, '10.11.0.83', 3306, 10);
```

本例设置了 `pxc1` 为可写，`pxc2` 和 `pxc3` 为可读，可以查看一下。

```terminal
Admin> select * from mysql_servers;                                                                                                                          
+--------------+------------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
| hostgroup_id | hostname   | port | gtid_port | status | weight | compression | max_connections | max_replication_lag | use_ssl | max_latency_ms | comment |
+--------------+------------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
| 2            | 10.11.0.81 | 3306 | 0         | ONLINE | 1000   | 0           | 1000            | 0                   | 0       | 0              |         |
| 3            | 10.11.0.82 | 3306 | 0         | ONLINE | 100    | 0           | 1000            | 0                   | 0       | 0              |         |
| 3            | 10.11.0.83 | 3306 | 0         | ONLINE | 10     | 0           | 1000            | 0                   | 0       | 0              |         |
+--------------+------------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
3 rows in set (0.01 sec)
```

接下来，增加 `galera_hostgroup` 的配置

```terminal
Admin> insert into mysql_galera_hostgroups (writer_hostgroup, backup_writer_hostgroup, reader_hostgroup, offline_hostgroup, active, max_writers, writer_is_also_reader, max_transactions_behind)
    -> values (2, 4, 3, 1, 1, 1, 1, 100);
```

查看一下

```terminal
Admin> select * from mysql_galera_hostgroups;
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
| writer_hostgroup | backup_writer_hostgroup | reader_hostgroup | offline_hostgroup | active | max_writers | writer_is_also_reader | max_transactions_behind | comment |
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
| 2                | 4                       | 3                | 1                 | 1      | 1           | 1                     | 100                     | NULL    |
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
1 row in set (0.00 sec)
```

使用 load 命令加载配置到运行时，使用 save 命令保存到磁盘

```terminal
Admin> load mysql servers to runtime;
Admin> save mysql servers to disk;
```

查看一下运行时的表 `runtime_mysql_servers`

```terminal
Admin> select * from runtime_mysql_servers;
+--------------+------------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
| hostgroup_id | hostname   | port | gtid_port | status | weight | compression | max_connections | max_replication_lag | use_ssl | max_latency_ms | comment |
+--------------+------------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
| 2            | 10.11.0.81 | 3306 | 0         | ONLINE | 1000   | 0           | 1000            | 0                   | 0       | 0              |         |
| 4            | 10.11.0.83 | 3306 | 0         | ONLINE | 100    | 0           | 1000            | 0                   | 0       | 0              |         |
| 4            | 10.11.0.82 | 3306 | 0         | ONLINE | 10     | 0           | 1000            | 0                   | 0       | 0              |         |
| 3            | 10.11.0.81 | 3306 | 0         | ONLINE | 1000   | 0           | 1000            | 0                   | 0       | 0              |         |
| 3            | 10.11.0.82 | 3306 | 0         | ONLINE | 10     | 0           | 1000            | 0                   | 0       | 0              |         |
| 3            | 10.11.0.83 | 3306 | 0         | ONLINE | 100    | 0           | 1000            | 0                   | 0       | 0              |         |
+--------------+------------+------+-----------+--------+--------+-------------+-----------------+---------------------+---------+----------------+---------+
6 rows in set (0.01 sec)
```

查看一下运行时的表 `runtime_mysql_galera_hostgroups`

```terminal
Admin> select * from runtime_mysql_galera_hostgroups;
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
| writer_hostgroup | backup_writer_hostgroup | reader_hostgroup | offline_hostgroup | active | max_writers | writer_is_also_reader | max_transactions_behind | comment |
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
| 2                | 4                       | 3                | 1                 | 1      | 1           | 1                     | 100                     | NULL    |
+------------------+-------------------------+------------------+-------------------+--------+-------------+-----------------------+-------------------------+---------+
1 row in set (0.00 sec)
```


查看一下连接情况

```terminal
Admin> select hostgroup,srv_host,status,ConnUsed,MaxConnUsed,Queries,Latency_us from stats.stats_mysql_connection_pool order by srv_host;
+-----------+------------+--------+----------+-------------+---------+------------+
| hostgroup | srv_host   | status | ConnUsed | MaxConnUsed | Queries | Latency_us |
+-----------+------------+--------+----------+-------------+---------+------------+
| 2         | 10.11.0.81 | ONLINE | 0        | 0           | 0       | 1305       |
| 3         | 10.11.0.81 | ONLINE | 0        | 0           | 0       | 1305       |
| 3         | 10.11.0.82 | ONLINE | 0        | 0           | 0       | 943        |
| 4         | 10.11.0.82 | ONLINE | 0        | 0           | 0       | 943        |
| 3         | 10.11.0.83 | ONLINE | 0        | 0           | 0       | 1472       |
| 4         | 10.11.0.83 | ONLINE | 0        | 0           | 0       | 1180       |
+-----------+------------+--------+----------+-------------+---------+------------+
6 rows in set (0.01 sec)
```

可以看到 ProxySQL 自动将 `pxc1` (10.11.0.81) 设为`可读可写`，剩下两个 `pxc2` (10.11.0.82) 和 `pxc3` (10.11.0.83) 都设为`备写可读`的状态。

### 设置读/写分离

现在要定义查询规则，将读/写分开，主要使用 `mysql_query_rules` 表，设置之后，使用 load 命令加载配置到运行时，使用 save 命令保存到磁盘。

```terminal
Admin> insert into mysql_query_rules (active, match_digest, destination_hostgroup, apply) values (1, '^SELECT.*@@',3, 1);
Admin> insert into mysql_query_rules (active, match_digest, destination_hostgroup, apply) values (1, '^SELECT.* FOR UPDATE',2, 1);
Admin> load mysql query rules to runtime;
Admin> save mysql query rules to disk;
```

配置完之后，查看一下

```terminal
Admin> select * from mysql_server_galera_log order by time_start_us desc limit 3;
+------------+------+------------------+-----------------+-------------------+-----------+------------------------+-------------------+--------------+----------------------+---------------------------------+-------+
| hostname   | port | time_start_us    | success_time_us | primary_partition | read_only | wsrep_local_recv_queue | wsrep_local_state | wsrep_desync | wsrep_reject_queries | wsrep_sst_donor_rejects_queries | error |
+------------+------+------------------+-----------------+-------------------+-----------+------------------------+-------------------+--------------+----------------------+---------------------------------+-------+
| 10.11.0.81 | 3306 | 1566531499729388 | 4096            | YES               | NO        | 0                      | 4                 | NO           | NO                   | NO                              | NULL  |
| 10.11.0.82 | 3306 | 1566531499726247 | 3461            | YES               | NO        | 0                      | 4                 | NO           | NO                   | NO                              | NULL  |
| 10.11.0.83 | 3306 | 1566531499725691 | 3359            | YES               | NO        | 0                      | 4                 | NO           | NO                   | NO                              | NULL  |
+------------+------+------------------+-----------------+-------------------+-----------+------------------------+-------------------+--------------+----------------------+---------------------------------+-------+
3 rows in set (0.03 sec)
```

### 更改 Global Variables

接下来，更改 `global_variables` 的配置，各字段的详细说明请参考 [ProxySQL Global Variables][3]，本例只更改以下几个：

`mysql-server_version`, 更改为具体版本

```terminal
Admin> update global_variables set variable_value='5.7.0' where variable_name='mysql-server_version';
```

`mysql-monitor_username` 和 `mysql-monitor_password`，是监控后台数据库的状态，需要现在后台数据库（PXC 集群）建立用户和赋予权限

PXC 集群中，只登录其中一台更改即可，本例以 `pxc1`为例

先登入到 MySQL
```terminal
[admin@pxc1 ~]$ mysql -u root -p
```

新建用户命令如下，请将 `monitor` 替换为您的用户名和密码

```terminal
mysql@pxc1> create user 'monitor'@'%' identified by 'monitor';
mysql@pxc1> grant all on *.* to 'monitor'@'%';
mysql@pxc1> flush privileges;
```

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
+------------+------+------------------+-------------------------+---------------+
| hostname   | port | time_start_us    | connect_success_time_us | connect_error |
+------------+------+------------------+-------------------------+---------------+
| 10.11.0.82 | 3306 | 1566435074474207 | 2704                    | NULL          |
| 10.11.0.83 | 3306 | 1566435073701956 | 3028                    | NULL          |
| 10.11.0.83 | 3306 | 1566435072929714 | 3659                    | NULL          |
| 10.11.0.81 | 3306 | 1566435012929704 | 3873                    | NULL          |
+------------+------+------------------+-------------------------+---------------+
```
可以看到 `connect_error` 为 NULL 表示，没有问题。

再查看一下 ping 日志表 `monitor.mysql_server_ping_log`

```terminal
Admin> SELECT * FROM monitor.mysql_server_ping_log ORDER BY time_start_us DESC LIMIT 6;
+------------+------+------------------+----------------------+------------+
| hostname   | port | time_start_us    | ping_success_time_us | ping_error |
+------------+------+------------------+----------------------+------------+
| 10.11.0.82 | 3306 | 1566435253362415 | 910                  | NULL       |
| 10.11.0.83 | 3306 | 1566435253287284 | 1381                 | NULL       |
| 10.11.0.81 | 3306 | 1566435253212261 | 1261                 | NULL       |
| 10.11.0.83 | 3306 | 1566435243404424 | 1194                 | NULL       |
| 10.11.0.81 | 3306 | 1566435243308164 | 951                  | NULL       |
| 10.11.0.82 | 3306 | 1566435243212004 | 1197                 | NULL       |
+------------+------+------------------+----------------------+------------+
6 rows in set (0.00 sec)
```

可以看到 `ping_error` 为 NULL, 表示没有问题

### 添加客户端用户

目前 ProxySQL 已经可以连接到后端集群，并且监控集群情况。接下来，我们要添加一个数据库用户，给客户端使用，主要用到 `mysql_users` 表。

先在 pxc 集群的任意节点上创建一个用户，本例以 `pxc1` 为例。

先登入到 MySQL
```terminal
[admin@pxc1 ~]$ mysql -u root -p
```

新建用户命令如下，请将 `dev` 替换为您的用户名和密码，授权请根据自己的实际情况，不在本例讨论范围。

```terminal
mysql@pxc1> create user 'dev'@'%' identified by 'dev';
mysql@pxc1> grant all on *.* to 'dev'@'%';
mysql@pxc1> flush privileges;
```

然后回到 ProxySQL，设置 `mysql_uers` 表。

```terminal
Admin> insert into mysql_users(username, password, default_hostgroup, transaction_persistent) values('dev', 'dev', 2, 1);
```

查询一下

```terminal
Admin> select * from mysql_users;
+----------+----------+--------+---------+-------------------+----------------+---------------+------------------------+--------------+---------+----------+-----------------+---------+
| username | password | active | use_ssl | default_hostgroup | default_schema | schema_locked | transaction_persistent | fast_forward | backend | frontend | max_connections | comment |
+----------+----------+--------+---------+-------------------+----------------+---------------+------------------------+--------------+---------+----------+-----------------+---------+
| dev      | dev      | 1      | 0       | 2                 | NULL           | 0             | 1                      | 0            | 1       | 1        | 10000           |         |
+----------+----------+--------+---------+-------------------+----------------+---------------+------------------------+--------------+---------+----------+-----------------+---------+
1 row in set (0.00 sec)
```

最后，使用 load 命令加载配置到运行时，使用 save 命令保存到磁盘。

```terminal
Admin> load mysql users to runtime;
Admin> save mysql users to disk;
```

使用用户访问 PXC 集群, ProxySQL 默认使用 `6033` 端口进行代理

```terminal
$ mysql -u dev -p -h 127.0.0.1 -P 6033
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

## 结束语

本例演示 ProxySQL 的配置过程，本例只是单点，如果增加高可用性，可以参考 [CentOS 7 配置 Keepalived 实现双机热备][4]

## 参考资料
[The proxysql-admin Tool with ProxySQL v2][1]  
[CentOS 7 安装 Percona XtraDB Cluster 5.7][2]  
[ProxySQL - Global Variables][3]  
[Native Galera Support In ProxySQL][5]  
[PROXYSQL 2.0安装和PERCONA CLUSTER5.7集成][6]
  
[1]: https://www.percona.com/doc/percona-xtradb-cluster/5.7/howtos/proxysql-v2.html  
[2]: {{ site.baseurl }}{% post_url 2019-05-16-how-to-install-percona-xtradb-cluster-on-centos-7 %}  
[3]: https://github.com/sysown/proxysql/blob/master/doc/global_variables.md  
[4]: {{ site.baseurl }}{% post_url 2018-05-17-how-to-config-keepalived-on-centos-7 %}  
[5]: https://proxysql.com/blog/proxysql-native-galera-support  
[6]: http://www.dboracle.com/archivers/proxysql-2-0%e5%ae%89%e8%a3%85%e5%92%8cpercona-cluster5-7%e9%9b%86%e6%88%90.html  
