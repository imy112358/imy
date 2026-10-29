(function () {
  'use strict';

  var desk = window.DailyDesk;
  var content = document.getElementById('moyu-content');
  var refresh = document.getElementById('refresh-moyu');

  function loading() {
    content.innerHTML = '<article class="panel calendar-hero"><div class="state"><div class="skeleton skeleton-line short"></div><div class="skeleton" style="width:64%;height:100px"></div><div class="skeleton skeleton-line"></div></div></article>';
  }

  function renderError() {
    content.innerHTML = '<article class="panel calendar-hero"><div class="state"><h2>日历加载失败</h2><p>请检查网络连接后重试。</p><button class="button secondary" id="retry-moyu" type="button">重新加载</button></div></article>';
    document.getElementById('retry-moyu').addEventListener('click', load, { once: true });
  }

  function getStatus(today) {
    if (today.isHoliday) return today.holidayName || '假期中';
    if (today.isWorkday) return '工作日';
    return '休息日';
  }

  function holidayHtml(data) {
    if (data.currentHoliday) {
      return '<article class="stat-card holiday-card"><h3>正在放假：' + desk.escapeHtml(data.currentHoliday.name) + '</h3><p>还剩 ' + desk.escapeHtml(data.currentHoliday.until) + ' 天</p></article>';
    }
    if (data.nextHoliday) {
      return '<article class="stat-card holiday-card"><h3>下次假期：' + desk.escapeHtml(data.nextHoliday.name) + '</h3><p>还有 ' + desk.escapeHtml(data.nextHoliday.until) + ' 天，预计放假 ' + desk.escapeHtml(data.nextHoliday.duration) + ' 天</p></article>';
    }
    if (data.nextWeekend) {
      return '<article class="stat-card holiday-card"><h3>下一个周末</h3><p>' + desk.escapeHtml(data.nextWeekend.date) + '，还有 ' + desk.escapeHtml(data.nextWeekend.daysUntil) + ' 天</p></article>';
    }
    return '<article class="stat-card holiday-card"><h3>休息提醒</h3><p>暂时没有新的假期信息，先把今天过好。</p></article>';
  }

  function render(data, result) {
    var date = data.date || {};
    var lunar = date.lunar || {};
    var today = data.today || {};
    var progress = data.progress || {};
    var countdown = data.countdown || {};
    var week = progress.week || {};
    var month = progress.month || {};
    var year = progress.year || {};
    var note = desk.staleText(result);

    content.innerHTML = '<article class="panel calendar-hero reveal"><div class="calendar-header"><div>' +
      '<h2 class="calendar-date">' + desk.escapeHtml(date.gregorian || '') + '</h2>' +
      '<p class="calendar-lunar">' + desk.escapeHtml(date.weekday || '') + '，农历 ' + desk.escapeHtml(lunar.monthCN || '') + desk.escapeHtml(lunar.dayCN || '') + '</p></div>' +
      '<span class="status-badge">' + desk.escapeHtml(getStatus(today)) + '</span></div>' +
      '<div class="calendar-grid"><div class="calendar-primary">' +
      '<article class="stat-card featured"><span class="stat-label">距离周末</span><strong class="stat-value">' + desk.escapeHtml(countdown.toWeekEnd) + '</strong><p class="stat-note">天，先完成最重要的一件事</p></article>' +
      '<article class="stat-card"><span class="stat-label">距离周五</span><strong class="stat-value">' + desk.escapeHtml(countdown.toFriday) + ' 天</strong></article>' +
      '<article class="stat-card"><span class="stat-label">距离月底</span><strong class="stat-value">' + desk.escapeHtml(countdown.toMonthEnd) + ' 天</strong></article></div>' +
      '<div class="calendar-secondary">' + holidayHtml(data) +
      '<article class="stat-card holiday-card"><h3>距离年底</h3><p>还有 ' + desk.escapeHtml(countdown.toYearEnd) + ' 天</p></article></div></div>' +
      '<div class="progress-stats">' +
      '<div class="progress-stat"><strong>' + desk.escapeHtml(week.percentage) + '%</strong><span>本周已过去 ' + desk.escapeHtml(week.passed) + ' 天</span></div>' +
      '<div class="progress-stat"><strong>' + desk.escapeHtml(month.percentage) + '%</strong><span>本月还剩 ' + desk.escapeHtml(month.remaining) + ' 天</span></div>' +
      '<div class="progress-stat"><strong>' + desk.escapeHtml(year.percentage) + '%</strong><span>今年还剩 ' + desk.escapeHtml(year.remaining) + ' 天</span></div></div>' +
      (note ? '<p class="data-note">' + desk.escapeHtml(note) + '</p>' : '') + '</article>' +
      '<blockquote class="calendar-quote">“' + desk.escapeHtml(data.moyuQuote || '认真工作，也要认真休息。') + '”</blockquote>';
  }

  async function load() {
    loading();
    refresh.disabled = true;
    try {
      var result = await desk.requestJson(desk.API.moyu + '&t=' + Date.now(), 'moyu');
      render(result.data, result);
    } catch (error) {
      renderError();
    } finally {
      refresh.disabled = false;
    }
  }

  refresh.addEventListener('click', load);
  load();
})();
