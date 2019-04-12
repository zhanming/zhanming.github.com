---
layout: post
title: CentOS 7 配置 Keepalived 实现双机热备 
categories: [Linux]
tags: [centos, keepalived, vrrp]
summary: Keepalived 是集群管理中保证集群高可用的一个服务软件，其功能类似于 heartbeat，用来防止单点故障。 本例演示 CentOS 7 下安装和配置 Keepalived 的基本步骤。
---
## 前言
Keepalived 是集群管理中保证集群高可用的一个服务软件，其功能类似于 heartbeat，用来防止单点故障。 本例演示 CentOS 7 下安装和配置 Keepalived 的基本步骤。

Keepalived 是以 VRRP（Virtual Router Redundancy Protocol，虚拟路由冗余协议）协议为实现基础的，这个协议可以认为是实现了路由器高可用的协议，将多台提供相同功能的路由器组成一个路由器组。

1. 这里面有一个 MASTER 和多个 BACKUP；
2. MASTER 上面有一个对外提供服务的 Virtual IP(VIP)；
3. MASTER 会发组播，当 BACKUP 收不到 VRRP 包时就认为 MASTER 宕机
4. 这时需要根据 VRRP 优先级来选举一个 BACKUP 为 MASTER，这样就保证路由器的正常使用了。

### 环境说明
CentOS 7（Minimal Install）

```terminal
$ cat /etc/redhat-release 
CentOS Linux release 7.5.1804 (Core) 
```

本例演示环境如下

| Name     | IP Addr    | Descprition   |
|----------|------------|---------------|
| VIP      | 10.0.0.10  | 虚拟 IP       |
| MASTER   | 10.0.0.11  | 主服务器 IP    |
| BACKUP   | 10.0.0.12  | 备服务器 IP    |

本例安装 Nginx，使用浏览器查看效果。

## 步骤

### 步骤 1: 安装
Keepalived 可以使用 yum 直接安装，在 master 服务器和 backup 服务器执行：

```terminal
$ sudo yum install keepalived
```

安装 Nginx, 参考 [Install Nginx Binary Releases][1] 。

### 步骤 2: 配置 Master 服务器

先确认网卡

```terminal
$ ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: em1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP qlen 1000
    link/ether 80:18:44:e8:b3:18 brd ff:ff:ff:ff:ff:ff
    inet 10.0.0.11/24 brd 10.0.0.255 scope global em1
       valid_lft forever preferred_lft forever
    inet6 fe80::8218:44ff:fee8:b318/64 scope link 
       valid_lft forever preferred_lft forever
3: em2: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc mq state DOWN qlen 1000
    link/ether 80:18:44:e8:b3:19 brd ff:ff:ff:ff:ff:ff

```

本例使用 em1 这块网卡。 

```terminal
$ sudo vi /etc/keepalived/keepalived.conf
```

如下配置

```terminal
! Configuration File for keepalived

global_defs {
   notification_email {
     # email 接收方
     acassen@firewall.loc
     failover@firewall.loc
     sysadmin@firewall.loc
   }
   # email 发送方
   notification_email_from Alexandre.Cassen@firewall.loc
   # 邮件服务器, smtp 协议
   smtp_server 192.168.200.1
   smtp_connect_timeout 30
   router_id app2
   vrrp_skip_check_adv_addr
   # 使用 unicast_src_ip 需要注释 vrrp_strict，而且也可以进行 ping 测试
   #vrrp_strict 
   vrrp_garp_interval 0
   vrrp_gna_interval 0
}

# vrrp实例
vrrp_instance VI_1 {
    # 指定 keepalived 的角色，MASTER 表示此主机是主服务器，BACKUP 表示此主机是备用服务器
    state MASTER

    # 指定网卡
    interface em1

    # 虚拟路由标识，这个标识是一个数字，同一个vrrp实例使用唯一的标识。
    # 即同一vrrp_instance下，MASTER和BACKUP必须是一致的
    virtual_router_id 51

    # 定义优先级，数字越大，优先级越高（0-255）。
    # 在同一个vrrp_instance下，MASTER 的优先级必须大于 BACKUP 的优先级
    priority 100

    # 设定 MASTER 与 BACKUP 负载均衡器之间同步检查的时间间隔，单位是秒
    advert_int 1

    # 如果两节点的上联交换机禁用了组播，则采用 vrrp 单播通告的方式
    unicast_src_ip 10.0.0.11
    unicast_peer {
        10.0.0.12
    }

    # 设置验证类型和密码
    authentication {
        #设置验证类型，主要有PASS和AH两种
        auth_type PASS
        #设置验证密码，在同一个vrrp_instance下，MASTER与BACKUP必须使用相同的密码才能正常通信
        auth_pass 1111
    }

    #设置虚拟IP地址，可以设置多个虚拟IP地址，每行一个
    virtual_ipaddress {
        # 虚拟 IP
        10.0.0.10/24 brd 10.0.0.255
    }
}

# 虚拟服务器端口配置
virtual_server 10.0.0.10 80 {
    delay_loop 6
    lb_algo rr
    lb_kind NAT
    persistence_timeout 50
    protocol TCP

    real_server 10.0.0.11 80 {
        weight 1
    }
}

```

本配置中，最后设置了虚拟 IP 的 80 端口，指向了本地的 80 端口。

### 步骤 3: 配置 BACKUP 服务器

BACKUP 配置基本跟 MASTER 一致，主要有部分变动

```terminal
$ sudo vi /etc/keepalived/keepalived.conf
```

> **`注意以下几点`**  
> 
> 1. state 角色为 BACKUP  
> 2. interface 为网卡的 ID，要根据机器确认  
> 3. virtual_route_id 要与 MASTER 一致，默认为 51  
> 4. priority 要比 MASTER 小  
> 5. unicast_src_ip 要设置正确，组播地址设置之后，要注释 vrrp_strict 选项

变动如下

```terminal
! Configuration File for keepalived

...
...

# vrrp实例
vrrp_instance VI_1 {
    # 指定 keepalived 的角色，BACKUP 表示此主机是备用服务器
    state BACKUP 

    # 确认网卡的 ID
    interface em1 

    # 即同一vrrp_instance下，MASTER 和 BACKUP 必须是一致的
    virtual_router_id 51 

    # 比 MASTER 小
    priority 99 

    ...
    ...
    # 如果两节点的上联交换机禁用了组播，则采用 vrrp 单播通告的方式
    unicast_src_ip 10.0.0.12
    unicast_peer {
        10.0.0.11
    }
    ...
    ...
}

# 虚拟服务器端口配置
virtual_server 10.0.0.10 80 {
    ...
    ...

    real_server 10.0.0.12 80 {
        weight 1
    }
}

```
### 步骤 4: 配置并启动服务
配置 IP 转发，需要修改配置文件 `/etc/sysctl.conf`，默认只有 root 可以修改

```terminal
$ su - root
Password:
# echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
# sysctl -p
# exit
```

防火墙添加规则，因为 VRRP 使用 `224.0.0.18` 这个组播地址

```terminal
$ sudo firewall-cmd --direct --permanent --add-rule ipv4 filter INPUT 0 --in-interface em1 --destination 224.0.0.18 --protocol vrrp -j ACCEPT
success
$ sudo firewall-cmd --direct --permanent --add-rule ipv4 filter OUTPUT 0 --out-interface em1 --destination 224.0.0.18 --protocol vrrp -j ACCEPT
success
$ sudo firewall-cmd --reload
success
```

可以查看一下这两条规则

```terminal
$ sudo firewall-cmd --direct --get-rules ipv4 filter INPUT
0 --in-interface em1 --destination 224.0.0.18 --protocol vrrp -j ACCEPT
$ sudo firewall-cmd --direct --get-rules ipv4 filter OUTPUT
0 --out-interface em1 --destination 224.0.0.18 --protocol vrrp -j ACCEPT
```

启动 MASTER 和 BACKUP 的 keepalived 服务

```terminal
$ sudo systemctl start keepalived
```

设置开机启动

```terminal
$ sudo systemctl enable keepalived
```

此时查看 MASTER 的网卡

```terminal
$ ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: em1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP qlen 1000
    link/ether 80:18:44:e8:b3:18 brd ff:ff:ff:ff:ff:ff
    inet 10.0.0.11/24 brd 10.0.0.255 scope global em1
       valid_lft forever preferred_lft forever
    inet 10.0.0.10/24 brd 10.0.0.255 scope global secondary em1
       valid_lft forever preferred_lft forever
    inet6 fe80::8218:44ff:fee8:b318/64 scope link 
       valid_lft forever preferred_lft forever
3: em2: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc mq state DOWN qlen 1000
    link/ether 80:18:44:e8:b3:19 brd ff:ff:ff:ff:ff:ff

```

可以发现 MASTER 服务器的 em1 网卡上多了 `10.0.0.10` 这个虚拟 IP 地址。

漂移规则如下：  
1. 默认使用 MASTER 服务器（`10.0.0.11`），虚拟 IP 为 `10.0.0.10`，此时 MASTER 服务器会有 2 个IP。
2. 当 MASTER 出问题时，IP 会漂移到 BACKUP 服务器（`10.0.0.12`），此时 BACKUP 服务器会有 2 个IP。
3. 当 MASTER 重新启动后，虚拟 IP 又会漂移回 MASTER 服务器。 

### 步骤 5: 服务测试
查看 IP 的变化可用如下命令（MASTER 和 BACKUP 都在线）：

安装 tcpdump 包

```terminal
$ sudo yum install tcpdump
```

在 MASTER 服务器上执行

```terminal
$ sudo tcpdump -i em1 vrrp -n
02:16:07.739305 IP 10.0.0.11 > 10.0.0.12: VRRPv2, Advertisement, vrid 51, prio 100, authtype simple, intvl 1s, length 20
02:16:08.740362 IP 10.0.0.11 > 10.0.0.12: VRRPv2, Advertisement, vrid 51, prio 100, authtype simple, intvl 1s, length 20
02:16:09.741401 IP 10.0.0.11 > 10.0.0.12: VRRPv2, Advertisement, vrid 51, prio 100, authtype simple, intvl 1s, length 20
...
...
```

这表明 MASTER 在向 BACKUP 广播，MASTER 在线。此时虚拟 IP 时挂在 MASTER 上的，如果想退出, 按 `Ctrl+C`。

如果 MASTER 停止 keepalived，虚拟 IP 会漂移到 BACKUP 服务器上。  
我们可以测试一下：

首先，停止 MASTER 的 keepalived  

```terminal
$ sudo systemctl stop keepalived
```

然后，在 MASTER 服务器上查看 VRRP 服务

```terminal
$ sudo tcpdump -i em1 vrrp -n
02:19:08.874676 IP 10.0.0.12 > 10.0.0.11: VRRPv2, Advertisement, vrid 51, prio 99, authtype simple, intvl 1s, length 20
02:19:09.875710 IP 10.0.0.12 > 10.0.0.11: VRRPv2, Advertisement, vrid 51, prio 99, authtype simple, intvl 1s, length 20
02:19:10.876742 IP 10.0.0.12 > 10.0.0.11: VRRPv2, Advertisement, vrid 51, prio 99, authtype simple, intvl 1s, length 20
...
...
```

这表明 MASTER 收到 BACKUP 的广播，此时虚拟 IP 时挂在 BACKUP 服务器上。

### 步骤 6: 配置日志

> **`注意`** 
> 
> 此配置为可选步骤。
> 

keepalived 默认将日志输出到系统日志`/var/log/messages`中，因为系统日志很多，查询问题时相对麻烦。

我们可以将 keepalived 的日志单独拿出来，这需要修改日志输出路径。

修改 Keepalived 配置  

```terminal
$ sudo vi /etc/sysconfig/keepalived
```
更改如下：
```terminal
# Options for keepalived. See `keepalived --help' output and keepalived(8) and
# keepalived.conf(5) man pages for a list of all options. Here are the most
# common ones :
#
# --vrrp               -P    Only run with VRRP subsystem.
# --check              -C    Only run with Health-checker subsystem.
# --dont-release-vrrp  -V    Dont remove VRRP VIPs & VROUTEs on daemon stop.
# --dont-release-ipvs  -I    Dont remove IPVS topology on daemon stop.
# --dump-conf          -d    Dump the configuration data.
# --log-detail         -D    Detailed log messages.
# --log-facility       -S    0-7 Set local syslog facility (default=LOG_DAEMON)
#

KEEPALIVED_OPTIONS="-D -d -S 0"
```
把 KEEPALIVED_OPTIONS="-D" 修改为 KEEPALIVED_OPTIONS="-D -d -S 0"，其中 -S 指定 syslog 的 facility

修改 `/etc/rsyslog.conf` 末尾添加

```terminal
$ sudo vi /etc/rsyslog.conf 
local0.*                                                /var/log/keepalived.log
```
重启日志记录服务

```terminal
$ sudo systemctl restart rsyslog
```

重启 keepalived

```terminal
$ sudo systemctl restart keepalived
```

此时，可以从 `/var/log/keepalived.log` 查看日志了。

## 结论
本文演示了 CentOS 7 下 Keepalived 的安装，配置虚拟 IP 地址，，启动服务等。

## 参考资料
[keepalived实现双机热备][2]  
[centos7 keepalived以及防火墙配置][3]  
[Keepalived日志][4]  

 
[1]: https://www.nginx.com/resources/wiki/start/topics/tutorials/install/  
[2]: https://www.cnblogs.com/jefflee168/p/7442127.html
[3]: https://www.cnblogs.com/lgh344902118/p/7737129.html 
[4]: https://www.cnblogs.com/zzzhfo/p/6070575.html
