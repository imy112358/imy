(function () {
  'use strict';

  var input = document.getElementById('code-input');
  var lineNumbers = document.getElementById('line-numbers');
  var lineCount = document.getElementById('line-count');
  var charCount = document.getElementById('char-count');
  var byteCount = document.getElementById('byte-count');
  var feedback = document.getElementById('code-feedback');
  var copyButton = document.getElementById('copy-code');
  var pasteButton = document.getElementById('paste-code');
  var clearButton = document.getElementById('clear-code');
  var downloadButton = document.getElementById('download-code');
  var feedbackTimer;

  function getLineTotal(value) {
    return value.length ? value.split('\n').length : 1;
  }

  function renderStats() {
    var value = input.value;
    var lines = getLineTotal(value);
    lineCount.textContent = lines;
    charCount.textContent = Array.from(value).length;
    byteCount.textContent = new TextEncoder().encode(value).length;
    lineNumbers.textContent = Array.from({ length: lines }, function (_, index) {
      return index + 1;
    }).join('\n');
  }

  function setFeedback(message, tone) {
    clearTimeout(feedbackTimer);
    feedback.textContent = message;
    feedback.dataset.tone = tone || 'neutral';
    if (tone === 'success') {
      feedbackTimer = setTimeout(function () {
        feedback.textContent = input.value ? '内容保持原样' : '等待粘贴';
        feedback.dataset.tone = 'neutral';
      }, 1800);
    }
  }

  async function writeClipboard(value) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return;
    }
    input.focus();
    input.select();
    if (!document.execCommand('copy')) throw new Error('复制失败');
    input.setSelectionRange(value.length, value.length);
  }

  async function copyCode() {
    var value = input.value;
    if (!value) {
      setFeedback('请先粘贴代码', 'error');
      input.focus();
      return;
    }
    try {
      await writeClipboard(value);
      copyButton.textContent = '已复制';
      setFeedback('已按原内容复制', 'success');
      setTimeout(function () { copyButton.textContent = '复制代码'; }, 1800);
    } catch (_) {
      setFeedback('浏览器未允许复制，请手动选择代码', 'error');
    }
  }

  async function pasteCode() {
    if (!navigator.clipboard || !window.isSecureContext) {
      setFeedback('请直接在编辑区按 Command + V 粘贴', 'error');
      input.focus();
      return;
    }
    try {
      input.value = await navigator.clipboard.readText();
      renderStats();
      setFeedback('已原样读取剪贴板文本', 'success');
      input.focus();
    } catch (_) {
      setFeedback('未获得剪贴板权限，请手动粘贴', 'error');
      input.focus();
    }
  }

  function clearCode() {
    if (!input.value) return;
    input.value = '';
    renderStats();
    setFeedback('内容已清空', 'neutral');
    input.focus();
  }

  function downloadCode() {
    var value = input.value;
    if (!value) {
      setFeedback('请先粘贴代码', 'error');
      input.focus();
      return;
    }
    var blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'code-snippet.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setFeedback('已下载原始文本', 'success');
  }

  input.addEventListener('input', renderStats);
  input.addEventListener('scroll', function () {
    lineNumbers.scrollTop = input.scrollTop;
  });
  input.addEventListener('keydown', function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      copyCode();
    }
  });
  copyButton.addEventListener('click', copyCode);
  pasteButton.addEventListener('click', pasteCode);
  clearButton.addEventListener('click', clearCode);
  downloadButton.addEventListener('click', downloadCode);

  renderStats();
})();
