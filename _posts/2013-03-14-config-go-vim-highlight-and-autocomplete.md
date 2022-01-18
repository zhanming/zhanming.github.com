---
layout: post
title: Go 的 Vim 的高亮和自动补齐
categories: [Go]
tags: [go, centos]
summary: 参考 [Asta 谢的书：1.4 Go 开发工具][2] 进行配置如下。
---

***适用范围***: [go1, go1.0.3]

## 简介

The standard Go distribution includes a Go syntax file for Vim in go/misc/vim/.  
参考 [Asta 谢的书：1.4 Go 开发工具][2] 进行配置如下。

### 配置高亮

```terminal
$ mkdir ～/.vim
$ cp -r $GOROOT/misc/vim/* ~/.vim/
```

### 配置自动补齐
编辑本用户的环境变量

```terminal
$ vi ~/.bashrc
```

设置 GOPATH 并将 GOPATH 的 bin 目录添加到到 `PATH` 中，这样 gocode 可以探测到，并进行补齐提示。

```shell
# User specific aliases and functions
export GOPATH=$HOME/go/ext:$HOME/go/dev
export PATH=$PATH:$HOME/go/ext/bin:$HOME/go/dev/bin
```

使之生效

```terminal
$ source ~/.bashrc
```

安装 gocode

```terminal
$ go get -u github.com/nsf/gocode
$ cd ~/go/ext/src/github.com/nsf/gocode/vim
$ ./update.bash
```

编辑用户的 vim 配置文件(CentOS 的 vim 配置默认在 `/etc/vimrc` 文件中，可以自己新建一个)

```terminal
$ vi ~/.vimrc
```

添加如下内容

```conf
filetype plugin on
syntax on
```

至此，补齐功能完成，使用 vim 编辑时，使用 <C-x> <C-o> 进行自动补齐。  
当然 Vim 的其他配置看个人喜好，比如缩进，行号显示等。  
如下面的例子

```conf
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
```

## 参考资料
[gocode at github][1]  
[Asta 谢的书：1.4 Go 开发工具][2]

[1]: https://github.com/nsf/gocode
[2]: https://github.com/astaxie/build-web-application-with-golang/blob/master/ebook/01.4.md
