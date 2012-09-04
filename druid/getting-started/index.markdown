---
layout: druid
navigation: getting-started
title: Get Started
---
<div>
<header class="jumbotron subhead" id="overview">
  <div class="container">
    <h1>Getting started</h1>
    <p class="lead">Overview of the project, it's contents, and how to get started with a simple peoject.</p>
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
            <h1>Quick Start Guide</h1>
          </div>
          <p class="lead">Let's start.</p>
          <p>We know it can be hard to find the right help sometimes and search engines can be overwhelming, so we will try to put the most commonly asked for topics with some overview and links to more in-depth resources here for you to checkout, before wasting your time searching through our <a href="../manual">Documentation</a>. If you're using <a href="http://im.qq.com/">qq</a>, join this group: <code>92748305</code>.</p>
             
        </section>

        <!-- Examples
        ================================================== -->
        <section id="examples">
          <div class="page-header">
            <h1>Examples</h1>
          </div>
          <p class="lead">Show some examples for use druid. We encourage folks to iterate on these examples and not simply use them as an end result.</p>
          <h4>Basic use</h4>
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
          <h4>SQL Parser example</h4>
          <p>
<pre class="prettyprint linenums">

</pre>
          </p>
        </section>

        <!-- Integrations
        ================================================== -->
        <section id="integrations">
          <div class="page-header">
            <h1>Integrations</h1>
          </div>
          <p class="lead">Integration with spring.</p>
          <p></p>
        </section>

        <!-- Monitors
        ================================================== -->
        <section id="monitors">
          <div class="page-header">
            <h1>Monitors</h1>
          </div>
          <p class="lead">Monitors in web app, jconsole, command line and so on.</p>
          <p></p>
        </section>

	<!-- FAQ
        ================================================== -->
        <section id="faq">
          <div class="page-header">
            <h1>FAQ</h1>
          </div>
          <p class="lead">Some common questions concerning the history, architecture and usage of Druid can be found on the <a href="../faq">FAQ</a> page.</p>
        </section>

	<!-- Take the Red Pill
        ================================================== -->
        <section id="take-red-pill">
          <div class="page-header">
            <h1>Take the Red Pill</h1>
          </div>
          <p class="lead">If you want to dive into the rabbit-hole (Hey, It's open source!), then checkout the <a href="https://github.com/AlibabaTech/druid/issues?state=open">Found a Bug</a> page, which covers everything from posting questions to our mailing lists, to getting the source code and building it, and creating bug patches.....</p>
        </section>

        <!-- Next
        ================================================== -->
        <section id="what-next">
          <div class="page-header">
            <h1>What next?</h1>
          </div>
          <p class="lead">Head to the docs for information, examples, and code snippets, or take the next leap and customize Bootstrap for any upcoming project.</p>
          <a class="btn btn-large btn-primary" href="../downloads">Download the Druid</a>
        </section>
      </div>
    <div class="span3 bs-docs-sidebar">
        <ul class="nav nav-list bs-docs-sidenav">
          <li><a href="#quick-start"><i class="icon-chevron-left"></i> Quick Start Guide</a></li>
          <li><a href="#examples"><i class="icon-chevron-left"></i> Examples</a></li>
          <li><a href="#integrations"><i class="icon-chevron-left"></i> Integrations</a></li>
          <li><a href="#monitors"><i class="icon-chevron-left"></i> Monitors</a></li>
          <li><a href="#faq"><i class="icon-chevron-left"></i> FAQ</a></li>
          <li><a href="#take-red-pill"><i class="icon-chevron-left"></i> Take the Red Pill</a></li>
          <li><a href="#what-next"><i class="icon-chevron-left"></i> What next?</a></li>
        </ul>
      </div>
  </div>
</div>
