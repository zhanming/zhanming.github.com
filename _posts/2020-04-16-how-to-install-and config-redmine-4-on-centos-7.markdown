---
layout: post
title: CentOS 7 安装 Redmine 4.1
categories: [Linux]
tags: [centos, redmine]
summary: CentOS 7 安装 Redmine 4.1，记录一下安装和配置过程。
---
## 前言
CentOS 7 安装 Redmine 4.1，记录一下安装和配置过程。

主要安装过程 [Redmine官网][1] 已经有描述，本次记录一下实际步骤。

### 环境说明
CentOS 7（Minimal Install）

```terminal
# cat /etc/centos-release
CentOS Linux release 7.6.1810 (Core)
```

本次安装范围

* Ruby 2.6
* MySQL 5.7
* Redmine 4.1.1

## 安装 Ruby

CentOS 7 默认的 Ruby 版本为 Ruby 2.0, 但是根据 [Installing Redmine][1] 说明，Remine 4.1 要求最低版本为 2.3 以上，因此不能使用 CentOS 7 默认的版本。

本例安装 RVM，再通过 RVM 安装 Ruby 2.6

如果系统已经安装了 Ruby，请先删除系统已安装的 Ruby

```terminal
$ sudo yum remove ruby
```

### 安装 RVM

RVM 的安装，参考 [RVM 官网][2]，

> *注意*, 使用 root 用户安装

切换到 root 用户

```terminal
$ su root -
```

使用如下命令安装 RVM

```terminal
# curl -sSL https://rvm.io/mpapis.asc | gpg2 --import -
# curl -sSL https://rvm.io/pkuczynski.asc | gpg2 --import -
# curl -L get.rvm.io | bash -s stable
...
...
GPG verified '/usr/local/rvm/archives/rvm-1.29.10.tgz'
Creating group 'rvm'
Installing RVM to /usr/local/rvm/
Installation of RVM in /usr/local/rvm/ is almost complete:

  * First you need to add all users that will be using rvm to 'rvm' group,
    and logout - login again, anyone using rvm will be operating with `umask u=rwx,g=rwx,o=rx`.

  * To start using RVM you need to run `source /etc/profile.d/rvm.sh`
    in all your open shell windows, in rare cases you need to reopen all shell windows.
  * Please do NOT forget to add your users to the rvm group.
     The installer no longer auto-adds root or users to the rvm group. Admins must do this.
     Also, please note that group memberships are ONLY evaluated at login time.
     This means that users must log out then back in before group membership takes effect!
Thanks for installing RVM 🙏
Please consider donating to our open collective to help us maintain RVM.

👉  Donate: https://opencollective.com/rvm/donate
```

可以看到 rvm 需要将用户添加到 rvm 用户组中，本例将 admin 用户添加到 rvm 用户组中

```terminal
# gpasswd -a admin rvm
Adding user admin to group rvm
```

查看一下

```terminal
# id admin
uid=1000(admin) gid=1000(admin) groups=1000(admin),10(wheel),1001(rvm)
```

然后需要退出，重新登录。使用如下命令加载 RVM 环境

```terminal
$ source /etc/profile.d/rvm.sh
$ rvm reload
```

加载之后，使用如下命令校验依赖项，该命令会缺失的依赖。

```terminal
$ rvm requirements run
Checking requirements for centos.
Installing requirements for centos.
Installing required packages: patch, autoconf, automake, bison, bzip2, gcc-c++, libffi-devel, libtool, patch, readline-devel, ruby, sqlite-devel, zlib-devel, glibc-headers, glibc-devel, openssl-devel..admin password required for 'yum install -y patch autoconf automake bison bzip2 gcc-c++ libffi-devel libtool patch readline-devel ruby sqlite-devel zlib-devel glibc-headers glibc-devel openssl-devel': # 输入 admin 的密码
...............................................
Requirements installation successful.
```

### 安装 Ruby

安装好 RVM 之后，系统可以安装 Ruby 了，通过如下命令查看可用的 Ruby 版本

```terminal
$ rvm list known
```

然后，安装想要的版本，本例以安装 2.6 为例

```terminal
$ sudo rvm install 2.6
```

### 设置默认 Ruby 版本

案后先查看当前已经安装的版本

```terminal
$ rvm list
=* ruby-2.6.5 [ x86_64 ]

# => - current
# =* - current && default
#  * - default
```

可以看到 `=*` 表示当前的版本和默认的版本，因为本例只安装了一个 Ruby，所以默认的就是 2.6。

如果有多个版本，通过如下命令，设置默认 Ruby 版本

```terminal
$ rvm use 2.6 --default
Using /usr/local/rvm/gems/ruby-2.6.3
```

通过如下命令查看一下

```terminal
$ ruby --version
ruby 2.6.5p114 (2019-10-01 revision 67812) [x86_64-linux]
```

## MySQL

### 安装 MySQL

MySQL 的安装，请参考 [CentOS 7 下 Yum 安装 MySQL 5.7][3]

本例只演示安装 Redmine 所需的数据库操作

### 配置数据库

创建 redmine 用户和数据库，并分配权限，请替换 `my_password` 为您自己的密码。

```terminal
$ mysql -u root -p
mysql> CREATE DATABASE redmine CHARACTER SET utf8mb4;
mysql> CREATE USER 'redmine'@'localhost' IDENTIFIED BY 'my_password';
mysql> GRANT ALL PRIVILEGES ON redmine.* TO 'redmine'@'localhost';
mysql> exit
```

### 升级准备（可选）

如果您以前使用过 Redmine，需要升级，请先从原来的数据库导出 redmine 的数据库，再导入本数据库

原数据库导出

```terminal
$ mysqldump -u root -p redmine > redmine.sql
```

将数据库备份文件上传到服务器后，导入数据库使用如下命令

```terminal
$ mysql -u root -p --default-character-set=utf8 redmine < redmine.sql
```

如果您希望使用其他数据库，请参考 [Installing Redmine][1]

## Redmine

### 安装依赖包

```terminal
$ sudo yum install mysql-devel libcurl-devel ImageMagick ImageMagick-devel
```

### 安装 Redmine

下载安装包

```terminal
$ curl -LO http://www.redmine.org/releases/redmine-4.1.1.tar.gz
```

解压到 `/opt` 文件夹

```terminal
$ sudo tar -zxvf redmine-4.1.1.tar.gz -C /opt/
```

创建软连接

```
$ cd /opt/
$ sudo ln -s /opt/redmine-4.0.4 /opt/redmine
```

### 配置数据库参数

修改 `database.yml` 文件

```terminal
# cd /opt/redmine/config
# cp database.yml.example  database.yml
# vi database.yml
```

使用 MySQL 数据库配置，设置如下内容，注意替换 `my_password` 为您的密码

```terminal
production:
  adapter: mysql2
  database: redmine
  host: localhost
  username: redmine
  password: "my_password" 
```

### 依赖安装

Redmine 使用 `Bundler` 管理 gems 依赖 

首先安装 Bundler

```terminal
$ cd /opt/redmine
$ sudo gem install bundler
```

接下来，安装依赖

```terminal
$ sudo bundle install --without development test
```

设置密钥

```terminal
$ sudo bundle exec rake generate_secret_token
```

### 创建数据库 Schema

创建数据库，包括升级数据库

```terminal
$ sudo bundle exec rake db:migrate RAILS_ENV=production
```


### 升级（可选）

升级插件数据库

```terminal
$ sudo bundle exec rake redmine:plugins:migrate RAILS_ENV=production
```

附件拷贝

使用老版本的 redmine 系统，如果使用过程中上传了附件，需要拷贝一下，默认目录 `$REDMINE_HOME\files`

```terminal
$ cd /opt/redmine/files
```

将以前的 redline 附件拷贝到这个文件夹中，过程省略，请自行搜索文件拷贝相关命令如 `scp`。

### 初始化数据库

创建完数据库之后，需要初始化数据

> 注意，如果是升级，可以不用执行此步骤

```terminal
$ sudo bundle exec rake redmine:load_default_data RAILS_ENV=production
```

### 测试安装

安装后，需要测试一下，使用 `webrick`

```terminal
$ sudo bundle exec rails server webrick -e production
```

启动之后，访问 `http://ip:3000` 即可访问。

## 其他设置

### 邮箱设置

参考官方文档 [Email Configuration][4]

注意 Redmine 4 开始，不需要使用 `async_smtp` 即可异步发送邮件。

### 代理设置

本例使用 Nginx + Passenger 为例

```terminal
$ sudo gem install passenger
```

安装完之后，安装 Nginx 的配置模块

```terminal
$ rvmsudo passenger-install-nginx-module
```

按照安装步骤进行，默认会将 Nginx 安装到 `/opt/nginx` 目录内

#### 配置 Nginx

```terminal
$ cd /opt/nginx/conf
$ sudo vi nginx.conf
```

如果想使用根目录 `http://ip` 访问，类似如下设置

```terminal
http {
    # passenger 配置
    passenger_root /usr/local/rvm/gems/ruby-2.6.5/gems/passenger-6.0.4;
    passenger_ruby /usr/local/rvm/gems/ruby-2.6.5/wrappers/ruby;

    ...
    ...

    server {
        listen       80;
        server_name  localhost;
        # 跟目录的 passenger  配置
        root /opt/redmine/public;
        passenger_enabled on;
   
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

如果想使用 Sub-URI  `http://domain/redmine` 访问，类似如下配置

```terminal
http {
    # passenger 配置
    passenger_root /usr/local/rvm/gems/ruby-2.6.5/gems/passenger-6.0.4;
    passenger_ruby /usr/local/rvm/gems/ruby-2.6.5/wrappers/ruby;

    ...
    ...

    server {
        listen       80;
        server_name  localhost;
        passenger_enabled on;
        
        location / {
            root   html;
        }
        
        # sub-uri 的 passenger 配置
        location ~ ^/redmine(/.*|$) {
            alias /opt/redmine/public$1;
            passenger_base_uri /redmine;
            passenger_app_root /opt/redmine;
            passenger_document_root /opt/redmine/public;
            passenger_enabled on;
        }
        
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }
    }
}
```

设置 nginx 开机启动

```terminal
$ sudo systemctl enable nginx
```

启动 nginx

```terminal
$ sudo systemctl start nginx
```

此时可以查看 `http://ip/redmine`

## 结束语

本例演示了 Redmine 安装和配置的基本过程，主要使用 rvm 进行 ruby 安装。


## 参考资料
[Installing Redmine][1]  
[Ruby Version Manager (RVM)][2]  
[CentOS 7 下 Yum 安装 MySQL 5.7][3]  
[Email Configuration][4]  
[How to Install Redmine 3 with Nginx on CentOS 7][5]  

[1]: https://www.redmine.org/projects/redmine/wiki/RedmineInstall
[2]: https://rvm.io/
[3]: {{ site.baseurl }}{% post_url 2017-05-10-how-to-yum-install-mysql-57-on-centos-7 %}  　
[4]: https://www.redmine.org/projects/redmine/wiki/EmailConfiguration
[5]: https://www.howtoforge.com/tutorial/how-to-install-redmine-3-with-nginx-on-centos-7/

