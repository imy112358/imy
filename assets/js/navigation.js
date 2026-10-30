(function () {
  'use strict';
  // Add future pages here. Every page shares the same navigation and active state.
  var pages = [
    { href: 'index.html', label: '总览', mark: '▦' },
    { href: 'weather.html', label: '天气', mark: '☀' },
    { href: 'news.html', label: '新闻', mark: '≡' },
    { href: 'moyu.html', label: '日历', mark: '▤' },
    { href: 'code-transfer.html', label: '代码', mark: '⌘' }
  ];
  var current = location.pathname.split('/').pop() || 'index.html';
  var root = document.querySelector('[data-site-navigation]');
  if (!root) return;
  root.innerHTML = '<div class="nav-wrap">' +
    '<a class="brand" href="./index.html" aria-label="日常信息台首页"><span class="brand-mark">今</span><span>日常信息台</span></a>' +
    '<span class="nav-caption">工作空间</span><nav class="main-nav" aria-label="主要导航">' +
    pages.map(function (page) {
      return '<a class="nav-link" href="./' + page.href + '"' + (current === page.href ? ' aria-current="page"' : '') + '><span class="nav-symbol" aria-hidden="true">' + page.mark + '</span><span>' + page.label + '</span></a>';
    }).join('') + '</nav><div class="nav-bottom"><span class="nav-signature">把日常，放在一起。</span><button class="theme-toggle" type="button" data-theme-toggle>深色</button></div></div>';
})();
