---
layout: post
title: CentOS 7 下 Yum 安装 GitLab CE 8.16.6
categories: [Linux]
tags: [centos, gitlab, yum]
summary: GitLab CE 8.16.6 的安装，记录一下大致的安装和配置过程。
---
## 前言
CentOS 7 下 Yum 安装 GitLab CE 8.16.6 ，记录一下大致的安装和配置过程。

官方推荐 Omnibus Packages , 本文也使用这个，非常方便。

参考 [Download GitLab Community Edition (CE)][2], 中，[Chinese GitLab CE mirror hosted by TUNA][3], 使用清华大学开源软件镜像站的镜像。

注意: gitlab-ce 镜像仅支持 x86-64 架构

### 环境说明
CentOS 7

## 安装和配置步骤
1.配置 yum 源

新建 `/etc/yum.repos.d/gitlab-ce.repo` ，内容为

```conf
[gitlab-ce]
name=gitlab-ce
baseurl=http://mirrors.tuna.tsinghua.edu.cn/gitlab-ce/yum/el7
repo_gpgcheck=0
gpgcheck=0
enabled=1
gpgkey=https://packages.gitlab.com/gpg.key
```

2.安装

```terminal
$ sudo yum makecache
$ sudo yum install gitlab-ce
```

3.配置

```terminal
$ sudo gitlab-ctl reconfigure
```

此过程需要一段时间，安装各种包和服务。

安装后的配置文件目录：

主文件：`/etc/gitlab/`  
主目录：`/var/opt/gitlab/`  
日志目录：`/var/log/gitlab/`   

4.基本命令

```terminal
$ sudo gitlab-ctl status|start|stop|restart
```

5.使用

访问 `http://localhost/`。

如果其他机器访问，请打开防火墙 HTTP 服务，访问的IP地址输入正确。

6.备份和恢复

备份命令

```terminal
$ sudo gitlab-rake gitlab:backup:create
```

默认备份目录为 `/var/opt/gitlab/backups`  
定时备份需要写一下 crontab 。

```terminal
$ sudo su -  
$ crontab -e  
```

加入以下, 实现每天凌晨2点进行一次自动备份:

```conf
0 2 * * * /opt/gitlab/bin/gitlab-rake gitlab:backup:create
```

6.更新

注意：不要停止 gitlab，直接更新即可。  
比如 8.17.0 版本已经有了，或在 Admin Area 中可以看到 `update available` 或 `update ASAP`。

```terminal
$ sudo yum update gitlab-ce
```

安装更新会自动备份一次，并且 `reconfigure`。  如果一切顺利，在 Admin Area 看到 `up-to-date` 的字样。
如果还是有问题，可以尝试重启一下:

```terminal
$ sudo gitlab-ctl restart
```

## 参考资料
[gitlab 部署迁移升级][1]  
[Download GitLab Community Edition (CE)][2]  
[Gitlab Community Edition 镜像使用帮助][3]
 
[1]: http://runningyongboy.blog.51cto.com/8234857/1839330
[2]: https://about.gitlab.com/downloads/
[3]: https://mirror.tuna.tsinghua.edu.cn/help/gitlab-ce/
