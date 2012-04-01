---
layout: default
title: Categories
---

<div id='tag_cloud'>
{% for category in site.categories %}
<a href="#{{ category[0] }}" title="{{ category[0] }}" rel="{{ category[1].size }}">{{ category[0] }} ({{ category[1].size }})</a>
{% endfor %}
</div>

<ul class="unstyled">
{% for category in site.categories %}
  <h4><li id="{{ category[0] }}">{{ category[0] }}</li></h4>
{% for post in category[1] %}
  <li>
  <time datetime="{{ post.date | date:"%Y-%m-%d" }}">{{ post.date | date:"%Y-%m-%d" }}</time>  <a href="{{ site.url }}{{ post.url }}" title="{{ post.title }}">{{ post.title }}</a>
  </li>
{% endfor %}
{% endfor %}
</ul>

<script src="/media/js/jquery.tagcloud.js" type="text/javascript" charset="utf-8"></script> 
<script language="javascript">
$.fn.tagcloud.defaults = {
    size: {start: 1, end: 1, unit: 'em'},
      color: {start: '#f8e0e6', end: '#ff3333'}
};

$(function () {
    $('#tag_cloud a').tagcloud();
});
</script>

