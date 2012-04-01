---
layout: post
title: 使用Git, Jekyll和GitHub Pages搭建blog
category: tutorial
tags: [git, jekyll, github pages]
---

![github pages][0]

#### 简介
Jekyll是一个简单的，博客感知，静态站点生成器。原文如下：  
Jekyll is a simple, blog aware, static site generator. It takes a template directory (representing the raw form of a website), runs it through Textile or Markdown and Liquid converters, and spits out a complete, static website suitable for serving with Apache or your favorite web server. This is also the engine behind [GitHub Pages][2], which you can use to host your project’s page or blog right here from GitHub.  

#### 安装
本文以CentOS 6.2为例进行安装:  
安装gcc, make和git
    $ yum install gcc make git
安装ruby, ruby-devel和rubygems
    $ yum install ruby ruby-devel rubygems
安装jekyll
    $ gem install jekyll
我安装的版本如下
    $ ruby --version
    ruby 1.8.7 (2011-06-30 patchlevel 352) [x86_64-linux]
    $ gem --version
    1.3.7
    $ jekyll --version
    Jekyll 0.11.2

#### GitHub Pages服务
GitHub 为每一个用户分配了一个二级域名&lt;user-id&gt;.github.com，用户为自己的二级域名创建主页很容易，只要在托管空间下创建一个名为&lt;user-id&gt;.github.com的版本库，向其master分支提交网站静态页面即可，其中网站首页为index.html。下面以**foo**用户为例，如果您使用，请替换**foo**为您自己的&lt;user-id&gt;。 
    $ mkdir ~/foo.github.com
    $ cd ~/foo.github.com
    $ printf "<h1>It works!</h1>" > index.html
Jekyll本地测试
    $ jekyll --server
访问**http://localhost:4000**查看效果。之后是一系列git的创建和提交到github过程。关于github相关操作，请参考[Github Help][8]。
    $ cd ~/foo.github.com
    $ git init
    $ git add index.html
    $ git commit -m "init project"
    $ git remote add origin git@github.com:foo/foo.github.com.git
    $ git push -u origin master
最多等待10分钟，GitHub就可以完成新网站的部署。网站完成部署后版本库的所有者会收到邮件通知。还有要注意访问用户二级域名的主页要使用HTTP协议非HTTPS协议。  

访问**http://&lt;user-id&gt;.github.com**查看效果。

#### 注意事项
GitHub Pages不支持jekyll的插件。  
如果有的特性想使用\_plugins，最好配置\_config.yml
    safe: false
然后在本地生成静态文件，再trace到github。

#### 其他支持（本站为例）
样式使用Twitter Bootstrap:<http://twitter.github.com/bootstrap>，之后改一下。  
评论使用DISQUS:<http://disqus.com>  
代码高亮使用Google Prettify<http://code.google.com/p/google-code-prettify/>  

#### 参考资料
[GitHub Pages服务说明][2]  
[Jekyll Wiki][3]  
[Markdown标记语言参考][4]  
[Liquid的参考资料][7]


[0]: http://pages.github.com/logo_pages.png "github pages"
[1]: http://git-scm.com
[2]: https://pages.github.com
[3]: https://github.com/mojombo/jekyll
[4]: http://daringfireball.net/projects/markdown/
[5]: http://disqus.com
[6]: https://github.com/plusjade/jekyll-bootstrap
[7]: https://github.com/Shopify/liquid/wiki/Liquid-for-Designers
[8]: http://help.github.com
