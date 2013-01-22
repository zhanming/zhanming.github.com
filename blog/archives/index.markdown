---
layout: page
navigation: Archives
title: Archive
---

<h3>Archives</h3>
<ul id="posts">
    {% for post in site.posts %}
        <li>
            <strong>{{ post.date | date:"%Y年%m月%d日" }}</strong>
            <a href="{{ post.url }}">{{ post.title }}</a>
        </li>
    {% endfor %}
</ul>
