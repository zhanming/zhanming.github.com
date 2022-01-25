---
layout: post
title: Rocky 8 使用 cephadm 安装 Ceph 16.2 实验 NFS 服务
categories: [Linux]
tags: [ceph, storage, linux]
summary: Rocky 8 使用 cephadm 安装 Ceph 16.2 (Pacific)，实验 NFS 服务，记录一下安装和配置过程。
---
## 前言

Rocky 8 使用 cephadm 安装 Ceph 16.2 (Pacific)，实验 NFS 服务，记录一下安装和配置过程。

Ceph 是一款分布式存储系统，支持三种存储方式：对象存储、块存储和文件存储。Ceph 的部署工具有很多，但是 Ceph v15.2 (Octopus) 开始，推荐使用 cephadm 和 rook。其中 rook 是针对 kubernetes 的 ceph 部署工具，不在本例范围。

cephadm 为单独部署工具，使用容器化技术进行集群部署和管理，容器技术目前支持使用 docker 和 podman，本例以 podman 为例进行部署。本例以 Ceph v16.2 (Pacific) 为例进行安装演示。

> `注意`  
> 本例是实验目的，仅供学习使用。

由于 Ceph 自带的 Ingress 还在开发，虽然可以配置成功，但是不能平滑切换，高可用 NFS 可能要等到 Ceph v17.2 (Quincy) 实现，如果真的可以，到时再测试一下。  
具体说法可以参考官方文档 [NFS CLUSTER MANAGEMENT][2]

```
Note: The ingress implementation is not yet complete. Enabling ingress will deploy multiple ganesha instances and balance load across them, but a host failure will not immediately cause cephadm to deploy a replacement daemon before the NFS grace period expires.  This high-availability functionality is expected to be completed by the Quincy release (March 2022).
```

### 环境说明
Rocky 8（Minimal Install）

```bash
# cat /etc/system-release
Rocky Linux release 8.5 (Green Obsidian)
```

Ceph 分布式存储集群中一般分为两种类型主机: MON （Monitor）监控节点 和 OSD (Object Storage Device) 对象存储设备节点。Ceph 存储集群最少需要一个 MON 和 两个 OSD （作为复制）组成。

生产环境里一般 MON 节点是 3 或 5 个， OSD 节点是越多越好，而且这两种节点应在不同主机安装，但是本例为实验目的，就安装在一起了。

本例使用 Virtual Box 虚拟机进行实验.

本例演示环境如下

| Hostname    | IP Addr        | CPU | Memory | Disk               | Role      |
|:------------|----------------|-----|--------|--------------------|-----------|
| ceph1       | 192.168.56.221 |   1 |     2G | sda(20G), sdb(20G) | bootstrap |
| ceph2       | 192.168.56.222 |   1 |     2G | sda(20G), sdb(20G) |           |
| ceph3       | 192.168.56.223 |   1 |     2G | sda(20G), sdb(20G) |           |
| cephclient1 | 192.168.56.199 |   1 |     2G | sda(20G)           |           |

ceph1、ceph2 和 ceph3 为 Ceph 集群节点，cephclient1 为客户端，用于测试挂在存储。

每个虚拟机配置两块网卡（一块 NIC 设置为 NAT，另一块 NIC 设置为 Host-only）。

1. 使用 NAT 网络，虚拟机可以访问外网，下载安装包。
2. 使用 Host-only 的好处是虚拟机网络不会受外界的网络变化影响，使用 Virtual Box 默认的 192.168.56.0/24 作为虚拟机的 CIDR，保证虚拟机之间可以相互访问（此网卡设置静态 IP 地址）。 

> `注意`  
> 1. 操作系统安装到 sda 盘上。  
> 2. sdb 盘不需要格式化，因为 cephadm 只支持 BlueStore OSDs 就是直接管理裸设备，这样会极大的提升性能。  
> 3. Ceph 支持管理网络和公用网络分开，本例没有设置，使用同一个网络。

## 步骤

### 准备主机

三个主机都执行：

```bash
[root@ceph1/2/3 ~]# dnf update
[root@ceph1/2/3 ~]# dnf install python3
[root@ceph1/2/3 ~]# dnf install podman
[root@ceph1/2/3 ~]# dnf install chrony
[root@ceph1/2/3 ~]# systemctl enable chronyd && systemctl start chronyd
```

查看一下版本：
```bash
[root@ceph1 ~]# python3 --version
Python 3.6.8
[root@ceph1 ~]# podman --version
podman version 3.3.1
[root@ceph1 ~]# chronyc --version
chronyc (chrony) version 4.1 (+READLINE +SECHASH +IPV6 +DEBUG)
```

```bash
[root@ceph1/2/3 ~]# vi /etc/hosts
192.168.56.221 ceph1
192.168.56.222 ceph2
192.168.56.223 ceph3
```

由于 Ceph 对于节点之间的时间同步要求较高，本试验由于没有本地的 ntp 服务器，添加其他节点之前，设置 ceph1 节点的 chrony 服务为本地 ntp 服务器。

> `注意`  
> 生产环境应该是一个独立的 ntp 服务，防止万一 ceph1 节点出问题，导致集群时间都不同步了。

```bash
[root@ceph1 ~]# vi /etc/chrony.conf
```

找到本地客户端设置的地方，添加如下内容
```
# Allow NTP client access from local network.
#allow 192.168.0.0/16
allow 192.168.56.0/24
```
> `注意`  
> 实验环境的网段 CIDR 为 `192.168.56.0/24`，请根据您的实际情况进行更改。

修改完之后，需要重启一下 `chrony` 服务,并且打开防火墙端口
```bash
[root@ceph1 ~]# systemctl restart chronyd
[root@ceph1 ~]# firewall-cmd --permanent --add-service=ntp
success
[root@ceph1 ~]# firewall-cmd --reload
success
[root@ceph1 ~]# firewall-cmd --list-all
public (active)
  target: default
  icmp-block-inversion: no
  interfaces: enp0s3 enp0s8
  sources:
  services: cockpit dhcpv6-client ntp ssh
  ports:
  protocols:
  forward: no
  masquerade: no
  forward-ports:
  source-ports:
  icmp-blocks:
  rich rules:
```

再另外两个节点设置与 ceph1 时间进行同步
```bash
[root@ceph2/3 ~]# vi /etc/chrony.conf
# Use public servers from the pool.ntp.org project.
# Please consider joining the pool (http://www.pool.ntp.org/join.html).
#pool 2.pool.ntp.org iburst
server 192.168.56.221 iburst
```
然后也重启一下 chronyd 服务
```bash
[root@ceph2/3 ~]# systemctl restart chronyd
```
这样基本就完成了准备工作。

还有另一种方法确认，每个主机（本例为 3 个）都执行：

```bash
[root@ceph1 ~]# curl --silent --remote-name --location https://github.com/ceph/ceph/raw/pacific/src/cephadm/cephadm
[root@ceph1 ~]# chmod +x cephadm
[root@ceph1 ~]# ./cephadm add-repo --release pacific
[root@ceph1 ~]# ./cephadm install
```

使用 `cephadm prepare-host` 查看准备情况
```bash
[root@ceph1/2/3 ~]# cephadm prepare-host
Verifying podman|docker is present...
Verifying lvm2 is present...
Verifying time synchronization is in place...
Unit chronyd.service is enabled and running
Repeating the final host check...
podman (/usr/bin/podman) version 3.3.1 is present
systemctl is present
lvcreate is present
Unit chronyd.service is enabled and running
Host looks OK
```

### 通过 cephadm 引导

通过 cephadm “引导”一个单节点Ceph集群起来，只在 ceph1 节点运行即可。

只在 bootstrap 节点上（本例使用 ceph1）执行

先使用 cephadm 引导安装
```bash
[root@ceph1 ~]# cephadm bootstrap --mon-ip 192.168.56.221
Creating directory /etc/ceph for ceph.conf
Verifying podman|docker is present...
Verifying lvm2 is present...
Verifying time synchronization is in place...
Unit chronyd.service is enabled and running
Repeating the final host check...
podman (/usr/bin/podman) version 3.3.1 is present
systemctl is present
lvcreate is present
Unit chronyd.service is enabled and running
Host looks OK
Cluster fsid: 9cad419e-7d8d-11ec-8335-080027b919a0
Verifying IP 192.168.56.221 port 3300 ...
Verifying IP 192.168.56.221 port 6789 ...
Mon IP `192.168.56.221` is in CIDR network `192.168.56.0/24`
- internal network (--cluster-network) has not been provided, OSD replication will default to the public_network
Pulling container image quay.io/ceph/ceph:v16...
Ceph version: ceph version 16.2.7 (dd0603118f56ab514f133c8d2e3adfc983942503) pacific (stable)
Extracting ceph user uid/gid from container image...
Creating initial keys...
Creating initial monmap...
Creating mon...
firewalld ready
Enabling firewalld service ceph-mon in current zone...
Waiting for mon to start...
Waiting for mon...
mon is available
Assimilating anything we can from ceph.conf...
Generating new minimal ceph.conf...
Restarting the monitor...
Setting mon public_network to 192.168.56.0/24
Wrote config to /etc/ceph/ceph.conf
Wrote keyring to /etc/ceph/ceph.client.admin.keyring
Creating mgr...
Verifying port 9283 ...
firewalld ready
Enabling firewalld service ceph in current zone...
firewalld ready
Enabling firewalld port 9283/tcp in current zone...
Waiting for mgr to start...
Waiting for mgr...
mgr not available, waiting (1/15)...
mgr is available
Enabling cephadm module...
Waiting for the mgr to restart...
Waiting for mgr epoch 4...
mgr epoch 4 is available
Setting orchestrator backend to cephadm...
Generating ssh key...
Wrote public SSH key to /etc/ceph/ceph.pub
Adding key to root@localhost authorized_keys...
Adding host ceph1...
Deploying mon service with default placement...
Deploying mgr service with default placement...
Deploying crash service with default placement...
Deploying prometheus service with default placement...
Deploying grafana service with default placement...
Deploying node-exporter service with default placement...
Deploying alertmanager service with default placement...
Enabling the dashboard module...
Waiting for the mgr to restart...
Waiting for mgr epoch 8...
mgr epoch 8 is available
Generating a dashboard self-signed certificate...
Creating initial admin user...
Fetching dashboard port number...
firewalld ready
Enabling firewalld port 8443/tcp in current zone...
Ceph Dashboard is now available at:

	     URL: https://ceph1:8443/
	    User: admin
	Password: gzziclqs79

Enabling client.admin keyring and conf on hosts with "admin" label
You can access the Ceph CLI with:

	sudo /usr/sbin/cephadm shell --fsid 9cad419e-7d8d-11ec-8335-080027b919a0 -c /etc/ceph/ceph.conf -k /etc/ceph/ceph.client.admin.keyring

Please consider enabling telemetry to help improve Ceph:

	ceph telemetry on

For more information see:

	https://docs.ceph.com/docs/pacific/mgr/telemetry/

Bootstrap complete.
```
看到 `Bootstrap complete` 表示引导完成。

最后几句说明：

1. 访问 `https://ceph1:8443`, 输入用户名和密码登录之后，修改密码。  
2. 同意 telemetry，即可使用 `Dashboard GUI`，使用网页查看比较方便.

Ceph CLI 操作有三种方式:

方法 1  

`cephadm shell` 命令模式

```bash
[root@ceph1 ~]# cephadm shell
Inferring fsid ad3f72f2-798c-11ec-9e79-080027b919a0
Using recent ceph image quay.io/ceph/ceph@sha256:bb6a71f7f481985f6d3b358e3b9ef64c6755b3db5aa53198e0aac38be5c8ae54
[ceph: root@ceph1 /]#
```
可以看到，shell 的命令行格式变了，ceph 前缀出现了。

如果想退出，直接输入 exit 就可以了。
```bash
[ceph: root@ceph1 /]# exit
exit
[root@ceph1 ~]#
```
这样就回到了本机的 shell 模式。

方法 2 

`cephadm shell --` 前缀模式

cephadm 也可以使用 `cephadm shell -- ` 开头执行其他 ceph 的命令.
```bash
[root@ceph1 ~]# cephadm shell -- ceph -v
Inferring fsid ad3f72f2-798c-11ec-9e79-080027b919a0
Using recent ceph image quay.io/ceph/ceph@sha256:bb6a71f7f481985f6d3b358e3b9ef64c6755b3db5aa53198e0aac38be5c8ae54
ceph version 16.2.7 (dd0603118f56ab514f133c8d2e3adfc983942503) pacific (stable)
```
但是每次输入 `cephadmin shell --` 这个有点太长了。

方法 3 

本地模式

使用 cephadm 安装 ceph-common 包，方便使用 `ceph` 命令，里面包含了所有的 ceph 命令，其中包括 ceph，rbd，mount.ceph（用于安装CephFS文件系统）等
```bash
[root@ceph1 ~]# cephadm install  ceph-common
```
以后可以再 `ceph1` 节点上直接执行 ceph 命令了。

> `推荐`  
> 推荐使用方法 1 进行操作，红帽的官方文档事例都是这么操作的。因为使用的是容器内的命令，升级也方便，本地包依赖较少。

本实验使用方法 3，方便一点。

查看版本
```bash
[root@ceph1 ~]#ceph -v
ceph version 16.2.7 (dd0603118f56ab514f133c8d2e3adfc983942503) pacific (stable)
```

查看编排服务的状态
```bash
[root@ceph1 ~]# ceph orch status
Backend: cephadm
Available: Yes
Paused: No
```

查看容器编排服务
```bash
[root@ceph1 ~]# ceph orch ls
NAME           PORTS        RUNNING  REFRESHED  AGE  PLACEMENT
alertmanager   ?:9093,9094      1/1  2s ago     2m   count:1
crash                           1/1  2s ago     2m   *
grafana        ?:3000           1/1  2s ago     2m   count:1
mgr                             1/2  2s ago     2m   count:2
mon                             1/5  2s ago     2m   count:5
node-exporter  ?:9100           1/1  2s ago     2m   *
prometheus     ?:9095           1/1  2s ago     2m   count:1
```

可以看到，安装了 7 个容器服务。

- mgr: ceph-manager (Ceph 管理程序) 也就是 Dashboard  
- mon: ceph-monitor (Ceph 监视器)  
- crash: ceph-crash 崩溃数据收集模块  
- prometheus: prometheus监控组件  
- grafana: 监控数据展示 dashboard  
- alertmanager: prometheus告警组件  
- node_exporter: prometheus节点数据收集组件  

> `注意`  
> mon 服务默认需要安装 5 个，由于目前只安装了一个节点，所以是 `1/5`.  
> 同理 mgr 服务默认需要安装 2 个，当前为 `1/2`。

查看一下容器的进程
```bash
[root@ceph1 ~]# ceph orch ps
NAME                 HOST   PORTS        STATUS          REFRESHED   AGE  MEM USE  MEM LIM  VERSION  IMAGE ID      CONTAINER ID
alertmanager.ceph1   ceph1  *:9093,9094  running (107s)    36s ago    3m    14.7M        -  0.20.0   0881eb8f169f  3fd92369ad05
crash.ceph1          ceph1               running (3m)      36s ago    3m    6953k        -  16.2.7   cc266d6139f4  7b0cb81a82b6
grafana.ceph1        ceph1  *:3000       running (104s)    36s ago    2m    27.9M        -  6.7.4    557c83e11646  841ac47ee29a
mgr.ceph1.jhzbvt     ceph1  *:9283       running (4m)      36s ago    4m     436M        -  16.2.7   cc266d6139f4  9415d4d83d3e
mon.ceph1            ceph1               running (4m)      36s ago    4m    42.9M    2048M  16.2.7   cc266d6139f4  3f363410d2a1
node-exporter.ceph1  ceph1  *:9100       running (2m)      36s ago    2m    8456k        -  0.18.1   e5a616e4b9cf  9bfd6a8485f9
prometheus.ceph1     ceph1  *:9095       running (117s)    36s ago  117s    27.4M        -  2.18.1   de242295e225  ac00e5fb6eb8
```

最后查看一下 ceph 的总体状态

```bash
[root@ceph1 ~]# ceph status
  cluster:
    id:     66dc8e50-7da4-11ec-9e9b-080027b919a0
    health: HEALTH_WARN
            OSD count 0 < osd_pool_default_size 3

  services:
    mon: 1 daemons, quorum ceph1 (age 5m)
    mgr: ceph1.jhzbvt(active, since 3m)
    osd: 0 osds: 0 up, 0 in

  data:
    pools:   0 pools, 0 pgs
    objects: 0 objects, 0 B
    usage:   0 B used, 0 B / 0 B avail
    pgs
```

可以看到，`HEALTH_WARN`，因为没有添加 OSD，`OSD count 0 < osd_pool_default_size 3` 可以看到，默认最少 3 个 OSD。

查看一下引导节点 `ceph1` 的防火墙开放情况

```bash
[root@ceph1 ~]# firewall-cmd --list-all
public (active)
  target: default
  icmp-block-inversion: no
  interfaces: enp0s3 enp0s8
  sources:
  services: ceph ceph-mon cockpit dhcpv6-client ssh
  ports: 9283/tcp 8443/tcp 9093/tcp 9094/tcp 3000/tcp 9100/tcp 9095/tcp
  protocols:
  forward: no
  masquerade: no
  forward-ports:
  source-ports:
  icmp-blocks:
  rich rules:
```
可以看到 `cephadm` 部署过程中，会自动打开需要开放防火墙端口和服务端口（ntp 的服务端口是前面设置开放的）。

本例使用 podman 进行容器管理，也可以查一下 podman 下载了哪些镜像

```bash
[root@ceph1 ~]# podman image ls
REPOSITORY                        TAG         IMAGE ID      CREATED        SIZE
quay.io/ceph/ceph                 v16         cc266d6139f4  5 weeks ago    1.24 GB
quay.io/ceph/ceph-grafana         6.7.4       557c83e11646  5 months ago   496 MB
quay.io/prometheus/prometheus     v2.18.1     de242295e225  20 months ago  141 MB
quay.io/prometheus/alertmanager   v0.20.0     0881eb8f169f  2 years ago    53.5 MB
quay.io/prometheus/node-exporter  v0.18.1     e5a616e4b9cf  2 years ago    24.3 MB
```

### 管理主机

先拷贝公钥到其他主机，使引导节点 `ceph1` 可以免密登录到其他主机。

```bash
[root@ceph1 ~]# ssh-copy-id -f -i /etc/ceph/ceph.pub root@ceph2
[root@ceph1 ~]# ssh-copy-id -f -i /etc/ceph/ceph.pub root@ceph3
```

执行如下命令添加主机

```bash
[ceph: root@ceph1 /]# ceph orch host add ceph2 192.168.56.222
[ceph: root@ceph1 /]# ceph orch host add ceph3 192.168.56.223
```

查看一下：
```bash
[ceph: root@ceph1 /]# ceph orch host ls
HOST   ADDR            LABELS  STATUS
ceph1  192.168.56.221  _admin
ceph2  192.168.56.222
ceph3  192.168.56.223
```
可以看到 bootstrap 节点默认的标签是 `_admin`

也可以给其他主机添加 `_admin` 标签
```bash
[ceph: root@ceph1 /]# ceph orch host label add ceph2 _admin
```

过一段时间再查看一下容器部署情况
```bash
[ceph: root@ceph1 /]# ceph orch ls
NAME           PORTS        RUNNING  REFRESHED  AGE  PLACEMENT
alertmanager   ?:9093,9094      1/1  6m ago     55m  count:1
crash                           3/3  6m ago     55m  *
grafana        ?:3000           1/1  6m ago     55m  count:1
mgr                             2/2  6m ago     56m  count:2
mon                             3/5  6m ago     56m  count:5
node-exporter  ?:9100           3/3  6m ago     55m  *
prometheus     ?:9095           1/1  6m ago     55m  count:1
```
可以看一下具体的部署情况

```bash
[ceph: root@ceph1 /]# ceph orch ps
NAME                 HOST   PORTS        STATUS         REFRESHED  AGE  MEM USE  MEM LIM  VERSION  IMAGE ID      CONTAINER ID
alertmanager.ceph1   ceph1  *:9093,9094  running (21m)    16s ago  59m    23.2M        -  0.20.0   0881eb8f169f  b0768c563aa5
crash.ceph1          ceph1               running (49m)    16s ago  59m    21.1M        -  16.2.7   cc266d6139f4  d4499df1c025
crash.ceph2          ceph2               running (26m)    18s ago  26m    7226k        -  16.2.7   cc266d6139f4  194e4c9bbd7e
crash.ceph3          ceph3               running (22m)    18s ago  22m    8967k        -  16.2.7   cc266d6139f4  e511a891c88e
grafana.ceph1        ceph1  *:3000       running (49m)    16s ago  58m    87.5M        -  6.7.4    557c83e11646  9d429ed860aa
mgr.ceph1.jhzbvt     ceph1  *:9283       running (49m)    16s ago  60m     565M        -  16.2.7   cc266d6139f4  f7f8e2b2f598
mgr.ceph2.nyvgyk     ceph2  *:8443,9283  running (26m)    18s ago  26m     391M        -  16.2.7   cc266d6139f4  69d79592715b
mon.ceph1            ceph1               running (49m)    16s ago  60m     230M    2048M  16.2.7   cc266d6139f4  dd554eefde37
mon.ceph2            ceph2               running (26m)    18s ago  26m     120M    2048M  16.2.7   cc266d6139f4  a918d88f9ccb
mon.ceph3            ceph3               running (22m)    18s ago  22m     129M    2048M  16.2.7   cc266d6139f4  516ed7cd5edd
node-exporter.ceph1  ceph1  *:9100       running (49m)    16s ago  58m    31.8M        -  0.18.1   e5a616e4b9cf  c6d106db5a98
node-exporter.ceph2  ceph2  *:9100       running (24m)    18s ago  24m    14.0M        -  0.18.1   e5a616e4b9cf  9e67734ba9e4
node-exporter.ceph3  ceph3  *:9100       running (22m)    18s ago  22m    16.0M        -  0.18.1   e5a616e4b9cf  64b88ba334e2
prometheus.ceph1     ceph1  *:9095       running (21m)    16s ago  57m    56.9M        -  2.18.1   de242295e225  02c4906b7a5d
```

可以看到  
- `mgr` 也到默认的上限 2 个，部署到了 2 个节点上。
- `mon` 也是部署了 3 个，但是默认最多是 5 个，所以还没有到默认的上限。

本实验没有那么多主机，修改一下 `mon` 的部署数量上限，

> `注意`  
> mon 一般 3 或 5 个，修改的时候一定要包含 bootstrap 节点（本例为 ceph1)

修改一下 `mon` 节点到 `ceph1`,`ceph2`,`ceph3` 上
```bash
[root@ceph1 ~]# ceph orch apply mon ceph1,ceph2,ceph3
Scheduled mon update...
```

再次查看一下
```bash
[root@ceph1 ~]# ceph orch ls
NAME           PORTS        RUNNING  REFRESHED  AGE  PLACEMENT
alertmanager   ?:9093,9094      1/1  3m ago     73m  count:1
crash                           3/3  3m ago     73m  *
grafana        ?:3000           1/1  3m ago     73m  count:1
mgr                             2/2  3m ago     73m  count:2
mon                             3/3  3m ago     2s   ceph1;ceph2;ceph3
node-exporter  ?:9100           3/3  3m ago     73m  *
prometheus     ?:9095           1/1  3m ago     73m  count:1
```
可以看到 `RUNNING` 列上，mon 已经是 `3/3` 了, `PLACEMENT` 列上，可以看到运行在那台电脑主机上。

也可以只指定数量
```bash
[root@ceph1 ~]# ceph orch apply mon 3
Scheduled mon update...
```

再次查看一下
```bash
[root@ceph1 ~]# ceph orch ls
NAME           PORTS        RUNNING  REFRESHED  AGE  PLACEMENT
alertmanager   ?:9093,9094      1/1  9m ago     69m  count:1
crash                           3/3  9m ago     69m  *
grafana        ?:3000           1/1  9m ago     69m  count:1
mgr                             2/2  9m ago     69m  count:2
mon                             3/3  9m ago     8s   count:3
node-exporter  ?:9100           3/3  9m ago     69m  *
prometheus     ?:9095           1/1  9m ago     69m  count:1
```

再看一下 

> `注意`  PLACEMENT 列  
> 如果是 `*`， 表示每个节点都有，不受控制（unmanaged)。  
> 如果是 `count:3`，表示部署的上限数量，具体位置可以 `ceph orch ps` 查看一下。  
> 如果是 `ceph1;ceph2;ceph3`，表示直接显示了所在的主机位置。

### 管理 OSD

添加 OSD 需要满足以下所有条件：

- 设备必须没有分区。
- 设备不得具有任何 LVM 状态。
- 不得安装设备。
- 该设备不得包含文件系统。
- 该设备不得包含 Ceph BlueStore OSD。
- 设备必须大于 5 GiB。

查看一下磁盘状态
```bash
[root@ceph1 ~]# lsblk
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
sda           8:0    0   20G  0 disk
├─sda1        8:1    0    1G  0 part /boot
└─sda2        8:2    0   19G  0 part
  ├─rl-root 253:0    0   17G  0 lvm  /
  └─rl-swap 253:1    0    2G  0 lvm  [SWAP]
sdb           8:16   0   20G  0 disk
sr0          11:0    1 1024M  0 rom
```
本里以 `sdb` 为例，安装 ceph 的 osd。 

> `再次重申`  
> 对于想做为 OSD 的盘，类型为 disk 即可，不要进行格式化，使用 orch 编排命令即可完成全部操作。

列出节点上的所有可用设备

```bash
[root@ceph1 ~]# ceph orch device ls
HOST   PATH      TYPE  DEVICE ID                           SIZE  AVAILABLE  REJECT REASONS
ceph1  /dev/sdb  hdd   VBOX_HARDDISK_VB1e5ef148-884f7c83  21.4G  Yes
ceph2  /dev/sdb  hdd   VBOX_HARDDISK_VB6aef18c7-3d8548b1  21.4G  Yes
ceph3  /dev/sdb  hdd   VBOX_HARDDISK_VB6b51415b-6e91c2d1  21.4G  Yes
```

可以看到 3 个可用的设备。

添加有两种方式，可以任选一种。

方法 1

使用 orch 命令，自动添加所有满足条件的OSD（本例使用这个）。

```bash
[root@ceph1 ~]# ceph orch apply osd --all-available-devices
Scheduled osd.all-available-devices update...
```

方法 2

使用 osd 命令，手工指定的方式添加OSD。

```bash
[root@ceph1 ~]#  ceph orch daemon add osd ceph1:/dev/sdb
[root@ceph1 ~]#  ceph orch daemon add osd ceph2:/dev/sdb
[root@ceph1 ~]#  ceph orch daemon add osd ceph3:/dev/sdb
```

部署完之后，查看一下
```bash
[root@ceph1 ~]# ceph osd tree
ID  CLASS  WEIGHT   TYPE NAME       STATUS  REWEIGHT  PRI-AFF
-1         0.05846  root default
-7         0.01949      host ceph1
 2    hdd  0.01949          osd.2       up   1.00000  1.00000
-3         0.01949      host ceph2
 1    hdd  0.01949          osd.1       up   1.00000  1.00000
-5         0.01949      host ceph3
 0    hdd  0.01949          osd.0       up   1.00000  1.00000
```

可以看到 `ID` 列，从 osd.0 开始，由于是容器化部署，所以顺序是随机的，如：osd.0 标识在 ceph3 上。


查看一下 ceph 的状态

```bash
[root@ceph1 ~]# ceph status
  cluster:
    id:     ad3f72f2-798c-11ec-9e79-080027b919a0
    health: HEALTH_OK

  services:
    mon: 3 daemons, quorum ceph1,ceph2,ceph3 (age 4m)
    mgr: ceph1.jhzbvt(active, since 4m), standbys: ceph2.nyvgyk
    osd: 3 osds: 3 up (since 4m), 3 in (since 27h)

  data:
    pools:   1 pools, 1 pgs
    objects: 0 objects, 0 B
    usage:   0 B used, 60 GiB / 60 GiB avail
    pgs:     1 active+clean
```
可以看到， ceph 集群的状态已经是 `HEALTH_OK` 了，集群已经好了。

Ceph 集群，只要有 ceph-mon 和 ceph-osd 这两个就基本搭建完成了。但是如果需要使用其分布式存储功能（如对象存储，块存储和文件存储），则需要添加其他的模块。

再查看一下容器服务
```bash
[root@ceph1 ~]# ceph orch ls
NAME                       PORTS        RUNNING  REFRESHED  AGE  PLACEMENT
alertmanager               ?:9093,9094      1/1  71s ago    91m  count:1
crash                                       3/3  74s ago    91m  *
grafana                    ?:3000           1/1  71s ago    91m  count:1
mgr                                         2/2  74s ago    91m  count:2
mon                                         3/3  74s ago    18m  count:3
node-exporter              ?:9100           3/3  74s ago    91m  *
osd.all-available-devices                     3  74s ago    90s  *
prometheus                 ?:9095           1/1  71s ago    91m  count:1
```
可以看到，多了一个 `osd.all-available-devices` 的服务，PLACEMENT 是 `*` 表示所有节点都会安装。

部署好 osd 共享池后，会自动安装一个归置组（Placement groups），归置组（PGs) 是 ceph 的重要概念。

查看一下
```bash
[root@ceph1 ~]# ceph osd pool ls
device_health_metrics
```
可以看到，安装了设备健康指标的归置组。

Ceph 从 v14（Nautilus）开始支持归置组自动伸缩的，可以查看一下状态
```bash
[root@ceph1 ~]# ceph osd pool autoscale-status
POOL                     SIZE  TARGET SIZE  RATE  RAW CAPACITY   RATIO  TARGET RATIO  EFFECTIVE RATIO  BIAS  PG_NUM  NEW PG_NUM  AUTOSCALE  PROFILE
device_health_metrics      0                 3.0        61428M  0.0000                                  1.0       1              on         scale-up
```
可以看到 `AUTOSCALE` 是 on，表示默认设置的是自动伸缩。


### 导出为 NFS 服务
要导出 NFS 服务，CephFS 和 RGW 都可以导出，本例演示 CephFS 的导出。

主要包括以下几个步骤：  
1. 新建文件系统 CephFS
2. 新建存储池
3. 在存储池上开启 nfs 应用
4. 新建 nfs 集群
5. 新建 CephFS 的 nfs 导出 （这个会将存储池和 CephFS 联系在一起）

#### 新建文件系统 CephFS

两种方法，任选一种

方法 1

使用的是 `ceph fs` 命令该命令会自动创建相应的存储池

```bash
[root@ceph1 ~]# ceph fs volume create myfs --placement=3
```

这样 ceph 编排器会自动创建和配置 MDS

可以查看一下编排服务
```bash
[root@ceph1 ~]# ceph orch ls
NAME                       PORTS        RUNNING  REFRESHED  AGE   PLACEMENT
alertmanager               ?:9093,9094      1/1  90s ago    4d    count:1
crash                                       3/3  9m ago     4d    *
grafana                    ?:3000           1/1  90s ago    4d    count:1
mds.myfs                                    2/2  92s ago    100s  count:2
mgr                                         2/2  92s ago    4d    count:2
mon                                         3/3  9m ago     2h    count:3
node-exporter              ?:9100           3/3  9m ago     4d    *
osd.all-available-devices                     3  9m ago     4d    *
prometheus                 ?:9095           1/1  90s ago    4d    count:1
```
可以看到，多了一个 `mds.myfs` 的容器服务

再次查看一下存储池的情况
```bash
[root@ceph1 ~]# ceph osd pool ls
device_health_metrics
cephfs.myfs.meta
cephfs.myfs.data
```
可以看到，多了两个，`cephfs.myfs.meta` 和 `cephfs.myfs.data`

也可以 `ceph fs ls` 查看一下
```bash
[root@ceph1 ~]# ceph fs ls
name: myfs, metadata pool: cephfs.myfs.meta, data pools: [cephfs.myfs.data ]
```

方法 2

手工创建 osd 存储池并创建 CephFS 服务

```bash
[root@ceph1 ~]# ceph osd pool create myfs_data 32
[root@ceph1 ~]# ceph osd pool create myfs_metadata 32
[root@ceph1 ~]# ceph fs new myfs myfs_metadata myfs_data
[root@ceph1 ~]# ceph orch apply mds myfs --placement=3
```

如果想删除存储池，需要先设置如下参数 `mon_allow_pool_delete`
```bash
[root@ceph1 ~]# ceph config set mon mon_allow_pool_delete true
```

删除命令如下，注意 `--yes-i-really-mean-it` 参数一定要加
```bash
[root@ceph1 ~]# ceph fs volume rm myfs --yes-i-really-mean-it
metadata pool: cephfs.myfs.meta data pool: ['cephfs.myfs.data'] removed
```

#### 新建存储池

启动 nfs 服务
```bash
[ceph root@ceph1 /] ceph mgr module enable nfs
module 'nfs' is already enabled
```
可以看到 nfs 模块默认是启用的。

创建 NFS 所需的存储池。
```bash
[root@ceph1 ~]# ceph osd pool create mynfs_data
```

如果想删除存储池，默认是不允许的，需要先设置一个参数 `mon_allow_pool_delete`，本处再介绍一种方式：

```bash
[root@ceph1 ~]# ceph tell mon.* injectargs --mon_allow_pool_delete true
mon.ceph1: {}
mon.ceph1: mon_allow_pool_delete = 'true'
mon.ceph2: {}
mon.ceph2: mon_allow_pool_delete = 'true'
mon.ceph3: {}
mon.ceph3: mon_allow_pool_delete = 'true'
```

之后删除

```bash
[root@ceph1 ceph]# ceph osd pool delete ganesha_data ganesha_data --yes-i-really-really-mean-it
pool 'ganesha_data' removed
[root@ceph1 ceph]# ceph osd pool delete .nfs .nfs --yes-i-really-really-mean-it
pool '.nfs' removed
```

#### 在存储池上开启 nfs 应用
```bash
[root@ceph1 ~]# ceph osd pool application enable mynfs_data nfs
```

#### 新建 NFS 集群

创建集群, 使用 `ceph nfs cluster create` 命令
```bash
[root@ceph1 ~]# ceph nfs cluster create mynfs 3 --ingress --virtual_ip 192.168.56.200
```
> `注意`  
> 本例使用了 `--ingress` 参数，目前 ingress 的高可用还没有完全完成，等到 `Ceph Quincy` 发布才支持

这个命令会新建两个编排服务 `ingress.nfs.mynfs` 和 `nfs.mynfs`

查看一下
```bash
[root@ceph1 ~]# ceph nfs cluster ls
```

修改配置，可以先导出 yaml 格式
```bash
ceph orch ls --service-name nfs.mynfs --export > nfs.mynfs.yaml
```

如果想删除 NFS 集群，以下两种方法：

方法 1

使用 `ceph nfs cluster rm <cluster_id>` 命令
```bash
ceph nfs cluster rm mynfs
```

方法 2

使用 `ceph orch rm` 删除
```bash
[root@ceph1 ~]# ceph orch rm ingress.nfs.mynfs
Removed service ingress.nfs.mynfs
[root@ceph1 ~]# ceph orch rm nfs.mynfs
Removed service nfs.mynfs
```

#### 新建 CephFS 的 nfs 导出
```bash
[root@ceph1 ~]# ceph nfs export create cephfs --cluster-id mynfs --pseudo-path /data --fsname myfs --squash no_root_squash
```

查看 nfs 信息
```bash
[root@ceph1 ~]# ceph nfs export info mynfs /data
```

也可以在 Ceph Dashboard 中新建 NFS，但在 Dashboard 中和 CLI 中的新建的，查看最后参数不一样，Dashboard 的多一些。

#### 客户端配置
参考 [NFS MOUNTING][3]

> `注意`  
> 只支持 NFS v4.0+ 的协议

挂载的命令
```bash
mount -t nfs -o nfsvers=4.1,proto=tcp <ganesha-host-name>:<ganesha-pseudo-path> <mount-point>
```

本例如下：
```bash
[root@cephclient1 ~]# mount -t nfs 192.168.56.200:/data /mnt
```

这样客户端就将存储中的 /data 挂载到了本地 /mnt 目录

卸掉挂载
```bash
[root@cephclient1 ~]# umount /mnt
```

## 结束语
本例演示使用 cephadm 进行 Ceph 分布式存储集群的安装，并且演示了 NFS 的部署过程

## 参考资料
[RedHat Ceph Storage 5 操作指南][1]  
[Cephadm全功能安装Ceph pacific][4]

[1]: https://access.redhat.com/documentation/zh-cn/red_hat_ceph_storage/5/html/operations_guide/index  
[2]: https://docs.ceph.com/en/pacific/mgr/nfs/#nfs-cluster-management  
[3]: https://docs.ceph.com/en/pacific/mgr/nfs/#mounting  
[4]: https://blog.51cto.com/renlixing/3134294  