---
layout: post
title: Go的Vim的高亮和自动补齐
categories: [Go]
tags: [go, centos]
---

***适用范围***: [go1, go1.0.3], ***更新日期***: 2013-03-14

#### 简介

The standard Go distribution includes a Go syntax file for Vim in go/misc/vim/.

#### 配置高亮
    $ mkdir ～/.vim
    $ cp -r $GOROOT/misc/vim/* ~/.vim/

#### 配置自动补齐
编辑本用户的环境变量
    $ vi ~/.bashrc
设置GOPATH并将GOPATH的bin目录添加到到`PATH`中，这样gocode可以探测到，并进行补齐提示。
<pre class="prettyprint linenums">
# User specific aliases and functions
export GOPATH=$HOME/go/ext:$HOME/go/dev
export PATH=$PATH:$HOME/go/ext/bin:$HOME/go/dev/bin
</pre>
使之生效
    $ source ~/.bashrc
安装gocode
    $ go get -u github.com/nsf/gocode
    $ cd ~/go/ext/src/github.com/nsf/gocode/vim
    $ ./update.bash
编辑用户的vim配置文件(CentOS的vim配置默认在`/etc/vimrc`文件中，可以自己新建一个)
    $ vi ~/.vimrc
添加如下内容
<pre class="prettyprint linenums">
filetype plugin on
syntax on
</pre>
至此，补齐功能完成，使用vim编辑时，使用<C-x> <C-o>进行自动补齐。  
当然Vim的其他配置看个人喜好，比如缩进，行号显示等。  
如下面的例子
<pre class="prettyprint linenums">
"" 行号
set nu
"" 自动缩进
set autoindent
"" 设置软制表符宽度为4
set tabstop=4
set softtabstop=4
"" 设置缩进的空格书为4
set shiftwidth=4
"" 自动补齐括号
inoremap ( ()<LEFT>
inoremap [ []<LEFT>
inoremap { {}<LEFT>
"" go programming language setting
filetype plugin on
syntax on
au BufRead,BufNewFile *.go set filetype=go
</pre>

#### 参考资料
[gocode at github][1]  
[Asta谢的书：1.4Go开发工具][2]

[1]: https://github.com/nsf/gocode
[2]: https://github.com/astaxie/build-web-application-with-golang/blob/master/01.4.md
