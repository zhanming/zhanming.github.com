---
layout: post
title: CentOS 7 下配置 GitLab CE 9 与 FreeIPA 4 集成
categories: [Linux]
tags: [centos, gitlab, freeipa, ldap]
summary: CentOS 7 下配置 GitLab CE 9 与 FreeIPA 4 集成，记录一下大致的配置过程。
---
## 前言
安装了 GitLab CE 和 FreeIPA 后，需要 GitLab CE 使用 FreeIPA 的账号时，涉及到配置 GitLab CE 的 LDAP。

本例记录一下 GitLab CE 9 配置 LDAP（使用 FreeIPA 4）进行账户访问。

> **`注意`**
>
本例只是测试，`请不要用于生产`，因为 GitLab CE 有一个 bug 还没有解决，配置 LDAP 成功之后，Web 方式登录没有问题，但是不能进行 `git clone` 操作。
> 
Bug具体参见: [GitLab issue #13440 - Can't clone repo over HTTP with LDAP authorization][6]。

### 环境说明
CentOS 7（Minimal Install）安装 GitLab CE 9  
请参考 [CentOS 7 下 Yum 安装 GitLab CE 8.16.6][1]

CentOS 7（Minimal Install）安装 FreeIPA 4   
请参考 [CentOS 7 配置 Free IPA 服务(主服务和复制服务)][2]

## 配置步骤

### 配置 FreeIPA 
登录到 FreeIPA 服务器，新建 System Account，与第三方集成，最好这样做。 System Account 不能登录到其他服务器上，只能用来与 FreeIPA 的 LDAP 进行交互，相对安全。

查看版本

```terminal
# ipa --version
VERSION: 4.4.0, API_VERSION: 2.213
```

添加命令如下： 参考 [FreeIPA - HowTo/LDAP][3]

```terminal
# ldapmodify -x -D 'cn=Directory Manager' -W
Enter LDAP Password: # 输入密码，之后手动输入一下信息
dn: uid=system,cn=sysaccounts,cn=etc,dc=example,dc=com
changetype: add
objectclass: account
objectclass: simplesecurityobject
uid: system
userPassword: secret123 # 注意修改为您自己的密码
passwordExpirationTime: 20380119031407Z
nsIdleTimeout: 0
<blank line>
^D
```

这样就创建了一个 System Account，会有这样的提示：

```terminal
adding new entry "uid=system,cn=sysaccounts,cn=etc,dc=example,dc=com"
```

最后的 `^D` 是使用 `Ctrl + D` 退出
 
> 这个账户没有特殊的权限，只有读的权限，这样保证相对安全。
>
> 主题替换上文的 `dc=example,dc=com` 为您自己的域。

### 配置 GitLab CE
查看 GitLab 版本

```terminal
$ sudo gitlab-rake gitlab:env:info
System information
System:		
Current User:	git
Using RVM:	no
...
...
GitLab information
Version:	9.2.5
...
...
Using LDAP:	no  # 没有启用 ldap
Using Omniauth:	no
...
```	

修改配置文件，因为本例使用 Omnibus 进行安装的, 参考 [GitLab - Setting up LDAP sign-in][4]

```terminal
$ sudo vi /etc/gitlab/gitlab.rb
```

修改如下内容：

```ruby
### LDAP Settings
###! Docs: https://docs.gitlab.com/omnibus/settings/ldap.html
###! **Be careful not to break the indentation in the ldap_servers block. It is
###!   in yaml format and the spaces must be retained. Using tabs will not work.**
	
gitlab_rails['ldap_enabled'] = true # 启用 ldap
	
###! **remember to close this block with 'EOS' below**
gitlab_rails['ldap_servers'] = YAML.load <<-EOS
  main: # 'main' is the GitLab 'provider ID' of this LDAP server
    label: 'LDAP' # 登录标题显示 LDAP 
    host: 'ipa.example.com' # FreeIPA 的 IP 地址或域名
    port: 636  # 389 为 ldap, 636 为 ldaps
    uid: 'uid'
    method: 'ssl' # "tls" or "ssl" or "plain"
    bind_dn: 'uid=system,cn=sysaccounts,cn=etc,dc=example,dc=com'
    password: 'your_password'
    active_directory: false # 不是 Microsoft 的 AD
    allow_username_or_email_login: false
    block_auto_created_users: false
    base: 'cn=users,cn=accounts,dn=example,dn=com'
...
...
EOS
```

保存 `:wq` 之后，退出。

本例只演示基础配置，如用户角色过滤等，本例暂不演示，请参考 [GitLab - LDAP][5]

重新配置 GitLab

```terminal
$ sudo gitlab-ctl reconfigure
```

验证 ldap 配置

```terminal
$ sudo gitlab-rake gitlab:ldap:check
Checking LDAP ...
	
Server: ldapmain
LDAP authentication... Success
LDAP users with access to your GitLab server (only showing the first 100 results)
	DN: uid=admin,cn=users,cn=accounts,dc=example,dc=com	 uid: admin
	...
	...
Checking LDAP ... Finished
```

这样 GitLab CE 配置基本成功。

### 验证 GitLab 登录和权限
以下是 GitLab 的界面操作

+ 登录 GitLab CE 测试 `http://your_gitlab_server/users/sign_in`；
+ 登录页面会显示两个 tab 一个是 LDAP 标签页，另一个是 Standard 标签页；
+ 在 LDAP 标签页中输入 FreeIPA 的用户名和密码（如我测试使用的用户名：test1 和 密码）
+ `Your account has been blocked. Please contact your GitLab administrator if you think this is an error.` 这表示账户已经同步，默认为锁定账号，需要 GitLab 管理员解锁并分配权限；
+ 使用 Standard 标签页，用 root 用户登录，进入 Users 会发现新用户在 Block 用户列表中，Unblock 一下之后，分配相应的 GitLab 组和权限。

这样用户就可以登录 GitLab 了。

> `注意` 如果用户名密码错误，有如下提示 
>
> `Could not authenticate you from Ldapmain because "Invalid credentials".`

## 参考资料
[CentOS 7 下 Yum 安装 GitLab CE 8.16.6][1]  
[CentOS 7 配置 Free IPA 服务(主服务和复制服务)][2]  
[FreeIPA - HowTo/LDAP][3]  
[GitLab - Setting up LDAP sign-in][4]  
[GitLab - LDAP][5]
 
[1]: http://qizhanming.com/blog/2017/02/28/install-gitlab-ce-on-centos7
[2]: http://qizhanming.com/blog/2017/06/07/how-to-config-freeipa-server-and-replica-on-centos-7
[3]: https://www.freeipa.org/page/HowTo/LDAP
[4]: https://docs.gitlab.com/omnibus/settings/ldap.html
[5]: https://docs.gitlab.com/ce/administration/auth/ldap.html
[6]: https://gitlab.com/gitlab-org/gitlab-ce/issues/13440