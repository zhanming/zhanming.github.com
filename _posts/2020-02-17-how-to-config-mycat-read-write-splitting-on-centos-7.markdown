---
layout: post
title: CentOS 7 上配置 Mycat 对 MySQL 的读写分离
categories: [Linux]
tags: [centos, mycat, mysql]
summary: Mycat 是一个数据库的分区分表中间件，支持多种数据库，也支持读写分离，本文主要描述一下对 MySQL 进行读写分离的基本配置。
---
## 前言
Mycat 是一个数据库的分区分表中间件，支持多种数据库，也支持读写分离，本文主要描述一下对 MySQL 进行读写分离的基本配置。

### 环境说明
CentOS 7（Minimal Install）

```terminal
$ cat /etc/system-release
CentOS Linux release 7.7.1908 (Core)
```

本例使用用户 `admin` 进行安装，请参考 [CentOS 7 安装后的系统初始化][1]

本例使用的 MySQL 集群为 PXC，请参考 [CentOS 7 安装 Percona XtraDB Cluster 5.7][2]

PXC 的配置如下

| Node  | Host | IP Addr       | Descprition |
| ----- | ---- | ------------- | ----------- |
| Node1 | pxc1 | 10.11.0.81/24 | 集群节点1   |
| Node2 | pxc2 | 10.11.0.82/24 | 集群节点2   |
| Node3 | pxc3 | 10.11.0.83/24 | 集群节点3   |

PXC 中新建数据库和表如下

| Schema   | Table    | Description   |
| -------- | -------- | ------------- |
| percona  | example  | 示例表         |

## 安装

Mycat 依赖 Java，所以需要安装 Java。

### 安装 Java

1. 安装软件包

```terminal
$ sudo yum install java-1.8.0-openjdk
```

2. 配置 `JAVA_HOME` 环境变量

```terminal
$ sudo vi /etc/profile
```

在 profile 配置的最后，追加 java 的目录

```terminal
export JAVA_HOME=/usr
```

`:wq` 保存并退出。

3. 刷新配置，使环境变量生效

```terminal
$ source /etc/profile
```

4. 最后查看一下 `JAVA_HOME` 的环境配置

```terminal
$ echo $JAVA_HOME
/usr
```

也可以再查看一下 Java 的版本

```terminal
$ java -version
openjdk version "1.8.0_242"
OpenJDK Runtime Environment (build 1.8.0_242-b08)
OpenJDK 64-Bit Server VM (build 25.242-b08, mixed mode)
```

### 安装 Mycat

下载 Mycat 安装包到本地

```terminal
$ cd ~
$ curl -O http://dl.mycat.io/1.6.7.4/Mycat-server-1.6.7.4-release/Mycat-server-1.6.7.4-release-20200105164103-linux.tar.gz
```

解压 Mycat

```terminal
$ tar -zxvf Mycat-server-1.6.7.4-release-20200105164103-linux.tar.gz
```

解压的文件夹是 `mycat` , 接下来，将 `mycat` 文件夹剪切到 `/usr/local` 目录中

```terminal
$ sudo mv mycat/ /usr/local/
```

配置 Mycat 的环境变量

```terminal
$ sudo vi /etc/profile
```

在 profile 的最后，追加 `MYCAT_HOME` 环境变量

```terminal
export JAVA_HOME=/usr # 刚才添加的JAVA_HOME

export MYCAT_HOME=/usr/local/mycat
```

刷新配置，使环境变量生效

```terminal
$ source /etc/profile
```

查看一下 `MYCAT_HOME` 环境变量

```terminal
$ echo $MYCAT_HOME
/usr/local/mycat
```

至此， Mycat 安装完毕，接下来我们需要进行配置。

## 读写分离配置

Mycat 的配置文件在 `$MYCAT_HOME/conf` 文件夹内，对于读写分离，主要配置以下文件

- schema.xml 配置逻辑库表和数据节点
- server.xml 配置服务器权限

### 配置 schema.xml

schema.xml 主要是配置 mycat 与后端数据库的对应关系

```terminal
$ cd $MYCAT_HOME/conf
$ cp schema.xml schema.xml.orgi
$ vi schema.xml
```

配置文件例子如下

```xml
<?xml version="1.0"?>
<!DOCTYPE mycat:schema SYSTEM "schema.dtd">
<mycat:schema xmlns:mycat="http://io.mycat/">
  <schema name="percona" checkSQLschema="true" sqlMaxLimit="100" dataNode="node1" />
  <dataNode name="node1" dataHost="host1" database="percona" />
  <dataHost name="host1" maxCon="1000" minCon="10" balance="1" writeType="0" dbType="mysql" dbDriver="native" switchType="1" slaveThreshold="100">
    <heartbeat>select user()</heartbeat>
    <writeHost host="10.11.0.81" url="10.11.0.81:3306" user="root" password="secret">
      <readHost host="10.11.0.82" url="10.11.0.82:3306" user="root" password="secret" />
      <readHost host="10.11.0.83" url="10.11.0.83:3306" user="root" password="secret" />
    </writeHost>
    <writeHost host="10.11.0.82" url="10.11.0.82:3306" user="root" password="secret" />
  </dataHost>
</mycat:schema>
```

这里的 writeHost 和 readHost 是代表后端真实的 MySQL 数据库的连接参数

> 说明
>
> 1. 本例配置了两个 `writeHost` ；
> 2. 如果第一个 writeHost 连接不上（或者宕机），会继续用第二个 writeHost 作为写节点；
> 3. 事务内部的一切操作都会走写节点；

### 配置 server.xml

```terminal
$ cd $MYCAT_HOME/conf
$ cp server.xml server.xml.orgi
$ vi server.xml
```

主要配置如下

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mycat:server SYSTEM "server.dtd">
<mycat:server xmlns:mycat="http://io.mycat/">
  <system>
    <!-- ... -->
    <!-- 配置参数请参考默认的样例 -->
    <!-- ... -->
    <property name="serverPort">3306</property>
    <property name="managerPort">9066</property>
    <!-- ... -->
    <!-- 配置参数请参考默认的样例 -->
    <!-- ... -->
  </system>
  <user name="root" defaultAccount="true">
    <property name="password">secret</property>
    <property name="schemas">percona</property>
    <property name="defaultSchema">percona</property>
  </user>
</mycat:server>
```

本例修改了默认的 `serverPort` 由原来的 8066 改为默认的 3306，您可以根据自己的需要更改。

## 测试

### 启动 mycat

```terminal
$ cd $MYCAT_HOME
$ bin/mycat start
Starting Mycat-server...
```

可以看到 Mycat-server 启动了

查看启动日志

```terminal
$ cd $MYCAT_HOME
$ tail logs/wrapper.log
...
...
INFO   | jvm 1    | 2020/02/17 10:57:33 | MyCAT Server startup successfully. see logs in logs/mycat.log
```

最后日志写的 `MyCAT Server startup successfully` 表示启动成功

### 关闭 mycat

```terminal
$ cd $MYCAT_HOME
$ bin/mycat stop
Stopping Mycat-server...
Stopped Mycat-server.
```

可以看到 Mycat-server 停止了

查看一下日志

```terminal
$ cd $MYCAT_HOME 
$ tail logs/wrapper.log
...
...
STATUS | wrapper  | 2020/02/17 11:00:27 | TERM trapped.  Shutting down.
STATUS | wrapper  | 2020/02/17 11:00:28 | <-- Wrapper Stopped
```

### 连接 mycat

本例使用 MySQL 5.7 客户端连接 

首先安装 MySQL 的 yum 源

```terminal
$ sudo yum install https://repo.percona.com/yum/percona-release-latest.noarch.rpm
```

之后安装 MySQL client

```terminal
$ sudo yum install Percona-XtraDB-Cluster-client-57
```

安装完 mysql 客户端，可以本机登录 mycat

>`注意`
> 连接 mycat 的 mysql 的命令行参数不能缺少 -h 参数，即使是连接本机

```terminal
$ mysql -h 127.0.0.1 -u root -p
Enter password:
Welcome to the MySQL monitor.  Commands end with ; or \g.
...
...
Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql> show databases;
+----------+
| DATABASE |
+----------+
| percona  |
+----------+
1 row in set (0.00 sec)

mysql> exit
Bye
```

### 连接 mycat 管理口

管理口默认为 9066，为 server.xml 中 `managerPort` 属性的值

```terminal
$ mysql -h 127.0.0.1 -P 9066 -u root -p
```

连接成功之后，可以通过 `show @@help;` 命令，查看支持的管理命令

```terminal
mysql> show @@help;
+------------------------------------------+----------------------------------+
| STATEMENT                                | DESCRIPTION                      |
+------------------------------------------+----------------------------------+
| show @@time.current                      | Report current timestamp         |
| ...                                      | ...                              |
| ...                                      | ...                              |
| ...                                      | ...                              |
| clear @@slow where datanode = ?          | Clear slow sql by datanode       |
+------------------------------------------+----------------------------------+
59 rows in set (0.01 sec)
```

### 读写分离

主要是用查日志的方式查看效果，需要先将 log4j2.xml 的日志级别修改为 debug 级别。

```terminal
$ cd $MYCAT_HOME
$ bin/mycat stop
$ vi conf/log4j2.xml
```

找到如下的节点并修改

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration status="WARN">
  <!-- ... -->
  <!-- ... -->
  <AsyncLogger name="io.mycat" level="debug" includeLocation="true" additivity="false">
    <!--<AppenderRef ref="Console"/>-->
    <AppenderRef ref="RollingFile"/>
  </AsyncLogger>
  <asyncRoot level="info" includeLocation="true">
    <!--<AppenderRef ref="Console" />-->
    <AppenderRef ref="RollingFile"/>
  </asyncRoot>
</Configuration>
```

添加 `<AsyncLogger name="io.mycat" level="debug"...>` 这个节点，表示对 `io.mycat` 包的日志级别为 debug.

`:wq` 保存修改之后，重新启动一下 Mycat

```terminal
$ cd $MYCAT_HOME
$ bin/mycat start
Starting Mycat-server...
```

连接到 mycat，并使用测试数据库执行一个查询语句。

```terminal
$ mysql -h 127.0.0.1 -u root -p
mysql> use percona;
mysql> select * from example;
```

之后查询日志

```terminal
$ grep 'select * from example' $MYCAT_HOME/logs/mycat.log
...
...
2020-02-17 15:56:41.058 DEBUG ... 
attachment=node1{select * from example}, respHandler=SingleNodeHandler 
[node=node1{select * from example}, packetId=4], host=10.11.0.82, port=3306, 
statusSync=...]
```

可以看到，`host=10.11.0.82` 说明 SQL 语句是读节点进行查询

再添加一条插入语句，测试写入节点

```terminal
mysql> insert into example(node_id, node_name) values (2, 'percona2');
```

之后查询日志

```terminal
$ grep 'insert into example' $MYCAT/logs/mycat.log
...
...
2020-02-17 15:58:41.486 DEBUG ...
[node=node1{insert into example(node_id, node_name) values (2, 'percona2')}, 
packetId=1], host=10.11.0.81, port=3306, statusSync=...]
```

可以看到，`host=10.11.0.81` 说明 SQL 语句是在写节点执行的，读写分离没有问题。

## 总结

Mycat 还有很多特性，本例只示例了 MySQL 的读写分离。

## 参考资料

[CentOS 7 安装后的初始化配置][1]  
[CentOS 7 安装 Percona XtraDB Cluster 5.7][2]  

[1]: {% post_url 2017-11-01-how-to-initial-server-on-centos-7 %}

[2]: {% post_url 2019-05-16-how-to-install-percona-xtradb-cluster-on-centos-7 %}