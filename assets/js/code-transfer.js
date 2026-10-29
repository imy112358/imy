(function () {
  'use strict';

  var config = window.DailyDeskSupabase || {};
  var factory = window.supabase;
  var client = factory && config.url && config.publishableKey
    ? factory.createClient(config.url, config.publishableKey)
    : null;
  var snippets = [];
  var activeId = null;
  var dirty = false;
  var feedbackTimer;

  var list = document.getElementById('snippet-list');
  var total = document.getElementById('snippet-total');
  var search = document.getElementById('snippet-search');
  var titleInput = document.getElementById('snippet-title');
  var languageInput = document.getElementById('snippet-language');
  var codeInput = document.getElementById('code-input');
  var lineNumbers = document.getElementById('line-numbers');
  var lineCount = document.getElementById('line-count');
  var charCount = document.getElementById('char-count');
  var byteCount = document.getElementById('byte-count');
  var feedback = document.getElementById('code-feedback');
  var newButton = document.getElementById('new-snippet');
  var saveButton = document.getElementById('save-snippet');
  var deleteButton = document.getElementById('delete-snippet');
  var copyButton = document.getElementById('copy-code');

  function escapeHtml(value) {
    return window.DailyDesk.escapeHtml(value);
  }

  function formatUpdatedAt(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(value));
  }

  function setFeedback(message, tone, persistent) {
    clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedback.dataset.tone = tone || 'neutral';
    if (!persistent && tone === 'success') {
      feedbackTimer = setTimeout(function () {
        feedback.textContent = activeId ? '已与云端同步' : '尚未保存';
        feedback.dataset.tone = 'neutral';
      }, 1800);
    }
  }

  function renderStats() {
    var value = codeInput.value;
    var lines = value.length ? value.split('\n').length : 1;
    lineCount.textContent = lines;
    charCount.textContent = Array.from(value).length;
    byteCount.textContent = new TextEncoder().encode(value).length;
    lineNumbers.textContent = Array.from({ length: lines }, function (_, index) {
      return index + 1;
    }).join('\n');
  }

  function renderList() {
    var keyword = search.value.trim().toLowerCase();
    var filtered = snippets.filter(function (item) {
      return !keyword || item.title.toLowerCase().includes(keyword) || item.language.toLowerCase().includes(keyword);
    });
    total.textContent = snippets.length + ' 个代码页面';
    if (!filtered.length) {
      list.innerHTML = '<div class="snippet-list-state">' + (snippets.length ? '没有匹配的代码' : '还没有代码，点击“新建代码”开始') + '</div>';
      return;
    }
    list.innerHTML = filtered.map(function (item) {
      var active = item.id === activeId ? ' is-active' : '';
      return '<button class="snippet-item' + active + '" type="button" data-id="' + escapeHtml(item.id) + '">' +
        '<span class="snippet-item-title">' + escapeHtml(item.title) + '</span>' +
        '<span class="snippet-item-meta"><span>' + escapeHtml(item.language) + '</span><span>' + escapeHtml(formatUpdatedAt(item.updated_at)) + '</span></span>' +
        '</button>';
    }).join('');
  }

  function setDirty() {
    dirty = true;
    setFeedback(activeId ? '有未保存的修改' : '尚未保存', 'neutral', true);
  }

  function syncUrl(id) {
    var url = new URL(window.location.href);
    if (id) url.searchParams.set('id', id);
    else url.searchParams.delete('id');
    history.replaceState(null, '', url);
  }

  function openSnippet(id) {
    var item = snippets.find(function (snippet) { return snippet.id === id; });
    if (!item) return;
    activeId = item.id;
    titleInput.value = item.title;
    languageInput.value = item.language;
    codeInput.value = item.content;
    deleteButton.disabled = false;
    dirty = false;
    renderStats();
    renderList();
    setFeedback('已载入云端代码', 'success');
    syncUrl(item.id);
  }

  function createNew() {
    activeId = null;
    titleInput.value = '';
    languageInput.value = 'plaintext';
    codeInput.value = '';
    deleteButton.disabled = true;
    dirty = false;
    renderStats();
    renderList();
    setFeedback('新代码尚未保存', 'neutral', true);
    syncUrl(null);
    titleInput.focus();
  }

  async function loadSnippets() {
    if (!client) {
      list.innerHTML = '<div class="snippet-list-state error">云端配置加载失败</div>';
      setFeedback('无法连接云端数据库', 'error', true);
      return;
    }
    var result = await client.from('code_snippets')
      .select('id,title,language,content,created_at,updated_at')
      .order('updated_at', { ascending: false });
    if (result.error) {
      list.innerHTML = '<div class="snippet-list-state error">云端读取失败，请稍后刷新</div>';
      setFeedback('读取失败：' + result.error.message, 'error', true);
      return;
    }
    snippets = result.data || [];
    renderList();
    var requestedId = new URLSearchParams(window.location.search).get('id');
    if (requestedId && snippets.some(function (item) { return item.id === requestedId; })) openSnippet(requestedId);
    else if (snippets.length) openSnippet(snippets[0].id);
    else createNew();
  }

  async function saveSnippet() {
    var title = titleInput.value.trim();
    if (!title) {
      setFeedback('请填写代码标题', 'error', true);
      titleInput.focus();
      return;
    }
    if (!client) return;
    saveButton.disabled = true;
    saveButton.textContent = '正在保存';
    var payload = { title: title, language: languageInput.value, content: codeInput.value };
    var result = activeId
      ? await client.from('code_snippets').update(payload).eq('id', activeId).select().single()
      : await client.from('code_snippets').insert(payload).select().single();
    saveButton.disabled = false;
    saveButton.textContent = '保存到云端';
    if (result.error) {
      setFeedback('保存失败：' + result.error.message, 'error', true);
      return;
    }
    var saved = result.data;
    snippets = snippets.filter(function (item) { return item.id !== saved.id; });
    snippets.unshift(saved);
    activeId = saved.id;
    deleteButton.disabled = false;
    dirty = false;
    renderList();
    setFeedback('已保存到公共云端', 'success');
    syncUrl(saved.id);
  }

  async function deleteSnippet() {
    if (!activeId || !client) return;
    var current = snippets.find(function (item) { return item.id === activeId; });
    if (!window.confirm('确定删除“' + (current ? current.title : '这段代码') + '”吗？此操作无法撤销。')) return;
    deleteButton.disabled = true;
    var result = await client.from('code_snippets').delete().eq('id', activeId);
    if (result.error) {
      deleteButton.disabled = false;
      setFeedback('删除失败：' + result.error.message, 'error', true);
      return;
    }
    snippets = snippets.filter(function (item) { return item.id !== activeId; });
    setFeedback('代码已删除', 'success');
    if (snippets.length) openSnippet(snippets[0].id);
    else createNew();
  }

  async function copyCode() {
    if (!codeInput.value) {
      setFeedback('当前没有可复制的代码', 'error', true);
      return;
    }
    try {
      await navigator.clipboard.writeText(codeInput.value);
    } catch (_) {
      codeInput.focus();
      codeInput.select();
      document.execCommand('copy');
    }
    copyButton.textContent = '已复制';
    setFeedback('代码已原样复制', 'success');
    setTimeout(function () { copyButton.textContent = '复制代码'; }, 1600);
  }

  list.addEventListener('click', function (event) {
    var button = event.target.closest('[data-id]');
    if (button) openSnippet(button.dataset.id);
  });
  search.addEventListener('input', renderList);
  titleInput.addEventListener('input', setDirty);
  languageInput.addEventListener('change', setDirty);
  codeInput.addEventListener('input', function () { renderStats(); setDirty(); });
  codeInput.addEventListener('scroll', function () { lineNumbers.scrollTop = codeInput.scrollTop; });
  newButton.addEventListener('click', createNew);
  saveButton.addEventListener('click', saveSnippet);
  deleteButton.addEventListener('click', deleteSnippet);
  copyButton.addEventListener('click', copyCode);
  window.addEventListener('beforeunload', function (event) {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  renderStats();
  loadSnippets();
})();
