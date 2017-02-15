---
layout: post
title: 从GitHub将Maven项目导入Eclipse4.2
categories: [Java]
tags: [java, maven, eclipse, github]
summary: GitHub中的Maven项目一般没有本地配置文件（主要是为了去除依赖，使项目整体结构清晰）。但是当导入Github的Maven项目，并与本地的Eclipse直接结成，总有些困难，直到Eclipse 4.2(Juno). 本文介绍如何导入github项目，并直接与eclipse集成。
---

#### 简介

GitHub is a web-based hosting service for projects that user the Git revision control system. It is a social networking where you can share your code.

GitHub中的Maven项目一般没有本地配置文件（主要是为了去除依赖，使项目整体结构清晰）。

但是当导入Github的Maven项目，并与本地的Eclipse直接结成，总有些困难，直到Eclipse 4.2(Juno). 本文介绍如何导入github项目，并直接与eclipse集成。

#### 引文
本文是在Windows 7下进行，下面的软件将被安装，并使之一起工作 :  
1. [Eclipse](http://www.eclipse.org): Eclipse IDE（本文使用eclipse-4.2）  
2. [Java](http://java.sun.com): Java编程语言(本文使用java-1.7.0_05)  
3. [Maven](http://maven.apache.org): Java项目管理工具(本文使用mava-3.0.4)  
4. [Druid](https://github.com/AlibabaTech/druid): JDBC Connection Pool(本文使用Druid项目为例)  

##### 条件准备
1. GitHub流程， Set up git, Create a repo, Fork a repo, Be social. 参考[GitHub Help](https://help.github.com).
2. 生成ssh keys. 参考[Generating SSH Keys](https://help.github.com/articles/generating-ssh-keys).
3. 有项目的push权限
4. Java, Eclipse, Maven安装正确

#### 配置
Maven配置  
Eclipse-4.2使用的Maven版本默认为maven-3.0.4, 但是还是建议设置一下：  
版本设置: Window &gt; Preferences &gt; Maven &gt; Installations  
用户设置: Window &gt; Preferences &gt; Maven &gt; User Settings  

SSH配置  
SSH2设置: Window &gt; Preferences &gt; General &gt; Network Connections &gt; SSH2  
注意设置SSH2 home及private keys.

#### 导入项目
  
1.右键 > Import > Project from Git

<a href="http://www.flickr.com/photos/zhanming/7751482896/" title="Flickr 上 qizhanming 的 Project form Git"><img style="float: left; clear: both;" src="http://farm9.staticflickr.com/8440/7751482896_de4553ea44.jpg" width="477" height="500" alt="Project form Git"/></a>
<div style="clear: both;"></div>

2.选择URI

<a style="clear: both; float: left; display: block;" href="http://www.flickr.com/photos/zhanming/7751485316/" title="Flickr 上 qizhanming 的 Select Repository Source"><img style="float: left;" src="http://farm8.staticflickr.com/7280/7751485316_32100db2a8.jpg" width="477" height="500" alt="Select Repository Source"/></a>
<div style="clear: both;"></div>

3.输入Remote Git Repo的配置信息

<a href="http://www.flickr.com/photos/zhanming/7751485600/" title="Flickr 上 qizhanming 的 Enter the location of the source repository"><img style="float: left;" src="http://farm9.staticflickr.com/8304/7751485600_3e49558fcc.jpg" width="477" height="500" alt="Enter the location of the source repository"/></a>
<div style="clear: both;"></div>

注意：Protocol使用ssh, User使用git, Password为账户在github的密码

4.查找远程分支信息

<a href="http://www.flickr.com/photos/zhanming/7751487764/" title="Flickr 上 qizhanming 的 Getting remote branches information"><img style="float: left;" src="http://farm9.staticflickr.com/8281/7751487764_9f1dd6693e.jpg" width="477" height="500" alt="Getting remote branches information"></a>
<div style="clear: both;"></div>

5.选择分支

<a href="http://www.flickr.com/photos/zhanming/7751487672/" title="Flickr 上 qizhanming 的 Branch Selection"><img style="float: left;" src="http://farm9.staticflickr.com/8291/7751487672_349d53df23.jpg" width="477" height="500" alt="Branch Selection"></a>
<div style="clear: both;"></div>

6.选择本地目标位置

<a href="http://www.flickr.com/photos/zhanming/7751487578/" title="Flickr 上 qizhanming 的 Local Destination"><img style="clear: both; float: left;" src="http://farm9.staticflickr.com/8286/7751487578_b00ff456cd.jpg" width="477" height="500" alt="Local Destination"></a>
<div style="clear: both;"></div>

7.从版本仓库中进行Clone

<a href="http://www.flickr.com/photos/zhanming/7751498510/" title="Flickr 上 qizhanming 的 Cloning from repository"><img style="float: left;" src="http://farm9.staticflickr.com/8421/7751498510_8312c87557.jpg" width="477" height="500" alt="Cloning from repository"></a>
<div style="clear: both;"></div>

8.接受文件中

<a href="http://www.flickr.com/photos/zhanming/7751487370/" title="Flickr 上 qizhanming 的 Receiving objects"><img style="clear: both; float: left;" src="http://farm9.staticflickr.com/8437/7751487370_9019a23670.jpg" width="477" height="500" alt="Receiving objects"></a>  
<div style="clear: both;"></div>

9.选择导入项目类型

<a href="http://www.flickr.com/photos/zhanming/7751487280/" title="Flickr 上 qizhanming 的 Import as general project"><img style="float: left;" src="http://farm9.staticflickr.com/8423/7751487280_4db494edaa.jpg" width="477" height="500" alt="Import as general project"></a>
<div style="clear: both;"></div>
注意: 选择Import as general project

10.确认项目名称

<a href="http://www.flickr.com/photos/zhanming/7751487202/" title="Flickr 上 qizhanming 的 Import Projects"><img style="float: left;" src="http://farm9.staticflickr.com/8299/7751487202_11afc22fac.jpg" width="477" height="500" alt="Import Projects"></a>
<div style="clear: both;"></div>

11.项目如下

<a href="http://www.flickr.com/photos/zhanming/7751487104/" title="Flickr 上 qizhanming 的 General project"><img style="float: left;" src="http://farm9.staticflickr.com/8446/7751487104_ea521356da.jpg" width="271" height="158" alt="General project"></a>
<div style="clear: both;"></div>
注意: 此时项目为General Project不是Maven project, 需要手工修改配置文件。但是由`[druid master]`可以看出，已经是一个带版本控制的项目了。

#### 修改项目配置文件
由于导入的是普通项目，需要转化成Maven Project。Eclipse中项目的主要配置文件是.classpath和.project,还有.settings文件夹。  
原项目为General project, 只有.project文件，其.project配置文件内容如下  
<pre class="prettyprint linenums">
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;projectDescription&gt;
	&lt;name&gt;druid&lt;/name&gt;
	&lt;comment&gt;&lt;/comment&gt;
	&lt;projects&gt;&lt;/projects&gt;
	&lt;buildSpec&gt;&lt;/buildSpec&gt;
	&lt;natures&gt;&lt;/natures&gt;
&lt;/projectDescription&gt;
</pre>
需要修改.project，并添加.classpath文件：  
<pre class="prettyprint linenums">
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;projectDescription&gt;
	&lt;name&gt;druid&lt;/name&gt;
	&lt;comment&gt;&lt;/comment&gt;
	&lt;projects&gt;
	&lt;/projects&gt;
	&lt;buildSpec&gt;
		&lt;buildCommand&gt;
			&lt;name&gt;org.eclipse.jdt.core.javabuilder&lt;/name&gt;
			&lt;arguments&gt;
			&lt;/arguments&gt;
		&lt;/buildCommand&gt;
		&lt;buildCommand&gt;
			&lt;name&gt;org.eclipse.m2e.core.maven2Builder&lt;/name&gt;
			&lt;arguments&gt;
			&lt;/arguments&gt;
		&lt;/buildCommand&gt;
	&lt;/buildSpec&gt;
	&lt;natures&gt;
		&lt;nature&gt;org.eclipse.jdt.core.javanature&lt;/nature&gt;
		&lt;nature&gt;org.eclipse.m2e.core.maven2Nature&lt;/nature&gt;
	&lt;/natures&gt;
&lt;/projectDescription&gt;
</pre>
还有.classpath文件  
<pre class="prettyprint linenums">
&lt;?xml version="1.0" encoding="UTF-8"?&gt;
&lt;classpath&gt;
	&lt;classpathentry kind="src" output="target/classes" path="src/main/java"&gt;
		&lt;attributes&gt;
			&lt;attribute name="optional" value="true"/&gt;
			&lt;attribute name="maven.pomderived" value="true"/&gt;
		&lt;/attributes&gt;
	&lt;/classpathentry&gt;
	&lt;classpathentry excluding="**" kind="src" output="target/classes" path="src/main/resources"&gt;
		&lt;attributes&gt;
			&lt;attribute name="maven.pomderived" value="true"/&gt;
		&lt;/attributes&gt;
	&lt;/classpathentry&gt;
	&lt;classpathentry kind="src" output="target/test-classes" path="src/test/java"&gt;
		&lt;attributes&gt;
			&lt;attribute name="optional" value="true"/&gt;
			&lt;attribute name="maven.pomderived" value="true"/&gt;
		&lt;/attributes&gt;
	&lt;/classpathentry&gt;
	&lt;classpathentry excluding="**" kind="src" output="target/test-classes" path="src/test/resources"&gt;
		&lt;attributes&gt;
			&lt;attribute name="maven.pomderived" value="true"/&gt;
		&lt;/attributes&gt;
	&lt;/classpathentry&gt;
	&lt;classpathentry kind="con" path="org.eclipse.jdt.launching.JRE_CONTAINER/org.eclipse.jdt.internal.debug.ui.launcher.StandardVMType/J2SE-1.5"&gt;
		&lt;attributes&gt;
			&lt;attribute name="maven.pomderived" value="true"/&gt;
		&lt;/attributes&gt;
	&lt;/classpathentry&gt;
	&lt;classpathentry kind="con" path="org.eclipse.m2e.MAVEN2_CLASSPATH_CONTAINER"&gt;
		&lt;attributes&gt;
			&lt;attribute name="maven.pomderived" value="true"/&gt;
		&lt;/attributes&gt;
	&lt;/classpathentry&gt;
	&lt;classpathentry kind="output" path="target/classes"/&gt;
&lt;/classpath&gt;
</pre>

#### 刷新项目
在项目上右键 > Refresh.  
如果还有错误，可以在项目上右键 > Maven > Update project.. > OK, Eclipse 会自动重新建立.settings文件夹。

<a href="http://www.flickr.com/photos/zhanming/7751487032/" title="Flickr 上 qizhanming 的 General project real"><img style="float: left;" src="http://farm9.staticflickr.com/8441/7751487032_069bd7545c.jpg" width="270" height="283" alt="General project real"></a>
<div style="clear: both;"></div>
此时项目完成，可以直接提交到GitHub了。

#### 参考
[Using the EGit Eclipse Plugin with GitHub](http://www.slideshare.net/loianeg/using-the-egit-eclipse-plugin-with-git-hub-2578587).  
[EGit User Guide](http://wiki.eclipse.org/EGit/User_Guide)  
[Git with Eclipse (EGit) - Tutorial](http://www.vogella.com/articles/EGit/article.html)

