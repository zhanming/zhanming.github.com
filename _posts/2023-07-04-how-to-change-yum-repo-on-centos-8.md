---

layout: post
title: CentOS 8 更改 yum 源 
categories: [Linux]
tags: [centos, linux]
summary: CentOS 8（非 Stream 版）已提前进入 EOL 停止服务阶段，因此镜像已被官方移动，需要更改 yum 源来方便软件安装。

---

## 前言

CentOS 8（非 Stream 版）已提前进入 EOL 停止服务阶段，因此镜像已被官方移动，需要更改 yum 源来方便软件安装。

CentOS 8.5 以后，进入 EOL，一般需要变更为 CentOS-Vault 源。

### 环境说明

CentOS 8（Minimal Install）

```bash
# cat /etc/system-release
CentOS Linux release 8.1.1911 (Core)
```

## 步骤

本例使用国内 CentOS 的镜像站，其他镜像的方法基本都一样。

本文以清华大学开源软件镜像站和阿里云开发者社区的 CentOS 镜像为例介绍

### 清华大学开源软件镜像站

参考 [清华大学开源软件镜像站 - CentOS Vault 软件仓库镜像使用帮助][1]

执行如下替换命令

```terminal
# CentOS 8 之后
$ minorver=8.5.2111
$ sudo sed -e "s|^mirrorlist=|#mirrorlist=|g" \
         -e "s|^#baseurl=http://mirror.centos.org/\$contentdir/\$releasever|baseurl=https://mirrors.tuna.tsinghua.edu.cn/centos-vault/$minorver|g" \
         -i.bak \
         /etc/yum.repos.d/CentOS-*.repo
```

这会将 CentOS-*.repo 仓库文件备份为 CentOS-*.repo.bak 文件，并且将软件仓库的 baseurl 更改。

注意，如果需要启用其中一些 repo，需要将其中的 `enabled=0` 改为 `enabled=1`。

修改对象的安全上下文，使用如下命令

```terminal
$ sudo chcon -u system_u CentOS-*.repo
```

最后更新一下本地缓存

```terminal
$ sudo yum makecache
```

### 阿里云开发者社区 CentOS 镜像

参考 [阿里云 - 开发者社区 - CentOS 镜像][2]

更改到软件源目录

```terminal
$ cd /etc/yum.repos.d/
```

先备份一下当前的 yum 源配置

```terminal
$ sudo mkdir backup
```

将当前目录的源配置拷贝到 backup 目录

```terminal
$ sudo mv CentOS-*.repo backup/
```

之后下载阿里云的 CentOS 镜像配置到本地

```terminal
$ sudo curl -o CentOS-Base.repo https://mirrors.aliyun.com/repo/Centos-vault-8.5.2111.repo
```

修改对象的安全上下文，使用如下命令

```terminal
$ sudo chcon -u system_u CentOS-Base.repo
```

最后更新一下本地缓存

```terminal
$ sudo yum makecache
```

## 参考资料

[清华大学开源软件镜像站 - CentOS Vault 软件仓库镜像使用帮助][1]  
[阿里云 - 开发者社区 - CentOS 镜像][2]  

[1]: https://mirrors4.tuna.tsinghua.edu.cn/help/centos-vault/  
[2]: https://developer.aliyun.com/mirror/centos/  