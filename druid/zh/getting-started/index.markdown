---
layout: druid_zh_CN
navigation: getting-started
title: 入门
---
<div>
<header class="jumbotron subhead" id="overview">
  <div class="container">
    <h1>入门</h1>
    <p class="lead">Druid项目概述，以及如何快速上手，开始一个简单的项目。</p>
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
        <section id="quick-start">
          <div class="page-header">
            <h1>快速入门</h1>
          </div>
          <p class="lead">让我们行动起来.</p>
          <p>我们知道有时很难找到正确的帮助，搜索引擎也不一定理解您的意思，所以我们会尽量把最常见的一些概况和链接的主题更深入的资源在这里列出，以免浪费您的宝贵时间在我们的<a href="../manual">手册</a>中搜索. 如果您正使用 <a href="http://im.qq.com/">qq</a>, 加入这个qq群： <code>92748305</code>.</p>
             
        </section>

        <!-- Examples
        ================================================== -->
        <section id="examples">
          <div class="page-header">
            <h1>一些示例</h1>
          </div>
          <p class="lead">展示一些Druid的使用例子。我们鼓励大家深入了解，而不是简单使用，并当作最终结果。</p>
          <h4>基本使用</h4>
          <p>
<pre class="prettyprint linenums">
public static void main(String[] args) {
	DruidDataSource dataSource = new DruidDataSource();
	dataSource.setUrl("jdbc:mysql://localhost/test");
	dataSource.setDriverClassName("com.mysql.jdbc.Driver");
	dataSource.setUsername("root");
	dataSource.setPassword("root");
	dataSource.setTestWhileIdle(true);
	String sql = "select 1";
	DruidPooledConnection conn = null;
	try {
		conn = dataSource.getConnection();
		PreparedStatement ps = conn.prepareStatement(sql);
		ps.execute();
	} catch (SQLException e) {
		e.printStackTrace();
	} finally {
		try {
			conn.close();
		} catch (SQLException e) {
			e.printStackTrace();
		}
		dataSource.close();
	}
}
</pre>
          </p>
          <h4>SQL Parser例子</h4>
          <p>
<pre class="prettyprint linenums">

</pre>
          </p>
        </section>

        <!-- Integrations
        ================================================== -->
        <section id="integrations">
          <div class="page-header">
            <h1>集成示例</h1>
          </div>
          <p class="lead">与Spring集成.</p>
          <p></p>
        </section>

        <!-- Monitors
        ================================================== -->
        <section id="monitors">
          <div class="page-header">
            <h1>监视示例</h1>
          </div>
          <p class="lead">通过web application, jconsole, command line等途径监视程序运行情况.</p>
          <p></p>
        </section>

	<!-- FAQ
        ================================================== -->
        <section id="faq">
          <div class="page-header">
            <h1>FAQ</h1>
          </div>
          <p class="lead">一些关于历史，架构和使用Druid的常见的问题，可以从 <a href="../faq">FAQ</a> 页面中找到解释。</p>
        </section>

	<!-- Take the Red Pill
        ================================================== -->
        <section id="take-red-pill">
          <div class="page-header">
            <h1>红色小药丸</h1>
          </div>
          <p class="lead">如果你想专牛角尖（嘿，这是开源的!），不如从 <a href="https://github.com/AlibabaTech/druid/issues?state=open">问题列表</a> 页面检出，它涵盖了提交的问题，得到源码，构建，提交一个补丁.....</p>
        </section>

        <!-- Next
        ================================================== -->
        <section id="what-next">
          <div class="page-header">
            <h1>下一步?</h1>
          </div>
          <p class="lead">开始学习文档，信息，示例和代码片段，或者采取的下一次行动，并在任何即将开展的项目中使用Druid..</p>
          <a class="btn btn-large btn-primary" href="../downloads">下载Druid</a>
        </section>
      </div>
    <div class="span3 bs-docs-sidebar">
        <ul class="nav nav-list bs-docs-sidenav">
          <li><a href="#quick-start"><i class="icon-chevron-left"></i> 快速入门</a></li>
          <li><a href="#examples"><i class="icon-chevron-left"></i> 一些示例</a></li>
          <li><a href="#integrations"><i class="icon-chevron-left"></i> 集成示例</a></li>
          <li><a href="#monitors"><i class="icon-chevron-left"></i> 监视示例</a></li>
          <li><a href="#faq"><i class="icon-chevron-left"></i> FAQ</a></li>
          <li><a href="#take-red-pill"><i class="icon-chevron-left"></i> 红色小药丸</a></li>
          <li><a href="#what-next"><i class="icon-chevron-left"></i> 下一步?</a></li>
        </ul>
      </div>
  </div>
</div>
