---
layout: druid_zh_CN
navigation: downloads
title: 下载
---

<div>
<header class="jumbotron subhead" id="overview">
  <div class="container">
    <h1>下载</h1>
    <p class="lead">使用下面的链接下载Druid.</p>
  </div>
</header>
</div>
<div class="container">

    <!-- Docs nav
    ================================================== -->
    <div class="row">
      <div class="span9">
    <!-- Download
        ================================================== -->
        <section id="download-dist">
          <div class="page-header">
            <h1>下载分发包</h1>
          </div>
          <p class="lead">可以从这些地方下载.</p>
              <h3>下载分发包</h3>
              <p>Github: <a href="https://github.com/AlibabaTech/druid/downloads">https://github.com/AlibabaTech/druid/downloads</a></p>
              <p>Maven central repository: <a href="http://repo1.maven.org/maven2/com/alibaba/druid/">http://repo1.maven.org/maven2/com/alibaba/druid/</a></p>
              <p>Alibaba maven repository: <a href="http://code.alibabatech.com/mvn/releases/com/alibaba/druid/">http://code.alibabatech.com/mvn/releases/com/alibaba/druid/</a></p>
              <h3>使用Maven下载</h3>
              <pre class="prettyprint linenums">
&lt;dependency&gt;
     &lt;groupId&gt;com.alibaba&lt;/groupId&gt;
     &lt;artifactId&gt;druid&lt;/artifactId&gt;
     &lt;version&gt;0.2.6&lt;/version&gt;
&lt;/dependency&gt;
</pre>
        </section>

        <!-- Download source
        ================================================== -->
        <section id="download-source">
          <div class="page-header">
            <h1>下载源码</h1>
          </div>
          <p class="lead">Druid的源码使用 <a href="http://github.com/AlibabaTech/druid">GitHub</a>管理.</p>
          <p>如果您使用Linux, git clone是最好的方法.
<pre class="prettyprint">
$ git clone git://github.com/AlibabaTech/druid.git
Initialized empty Git repository in /path/to/druid/.git/
remote: Counting objects: 100, done.
remote: Compressing objects: 100% (86/86), done.
remote: Total 100 (delta 35), reused 0 (delta 0)
Receiving objects: 100% (100/100), 9.51 KiB, done.
Resolving deltas: 100% (35/35), done.
$ cd druid/
</pre></p>
            <p>如果您使用Mac, 到 <a href="http://mac.github.com/">Github for Mac</a>. 然后克隆.</p>
            <p>如果您使用Windows, 到 <a href="http://windows.github.com/">Github for Windows</a>, 然后克隆.</p>
            <p>如果您使用Eclipse, 到 <a href="http://eclipse.github.com/">Github for Eclipse</a>, 然后克隆.</p>
            <p>如果您使用Mobile, 到 <a href="http://mobile.github.com/">Github for Mobile Apps</a>, 然后克隆.</p>
        </section>

        <!-- Nightly Snapshots
        ================================================== -->
        <section id="nightly-snapshots">
          <div class="page-header">
            <h1>每日快照</h1>
          </div>
          <p class="lead">这些分发包每日自动构建，包含最新的修正和改进。但是，其稳定性不能得到保证。使用它您需要承担更多的风险。</p>
          <h3>快照建立的所有活动版本被发布到 Alibaba snapshot repository.</h3>
          <p>一个Maven项目可以访问该快照存储库，在pom.xml中加入以下的仓库：
<pre class="prettyprint linenums">
&lt;repository&gt;
    &lt;id&gt;alibaba-snapshots&lt;/id&gt;
    &lt;name&gt;alibaba-snapshots&lt;/name&gt;
    &lt;url&gt;http://code.alibabatech.com/mvn/snapshots/&lt;/url&gt;
    &lt;layout&gt;default&lt;/layout&gt;
&lt;/repository>
</pre>
</p>
        </section>

	<!-- Older incubating Releases
        ================================================== -->
        <section id="older-releases">
          <div class="page-header">
            <h1>旧版本</h1>
          </div>
          <p class="lead">旧版本不推荐使用，除非您一定需要.</p>
          <p>Druid的旧版本保存在 Github: <a href="https://github.com/AlibabaTech/druid/downloads">https://github.com/AlibabaTech/druid/downloads</a>.</p>
        </section>

        <!-- Dependency
        ================================================== -->
        <section id="dependency">
          <div class="page-header">
            <h1>依赖</h1>
          </div>
          <p class="lead">Druid 与其他jar包没有任何依赖.</p>
          <p>其他说明: Druid的命令行监视使用了Oracle的JDK的包.</p>
        </section>

        <!-- Next
        ================================================== -->
        <section id="what-next">
          <div class="page-header">
            <h1>下一步?</h1>
          </div>
          <p class="lead">开始学习文档，信息，示例和代码片段，或者采取的下一次行动，并在任何即将开展的项目中使用Druid.</p>
          <a class="btn btn-large btn-primary" href="../manual">浏览Druid手册</a>
        </section>
      </div>
    <div class="span3 bs-docs-sidebar">
        <ul class="nav nav-list bs-docs-sidenav">
          <li><a href="#download-dist"><i class="icon-chevron-left"></i> 下载分发包</a></li>
          <li><a href="#download-source"><i class="icon-chevron-left"></i> 下载源码</a></li>
          <li><a href="#nightly-snapshots"><i class="icon-chevron-left"></i> 每日快照</a></li>
          <li><a href="#older-releases"><i class="icon-chevron-left"></i> 旧版本</a></li>
          <li><a href="#dependency"><i class="icon-chevron-left"></i> 依赖</a></li>
          <li><a href="#what-next"><i class="icon-chevron-left"></i> 下一步?</a></li>
        </ul>
      </div>
  </div>
</div>
