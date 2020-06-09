---
layout: post
title: CentOS 8 配置 Redis Sentinel 
categories: [Linux]
tags: [centos, redis, redis sentinel]
update: 2020-05-15
summary: Redis 通过 Redis Sentinel 分布式系统提供高可用性。Sentinel 帮助监视 Redis 实例，检测故障并自动进行角色切换，从而使 Redis 部署能够抵抗任何类型的故障。
---
## 前言
Redis 通过 Redis Sentinel 分布式系统提供高可用性。Sentinel 帮助监视 Redis 实例，检测故障并自动进行角色切换，从而使 Redis 部署能够抵抗任何类型的故障。

Redis 主要有三种方式冗余

- [Redis Replication][1] 专注于备份，最少需要 2 个节点（一主一从复制） 
- [Redis Sentinel][2] 专注于高可用，推荐 3 个节点（一主两从）
- [Redis Cluster][3] 专注于高可用和集群，推荐 6 个节点（三个一主一从复制组）

配置 Redis Sentinel 需要先配置 Redis Replication, 本文也是这个顺序，先配置一主两从复制，再配置哨兵模式。

### 环境说明

CentOS 8（Minimal Install）

```terminal
$ cat /etc/redhat-release 
CentOS Linux release 8.1.1911 (Core)
```
节点配置

| HostName | IP          | Role    | Description            |
| -------- | ----------- | ------- | ---------------------- |
| Redis1   | 10.11.0.167 | Master  | Master and Sentinel1   |
| Redis2   | 10.11.0.168 | Replica | Replica1 and Sentinel2 |
| Redis3   | 10.11.0.169 | Replica | Replica2 and Sentinel3 |

更新系统

```terminal
$ sudo dnf update
```

## 安装

### 安装 Redis 5
使用 CentOS 8 默认的仓库进行安装，三个节点（Redis1, Redis2, Redis3）都一样。

```terminal
$ sudo dnf install redis
```

安装的版本是是 redis-5.0.3

查看一下配置文件

```terminal
$ ls -alZ /etc/redis*
-rw-r-----. 1 redis root system_u:object_r:etc_t:s0        62247 May 12 11:47 /etc/redis.conf
-rw-r-----. 1 redis root system_u:object_r:redis_conf_t:s0 10152 May 12 13:38 /etc/redis-sentinel.conf
```

> `注意`
>
> -  redis.conf 和 redis-sentinel.conf 的所属用户为 redis，所属组为 root
> -  redis-sentinel.conf 的安全上下文类型为 system_u:object_r:redis_conf_t:s0

主要是文件权限和安全上下文类型，万一需要恢复默认文件，重新配置时，配错了可能有权限问题。

备份 redis 配置文件

```terminal
$ sudo cp --preserve=all /etc/redis.conf /etc/redis.conf.original
```

备份 redis-sentinel 配置文件

```terminal
$ sudo cp --preserve=all /etc/redis-sentinel.conf /etc/redis-sentinel.conf.original
```

接下来，开始进行主从复制的配置，本例为一主两从复制。

## 主从复制

主从模式主要配置 `redis.conf` 文件

### 主服务器

配置主服务器 (Redis1)

```terminal
$ sudo vi /etc/redis.conf
```

主要修改如下参数：

```terminal
# 使得 Redis 服务器可以跨网络访问
bind 0.0.0.0

# 由于是 CentOS 8 所以使用 systemd
supervised systemd

# 主服务器密码
masterauth <your_password>

# 设置密码
requirepass <your_password>

# 设置存储，以防断电时进行恢复
appendonly yes
```

### 复制服务器

配置复制服务器 (Redis2, Redis3)

```terminal
$ sudo vi /etc/redis.conf
```

主要修改如下参数：

```terminal
# 使得 Redis 服务器可以跨网络访问
bind 0.0.0.0

# 由于是 CentOS 8 所以使用 systemd
supervised systemd

# 指定主服务器，注意：有关 replicaof 的配置只是配置从服务器，主服务器不需要配置
replicaof 10.11.0.167 6379

# 主服务器密码
masterauth <your_password>

# 设置密码
requirepass <your_password>

# 设置存储，以防断电时进行恢复
appendonly yes
```

### 测试

开启 Redis 服务和开机启动服务

```terminal
$ sudo systemctl enable --now redis
```

开启防火墙端口（Redis1, Redis2, Redis3），本例没有修改，为默认的 6379 端口

```terminal
$ sudo firewall-cmd --zone=public --permanent --add-service=redis
```

配置了主从复制之后，主节点可读可写，复制节点只读。

本例使用 [redis-cli][4] 进行，redis-cli 是 Redis 默认的 Command Line Interface，安装 redis 时默认已经安装。

本例在 Redis1 上进行

```terminal
$ redis-cli -h 10.11.0.167
10.11.0.167:6379> auth <your_password>
OK
10.11.0.167:6379> info replication
# Replication
role:master # 当前服务器的角色
connected_slaves:2 # 连接的 salve 数量
slave0:ip=10.11.0.168,port=6379,state=online,offset=91804,lag=0
slave1:ip=10.11.0.169,port=6379,state=online,offset=91804,lag=1
master_replid:365c9e16c9b7641df89d4c7240b37b65498fcde5
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:91818
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:91818
10.11.0.167:6379> exit # 退出
```

接下来连接到复制服务器上查看一下，本例以 Redis2 为例

```terminal
$ redis-cli -h 10.11.0.168
10.11.0.168:6379> auth <your_password>
OK
10.11.0.168:6379> info replication
# Replication
role:slave # 当前服务器的角色
master_host:10.11.0.167
master_port:6379
master_link_status:up
master_last_io_seconds_ago:0
master_sync_in_progress:0
slave_repl_offset:116158
slave_priority:100
slave_read_only:1
connected_slaves:0
master_replid:365c9e16c9b7641df89d4c7240b37b65498fcde5
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:116158
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:7266
repl_backlog_histlen:108893
10.11.0.168:6379> exit # 退出
```

可以看到，已经复制服务已经开启。

## 哨兵模式

哨兵模式主要是配置 `redis-sentinel.conf` 配置文件。

> `注意`
>
> 三个服务器的配置都一样。

编辑配置文件

```terminal
$ sudo vi /etc/redis-sentinel.conf
```

主要修改如下参数：

```terminal
# sentinel monitor <master-name> <ip> <redis-port> <quorum>
# 配置监听的主服务器，
# mymaster 代表服务器的名称，可以自定义。
# 10.11.0.167 代表监控的主服务器
# 6379 代表端口
# 2 代表只有两个或两个以上的哨兵认为主服务器不可用的时候，才会进行failover操作。
sentinel monitor mymaster 10.11.0.167 6379 2

# sentinel auth-pass <master-name> <password>
# 定义服务的密码
# mymaster 是服务名称
# <your_password> 是 Redis 服务器密码
sentinel auth-pass mymaster <your_password>
```

### 测试

开启 Redis Sentinel 的服务和开机启动

```terminal
$ sudo systemctl enable --now redis-sentinel
```

开启防火墙端口（Redis1, Redis2, Redis3），本例没有修改，为默认的 26379 端口

```terminal
$ sudo firewall-cmd --zone=public --permanent --add-service=redis-sentinel
```

查看 Sentinel 状态

```terminal
$ redis-cli -h 10.11.0.167 -p 26379 info sentinel
# Sentinel
sentinel_masters:1
sentinel_tilt:0
sentinel_running_scripts:0
sentinel_scripts_queue_length:0
sentinel_simulate_failure_flags:0
master0:name=mymaster,status=ok,address=127.0.0.1:6379,slaves=2,sentinels=3
```

主要看 `master0:name=mymaster,status=ok,address=127.0.0.1:6379,slaves=2,sentinels=3` ，表示 2 个 salve 和 3 个 sentinel。

接下来连接 Redis2 和 Redis3 查看一下主服务器

```terminal
$ redis-cli -h 10.11.0.168 -p 26379 sentinel get-master-addr-by-name mymaster
1) "10.11.0.167"
2) "6379"
$ redis-cli -h 10.11.0.169 -p 26379 sentinel get-master-addr-by-name mymaster
1) "10.11.0.167"
2) "6379"
```

可以看到主服务器是： `10.11.0.167` 

### 测试故障转移

连接主服务器，之后 sleep 一段时间，再查看 Redis2 和 Redis3 的主服务器

```terminal
$ redis-cli -h 10.11.0.167
10.11.0.167:6379> auth <your_password>
OK
10.11.0.167:6379> debug sleep 60
```

 休眠期间，需要等待几秒，redis-sentinel 检测之后才会转移

```terminal
$ redis-cli -h 10.11.0.168 -p 26379 sentinel get-master-addr-by-name mymaster
1) "10.11.0.168"
2) "6379"
$ redis-cli -h 10.11.0.169 -p 26379 sentinel get-master-addr-by-name mymaster
1) "10.11.0.168"
2) "6379"
```

可以看到，现在 Redis2 和 Redis3 服务器的主服务器改为了 Redis2 (即 `10.11.0.168`）.

## 报错处理

启动好服务之后，可以查看一下 `redis.log`  和 `sentinel.log`

```terminal
$ sudo tail -fn 100 /var/log/redis/redis.log
```

```terminal
$ sudo tail -fn 100 /var/log/redis/sentinel.log
```

### 错误1

可能会发现有如下错误：

```terminal
WARNING overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf and then reboot or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.
```

解决办法

`注意` 使用 root 账户

```terminal
# echo 1 > /proc/sys/vm/overcommit_memory
```

这会立刻生效

或者设置 `/etc/sysctl.conf` 文件

 ```terminal
# vi /etc/sysctl.conf
 ```

再文件最后追加如下内容

```terminal
vm.overcommit_memory=1
```

这种方式需要重启机器生效

### 错误2

```terminal
WARNING: The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.
```

解决办法

```terminal
# echo 1024 > /proc/sys/net/core/somaxconn
```

这会立即生效

或者设置 `/etc/sysctl.conf` 文件

```terminal
# vi /etc/sysctl.conf
```

追加如下内容

```terminal
net.core.somaxconn=65535
```

这种方式需要重启机器生效

### 错误3

可能会出现如下错误

```terminal
WARNING you have Transparent Huge Pages (THP) support enabled in your kernel. This will create latency and memory usage issues with Redis. To fix this issue run the command 'echo never > /sys/kernel/mm/transparent_hugepage/enabled' as root, and add it to your /etc/rc.local in order to retain the setting after a reboot. Redis must be restarted after THP is disabled.
```

解决办法

```terminal
# echo never > /sys/kernel/mm/transparent_hugepage/enabled
```

会立刻生效

## 结论

本文演示了 CentOS 8 下 Redis 哨兵模式，哨兵模式主要提供了高可用，如果数据量很大，可以考虑 [Redis Cluster][3]。

## 参考资料
[Redis Replication][1]  
[Redis Sentinel][2]  
[Redis Cluster][3]  
[Redis-cli][4]  
[How to Setup Redis Replication (with Cluster-Mode Disabled) in CentOS 8 – Part 1][5]  
[How to Setup Redis For High Availability with Sentinel in CentOS 8 – Part 2][6]   

[1]: https://redis.io/topics/replication
[2]: https://redis.io/topics/sentinel
[3]: https://redis.io/topics/cluster-tutorial
[4]: https://redis.io/topics/rediscli
[5]: https://www.tecmint.com/setup-redis-replication-in-centos-8/
[6]: https://www.tecmint.com/setup-redis-high-availability-with-sentinel-in-centos-8/