---
layout: druid
navigation: downloads
title: Download
---

<div>
<header class="jumbotron subhead" id="overview">
  <div class="container">
    <h1>Downloads</h1>
    <p class="lead">Use the links below to download a distribution of Druid.</p>
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
            <h1>Download Compiled</h1>
          </div>
          <p class="lead">You can download from these places.</p>
              <h3>Download a distribution</h3>
              <p>Github: <a href="https://github.com/AlibabaTech/druid/downloads">https://github.com/AlibabaTech/druid/downloads</a></p>
              <p>Maven central repository: <a href="http://repo1.maven.org/maven2/com/alibaba/druid/">http://repo1.maven.org/maven2/com/alibaba/druid/</a></p>
              <p>Alibaba maven repository: <a href="http://code.alibabatech.com/mvn/releases/com/alibaba/druid/">http://code.alibabatech.com/mvn/releases/com/alibaba/druid/</a></p>
              <h3>Download use maven</h3>
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
            <h1>Download Source</h1>
          </div>
          <p class="lead">Druid source code is hosted at <a href="http://github.com/AlibabaTech/druid">GitHub</a>.</p>
          <p>If you use linux, git clone is the best way.
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
            <p>If you use Mac, go to <a href="http://mac.github.com/">Github for Mac</a>. then use it clone.</p>
            <p>If you use Windows, go to <a href="http://windows.github.com/">Github for Windows</a>, then use it clone.</p>
            <p>If you use Eclipse, go to <a href="http://eclipse.github.com/">Github for Eclipse</a>, then use it clone.</p>
            <p>If you use Mobile, go to <a href="http://mobile.github.com/">Github for Mobile Apps</a>, then use it clone.</p>
        </section>

        <!-- Nightly Snapshots
        ================================================== -->
        <section id="nightly-snapshots">
          <div class="page-header">
            <h1>Nightly Snapshots</h1>
          </div>
          <p class="lead">These distributions are built and deployed nightly, and contain up-to-date fixes and improvements. However, their stability cannot be guaranteed. Use at your own risk.</p>
          <h3>Snapshot builds for all active releases are published to the Alibaba snapshot repository.</h3>
          <p>A maven project can access this snapshot repository by adding the following repository in pom.xml:
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
            <h1>Older Releases</h1>
          </div>
          <p class="lead">Older releases is not recommended, unless you are certain you want to.</p>
          <p>Druid older releases are hold at Github: <a href="https://github.com/AlibabaTech/druid/downloads">https://github.com/AlibabaTech/druid/downloads</a>.</p>
        </section>

        <!-- Dependency
        ================================================== -->
        <section id="dependency">
          <div class="page-header">
            <h1>Dependency</h1>
          </div>
          <p class="lead">Druid have no dependency for other jars.</p>
          <p>Other help: Druid's command line monitor use Oracle's JDK package.</p>
        </section>

        <!-- Next
        ================================================== -->
        <section id="what-next">
          <div class="page-header">
            <h1>What next?</h1>
          </div>
          <p class="lead">Head to the docs for information, examples, and code snippets, or take the next leap and use Druid for any upcoming project.</p>
          <a class="btn btn-large btn-primary" href="../manual">Visit the Druid manual</a>
        </section>
      </div>
    <div class="span3 bs-docs-sidebar">
        <ul class="nav nav-list bs-docs-sidenav">
          <li><a href="#download-dist"><i class="icon-chevron-left"></i> Download Compiled</a></li>
          <li><a href="#download-source"><i class="icon-chevron-left"></i> Download Source</a></li>
          <li><a href="#nightly-snapshots"><i class="icon-chevron-left"></i> Nightly Snapshots</a></li>
          <li><a href="#older-releases"><i class="icon-chevron-left"></i> Older Releases</a></li>
          <li><a href="#dependency"><i class="icon-chevron-left"></i> Dependency</a></li>
          <li><a href="#what-next"><i class="icon-chevron-left"></i> What next?</a></li>
        </ul>
      </div>
  </div>
</div>
