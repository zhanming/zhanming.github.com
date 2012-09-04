---
layout: druid_zh_CN
navigation: faq
title: FAQ
---
<div>
<header class="jumbotron subhead" id="overview">
  <div class="container">
    <h1>FAQ</h1>
    <p class="lead">Frequently asked questions of druid.</p>
  </div>
</header>
</div>
<div class="container">

    <!-- Docs nav
    ================================================== -->
    <div class="row">
      <div class="span9">
    <!-- Datasource faq
        ================================================== -->
        <section id="datasource-faq">
          <div class="page-header">
            <h1>DruidDataSource FAQ</h1>
          </div>
          <p class="lead">DruidDataSource support.</p>
          <h3>1. 为什么选择使用DruidDataSource?</h3>
          <p>DruidDataSource是一个可监控可扩展的数据库连接池。</p>
          <h3>2. DruidDataSource会导致连接风暴么?</h3>
          <p>在数据库中断恢复时，DBCP由于使用当前线程直接创建物理连接，会导致连接风暴，一些场景下，一个应用能够瞬间产生上千个连接，于是连接风暴产生了。DruidDataSource采用“单独线程创建连接”，从设计上避免了连接风暴问题的产生。</p>
          <h3>3. DruidDataSource是如何实现连接泄露监控的?</h3>
          <p>当ActiveConnectionTraceEnable设置为True，能够通过ActiveConnectionStackTrace属性获得正在使用的连接的创建堆栈信息，从而使得的很容易找出连接泄露的代码位置。</p>
          <h3>4. DruidDataSource支持扩展么?</h3>
          <p>DruidDataSource和DruidProxyDriver一样，支持同样的Filter-Chain模式的扩展机制，使得在Jdbc层扩展编程很方便。</p>
          <h3>5. DruidDataSource支持XA么?</h3>
          <p>目前DruidDataSource还不支持XA，因为作者对XA的实现还不够了解，需要花时间了解清楚之后再做实现。对XA的支持已经加入到计划中了，目前计划时在0.2版本中实现，具体请看<a href="http://code.alibabatech.com/jira/browse/DRUID">JIRA</a>。</p>
        </section>

        <!-- Proxydriver faq
        ================================================== -->
        <section id="proxydriver-faq">
          <div class="page-header">
            <h1>DruidProxyDriver FAQ</h1>
          </div>
          <p class="lead">DruidProxyDriver support.</p>
          <h3>1. Druid Proxy Driver支持JDK什么版本?</h3>
          <p>DruidProxyDriver实现了JDBC 4.0的Driver，需要JDK 1.6才能使用。</p>
          <p>
          <table class="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>JDK 版本</th>
                  <th>JDBC 版本</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1.4</td>
                  <td>3.0</td>
                  <td></td>
                </tr>
                <tr>
                  <td>1.5</td>
                  <td>3.0</td>
                  <td></td>
                </tr>
                <tr class="success">
                  <td>1.6</td>
                  <td>4.0</td>
                  <td>DruidProxyDriver只支持JDBC 4.0</td>
                </tr>
              </tbody>
            </table>
          </p>
          <h3>2. Oracle下jdbc executeBatch时，更新行数计算不正确?</h3>
          <p>使用jdbc的executeBatch 方法，如果数据库为oracle，则无论是否成功更新到数据，返回值都是-2，而不是真正被sql更新到的记录数，这是Oracle JDBC Driver的问题，Druid不作特殊处理。</p>
          <h3>3. Druid如何自动根据URL自动识别DriverClass的?</h3>
          <p>Druid是根据url前缀来识别DriverClass的，这样使得配置更方便简洁。</p>
          <p>
          <table class="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>前缀</th>
                  <th>Driver Class</th>
                  <th>描述信息</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>jdbc:derby:</td>
                  <td>org.apache.derby.jdbc.EmbeddedDriver</td>
                  <td></td>
                </tr>
                <tr>
                  <td>jdbc:mysql:</td>
                  <td>com.mysql.jdbc.Driver</td>
                  <td></td>
                </tr>
                <tr>
                  <td>jdbc:oracle:</td>
                  <td>oracle.jdbc.driver.OracleDriver</td>
                  <td></td>
                </tr>
                <tr>
                  <td>jdbc:microsoft:</td>
                  <td>com.microsoft.jdbc.sqlserver.SQLServerDriver</td>
                  <td></td>
                </tr>
                <tr>
                  <td>jdbc:sybase:Tds:</td>
                  <td>com.sybase.jdbc2.jdbc.SybDriver</td>
                  <td></td>
                </tr>
                <tr>
                  <td>jdbc:jtds:</td>
                  <td>net.sourceforge.jtds.jdbc.Driver</td>
                  <td></td>
                </tr>
                <tr>
                  <td>jdbc:postgresql:</td>
                  <td>org.postgresql.Driver</td>
                  <td></td>
                </tr>
                <tr>
                  <td>jdbc:fake:</td>
                  <td>com.alibaba.druid.mock.MockDriver</td>
                  <td></td>
                </tr>
                <tr>
                  <td>jdbc:mock:</td>
                  <td>com.alibaba.druid.mock.MockDriver</td>
                  <td></td>
                </tr>
                <tr>
                  <td>jdbc:hsqldb:</td>
                  <td>org.hsqldb.jdbcDriver</td>
                  <td></td>
                </tr>
                <tr class="error">
                  <td>jdbc:db2:</td>
                  <td>COM.ibm.db2.jdbc.app.DB2Driver</td>
                  <td>DB2的JDBC Driver十分混乱，这个匹配不一定对</td>
                </tr>
                <tr>
                  <td>jdbc:sqlite:</td>
                  <td>org.sqlite.JDBC</td>
                  <td></td>
                </tr>
                <tr>
                  <td>jdbc:ingres:</td>
                  <td>com.ingres.jdbc.IngresDriver</td>
                  <td></td>
                </tr>
		<td>jdbc:h2:</td>
		<td>org.h2.Driver</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:mckoi:</td>
		<td>com.mckoi.JDBCDriver</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:cloudscape:</td>
		<td>COM.cloudscape.core.JDBCDriver</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:informix-sqli:</td>
		<td>com.informix.jdbc.IfxDriver</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:timesten:</td>
		<td>com.timesten.jdbc.TimesTenDriver</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:as400:</td>
		<td>com.ibm.as400.access.AS400JDBCDriver</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:sapdb:</td>
		<td>com.sap.dbtech.jdbc.DriverSapDB</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:JSQLConnect:</td>
		<td>com.jnetdirect.jsql.JSQLDriver</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:JTurbo:</td>
		<td>com.newatlanta.jturbo.driver.Driver </td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:firebirdsql:</td>
		<td>org.firebirdsql.jdbc.FBDriver</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:interbase:</td>
		<td> interbase.interclient.Driver</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:pointbase:</td>
		<td> com.pointbase.jdbc.jdbcUniversalDriver</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:edbc:</td>
		<td> ca.edbc.jdbc.EdbcDriver</td>
		<td></td>
		</tr>
		<tr>
		<td>jdbc:mimer:multi1:</td>
		<td> com.mimer.jdbc.Driver</td>
                <td></td>
		</tr>
              </tbody>
            </table>
          </p>
          <h3>4. DruidDriver使用前需要调用Class.forName("com.alibaba.druid.proxy.DruidDriver")么?</h3>
          <p>不需要，在JDBC 4中，java.sql.DriverManager会自动读取META-INF/services/java.sql.Driver文件，读取其中配置过的Driver，DruidDriver支持这个特性，所以不需要使用前调用Class.forName("com.alibaba.druid.proxy.DruidDriver")。
META-INF/services/java.sql.Driver文件的内容如下，注册了两个Driver</p>
          <p>
	  <pre>
com.alibaba.druid.proxy.DruidDriver
com.alibaba.druid.mock.MockDriver</pre>
          </p>
        </section>

      </div>
    <div class="span3 bs-docs-sidebar">
        <ul class="nav nav-list bs-docs-sidenav">
          <li><a href="#datasource-faq"><i class="icon-chevron-left"></i> DruidDataSource FAQ</a></li>
          <li><a href="#proxydriver-faq"><i class="icon-chevron-left"></i> DruidProxyDriver FAQ</a></li>
        </ul>
      </div>
  </div>
</div>
