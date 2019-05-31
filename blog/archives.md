---
layout: page
navigation: Archives
title: Archive
---

<h3>Archives</h3>
<div id="archives">
    {% for post in site.posts %}
    	{% assign currentDate = post.date | date: "%Y" %}
    	{% if currentDate != myDate %}
           {% unless forloop.first %}</ul>{% endunless %}
           <h3>{{ currentDate }}</h3>
           <ul class="list-unstyled">
           {% assign myDate = currentDate %}
       {% endif %}
       <li><strong>{{ post.date | date:"%Y-%m-%d" }}</strong> <a href="{{ post.url }}">{{ post.title }}</a></li>
       {% if forloop.last %}</ul>{% endif %}
    {% endfor %}
</div>
