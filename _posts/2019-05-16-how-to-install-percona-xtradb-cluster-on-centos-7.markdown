---
layout: post
title: CentOS 7 安装 Percona XtraDB Cluster 5.7
categories: [Linux]
tags: [centos, mysql, percona, xtradb, cluster, pxc]
summary: CentOS 7 安装  Percona XtraDB Cluster(PXC) 5.7，记录一下安装过程。
---
## 前言
CentOS 7 安装  Percona XtraDB Cluster(PXC) 5.7，记录一下安装过程。

主要安装过程 Percona 的官方文档 [Percona XtraDB Cluster 5.7 Documentation][1] 已经有描述，本次记录一下步骤。

本文使用 MySQL 5.7 版本进行集群为例，暂时不使用 MySQL 8。

### 环境说明

CentOS 7（Minimal Install）

```terminal
$ cat /etc/centos-release
CentOS Linux release 7.6.1810 (Core)
```

配置如下 

| Node  | Host      | IP Addr       | Descprition |
|-------|-----------|---------------|-------------|
| Node1 | pxc1      | 10.11.0.81/24 | 集群节点1   |
| Node2 | pxc2      | 10.11.0.82/24 | 集群节点2   |
| Node3 | pxc3      | 10.11.0.83/24 | 集群节点3   |

说明

1. Percona XtrDB Cluster 属于 Multi-master Replication（多主复制）。
2. 多主复制意味着支持对任意节点的读写，数据会同步复制到其他节点。
3. 建议不要同时对两个节点上相同的表写入（即写入最好分表或分库）。
4. 对写入的分表或分库，顾名思义，程序连接一个数据库实例进行写入，而不是连接多个数据库实例。

## 安装

### 先决条件

先确认每个集群节点的机器名，本文以 `pxc1` 为例，其他 `pxc2`, `pxc3` 相同

```terminal
$ hostname
pxc1
```

打开防火墙端口

```terminal
$ sudo firewall-cmd --permanent --add-port={3306/tcp,4444/tcp,4567/tcp,4568/tcp}
success
$ sudo firewall-cmd --reload
success
```

重载之后，查看一下防火墙状态

```terminal
$ sudo firewall-cmd --list-all
public (active)
  target: default
  icmp-block-inversion: no
  interfaces: enp0s3
  sources: 
  services: dhcpv6-client ssh
  ports: 3306/tcp 4444/tcp 4567/tcp 4568/tcp
  protocols: 
  masquerade: no
  forward-ports: 
  source-ports: 
  icmp-blocks: 
  rich rules: 
```

将每个集群节点的 SELinux 设置为 `permissive` 模式

```terminal
$ sudo vi /etc/selinux/config
SELINUX=permissive
```

`:wq` 退出后，重启系统。

```terminal
$ sudo shutdown -r now
```

重启完操作系统后，确认 SELinux 设置

```terminal
$ sestatus
SELinux status:                 enabled
SELinuxfs mount:                /sys/fs/selinux
SELinux root directory:         /etc/selinux
Loaded policy name:             targeted
Current mode:                   permissive
Mode from config file:          permissive
Policy MLS status:              enabled
Policy deny_unknown status:     allowed
Max kernel policy version:      31
```

### 从 Percona 仓库安装

配置 yum  源如下，本文以 `pxc1` 为例，其他 `pxc2`, `pxc3` 相同

```terminal
$ sudo yum install https://repo.percona.com/yum/percona-release-latest.noarch.rpm
```

`注意` 本文使用时，yum 安装的版本为 `percona-release-1.0-11.noarch`，默认启用了 `Percona Original repository`，为 MySQL 5.7 的版本。

安装 Percona XtraDB Cluster 的包

```terminal
$ sudo yum install Percona-XtraDB-Cluster-57
...
...
 -------------
   *  The suggested mysql options and settings are in /etc/percona-xtradb-cluster.conf.d/mysqld.cnf
   *  If you want to use mysqld.cnf as default configuration file please make backup of /etc/my.cnf
   *  Once it is done please execute the following commands:
 rm -rf /etc/my.cnf
 update-alternatives --install /etc/my.cnf my.cnf "/etc/percona-xtradb-cluster.cnf" 200
 -------------
Percona XtraDB Cluster is distributed with several useful UDFs from Percona Toolkit.
Run the following commands to create these functions:
mysql -e "CREATE FUNCTION fnv1a_64 RETURNS INTEGER SONAME 'libfnv1a_udf.so'"
mysql -e "CREATE FUNCTION fnv_64 RETURNS INTEGER SONAME 'libfnv_udf.so'"
mysql -e "CREATE FUNCTION murmur_hash RETURNS INTEGER SONAME 'libmurmur_udf.so'"
See  http://www.percona.com/doc/percona-server/5.7/management/udf_percona_toolkit.html for more details
...
...
Replaced:
  mariadb-libs.x86_64 1:5.5.60-1.el7_5                                                                                                                                                                   

Complete!
```

安装过程中会出现如下提示，可以根据需要进行配置。

### 修改密码

3 个节点都安装完软件包之后，接下来只对第一个节点 `pxc1` 进行修改密码操作。

先启动 Percona XtraDB Cluster 服务。

```terminal
[admin@pxc1 ~] $ sudo systemctl start mysqld
```

拷贝 MySQL 安装时自动生成的 root 的临时密码

```terminal
[admin@pxc1 ~] $ sudo grep 'temporary password' /var/log/mysqld.log
```

使用临时密码登录 MySQL

```terminal
[admin@pxc1 ~] $ mysql -u root -p
```

更改 root 用户的密码，之后退出。

```terminal
mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY 'Passw0rd';
Query OK, 0 rows affected (0.00 sec)

mysql> exit
Bye
```

关闭 MySQL 服务。

```terminal
[admin@pxc1 ~] $ sudo systemctl stop mysqld
```

`注意`   
1. 以上修改密码操作只在第一个节点进行即可。
2. 配置好第二个和第三个节点，启动服务操作后会复制到其他节点中。

## 配置节点的 Write-set Replication

### 配置 my.cnf

配置第一个节点 `pxc1` 的 `/etc/my.cnf`

```terminal
[admin@pxc1 ~] sudo vi /etc/my.cnf
```

添加如下内容

```terminal
# Add below configuration to override the default wsrep.conf

[mysqld]
wsrep_provider=/usr/lib64/galera3/libgalera_smm.so

wsrep_cluster_name=pxc-cluster
wsrep_cluster_address=gcomm://10.11.0.81,10.11.0.82,10.11.0.83

wsrep_node_name=pxc1
wsrep_node_address=10.11.0.81

wsrep_sst_method=xtrabackup-v2
wsrep_sst_auth=sstuser:Passw0rd

pxc_strict_mode=ENFORCING

binlog_format=ROW
default_storage_engine=InnoDB
innodb_autoinc_lock_mode=2
```

这些内容也同样对 `pxc2`,  `pxc3` 进行配置，只有两个参数 `wsrep_node_name`, `wsrep_node_address` 配置的值需要修改一下

对于 `pxc2` 内容为

```terminal
wsrep_node_name=pxc2
wsrep_node_address=10.11.0.82
```

对于 `pxc3` 内容为

```terminal
wsrep_node_name=pxc3
wsrep_node_address=10.11.0.83
```

### 配置参数说明

`wsrep_provider`   
指定 Galera 库的路径。

`wsrep_cluster_name`   
指定集群的逻辑名称，集群内的所有节点，这个名称必须一致。

`wsrep_cluster_address`  
指定集群内节点的 IP 地址，建议将集群节点都配上。

`wsrep_node_name`  
指定单个节点的逻辑名称，如果没有指定，将使用 hostname 作为逻辑名称。

`wsrep_node_address`  
指定此特定节点的 IP 地址。

`wsrep_sst_method`  
默认的使用 Percona Xtrabackup 进行 State Snapshot Transfer (SST)，强烈建议使用 `wsrep_sst_method=xtrabackup-v2`

`wsrep_sst_auth`  
指定 sst 的身份验证凭据，使用`<sst_user>:<sst_pass>` 这种格式，启动第一个节点时必须创建，并且提供相应的权限。

`pxc_strict_mode`  
关闭实验性的或者不支持的特性

`binlog_format`  
Galera 只支持 row-level replication，所以设置为 `binlog_format=ROW`。

`default_storage_engine`  
Galera 只支持 InnoDB 引擎，所以设置为 `default_storage_engine=InnoDB`。

`innodb_autoinc_lock_mode`  
Galera 只支持 lock mode 为 `2` 的 InnoDB 引擎，所以设置为 `innodb_autoinc_lock_mode=2`。

## 启动第一个节点

在第一个节点 `pxc1` 使用如下命令启动

```terminal
[admin@pxc1 ~]$ sudo systemctl start mysql@bootstrap
```

使用 bootstrap 模式启动，默认会设置 `wsrep_cluster_address=gcomm://`，后面没有 IP，表示初始化集群。

为确保初始化完成，可以使用如下命令查看

登录 MySQL 

```terminal
[admin@pxc1 ~]$ mysql -u root -p
Enter password: 
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 11
Server version: 5.7.25-28-57-log Percona XtraDB Cluster (GPL), Release rel28, Revision a2ef85f, WSREP version 31.35, wsrep_31.35

Copyright (c) 2009-2019 Percona LLC and/or its affiliates
Copyright (c) 2000, 2019, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
myslq> 
```

之后输入

```terminal
mysql> show status like 'wsrep%';
+----------------------------------+-----------------------------------------------+
| Variable_name                    | Value                                         |
+----------------------------------+-----------------------------------------------+
| wsrep_local_state_uuid           | 77007d05-777b-11e9-9836-3a33a4649f12          |
| ...                              | ...                                           |
| ...                              | ...                                           |
| wsrep_local_state                | 4                                             |
| wsrep_local_state_comment        | Synced                                        |
| ...                              | ...                                           |
| ...                              | ...                                           |
| wsrep_cluster_size               | 1                                             |
| ...                              | ...                                           |
| wsrep_cluster_status             | Primary                                       |
| wsrep_connected                  | ON                                            |
| ...                              | ...                                           |
| ...                              | ...                                           |
| wsrep_ready                      | ON                                            |
+----------------------------------+-----------------------------------------------+
71 rows in set (0.01 sec)
```

可以看到集群数量时 `1`，本节点为  `Synced` 状态，表示连接成功，并且准备好进行 `write-set replication`。

在添加其他节点之前，我们要添加 `SST` 用户并分配相应的权限。

```terminal
mysql> CREATE USER 'sstuser'@'localhost' IDENTIFIED BY 'Passw0rd';
Query OK, 0 rows affected (0.12 sec)

mysql> GRANT RELOAD, LOCK TABLES, PROCESS, REPLICATION CLIENT ON *.* TO 'sstuser'@'localhost';
Query OK, 0 rows affected (0.09 sec)

mysql> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.10 sec)
```

`注意` 用户名和密码必须跟配置文件匹配。

## 添加其他节点

`注意`
1. 所有其他节点的数据和配置都会被第一个节点的数据覆盖
2. 不用同时加入多个节点，避免数据或网络开销过大

### 启动第二个节点

```terminal
[admin@pxc2 ~]$ sudo systemctl start mysqld
```

启动完成后，`pxc2` 会接到  `pxc1` 的数据，可以使用如下命令查看状态

```terminal
[admin@pxc2 ~]$ mysql -u root -p
```

登录到 MySQL 后，输入如下命令

```terminal
mysql> show status like 'wsrep%';
+----------------------------------+--------------------------------------+
| Variable_name                    | Value                                |
+----------------------------------+--------------------------------------+
| wsrep_local_state_uuid           | 33e1e8eb-777b-11e9-b16f-9f9d75d90117 |
| ...                              | ...                                  |
| ...                              | ...                                  |
| wsrep_local_state                | 4                                    |
| wsrep_local_state_comment        | Synced                               |
| ...                              | ...                                  |
| ...                              | ...                                  |
| wsrep_cluster_size               | 2                                    |
| ...                              | ...                                  |
| wsrep_cluster_status             | Primary                              |
| wsrep_connected                  | ON                                   |
| ...                              | ...                                  |
| ...                              | ...                                  |
| wsrep_ready                      | ON                                   |
+----------------------------------+--------------------------------------+
71 rows in set (0.00 sec)
```

可以看到 `wsrep_cluster_size` 的值是 `2` 表示集群已经有 2 个节点了。`wsrep_local_state_comment` 的值是 `Synced` 表示已经同步了。

`注意` 如果 `wsrep_local_state_comment` 的状态是 `Joiner`，表示正在同步，请不要启动第三个节点的服务。

### 启动第三个节点

`注意`确认好第二个节点的状态为 `Synced` 后，再启动第三个节点。

步骤与启动第二个节点相同

```terminal
[admin@pxc3 ~]$ sudo systemctl start mysqld
```

启动完成后，`pxc3` 会接到集群，可以使用如下命令查看状态

```terminal
[admin@pxc3 ~]$ mysql -u root -p
```

登录到 MySQL 后，输入如下命令

```terminal
mysql> show status like 'wsrep%';
+----------------------------------+--------------------------------------+
| Variable_name                    | Value                                |
+----------------------------------+--------------------------------------+
| wsrep_local_state_uuid           | 33e1e8eb-777b-11e9-b16f-9f9d75d90117 |
| ...                              | ...                                  |
| ...                              | ...                                  |
| wsrep_local_state                | 4                                    |
| wsrep_local_state_comment        | Synced                               |
| ...                              | ...                                  |
| ...                              | ...                                  |
| wsrep_cluster_size               | 3                                    |
| ...                              | ...                                  |
| wsrep_cluster_status             | Primary                              |
| wsrep_connected                  | ON                                   |
| ...                              | ...                                  |
| ...                              | ...                                  |
| wsrep_ready                      | ON                                   |
+----------------------------------+--------------------------------------+
71 rows in set (0.00 sec)
```

可以看到集群数量是 `3`，连接没有问题，准备 write-set replication

## 验证复制效果

当所有的节点都加入到集群之后，可以验证一下复制效果。

1. 到第二个节点 `pxc2` 上创建一个新的数据库

```terminal
mysql@pxc2> CREATE DATABASE percona;
Query OK, 1 row affected (0.18 sec)
```

2. 到第三个节点 `pxc3` 上，再这个数据库上新建一个表

```terminal
mysql@pxc3> USE percona;
Database changed

mysql@pxc3> CREATE TABLE example (node_id INT PRIMARY KEY, node_name VARCHAR(30));
Query OK, 0 rows affected (0.05 sec)
```

3. 到第一个节点 `pxc1` 上，插入数据

```terminal
mysql@pxc1> INSERT INTO percona.example VALUES (1, 'percona1');
Query OK, 1 row affected (0.02 sec)
```

4. 再到第二个节点 `pxc2` 上查询一下插入的数据

```terminal
mysql@pxc2> SELECT * FROM percona.example;
+---------+-----------+
| node_id | node_name |
+---------+-----------+
|       1 | percona1  |
+---------+-----------+
1 row in set (0.01 sec)

```

可以看到，多主复制很好，3 个节点都是主节点，相互复制的效果也很好。

## 结束语

Percona XtraDB Cluster 搭建很简单，多主复制很适合高并发环境。

当然，它也是有局限的，具体可以参考：[Percona XtraDB Cluster Limitations][2] , 但是这些局限不是太大的问题，因为一般情况不会用到。

## 参考资料
[Percona XtraDB Cluster 5.7 Documentation][1]  
[Percona XtraDB Cluster Limitations][2]
  
[1]: https://www.percona.com/doc/percona-xtradb-cluster/5.7/index.html  
[2]: https://www.percona.com/doc/percona-xtradb-cluster/5.7/limitation.html
