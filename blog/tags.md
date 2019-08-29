---
layout: page
navigation: Tags
title: Tags
---

<h3>标签</h3>

<div id="tag_cloud" class="cloud">
{% for tag in site.tags %}
<a href="#{{ tag[0] }}" title="{{ tag[0] }}" rel="{{ 12 | minus:tag[0].size }}">{{ tag[0] }}</a>
{% endfor %}
</div>

<ul class="list-unstyled">
{% for tag in site.tags %}
  <h4><li id="{{ tag[0] }}">{{ tag[0] }}</li></h4>
{% for post in tag[1] %}
  <li>
    <time datetime="{{ post.date | date:"%Y-%m-%d" }}">{{ post.date | date:"%Y-%m-%d" }}</time>
    <a href="{{ site.url }}{{ post.url }}" title="{{ post.title }}">{{ post.title }}</a>
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
