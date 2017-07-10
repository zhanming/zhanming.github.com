---
layout: post
title: 解决 WebLogic 12c 的 jar 包冲突
categories: [Java]
tags: [jpa, weblogic]
summary: 部署一个 Java EE 程序到 Weblogic 12c 上很简单，WebLogic 12c 已经支持 JPA 2.1 标准，使用的 ecipse-link 作为默认实现。
---
## 前提说明
部署一个 Java EE 程序到 Weblogic 12c 上很简单，WebLogic 12c 已经支持 JPA 2.1 标准，使用的 ecipse-link 作为默认实现。

我们使用的是 JPA，实现是基于 Hibernate 的，部署到 Weblogic 的时候一直有 jar 包冲突。

### 环境说明
程序中使用的 JPA 和实现如下：

hibernate-4.3.5.Final.jar

hibernate-jpa-2.1-api-1.0.0.Final.jar

本来以为只要在 weblogic.xml 里描述符就 OK 了。于是改成了这样：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<wls:weblogic-web-app
	xmlns:wls="http://xmlns.oracle.com/weblogic/weblogic-web-app"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/ejb-jar_3_0.xsd
		http://xmlns.oracle.com/weblogic/weblogic-web-app http://xmlns.oracle.com/weblogic/weblogic-web-app/1.4/weblogic-web-app.xsd">

	<wls:context-root>/</wls:context-root>
	<wls:container-descriptor>
		<wls:prefer-web-inf-classes>true</wls:prefer-web-inf-classes>
	</wls:container-descriptor>
</wls:weblogic-web-app>
```

但是一直有问题，网上找了好久，找到了 <http://javaiscoool.blogspot.com/2012/12/deploy-jpa20-application-on-weblogic1033.html>，才发现，需要修改 persistence.xml 的文件名，很诡异。
不知道为什么，只要是 persistence.xml，WebLogic 不论如何都是使用它自己的实现进行解析，结果一直 jar 包冲突。

## 解决办法

修改 persistence.xml 为其他的名字如 foo.xml（foo.xml 为示例作用），并且要将这个名字配置到 Spring 的 applicationContext.xml 中，我的程序是使用 Spring 的。

```xml
<bean id="entityManagerFactory"
	class="org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean">
	<property name="persistenceXmlLocation" value="classpath:META-INF/foo.xml"/>
	<property name="persistenceUnitName" value="persistenceUnit" />
	<property name="dataSource" ref="dataSource" />
</bean>
```

注：persistenceUnitName 和 dataSource 的值，请按项目自行修改。

然后，添加 `WEB-INF/weblogic.xml`，使用了 WebLogic 的 `prefer-application-packages` 描述符，具体内容如下：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<wls:weblogic-web-app
	xmlns:wls="http://xmlns.oracle.com/weblogic/weblogic-web-app"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://java.sun.com/xml/ns/javaee http://java.sun.com/xml/ns/javaee/ejb-jar_3_0.xsd
		http://xmlns.oracle.com/weblogic/weblogic-web-app http://xmlns.oracle.com/weblogic/weblogic-web-app/1.4/weblogic-web-app.xsd">

	<wls:context-root>/</wls:context-root>
	<wls:container-descriptor>
		<wls:prefer-application-packages>
			<wls:package-name>antlr.*</wls:package-name>
			<wls:package-name>org.apache.commons.*</wls:package-name>
			<wls:package-name>javax.persistence.*</wls:package-name>
			<wls:package-name>org.hibernate.*</wls:package-name>
		</wls:prefer-application-packages>
	</wls:container-descriptor>
</wls:weblogic-web-app>
```

这样，WebLogic 就会使用项目内的 jar 包了。

## 参考资料
[Deploy JPA2.0 application on weblogic10.3.3][1]  
[weblogic.xml Deployment Descriptor Elements][2]  

[1]: http://javaiscoool.blogspot.com/2012/12/deploy-jpa20-application-on-weblogic1033.html
[2]: http://docs.oracle.com/cd/E24329_01/web.1211/e21049/weblogic_xml.htm
