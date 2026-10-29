(function () {
  'use strict';

  var API = {
    news: 'https://60s-api.viki.moe/v2/60s',
    weather: 'https://60s.viki.moe/v2/weather?query=',
    moyu: 'https://60s.viki.moe/v2/moyu?encoding=json'
  };

  function getPreferredTheme() {
    var saved = localStorage.getItem('daily-desk-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    var button = document.querySelector('[data-theme-toggle]');
    if (button) {
      button.textContent = theme === 'dark' ? '浅色' : '深色';
      button.setAttribute('aria-label', theme === 'dark' ? '切换到浅色模式' : '切换到深色模式');
    }
  }

  function initTheme() {
    applyTheme(getPreferredTheme());
    var button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    button.addEventListener('click', function () {
      var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('daily-desk-theme', next);
      applyTheme(next);
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeImageUrl(value) {
    try {
      var url = new URL(value, window.location.href);
      return url.protocol === 'https:' ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function cacheGet(key) {
    try {
      var raw = localStorage.getItem('daily-desk-cache:' + key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function cacheSet(key, data) {
    try {
      localStorage.setItem('daily-desk-cache:' + key, JSON.stringify({ savedAt: Date.now(), data: data }));
    } catch (_) {}
  }

  async function requestJson(url, cacheKey) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 12000);
    try {
      var response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error('请求失败，状态码 ' + response.status);
      var payload = await response.json();
      if (payload.code !== 200 || !payload.data) throw new Error(payload.message || '数据格式异常');
      cacheSet(cacheKey, payload.data);
      return { data: payload.data, fromCache: false, savedAt: Date.now() };
    } catch (error) {
      var cached = cacheGet(cacheKey);
      if (cached && cached.data) {
        return { data: cached.data, fromCache: true, savedAt: cached.savedAt };
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function setYear() {
    document.querySelectorAll('[data-current-year]').forEach(function (node) {
      node.textContent = new Date().getFullYear();
    });
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
    }).format(date || new Date());
  }

  function staleText(result) {
    if (!result.fromCache) return '';
    return '网络不可用，显示 ' + new Date(result.savedAt).toLocaleString('zh-CN') + ' 的缓存数据';
  }

  function weatherGlyph(condition) {
    var text = String(condition || '');
    if (/雷/.test(text)) return 'ϟ';
    if (/雪|冰雹/.test(text)) return '❄';
    if (/雨/.test(text)) return '☂';
    if (/雾|霾|沙|尘/.test(text)) return '≋';
    if (/阴/.test(text)) return '●';
    if (/云/.test(text)) return '☁';
    return '☀';
  }

  function displayLocation(location, fallback) {
    var name = String(location && location.name || fallback || '');
    var repeated = name.match(/^(.{2,4})\1$/);
    return repeated ? repeated[1] : name;
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    setYear();
  });

  window.DailyDesk = {
    API: API,
    escapeHtml: escapeHtml,
    safeImageUrl: safeImageUrl,
    requestJson: requestJson,
    formatDate: formatDate,
    staleText: staleText,
    weatherGlyph: weatherGlyph,
    displayLocation: displayLocation
  };
})();
