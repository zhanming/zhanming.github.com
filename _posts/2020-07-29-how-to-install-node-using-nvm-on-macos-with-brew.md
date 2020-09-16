---
layout: post
title: macOS 上使用 brew 安装 NVM 管理 node.js 
categories: [Tutorial]
tags: [macos, nvm, node.js]
summary: node.js 使用 nvm 进行版本管理，比较方便，记录一下使用 brew 在 macOS 上的安装步骤。
---
## 前言
node.js 使用 nvm 进行版本管理，比较方便，记录一下使用 brew 在 macOS 上的安装步骤。

### 环境说明
macOS 10.15

```terminal
% sw_vers
ProductName:	Mac OS X
ProductVersion:	10.15.6
BuildVersion:	19G73
```

Brew 

```terminal
% brew --version
Homebrew 2.4.8
Homebrew/homebrew-core (git revision 820df; last commit 2020-07-27)
Homebrew/homebrew-cask (git revision 35ad13; last commit 2020-07-28)
```

## 安装

### 安装 nvm

使用 brew 安装比较方便，更新一下 Homebrew 并安装

```terminal
% brew update
% brew install nvm
...
...
...
You should create NVM's working directory if it doesn't exist:

  mkdir ~/.nvm

Add the following to ~/.zshrc or your desired shell
configuration file:

  export NVM_DIR="$HOME/.nvm"
  [ -s "/usr/local/opt/nvm/nvm.sh" ] && . "/usr/local/opt/nvm/nvm.sh"  # This loads nvm
  [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && . "/usr/local/opt/nvm/etc/bash_completion.d/nvm"  # This loads nvm bash_completion

You can set $NVM_DIR to any location, but leaving it unchanged from
/usr/local/opt/nvm will destroy any nvm-installed Node installations
upon upgrade/reinstall.

Type `nvm help` for further information.

Bash completion has been installed to:
  /usr/local/etc/bash_completion.d
==> Summary
🍺  /usr/local/Cellar/nvm/0.35.3: 7 files, 150.0KB, built in 2 seconds
```

根据提示，创建 `.nvm` 目录

```terminal
% mkdir ~/.nvm
```

编辑 `~/.zshrc` 配置文件

```terminal
% vi ~/.zshrc
```

在 `~/.zshrc` 配置文件后添加如下内容

```terminal
export NVM_DIR="$HOME/.nvm"
[ -s "/usr/local/opt/nvm/nvm.sh" ] && . "/usr/local/opt/nvm/nvm.sh"
[ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && . "/usr/local/opt/nvm/etc/bash_completion.d/nvm"
```

`:wq` 保存并退出。

使用 `source` 命令使配置生效

```terminal
% source ~/.zshrc
```

查看一下配置是否生效

```terminal
% echo $NVM_DIR
/Users/your-username/.nvm
```

查看帮助

```terminal
% nvm --help
...
...
Note:
  to remove, delete, or uninstall nvm - just remove the `$NVM_DIR` folder (usually `~/.nvm`)
```

帮助的最后一句话，可以看到删除 nvm 很简单，只要删除 `$NVM_DIR` 文件夹既可以

### 安装 node.js

查看 `node.js` 版本可以使用如下命令

```terminal
% nvm ls-remote
```

可以看到很多版本，接下来安装 LTS 版本

```terminal
% nvm install 12
Downloading and installing node v12.18.3...
...
Computing checksum with shasum -a 256
Checksums matched!
Now using node v12.18.3 (npm v6.14.6)
Creating default alias: default -> 12 (-> v12.18.3)
```

安装完之后，可以查看一下

```terminal
% nvm ls
->     v12.18.3
default -> 12 (-> v12.18.3)
node -> stable (-> v12.18.3) (default)
stable -> 12.18 (-> v12.18.3) (default)
iojs -> N/A (default)
unstable -> N/A (default)
lts/* -> lts/erbium (-> v12.18.3)
lts/argon -> v4.9.1 (-> N/A)
lts/boron -> v6.17.1 (-> N/A)
lts/carbon -> v8.17.0 (-> N/A)
lts/dubnium -> v10.22.0 (-> N/A)
lts/erbium -> v12.18.3
```

可以看到，安装的是 v12 的稳定版。因为只安装了一个版本，所以使用的版本是 v12

使用其他版本(建议安装稳定版本), 本例安装 v10 的稳定版为例

```terminal
% nvm install 10
Downloading and installing node v10.22.0...
...
Computing checksum with shasum -a 256
Checksums matched!
Now using node v10.22.0 (npm v6.14.6)
```

可以看到当前 node 版本改为 v10

```terminal
% nvm ls
->     v10.22.0
       v12.18.3
default -> 12 (-> v12.18.3)
node -> stable (-> v12.18.3) (default)
stable -> 12.18 (-> v12.18.3) (default)
iojs -> N/A (default)
unstable -> N/A (default)
lts/* -> lts/erbium (-> v12.18.3)
lts/argon -> v4.9.1 (-> N/A)
lts/boron -> v6.17.1 (-> N/A)
lts/carbon -> v8.17.0 (-> N/A)
lts/dubnium -> v10.22.0
lts/erbium -> v12.18.3
```

切换默认的版本

```terminal
% nvm use 12
Now using node v12.18.3 (npm v6.14.6)
```

查看一下版本

```terminal
% node -v
v12.18.3
```

删除一个 node.js 版本

```terminal
% nvm uninstall 10
```

## 结束语

本例演示使用 nvm 进行 node.js 的安装和版本切换。

## 参考资料
[Install NVM On Mac With Brew][1]  
[Node Version Manager][2]  

[1]: https://medium.com/@jamesauble/install-nvm-on-mac-with-brew-adb921fb92cc
[2]: https://github.com/nvm-sh/nvm