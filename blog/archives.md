---
layout: page
navigation: Archives
title: Archive
---

<h3>Archives</h3>
<ul id="posts" class="list-unstyled">
    {% for post in site.posts %}
        <li>
            <strong>{{ post.date | date:"%Y-%m-%d" }}</strong>
            <a href="{{ post.url }}">{{ post.title }}</a>
        </li>
    {% endfor %}
</ul>
