(function () {
  'use strict';

  var desk = window.DailyDesk;
  var content = document.getElementById('weather-content');
  var form = document.getElementById('city-form');
  var input = document.getElementById('city-input');

  function getCity() {
    var query = new URLSearchParams(window.location.search).get('city');
    return (query || localStorage.getItem('daily-desk-city') || '郑州').trim();
  }

  function loading() {
    content.innerHTML = '<article class="panel feature-card"><div class="state"><div class="skeleton skeleton-line short"></div><div class="skeleton" style="width:52%;height:120px"></div><div class="skeleton skeleton-line"></div></div></article>';
  }

  function renderError(city) {
    content.innerHTML = '<article class="panel feature-card"><div class="state"><h2>没有拿到天气数据</h2><p>请检查城市名称或网络连接。</p><button class="button secondary" id="retry-weather" type="button">重新查询</button></div></article>';
    document.getElementById('retry-weather').addEventListener('click', function () { load(city); }, { once: true });
  }

  function airTone(level) {
    if (level <= 1) return 'var(--good)';
    if (level <= 3) return 'var(--warn)';
    return 'var(--danger)';
  }

  function render(data, result, city) {
    var location = data.location || {};
    var weather = data.weather || {};
    var air = data.air_quality || {};
    var sun = data.sunrise || {};
    var life = Array.isArray(data.life_indices) ? data.life_indices.slice(0, 6) : [];
    var alerts = Array.isArray(data.alerts) ? data.alerts : [];
    var note = desk.staleText(result);

    var lifeHtml = life.length ? '<article class="panel feature-card life-panel"><h2 class="panel-title">生活建议</h2><ul class="life-list">' + life.map(function (item) {
      return '<li class="life-item"><h3>' + desk.escapeHtml(item.name) + '</h3><div class="life-level">' + desk.escapeHtml(item.level) + '</div><p>' + desk.escapeHtml(item.description) + '</p></li>';
    }).join('') + '</ul></article>' : '';

    var alertHtml = alerts.length ? '<article class="panel feature-card alert-panel"><h2 class="panel-title">天气提醒</h2>' + alerts.map(function (item) {
      return '<p>' + desk.escapeHtml(item.title || item.description || item) + '</p>';
    }).join('') + '</article>' : '';

    content.innerHTML = '<article class="panel feature-card reveal"><div class="weather-main"><div>' +
      '<div class="weather-place">' + desk.escapeHtml(desk.displayLocation(location, city)) + '</div>' +
      '<div class="weather-temp">' + desk.escapeHtml(weather.temperature) + '°</div>' +
      '<div class="weather-condition">' + desk.escapeHtml(weather.condition || '') + '，体感舒适度请结合风力与湿度判断</div></div>' +
      '<div class="weather-side"><div class="weather-glyph" role="img" aria-label="' + desk.escapeHtml(weather.condition || '天气') + '">' + desk.weatherGlyph(weather.condition) + '</div>' +
      '<div class="weather-updated">更新于 ' + desk.escapeHtml(weather.updated || '刚刚') + '</div></div></div>' +
      '<div class="metric-strip"><div class="metric"><span>湿度</span><strong>' + desk.escapeHtml(weather.humidity) + '%</strong></div>' +
      '<div class="metric"><span>风力</span><strong>' + desk.escapeHtml(weather.wind_direction || '') + ' ' + desk.escapeHtml(weather.wind_power || '') + '级</strong></div>' +
      '<div class="metric"><span>气压</span><strong>' + desk.escapeHtml(weather.pressure) + ' hPa</strong></div></div>' +
      (note ? '<p class="data-note">' + desk.escapeHtml(note) + '</p>' : '') + '</article>' +
      '<div class="detail-grid">' +
      '<article class="panel feature-card air-panel"><h2 class="panel-title">空气质量</h2><div class="air-score"><strong>' + desk.escapeHtml(air.aqi) + '</strong><span class="air-quality" style="color:' + airTone(Number(air.level || 1)) + '">' + desk.escapeHtml(air.quality || '暂无') + '</span></div>' +
      '<div class="air-grid">' +
      '<div class="air-item"><span class="stat-label">PM2.5</span><strong class="stat-value">' + desk.escapeHtml(air.pm25) + '</strong></div>' +
      '<div class="air-item"><span class="stat-label">PM10</span><strong class="stat-value">' + desk.escapeHtml(air.pm10) + '</strong></div>' +
      '<div class="air-item"><span class="stat-label">城市排名</span><strong class="stat-value">' + desk.escapeHtml(air.rank || '暂无') + '</strong></div></div></article>' +
      '<article class="panel feature-card sun-panel"><h2 class="panel-title">日出日落</h2><div class="sun-times">' +
      '<div class="sun-time"><span>日出</span><strong>' + desk.escapeHtml(sun.sunrise_desc || '--:--') + '</strong></div>' +
      '<div class="sun-time"><span>日落</span><strong>' + desk.escapeHtml(sun.sunset_desc || '--:--') + '</strong></div></div>' +
      '<p class="data-note">降水量 ' + desk.escapeHtml(weather.precipitation || 0) + ' mm</p></article>' + lifeHtml + alertHtml + '</div>';
  }

  async function load(city) {
    city = String(city || '').trim() || '郑州';
    loading();
    input.value = city;
    try {
      var result = await desk.requestJson(desk.API.weather + encodeURIComponent(city), 'weather:' + city);
      localStorage.setItem('daily-desk-city', city);
      var nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('city', city);
      history.replaceState(null, '', nextUrl);
      render(result.data, result, city);
    } catch (error) {
      renderError(city);
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    load(input.value);
  });

  load(getCity());
})();
