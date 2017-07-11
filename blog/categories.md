---
layout: page
title: Categories
---

<h3>Categories</h3>
<div id="tag_cloud" class="cloud">
{% for category in site.categories %}
<a href="#{{ category[0] }}" title="{{ category[0] }}" rel="{{ 12 | minus:tag[0].size }}">{{ category[0] }} ({{ category[1].size }})</a>
{% endfor %}
</div>

<ul class="list-unstyled">
{% for category in site.categories %}
  <h4><li id="{{ category[0] }}">{{ category[0] }}</li></h4>
{% for post in category[1] %}
  <li>
  <time datetime="{{ post.date | date:"%Y-%m-%d" }}">{{ post.date | date:"%Y-%m-%d" }}</time> - <a href="{{ site.url }}{{ post.url }}" title="{{ post.title }}">{{ post.title }}</a>
  </li>
{% endfor %}
{% endfor %}
</ul>

<script src="/assets/jquery.tagcloud/jquery.tagcloud.js" type="text/javascript" charset="utf-8"></script> 
<script language="javascript">
$.fn.tagcloud.defaults = {
    size: {start: 10, end: 18, unit: 'pt'},
    color: {start: '#5154e3', end: '#f16121'}
};

$(function () {
    $('#tag_cloud a').tagcloud();
});
</script>

