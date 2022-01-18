---
layout: post
title: 从 GitHub 将 Maven 项目导入 Eclipse 4.2
categories: [Java]
tags: [java, maven, eclipse, github]
summary: GitHub 中的 Maven 项目一般没有本地配置文件（主要是为了去除依赖，使项目整体结构清晰）。但是当导入 Github 的 Maven 项目，并与本地的 Eclipse 直接结成，总有些困难，直到 Eclipse 4.2(Juno). 本文介绍如何导入 github 项目，并直接与 eclipse 集成。
---

## 简介

GitHub is a web-based hosting service for projects that user the Git revision control system. It is a social networking where you can share your code.

GitHub 中的 Maven 项目一般没有本地配置文件（主要是为了去除依赖，使项目整体结构清晰）。

但是当导入 Github 的 Maven 项目，并与本地的 Eclipse 直接结成，总有些困难，直到 Eclipse 4.2(Juno). 本文介绍如何导入 github 项目，并直接与 eclipse 集成。

### 引文
本文是在 Windows 7 下进行，下面的软件将被安装，并使之一起工作 :  
1. [Eclipse](http://www.eclipse.org): Eclipse IDE（本文使用eclipse-4.2）  
2. [Java](http://java.sun.com): Java 编程语言(本文使用 java-1.7.0_05)  
3. [Maven](http://maven.apache.org): Java 项目管理工具(本文使用 maven-3.0.4)  
4. [Druid](https://github.com/AlibabaTech/druid): JDBC Connection Pool(本文使用 Druid 项目为例)  

#### 条件准备
1. GitHub 流程， Set up git, Create a repo, Fork a repo, Be social. 参考[GitHub Help](https://help.github.com).
2. 生成 ssh keys. 参考[Generating SSH Keys](https://help.github.com/articles/generating-ssh-keys).
3. 有项目的 push 权限
4. Java, Eclipse, Maven 安装正确

## 配置
Maven配置  
Eclipse-4.2 使用的 Maven 版本默认为 maven-3.0.4, 但是还是建议设置一下：  
版本设置: Window &gt; Preferences &gt; Maven &gt; Installations  
用户设置: Window &gt; Preferences &gt; Maven &gt; User Settings  

SSH 配置  
SSH2 设置: Window &gt; Preferences &gt; General &gt; Network Connections &gt; SSH2  
注意设置 SSH2 home 及 private keys.

### 导入项目
  
1.右键 > Import > Project from Git

<a href="http://www.flickr.com/photos/zhanming/7751482896/" title="Flickr 上 qizhanming 的 Project form Git"><img style="float: left; clear: both;" src="http://farm9.staticflickr.com/8440/7751482896_de4553ea44.jpg" width="477" height="500" alt="Project form Git"/></a>
<div style="clear: both;"></div>

2.选择 URI

<a style="clear: both; float: left; display: block;" href="http://www.flickr.com/photos/zhanming/7751485316/" title="Flickr 上 qizhanming 的 Select Repository Source"><img style="float: left;" src="http://farm8.staticflickr.com/7280/7751485316_32100db2a8.jpg" width="477" height="500" alt="Select Repository Source"/></a>
<div style="clear: both;"></div>

3.输入 Remote Git Repo 的配置信息

<a href="http://www.flickr.com/photos/zhanming/7751485600/" title="Flickr 上 qizhanming 的 Enter the location of the source repository"><img style="float: left;" src="http://farm9.staticflickr.com/8304/7751485600_3e49558fcc.jpg" width="477" height="500" alt="Enter the location of the source repository"/></a>
<div style="clear: both;"></div>

注意：Protocol 使用 ssh, User 使用 git, Password 为账户在 github 的密码

4.查找远程分支信息

<a href="http://www.flickr.com/photos/zhanming/7751487764/" title="Flickr 上 qizhanming 的 Getting remote branches information"><img style="float: left;" src="http://farm9.staticflickr.com/8281/7751487764_9f1dd6693e.jpg" width="477" height="500" alt="Getting remote branches information"></a>
<div style="clear: both;"></div>

5.选择分支

<a href="http://www.flickr.com/photos/zhanming/7751487672/" title="Flickr 上 qizhanming 的 Branch Selection"><img style="float: left;" src="http://farm9.staticflickr.com/8291/7751487672_349d53df23.jpg" width="477" height="500" alt="Branch Selection"></a>
<div style="clear: both;"></div>

6.选择本地目标位置

<a href="http://www.flickr.com/photos/zhanming/7751487578/" title="Flickr 上 qizhanming 的 Local Destination"><img style="clear: both; float: left;" src="http://farm9.staticflickr.com/8286/7751487578_b00ff456cd.jpg" width="477" height="500" alt="Local Destination"></a>
<div style="clear: both;"></div>

7.从版本仓库中进行 Clone

<a href="http://www.flickr.com/photos/zhanming/7751498510/" title="Flickr 上 qizhanming 的 Cloning from repository"><img style="float: left;" src="http://farm9.staticflickr.com/8421/7751498510_8312c87557.jpg" width="477" height="500" alt="Cloning from repository"></a>
<div style="clear: both;"></div>

8.接受文件中

<a href="http://www.flickr.com/photos/zhanming/7751487370/" title="Flickr 上 qizhanming 的 Receiving objects"><img style="clear: both; float: left;" src="http://farm9.staticflickr.com/8437/7751487370_9019a23670.jpg" width="477" height="500" alt="Receiving objects"></a>  
<div style="clear: both;"></div>

9.选择导入项目类型

<a href="http://www.flickr.com/photos/zhanming/7751487280/" title="Flickr 上 qizhanming 的 Import as general project"><img style="float: left;" src="http://farm9.staticflickr.com/8423/7751487280_4db494edaa.jpg" width="477" height="500" alt="Import as general project"></a>
<div style="clear: both;"></div>
注意: 选择 Import as general project

10.确认项目名称

<a href="http://www.flickr.com/photos/zhanming/7751487202/" title="Flickr 上 qizhanming 的 Import Projects"><img style="float: left;" src="http://farm9.staticflickr.com/8299/7751487202_11afc22fac.jpg" width="477" height="500" alt="Import Projects"></a>
<div style="clear: both;"></div>

11.项目如下

<a href="http://www.flickr.com/photos/zhanming/7751487104/" title="Flickr 上 qizhanming 的 General project"><img style="float: left;" src="http://farm9.staticflickr.com/8446/7751487104_ea521356da.jpg" width="271" height="158" alt="General project"></a>
<div style="clear: both;"></div>
注意: 此时项目为 General Project 不是 Maven project, 需要手工修改配置文件。但是由 `[druid master]` 可以看出，已经是一个带版本控制的项目了。

### 修改项目配置文件
由于导入的是普通项目，需要转化成 Maven Project。Eclipse 中项目的主要配置文件是 `.classpath` 和 `.project` ,还有 `.settings` 文件夹。  
原项目为 General project, 只有 `.project` 文件，其 `.project` 配置文件内容如下  

```xml
<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
	<name>druid</name>
	<comment></comment>
	<projects></projects>
	<buildSpec></buildSpec>
	<natures></natures>
</projectDescription>
```

需要修改.project，并添加.classpath文件：  

```xml
<?xml version="1.0" encoding="UTF-8"?>
<projectDescription>
	<name>druid</name>
	<comment></comment>
	<projects>
	</projects>
	<buildSpec>
		<buildCommand>
			<name>org.eclipse.jdt.core.javabuilder</name>
			<arguments>
			</arguments>
		</buildCommand>
		<buildCommand>
			<name>org.eclipse.m2e.core.maven2Builder</name>
			<arguments>
			</arguments>
		</buildCommand>
	</buildSpec>
	<natures>
		<nature>org.eclipse.jdt.core.javanature</nature>
		<nature>org.eclipse.m2e.core.maven2Nature</nature>
	</natures>
</projectDescription>
```

还有 `.classpath` 文件  

```xml
<?xml version="1.0" encoding="UTF-8"?>
<classpath>
	<classpathentry kind="src" output="target/classes" path="src/main/java">
		<attributes>
			<attribute name="optional" value="true"/>
			<attribute name="maven.pomderived" value="true"/>
		</attributes>
	</classpathentry>
	<classpathentry excluding="**" kind="src" output="target/classes" path="src/main/resources">
		<attributes>
			<attribute name="maven.pomderived" value="true"/>
		</attributes>
	</classpathentry>
	<classpathentry kind="src" output="target/test-classes" path="src/test/java">
		<attributes>
			<attribute name="optional" value="true"/>
			<attribute name="maven.pomderived" value="true"/>
		</attributes>
	</classpathentry>
	<classpathentry excluding="**" kind="src" output="target/test-classes" path="src/test/resources">
		<attributes>
			<attribute name="maven.pomderived" value="true"/>
		</attributes>
	</classpathentry>
	<classpathentry kind="con" path="org.eclipse.jdt.launching.JRE_CONTAINER/org.eclipse.jdt.internal.debug.ui.launcher.StandardVMType/J2SE-1.5">
		<attributes>
			<attribute name="maven.pomderived" value="true"/>
		</attributes>
	</classpathentry>
	<classpathentry kind="con" path="org.eclipse.m2e.MAVEN2_CLASSPATH_CONTAINER">
		<attributes>
			<attribute name="maven.pomderived" value="true"/>
		</attributes>
	</classpathentry>
	<classpathentry kind="output" path="target/classes"/>
</classpath>
```

### 刷新项目
在项目上右键 > Refresh.  
如果还有错误，可以在项目上右键 > Maven > Update project.. > OK, Eclipse 会自动重新建立 `.settings` 文件夹。

<a href="http://www.flickr.com/photos/zhanming/7751487032/" title="Flickr 上 qizhanming 的 General project real"><img style="float: left;" src="http://farm9.staticflickr.com/8441/7751487032_069bd7545c.jpg" width="270" height="283" alt="General project real"></a>
<div style="clear: both;"></div>
此时项目完成，可以直接提交到 GitHub 了。

## 参考
[Using the EGit Eclipse Plugin with GitHub](http://www.slideshare.net/loianeg/using-the-egit-eclipse-plugin-with-git-hub-2578587).  
[EGit User Guide](http://wiki.eclipse.org/EGit/User_Guide)  
[Git with Eclipse (EGit) - Tutorial](http://www.vogella.com/articles/EGit/article.html)

