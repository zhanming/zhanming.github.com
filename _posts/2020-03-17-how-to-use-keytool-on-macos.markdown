---
layout: post
title: macOS 上使用 keytool 生成 keystore
categories: [Tutorial]
tags: [macos, keytool, keystore]
summary: keytool 是 Java 自带的用于密钥和证书的管理工具，Java 开发阶段中经常用到，本例介绍常用的几个命令的例子。
---
## 前言
keytool 是 Java 自带的用于密钥和证书的管理工具，Java 开发阶段中经常用到，本例介绍常用的几个命令的例子。

### 环境说明
macOS 10.15

```terminal
% sw_vers
ProductName:	Mac OS X
ProductVersion:	10.15.3
BuildVersion:	19D76
```

## 安装和使用

keytool 是 Java 自带的工具，所以需要安装 Java。

### 安装 Java

因为安装 Java 的方式有很多，当前最新的 Java 为 Java 13, 但是 Java 11 是长期支持版本，所以本例安装低一点的版本。

本例使用 brew 安装 OpenJDK 11 为例。

1. 安装软件包

```terminal
% brew tap homebrew/cask-versions
```

2. 搜索一下 Java 版本

```terminal
% brew cask info java11
java11: 11.0.2,9
https://www.oracle.com/technetwork/java/javase/
/usr/local/Caskroom/java11/11.0.2,9 (148B)
From: https://github.com/Homebrew/homebrew-cask-versions/blob/master/Casks/java11.rb
==> Name
OpenJDK Java Development Kit
==> Artifacts
jdk-11.0.2.jdk -> /Library/Java/JavaVirtualMachines/openjdk-11.0.2.jdk (Generic Artifact)
```

3. 安装 OpenJDK11

```terminal
% brew cask install java11   
```

4. 查看一下 Java 的版本

```terminal
% java -version
openjdk version "11.0.2" 2019-01-15
OpenJDK Runtime Environment 18.9 (build 11.0.2+9)
OpenJDK 64-Bit Server VM 18.9 (build 11.0.2+9, mixed mode)
```

安装好 java 之后, keytool 应该也已经安装好了。

5. 查看一下 keytool

```terminal
% which keytool
/usr/bin/keytool
```

### 使用 keytool

#### 查看帮助

命令如下

```terminal
% keytool -h
Key and Certificate Management Tool

Commands:

 -certreq            Generates a certificate request
 -changealias        Changes an entry's alias
 -delete             Deletes an entry
 -exportcert         Exports certificate
 -genkeypair         Generates a key pair
 -genseckey          Generates a secret key
 -gencert            Generates certificate from a certificate request
 -importcert         Imports a certificate or a certificate chain
 -importpass         Imports a password
 -importkeystore     Imports one or all entries from another keystore
 -keypasswd          Changes the key password of an entry
 -list               Lists entries in a keystore
 -printcert          Prints the content of a certificate
 -printcertreq       Prints the content of a certificate request
 -printcrl           Prints the content of a CRL file
 -storepasswd        Changes the store password of a keystore

Use "keytool -?, -h, or --help" for this help message
Use "keytool -command_name --help" for usage of command_name.
Use the -conf <url> option to specify a pre-configured options file.
```

#### 创建证书库

使用 `-genkeypair` 命令

```terminal
% keytool -genkeypair -keyalg RSA -alias thekeystore -keystore keystore.jks -storepass changeit -keysize 2048
What is your first and last name?
  [Unknown]:  localhost
What is the name of your organizational unit?
  [Unknown]:  Development Dept.
What is the name of your organization?
  [Unknown]:  Example
What is the name of your City or Locality?
  [Unknown]:  Beijing
What is the name of your State or Province?
  [Unknown]:  Beijing
What is the two-letter country code for this unit?
  [Unknown]:  CN
Is CN=localhost, OU=Development Dept., O=Example, L=Beijing, ST=Beijing, C=CN correct?
  [no]:  yes
```

说明:

`-genkeypair` : 生成一对密钥

`-keyalg RSA`: 使用 RSA 算法

`-alias thekeystore`: 别名，这个比较重要，主要用于管理密钥

`-keystore keystore.jks`: keystore 的文件名, 本例为 keystore.jks

`-storepass changeit`: keystore 的密码, 本例为 changeit

`-keysize 2048`:密钥长度, 本例为 2048

一般还会使用 `-validity 360`  设置有效期，默认为三个月。其他参数可以使用帮助查看 `keytool -genkeypair -h`，

 `注意` 本例设置的 `CN=localhost` 参数非常重要，一般这个是域名，本机开发就是 localhost。

#### 查看证书库

使用 `-list` 命令

```terminal
% keytool -list -keystore keystore.jks
Enter keystore password: # 输入密码 changeit
Keystore type: PKCS12
Keystore provider: SUN

Your keystore contains 1 entry

thekeystore, Mar 17, 2020, PrivateKeyEntry,
Certificate fingerprint (SHA-256): ...
```

#### 格式转换

使用 `-export` 命令

我们需要将这个 keystore.jks 的格式导出为 crt 格式，再倒入到 Java 的 cacerts 中，这样客户端就可以使用这个证书了。

```terminal
% keytool -export -alias thekeystore -file keystore.crt -keystore keystore.jks
Enter keystore password: # 输入 changeit
Certificate stored in file <keystore.crt>
```

#### 导入证书库

使用 `-import` 命令

将证书导入到 Java cacerts key store 中

```terminal
% keytool -import -alias thekeystore -file keystore.crt -keystore /Library/Java/JavaVirtualMachines/openjdk-11.0.2.jdk/Contents/Home/lib/security/cacerts
Warning: use -cacerts option to access cacerts keystore
Enter keystore password: # 输入密码 changeit
Owner: CN=localhost, OU=Development Dept., O=Example, L=Beijing, ST=Beijing, C=CN
Issuer: CN=localhost, OU=Development Dept., O=Example, L=Beijing, ST=Beijing, C=CN
Serial number: 6d29...
Valid from: 
...
...
...
Trust this certificate? [no]:  yes
Certificate was added to keystore
```

至此，证书可以使用了。

#### 删除证书

使用 `-delete` 命令

有时需要从证书库中删除证书，可以使用 `keytool -delete` 命令

```terminal
% keytool -delete -alias thekeystore -keystore /Library/Java/JavaVirtualMachines/openjdk-11.0.2.jdk/Contents/Home/lib/security/cacerts
Warning: use -cacerts option to access cacerts keystore
Enter keystore password: # 输入密码 changeit
```

## 总结

本例介绍 keytool 的几个常用方法。

## 参考资料

[CAS SSO With Spring Security][1]  


[1]: https://www.baeldung.com/spring-security-cas-sso
