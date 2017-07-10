---
layout: post
title: CentOS 7 使用 rvm 安装 ruby 搭建 jekyll 环境
categories: [Linux]
tags: [centos, rvm, ruby, jekyll]
summary: CentOS 7 使用 rvm 安装 ruby 搭建 jekyll 环境，记录一下大致的安装和配置过程。
---
## 前言

CentOS 7 使用 rvm 安装 ruby 搭建 Jeklly 环境，记录一下大致的安装和配置过程。

上一篇 CentOS 6 搭建 jekyll 环境的记录：[使用 Git, Jekyll 和 GitHub Pages 搭建 blog][1], 在 2016-02-02 时（很早了，汗）GitHub Pages 升级 jekyll 为 3.0 版本，本次更新一下，使用 CentOS 7 搭建，总体一致，细节稍微变化一点。  

## 环境说明
CentOS 7（Minimal Install）

### 更新系统

```terminal
$ sudo yum update
```

版本如下

```terminal
$ cat /etc/redhat-release
CentOS Linux release 7.3.1611 (Core)
```

## 安装和配置

### 安装 rvm 管理 ruby
本例使用 rmv 进行 ruby 的安装，可以快捷的切换 ruby 环境。具体可以去  [rvm.io][2] 查看。

```terminal
$ gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3
$ \curl -sSL https://get.rvm.io | bash -s stable
```

载入 rvm 环境

```terminal
$ source ~/.rvm/scripts/rvm
```

安装之后检查一下

```terminal
$ rvm -v
rvm 1.29.1 (latest) by Michal Papis, Piotr Kuczynski, Wayne E. Seguin [https://rvm.io/]
```

再用 rvm 安装 ruby (本例是，ruby 的稳定版本是 2.4.1，jekyll 是 3.4.3，也要求 ruby 2.0 版本已上)

```terminal
$ rvm install 2.4.1
```

rmv 会安装 ruby 的依赖，如 jekyll 依赖的 gcc make 等会 ruby 也是依赖的，会自动安装，rubygems 也会安装。

安装完成之后，设置默认 ruby 的版本

```terminal
$ rvm 2.4.1 --default
```

检查一下 ruby 的版本

```terminal
$ ruby -v
ruby 2.4.1p111 (2017-03-22 revision 58053) [x86_64-linux]
```

检查一下 gem 的版本

```terminal
$ gem -v
2.6.12
```

### 安装 jekyll
gem自带的源 <https://rubygems.org/> 如果不行，可以替换为国内 [Ruby China][3] 的镜像( 访问淘宝的镜像站点会看到：RubyGems 镜像的管理工作以后将交由 [Ruby China][3] 负责)

```terminal
$ gem source -a https://gems.ruby-china.org --remove https://rubygems.org/
```

查看源列表(本例使用时，<https://rubygems.org/> 是可以使用的，就没有更改)

```terminal
$ gem sources -l
*** CURRENT SOURCES ***
	
https://rubygems.org/
```

安装 jekyll, 比较好的方式是同时安装 bundler，可以管理依赖。

```
$ gem install jekyll bundler
```

安装完后，再确认一下版本

```terminal
$ jekyll -v
jekyll 3.4.3

$ bundle -v
Bundler version 1.15.0
```

新建项目，并测试，参考 <https://jekyllrb.com/> 首页的快速开始介绍

```terminal
~ $ jekyll new my-awesome-site
~ $ cd my-awesome-site
~/my-awesome-site $ bundle exec jekyll serve
# => Now browse to http://localhost:4000
```

## 结束语
本例只介绍 jekyll 的安装，关于 GitHub Pages 的使用，请参考 [使用 Git, Jekyll 和 GitHub Pages 搭建 blog][1]

## 参考资料
[使用 Git, Jekyll 和 GitHub Pages 搭建 blog][1]  
[Ruby Version Manager (RVM)][2]  
[在centos虚拟机中jekyll的环境搭建][3]

[1]: http://qizhanming.com/blog/2012/03/29/using-git-jekyll-githubpages-build-blog
[2]: https://rvm.io
[3]: http://www.jianshu.com/p/792238859c6f
[4]: http://ruby-china.org/
