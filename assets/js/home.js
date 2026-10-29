(function () {
  'use strict';

  var desk = window.DailyDesk;

  function setPosterDate() {
    var now = new Date();
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    document.getElementById('poster-month').textContent = months[now.getMonth()];
    document.getElementById('poster-day').textContent = String(now.getDate()).padStart(2, '0');
    document.getElementById('poster-weekday').textContent = weekdays[now.getDay()];
    document.getElementById('poster-full-date').textContent = desk.formatDate(now);
  }

  function errorState(message, id) {
    return '<div class="state compact"><p>' + desk.escapeHtml(message) + '</p><button class="button secondary small" type="button" id="' + id + '">重新加载</button></div>';
  }

  async function loadWeather() {
    var root = document.getElementById('home-weather');
    var city = localStorage.getItem('daily-desk-city') || '郑州';
    try {
      var result = await desk.requestJson(desk.API.weather + encodeURIComponent(city), 'weather:' + city);
      var data = result.data;
      var weather = data.weather || {};
      var air = data.air_quality || {};
      var location = data.location || {};
      root.innerHTML = '<div class="panel-inner">' +
        '<div class="panel-top"><span class="panel-label">今日天气</span><a class="panel-link" href="./weather.html?city=' + encodeURIComponent(city) + '">查看详情</a></div>' +
        '<div class="weather-summary"><div><div class="weather-place">' + desk.escapeHtml(desk.displayLocation(location, city)) + '</div>' +
        '<div class="weather-temp">' + desk.escapeHtml(weather.temperature) + '°</div>' +
        '<div class="weather-condition">' + desk.escapeHtml(weather.condition || '天气实况') + '，' + desk.escapeHtml(weather.wind_direction || '') + desk.escapeHtml(weather.wind_power || '') + '级</div></div>' +
        '<div class="weather-glyph" role="img" aria-label="' + desk.escapeHtml(weather.condition || '天气') + '">' + desk.weatherGlyph(weather.condition) + '</div></div>' +
        '<div class="metric-strip"><div class="metric"><span>湿度</span><strong>' + desk.escapeHtml(weather.humidity) + '%</strong></div>' +
        '<div class="metric"><span>空气质量</span><strong>' + desk.escapeHtml(air.quality || '暂无') + '</strong></div>' +
        '<div class="metric"><span>降水</span><strong>' + desk.escapeHtml(weather.precipitation || 0) + ' mm</strong></div></div>' +
        (result.fromCache ? '<p class="data-note">' + desk.escapeHtml(desk.staleText(result)) + '</p>' : '') + '</div>';
    } catch (error) {
      root.innerHTML = '<div class="panel-inner"><div class="panel-top"><span class="panel-label">今日天气</span></div>' + errorState('天气加载失败，请稍后重试。', 'retry-home-weather') + '</div>';
      document.getElementById('retry-home-weather').addEventListener('click', loadWeather, { once: true });
    }
  }

  async function loadNews() {
    var root = document.getElementById('home-news');
    try {
      var result = await desk.requestJson(desk.API.news, 'news');
      var data = result.data;
      var items = Array.isArray(data.news) ? data.news.slice(0, 3) : [];
      var image = desk.safeImageUrl(data.image || data.cover);
      root.innerHTML = '<div class="panel-inner">' +
        '<div class="panel-top"><span class="panel-label">新闻 60 秒</span><a class="panel-link" href="./news.html">全部要闻</a></div>' +
        (image ? '<img class="news-preview-image" src="' + image + '" alt="今日新闻图片" loading="lazy">' : '') +
        '<ol class="headline-list">' + items.map(function (item, index) {
          return '<li class="headline-item"><span class="headline-number">' + String(index + 1).padStart(2, '0') + '</span><span>' + desk.escapeHtml(item) + '</span></li>';
        }).join('') + '</ol>' +
        (result.fromCache ? '<p class="data-note">' + desk.escapeHtml(desk.staleText(result)) + '</p>' : '') + '</div>';
    } catch (error) {
      root.innerHTML = '<div class="panel-inner"><div class="panel-top"><span class="panel-label">新闻 60 秒</span></div>' + errorState('新闻加载失败，请稍后重试。', 'retry-home-news') + '</div>';
      document.getElementById('retry-home-news').addEventListener('click', loadNews, { once: true });
    }
  }

  async function loadMoyu() {
    var root = document.getElementById('home-moyu');
    try {
      var result = await desk.requestJson(desk.API.moyu, 'moyu');
      var data = result.data;
      var countdown = data.countdown || {};
      root.innerHTML = '<div class="panel-inner">' +
        '<div class="panel-top"><span class="panel-label">摸鱼日历</span><a class="panel-link" href="./moyu.html">查看日历</a></div>' +
        '<div class="moyu-layout"><div class="moyu-countdown">' +
        '<div class="countdown-item"><strong>' + desk.escapeHtml(countdown.toFriday) + '</strong><span>天后到周五</span></div>' +
        '<div class="countdown-item"><strong>' + desk.escapeHtml(countdown.toWeekEnd) + '</strong><span>天后到周末</span></div>' +
        '<div class="countdown-item"><strong>' + desk.escapeHtml(countdown.toMonthEnd) + '</strong><span>天后到月底</span></div></div>' +
        '<blockquote class="quote">“' + desk.escapeHtml(data.moyuQuote || '认真工作，也要认真休息。') + '”</blockquote></div>' +
        (result.fromCache ? '<p class="data-note">' + desk.escapeHtml(desk.staleText(result)) + '</p>' : '') + '</div>';
    } catch (error) {
      root.innerHTML = '<div class="panel-inner"><div class="panel-top"><span class="panel-label">摸鱼日历</span></div>' + errorState('日历加载失败，请稍后重试。', 'retry-home-moyu') + '</div>';
      document.getElementById('retry-home-moyu').addEventListener('click', loadMoyu, { once: true });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    setPosterDate();
    loadWeather();
    loadNews();
    loadMoyu();
  });
})();
