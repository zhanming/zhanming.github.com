---
layout: post
title: macOS 上使用 brew 安装 Kafka 
categories: [macOS]
tags: [macos, kafka, zookeeper]
summary: macOS 上使用 brew 安装 kafka 比较方便，记录一下安装和配置的步骤。
---
## 前言
macOS 上使用 brew 安装 kafka 比较方便，记录一下安装和配置的步骤。

### 环境说明
macOS 11.1

```terminal
% sw_vers
ProductName:	macOS
ProductVersion:	11.1
BuildVersion:	20C69
```

Brew 

```terminal
% brew --version
Homebrew 2.7.1
Homebrew/homebrew-core (git revision 39af1; last commit 2021-01-04)
Homebrew/homebrew-cask (git revision c4e4b0; last commit 2021-01-04)
```

## 安装

使用 brew 安装比较方便，本例安装 `kafka-2.7.0`

```terminal
% brew install kafka
Updating Homebrew...
...
...
==> Installing dependencies for kafka: zookeeper
==> Installing kafka dependency: zookeeper
==> Pouring zookeeper-3.6.2_1.big_sur.bottle.tar.gz
==> Caveats
To have launchd start zookeeper now and restart at login:
  brew services start zookeeper
Or, if you don't want/need a background service you can just run:
  zkServer start
==> Summary
🍺  /usr/local/Cellar/zookeeper/3.6.2_1: 990 files, 33.2MB
==> Installing kafka
==> Pouring kafka-2.7.0.big_sur.bottle.tar.gz
==> Caveats
To have launchd start kafka now and restart at login:
  brew services start kafka
Or, if you don't want/need a background service you can just run:
  zookeeper-server-start /usr/local/etc/kafka/zookeeper.properties & kafka-server-start /usr/local/etc/kafka/server.properties
==> Summary
🍺  /usr/local/Cellar/kafka/2.7.0: 187 files, 65.4MB
==> Caveats
==> zookeeper
To have launchd start zookeeper now and restart at login:
  brew services start zookeeper
Or, if you don't want/need a background service you can just run:
  zkServer start
==> kafka
To have launchd start kafka now and restart at login:
  brew services start kafka
Or, if you don't want/need a background service you can just run:
  zookeeper-server-start /usr/local/etc/kafka/zookeeper.properties & kafka-server-start /usr/local/etc/kafka/server.properties
```

查看一下依赖关系

```terminal
% brew deps kafka --tree
kafka
├── openjdk
└── zookeeper
    ├── openjdk
    └── openssl@1.1
```

可以看到，kafka-2.7.0 依赖 zookeeper 和 openjdk,  本例安装时，zookeeper 的版本为 zookeeper-3.6.2

安装后，会默认安装2个服务

先查看一下服务列表

```terminal
% brew services list
Name      Status  User  Plist
kafka     stopped
zookeeper stopped
```

## 服务启动

### 使用内置 zookeeper

内置的 zookeeper 使用的是 kafka 自己默认的 `zookeeper.properties` 配置

执行前台启动命令

```terminal
% zookeeper-server-start /usr/local/etc/kafka/zookeeper.properties & kafka-server-start /usr/local/etc/kafka/server.properties
```

停止服务

先使用组合键： `Ctrl+C`

再关闭 `zookeeper` 服务

```terminal
% zookeeper-server-stop /usr/local/etc/kafka/zookeeper.properties
```

### 使用外置 zookeeper

如果刚才使用了内置的 zookeeper 启动，需要先删除一个 kafka 的配置才能使用前台启动方式

> `注意`
>
> 这两种启动方式(内置 zookeeper 和外置 zookeeper)不能随时切换

因为从 kafka v2.4.0 开始，kafka 增加了 zookeeper 的 `cluster.id` 标识，而这两种启动方式，生成的 `cluster.id` 会不一样，导致 kafka 不能正常启动。

如果要切换，需要先删除 kafka 的 `meta.properties` 配置，否则会报错。

报错具体内容如下

```java
kafka.common.InconsistentClusterIdException: The Cluster ID mPSiKRVenF2deWvyrzg**** doesn't match stored clusterId Some(banHtGEgRXOAvtix****) in meta.properties. The broker is trying to join the wrong cluster. Configured zookeeper.connect may be wrong.
	at kafka.server.KafkaServer.startup(KafkaServer.scala:252)
	at kafka.server.KafkaServerStartable.startup(KafkaServerStartable.scala:44)
	at kafka.Kafka$.main(Kafka.scala:82)
	at kafka.Kafka.main(Kafka.scala)
```

删除 kafka 的 meta.properties

```terminal
% rm /usr/local/var/lib/kafka-logs/meta.properties
```

然后使用 brew 命令启动 zookeeper 和 kafka 服务

```terminal
% brew services start zookeeper
% brew services start kafka
```

这样，zookeeper 和 kafka 服务就都启动好了

可以查看一下

```terminal
% brew services list
Name      Status  User  Plist
kafka     started admin /Users/yourUsername/Library/LaunchAgents/homebrew.mxcl.kafka.plist
zookeeper started admin /Users/yourUsername/Library/LaunchAgents/homebrew.mxcl.zookeeper.plist
```

修改 zookeeper 的管理端口

以服务方式启动的 zookeeper，默认管理端口是 8080，这个特性时 zookeever-3.5.0 开始的，详见[The AdminServer][2]。

开发时的默认端口也一般也是 8080，会造成冲突，最好修改一下。

> `注意`
>
> 如果使用内置的 zookeeper 启动，admin server 默认是关闭的。
>
> 可以查看一下配置内容 `/usr/local/etc/kafka/zookeeper.properties`

编辑一下 zookeeper 的配置文件

```terminal
% vi /usr/local/etc/zookeeper/zoo.cfg
```

可以更改端口号，添加如下配置：

```terminal
admin.serverPort=3181
```

或者直接关闭 admin server，配置如下：

```terminal
admin.enableServer=false
```

更改配置后，重启 zookeeper 服务

```terminal
% brew services restart zookeeper
```

## 测试

### 创建一个主题

创建一个名字为 mytopic 的主题

```terminal
% kafka-topics --bootstrap-server localhost:9092 --create --topic mytopic  --partitions 1 --replication-factor 1
```

create表明我们要创建的主题， partitions对应分区数，replication factor对应每个分区下的副本数。

### 查询主题

```terminal
% kafka-topics --bootstrap-server localhost:9092 --list
__consumer_offsets
mytopic
```

可以看到 查处了 `mytopic` 这个主题

详细数据

```terminal
% kafka-topics --bootstrap-server localhost:9092 --describe --topic mytopic
Topic: mytopic	PartitionCount: 1	ReplicationFactor: 1	Configs: segment.bytes=1073741824
	Topic: mytopic	Partition: 0	Leader: 0	Replicas: 0	Isr: 0
```

### 启动生产者

先打开一个 terminal

```terminal
% kafka-console-producer --broker-list localhost:9092 --topic mytopic
>hello
>world
>
```

看到输入了一个 `hello` 和一个 `world` 两个消息，这个 terminal 一直会等待输入，可以按组合键 `Ctrl+C` 关闭

之后需要启动消费者接收消息

### 启动消费者

再打开第二个 terminal

```terminal
% kafka-console-consumer --bootstrap-server localhost:9092 --topic mytopic --from-beginning
hello
world
```

可以看到，消费者收到了消息，同样，这个 terminal 也会一直等待接收，可以按组合键 `Ctrl+C` 关闭

### 删除主题

```terminal
% kafka-topics --bootstrap-server localhost:9092 --delete --topic mytopic
```

再次查看一下主题

```terminal
% kafka-topics --bootstrap-server localhost:9092 --list
__consumer_offsets
```

可以看到 `mytopic` 主题已经被删除

## 其他

### kafka 管理 UI

可以使用 CMAK 进行管理，具体参考[Cluster Manager for Apache Kafka][3]

### 日志位置

遇到问题，可以查看一下日志

kafka 的日志

```
% tail -f /usr/local/var/log/kafka/kafka_output.log
```

zookeeper 的日志

```terminal
% tail -f /usr/local/var/log/zookeeper/zookeeper.log
```

## 结束语

本例演示使用 brew 安装和配置 kafka。

## 参考资料
[Apache Kafka][1]  
[The AdminServer][2]  
[Cluster Manager for Apache Kafka][3]  

[1]: http://kafka.apache.org
[2]: https://zookeeper.apache.org/doc/current/zookeeperAdmin.html#sc_adminserver
[3]: https://github.com/yahoo/CMAK

