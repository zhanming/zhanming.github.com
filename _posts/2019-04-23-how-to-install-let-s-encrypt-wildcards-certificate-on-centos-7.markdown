---
layout: post
title: CentOS 7 下 安装 Let's Encrypt 的通配符证书
categories: [Linux]
tags: [centos, let's encrypt, https, security]
summary: Let's Encrypt 的通配符证书 (Wildcard Certificate) 于 2018 年 3 月中旬上线，可以免费申请，安装和使用，本次记录一下基本的步骤。
---
## 前言
Let's Encrypt 的通配符证书 (Wildcard Certificate) 于 2018 年 3 月中旬上线，可以免费申请，安装和使用，本次记录一下基本的步骤。

申请通配符证书需要 ACME v2 协议的客户端，官方推荐使用 [Certbot][2]。

[Certbot][2] 官网也有安装步骤供您参考，本文只记录安装通配符证书的基本操作步骤，与其他软件集成和配置步骤不在本文范围。

### 环境说明

CentOS 7（Minimal Install）

```terminal
$ cat /etc/centos-release 
CentOS Linux release 7.6.1810 (Core) 
```

### 准备域名

`准备域名不在本文范畴，安装通配符证书，您需要有修改域名配置的权限。`

## 步骤

### 安装 Certbot

先安装 EPEL 仓库（因为 certbot 在这个源里，目前还没在默认的源里）

```terminal
$ sudo yum install epel-release
```

安装 certbot

```terminal
$ sudo yum install certbot
```

查看 certbot 版本，因为 ACME v2 要在 `certbot 0.20.0` 以后的版本支持。

```terminal
$ certbot --version
certbot 0.31.0
```

本文时， certbot 版本时 0.31.0，可以支持 ACME v2 协议。

### 申请证书

申请通配符证书命令如下

```terminal
$ sudo certbot certonly -d yourdomain.com -d *.yourdomain.com --manual --preferred-challenges dns --server https://acme-v02.api.letsencrypt.org/directory
```

主要参数说明：

1. certonly 是 certbot 众多插件之一，您可以选择其他插件。  
2. -d 为那些主机申请证书，如果是通配符，输入 *.yourdomain.com。  
`注意：本文还申请了 yourdomain.com 这是为了避免通配符证书不匹配`。  
3. –preferred-challenges dns，使用 DNS 方式校验域名所有权。  
`注意：通配符证书只能使用 dns-01 这种方式申请`。  

输出如下

```terminal
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Plugins selected: Authenticator manual, Installer None
Enter email address (used for urgent renewal and security notices) (Enter 'c' to
cancel): admin@yourdomain.com
-------------------------------------------------------------------------------
Please read the Terms of Service at
https://letsencrypt.org/documents/LE-SA-v1.2-November-15-2017.pdf. You must
agree in order to register with the ACME server at
https://acme-v02.api.letsencrypt.org/directory
-------------------------------------------------------------------------------
(A)gree/(C)ancel: A
 
Plugins selected: Authenticator manual, Installer None
Obtaining a new certificate
Performing the following challenges:
dns-01 challenge for yourdomain.com
-------------------------------------------------------------------------------
NOTE: The IP of this machine will be publicly logged as having requested this
certificate. If you're running certbot in manual mode on a machine that is not
your server, please ensure you're okay with that.
 
Are you OK with your IP being logged?
-------------------------------------------------------------------------------
(Y)es/(N)o: y
-------------------------------------------------------------------------------
Please deploy a DNS TXT record under the name
_acme-challenge.yourdomain.com with the following value:
 
hkh6BT7jERHEDzPORxBQ*************4ebhA
 
Before continuing, verify the record is deployed.
-------------------------------------------------------------------------------
Press Enter to Continue
```

交互提示：
1. 输入邮箱地址，以备紧急更新或者安全提醒的通知。
2. 同意许可协议。
3. 同意域名和 IP 绑定。
4. 绑定 DNS 的 TXT 记录值，校验域名的所有权。

此时去 DNS 服务商那里，配置 `_acme-challenge.yourdomain.com` 类型为 TXT 的记录。在没有确认 TXT 记录生效之前不要回车执行。

`注意：要输入当时提示的值，本例为 hkh6BT7jERHEDzPORxBQ*************4ebhA` 

新打开一个 ssh 窗口，输入下列命令确认 TXT 记录是否生效：

```terminal
$ dig -t txt _acme-challenge.yourdomain.com @8.8.8.8

...
...

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 512
;; QUESTION SECTION:
;_acme-challenge.yourdomain.com.	IN	TXT

;; ANSWER SECTION:
_acme-challenge.yourdomain.com. 599	IN	TXT	"hkh6BT7jERHEDzPORxBQ*************4ebhA"

...
...

```

可以看到，配置已经生效，可以退出新打开的这个 ssh 窗口。

回到原来的 ssh 窗口，按下回车。

```terminal
Waiting for verification...
Cleaning up challenges 

IMPORTANT NOTES:
 - Congratulations! Your certificate and chain have been saved at:
   /etc/letsencrypt/live/yourdomain.com/fullchain.pem
   Your key file has been saved at:
   /etc/letsencrypt/live/yourdomain.com/privkey.pem
   Your cert will expire on 2019-07-22. To obtain a new or tweaked
   version of this certificate in the future, simply run certbot
   again. To non-interactively renew *all* of your certificates, run
   "certbot renew"
 - If you like Certbot, please consider supporting our work by:
 
   Donating to ISRG / Let's Encrypt:   https://letsencrypt.org/donate
   Donating to EFF:                    https://eff.org/donate-le
   
```

至此，证书申请成功。

### 查看证书

证书申请成功后，默认存放在 `/etc/letsencrypt` 目录下

```terminal
$ cd /etc/letsencrypt/
$ ls
accounts  archive  csr  keys  live  renewal  renewal-hooks
```

可以校验一下证书信息

```terminal
$ sudo openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -noout -text
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number:
...
...
            Authority Information Access: 
                OCSP - URI:http://ocsp.int-x3.letsencrypt.org
                CA Issuers - URI:http://cert.int-x3.letsencrypt.org/

            X509v3 Subject Alternative Name: 
                DNS:*.yourdomain.com, DNS:yourdomain.com
            X509v3 Certificate Policies: 
...
...
```

可以看到证书的 SAN 扩展里包含了 `*.yourdomain.com`， 说明申请的证书的匹配范围。

### 证书更新

certbot 默认离过期 30 天内可以 renew。普通的证书可以使用

普通的证书可以使用 certbot 自带命令，配合 corn 表达式，定时执行作业。

通配符证书更新可以重新执行一次申请的命令，如果域名服务商支持 API 方式，也可以使用脚本自动执行，但是不在本文范围。

## 结论
本文演示了 CentOS 7 下 安装 Let's encrypt 的通配符证书步骤。

## 参考资料
[ACME v2 and Wildcard Certificate Support is Live][1]  
[Certbot homepage][2]  
[Let's Encrypt 宣布支持通配符证书，所有子域名可轻松开启 HTTPS][3]  
[获取 Let's Encrypt 免费通配符证书实现Https][4]  
 
[1]: https://community.letsencrypt.org/t/acme-v2-and-wildcard-certificate-support-is-live/55579  
[2]: https://certbot.eff.org/  
[3]: https://www.infoq.cn/article/2018/03/lets-encrypt-wildcard-https  
[4]: https://www.cnblogs.com/stulzq/p/8628163.html   