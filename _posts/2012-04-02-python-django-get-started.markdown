---
layout: post
title: 使用Python和Django搭建Web应用
categories: [Tutorial]
tags: [python, django, web development]
summary: Django是Python开发的Web框架。使用Django搭建Web应用很方便。写本文时django的最新版本为1.4，但本文不关注新版本的特性，只搭建一个简单的应用。
---

<a href="http://www.flickr.com/photos/zhanming/6978716444/"><img src="http://farm9.staticflickr.com/8025/6978716444_3892988209_m.jpg" width="117" height="41" alt="django_logo"></a>

#### 简介
Django是Python开发的Web框架。使用Django搭建Web应用很方便。原文如下：  
Django is a high-level Python Web framework that encourages rapid development and clean, pragmatic design.  
Developed by a fast-moving online-news operation, Django was designed to handle two challenges: the intensive deadlines of a newsroom and the stringent requirements of the experienced Web developers who wrote it. It lets you build high-performing, elegant Web applications quickly.

写本文时django的最新版本为1.4，但本文不关注新版本的特性，只搭建一个简单的应用。

#### 安装Django
本文以CentOS 6.2为例进行安装:  
安装python

    # yum install python

本文使用的是CentOS 6.2 Desktop，默认安装了python.
查看一下python的版本

    # python --version
    Python 2.6.6

Django-1.4支持python2.5以上（python3暂不支持）。具体请看[Django的官方博客](https://www.djangoproject.com/weblog/2012/mar/23/14/)。  
根据python的版本安装setuptools，pip（使用pip安装软件很方便，pip依赖setuptools），安装setuptools很简单，到其[pipy](http://pypi.python.org/pypi/setuptools)下载并安装(注意跟python的版本对应)。

    # curl -O http://pypi.python.org/packages/2.6/s/setuptools/setuptools-0.6c11-py2.6.egg
    # sh setuptools-0.6c11-py2.6.egg
    # curl -O https://raw.github.com/pypa/pip/master/contrib/get-pip.py
    # python get-pip.py

本文关注django，暂不考虑virtualenv，buildout等虚拟环境的安装。  
安装django

    # pip install django

查看django的版本

    $ django-admin.py --version
    1.4

#### 创建Django项目及Web应用
使用django搭建Web应用很快。

    $ mkdir ~/dev
    $ cd ~/dev

创建项目，使用**django-admin.py**的**startproject**命令。

    ～/dev$ django-admin.py startproject djdemo

django-1.4创建的目录结构较以前的版本有了些调整，本文例子如下：

    .
    `--djdemo
       |--djdemo
       |  |--__init__.py
       |  |--settings.py
       |  |--urls.py
       |  `--wsgi.py
       `--manage.py

创建应用，使用**manage.py**的**startapp**命令，本文创建一个订单(Order)的例子。

    $ cd djdemo
    ~/dev/djdemo$ python manage.py startapp orders

django会自动创建此应用的基本文件，目录如下：

    .
    `--djdemo
       |--djdemo
       |  |--__init__.py
       |  |--settings.py
       |  |--urls.py
       |  `--wsgi.py
    +  |--orders
    +  |  |--__init__.py
    +  |  |--models.py
    +  |  |--tests.py
    +  |  `--views.py
       `--manage.py

在orders文件夹中新建admin.py，用于django管理工具使用。最终目录如下：

    .
    `--djdemo
       |--djdemo
       |  |--__init__.py
       |  |--settings.py
       |  |--urls.py
       |  `--wsgi.py
       |--orders
       |  |--__init__.py
    +  |  |--admin.py
       |  |--models.py
       |  |--tests.py
       |  `--views.py
       `--manage.py

#### 创建一个Django的模型
接下来修改models.py，管理此应有的模型。
注意：如果使用非ASCII码，需要在文件头部添加

    # -*- coding: utf-8 -*-

添加Order模型：
<pre class="prettyprint linenums">
# -*- coding: utf-8 -*-
from django.db import models

# Create your models here.
from django.utils.translation import ugettext_lazy as _

class Order(models.Model):
    order_no = models.CharField(max_length=255)
    description = models.CharField(max_length=255)
    created_on = models.DateTimeField(help_text=_('creation date'), auto_now_add = True)
    updated_on = models.DateTimeField(help_text=_('last update date'), auto_now = True)

    def __unicode__(self):
        return self.order_no
</pre>
这是一个models的例子，设计到了属性，国际化，自动填充时间等内容，关于models，更多请参考django网站的[models相关文档](https://docs.djangoproject.com/en/dev/topics/db/models/)。

以下是admin.py的内容，使django可以管理这个模型。
通常只需要添加就可以了如下例子：
<pre class="prettyprint linenums">
# -*- coding: utf-8 -*-
from django.contrib import admin
from .models import Order

admin.site.register(Order)
</pre>
但是django可以定制管理界面。如下更改：
<pre class="prettyprint linenums">
# -*- coding: utf-8 -*-
from django.contrib import admin
from django.utils.translation import ugettext_lazy as _

from .models import Order

class OrderAdmin(admin.ModelAdmin):
    """Admin form Order model"""
    list_display = ('order_no', 'description', 'created_on')
    search_fields = ('order_no', 'description')
    fieldsets = (
        (_('Content'), {
            'fields': ('order_no', 'description')
        }),
        (_('Advanced options'), {
            'classes': ('collapse',),
            'fields': ('created_on', 'updated_on')
        }),
    )
    actions_on_top = True
    actions_on_bottom = True
    readonly_fields = ("created_on", "updated_on")

admin.site.register(Order, OrderAdmin)
</pre>

这是一个admin的例子，涉及到了列表显示，搜索，配置界面等，关于admin，更多请参考django网站的文档[admin相关文档](https://docs.djangoproject.com/en/dev/ref/contrib/admin/)。

#### 配置
主要配置**settings.py**和**urls.py**。

在settings.py开始添加如下，主要设置路径：
<pre class="prettyprint linenums">
# -*- coding: utf-8 -*-
# Django settings for djdemo project.

import os
import sys

ROOT_PATH = os.path.dirname(os.path.abspath(__file__))

if ROOT_PATH not in sys.path:
    sys.path.append(ROOT_PATH)
</pre>

修改数据库配置，本文使用sqlite3，这是django自带驱动的，其他的请参考django网站的[database相关文档](https://docs.djangoproject.com/en/dev/ref/databases/)
<pre class="prettyprint linenums">
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3', # Add 'postgresql_psycopg2', 'mysql', 'sqlite3' or 'oracle'.
        'NAME': os.path.abspath(os.path.join(ROOT_PATH, '..', 'sqlite.db')), # Or path to database file if using sqlite3.
        'USER': '',                      # Not used with sqlite3.
        'PASSWORD': '',                  # Not used with sqlite3.
        'HOST': '',                      # Set to empty string for localhost. Not used with sqlite3.
        'PORT': '',                      # Set to empty string for default. Not used with sqlite3.
    }
}
</pre>

接下来修改INSTALLED_APPS部分：  
将orders应用添加到 INSTALLED_APPS 设置中，并去掉admin模块的\#注释。

<pre class="prettyprint linenums">
INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Uncomment the next line to enable the admin:
    'django.contrib.admin', 
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
)
INSTALLED_APPS += (
    'orders',
)
</pre>

配置**urls.py**。  
要让该管理工具可以通过 /admin URL 使用，只需要简单地取消项目的 urls.py 文件中提供的对应行的内容即可。

<pre class="prettyprint linenums">
# -*- coding: utf-8 -*-
from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'djdemo.views.home', name='home'),
    # url(r'^djdemo/', include('djdemo.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)
</pre>

此时，程序基本配置完毕，下面开始数据库的初始化和django管理界面的使用。

先进行sql语句的显示，可以查看表结构是否正确(必须指明应用名称，本文为orders)。使用**manage.py**的**sqlall**命令。
    ~/dev/djdemo$ python manage.py sqlall orders
得到如下结果
<pre class="prettyprint">
BEGIN;
CREATE TABLE "orders_order" (
    "id" integer NOT NULL PRIMARY KEY,
    "order_no" varchar(255) NOT NULL,
    "description" varchar(255) NOT NULL,
    "created_on" datetime NOT NULL,
    "updated_on" datetime NOT NULL
)
;
COMMIT;
</pre>
接下来开始数据库初始化，使用**manage.py**的**syncdb**命令：
    ~/dev/djdemo$ python manage.py syncdb
期间会询问是否添加superusers，过程如下：

    Creating tables ...
    Creating table auth_permission
    Creating table auth_group_permissions
    Creating table auth_group
    Creating table auth_user_user_permissions
    Creating table auth_user_groups
    Creating table auth_user
    Creating table django_content_type
    Creating table django_session
    Creating table django_site
    Creating table django_admin_log
    Creating table orders_order
    
    You just installed Django's auth system, which means you don't have any superusers defined.
    Would you like to create one now? (yes/no): yes
    Username (leave blank to use '****'): admin
    E-mail address: username@domain.com
    Password: 
    Password (again): 
    Superuser created successfully.
    Installing custom SQL ...
    Installing indexes ...
    Installed 0 object(s) from 0 fixture(s)

此时数据库初始化完毕。
#### 测试
启动django，进行应用的测试，使用**manage.py**的**runserver**命令，开启服务。

    ~/dev/djdemo$ python manage.py runserver

现在可以访问**http://localhost:8000/admin**查看。

#### 结束语
本文主要侧重与django的安装和初步使用，不涉及其他内容（如视图，模板，国际化，生产系统部署等），重点是从头开始，到一个简单的应用。

#### 参考资料
[Django网站](https://www.djangoproject.com/)  
[setuptools下载地址](http://pypi.python.org/pypi/setuptools)  
[pip下载地址](http://pypi.python.org/pypi/pip)  
[Python Web 框架，第 1 部分: 使用 Django 和 Python 开发 Web 站点](http://www.ibm.com/developerworks/cn/linux/l-django/)

