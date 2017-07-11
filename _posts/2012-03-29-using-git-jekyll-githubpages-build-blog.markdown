---
layout: post
title: 使用 Git, Jekyll 和 GitHub Pages 搭建 blog
categories: [Tutorial]
tags: [git, jekyll, github pages]
summary: Jekyll 是一个简单的，博客感知，静态站点生成器。
---

## 简介
Jekyll 是一个简单的，博客感知，静态站点生成器。

原文如下：  
Jekyll is a simple, blog aware, static site generator. It takes a template directory (representing the raw form of a website), runs it through Textile or Markdown and Liquid converters, and spits out a complete, static website suitable for serving with Apache or your favorite web server. This is also the engine behind [GitHub Pages](http://pages.github.com), which you can use to host your project’s page or blog right here from GitHub.  

## 安装
本文以 CentOS 6.2 为例进行安装:  
安装 gcc, make 和 git

```terminal
# yum install gcc make git
```

安装 ruby, ruby-devel 和 rubygems

```terminal
# yum install ruby ruby-devel rubygems
```
安装 jekyll

```terminal
# gem install jekyll
```
我安装的版本如下

```terminal
$ ruby --version
ruby 1.8.7 (2011-06-30 patchlevel 352) [x86_64-linux]
$ gem --version
1.3.7
$ jekyll --version
Jekyll 0.11.2
```

## GitHub Pages 服务
GitHub 为每一个用户分配了一个二级域名 &lt;user-id&gt;.github.com，用户为自己的二级域名创建主页很容易，只要在托管空间下创建一个名为 &lt;user-id&gt;.github.com 的版本库，向其 master 分支提交网站静态页面即可，其中网站首页为 index.html 。下面以 `foo` 用户为例，如果您使用，请替换 `foo` 为您自己的 &lt;user-id&gt;。 

```terminal
$ mkdir ~/foo.github.com
$ cd ~/foo.github.com
$ printf "<h1>It works!</h1>" > index.html
```

Jekyll 本地测试

```terminal
$ jekyll --server
```

访问 `http://localhost:4000` 查看效果。之后是一系列 git 的创建和提交到 github 过程。关于 github 相关操作，请参考 [Github Help](http://help.github.com)。

```terminal
$ cd ~/foo.github.com
$ git init
$ git add index.html
$ git commit -m "init project"
$ git remote add origin git@github.com:foo/foo.github.com.git
$ git push -u origin master
```

最多等待 10 分钟，GitHub 就可以完成新网站的部署。网站完成部署后版本库的所有者会收到邮件通知。还有要注意访问用户二级域名的主页要使用 HTTP 协议非 HTTPS 协议。  

访问 `http://<user-id>.github.com` 查看效果。

`注意事项`
GitHub Pages 不支持 jekyll 的插件。  
如果有的特性想使用 `\_plugins`，最好配置`\_config.yml`。

```conf
safe: false
```

然后在本地生成静态文件，再 trace 到 github。

### 其他（本站为例）
样式使用 [Twitter Bootstrap](http://twitter.github.com/bootstrap)，之后改一下。  
评论使用 [DISQUS](http://disqus.com)。  
代码高亮使用 [Google Prettify](http://code.google.com/p/google-code-prettify/)。

## 参考资料
[使用Github Pages建独立博客](http://beiyuu.com/github-pages/)，介绍得很详细。  
[GitHub Pages 服务说明](http://pages.github.com)  
[Jekyll Wiki](https://github.com/mojombo/jekyll)  
[Markdown 标记语言参考](http://daringfireball.net/projects/markdown/)  
[Liquid 的参考资料](https://github.com/Shopify/liquid/wiki/Liquid-for-Designers)

