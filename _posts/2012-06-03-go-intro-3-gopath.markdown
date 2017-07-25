---
layout: post
title: Go 语言介绍 - 3：GOPATH
categories: [Go]
tags: [go, centos]
summary: Go 语言的 [GOPATH Wiki](http://code.google.com/p/go-wiki/wiki/GOPATH) 中介绍了 GOPATH 这个环境变量的用法，本文半翻译，半举例一下。
---

***适用范围***: [go1, go1.0.3]

## 简介
Go 语言的 [GOPATH Wiki](http://code.google.com/p/go-wiki/wiki/GOPATH) 中介绍了 GOPATH 这个环境变量的用法，本文半翻译，半举例一下。

原文如下：  
The GOPATH environment variable is used to specify directories outside of `$GOROOT` that contain the source for Go projects and their binaries.

### 介绍

GOPATH 环境变量是用来指定在 `$GOROOT` 之外的，包含到项目和他们的二进制文件的源目录。

GOPATH 用于 goinstall 和" go 工具"，如二进制的目的地，搜索 imports 的地址。

GOPATH 是一个路径列表 - 指定多个目录可以由一个“：”分开（OS X 或 Linux）或“;”（在 Windows 上）。当多个目录列出，goinstall 或" go 工具"以外的任何地方使用，第一个目录作为安装目标。当在 GOPATH 的路径列表内使用这两种工具，包含目录作为安装目标。

对于本文档的大部分内容，`$GOPATH` 将指向路径列表中当前活动的一个。

##### 举例
本例使用 CentOS 6.2 进行举例。  
设置 GOROOT (使用全局设置)

```terminal
# vi /etc/profile.d/go.sh
```

在 go.sh 中加入 GOROOT 变量

```shell
export GOROOT=/usr/local/go
export PATH=$PATH:$GOROOT/bin
```

使之生效

```terminal
source /etc/profile
```

编辑当前用户的环境变量（.bashrc）

```terminal
$ vi ~/.bashrc
```

设置 GOPATH

```shell
export GOPATH=$HOME/p/ext:$HOME/p/dev
```

使之生效

```terminal
$ source ~/.bashrc
```

此处设置了 GOPATH 为为两个目录(一个用于存放第三方的包，一个用于开发)，如果用"go工具"进行安装第三方包，如 [go-tour](http://code.google.com/p/go-tour/)

```terminal
go get code.google.com/p/go-tour/gotour
```

默认会安装到第一个目录（`$HOME/p/ext`）中.

如果在 `$HOME/p/dev` 中写代码，使用“go”工具(如 go install, go build 等）会将二进制包安装到 `$HOME/p/dev` 中

### 集成 GOPATH
在 OS X 或 Linux，加入下面的表达式将到 PATH 中，将会添加所有 `$GOPATH/bin` 目录。

```
${GOPATH//://bin:}/bin
```

添加如下语句块到标准 Go makefile 将引入所有的 `$GOPATH` 的 pkg 目录

```
GOPATHSEP=:
ifeq ($(GOHOSTOS),windows)
GOPATHSEP=;
endif
GCIMPORTS+=-I $(subst $(GOPATHSEP),/pkg/$(GOOS)_$(GOARCH) -I , $(GOPATH))/pkg/$(GOOS)_$(GOARCH)
LDIMPORTS+=-L $(subst $(GOPATHSEP),/pkg/$(GOOS)_$(GOARCH) -L , $(GOPATH))/pkg/$(GOOS)_$(GOARCH)
```

goinstall 命令和 "go" 命令工具，将会知道 GOPATH

### 目录布局
导入目录为 `X/Y/Z` 的包的源文件将在目录

```
$GOPATH/src/X/Y/Z
```

导入目录为 `X/Y/Z` 的包的二进制文件在

```
$GOPATH/pkg/$GOOS_$GOARCH/X/Y/Z.a
```

源文件位于 `$GOPATH/src/A/B` 的命令的二进制文件在

```
$GOPATH/bin/B
```

### 仓库集成和创建 "goinstallable" 项目
goinstall, 当获取一个包，根据包的导入路径去发现 URL，举例，如果尝试

```terminal
goinstall code.google.com/p/gomatrix/matrix
```

goinstall 将从 `http://code.google.com/p/gomatrix` 取得源代码，并且它将克隆到仓库

```
$GOPATH/src/code.google.com/p/gomatrix
```

作为结果，如果（从你仓库的项目中）导入的包是从相同的仓库，需要使用“全路径” - 在 goinstall 后。在这个例子里，如果想导入"matrix"包，应该是这样写 "code.google.com/p/gomatrix/matrix"，而不是 "matrix"

```go
import "code.google.com/p/gomatrix/matrix"
```

如果你喜欢使用 makefiles 在你自己的机器上构建，并且你仍然想你的项目与 goinstall 一起工作，设置 TARG 变量到 import 路径。 goinstall 将忽略这个 makefile，但是只要 TARG 匹配到了包的相对路径， goinstall 将选择相同的 import 路径。

## 技巧和窍门

### 第三方包
GOPATH 设置两个条目是很有用的。第一个是路径为第三方包存放的位置，第二个为你自己的项目。将第三方的 GOPATH 放到第一位，这样 goinstall 将使用它作为默认的目的地。然后你可以在第二个 GOPATH 目录下工作，并且可以使用"go"命令，goinstall,或者一个 GOPATH 包含的第三方的构建工具（如 [gb](http://code.google.com/p/go-gb)）来导入所有你使用的包。
### 举例
如上例中设置了两个目录每个目录的结构都是这样的

    .
    `--p
       |--ext
       |  |--bin # 命令目录
       |  |--pkg # 包目录
       |  |  `--linux_amd64
       |  |     `--github.com 
       |  `--src # 源码目录
       |     `--github.com 
       |        `--... # 源码子目录
       `--dev
          |--bin
          |--pkg
          `--src
    
## FAQ

**为什么 `$GOPATH/src/cmd/mycmd/*.go` 没有编译?**  
当 go 命令搜索包时，它总是第一个从$GOROOT开始。这包含了目录，所以如果它在 `$GOROOT` 中发现（如上面这个例子）一个 `cmd/` 目录，它将不会去其他GOPATH目录中查找。这防止你自定义自己的 `math/matrix` 包以及自己的 `cmd/mycmd` 命令。

## 参考
[GOPATH Wiki](http://code.google.com/p/go-wiki/wiki/GOPATH)

