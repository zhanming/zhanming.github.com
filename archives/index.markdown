---
layout: default
title: Archive
comments: false
---

<ul id="posts">
    {% for post in site.posts %}
        <li>
            <strong>{{ post.date | date:"%Y年%m月%d日" }}</strong>
            <a href="{{ post.url }}">{{ post.title }}</a>
            <i class="icon-comment"></i><a href="{{ post.url }}#disqus_thread">Comments</a>
        </li>
    {% endfor %}
</ul>
