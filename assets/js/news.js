(function () {
  'use strict';

  var desk = window.DailyDesk;
  var content = document.getElementById('news-content');
  var refresh = document.getElementById('refresh-news');
  var copy = document.getElementById('copy-news');
  var currentData = null;

  function loading() {
    content.innerHTML = '<article class="panel feature-card"><div class="state"><div class="skeleton skeleton-block"></div><div class="skeleton skeleton-line"></div><div class="skeleton skeleton-line"></div></div></article>';
  }

  function renderError() {
    content.innerHTML = '<article class="panel feature-card"><div class="state"><h2>新闻加载失败</h2><p>请检查网络连接后重新加载。</p><button class="button secondary" id="retry-news" type="button">重新加载</button></div></article>';
    document.getElementById('retry-news').addEventListener('click', load, { once: true });
  }

  function render(data, result) {
    var news = Array.isArray(data.news) ? data.news : [];
    var image = desk.safeImageUrl(data.image || data.cover);
    var note = desk.staleText(result);
    content.innerHTML = '<article class="panel news-feature reveal"><div class="news-feature-copy"><div>' +
      '<div class="news-date">' + desk.escapeHtml(data.date || desk.formatDate(new Date())) + '</div>' +
      '<h2>每天 60 秒，读完重要消息</h2><p class="daily-tip">' + desk.escapeHtml(data.tip || '保持判断，也给自己留一点安静。') + '</p></div>' +
      '<p class="data-note">共 ' + news.length + ' 条要闻' + (note ? '，' + desk.escapeHtml(note) : '') + '</p></div>' +
      '<div class="news-feature-media">' + (image ? '<img src="' + image + '" alt="今日新闻长图" loading="eager">' : '<div class="state"><p>今日新闻图片暂不可用</p></div>') + '</div></article>' +
      '<ol class="news-list">' + news.map(function (item) {
        return '<li class="news-item"><p>' + desk.escapeHtml(item) + '</p></li>';
      }).join('') + '</ol>';
  }

  async function load() {
    loading();
    refresh.disabled = true;
    try {
      var result = await desk.requestJson(desk.API.news + '?t=' + Date.now(), 'news');
      currentData = result.data;
      render(result.data, result);
    } catch (error) {
      renderError();
    } finally {
      refresh.disabled = false;
    }
  }

  async function copyText() {
    if (!currentData || !Array.isArray(currentData.news)) return;
    var text = (currentData.date || '') + ' 新闻 60 秒\n\n' + currentData.news.map(function (item, index) {
      return (index + 1) + '. ' + item;
    }).join('\n') + (currentData.tip ? '\n\n今日寄语：' + currentData.tip : '');
    try {
      await navigator.clipboard.writeText(text);
      copy.textContent = '已复制';
    } catch (_) {
      var area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      copy.textContent = '已复制';
    }
    setTimeout(function () { copy.textContent = '复制文案'; }, 1600);
  }

  refresh.addEventListener('click', load);
  copy.addEventListener('click', copyText);
  load();
})();
